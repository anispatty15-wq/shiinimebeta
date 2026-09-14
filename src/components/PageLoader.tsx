'use client';
// src/components/PageLoader.tsx
// Top progress bar only — no overlay/spinner

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageLoader() {
  const pathname = usePathname();
  const [active,  setActive]  = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setActive(true);
    setVisible(true);

    const done = setTimeout(() => {
      setActive(false);
      setTimeout(() => setVisible(false), 300);
    }, 500);

    return () => clearTimeout(done);
  }, [pathname]);

  if (!visible) return null;

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
      `}</style>

      <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none">
        <div className={`page-bar${!active ? ' done' : ''} h-full`}
          style={{
            background: 'linear-gradient(90deg, #00d9ff, #7c3aed, #00d9ff)',
            boxShadow: '0 0 6px rgba(0,217,255,0.7), 0 0 12px rgba(124,58,237,0.4)',
          }}
        />
      </div>
    </>
  );
}
