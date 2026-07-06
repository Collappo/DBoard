import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
  MousePointer,
  Pencil,
  Sparkles,
  Square,
  Circle,
  Triangle,
  Star,
  Type,
  PaintBucket,
  Eraser,
  TypeIcon,
  AlignLeft,
  Check,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload as UploadIcon
} from 'lucide-react';
import { ToolType, BoardSettings } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  settings: BoardSettings;
  updateSettings: (settings: Partial<BoardSettings>) => void;
  onImportImageFile: (file: File) => void;
  onImportImageUrl: (url: string) => void;
}

export default function Toolbar({
  activeTool,
  setActiveTool,
  settings,
  updateSettings,
  onImportImageFile,
  onImportImageUrl,
}: ToolbarProps) {
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowImageMenu(false);
    setShowLinkInput(false);

    // Spring pop animation on active tool icon
    const activeBtnIcon = document.querySelector(`#tool-btn-${activeTool} svg`);
    if (activeBtnIcon) {
      gsap.killTweensOf(activeBtnIcon);
      gsap.fromTo(activeBtnIcon, 
        { scale: 0.65 }, 
        { scale: 1, duration: 0.4, ease: 'back.out(2.2)' }
      );
    }
  }, [activeTool]);

  useEffect(() => {
    if (showImageMenu) {
      const imgIcon = document.querySelector(`#btn-image-import svg`);
      if (imgIcon) {
        gsap.killTweensOf(imgIcon);
        gsap.fromTo(imgIcon, 
          { scale: 0.65 }, 
          { scale: 1, duration: 0.4, ease: 'back.out(2.2)' }
        );
      }
    }
  }, [showImageMenu]);

  const showStrokeSettings = activeTool !== 'pointer' && activeTool !== 'eraser' && activeTool !== 'text';
  const showTextSettings = activeTool === 'text';
  const showSmoothingSettings = activeTool === 'brush';

  useEffect(() => {
    if (contextualRef.current) {
      gsap.killTweensOf(contextualRef.current);
      gsap.fromTo(
        contextualRef.current,
        { y: 15, scale: 0.94, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.2)' }
      );
    }
  }, [showStrokeSettings, showTextSettings, showSmoothingSettings, showImageMenu, showLinkInput]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
    setShowImageMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportImageFile(file);
    }
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
  const tools = [
    { id: 'pointer' as ToolType, label: 'Wskaźnik', icon: MousePointer },
    { id: 'brush' as ToolType, label: 'Pędzel', icon: Pencil },
    { id: 'spray' as ToolType, label: 'Spray', icon: Sparkles },
    { id: 'rect' as ToolType, label: 'Kwadrat', icon: Square },
    { id: 'circle' as ToolType, label: 'Kółko', icon: Circle },
    { id: 'triangle' as ToolType, label: 'Trójkąt', icon: Triangle },
    { id: 'star' as ToolType, label: 'Gwiazda', icon: Star },
    { id: 'text' as ToolType, label: 'Tekst', icon: Type },
    { id: 'bucket' as ToolType, label: 'Wypełnienie', icon: PaintBucket },
    { id: 'eraser' as ToolType, label: 'Gumka', icon: Eraser },
  ];

  const strokeWidths = [1, 2, 4, 8, 12, 16, 24];
  const fontSizes = [12, 16, 20, 24, 32, 40, 48, 64];
  const fontFamilies = [
    { id: 'var(--font-sans)', label: 'Sans' },
    { id: 'var(--font-serif)', label: 'Serif' },
    { id: 'var(--font-mono)', label: 'Mono' },
  ];

  return (
    <div className="flex flex-col items-center gap-3 w-full pointer-events-none">
      {/* Contextual Floating Settings Menu (górna belka narzędziowa) */}
      {(showStrokeSettings || showTextSettings || showSmoothingSettings || showImageMenu) && (
        <div
          ref={contextualRef}
          className="flex items-center gap-4 px-4 py-2 rounded-2xl glass-panel shadow-lg pointer-events-auto text-sm text-gray-700 dark:text-gray-300"
        >
          
          {/* Image Import Options */}
          {showImageMenu && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              {showLinkInput ? (
                <form
                  onSubmit={handleUrlSubmit}
                  className="flex items-center gap-2 text-xs pointer-events-auto"
                >
                  <input
                    type="url"
                    placeholder="Wklej bezpośredni URL obrazka/gifa..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 w-60 outline-none text-xs text-gray-800 dark:text-gray-200 focus:border-indigo-500"
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
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 cursor-pointer font-medium"
                  >
                    Wróć
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3 pointer-events-auto">
                  <span className="text-xs font-semibold text-gray-400">Dodaj obrazek:</span>
                  <button
                    onClick={triggerFileInput}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 cursor-pointer text-gray-700 dark:text-gray-300 transition-colors font-medium"
                  >
                    <UploadIcon className="w-4 h-4 text-[#6366f1]" />
                    <span>Z dysku</span>
                  </button>
                  <button
                    onClick={() => setShowLinkInput(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 cursor-pointer text-gray-700 dark:text-gray-300 transition-colors font-medium"
                  >
                    <LinkIcon className="w-4 h-4 text-[#6366f1]" />
                    <span>Z linku URL / GIF</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stroke Width Selector */}
          {showStrokeSettings && !showImageMenu && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Grubość:</span>
              <div className="flex gap-1">
                {strokeWidths.map((w) => (
                  <button
                    key={w}
                    onClick={() => updateSettings({ strokeWidth: w })}
                    className={`flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                      settings.strokeWidth === w
                        ? 'bg-gray-100 dark:bg-gray-800 font-bold border border-gray-300 dark:border-gray-600'
                        : ''
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider if both settings are shown */}
          {showStrokeSettings && showSmoothingSettings && !showImageMenu && (
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
          )}

          {/* Brush Smoothing Toggle */}
          {showSmoothingSettings && !showImageMenu && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.brushSmoothing}
                onChange={(e) => updateSettings({ brushSmoothing: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-transparent border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Wyrównywanie linii</span>
            </label>
          )}

          {/* Text-specific font family & style selector */}
          {showTextSettings && !showImageMenu && (
            <div className="flex items-center gap-4">
              {/* Font Family */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">Czcionka:</span>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                  className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-500 cursor-pointer text-gray-800 dark:text-gray-200"
                >
                  {fontFamilies.map((ff) => (
                    <option key={ff.id} value={ff.id} className="text-black bg-white dark:bg-gray-900 dark:text-white">
                      {ff.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

              {/* Font Size */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">Rozmiar:</span>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                  className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-500 cursor-pointer text-gray-800 dark:text-gray-200"
                >
                  {fontSizes.map((sz) => (
                    <option key={sz} value={sz} className="text-black bg-white dark:bg-gray-900 dark:text-white">
                      {sz}px
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

              {/* Bold & Italic Toggles */}
              <div className="flex gap-1">
                <button
                  onClick={() => updateSettings({ fontWeight: settings.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`w-7 h-7 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors cursor-pointer ${
                    settings.fontWeight === 'bold' ? 'bg-gray-200 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                  title="Pogrubienie"
                >
                  B
                </button>
                <button
                  onClick={() => updateSettings({ fontStyle: settings.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  className={`w-7 h-7 italic font-serif rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors cursor-pointer ${
                    settings.fontStyle === 'italic' ? 'bg-gray-200 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                  title="Kursywa"
                >
                  I
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main floating bar (dolny dok) */}
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-[20px] glass-panel shadow-2xl pointer-events-auto transition-transform hover:scale-[1.01] active:scale-[0.99] border border-gray-200/50 dark:border-gray-800/50">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`relative flex items-center justify-center w-11 h-11 rounded-[14px] cursor-pointer transition-all duration-200 group ${
                isActive
                  ? 'bg-[#6366f1] text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'text-gray-600 dark:text-[#a1a1aa] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
              id={`tool-btn-${tool.id}`}
            >
              <IconComponent className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs py-1 px-2.5 rounded-lg font-medium whitespace-nowrap shadow-md pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
                {tool.label}
              </div>
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 self-center mx-1" />

        {/* Add Image Button */}
        <button
          id="btn-image-import"
          onClick={() => {
            setShowImageMenu(!showImageMenu);
            setShowLinkInput(false);
          }}
          className={`relative flex items-center justify-center w-11 h-11 rounded-[14px] cursor-pointer transition-all duration-200 group ${
            showImageMenu
              ? 'bg-[#6366f1] text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
              : 'text-gray-600 dark:text-[#a1a1aa] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
          }`}
          title="Dodaj własny obrazek (lub animated GIF)"
        >
          <ImageIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs py-1 px-2.5 rounded-lg font-medium whitespace-nowrap shadow-md pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
            Dodaj obrazek
          </div>
        </button>
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
