"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NODE_TYPE_COLORS, type NodeType } from "@/lib/types/graph";
import {
  calculateNodeRadius,
  drawArrowhead,
  drawStatusBadge,
  applyHoverGlow,
  clearGlow,
  shouldShowLabel,
  shouldShowEdgeLabel,
  groupParallelEdges,
  getCurveControlPoint,
} from "@/lib/graph/rendering-utils";
import {
  calculateBoundingBox,
  calculateFitToView,
  getLayerYFraction,
  easeOutCubic,
} from "@/lib/graph/layout-utils";
import { GraphControls } from "./GraphControls";
import { GraphTooltip } from "./GraphTooltip";
import { GraphContextMenu } from "./GraphContextMenu";

interface GraphNode {
  id: string;
  name: string;
  nodeType: NodeType;
  layer: string;
  status: string;
}

interface GraphRelationship {
  id: string;
  type: string;
  source_id: string;
  target_id: string;
}

interface GraphExplorerProps {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  onNodeClick?: (nodeId: string) => void;
  onNodeSelect?: (nodeId: string) => void;
  selectedNodeId?: string;
}

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
  degree: number;
  radius: number;
  hovered: boolean;
  highlighted: boolean;
}

// Module-level cache survives component remounts (page navigations)
const layoutCache = {
  nodes: [] as PositionedNode[],
  pan: { x: 0, y: 0 },
  zoom: 1,
  nodeIdStr: "",
  settled: false,
};

export function GraphExplorer({
  nodes,
  relationships,
  onNodeClick,
  onNodeSelect,
  selectedNodeId,
}: GraphExplorerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<PositionedNode[]>(layoutCache.nodes);
  const panRef = useRef(layoutCache.pan);
  const zoomRef = useRef(layoutCache.zoom);
  const draggingRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const selectedRef = useRef<string | undefined>(selectedNodeId);
  const iterationRef = useRef(layoutCache.settled ? 300 : 0);
  const hoveredNodeRef = useRef<string | null>(null);
  const canvasSizeRef = useRef({ width: 800, height: 600 });
  const animatingRef = useRef(false);
  const animStartRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const animTargetRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const animProgressRef = useRef(0);
  const mouseScreenRef = useRef({ x: 0, y: 0 });

  // React state for overlays (tooltip, context menu)
  const [tooltipData, setTooltipData] = useState<{
    name: string;
    nodeType: NodeType;
    status: string;
    degree: number;
  } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    nodeName: string;
    pinned: boolean;
    x: number;
    y: number;
  } | null>(null);

  // Keep selectedRef in sync
  selectedRef.current = selectedNodeId;

  // Compute node degrees when relationships change
  const degreesRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const degrees = new Map<string, number>();
    for (const rel of relationships) {
      degrees.set(rel.source_id, (degrees.get(rel.source_id) || 0) + 1);
      degrees.set(rel.target_id, (degrees.get(rel.target_id) || 0) + 1);
    }
    degreesRef.current = degrees;
    // Update node radii
    for (const n of nodesRef.current) {
      n.degree = degrees.get(n.id) || 0;
      n.radius = calculateNodeRadius(n.degree);
    }
  }, [relationships]);

  // Build adjacency set for highlight computation
  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map());
  useEffect(() => {
    const adj = new Map<string, Set<string>>();
    for (const rel of relationships) {
      if (!adj.has(rel.source_id)) adj.set(rel.source_id, new Set());
      if (!adj.has(rel.target_id)) adj.set(rel.target_id, new Set());
      adj.get(rel.source_id)!.add(rel.target_id);
      adj.get(rel.target_id)!.add(rel.source_id);
    }
    adjacencyRef.current = adj;
  }, [relationships]);

  // Escape key clears selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedRef.current) {
        onNodeSelect?.(selectedRef.current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNodeSelect]);

  // Save layout to cache on unmount
  useEffect(() => {
    return () => {
      layoutCache.nodes = nodesRef.current;
      layoutCache.pan = panRef.current;
      layoutCache.zoom = zoomRef.current;
      layoutCache.settled = iterationRef.current >= 300;
    };
  }, []);

  // Initialize/update node positions only when the set of node IDs changes
  useEffect(() => {
    const newIdStr = nodes.map((n) => n.id).sort().join(",");

    // If same nodes and we have cached positions, restore from cache
    if (newIdStr === layoutCache.nodeIdStr && layoutCache.nodes.length > 0) {
      nodesRef.current = layoutCache.nodes;
      panRef.current = layoutCache.pan;
      zoomRef.current = layoutCache.zoom;
      iterationRef.current = layoutCache.settled ? 300 : iterationRef.current;
      return;
    }

    layoutCache.nodeIdStr = newIdStr;

    const canvas = canvasRef.current;
    const cw = canvas ? canvas.getBoundingClientRect().width : 800;
    const ch = canvas ? canvas.getBoundingClientRect().height : 600;

    const existingMap = new Map(nodesRef.current.map((n) => [n.id, n]));
    const degrees = degreesRef.current;

    // Group nodes by layer for initial positioning
    const layerGroups: Record<string, number[]> = {};
    nodes.forEach((node, i) => {
      const layer = node.layer;
      if (!layerGroups[layer]) layerGroups[layer] = [];
      layerGroups[layer].push(i);
    });

    nodesRef.current = nodes.map((node, i) => {
      const existing = existingMap.get(node.id);
      if (existing) {
        const degree = degrees.get(node.id) || 0;
        return { ...existing, ...node, degree, radius: calculateNodeRadius(degree) };
      }

      // Layer-aware initial positioning
      const layerY = getLayerYFraction(node.layer);
      const layerIndices = layerGroups[node.layer] || [i];
      const posInLayer = layerIndices.indexOf(i);
      const countInLayer = layerIndices.length;
      const spreadX = Math.min(cw * 0.7, countInLayer * 80);
      const xOffset = (posInLayer - (countInLayer - 1) / 2) * (spreadX / Math.max(countInLayer - 1, 1));

      const degree = degrees.get(node.id) || 0;

      return {
        ...node,
        x: cw / 2 + xOffset + (Math.random() - 0.5) * 30,
        y: ch * layerY + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        pinned: false,
        degree,
        radius: calculateNodeRadius(degree),
        hovered: false,
        highlighted: false,
      };
    });
    iterationRef.current = 0;
  }, [nodes]);

  // Main animation loop: simulate + draw
  useEffect(() => {
    let running = true;

    const tick = () => {
      if (!running) return;

      const positioned = nodesRef.current;
      if (positioned.length > 0 && iterationRef.current < 300) {
        iterationRef.current++;
        simulate(positioned, relationships, draggingRef.current);
      }

      // Handle fit-to-view animation
      if (animatingRef.current) {
        animProgressRef.current += 1 / 18; // ~300ms at 60fps
        if (animProgressRef.current >= 1) {
          animProgressRef.current = 1;
          animatingRef.current = false;
        }
        const t = easeOutCubic(animProgressRef.current);
        const s = animStartRef.current;
        const e = animTargetRef.current;
        zoomRef.current = s.zoom + (e.zoom - s.zoom) * t;
        panRef.current = {
          x: s.panX + (e.panX - s.panX) * t,
          y: s.panY + (e.panY - s.panY) * t,
        };
      }

      // Update highlight state
      const selId = selectedRef.current;
      const adj = adjacencyRef.current;
      for (const n of positioned) {
        if (selId) {
          n.highlighted = n.id === selId || (adj.get(selId)?.has(n.id) ?? false);
        } else {
          n.highlighted = true; // No selection = all highlighted (no dimming)
        }
      }

      draw();
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationships]);

  function simulate(
    simNodes: PositionedNode[],
    rels: GraphRelationship[],
    draggingId: string | null
  ) {
    const repulsion = 5000;
    const k = 0.01;
    const damping = 0.85;
    const cx = canvasSizeRef.current.width / 2;
    const cy = canvasSizeRef.current.height / 2;

    // Repulsion
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const dx = simNodes[j].x - simNodes[i].x;
        const dy = simNodes[j].y - simNodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        simNodes[i].vx -= fx;
        simNodes[i].vy -= fy;
        simNodes[j].vx += fx;
        simNodes[j].vy += fy;
      }
    }

    // Attraction along edges
    const idx = new Map(simNodes.map((n, i) => [n.id, i]));
    for (const rel of rels) {
      const si = idx.get(rel.source_id);
      const ti = idx.get(rel.target_id);
      if (si === undefined || ti === undefined) continue;
      const dx = simNodes[ti].x - simNodes[si].x;
      const dy = simNodes[ti].y - simNodes[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = k * (dist - 150);
      const fx = (dx / Math.max(dist, 1)) * force;
      const fy = (dy / Math.max(dist, 1)) * force;
      simNodes[si].vx += fx;
      simNodes[si].vy += fy;
      simNodes[ti].vx -= fx;
      simNodes[ti].vy -= fy;
    }

    // Dynamic center gravity
    for (const n of simNodes) {
      n.vx += (cx - n.x) * 0.001;
      n.vy += (cy - n.y) * 0.001;
    }

    // Apply velocity
    for (const n of simNodes) {
      if (n.id === draggingId || n.pinned) continue;
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    canvasSizeRef.current = { width: rect.width, height: rect.height };

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    const zoom = zoomRef.current;
    const positioned = nodesRef.current;
    const nodeMap = new Map(positioned.map((n) => [n.id, n]));
    const selId = selectedRef.current;
    const hovId = hoveredNodeRef.current;
    const hasSelection = !!selId;

    // Pre-compute parallel edge groups
    const edgeGroups = groupParallelEdges(relationships);

    // Draw edges
    for (const group of edgeGroups) {
      for (let ei = 0; ei < group.edges.length; ei++) {
        const rel = group.edges[ei];
        const source = nodeMap.get(rel.source_id);
        const target = nodeMap.get(rel.target_id);
        if (!source || !target) continue;

        const isEdgeHighlighted = !hasSelection ||
          (source.highlighted && target.highlighted);
        const isEdgeHovered = hovId === rel.source_id || hovId === rel.target_id;

        ctx.globalAlpha = hasSelection && !isEdgeHighlighted ? 0.15 : 1;
        ctx.lineWidth = isEdgeHovered ? 2 : 1;
        ctx.strokeStyle = isEdgeHighlighted ? "#94a3b8" : "#cbd5e1";

        const cp = getCurveControlPoint(
          source.x, source.y, target.x, target.y,
          ei, group.edges.length
        );

        ctx.beginPath();
        if (cp) {
          ctx.moveTo(source.x, source.y);
          ctx.quadraticCurveTo(cp.cx, cp.cy, target.x, target.y);
        } else {
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
        }
        ctx.stroke();

        // Arrow at target endpoint (offset by target radius)
        const targetR = target.radius;
        let arrowAngle: number;
        let arrowX: number;
        let arrowY: number;

        if (cp) {
          // For curves, compute tangent at the endpoint
          // Derivative of quadratic bezier at t=1: 2*(P2 - CP)
          const tdx = target.x - cp.cx;
          const tdy = target.y - cp.cy;
          arrowAngle = Math.atan2(tdy, tdx);
        } else {
          arrowAngle = Math.atan2(target.y - source.y, target.x - source.x);
        }
        arrowX = target.x - Math.cos(arrowAngle) * (targetR + 2);
        arrowY = target.y - Math.sin(arrowAngle) * (targetR + 2);

        drawArrowhead(ctx, arrowX, arrowY, arrowAngle, 7, isEdgeHighlighted ? "#64748b" : "#cbd5e1");

        // Edge label (only on hover or high zoom)
        if ((isEdgeHovered || shouldShowEdgeLabel(zoom)) && isEdgeHighlighted) {
          const labelX = cp ? (source.x + 2 * cp.cx + target.x) / 4 : (source.x + target.x) / 2;
          const labelY = cp ? (source.y + 2 * cp.cy + target.y) / 4 : (source.y + target.y) / 2;
          ctx.font = "9px sans-serif";
          ctx.fillStyle = "#64748b";
          ctx.textAlign = "center";
          ctx.globalAlpha = hasSelection && !isEdgeHighlighted ? 0.15 : 0.8;
          ctx.fillText(rel.type, labelX, labelY - 6);
        }
      }
    }

    ctx.globalAlpha = 1;

    // Draw nodes
    for (const node of positioned) {
      const r = node.radius;
      const color = NODE_TYPE_COLORS[node.nodeType] || "#6b7280";
      const isSelected = node.id === selId;
      const isHovered = node.id === hovId;
      const dimmed = hasSelection && !node.highlighted;

      ctx.globalAlpha = dimmed ? 0.2 : 1;

      // Hover glow
      if (isHovered && !dimmed) {
        applyHoverGlow(ctx, color);
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      clearGlow(ctx);

      // Selected ring
      if (isSelected) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Hover ring (when not selected)
      if (isHovered && !isSelected && !dimmed) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = dimmed ? 0.2 : 0.5;
        ctx.stroke();
        ctx.globalAlpha = dimmed ? 0.2 : 1;
      }

      // Status badge
      if (!dimmed) {
        drawStatusBadge(ctx, node.x, node.y, r, node.status);
      }

      // Pin indicator
      if (node.pinned && !dimmed) {
        ctx.beginPath();
        ctx.arc(node.x, node.y + r + 4, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#64748b";
        ctx.fill();
      }

      // Labels (LOD)
      if (shouldShowLabel(zoom) && !dimmed) {
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + r + 14);

        ctx.font = "9px sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText(node.nodeType, node.x, node.y + r + 26);
      } else if (!dimmed && isHovered) {
        // Always show label on hover even at low zoom
        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + r + 14);
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: screenX, y: screenY };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (screenX - rect.left - panRef.current.x) / zoomRef.current,
        y: (screenY - rect.top - panRef.current.y) / zoomRef.current,
      };
    },
    []
  );

  const findNodeAt = useCallback(
    (screenX: number, screenY: number) => {
      const world = screenToWorld(screenX, screenY);
      return nodesRef.current.find((n) => {
        const dx = n.x - world.x;
        const dy = n.y - world.y;
        return Math.sqrt(dx * dx + dy * dy) < n.radius;
      });
    },
    [screenToWorld]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) return; // Skip right-click
      setContextMenu(null);
      const clicked = findNodeAt(e.clientX, e.clientY);
      if (clicked) {
        draggingRef.current = clicked.id;
        const world = screenToWorld(e.clientX, e.clientY);
        dragOffsetRef.current = { x: clicked.x - world.x, y: clicked.y - world.y };
        didDragRef.current = false;
      } else {
        isPanningRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [findNodeAt, screenToWorld]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      mouseScreenRef.current = {
        x: rect ? e.clientX - rect.left : e.clientX,
        y: rect ? e.clientY - rect.top : e.clientY,
      };

      if (draggingRef.current) {
        didDragRef.current = true;
        const world = screenToWorld(e.clientX, e.clientY);
        const node = nodesRef.current.find((n) => n.id === draggingRef.current);
        if (node) {
          node.x = world.x + dragOffsetRef.current.x;
          node.y = world.y + dragOffsetRef.current.y;
          node.vx = 0;
          node.vy = 0;
        }
      } else if (isPanningRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        panRef.current = {
          x: panRef.current.x + dx,
          y: panRef.current.y + dy,
        };
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }

      // Hover tracking (update ref, not state — React tooltip updates throttled below)
      const hovered = findNodeAt(e.clientX, e.clientY);
      const prevHovered = hoveredNodeRef.current;
      hoveredNodeRef.current = hovered?.id || null;

      // Update cursor
      if (canvas) {
        if (draggingRef.current || isPanningRef.current) {
          canvas.style.cursor = "grabbing";
        } else if (hovered) {
          canvas.style.cursor = "pointer";
        } else {
          canvas.style.cursor = "grab";
        }
      }

      // Update hovered flags on nodes (for canvas rendering)
      if (prevHovered !== hoveredNodeRef.current) {
        for (const n of nodesRef.current) {
          n.hovered = n.id === hoveredNodeRef.current;
        }
      }

      // Tooltip React state (throttled by checking if changed)
      if (hovered && hovered.id !== prevHovered) {
        setTooltipData({
          name: hovered.name,
          nodeType: hovered.nodeType,
          status: hovered.status,
          degree: hovered.degree,
        });
        setTooltipPos(mouseScreenRef.current);
      } else if (hovered) {
        setTooltipPos(mouseScreenRef.current);
      } else if (!hovered && prevHovered) {
        setTooltipData(null);
      }
    },
    [findNodeAt, screenToWorld]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingRef.current && !didDragRef.current) {
      onNodeSelect?.(draggingRef.current);
    }
    if (draggingRef.current) {
      const node = nodesRef.current.find((n) => n.id === draggingRef.current);
      if (node && didDragRef.current) {
        node.pinned = true;
      }
    }
    draggingRef.current = null;
    isPanningRef.current = false;

    // Reset cursor
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = hoveredNodeRef.current ? "pointer" : "grab";
    }
  }, [onNodeSelect]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const clicked = findNodeAt(e.clientX, e.clientY);
      if (clicked) {
        onNodeClick?.(clicked.id);
      } else {
        // Double-click empty space: reset layout
        handleResetLayout();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [findNodeAt, onNodeClick]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // World position under cursor before zoom
    const worldX = (mouseX - panRef.current.x) / zoomRef.current;
    const worldY = (mouseY - panRef.current.y) / zoomRef.current;

    const oldZoom = zoomRef.current;
    const newZoom = Math.min(3, Math.max(0.2, oldZoom - e.deltaY * 0.001));
    zoomRef.current = newZoom;

    // Adjust pan to keep the world point under the cursor
    panRef.current = {
      x: mouseX - worldX * newZoom,
      y: mouseY - worldY * newZoom,
    };
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const clicked = findNodeAt(e.clientX, e.clientY);
      if (clicked) {
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect();
        setContextMenu({
          nodeId: clicked.id,
          nodeName: clicked.name,
          pinned: clicked.pinned,
          x: rect ? e.clientX - rect.left : e.clientX,
          y: rect ? e.clientY - rect.top : e.clientY,
        });
      } else {
        setContextMenu(null);
      }
    },
    [findNodeAt]
  );

  // -- Control handlers --

  const handleZoomIn = useCallback(() => {
    zoomRef.current = Math.min(3, zoomRef.current * 1.2);
  }, []);

  const handleZoomOut = useCallback(() => {
    zoomRef.current = Math.max(0.2, zoomRef.current / 1.2);
  }, []);

  const handleFitToView = useCallback(() => {
    const bbox = calculateBoundingBox(nodesRef.current);
    const { width, height } = canvasSizeRef.current;
    const target = calculateFitToView(bbox, width, height);

    animStartRef.current = { zoom: zoomRef.current, panX: panRef.current.x, panY: panRef.current.y };
    animTargetRef.current = { zoom: target.zoom, panX: target.panX, panY: target.panY };
    animProgressRef.current = 0;
    animatingRef.current = true;
  }, []);

  const handleResetLayout = useCallback(() => {
    for (const n of nodesRef.current) {
      n.pinned = false;
    }
    iterationRef.current = 0;
  }, []);

  const handleTogglePin = useCallback((nodeId: string) => {
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      node.pinned = !node.pinned;
      if (!node.pinned) {
        // Restart simulation a bit when unpinning
        iterationRef.current = Math.min(iterationRef.current, 200);
      }
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={(e) => {
          handleMouseUp();
          hoveredNodeRef.current = null;
          for (const n of nodesRef.current) n.hovered = false;
          setTooltipData(null);
          // Suppress unused param warning
          void e;
        }}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
      <GraphTooltip data={tooltipData} x={tooltipPos.x} y={tooltipPos.y} />
      <GraphContextMenu
        data={contextMenu}
        onClose={() => setContextMenu(null)}
        onTogglePin={handleTogglePin}
      />
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToView={handleFitToView}
        onResetLayout={handleResetLayout}
      />
    </div>
  );
}
