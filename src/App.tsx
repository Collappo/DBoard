import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  Sparkles,
  MousePointer2,
  Undo2,
  Redo2,
  Compass,
  Download,
  Info,
  Layers,
  Moon,
  Sun,
  Settings,
  HelpCircle
} from 'lucide-react';

import { ToolType, Point, BoardElement, CanvasState, BoardSettings } from './types';
import {
  toLocalSpace,
  toCanvasSpace,
  getElementBounds,
  isPointInElement,
  smoothBrushPoints
} from './utils/geometry';

import Toolbar from './components/Toolbar';
import ColorPalette from './components/ColorPalette';
import CanvasControls from './components/CanvasControls';
import ShareDialog from './components/ShareDialog';

export default function App() {
  // --- States ---
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [history, setHistory] = useState<BoardElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [activeTool, setActiveTool] = useState<ToolType>('pointer');
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  const [settings, setSettings] = useState<BoardSettings>({
    strokeWidth: 4,
    color: '#3b82f6', // Blue
    fillColor: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontSize: 24,
    fontWeight: 'normal',
    fontStyle: 'normal',
    brushSmoothing: true,
    theme: 'light',
  });

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  
  // Actions tracking
  const [activeAction, setActiveAction] = useState<
    'none' | 'drawing' | 'spraying' | 'panning' | 'selecting' | 'moving' | 'rotating' | 'scaling' | 'erasing'
  >('none');
  
  const [scalingHandle, setScalingHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });
  const [selectionStart, setSelectionStart] = useState<Point>({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Text editing overlay
  const [editingTextElementId, setEditingTextElementId] = useState<string | null>(null);
  const [textInputValue, setTextInputValue] = useState('');

  // Dialogs
  const [showShare, setShowShare] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageObjectsRef = useRef<{ [key: string]: HTMLImageElement }>({});
  const animationFrameRef = useRef<number | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // GSAP animation targets
  const headerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const colorPaletteRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Spray continuous emitter interval
  const sprayIntervalRef = useRef<number | null>(null);

  // Initialize and load persistent elements if any
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dboard_elements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setElements(parsed);
          setHistory([parsed]);
          setHistoryIndex(0);
          preloadImages(parsed);
        }
      }
      
      const savedTheme = localStorage.getItem('dboard_theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        setSettings(prev => ({ ...prev, theme: savedTheme }));
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (e) {
      console.error('Failed to load initial state', e);
    }
  }, []);

  // Save changes to localStorage on elements changes
  const saveToLocalStorage = (newElements: BoardElement[]) => {
    try {
      localStorage.setItem('dboard_elements', JSON.stringify(newElements));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  };

  // GSAP entry animations
  useEffect(() => {
    // Initial reveal animation
    const tl = gsap.timeline();
    tl.fromTo(headerRef.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
    tl.fromTo(toolbarRef.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: -0.5 });
    tl.fromTo(colorPaletteRef.current, { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: -0.5 });
    tl.fromTo(controlsRef.current, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: -0.6 });
  }, []);

  // Sync canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Image preloader
  const preloadImages = (elementsToLoad: BoardElement[]) => {
    elementsToLoad.forEach((el) => {
      if (el.type === 'image' && el.imageSrc && !imageObjectsRef.current[el.id]) {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageObjectsRef.current[el.id] = img;
        };
        img.src = el.imageSrc;
      }
    });
  };

  // Helper: Save current elements state to history
  const commitToHistory = (newElements: BoardElement[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newElements);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setElements(newElements);
    saveToLocalStorage(newElements);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      saveToLocalStorage(history[newIndex]);
      setSelectedElementIds([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      saveToLocalStorage(history[newIndex]);
      setSelectedElementIds([]);
    }
  };

  const handleClear = () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić całą tablicę?')) {
      commitToHistory([]);
      setSelectedElementIds([]);
    }
  };

  // Theme switcher
  const toggleTheme = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    setSettings((prev) => ({ ...prev, theme: nextTheme }));
    localStorage.setItem('dboard_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateSettings = (newSettings: Partial<BoardSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // --- Image Import Logic ---
  const handleImportImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const isGif = file.type === 'image/gif' || file.name.endsWith('.gif');
      handleImportImageUrl(url, isGif);
    };
    reader.readAsDataURL(file);
  };

  const handleImportImageUrl = (url: string, isGif: boolean = false) => {
    // If we can identify GIF from URL string
    const identifiedGif = isGif || url.toLowerCase().includes('.gif') || url.startsWith('data:image/gif');
    
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Find visible canvas center coordinates
      const viewCenterX = (window.innerWidth / 2 - canvasState.panX) / canvasState.zoom;
      const viewCenterY = (window.innerHeight / 2 - canvasState.panY) / canvasState.zoom;
      
      const maxDim = 320;
      let w = img.naturalWidth || 200;
      let h = img.naturalHeight || 200;
      const ratio = w / h;
      if (w > maxDim || h > maxDim) {
        if (ratio > 1) {
          w = maxDim;
          h = maxDim / ratio;
        } else {
          h = maxDim;
          w = maxDim * ratio;
        }
      }
      
      const newId = `image_${Date.now()}`;
      imageObjectsRef.current[newId] = img;
      
      const newEl: BoardElement = {
        id: newId,
        type: 'image',
        x: viewCenterX - w / 2,
        y: viewCenterY - h / 2,
        width: w,
        height: h,
        rotation: 0,
        color: 'transparent',
        strokeWidth: 0,
        opacity: 1,
        imageSrc: url,
        isGif: identifiedGif,
      };
      
      const nextElements = [...elements, newEl];
      commitToHistory(nextElements);
      setSelectedElementIds([newId]);
      setActiveTool('pointer');
    };
    img.src = url;
  };

  // --- Share Board Import Logic ---
  const handleShareImport = (imported: BoardElement[], mode: 'replace' | 'append') => {
    // Rehydrate image elements
    preloadImages(imported);
    
    if (mode === 'replace') {
      commitToHistory(imported);
    } else {
      // Place next to existing ones or offset slightly so they don't overlay exactly
      const offset = 40;
      const shifted = imported.map((el) => ({
        ...el,
        id: `${el.id}_imported_${Date.now()}`,
        x: el.x + offset,
        y: el.y + offset,
      }));
      commitToHistory([...elements, ...shifted]);
    }
    setSelectedElementIds([]);
  };

  // --- Canvas Coordinate Conversion Helpers ---
  const getCanvasPt = (e: React.MouseEvent<HTMLCanvasElement> | TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    return {
      x: (screenX - canvasState.panX) / canvasState.zoom,
      y: (screenY - canvasState.panY) / canvasState.zoom,
    };
  };

  // --- Drawing and Event Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const render = () => {
      // Clear canvas with base background matching theme
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Save original space before translating/zooming
      ctx.save();
      ctx.translate(canvasState.panX, canvasState.panY);
      ctx.scale(canvasState.zoom, canvasState.zoom);
      
      // Draw grid manually inside viewport coordinates for optimal performance
      drawCanvasGrid(ctx, canvas);
      
      // Draw all whiteboard elements
      elements.forEach((el) => {
        // Skip rendering text element if it is currently being edited in the DOM overlay
        if (el.id === editingTextElementId) return;
        
        ctx.save();
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((el.rotation * Math.PI) / 180);
        
        const halfW = el.width / 2;
        const halfH = el.height / 2;
        
        ctx.beginPath();
        
        switch (el.type) {
          case 'rect':
            ctx.rect(-halfW, -halfH, el.width, el.height);
            if (el.fillColor && el.fillColor !== 'transparent') {
              ctx.fillStyle = el.fillColor;
              ctx.fill();
            }
            ctx.strokeStyle = el.color;
            ctx.lineWidth = el.strokeWidth;
            ctx.stroke();
            break;
            
          case 'circle':
            ctx.ellipse(0, 0, halfW, halfH, 0, 0, Math.PI * 2);
            if (el.fillColor && el.fillColor !== 'transparent') {
              ctx.fillStyle = el.fillColor;
              ctx.fill();
            }
            ctx.strokeStyle = el.color;
            ctx.lineWidth = el.strokeWidth;
            ctx.stroke();
            break;
            
          case 'triangle':
            ctx.moveTo(0, -halfH);
            ctx.lineTo(-halfW, halfH);
            ctx.lineTo(halfW, halfH);
            ctx.closePath();
            if (el.fillColor && el.fillColor !== 'transparent') {
              ctx.fillStyle = el.fillColor;
              ctx.fill();
            }
            ctx.strokeStyle = el.color;
            ctx.lineWidth = el.strokeWidth;
            ctx.stroke();
            break;
            
          case 'star':
            for (let i = 0; i < 10; i++) {
              const angle = (i * Math.PI) / 5 - Math.PI / 2;
              const r = i % 2 === 0 ? 1 : 0.4;
              const sx = halfW * r * Math.cos(angle);
              const sy = halfH * r * Math.sin(angle);
              if (i === 0) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            }
            ctx.closePath();
            if (el.fillColor && el.fillColor !== 'transparent') {
              ctx.fillStyle = el.fillColor;
              ctx.fill();
            }
            ctx.strokeStyle = el.color;
            ctx.lineWidth = el.strokeWidth;
            ctx.stroke();
            break;
            
          case 'text':
            ctx.fillStyle = el.color;
            ctx.font = `${el.fontStyle || 'normal'} ${el.fontWeight || 'normal'} ${el.fontSize || 20}px ${el.fontFamily || 'var(--font-sans)'}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(el.textValue || '', 0, 0);
            break;
            
          case 'image': {
            const img = imageObjectsRef.current[el.id];
            if (img && img.complete) {
              ctx.drawImage(img, -halfW, -halfH, el.width, el.height);
            } else {
              ctx.fillStyle = settings.theme === 'light' ? '#f3f4f6' : '#1f2937';
              ctx.fillRect(-halfW, -halfH, el.width, el.height);
              ctx.strokeStyle = '#9ca3af';
              ctx.strokeRect(-halfW, -halfH, el.width, el.height);
            }
            break;
          }
          
          case 'brush':
            if (el.points && el.points.length > 0) {
              ctx.strokeStyle = el.color;
              ctx.lineWidth = el.strokeWidth;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              
              if (el.points.length > 1) {
                const startX = el.points[0].x - halfW;
                const startY = el.points[0].y - halfH;
                ctx.moveTo(startX, startY);
                
                for (let i = 1; i < el.points.length; i++) {
                  const px = el.points[i].x - halfW;
                  const py = el.points[i].y - halfH;
                  ctx.lineTo(px, py);
                }
                ctx.stroke();
              }
            }
            break;
            
          case 'spray':
            if (el.dots) {
              ctx.fillStyle = el.color;
              for (const dot of el.dots) {
                const dx = dot.x - halfW;
                const dy = dot.y - halfH;
                ctx.beginPath();
                ctx.arc(dx, dy, 1, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            break;
        }
        
        ctx.restore();
      });
      
      // Draw drag-to-select selection box
      if (selectionBox) {
        ctx.save();
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.5)';
        ctx.fillStyle = 'rgba(79, 70, 229, 0.08)';
        ctx.lineWidth = 1.5 / canvasState.zoom;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.rect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      
      // Draw selected elements bounding boxes & handles
      if (activeTool === 'pointer' && selectedElementIds.length > 0) {
        selectedElementIds.forEach((id) => {
          const el = elements.find((e) => e.id === id);
          if (!el) return;
          
          ctx.save();
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          ctx.translate(cx, cy);
          ctx.rotate((el.rotation * Math.PI) / 180);
          
          const halfW = el.width / 2;
          const halfH = el.height / 2;
          
          // Outer bounding box outline
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 1.5 / canvasState.zoom;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(-halfW, -halfH, el.width, el.height);
          
          // Draw rotation hook
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(0, -halfH);
          ctx.lineTo(0, -halfH - 20 / canvasState.zoom);
          ctx.stroke();
          
          // Draw handles (TL, TR, BL, BR, ROT)
          // Scale handles visually depending on zoom
          const handleSize = 7 / canvasState.zoom;
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 2 / canvasState.zoom;
          
          // Corner handles
          const corners = [
            { x: -halfW, y: -halfH }, // TL
            { x: halfW, y: -halfH },  // TR
            { x: -halfW, y: halfH },  // BL
            { x: halfW, y: halfH },   // BR
          ];
          
          corners.forEach((c) => {
            ctx.beginPath();
            ctx.rect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
            ctx.fill();
            ctx.stroke();
          });
          
          // Rotation handle
          ctx.beginPath();
          ctx.arc(0, -halfH - 20 / canvasState.zoom, handleSize / 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.restore();
        });
      }
      
      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [elements, canvasState, selectedElementIds, activeTool, selectionBox, editingTextElementId]);

  // Render Grid background
  const drawCanvasGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const isDark = settings.theme === 'dark';
    ctx.save();
    
    const dotSpacing = 24;
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    
    // Find canvas viewport bounds in canvas space
    const viewLeft = -canvasState.panX / canvasState.zoom;
    const viewTop = -canvasState.panY / canvasState.zoom;
    const viewRight = (canvas.width - canvasState.panX) / canvasState.zoom;
    const viewBottom = (canvas.height - canvasState.panY) / canvasState.zoom;
    
    // Snap grid start points to fit dot spacing
    const startX = Math.floor(viewLeft / dotSpacing) * dotSpacing;
    const startY = Math.floor(viewTop / dotSpacing) * dotSpacing;
    const endX = Math.ceil(viewRight / dotSpacing) * dotSpacing;
    const endY = Math.ceil(viewBottom / dotSpacing) * dotSpacing;
    
    ctx.fillStyle = gridColor;
    
    // Draw dot matrix grid
    for (let x = startX; x <= endX; x += dotSpacing) {
      for (let y = startY; y <= endY; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1 / canvasState.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  };

  // --- Interaction Event Handlers ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingTextElementId) {
      commitTextEdit();
    }
    
    const canvasPt = getCanvasPt(e);
    setLastMousePos(canvasPt);
    
    // Middle Mouse or Spacebar key or Panning tool active triggers pan
    if (e.button === 1 || e.button === 2 || activeTool === 'pointer' && e.shiftKey) {
      setActiveAction('panning');
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (activeTool === 'pointer') {
      // 1. Hit test selection handles if an element is already selected
      if (selectedElementIds.length === 1) {
        const el = elements.find((x) => x.id === selectedElementIds[0]);
        if (el) {
          const handleHit = checkHandleHit(canvasPt, el);
          if (handleHit) {
            setScalingHandle(handleHit);
            setDragStart(canvasPt);
            if (handleHit === 'ROT') {
              setActiveAction('rotating');
            } else {
              setActiveAction('scaling');
            }
            return;
          }
        }
      }
      
      // 2. Hit test actual elements
      let clickedEl: BoardElement | null = null;
      // Loop backward to hit top-most drawn element first
      for (let i = elements.length - 1; i >= 0; i--) {
        if (isPointInElement(canvasPt, elements[i])) {
          clickedEl = elements[i];
          break;
        }
      }
      
      if (clickedEl) {
        // Handle selecting multiple elements
        const isCtrl = e.ctrlKey || e.metaKey;
        if (isCtrl) {
          if (selectedElementIds.includes(clickedEl.id)) {
            setSelectedElementIds(selectedElementIds.filter((id) => id !== clickedEl!.id));
          } else {
            setSelectedElementIds([...selectedElementIds, clickedEl.id]);
          }
        } else {
          if (!selectedElementIds.includes(clickedEl.id)) {
            setSelectedElementIds([clickedEl.id]);
          }
        }
        
        setActiveAction('moving');
        setDragStart(canvasPt);
      } else {
        // Clicked on empty space: draw selection boundary rectangle
        setSelectedElementIds([]);
        setActiveAction('selecting');
        setSelectionStart(canvasPt);
        setSelectionBox({ x: canvasPt.x, y: canvasPt.y, w: 0, h: 0 });
      }
    }
    
    // Draw Brush Line
    else if (activeTool === 'brush') {
      setActiveAction('drawing');
      setDragStart(canvasPt);
      
      const newEl: BoardElement = {
        id: `brush_${Date.now()}`,
        type: 'brush',
        x: canvasPt.x,
        y: canvasPt.y,
        width: 0,
        height: 0,
        rotation: 0,
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        opacity: 1,
        points: [{ x: 0, y: 0 }],
      };
      
      setElements([...elements, newEl]);
    }
    
    // Spray Can Emitter
    else if (activeTool === 'spray') {
      setActiveAction('spraying');
      setDragStart(canvasPt);
      
      const newEl: BoardElement = {
        id: `spray_${Date.now()}`,
        type: 'spray',
        x: canvasPt.x,
        y: canvasPt.y,
        width: 0,
        height: 0,
        rotation: 0,
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        opacity: 1,
        dots: [],
      };
      
      setElements([...elements, newEl]);
      
      // Start continuous spray loop interval
      let activeSprayPt = canvasPt;
      const sprayEmitter = () => {
        const radius = settings.strokeWidth * 3.5;
        const sprayDensity = 12;
        const newDots: Point[] = [];
        
        for (let i = 0; i < sprayDensity; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radius;
          const dx = activeSprayPt.x - canvasPt.x + r * Math.cos(angle);
          const dy = activeSprayPt.y - canvasPt.y + r * Math.sin(angle);
          newDots.push({ x: dx, y: dy });
        }
        
        setElements((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.type === 'spray') {
            last.dots = [...(last.dots || []), ...newDots];
          }
          return copy;
        });
      };
      
      // First spray emission instantly
      sprayEmitter();
      
      // Setup interval tracking current cursor
      const intervalId = window.setInterval(() => {
        sprayEmitter();
      }, 35);
      
      sprayIntervalRef.current = intervalId;
    }
    
    // Draw vector shapes (rect, circle, triangle, star)
    else if (['rect', 'circle', 'triangle', 'star'].includes(activeTool)) {
      setActiveAction('drawing');
      setDragStart(canvasPt);
      
      const newEl: BoardElement = {
        id: `${activeTool}_${Date.now()}`,
        type: activeTool as any,
        x: canvasPt.x,
        y: canvasPt.y,
        width: 0,
        height: 0,
        rotation: 0,
        color: settings.color,
        fillColor: settings.fillColor,
        strokeWidth: settings.strokeWidth,
        opacity: 1,
      };
      
      setElements([...elements, newEl]);
      setSelectedElementIds([newEl.id]);
    }
    
    // Add dynamic interactive text
    else if (activeTool === 'text') {
      const newId = `text_${Date.now()}`;
      const newEl: BoardElement = {
        id: newId,
        type: 'text',
        x: canvasPt.x,
        y: canvasPt.y - 15,
        width: 140,
        height: 40,
        rotation: 0,
        color: settings.color,
        strokeWidth: 0,
        opacity: 1,
        textValue: '',
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        fontWeight: settings.fontWeight,
        fontStyle: settings.fontStyle,
      };
      
      // Update elements list
      setElements([...elements, newEl]);
      setSelectedElementIds([newId]);
      
      // Activate textbox editor overlay
      setEditingTextElementId(newId);
      setTextInputValue('');
      setActiveTool('pointer');
      
      // Focus textarea overlay on next render frame
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    }
    
    // Flood fill bucket tool
    else if (activeTool === 'bucket') {
      let clickedEl: BoardElement | null = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (isPointInElement(canvasPt, elements[i])) {
          clickedEl = elements[i];
          break;
        }
      }
      
      if (clickedEl) {
        // If it's a vector shape, fill it
        if (['rect', 'circle', 'triangle', 'star'].includes(clickedEl.type)) {
          const nextEls = elements.map((el) => {
            if (el.id === clickedEl!.id) {
              return { ...el, fillColor: settings.color };
            }
            return el;
          });
          commitToHistory(nextEls);
        } else {
          // Change outline color for lines, brush, texts
          const nextEls = elements.map((el) => {
            if (el.id === clickedEl!.id) {
              return { ...el, color: settings.color };
            }
            return el;
          });
          commitToHistory(nextEls);
        }
      } else {
        // Clicked background: set custom canvas base background color or toggle dark theme
        toggleTheme();
      }
    }
    
    // Vector element removal eraser
    else if (activeTool === 'eraser') {
      setActiveAction('erasing');
      setDragStart(canvasPt);
      
      let hitId: string | null = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (isPointInElement(canvasPt, elements[i])) {
          hitId = elements[i].id;
          break;
        }
      }
      
      if (hitId) {
        const nextElements = elements.filter((el) => el.id !== hitId);
        setElements(nextElements);
        setSelectedElementIds([]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasPt = getCanvasPt(e);
    
    if (activeAction === 'panning') {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      setCanvasState((prev) => ({
        ...prev,
        panX: prev.panX + dx,
        panY: prev.panY + dy,
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    const dx = canvasPt.x - lastMousePos.x;
    const dy = canvasPt.y - lastMousePos.y;
    setLastMousePos(canvasPt);
    
    // Vector movement
    if (activeAction === 'moving' && selectedElementIds.length > 0) {
      const nextElements = elements.map((el) => {
        if (selectedElementIds.includes(el.id)) {
          return {
            ...el,
            x: el.x + dx,
            y: el.y + dy,
          };
        }
        return el;
      });
      setElements(nextElements);
    }
    
    // Vector elements drawing sizes
    else if (activeAction === 'drawing') {
      setElements((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (!last) return prev;
        
        if (last.type === 'brush') {
          // Append drawing coordinate
          const rx = canvasPt.x - last.x;
          const ry = canvasPt.y - last.y;
          last.points = [...(last.points || []), { x: rx, y: ry }];
        } else {
          // Stretch shape sizes
          const currentWidth = canvasPt.x - dragStart.x;
          const currentHeight = canvasPt.y - dragStart.y;
          
          last.width = Math.abs(currentWidth);
          last.height = Math.abs(currentHeight);
          last.x = currentWidth > 0 ? dragStart.x : canvasPt.x;
          last.y = currentHeight > 0 ? dragStart.y : canvasPt.y;
        }
        return copy;
      });
    }
    
    // Spray can movement
    else if (activeAction === 'spraying') {
      // Just update current spray point to let emitter draw there
      setDragStart(canvasPt);
    }
    
    // Scale Handle Transformation Math
    else if (activeAction === 'scaling' && selectedElementIds.length === 1 && scalingHandle) {
      const el = elements.find((x) => x.id === selectedElementIds[0]);
      if (el) {
        const localMouse = toLocalSpace(canvasPt, el);
        const halfW = el.width / 2;
        const halfH = el.height / 2;
        
        let newW = el.width;
        let newH = el.height;
        let localCenterOffset = { x: 0, y: 0 };
        
        switch (scalingHandle) {
          case 'BR':
            newW = Math.max(10, localMouse.x - (-halfW));
            newH = Math.max(10, localMouse.y - (-halfH));
            localCenterOffset = { x: (newW - el.width) / 2, y: (newH - el.height) / 2 };
            break;
          case 'BL':
            newW = Math.max(10, halfW - localMouse.x);
            newH = Math.max(10, localMouse.y - (-halfH));
            localCenterOffset = { x: -(newW - el.width) / 2, y: (newH - el.height) / 2 };
            break;
          case 'TR':
            newW = Math.max(10, localMouse.x - (-halfW));
            newH = Math.max(10, halfH - localMouse.y);
            localCenterOffset = { x: (newW - el.width) / 2, y: -(newH - el.height) / 2 };
            break;
          case 'TL':
            newW = Math.max(10, halfW - localMouse.x);
            newH = Math.max(10, halfH - localMouse.y);
            localCenterOffset = { x: -(newW - el.width) / 2, y: -(newH - el.height) / 2 };
            break;
        }
        
        // Handle proportional aspect ratio preservation for Images, Stars & Texts
        if (el.type === 'image' || el.type === 'text' || el.type === 'star') {
          const ratio = el.width / el.height;
          // Use largest stretch scale
          if (newW / el.width > newH / el.height) {
            newH = newW / ratio;
          } else {
            newW = newH * ratio;
          }
          
          // Re-adjust offsets
          switch (scalingHandle) {
            case 'BR':
              localCenterOffset = { x: (newW - el.width) / 2, y: (newH - el.height) / 2 };
              break;
            case 'BL':
              localCenterOffset = { x: -(newW - el.width) / 2, y: (newH - el.height) / 2 };
              break;
            case 'TR':
              localCenterOffset = { x: (newW - el.width) / 2, y: -(newH - el.height) / 2 };
              break;
            case 'TL':
              localCenterOffset = { x: -(newW - el.width) / 2, y: -(newH - el.height) / 2 };
              break;
          }
        }
        
        // Translate rotated offset to canvas coordinates
        const rad = (el.rotation * Math.PI) / 180;
        const cx_offset = localCenterOffset.x * Math.cos(rad) - localCenterOffset.y * Math.sin(rad);
        const cy_offset = localCenterOffset.x * Math.sin(rad) + localCenterOffset.y * Math.cos(rad);
        
        const newCx = el.x + el.width / 2 + cx_offset;
        const newCy = el.y + el.height / 2 + cy_offset;
        
        const updatedElement: BoardElement = {
          ...el,
          x: newCx - newW / 2,
          y: newCy - newH / 2,
          width: newW,
          height: newH,
        };
        
        // For dynamic texts: scale font size matching height change
        if (el.type === 'text' && el.fontSize) {
          const scaleRatio = newH / el.height;
          updatedElement.fontSize = Math.max(6, Math.round(el.fontSize * scaleRatio));
        }

        // Scale underlying brush points or spray dots relative to size changes
        if (el.type === 'brush' && el.points) {
          const scaleX = el.width > 0 ? newW / el.width : 1;
          const scaleY = el.height > 0 ? newH / el.height : 1;
          updatedElement.points = el.points.map((p) => ({
            x: p.x * scaleX,
            y: p.y * scaleY,
          }));
        } else if (el.type === 'spray' && el.dots) {
          const scaleX = el.width > 0 ? newW / el.width : 1;
          const scaleY = el.height > 0 ? newH / el.height : 1;
          updatedElement.dots = el.dots.map((d) => ({
            x: d.x * scaleX,
            y: d.y * scaleY,
          }));
        }
        
        setElements(elements.map((x) => (x.id === el.id ? updatedElement : x)));
      }
    }
    
    // Rotate Transformation Math
    else if (activeAction === 'rotating' && selectedElementIds.length === 1) {
      const el = elements.find((x) => x.id === selectedElementIds[0]);
      if (el) {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        
        // Compute rotation angle
        const angleRad = Math.atan2(canvasPt.y - cy, canvasPt.x - cx);
        let angleDeg = (angleRad * 180) / Math.PI + 90; // offset hook starting 12-o-clock
        
        // Snap to nearest 15 degrees if shift key is pressed
        if (e.shiftKey) {
          angleDeg = Math.round(angleDeg / 15) * 15;
        }
        
        setElements(
          elements.map((x) => {
            if (x.id === el.id) {
              return { ...x, rotation: angleDeg };
            }
            return x;
          })
        );
      }
    }
    
    // Selection box area tracking
    else if (activeAction === 'selecting' && selectionBox) {
      const currentWidth = canvasPt.x - selectionStart.x;
      const currentHeight = canvasPt.y - selectionStart.y;
      
      setSelectionBox({
        x: currentWidth > 0 ? selectionStart.x : canvasPt.x,
        y: currentHeight > 0 ? selectionStart.y : canvasPt.y,
        w: Math.abs(currentWidth),
        h: Math.abs(currentHeight),
      });
    }
    
    // Continuous drag eraser tracking
    else if (activeAction === 'erasing') {
      const dx = canvasPt.x - lastMousePos.x;
      const dy = canvasPt.y - lastMousePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.ceil(distance / 12)); // fine-grained step checks
      
      let nextElements = [...elements];
      let didErase = false;
      
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const pt = {
          x: lastMousePos.x + dx * t,
          y: lastMousePos.y + dy * t,
        };
        
        for (let i = nextElements.length - 1; i >= 0; i--) {
          if (isPointInElement(pt, nextElements[i])) {
            nextElements.splice(i, 1);
            didErase = true;
            break;
          }
        }
      }
      
      if (didErase) {
        setElements(nextElements);
        setSelectedElementIds([]);
      }
    }
  };

  const handleMouseUp = () => {
    if (sprayIntervalRef.current !== null) {
      clearInterval(sprayIntervalRef.current);
      sprayIntervalRef.current = null;
    }
    
    if (activeAction === 'panning') {
      setActiveAction('none');
      return;
    }
    
    // Fit brush hand drawn bounding box
    if (activeAction === 'drawing') {
      const copy = [...elements];
      const last = copy[copy.length - 1];
      
      if (last && last.type === 'brush' && last.points && last.points.length > 0) {
        const startX = last.x;
        const startY = last.y;
        
        // Filter out single click dots if they drawn nothing
        if (last.points.length === 1) {
          copy.pop();
          setElements(copy);
          setActiveAction('none');
          return;
        }
        
        // Apply smooth hand stabilizer paths if active
        let rawPoints = last.points;
        if (settings.brushSmoothing) {
          rawPoints = smoothBrushPoints(rawPoints);
        }
        
        // Absolute coordinates
        const absPoints = rawPoints.map((pt) => ({ x: startX + pt.x, y: startY + pt.y }));
        const minX = Math.min(...absPoints.map((p) => p.x));
        const minY = Math.min(...absPoints.map((p) => p.y));
        const maxX = Math.max(...absPoints.map((p) => p.x));
        const maxY = Math.max(...absPoints.map((p) => p.y));
        
        const w = Math.max(4, maxX - minX);
        const h = Math.max(4, maxY - minY);
        
        last.x = minX;
        last.y = minY;
        last.width = w;
        last.height = h;
        // Re-scale relative coordinates around cropped frame
        last.points = absPoints.map((pt) => ({ x: pt.x - minX, y: pt.y - minY }));
        
        commitToHistory(copy);
      } else if (last && ['rect', 'circle', 'triangle', 'star'].includes(last.type)) {
        // Drop elements if they have size of 0
        if (last.width < 5 || last.height < 5) {
          copy.pop();
          setElements(copy);
          setSelectedElementIds([]);
        } else {
          commitToHistory(copy);
        }
      }
    }
    
    // Fit spray bounding box on mouse release
    else if (activeAction === 'spraying') {
      const copy = [...elements];
      const last = copy[copy.length - 1];
      
      if (last && last.type === 'spray' && last.dots && last.dots.length > 0) {
        const startX = last.x;
        const startY = last.y;
        
        const absDots = last.dots.map((d) => ({ x: startX + d.x, y: startY + d.y }));
        const minX = Math.min(...absDots.map((p) => p.x));
        const minY = Math.min(...absDots.map((p) => p.y));
        const maxX = Math.max(...absDots.map((p) => p.x));
        const maxY = Math.max(...absDots.map((p) => p.y));
        
        last.x = minX;
        last.y = minY;
        last.width = maxX - minX;
        last.height = maxY - minY;
        last.dots = absDots.map((d) => ({ x: d.x - minX, y: d.y - minY }));
        
        commitToHistory(copy);
      } else if (last) {
        copy.pop();
        setElements(copy);
      }
    }
    
    // Multi elements drag selector finish
    else if (activeAction === 'selecting' && selectionBox) {
      const intersectingIds: string[] = [];
      elements.forEach((el) => {
        const bounds = getElementBounds(el);
        // Collision test selection bounding boxes
        const intersects = !(
          bounds.minX > selectionBox.x + selectionBox.w ||
          bounds.maxX < selectionBox.x ||
          bounds.minY > selectionBox.y + selectionBox.h ||
          bounds.maxY < selectionBox.y
        );
        if (intersects) {
          intersectingIds.push(el.id);
        }
      });
      
      setSelectedElementIds(intersectingIds);
      setSelectionBox(null);
    }
    
    // Save moved, scaled or rotated vectors to history log
    else if (['moving', 'scaling', 'rotating', 'erasing'].includes(activeAction)) {
      commitToHistory(elements);
    }
    
    setActiveAction('none');
    setScalingHandle(null);
  };

  // Check which scale handle is clicked
  const checkHandleHit = (p: Point, el: BoardElement): string | null => {
    const local = toLocalSpace(p, el);
    const halfW = el.width / 2;
    const halfH = el.height / 2;
    
    // Visual handle click buffer range matching screen scale size
    const tolerance = 10 / canvasState.zoom;
    
    // Corners
    if (Math.abs(local.x - (-halfW)) < tolerance && Math.abs(local.y - (-halfH)) < tolerance) return 'TL';
    if (Math.abs(local.x - halfW) < tolerance && Math.abs(local.y - (-halfH)) < tolerance) return 'TR';
    if (Math.abs(local.x - (-halfW)) < tolerance && Math.abs(local.y - halfH) < tolerance) return 'BL';
    if (Math.abs(local.x - halfW) < tolerance && Math.abs(local.y - halfH) < tolerance) return 'BR';
    
    // Rotation Handle hanging above
    const rotHandleY = -halfH - 20 / canvasState.zoom;
    const distToRot = Math.sqrt(local.x * local.x + (local.y - rotHandleY) * (local.y - rotHandleY));
    if (distToRot < tolerance) return 'ROT';
    
    return null;
  };

  // --- Zoom Panning Wheel Scroll Events ---
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Zoom directly with scroll wheel up/down (deltaY)
    if (e.deltaY !== 0) {
      const zoomIntensity = 0.05;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const wheel = e.deltaY < 0 ? 1 : -1;
      const nextZoom = Math.min(4, Math.max(0.15, Number((canvasState.zoom + wheel * zoomIntensity).toFixed(2))));
      
      const zoomFactor = nextZoom / canvasState.zoom;
      const nextPanX = mouseX - (mouseX - canvasState.panX) * zoomFactor;
      const nextPanY = mouseY - (mouseY - canvasState.panY) * zoomFactor;
      
      setCanvasState((prev) => ({
        zoom: nextZoom,
        panX: nextPanX,
        panY: nextPanY,
      }));
    }
    
    // Pan horizontally on deltaX
    if (e.deltaX !== 0) {
      setCanvasState((prev) => ({
        ...prev,
        panX: prev.panX - e.deltaX,
      }));
    }
  };

  // Keyboard controls (Del to delete vectors, arrow keys to nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is writing in overlay textbox
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;
      
      if (selectedElementIds.length > 0) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          const nextElements = elements.filter((el) => !selectedElementIds.includes(el.id));
          commitToHistory(nextElements);
          setSelectedElementIds([]);
        }
        
        // Key nudging
        const nudgeAmount = e.shiftKey ? 10 : 1;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          const nextElements = elements.map((el) => {
            if (selectedElementIds.includes(el.id)) {
              let nx = el.x;
              let ny = el.y;
              if (e.key === 'ArrowLeft') nx -= nudgeAmount;
              if (e.key === 'ArrowRight') nx += nudgeAmount;
              if (e.key === 'ArrowUp') ny -= nudgeAmount;
              if (e.key === 'ArrowDown') ny += nudgeAmount;
              return { ...el, x: nx, y: ny };
            }
            return el;
          });
          setElements(nextElements);
          saveToLocalStorage(nextElements);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedElementIds]);

  // --- Dynamic Live Text Editor Overlay ---
  const commitTextEdit = () => {
    if (editingTextElementId) {
      const nextElements = elements
        .map((el) => {
          if (el.id === editingTextElementId) {
            // Compute visual dimensions of committed text to resize bounding box properly
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            let w = el.width;
            let h = el.height;
            
            if (ctx && textInputValue.trim()) {
              ctx.font = `${el.fontStyle || 'normal'} ${el.fontWeight || 'normal'} ${el.fontSize || 20}px ${el.fontFamily || 'var(--font-sans)'}`;
              const metrics = ctx.measureText(textInputValue);
              w = Math.max(120, metrics.width + 30);
              h = (el.fontSize || 20) * 1.5;
            }
            
            return {
              ...el,
              textValue: textInputValue.trim(),
              width: w,
              height: h,
            };
          }
          return el;
        })
        .filter((el) => el.type !== 'text' || el.textValue); // filter out empty texts
      
      commitToHistory(nextElements);
      setEditingTextElementId(null);
      setTextInputValue('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInputValue(e.target.value);
  };

  const activeEditingTextElement = elements.find((el) => el.id === editingTextElementId);
  const textEditorStyle = activeEditingTextElement
    ? {
        position: 'absolute' as const,
        left: `${activeEditingTextElement.x * canvasState.zoom + canvasState.panX}px`,
        top: `${activeEditingTextElement.y * canvasState.zoom + canvasState.panY}px`,
        width: `${activeEditingTextElement.width * canvasState.zoom}px`,
        height: `${activeEditingTextElement.height * canvasState.zoom}px`,
        transform: `rotate(${activeEditingTextElement.rotation}deg)`,
        transformOrigin: 'center center',
        fontSize: `${(activeEditingTextElement.fontSize || 20) * canvasState.zoom}px`,
        fontFamily: activeEditingTextElement.fontFamily || 'var(--font-sans)',
        fontWeight: activeEditingTextElement.fontWeight || 'normal',
        fontStyle: activeEditingTextElement.fontStyle || 'normal',
        color: activeEditingTextElement.color,
      }
    : {};

  // --- Auto-Cropped PNG Canvas Export ---
  const handleExportPng = () => {
    if (elements.length === 0) {
      alert('Płótno jest puste. Narysuj coś najpierw przed wyeksportowaniem.');
      return;
    }
    
    // Find absolute boundaries of all drawn shapes/paths
    let overallMinX = Infinity;
    let overallMinY = Infinity;
    let overallMaxX = -Infinity;
    let overallMaxY = -Infinity;
    
    elements.forEach((el) => {
      const bounds = getElementBounds(el);
      if (bounds.minX < overallMinX) overallMinX = bounds.minX;
      if (bounds.minY < overallMinY) overallMinY = bounds.minY;
      if (bounds.maxX > overallMaxX) overallMaxX = bounds.maxX;
      if (bounds.maxY > overallMaxY) overallMaxY = bounds.maxY;
    });
    
    // Add padded boundary edges
    const padding = 30;
    const cropX = overallMinX - padding;
    const cropY = overallMinY - padding;
    const cropWidth = overallMaxX - overallMinX + padding * 2;
    const cropHeight = overallMaxY - overallMinY + padding * 2;
    
    // Create physical hidden canvas element to render cropped area
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Set matching background fill
    tempCtx.fillStyle = settings.theme === 'light' ? '#ffffff' : '#111113';
    tempCtx.fillRect(0, 0, cropWidth, cropHeight);
    
    // Render elements translated by Crop values
    elements.forEach((el) => {
      tempCtx.save();
      // Position center of shape inside Crop coordinates
      const cx = el.x + el.width / 2 - cropX;
      const cy = el.y + el.height / 2 - cropY;
      tempCtx.translate(cx, cy);
      tempCtx.rotate((el.rotation * Math.PI) / 180);
      
      const halfW = el.width / 2;
      const halfH = el.height / 2;
      
      tempCtx.beginPath();
      
      switch (el.type) {
        case 'rect':
          tempCtx.rect(-halfW, -halfH, el.width, el.height);
          if (el.fillColor && el.fillColor !== 'transparent') {
            tempCtx.fillStyle = el.fillColor;
            tempCtx.fill();
          }
          tempCtx.strokeStyle = el.color;
          tempCtx.lineWidth = el.strokeWidth;
          tempCtx.stroke();
          break;
          
        case 'circle':
          tempCtx.ellipse(0, 0, halfW, halfH, 0, 0, Math.PI * 2);
          if (el.fillColor && el.fillColor !== 'transparent') {
            tempCtx.fillStyle = el.fillColor;
            tempCtx.fill();
          }
          tempCtx.strokeStyle = el.color;
          tempCtx.lineWidth = el.strokeWidth;
          tempCtx.stroke();
          break;
          
        case 'triangle':
          tempCtx.moveTo(0, -halfH);
          tempCtx.lineTo(-halfW, halfH);
          tempCtx.lineTo(halfW, halfH);
          tempCtx.closePath();
          if (el.fillColor && el.fillColor !== 'transparent') {
            tempCtx.fillStyle = el.fillColor;
            tempCtx.fill();
          }
          tempCtx.strokeStyle = el.color;
          tempCtx.lineWidth = el.strokeWidth;
          tempCtx.stroke();
          break;
          
        case 'star':
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const r = i % 2 === 0 ? 1 : 0.4;
            const sx = halfW * r * Math.cos(angle);
            const sy = halfH * r * Math.sin(angle);
            if (i === 0) tempCtx.moveTo(sx, sy);
            else tempCtx.lineTo(sx, sy);
          }
          tempCtx.closePath();
          if (el.fillColor && el.fillColor !== 'transparent') {
            tempCtx.fillStyle = el.fillColor;
            tempCtx.fill();
          }
          tempCtx.strokeStyle = el.color;
          tempCtx.lineWidth = el.strokeWidth;
          tempCtx.stroke();
          break;
          
        case 'text':
          tempCtx.fillStyle = el.color;
          tempCtx.font = `${el.fontStyle || 'normal'} ${el.fontWeight || 'normal'} ${el.fontSize || 20}px ${el.fontFamily || 'var(--font-sans)'}`;
          tempCtx.textAlign = 'center';
          tempCtx.textBaseline = 'middle';
          tempCtx.fillText(el.textValue || '', 0, 0);
          break;
          
        case 'image': {
          const img = imageObjectsRef.current[el.id];
          if (img && img.complete) {
            tempCtx.drawImage(img, -halfW, -halfH, el.width, el.height);
          }
          break;
        }
        
        case 'brush':
          if (el.points && el.points.length > 0) {
            tempCtx.strokeStyle = el.color;
            tempCtx.lineWidth = el.strokeWidth;
            tempCtx.lineCap = 'round';
            tempCtx.lineJoin = 'round';
            
            if (el.points.length > 1) {
              const startX = el.points[0].x - halfW;
              const startY = el.points[0].y - halfH;
              tempCtx.moveTo(startX, startY);
              
              for (let i = 1; i < el.points.length; i++) {
                const px = el.points[i].x - halfW;
                const py = el.points[i].y - halfH;
                tempCtx.lineTo(px, py);
              }
              tempCtx.stroke();
            }
          }
          break;
          
        case 'spray':
          if (el.dots) {
            tempCtx.fillStyle = el.color;
            for (const dot of el.dots) {
              const dx = dot.x - halfW;
              const dy = dot.y - halfH;
              tempCtx.beginPath();
              tempCtx.arc(dx, dy, 1, 0, Math.PI * 2);
              tempCtx.fill();
            }
          }
          break;
      }
      
      tempCtx.restore();
    });
    
    // Download image data
    try {
      const dataUrl = tempCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `dboard-export-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to export PNG', err);
      alert('Nie udało się wyeksportować. Niektóre zewnętrzne obrazy mogą blokować eksport CORS.');
    }
  };

  // Drag and drop images/gifs directly to canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImportImageFile(file);
    }
  };

  const isDark = settings.theme === 'dark';

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${
        isDark ? 'bg-[#111113] text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* 1. Header Bar (Panel Górny) */}
      <div
        ref={headerRef}
        className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none"
      >
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-[20px] glass-panel shadow-md pointer-events-auto border border-gray-200/50 dark:border-gray-800/50 animate-in fade-in">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1] text-white flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] select-none">
            D
          </div>
          <span className="font-sans font-bold tracking-tight text-sm text-gray-800 dark:text-gray-100">DBoard</span>
          <div className="bg-black/5 dark:bg-white/8 px-2 py-1 rounded-[6px] text-[10px] font-semibold text-gray-500 dark:text-[#a1a1aa] tracking-wider uppercase select-none">
            Beta 0.8
          </div>
        </div>

        {/* Short info / help button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-9 h-9 rounded-[14px] glass-panel flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-[#ffffff] hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200/50 dark:border-gray-800/50 shadow-md transition-all cursor-pointer active:scale-95"
            title="Jak używać"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Main Infinite Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`absolute inset-0 block touch-none outline-none ${
          isDark ? 'canvas-grid-dark bg-[#111113]' : 'canvas-grid-light bg-gray-50'
        }`}
      />

      {/* 3. Live Textbox Editing Overlay DOM wrapper */}
      {editingTextElementId && activeEditingTextElement && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <textarea
            ref={textInputRef}
            style={textEditorStyle}
            value={textInputValue}
            onChange={handleTextChange}
            onBlur={commitTextEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitTextEdit();
              }
              if (e.key === 'Escape') {
                commitTextEdit();
              }
            }}
            placeholder="Napisz coś..."
            className="bg-transparent border-0 outline-none p-0 m-0 resize-none overflow-hidden text-center focus:ring-0 leading-normal pointer-events-auto"
          />
        </div>
      )}

      {/* 4. Left-Floating Sidebar (Color Selection Panel) */}
      <div
        ref={colorPaletteRef}
        className="absolute left-4 top-24 bottom-24 z-20 flex flex-col justify-center pointer-events-none"
      >
        <ColorPalette settings={settings} updateSettings={updateSettings} />
      </div>

      {/* 5. Center-Bottom Floating Dock (Main Drawing Tools bar) */}
      <div
        ref={toolbarRef}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-[90vw] pointer-events-none"
      >
        <Toolbar
          activeTool={activeTool}
          setActiveTool={(tool) => {
            setActiveTool(tool);
            // Clear selections if switched to drawing tools
            if (tool !== 'pointer') {
              setSelectedElementIds([]);
            }
          }}
          settings={settings}
          updateSettings={updateSettings}
        />
      </div>

      {/* 6. Right-Bottom Floating Dock (Zoom and utilities controls panel) */}
      <div
        ref={controlsRef}
        className="absolute right-4 bottom-6 z-20 pointer-events-none"
      >
        <CanvasControls
          canvasState={canvasState}
          setCanvasState={setCanvasState}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onImportImageFile={handleImportImageFile}
          onImportImageUrl={(url) => handleImportImageUrl(url)}
          theme={settings.theme}
          toggleTheme={toggleTheme}
          onOpenShare={() => setShowShare(true)}
          onExportPng={handleExportPng}
        />
      </div>

      {/* 7. Dialogs & Modals Overlays */}
      {showShare && (
        <ShareDialog
          elements={elements}
          onImport={handleShareImport}
          onClose={() => setShowShare(false)}
        />
      )}

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 text-gray-800 dark:text-gray-200 flex flex-col gap-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Instrukcja nawigacji</span>
            </h3>
            <ul className="text-xs space-y-2.5 text-gray-600 dark:text-gray-400 leading-relaxed list-disc list-inside">
              <li><strong>Poruszanie się po tablicy:</strong> Przeciągnij dwoma palcami poziomo na gładziku lub przytrzymaj prawy/środkowy przycisk myszy i draguj.</li>
              <li><strong>Przybliżanie i oddalanie:</strong> Kręć kółkiem myszy (scroll góra/dół) bezpośrednio. Możesz też kliknąć wskaźnik procentowy w konsoli.</li>
              <li><strong>Zaznaczanie:</strong> Narzędziem Pointer kliknij na element lub przeciągnij nad wieloma, aby utworzyć obszar zaznaczenia.</li>
              <li><strong>Transformacje:</strong> Przeciągaj krawędzie zaznaczonego wektora, aby go skalować, lub kółko na górze, aby nim obracać.</li>
              <li><strong>Klawisze skrótu:</strong> <kbd className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono text-[10px]">Del</kbd> usuwa zaznaczenie, a strzałki pozwalają przesuwać elementy o pojedyncze piksele.</li>
            </ul>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Rozumiem!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
