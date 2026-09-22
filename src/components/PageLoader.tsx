'use client';
// src/components/PageLoader.tsx
// Intro animation on first app load plus a slim progress bar for route changes.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [intro, setIntro] = useState(false);

  useEffect(() => {
    const isFirstLoad = !sessionStorage.getItem('shiinime-intro-seen');
    if (isFirstLoad) {
      sessionStorage.setItem('shiinime-intro-seen', 'true');
      setIntro(true);
      const introDone = setTimeout(() => setIntro(false), 2300);
      return () => clearTimeout(introDone);
    }

    setActive(true);
    setVisible(true);

    const done = setTimeout(() => {
      setActive(false);
      setTimeout(() => setVisible(false), 300);
    }, 500);

    return () => clearTimeout(done);
  }, [pathname]);

  if (!visible && !intro) return null;

  return (
    <>
      <style>{`
        @keyframes bar-slide {
          0%   { width: 0%;  opacity: 1; }
          60%  { width: 80%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        @keyframes bar-hide {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .page-bar {
          animation: bar-slide 0.5s ease-out forwards;
        }
        .page-bar.done {
          animation: bar-hide 0.3s ease forwards;
        }
        @keyframes intro-logo {
          0% { opacity: 0; transform: scale(0.45) rotate(-12deg); filter: blur(12px); }
          35% { opacity: 1; transform: scale(1.08) rotate(3deg); filter: blur(0); }
          58% { transform: scale(0.96) rotate(0); }
          78% { transform: scale(1) rotate(0); }
          100% { opacity: 0; transform: scale(1.18) translateY(-22px); filter: blur(5px); }
        }
        @keyframes intro-ring {
          0% { opacity: 0; transform: scale(0.2) rotate(0); }
          35% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.8) rotate(180deg); }
        }
        @keyframes intro-spark {
          0%, 100% { opacity: 0; transform: scale(0.3) translateY(12px); }
          45% { opacity: 1; transform: scale(1) translateY(0); }
          80% { opacity: 0.2; transform: scale(0.7) translateY(-16px); }
        }
        @keyframes intro-copy {
          0%, 20% { opacity: 0; letter-spacing: 0.8em; transform: translateY(10px); }
          55%, 80% { opacity: 1; letter-spacing: 0.18em; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .intro-logo { animation: intro-logo 2.2s cubic-bezier(.2,.8,.2,1) forwards; }
        .intro-ring { animation: intro-ring 2s ease-out .08s forwards; }
        .intro-spark { animation: intro-spark 1.6s ease-in-out .25s infinite; }
        .intro-copy { animation: intro-copy 2.1s ease forwards; }
      `}</style>

      {intro && (
        <div className="fixed inset-0 z-[200] overflow-hidden bg-[#FFF7FA] flex items-center justify-center intro-screen">
          <div className="absolute inset-0 intro-wash" />
          <div className="absolute w-56 h-56 rounded-full border-2 border-pink/30 intro-ring" />
          <div className="absolute w-72 h-72 rounded-full border border-pink/20 intro-ring [animation-delay:0.2s]" />
          <span className="absolute -translate-x-24 -translate-y-20 text-3xl text-pink intro-spark">+</span>
          <span className="absolute translate-x-24 translate-y-16 text-2xl text-pink-400 intro-spark [animation-delay:0.5s]">+</span>
          <div className="relative flex flex-col items-center gap-4">
            <div className="intro-logo">
              <img src="/logo.png" alt="Shiiinime" className="w-28 h-28 object-contain drop-shadow-[0_10px_30px_rgba(233,30,140,0.35)]" />
            </div>
            <p className="intro-copy text-sm font-bold text-gray-900 uppercase">Shiiinime</p>
          </div>
        </div>
      )}

      {visible && <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none">
        <div className={`page-bar${!active ? ' done' : ''} h-full`}
          style={{
            background: 'linear-gradient(90deg, #BE185D, #E91E8C, #F9A8D4)',
            boxShadow: '0 0 6px rgba(233,30,140,0.7), 0 0 12px rgba(190,24,93,0.4)',
          }}
        />
      </div>}
    </>
  );
}
