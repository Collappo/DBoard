import React, { useState } from 'react';
import { Share2, Download, Upload, Clipboard, Check, AlertTriangle, X } from 'lucide-react';
import { BoardElement, BoardSettings } from '../types';

interface ShareDialogProps {
  elements: BoardElement[];
  onImport: (importedElements: BoardElement[], mode: 'replace' | 'append') => void;
  onClose: () => void;
}

export default function ShareDialog({ elements, onImport, onClose }: ShareDialogProps) {
  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [pendingImportData, setPendingImportData] = useState<BoardElement[] | null>(null);

  // Generate Base64 export code of canvas elements
  const generateExportCode = (): string => {
    try {
      // We strip out temporary HTMLImageElements before serialization
      const strippedElements = elements.map(el => {
        const { ...rest } = el;
        // Keep everything else
        return rest;
      });
      
      const payload = {
        v: 1, // version
        elements: strippedElements,
      };
      
      const jsonStr = JSON.stringify(payload);
      // Base64 encode (utf-8 safe encoding)
      return btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (err) {
      console.error('Failed to export:', err);
      return '';
    }
  };

  const handleCopy = () => {
    const code = generateExportCode();
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleParseImport = () => {
    setError('');
    if (!importCode.trim()) {
      setError('Wklej kod przed zaimportowaniem.');
      return;
    }

    try {
      // Base64 decode (utf-8 safe decoding)
      const decodedStr = decodeURIComponent(escape(atob(importCode.trim())));
      const parsed = JSON.parse(decodedStr);
      
      if (!parsed || !Array.isArray(parsed.elements)) {
        throw new Error('Nieprawidłowy format kodu.');
      }

      setPendingImportData(parsed.elements);
    } catch (err) {
      setError('Nieprawidłowy lub uszkodzony kod tablicy. Upewnij się, że skopiowałeś cały tekst.');
    }
  };

  const executeImport = (mode: 'replace' | 'append') => {
    if (pendingImportData) {
      onImport(pendingImportData, mode);
      setPendingImportData(null);
      setImportCode('');
      onClose();
    }
  };

  const exportCode = generateExportCode();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 flex flex-col gap-5 text-gray-800 dark:text-gray-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold tracking-tight">Udostępnij / Importuj tablicę</h2>
        </div>

        {/* Export Section */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Wyeksportuj swój projekt</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={exportCode}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-mono outline-none text-gray-600 dark:text-gray-400 select-all overflow-ellipsis whitespace-nowrap"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-1.5 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Skopiowane!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" />
                  <span>Kopiuj kod</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
            Skopiuj ten unikalny kod i wyślij go znajomemu, aby mógł wczytać Twoje płótno.
          </p>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

        {/* Import Section */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Zaimportuj z kodu</label>
          <textarea
            rows={3}
            placeholder="Wklej tutaj otrzymany kod..."
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-xs font-mono outline-none focus:border-indigo-500 text-gray-800 dark:text-gray-200 resize-none"
          />
          {error && (
            <span className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </span>
          )}
          <button
            onClick={handleParseImport}
            className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Weryfikuj kod
          </button>
        </div>

        {/* Import confirmation prompt dialog overlay */}
        {pendingImportData && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-3xl p-6 flex flex-col justify-between z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Potwierdź import zawartości</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Kod zawiera <strong className="text-indigo-600 dark:text-indigo-400">{pendingImportData.length}</strong> elementów. Co chcesz zrobić z istniejącą zawartością swojego płótna?
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => executeImport('replace')}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
              >
                Zastąp obecną zawartość (Usuń stare)
              </button>
              <button
                onClick={() => executeImport('append')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
              >
                Dodaj obok (Nałóż na obecne)
              </button>
              <button
                onClick={() => setPendingImportData(null)}
                className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
