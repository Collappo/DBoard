import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Trash2,
  Upload as UploadIcon,
  Sun,
  Moon,
  Compass,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { CanvasState } from '../types';

interface CanvasControlsProps {
  canvasState: CanvasState;
  setCanvasState: React.Dispatch<React.SetStateAction<CanvasState>>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenShareExport: () => void;
  onOpenShareImport: () => void;
  onExportPng: () => void;
}

export default function CanvasControls({
  canvasState,
  setCanvasState,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  theme,
  toggleTheme,
  onOpenShareExport,
  onOpenShareImport,
  onExportPng,
}: CanvasControlsProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { scale: 0.95, opacity: 0.7 },
        { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.2)' }
      );
    }
  }, [isMinimized]);

  const handleZoomIn = () => {
    setCanvasState((prev) => ({ ...prev, zoom: Math.min(4, Number((prev.zoom + 0.1).toFixed(1))) }));
  };

  const handleZoomOut = () => {
    setCanvasState((prev) => ({ ...prev, zoom: Math.max(0.2, Number((prev.zoom - 0.1).toFixed(1))) }));
  };

  const handleZoomReset = () => {
    setCanvasState((prev) => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));
  };

  return (
    <div className="flex flex-col gap-2.5 items-end pointer-events-none">

      {/* Primary Action Panel (Główna wisząca konsola) */}
      <div
        ref={panelRef}
        className="flex items-center gap-2 rounded-[20px] glass-panel shadow-2xl pointer-events-auto border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
      >
        {isMinimized ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all active:scale-90"
              title="Maksymalizuj panel"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs font-mono font-semibold px-2 text-gray-700 dark:text-gray-300">
              {Math.round(canvasState.zoom * 100)}%
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2">
            {/* Undo/Redo Group */}
            <div className="flex items-center gap-1 bg-gray-100/60 dark:bg-white/5 rounded-xl p-0.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  canUndo
                    ? 'text-gray-700 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 cursor-pointer active:scale-90'
                    : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                }`}
                title="Cofnij"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  canRedo
                    ? 'text-gray-700 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 cursor-pointer active:scale-90'
                    : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                }`}
                title="Ponów"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleZoomOut}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all active:scale-90"
                title="Oddal"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleZoomReset}
                className="text-xs font-mono font-medium px-2 py-1 rounded-[10px] hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all min-w-[44px] text-center"
                title="Reset widoku"
              >
                {Math.round(canvasState.zoom * 100)}%
              </button>

              <button
                onClick={handleZoomIn}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all active:scale-90"
                title="Przybliż"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />

            {/* Media & Sharing Controls */}
            <div className="flex items-center gap-1">
              {/* Export PNG */}
              <button
                onClick={onExportPng}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all active:scale-90"
                title="Eksportuj do PNG (przycięty automatycznie)"
              >
                <Download className="w-4 h-4" />
              </button>
              
              {/* Clean Canvas */}
              <button
                onClick={onClear}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer transition-all active:scale-90"
                title="Wyczyść całą tablicę"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />

            {/* Theme and Share */}
            <div className="flex items-center gap-1.5">
              {/* Theme Switcher */}
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all active:scale-90"
                title="Zmień motyw jasny/ciemny"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* Share Board */}
              <button
                onClick={onOpenShareExport}
                className="bg-[#6366f1] hover:bg-[#5254df] text-white rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.25)] active:scale-95"
                title="Udostępnij projekt (wyeksportuj kod)"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Udostępnij</span>
              </button>

              {/* Import Board */}
              <button
                onClick={onOpenShareImport}
                className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Importuj projekt z kodu"
              >
                <UploadIcon className="w-3.5 h-3.5" />
                <span>Importuj</span>
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />

            {/* Minimize button */}
            <button
              onClick={() => setIsMinimized(true)}
              className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all active:scale-90"
              title="Zminimalizuj panel"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
