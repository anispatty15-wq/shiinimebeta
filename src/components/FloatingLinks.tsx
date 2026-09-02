'use client';
// src/components/FloatingLinks.tsx
// ─────────────────────────────────────────────────────────────
// Floating side buttons — left side of screen
// Currently includes:
//   • Wuwa Tracker popup
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { X, ExternalLink, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const WUWA_URL = 'https://wutheringwaves.kurogames.com/en/main';

export default function FloatingLinks() {
  const [wuwaOpen,    setWuwaOpen]    = useState(false);
  const [wuwaVisible, setWuwaVisible] = useState(true); // can hide permanently for session

  if (!wuwaVisible) return null;

  return (
    <div className="fixed left-0 bottom-32 z-[54] flex flex-col items-start gap-2">

      {/* ── Wuwa button + popup ── */}
      <div className="flex items-center">

        {/* Popup card — slides in from left */}
        <div className={clsx(
          'transition-all duration-300 origin-left overflow-hidden',
          wuwaOpen
            ? 'w-56 opacity-100 translate-x-0'
            : 'w-0 opacity-0 -translate-x-4 pointer-events-none'
        )}>
          <div className="ml-1 bg-surface border border-border rounded-r-2xl shadow-2xl p-3 relative">
            {/* Close card */}
            <button
              onClick={() => setWuwaOpen(false)}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-surface-2 text-muted hover:text-primary flex items-center justify-center transition-colors"
              aria-label="Tutup"
            >
              <X className="w-3 h-3" aria-hidden />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pr-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wuwa.gif"
                alt="Wuwa"
                className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-primary">Wuthering Waves</p>
                <p className="text-[0.62rem] text-muted">Tracker & Info</p>
              </div>
            </div>

            <p className="text-[0.68rem] text-secondary leading-relaxed mb-3">
              Cek tracker Wuthering Waves, banner, tier list, dan info karakter terbaru! ⚔️
            </p>

            {/* CTA */}
            <a
              href={WUWA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setWuwaOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white text-[0.72rem] font-bold transition-all shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              Buka Wuwa Tracker
            </a>

            {/* Hide option */}
            <button
              onClick={() => { setWuwaOpen(false); setWuwaVisible(false); }}
              className="w-full text-center text-[0.6rem] text-muted/60 hover:text-muted mt-1.5 transition-colors"
            >
              Sembunyikan
            </button>
          </div>
        </div>

        {/* Tab button — always visible on left edge */}
        <button
          onClick={() => setWuwaOpen((v) => !v)}
          aria-label={wuwaOpen ? 'Tutup Wuwa' : 'Buka Wuwa Tracker'}
          className={clsx(
            'flex flex-col items-center justify-center gap-1',
            'w-10 rounded-r-xl shadow-lg transition-all duration-200',
            'border border-l-0 border-border bg-surface hover:bg-surface-2',
            wuwaOpen ? 'py-2' : 'py-3'
          )}
        >
          {/* Wuwa animated logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/wuwa.gif"
            alt="Wuwa"
            className="w-7 h-7 rounded-full object-cover"
          />
          <ChevronRight
            className={clsx(
              'w-3 h-3 text-muted transition-transform duration-200',
              wuwaOpen && 'rotate-180'
            )}
            aria-hidden
          />
        </button>
      </div>

    </div>
  );
}
