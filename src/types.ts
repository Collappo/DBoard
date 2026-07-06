export type ToolType =
  | 'pointer'
  | 'brush'
  | 'spray'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'text'
  | 'bucket'
  | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface BoardElement {
  id: string;
  type: 'brush' | 'spray' | 'rect' | 'circle' | 'triangle' | 'star' | 'text' | 'image';
  x: number; // reference top-left x for bounding box or anchor
  y: number; // reference top-left y for bounding box or anchor
  width: number;
  height: number;
  rotation: number; // in degrees, clockwise
  color: string; // stroke color or text color
  fillColor?: string; // inside fill color (for shapes)
  strokeWidth: number;
  opacity: number;
  
  // Brush-specific
  points?: Point[]; // relative to (x, y) or absolute. Let's make them absolute for easier drawing, but relative is better for rotation/scaling!
  // Let's store points as absolute in canvas space, and when we scale/rotate, we transform them.
  // Actually, keeping them relative to (x, y) makes translation, scaling, and rotation mathematically simple!
  // Let's make points relative to (x, y) where x, y is the minX, minY of the brush path.
  
  // Spray-specific
  dots?: Point[]; // relative offsets from (x, y)
  
  // Text-specific
  textValue?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  
  // Image-specific
  imageSrc?: string;
  isGif?: boolean;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface BoardSettings {
  strokeWidth: number;
  color: string; // active stroke/draw color
  fillColor: string; // active fill color
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  brushSmoothing: boolean;
  theme: 'light' | 'dark';
}
