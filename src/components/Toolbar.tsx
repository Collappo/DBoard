import React from 'react';
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
  Check
} from 'lucide-react';
import { ToolType, BoardSettings } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  settings: BoardSettings;
  updateSettings: (settings: Partial<BoardSettings>) => void;
}

export default function Toolbar({
  activeTool,
  setActiveTool,
  settings,
  updateSettings,
}: ToolbarProps) {
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

  // Check if we need to show context settings
  const showStrokeSettings = ['brush', 'rect', 'circle', 'triangle', 'star', 'eraser'].includes(activeTool);
  const showTextSettings = activeTool === 'text';
  const showSmoothingSettings = activeTool === 'brush';

  return (
    <div className="flex flex-col items-center gap-3 w-full pointer-events-none">
      {/* Contextual Floating Settings Menu (górna belka narzędziowa) */}
      {(showStrokeSettings || showTextSettings || showSmoothingSettings) && (
        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl glass-panel shadow-lg pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 text-sm text-gray-700 dark:text-gray-300">
          
          {/* Stroke Width Selector */}
          {showStrokeSettings && (
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
          {showStrokeSettings && showSmoothingSettings && (
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
          )}

          {/* Brush Smoothing Toggle */}
          {showSmoothingSettings && (
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
          {showTextSettings && (
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
      </div>
    </div>
  );
}
