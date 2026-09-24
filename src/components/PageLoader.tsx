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
  const [refreshing, setRefreshing] = useState(false);
  const [introText, setIntroText] = useState('');

  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const isRefresh = navigation?.type === 'reload';
    const isFirstLoad = !sessionStorage.getItem('shiinime-intro-seen');

    if (isFirstLoad) {
      sessionStorage.setItem('shiinime-intro-seen', 'true');
      setIntro(true);
      const introDone = setTimeout(() => setIntro(false), 4600);
      return () => clearTimeout(introDone);
    }

    if (isRefresh) {
      setRefreshing(true);
      const refreshDone = setTimeout(() => setRefreshing(false), 900);
      return () => clearTimeout(refreshDone);
    }

    setActive(true);
    setVisible(true);

    const done = setTimeout(() => {
      setActive(false);
      setTimeout(() => setVisible(false), 300);
    }, 500);

    return () => clearTimeout(done);
  }, [pathname]);

  useEffect(() => {
    if (!intro) {
      setIntroText('');
      return;
    }

    const phrases = ['Shiinime', 'by anzzzdecoding'];
    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let holdTicks = 0;

    const typing = window.setInterval(() => {
      const phrase = phrases[phraseIndex];

      if (!deleting) {
        characterIndex += 1;
        setIntroText(phrase.slice(0, characterIndex));
        if (characterIndex === phrase.length) holdTicks += 1;
        if (holdTicks >= 8) {
          deleting = true;
          holdTicks = 0;
        }
        return;
      }

      characterIndex -= 1;
      setIntroText(phrase.slice(0, characterIndex));
      if (characterIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }, 90);

    return () => window.clearInterval(typing);
  }, [intro]);

  if (!visible && !intro && !refreshing) return null;

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
          0% { opacity: 0; transform: translateY(18px) scale(.82); filter: blur(8px); }
          22% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          72% { opacity: 1; transform: translateY(-3px) scale(1); }
          100% { opacity: 0; transform: translateY(-16px) scale(.96); filter: blur(4px); }
        }
        @keyframes intro-orbit {
          0% { opacity: 0; transform: rotate(-22deg) scale(.7); }
          22% { opacity: .8; }
          78% { opacity: .45; transform: rotate(18deg) scale(1); }
          100% { opacity: 0; transform: rotate(42deg) scale(1.08); }
        }
        @keyframes intro-content {
          0% { opacity: 0; transform: translateY(14px); }
          24% { opacity: 0; transform: translateY(14px); }
          45% { opacity: 1; transform: translateY(0); }
          78% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes intro-line {
          0% { transform: scaleX(0); opacity: 0; }
          35% { transform: scaleX(1); opacity: 1; }
          82% { transform: scaleX(1); opacity: .7; }
          100% { transform: scaleX(.65); opacity: 0; }
        }
        .intro-screen { background-image: linear-gradient(rgba(233,30,140,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(233,30,140,.045) 1px, transparent 1px); background-size: 34px 34px; }
        .intro-screen::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 0%, rgba(255,247,250,.72) 88%); pointer-events: none; }
        html.dark .intro-screen::after { background: radial-gradient(ellipse at center, transparent 0%, rgba(7,17,31,.76) 88%); }
        .intro-orbit { animation: intro-orbit 4.4s cubic-bezier(.2,.7,.2,1) .1s forwards; }
        .intro-logo { animation: intro-logo 4.5s cubic-bezier(.2,.8,.2,1) forwards; }
        .intro-content { animation: intro-content 4.5s cubic-bezier(.2,.8,.2,1) forwards; }
        .intro-line { animation: intro-line 4.2s ease-out .25s forwards; transform-origin: center; }
        .intro-copy { min-height: 1.5rem; }
        @media (prefers-reduced-motion: reduce) {
          .intro-logo, .intro-orbit, .intro-content, .intro-line { animation-duration: .01ms; animation-iteration-count: 1; }
        }
        @keyframes refresh-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes refresh-pulse {
          0%, 100% { opacity: .55; transform: scale(.92); }
          50% { opacity: 1; transform: scale(1); }
        }
        .refresh-spinner { animation: refresh-spin 1.1s linear infinite; }
        .refresh-logo { animation: refresh-pulse 1.1s ease-in-out infinite; }
      `}</style>

      {refreshing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#FFF7FA]/90 backdrop-blur-sm dark:bg-[#07111F]/90">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="refresh-spinner absolute inset-0 rounded-full border-2 border-pink/20 border-t-pink border-r-pink-400" />
            <div className="refresh-logo flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(233,30,140,0.22)]">
              <img src="/logo.png" alt="Memuat Shiiinime" className="h-10 w-10 object-contain" />
            </div>
          </div>
        </div>
      )}

      {intro && (
        <div className="fixed inset-0 z-[200] overflow-hidden bg-[#FFF7FA] text-gray-900 flex items-center justify-center intro-screen dark:bg-[#07111F] dark:text-[#E6F4FF]">
          <div className="intro-orbit absolute h-[min(78vw,26rem)] w-[min(78vw,26rem)] rounded-full border border-pink/25" />
          <div className="intro-orbit absolute h-[min(58vw,19rem)] w-[min(58vw,19rem)] rounded-full border border-cyan/20 [animation-delay:.18s]" />
          <div className="relative z-10 flex w-[min(88vw,31rem)] flex-col items-center text-center">
            <div className="intro-logo relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
              <div className="absolute inset-3 rounded-full bg-pink/10 blur-xl dark:bg-cyan/10" />
              <img src="/logo.png" alt="Shiiinime" className="relative h-24 w-24 object-contain drop-shadow-[0_10px_30px_rgba(233,30,140,0.35)] sm:h-28 sm:w-28" />
            </div>
            <div className="intro-content mt-5 flex w-full flex-col items-center">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.38em] text-pink/80 dark:text-cyan/80">Welcome to</p>
              <div className="mt-2 flex min-h-10 items-center text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="text-gray-900 dark:text-[#E6F4FF]">{introText}</span>
                <span className="ml-1 h-6 w-px bg-pink dark:bg-cyan" />
              </div>
              <div className="intro-line mt-5 h-px w-24 bg-gradient-to-r from-transparent via-pink to-transparent dark:via-cyan" />
              <p className="mt-3 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-gray-500 dark:text-[#7893AA]">anime · comic · donghua</p>
            </div>
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
