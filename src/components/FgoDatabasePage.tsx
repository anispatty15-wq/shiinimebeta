'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { FgoAPI, type FgoEntity, type FgoRegion, fgoImage } from '@/lib/fgoApi';

const LABELS: Record<string, string> = { servants: 'Servants', 'craft-essences': 'Craft Essences', skills: 'Skills', 'noble-phantasms': 'Noble Phantasms', events: 'Events', quests: 'Quests', items: 'Items', gacha: 'Gacha', wars: 'Wars', enemies: 'Enemies', 'mystic-codes': 'Mystic Codes', 'command-codes': 'Command Codes' };

interface Props { section: string; region: FgoRegion; onRegionChange: (region: FgoRegion) => void; }

export default function FgoDatabasePage({ section, region, onRegionChange }: Props) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<FgoEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const title = LABELS[section] ?? section;

  const load = () => {
    setLoading(true);
    setError('');
    FgoAPI.search(region, section, query).then(setItems).catch(() => { setItems([]); setError('Failed to load FGO data.'); }).finally(() => setLoading(false));
  };

  useEffect(() => { const timer = window.setTimeout(load, 350); return () => window.clearTimeout(timer); }, [region, section]);

  return (
    <main className="min-h-screen pb-24"><div className="mx-auto max-w-screen-xl px-4 py-7">
      <Link href="/fgo" className="mb-6 inline-flex items-center gap-2 text-sm text-secondary hover:text-cyan"><ArrowLeft className="h-4 w-4" /> FGO Dashboard</Link>
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-title"><SlidersHorizontal className="h-4 w-4 text-cyan" /> FGO Database</p><h1 className="mt-3 text-3xl font-black text-primary">{title}</h1><p className="mt-2 text-sm text-muted">Search and browse Atlas Academy data.</p></div><select value={region} onChange={(event) => { const next = event.target.value as FgoRegion; localStorage.setItem('fgo-region', next); onRegionChange(next); }} className="rounded-app border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-cyan"><option value="JP">JP</option><option value="NA">NA</option></select></div>
      <form onSubmit={(event) => { event.preventDefault(); load(); }} className="mt-5 flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title}...`} className="h-11 w-full rounded-app border border-border bg-surface pl-10 pr-3 text-sm text-primary outline-none focus:border-cyan" /></div><button type="submit" className="btn-primary h-11 px-5">Search</button></form>
      {loading ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-app bg-surface" />)}</div> : error ? <div className="py-20 text-center"><p className="text-sm text-red-400">{error}</p><button type="button" onClick={load} className="btn-ghost mt-4 inline-flex gap-2 text-sm"><RefreshCw className="h-4 w-4" /> Retry</button></div> : items.length === 0 ? <p className="py-20 text-center text-sm text-muted">No data available.</p> : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{items.slice(0, 60).map((item) => <Link key={`${item.id}-${item.collectionNo ?? ''}`} href={`/fgo/${section === 'servants' ? 'servant' : section}/${item.collectionNo ?? item.id}`} className="group overflow-hidden rounded-app border border-border bg-surface transition-all hover:-translate-y-1 hover:border-cyan/50"><div className="relative aspect-[3/4] bg-surface-2">{fgoImage(item) ? <img src={fgoImage(item)} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-3xl text-muted">?</div>}</div><div className="p-3"><p className="line-clamp-2 text-xs font-bold text-primary group-hover:text-cyan">{item.name}</p><p className="mt-1 text-[0.65rem] capitalize text-muted">{item.className ?? item.type ?? 'FGO data'}</p></div></Link>)}</div>}
    </div></main>
  );
}