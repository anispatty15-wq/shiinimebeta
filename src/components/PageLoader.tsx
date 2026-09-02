'use client';
// src/components/PageLoader.tsx
// ─────────────────────────────────────────────────────────────
// Animated loading overlay — shows on page navigation.
// Spinner: rotating glow ring like modern web loaders.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

export default function PageLoader() {
  const pathname  = usePathname();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show loader on route change
    setLoading(true);
    setVisible(true);

    const hide = setTimeout(() => {
      setLoading(false);
      // Keep visible a bit longer for fade-out
      setTimeout(() => setVisible(false), 400);
    }, 600);

    return () => clearTimeout(hide);
  }, [pathname]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes spin-glow {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.15; transform: scale(0.95); }
          50%       { opacity: 0.4;  transform: scale(1.05); }
        }
        @keyframes loader-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes loader-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .loader-wrap {
          animation: loader-fade-in 0.15s ease forwards;
        }
        .loader-wrap.hiding {
          animation: loader-fade-out 0.4s ease forwards;
        }
        .spin-ring {
          animation: spin-glow 0.9s linear infinite;
        }
        .pulse-ring {
          animation: pulse-ring 1.2s ease-in-out infinite;
        }
        /* Top progress bar */
        @keyframes progress-bar {
          0%   { width: 0%;   opacity: 1; }
          70%  { width: 85%;  opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        .progress-bar {
          animation: progress-bar 0.7s ease-out forwards;
        }
      `}</style>

      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-0.5">
        <div className="progress-bar h-full bg-gradient-to-r from-cyan via-violet to-cyan shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
      </div>

      {/* Center overlay */}
      <div className={clsx(
        'fixed inset-0 z-[99] flex items-center justify-center pointer-events-none',
        'loader-wrap',
        !loading && 'hiding'
      )}>
        {/* Very subtle dark overlay */}
        <div className="absolute inset-0 bg-bg/40 backdrop-blur-[2px]" />

        {/* Spinner */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Outer pulse ring */}
          <div className="pulse-ring absolute w-20 h-20 rounded-full border border-cyan/20" />

          {/* Spinning glow ring */}
          <div className="spin-ring w-14 h-14 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(0,217,255,0.8) 40%, rgba(139,92,246,0.8) 70%, transparent 100%)',
              padding: '2px',
            }}>
            {/* Inner dark circle */}
            <div className="w-full h-full rounded-full bg-bg" />
          </div>

          {/* Logo center */}
          <div className="absolute flex items-center justify-center">
            <span className="text-xs font-bold text-cyan tracking-widest select-none">S</span>
          </div>
        </div>
      </div>
    </>
  );
}
