'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Database, RefreshCw, Search, Server, Sparkles, Swords } from 'lucide-react';
import { FgoAPI, FGO_REGIONS, type FgoEntity, type FgoInfo, type FgoRegion, fgoImage, formatFgoDate } from '@/lib/fgoApi';

const QUICK_LINKS = [
  ['servants', 'Servants', 'Browse portraits, classes, rarity, and full profiles.'],
  ['craft-essences', 'Craft Essences', 'Find CE artwork, cost, and effects.'],
  ['events', 'Events', 'Explore event history, missions, and rewards.'],
  ['quests', 'Quests', 'Search wars, phases, enemies, and drops.'],
  ['skills', 'Skills', 'Search skill effects and cooldown scaling.'],
  ['items', 'Items', 'Browse materials and item references.'],
] as const;

export default function FgoDashboard() {
  const [region, setRegion] = useState<FgoRegion>(() => (typeof window !== 'undefined' && localStorage.getItem('fgo-region') as FgoRegion) || 'JP');
  const [query, setQuery] = useState('');
  const [featured, setFeatured] = useState<FgoEntity[]>([]);
  const [info, setInfo] = useState<FgoInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { localStorage.setItem('fgo-region', region); }, [region]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([FgoAPI.getFeaturedServants(region), FgoAPI.getInfo()])
      .then(([servants, versions]) => { if (!active) return; setFeatured(servants); setInfo(versions[region] ?? null); setError(''); })
      .catch(() => { if (active) setError('Failed to load FGO data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [region]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    window.location.href = `/fgo/servants${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`;
  };

  return (
    <main className="min-h-screen pb-24">
      <div className="mx-auto max-w-screen-xl px-4 py-7 sm:py-10">
        <section className="relative overflow-hidden rounded-app border border-cyan/30 bg-gradient-to-br from-cyan/15 via-surface to-violet/15 p-6 shadow-glow-c sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" aria-hidden />
          <div className="relative max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan"><Sparkles className="h-4 w-4" /> Atlas Academy database</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-primary sm:text-5xl">Fate/Grand Order Database</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary sm:text-base">Search Servants, Craft Essences, events, quests, skills, and more from the current FGO data repository.</p>
            <form onSubmit={submitSearch} className="mt-7 flex max-w-2xl gap-2">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Servant, item, skill..." className="h-11 w-full rounded-app border border-border bg-bg/70 pl-10 pr-3 text-sm text-primary outline-none focus:border-cyan" /></div>
              <button type="submit" className="btn-primary h-11 px-5">Search</button>
            </form>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-app border border-border bg-surface p-4"><p className="text-xs text-muted">Region</p><select value={region} onChange={(event) => setRegion(event.target.value as FgoRegion)} className="mt-2 w-full bg-transparent text-lg font-bold text-primary outline-none"><option value="JP">Japan (JP)</option><option value="NA">North America (NA)</option></select></div>
          <div className="rounded-app border border-border bg-surface p-4"><p className="text-xs text-muted">API status</p><p className={`mt-2 flex items-center gap-2 text-lg font-bold ${error ? 'text-red-400' : 'text-green-400'}`}><Server className="h-4 w-4" /> {error ? 'Unavailable' : 'Online'}</p></div>
          <div className="rounded-app border border-border bg-surface p-4"><p className="text-xs text-muted">Data version</p><p className="mt-2 truncate text-sm font-bold text-primary">{info?.hash ?? 'Loading...'}</p><p className="mt-1 text-xs text-muted">{formatFgoDate(info?.timestamp)}</p></div>
        </section>

        <section className="mt-10"><div className="mb-4 flex items-end justify-between"><div><p className="section-title"><Database className="h-4 w-4 text-cyan" /> Explore FGO</p><p className="mt-2 text-sm text-muted">Jump into a focused database section.</p></div><Link href="/fgo/servants" className="hidden items-center gap-1 text-xs font-semibold text-cyan sm:flex">View servants <ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{QUICK_LINKS.map(([href, title, text]) => <Link key={href} href={`/fgo/${href}`} className="group rounded-app border border-border bg-surface p-5 transition-all hover:-translate-y-1 hover:border-cyan/50 hover:shadow-card"><div className="flex items-center justify-between"><h2 className="font-bold text-primary group-hover:text-cyan">{title}</h2><ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-cyan" /></div><p className="mt-2 text-sm leading-5 text-muted">{text}</p></Link>)}</div></section>

        <section className="mt-10"><div className="mb-4 flex items-center justify-between"><div><p className="section-title"><Swords className="h-4 w-4 text-pink" /> Featured Servants</p><p className="mt-2 text-sm text-muted">A quick look at the current region data.</p></div><Link href="/fgo/servants" className="text-xs font-semibold text-cyan">See all</Link></div>{loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-app bg-surface" />)}</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{featured.map((item) => <Link key={item.id} href={`/fgo/servant/${item.collectionNo ?? item.id}`} className="group relative aspect-[3/4] overflow-hidden rounded-app border border-border bg-surface"><img src={fgoImage(item)} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-12"><p className="line-clamp-2 text-xs font-bold text-white">{item.name}</p><p className="mt-1 text-[0.65rem] capitalize text-cyan">{item.className ?? 'Servant'}</p></div></Link>)}</div>}</section>

        {error && <button type="button" onClick={() => window.location.reload()} className="btn-ghost mt-6 flex items-center gap-2 text-sm"><RefreshCw className="h-4 w-4" /> Retry</button>}
      </div>
    </main>
  );
}