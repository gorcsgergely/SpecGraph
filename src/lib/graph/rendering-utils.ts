// Pure rendering utility functions for the graph canvas

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",      // slate-400
  active: "#22c55e",     // green-500
  deprecated: "#f59e0b", // amber-500
  archived: "#ef4444",   // red-500
};

/** Calculate node radius based on connection count (16–32px range) */
export function calculateNodeRadius(degree: number, baseRadius = 20): number {
  return Math.min(32, Math.max(16, baseRadius + degree * 1.5));
}

/** Draw an arrowhead pointing in the given direction */
export function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  color: string
) {
  ctx.beginPath();
  ctx.moveTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
  ctx.lineTo(
    x - size * Math.cos(angle) + (size * 0.6) * Math.cos(angle + Math.PI / 2),
    y - size * Math.sin(angle) + (size * 0.6) * Math.sin(angle + Math.PI / 2)
  );
  ctx.lineTo(
    x - size * Math.cos(angle) - (size * 0.6) * Math.cos(angle + Math.PI / 2),
    y - size * Math.sin(angle) - (size * 0.6) * Math.sin(angle + Math.PI / 2)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Whether labels should be shown at the current zoom level */
export function shouldShowLabel(zoom: number, threshold = 0.5): boolean {
  return zoom >= threshold;
}

/** Whether edge labels should be shown at the current zoom level */
export function shouldShowEdgeLabel(zoom: number, threshold = 1.2): boolean {
  return zoom >= threshold;
}

/** Get status badge color */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || "#94a3b8";
}

/** Draw a status badge dot at the top-right of a node circle */
export function drawStatusBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  status: string
) {
  const badgeRadius = 4;
  const bx = x + radius * 0.7;
  const by = y - radius * 0.7;

  // White outline
  ctx.beginPath();
  ctx.arc(bx, by, badgeRadius + 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Colored dot
  ctx.beginPath();
  ctx.arc(bx, by, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = getStatusColor(status);
  ctx.fill();
}

/** Apply hover glow effect to context before drawing a node */
export function applyHoverGlow(
  ctx: CanvasRenderingContext2D,
  color: string
) {
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
}

/** Clear shadow/glow effects */
export function clearGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

/** Group parallel edges (same source-target pair, ignoring direction) */
export interface EdgeGroup {
  sourceId: string;
  targetId: string;
  edges: Array<{ id: string; type: string; source_id: string; target_id: string }>;
}

export function groupParallelEdges(
  relationships: Array<{ id: string; type: string; source_id: string; target_id: string }>
): EdgeGroup[] {
  const groupMap = new Map<string, EdgeGroup>();

  for (const rel of relationships) {
    // Use sorted pair as key so A→B and B→A are in the same group
    const key = [rel.source_id, rel.target_id].sort().join("|");
    let group = groupMap.get(key);
    if (!group) {
      group = { sourceId: rel.source_id, targetId: rel.target_id, edges: [] };
      groupMap.set(key, group);
    }
    group.edges.push(rel);
  }

  return Array.from(groupMap.values());
}

/** Calculate a quadratic bezier control point for curved parallel edges */
export function getCurveControlPoint(
  sx: number, sy: number,
  tx: number, ty: number,
  edgeIndex: number,
  totalEdges: number
): { cx: number; cy: number } | null {
  if (totalEdges <= 1) return null; // Straight line

  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;

  // Perpendicular direction
  const nx = -dy / len;
  const ny = dx / len;

  // Spread factor: center edges around midpoint
  const offset = (edgeIndex - (totalEdges - 1) / 2) * 30;

  return {
    cx: midX + nx * offset,
    cy: midY + ny * offset,
  };
}
