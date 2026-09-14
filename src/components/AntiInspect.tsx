'use client';
// src/components/AntiInspect.tsx
// ─────────────────────────────────────────────────────────────
// Discourages casual inspection:
//   • Disables right-click context menu
//   • Blocks F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S shortcuts
//   • Disables text selection on non-input elements
//
// NOTE: This is a deterrent only — determined developers
// can always bypass these measures via browser menu or
// extensions. This is standard practice for streaming sites.
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react';

export default function AntiInspect() {
  useEffect(() => {
    // ── Disable right-click ────────────────────────────────
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // ── Block DevTools keyboard shortcuts ─────────────────
    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key?.toUpperCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // F12
      if (key === 'F12') { e.preventDefault(); return false; }
      // Ctrl+Shift+I (DevTools)
      if (ctrl && shift && key === 'I') { e.preventDefault(); return false; }
      // Ctrl+Shift+J (Console)
      if (ctrl && shift && key === 'J') { e.preventDefault(); return false; }
      // Ctrl+Shift+C (Inspector)
      if (ctrl && shift && key === 'C') { e.preventDefault(); return false; }
      // Ctrl+U (View Source)
      if (ctrl && key === 'U') { e.preventDefault(); return false; }
      // Ctrl+S (Save page)
      if (ctrl && key === 'S') { e.preventDefault(); return false; }
      // Ctrl+A (Select all) — optional, remove if too aggressive
      // if (ctrl && key === 'A') { e.preventDefault(); return false; }
    };

    // ── Disable drag on images ─────────────────────────────
    const blockDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown',     blockKeys,        { capture: true });
    document.addEventListener('dragstart',   blockDrag);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown',     blockKeys,     { capture: true });
      document.removeEventListener('dragstart',   blockDrag);
    };
  }, []);

  // Inject global CSS to disable text selection & image save
  return (
    <style>{`
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
      }
      input, textarea, [contenteditable] {
        -webkit-user-select: text !important;
        user-select: text !important;
      }
      img {
        pointer-events: none;
        -webkit-user-drag: none;
        user-drag: none;
      }
    `}</style>
  );
}
