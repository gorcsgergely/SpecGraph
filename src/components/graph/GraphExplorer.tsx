"use client";

import { useCallback, useEffect, useRef } from "react";
import { NODE_TYPE_COLORS, type NodeType } from "@/lib/types/graph";

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

  // Keep selectedRef in sync
  selectedRef.current = selectedNodeId;

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

    const existingMap = new Map(nodesRef.current.map((n) => [n.id, n]));
    nodesRef.current = nodes.map((node, i) => {
      const existing = existingMap.get(node.id);
      if (existing) {
        return { ...existing, ...node };
      }
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = Math.min(300, nodes.length * 20);
      return {
        ...node,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        pinned: false,
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

      draw();
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  // Only restart the loop on relationship changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationships]);

  function simulate(
    nodes: PositionedNode[],
    rels: GraphRelationship[],
    draggingId: string | null
  ) {
    const repulsion = 5000;
    const k = 0.01;
    const damping = 0.85;

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // Attraction along edges
    const idx = new Map(nodes.map((n, i) => [n.id, i]));
    for (const rel of rels) {
      const si = idx.get(rel.source_id);
      const ti = idx.get(rel.target_id);
      if (si === undefined || ti === undefined) continue;
      const dx = nodes[ti].x - nodes[si].x;
      const dy = nodes[ti].y - nodes[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = k * (dist - 150);
      const fx = (dx / Math.max(dist, 1)) * force;
      const fy = (dy / Math.max(dist, 1)) * force;
      nodes[si].vx += fx;
      nodes[si].vy += fy;
      nodes[ti].vx -= fx;
      nodes[ti].vy -= fy;
    }

    // Center gravity
    for (const n of nodes) {
      n.vx += (400 - n.x) * 0.001;
      n.vy += (300 - n.y) * 0.001;
    }

    // Apply velocity
    for (const n of nodes) {
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    const positioned = nodesRef.current;
    const nodeMap = new Map(positioned.map((n) => [n.id, n]));

    // Draw edges
    for (const rel of relationships) {
      const source = nodeMap.get(rel.source_id);
      const target = nodeMap.get(rel.target_id);
      if (!source || !target) continue;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Arrow at midpoint
      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      ctx.beginPath();
      ctx.moveTo(midX + 6 * Math.cos(angle), midY + 6 * Math.sin(angle));
      ctx.lineTo(
        midX - 6 * Math.cos(angle) + 4 * Math.cos(angle + Math.PI / 2),
        midY - 6 * Math.sin(angle) + 4 * Math.sin(angle + Math.PI / 2)
      );
      ctx.lineTo(
        midX - 6 * Math.cos(angle) - 4 * Math.cos(angle + Math.PI / 2),
        midY - 6 * Math.sin(angle) - 4 * Math.sin(angle + Math.PI / 2)
      );
      ctx.fillStyle = "#94a3b8";
      ctx.fill();

      // Rel type label
      ctx.font = "9px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.fillText(rel.type, midX, midY - 8);
    }

    // Draw nodes
    for (const node of positioned) {
      const r = 20;
      const color = NODE_TYPE_COLORS[node.nodeType] || "#6b7280";
      const isSelected = node.id === selectedRef.current;

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
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

      // Label
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "center";
      ctx.fillText(node.name, node.x, node.y + r + 14);

      // Type label
      ctx.font = "9px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(node.nodeType, node.x, node.y + r + 26);
    }

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
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });
    },
    [screenToWorld]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [screenToWorld]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingRef.current && !didDragRef.current) {
      onNodeSelect?.(draggingRef.current);
    }
    if (draggingRef.current) {
      // Pin the node after dragging so simulation doesn't move it
      const node = nodesRef.current.find((n) => n.id === draggingRef.current);
      if (node && didDragRef.current) {
        node.pinned = true;
      }
    }
    draggingRef.current = null;
    isPanningRef.current = false;
  }, [onNodeSelect]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const clicked = findNodeAt(e.clientX, e.clientY);
      if (clicked) {
        onNodeClick?.(clicked.id);
      }
    },
    [findNodeAt, onNodeClick]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    zoomRef.current = Math.min(3, Math.max(0.2, zoomRef.current - e.deltaY * 0.001));
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
    />
  );
}
