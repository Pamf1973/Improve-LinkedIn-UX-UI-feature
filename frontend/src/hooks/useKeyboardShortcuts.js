import { useEffect } from 'react';

export function useKeyboardShortcuts({ onSwipeLeft, onSwipeRight, onSwipeDown, onOpenDetails, activeView, modalOpen }) {
  useEffect(() => {
    const handler = (e) => {
      if (modalOpen || activeView !== 'stack') return;
      if (document.activeElement?.tagName === 'INPUT') return;
      switch (e.key) {
        case 'ArrowRight': onSwipeRight?.(); break;
        case 'ArrowLeft': onSwipeLeft?.(); break;
        case 'ArrowDown': e.preventDefault(); onSwipeDown?.(); break;
        case ' ': e.preventDefault(); onOpenDetails?.(); break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onSwipeLeft, onSwipeRight, onSwipeDown, onOpenDetails, activeView, modalOpen]);
}
