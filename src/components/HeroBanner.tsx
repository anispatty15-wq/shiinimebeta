'use client';
// src/components/HeroBanner.tsx
// ─────────────────────────────────────────────────────────────
// Animated hero banner with GIF slideshow.
// - Auto-cycles every 4 seconds
// - All GIFs are cropped to portrait (object-position: top center)
//   so landscape GIFs auto-fill in portrait mode
// - Dots indicator for slide position
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

// GIF files placed in /public/
const SLIDES = [
  { src: '/home 1.gif', alt: 'Anime character 1' },
  { src: '/home 2.gif', alt: 'Anime character 2' },
  { src: '/home 3.gif', alt: 'Anime character 3' },
];

const INTERVAL = 4_000;

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [fading,  setFading]  = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
        setFading(false);
      }, 400);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current]!;

  return (
    <div className="relative w-full overflow-hidden mb-5"
      style={{ height: 'clamp(160px, 40vw, 240px)' }}>

      {/* Background blur layer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.src}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-30 transition-opacity duration-500"
        style={{ objectPosition: 'center top' }}
      />

      {/* Main GIF — portrait crop from top */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={slide.src}
        src={slide.src}
        alt={slide.alt}
        className={clsx(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-400',
          fading ? 'opacity-0' : 'opacity-100'
        )}
        style={{ objectPosition: 'center 15%' }}
      />

      {/* Gradient overlay — bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 300); }}
            aria-label={`Slide ${i + 1}`}
            className={clsx(
              'rounded-full transition-all duration-300',
              i === current
                ? 'w-5 h-1.5 bg-cyan shadow-glow-c'
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
            )}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-3 right-3 z-10 text-[0.6rem] font-mono text-white/60 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
        {current + 1}/{SLIDES.length}
      </div>
    </div>
  );
}
