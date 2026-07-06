import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Palette, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { BoardSettings } from '../types';

interface ColorPaletteProps {
  settings: BoardSettings;
  updateSettings: (settings: Partial<BoardSettings>) => void;
}

export default function ColorPalette({ settings, updateSettings }: ColorPaletteProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paletteRef.current) {
      gsap.fromTo(
        paletteRef.current,
        { scale: 0.95, opacity: 0.7 },
        { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.2)' }
      );
    }
  }, [isMinimized]);

  const strokePresets = [
    '#000000', // Black
    '#ffffff', // White
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#ec4899', // Pink
  ];

  const fillPresets = [
    'transparent', // Transparent
    '#ffffff', // White
    '#f3f4f6', // Light gray
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#ec4899', // Pink
  ];

  return (
    <div
      ref={paletteRef}
      className="pointer-events-auto transition-all"
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 rounded-full glass-panel shadow-lg flex items-center justify-center text-gray-600 dark:text-[#a1a1aa] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-all active:scale-90 border border-gray-200/50 dark:border-gray-800/50"
          title="Maksymalizuj paletę kolorów"
        >
          <Palette className="w-5 h-5 animate-pulse" />
        </button>
      ) : (
        <div className="flex flex-col gap-4 p-5 rounded-[24px] glass-panel shadow-xl border border-gray-200/50 dark:border-gray-800/50 text-xs text-gray-700 dark:text-gray-300 w-[180px] relative">
          
          {/* Minimize button inside palette */}
          <button
            onClick={() => setIsMinimized(true)}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full glass-panel border border-gray-200/50 dark:border-gray-800/50 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer transition-all shadow-md active:scale-90"
            title="Zminimalizuj paletę kolorów"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Stroke Color Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-[#71717a]">Rysowanie</span>
              <div className="flex items-center">
                <input
                  type="color"
                  value={settings.color.startsWith('#') ? settings.color : '#000000'}
                  onChange={(e) => updateSettings({ color: e.target.value })}
                  className="w-5 h-5 rounded-full border-0 p-0 cursor-pointer overflow-hidden appearance-none"
                  style={{ backgroundColor: settings.color }}
                  title="Własny kolor"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {strokePresets.map((color) => (
                <button
                  key={color}
                  onClick={() => updateSettings({ color })}
                  className={`relative w-7 h-7 rounded-[8px] cursor-pointer transition-transform hover:scale-110 active:scale-95 border-2 ${
                    settings.color.toLowerCase() === color.toLowerCase()
                      ? 'border-indigo-500 dark:border-white shadow-md'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {settings.color.toLowerCase() === color.toLowerCase() && (
                    <div className={`absolute inset-0 flex items-center justify-center rounded-[6px] ${color === '#ffffff' ? 'text-black' : 'text-white'}`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-200/40 dark:bg-gray-800/60 my-0.5" />

          {/* Fill Color Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-[#71717a]">Wypełnienie</span>
              <div className="flex items-center">
                <input
                  type="color"
                  value={settings.fillColor && settings.fillColor.startsWith('#') ? settings.fillColor : '#ffffff'}
                  onChange={(e) => updateSettings({ fillColor: e.target.value })}
                  className="w-5 h-5 rounded-full border-0 p-0 cursor-pointer overflow-hidden appearance-none"
                  style={{ backgroundColor: settings.fillColor === 'transparent' ? '#ffffff' : settings.fillColor }}
                  disabled={settings.fillColor === 'transparent'}
                  title="Własny kolor"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {fillPresets.map((color) => {
                const isTransparent = color === 'transparent';
                const isActive = settings.fillColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    onClick={() => updateSettings({ fillColor: color })}
                    className={`relative w-7 h-7 rounded-[8px] cursor-pointer transition-transform hover:scale-110 active:scale-95 border-2 overflow-hidden ${
                      isActive
                        ? 'border-indigo-500 dark:border-white shadow-md'
                        : 'border-transparent'
                    }`}
                    style={{
                      backgroundColor: isTransparent ? 'transparent' : color,
                    }}
                    title={isTransparent ? 'Przezroczysty' : color}
                  >
                    {isTransparent && (
                      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-red-500 rotate-45" />
                      </div>
                    )}
                    {isActive && (
                      <div className={`absolute inset-0 flex items-center justify-center rounded-[6px] ${color === '#ffffff' || isTransparent ? 'text-black dark:text-white' : 'text-white'}`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
