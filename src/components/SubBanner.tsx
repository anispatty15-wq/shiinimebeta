'use client';
// src/components/SubBanner.tsx

import { useEffect, useState } from 'react';
import { X, Youtube, Bell } from 'lucide-react';
import { clsx } from 'clsx';

const CHANNEL_URL  = 'https://www.youtube.com/watch?v=r7iv6KPxLQI&list=PLBFDkubfUiBo
const CHANNEL_NAME = 'AnzzzSenpai
const DISMISS_KEY  = 'Anzzzmissed';
const SHOW_DELAY   = 5_000;
const AUTO_HIDE    = 15_000;

function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
    return Date.now() - ts < 7 * 24 * 60 * 60 * 1000;
  } catch { return false; }
}

function saveDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /**/ }
}

export default function SubBanner() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (wasDismissedRecently()) return;
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
          'fixed bottom-20 left-3 z-[55] flex items-end gap-1.5 pointer-events-none',
          leaving ? 'sub-leave' : 'sub-enter'
        )}
        aria-live="polite"
      >
        {/* Dancing character */}
        <div className="pointer-events-none select-none mb-1" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/character-dance.gif"
            alt="dancing character"
            className="w-20 h-20 object-contain drop-shadow-lg"
            style={{ imageRendering: 'auto' }}
          />
        </div>

        {/* Card */}
        <div className="pointer-events-auto relative bg-surface border border-border rounded-2xl shadow-2xl p-3.5 w-52">
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
            Subscribe untuk update anime terbaru & konten seru! 🎌✨
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
