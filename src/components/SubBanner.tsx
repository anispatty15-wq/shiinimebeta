'use client';
// src/components/SubBanner.tsx

import { useEffect, useState } from 'react';
import { X, Youtube, Bell } from 'lucide-react';
import { clsx } from 'clsx';

const CHANNEL_URL  = 'https://www.youtube.com/@4nzzz2003';
const CHANNEL_NAME = 'AnzzzSenpai';
const DISMISS_KEY  = 'Anzzzmissed';
const SHOW_DELAY   = 2_000;
const AUTO_HIDE    = 15_000;

function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
    // Muncul lagi setiap 30 menit
    return Date.now() - ts < 30 * 60 * 1000;
  } catch { return false; }
}

function saveDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /**/ }
}

export default function SubBanner() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Keep the promo available on mobile as well; it is dismissed for the
    // current view and can appear again after the cooldown.
    if (wasDismissedRecently() && window.innerWidth >= 768) return;
    const t1 = setTimeout(() => setVisible(true), SHOW_DELAY);
    const t2 = setTimeout(() => dismiss(), SHOW_DELAY + AUTO_HIDE);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    setLeaving(true);
    saveDismissed();
    setTimeout(() => setVisible(false), 350);
  };

  if (!visible) return null;

  return (
    <>
      {/* Inject dance keyframes */}
      <style>{`
        @keyframes sub-slide-in {
          from { opacity: 0; transform: translateX(-60px) translateY(20px); }
          to   { opacity: 1; transform: translateX(0) translateY(0); }
        }
        @keyframes sub-slide-out {
          from { opacity: 1; transform: translateX(0) translateY(0); }
          to   { opacity: 0; transform: translateX(-60px) translateY(20px); }
        }
        .sub-enter { animation: sub-slide-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .sub-leave { animation: sub-slide-out 0.35s ease-in forwards; }
      `}</style>

      <div
        className={clsx(
          'fixed bottom-[5.5rem] left-2 z-[55] flex max-w-[calc(100vw-1rem)] items-end gap-1.5 pointer-events-none md:bottom-20 md:left-3',
          leaving ? 'sub-leave' : 'sub-enter'
        )}
        aria-live="polite"
      >
        {/* Dancing character */}
        <div className="pointer-events-none select-none mb-1" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/09b085a6b0b33a9a9c8529a3d2ee1914.gif"
            alt="dancing character"
            className="h-16 w-16 object-contain drop-shadow-lg sm:h-20 sm:w-20"
            style={{ imageRendering: 'auto' }}
          />
        </div>

        {/* Card */}
        <div className="pointer-events-auto relative w-[min(13rem,calc(100vw-5.5rem))] rounded-2xl border border-border bg-surface p-3.5 shadow-2xl">
          {/* X button */}
          <button
            onClick={dismiss}
            aria-label="Tutup notifikasi"
            className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-surface border border-border text-muted hover:text-primary transition-colors flex items-center justify-center shadow-md z-10"
          >
            <X className="w-3 h-3" aria-hidden />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 shadow">
              <Youtube className="w-4 h-4 text-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-primary">{CHANNEL_NAME}</p>
              <p className="text-[0.62rem] text-muted">YouTube Channel</p>
            </div>
          </div>

          <p className="text-[0.68rem] text-secondary leading-relaxed mb-3">
            Subscribe dan dukung developer thanks all
          </p>

          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[0.72rem] font-bold transition-colors shadow"
          >
            <Bell className="w-3.5 h-3.5" aria-hidden />
            Subscribe
          </a>

          <button
            onClick={dismiss}
            className="w-full text-center text-[0.6rem] text-muted/60 hover:text-muted mt-1.5 transition-colors"
          >
            Tidak sekarang
          </button>
        </div>
      </div>
    </>
  );
}
