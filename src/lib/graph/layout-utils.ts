// Layout utility functions for graph positioning and camera

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Calculate bounding box around all nodes, with radius padding */
export function calculateBoundingBox(
  nodes: Array<{ x: number; y: number; radius?: number }>
): BoundingBox {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const n of nodes) {
    const r = n.radius || 20;
    if (n.x - r < minX) minX = n.x - r;
    if (n.y - r < minY) minY = n.y - r;
    if (n.x + r > maxX) maxX = n.x + r;
    if (n.y + r > maxY) maxY = n.y + r;
  }

  return { minX, minY, maxX, maxY };
}

/** Calculate zoom + pan to fit bounding box into canvas viewport */
export function calculateFitToView(
  bbox: BoundingBox,
  canvasWidth: number,
  canvasHeight: number,
  padding = 40
): { zoom: number; panX: number; panY: number } {
  const bboxW = bbox.maxX - bbox.minX;
  const bboxH = bbox.maxY - bbox.minY;

  if (bboxW === 0 || bboxH === 0) {
    return { zoom: 1, panX: canvasWidth / 2, panY: canvasHeight / 2 };
  }

  const availW = canvasWidth - padding * 2;
  const availH = canvasHeight - padding * 2;

  const zoom = Math.min(
    Math.min(availW / bboxW, availH / bboxH),
    2 // Max zoom cap
  );

  const centerX = (bbox.minX + bbox.maxX) / 2;
  const centerY = (bbox.minY + bbox.maxY) / 2;

  return {
    zoom,
    panX: canvasWidth / 2 - centerX * zoom,
    panY: canvasHeight / 2 - centerY * zoom,
  };
}

/** Get layer-based initial Y position (fraction of canvas height) */
export function getLayerYFraction(layer: string): number {
  switch (layer) {
    case "business": return 0.25;
    case "application": return 0.5;
    case "spec": return 0.75;
    default: return 0.5;
  }
}

/** Ease-out cubic for smooth animations */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
