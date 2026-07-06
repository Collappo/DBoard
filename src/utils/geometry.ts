import { Point, BoardElement } from '../types';

/**
 * Transforms a point from canvas space to the local coordinate system of an element.
 * The local system has origin (0,0) at the element's center and is unrotated.
 */
export function toLocalSpace(p: Point, el: BoardElement): Point {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  
  const dx = p.x - cx;
  const dy = p.y - cy;
  
  const rad = -el.rotation * Math.PI / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
  
  return { x: rx, y: ry };
}

/**
 * Transforms a point from local space of an element back to canvas space.
 */
export function toCanvasSpace(p: Point, el: BoardElement): Point {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  
  const rad = el.rotation * Math.PI / 180;
  const rx = p.x * Math.cos(rad) - p.y * Math.sin(rad);
  const ry = p.x * Math.sin(rad) + p.y * Math.cos(rad);
  
  return { x: rx + cx, y: ry + cy };
}

/**
 * Gets the bounding box of an element in canvas space, taking rotation into account.
 */
export function getElementBounds(el: BoardElement): { minX: number; minY: number; maxX: number; maxY: number } {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const halfW = el.width / 2;
  const halfH = el.height / 2;
  
  const corners = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH },
  ];
  
  const rad = el.rotation * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const corner of corners) {
    const rx = corner.x * cos - corner.y * sin + cx;
    const ry = corner.x * sin + corner.y * cos + cy;
    
    if (rx < minX) minX = rx;
    if (rx > maxX) maxX = rx;
    if (ry < minY) minY = ry;
    if (ry > maxY) maxY = ry;
  }
  
  // For safety, if width or height is 0 (like starting shape)
  if (minX === Infinity) {
    return { minX: el.x, minY: el.y, maxX: el.x + el.width, maxY: el.y + el.height };
  }
  
  return { minX, minY, maxX, maxY };
}

/**
 * Checks if a point is close to a line segment.
 */
export function isPointNearSegment(p: Point, a: Point, b: Point, maxDistance: number = 8): boolean {
  const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  if (l2 === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2) < maxDistance;
  
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  
  const projectionX = a.x + t * (b.x - a.x);
  const projectionY = a.y + t * (b.y - a.y);
  
  const dist = Math.sqrt((p.x - projectionX) ** 2 + (p.y - projectionY) ** 2);
  return dist < maxDistance;
}

/**
 * Checks if a point in local coordinate space lies inside a triangle with 
 * vertices at Top (0, -h/2), Bottom-Left (-w/2, h/2), Bottom-Right (w/2, h/2).
 */
export function isInsideTriangle(localPt: Point, w: number, h: number): boolean {
  const a = { x: 0, y: -h / 2 };
  const b = { x: -w / 2, y: h / 2 };
  const c = { x: w / 2, y: h / 2 };
  
  const d1 = (localPt.x - b.x) * (a.y - b.y) - (a.x - b.x) * (localPt.y - b.y);
  const d2 = (localPt.x - c.x) * (b.y - c.y) - (b.x - c.x) * (localPt.y - c.y);
  const d3 = (localPt.x - a.x) * (c.y - a.y) - (c.x - a.x) * (localPt.y - a.y);
  
  const has_neg = d1 < 0 || d2 < 0 || d3 < 0;
  const has_pos = d1 > 0 || d2 > 0 || d3 > 0;
  
  return !(has_neg && has_pos);
}

/**
 * Checks if a point is inside an element.
 */
export function isPointInElement(p: Point, el: BoardElement): boolean {
  const local = toLocalSpace(p, el);
  const halfW = el.width / 2;
  const halfH = el.height / 2;
  
  // Fast boundary box check
  if (local.x < -halfW - 5 || local.x > halfW + 5 || local.y < -halfH - 5 || local.y > halfH + 5) {
    return false;
  }
  
  switch (el.type) {
    case 'brush': {
      if (!el.points) return false;
      // Check if near any brush path segment
      // Translate elements points which are relative to el.x, el.y
      // For brushes, it's easier to check segment proximity in canvas space
      for (let i = 0; i < el.points.length - 1; i++) {
        // Point points are relative to el.x, el.y
        const ptA = { x: el.x + el.points[i].x, y: el.y + el.points[i].y };
        const ptB = { x: el.x + el.points[i + 1].x, y: el.y + el.points[i + 1].y };
        if (isPointNearSegment(p, ptA, ptB, Math.max(el.strokeWidth, 8))) {
          return true;
        }
      }
      return false;
    }
    
    case 'spray': {
      if (!el.dots) return false;
      // Spray selection: click within the bounding box is best, 
      // but let's check proximity to the center or bounding box.
      return Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH;
    }
    
    case 'rect':
    case 'text':
    case 'image':
      // Solid rectangle hit box
      return Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH;
      
    case 'circle': {
      // Ellipse equation: (x/a)^2 + (y/b)^2 <= 1
      if (halfW === 0 || halfH === 0) return false;
      const termX = local.x / halfW;
      const termY = local.y / halfH;
      return termX * termX + termY * termY <= 1;
    }
    
    case 'triangle':
      return isInsideTriangle(local, el.width, el.height);
      
    case 'star': {
      // Click within the star's bounding box is best for selecting a star vector,
      // as clicking exact star teeth is extremely frustrating.
      return Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH;
    }
    
    default:
      return false;
  }
}

/**
 * Computes smoothed points using basic exponential moving average (Chaikin's/EMA approximation)
 */
export function smoothBrushPoints(points: Point[]): Point[] {
  if (points.length < 3) return points;
  
  const smoothed: Point[] = [points[0]];
  const weight = 0.75; // weight of current point vs previous smoothed point
  
  let current = points[0];
  for (let i = 1; i < points.length; i++) {
    current = {
      x: current.x * (1 - weight) + points[i].x * weight,
      y: current.y * (1 - weight) + points[i].y * weight,
    };
    smoothed.push(current);
  }
  
  return smoothed;
}
