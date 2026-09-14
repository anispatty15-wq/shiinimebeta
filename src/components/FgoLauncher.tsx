'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Boxes, Castle, ChevronRight, Gem, Ghost, Gift, Map, ScrollText, Swords, X } from 'lucide-react';
import { FGO_LAUNCHER_CONFIG } from '@/lib/fgoApi';

const ITEMS = [
  ['servants', 'Servants', Swords],
  ['craft-essences', 'Craft Essences', Gem],
  ['events', 'Events', Gift],
  ['quests', 'Quests', ScrollText],
  ['skills', 'Skills', BookOpen],
  ['noble-phantasms', 'Noble Phantasms', Castle],
  ['items', 'Items', Boxes],
  ['wars', 'Wars', Map],
  ['enemies', 'Enemies', Ghost],
] as const;

export default function FgoLauncher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);

  return (
    <div ref={ref} className={`fixed z-[60] ${FGO_LAUNCHER_CONFIG.position}`}>
      {open && (
        <div className="absolute bottom-16 right-0 w-[min(16rem,calc(100vw-1.5rem))] animate-scale-in rounded-app border border-cyan/30 bg-surface/95 p-2.5 shadow-modal backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border px-1.5 pb-2.5">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan">Fate/Grand Order</p><p className="mt-1 text-xs text-muted">Database launcher</p></div>
            <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-app text-muted hover:bg-surface-2 hover:text-primary" aria-label="Tutup FGO menu"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-2.5">
            {ITEMS.map(([href, label, Icon]) => <Link key={href} href={`/fgo/${href}`} onClick={() => setOpen(false)} className="group flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-surface-2 px-1 text-center text-[0.58rem] font-semibold leading-tight text-secondary transition-all hover:-translate-y-0.5 hover:border-cyan/60 hover:text-cyan"><Icon className="h-3.5 w-3.5" /><span>{label}</span></Link>)}
          </div>
          <Link href="/fgo" onClick={() => setOpen(false)} className="mt-2 flex items-center justify-between rounded-lg bg-cyan/10 px-2.5 py-1.5 text-[0.68rem] font-bold text-cyan hover:bg-cyan/20">Open FGO Dashboard <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Buka FGO Database" className="group flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-cyan bg-surface shadow-glow-c transition-transform hover:scale-105 active:scale-95">
        <Image src={FGO_LAUNCHER_CONFIG.iconUrl} alt={FGO_LAUNCHER_CONFIG.title} width={44} height={44} className="h-11 w-11 object-contain p-1" />
      </button>
    </div>
  );
}