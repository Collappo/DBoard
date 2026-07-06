import React, { useEffect, useRef } from 'react';
import { Info, X } from 'lucide-react';
import gsap from 'gsap';

interface InfoDialogProps {
  onClose: () => void;
}

export default function InfoDialog({ onClose }: InfoDialogProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Beautiful, GPU-accelerated spring entry animation
    if (backdropRef.current && modalRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      
      gsap.fromTo(
        modalRef.current,
        { scale: 0.9, y: 20, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.25)', delay: 0.05 }
      );
    }
  }, []);

  const handleClose = () => {
    if (backdropRef.current && modalRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.9,
        y: 15,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      });
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-800/50 text-gray-800 dark:text-gray-200 flex flex-col gap-4"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="w-4 h-4" />
        </button>

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
          onClick={handleClose}
          className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
        >
          Rozumiem!
        </button>
      </div>
    </div>
  );
}
