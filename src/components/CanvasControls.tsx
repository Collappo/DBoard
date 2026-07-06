import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload as UploadIcon,
  Sun,
  Moon,
  Compass,
  Download
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
  onImportImageFile: (file: File) => void;
  onImportImageUrl: (url: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenShare: () => void;
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
  onImportImageFile,
  onImportImageUrl,
  theme,
  toggleTheme,
  onOpenShare,
  onExportPng,
}: CanvasControlsProps) {
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => {
    setCanvasState((prev) => ({ ...prev, zoom: Math.min(4, Number((prev.zoom + 0.1).toFixed(1))) }));
  };

  const handleZoomOut = () => {
    setCanvasState((prev) => ({ ...prev, zoom: Math.max(0.2, Number((prev.zoom - 0.1).toFixed(1))) }));
  };

  const handleZoomReset = () => {
    setCanvasState((prev) => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
    setShowImageMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportImageFile(file);
    }
    // Clear input to allow re-uploading same file
    e.target.value = '';
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      onImportImageUrl(imageUrl.trim());
      setImageUrl('');
      setShowLinkInput(false);
      setShowImageMenu(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 items-end pointer-events-none">
      
      {/* Inline Link Prompt Menu (nad przyciskiem importu) */}
      {showLinkInput && (
        <form
          onSubmit={handleUrlSubmit}
          className="flex items-center gap-2 p-2 rounded-2xl glass-panel shadow-lg pointer-events-auto animate-in fade-in slide-in-from-bottom-2 text-xs border border-gray-200/50 dark:border-gray-800/50 text-gray-800 dark:text-gray-200"
        >
          <input
            type="url"
            placeholder="Wklej bezpośredni URL obrazka/gifa..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 w-60 outline-none text-xs"
            autoFocus
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors"
          >
            Dodaj
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1 py-1 cursor-pointer"
          >
            Anuluj
          </button>
        </form>
      )}

      {/* Submenu for Image Selection */}
      {showImageMenu && !showLinkInput && (
        <div className="flex flex-col gap-1 p-1.5 rounded-2xl glass-panel shadow-lg pointer-events-auto animate-in fade-in slide-in-from-bottom-2 text-xs border border-gray-200/50 dark:border-gray-800/50 w-44">
          <button
            onClick={triggerFileInput}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 cursor-pointer text-left text-gray-700 dark:text-gray-300 transition-colors"
          >
            <UploadIcon className="w-4 h-4" />
            <span>Z dysku lokalnego</span>
          </button>
          <button
            onClick={() => setShowLinkInput(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 cursor-pointer text-left text-gray-700 dark:text-gray-300 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Z linku (URL / GIF)</span>
          </button>
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-0.5" />
          <button
            onClick={() => setShowImageMenu(false)}
            className="text-center py-1 rounded-lg text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer transition-colors"
          >
            Zamknij
          </button>
        </div>
      )}

      {/* Primary Action Panel (Główna wisząca konsola) */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-[20px] glass-panel shadow-2xl pointer-events-auto border border-gray-200/50 dark:border-gray-800/50">
        
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
          {/* Add Image */}
          <button
            onClick={() => {
              setShowImageMenu(!showImageMenu);
              setShowLinkInput(false);
            }}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all active:scale-90"
            title="Dodaj obrazek (lub animated GIF)"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          
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
            onClick={onOpenShare}
            className="bg-[#6366f1] hover:bg-[#5254df] text-white rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.25)] active:scale-95"
            title="Udostępnij projekt"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Udostępnij</span>
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/gif"
        className="hidden"
      />
    </div>
  );
}
