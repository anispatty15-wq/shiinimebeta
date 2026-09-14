'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Gamepad2, Search, Sparkles, Zap } from 'lucide-react';

type GameCategory = 'all' | 'api' | 'quiz' | 'coming-soon';

interface GameEntry {
  slug: string;
  title: string;
  description: string;
  category: Exclude<GameCategory, 'all'>;
  accent: string;
  icon: string;
  poster: string;
  endpoint?: string;
  status: 'ready' | 'coming-soon';
  banner?: boolean;
}

const GAMES: GameEntry[] = [
  {
    slug: 'mini-game',
    title: 'Servant Guess',
    description: 'Tebak Servant dari class, rarity, dan portrait.',
    category: 'api',
    accent: 'from-cyan/30 via-violet/20 to-pink/20',
    icon: '⚔️',
    poster: '/logo.png',
    endpoint: 'Game',
    status: 'ready',
  },
  {
    slug: 'fgo',
    title: 'FGO Database',
    description: 'Jelajahi Servants, events, quests, skills, Craft Essences, dan item FGO.',
    category: 'api',
    accent: 'from-pink/25 via-violet/20 to-orange-400/20',
    icon: '✦',
    poster: 'https://static.atlasacademy.io/JP/Faces/f_8001000.png',
    endpoint: 'Game',
    status: 'ready',
  },
  {
    slug: 'coming-soon',
    title: 'Game Baru Segera Hadir',
    description: 'Game baru sedang disiapkan untuk menambah koleksi permainan di Shiiinime.',
    category: 'coming-soon',
    accent: 'from-zinc-700/70 via-zinc-800/70 to-zinc-900/80',
    icon: '🎬',
    poster: '/logo.png',
    endpoint: 'Game',
    status: 'coming-soon',
    banner: true,
  },
];

const FILTERS: { value: GameCategory; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'api', label: 'Game' },
  { value: 'coming-soon', label: 'Segera hadir' },
];

export default function GamesPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GameCategory>('all');

  const games = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return GAMES.filter((game) => {
      const matchesCategory = category === 'all' || game.category === category;
      const matchesQuery = !normalized || `${game.title} ${game.description} ${game.endpoint ?? ''}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <main className="min-h-screen pb-24">
      <div className="mx-auto max-w-screen-xl px-4 py-7 sm:py-10">
        <section className="relative overflow-hidden rounded-app border border-cyan/30 bg-gradient-to-br from-cyan/15 via-surface to-violet/15 p-6 shadow-glow-c sm:p-9">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan/10 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan"><Gamepad2 className="h-4 w-4" /> Shiiinime Games</p>
            <h1 className="mt-3 text-3xl font-black text-primary sm:text-4xl">Pilih game kamu</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">Kumpulan game mini untuk dimainkan di Shiiinime.</p>
            <div className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari game..." className="h-11 w-full rounded-app border border-border bg-bg/70 pl-10 pr-3 text-sm text-primary outline-none focus:border-cyan" /></div>
              <div className="flex gap-1 overflow-x-auto rounded-app border border-border bg-bg/50 p-1">{FILTERS.map((filter) => <button key={filter.value} type="button" onClick={() => setCategory(filter.value)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${category === filter.value ? 'bg-cyan text-bg' : 'text-secondary hover:bg-surface-2 hover:text-primary'}`}>{filter.label}</button>)}</div>
            </div>
          </div>
        </section>

        <div className="mt-7 flex items-center justify-between"><div><p className="text-sm font-bold text-primary">{games.length} game tersedia</p><p className="mt-1 text-xs text-muted">Pilih game untuk mulai bermain.</p></div><Zap className="h-5 w-5 text-yellow-400" /></div>

        {games.length === 0 ? <div className="py-20 text-center text-sm text-muted">Game tidak ditemukan.</div> : <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{games.map((game) => {
          const disabled = game.status === 'coming-soon';
          const content = <div className={`relative flex ${game.banner ? 'min-h-40 sm:col-span-2 lg:col-span-3' : 'min-h-64'} flex-col overflow-hidden rounded-app border border-border bg-gradient-to-br ${game.accent} p-5 transition-all ${disabled ? 'opacity-80' : 'hover:-translate-y-1 hover:border-cyan/50 hover:shadow-card'}`}><div className="absolute inset-0 bg-cover bg-center opacity-25 grayscale" style={{ backgroundImage: `url(${game.poster})` }} aria-hidden /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" aria-hidden /><div className="relative flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-2xl">{game.icon}</span>{disabled ? <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-[0.62rem] font-bold text-yellow-400">SEGERA</span> : <span className="rounded-full border border-green-400/30 bg-green-400/10 px-2 py-1 text-[0.62rem] font-bold text-green-400">PLAY</span>}</div><div className="relative mt-auto"><p className="text-[0.68rem] font-bold uppercase tracking-wider text-cyan">{game.endpoint}</p><h2 className="mt-2 text-xl font-black text-primary">{game.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-5 text-secondary">{game.description}</p><div className="mt-5 flex items-center gap-2 text-xs font-bold text-primary">{disabled ? <Sparkles className="h-4 w-4 text-yellow-400" /> : <ArrowRight className="h-4 w-4 text-cyan" />} {disabled ? 'Game segera hadir' : 'Mulai bermain'}</div></div></div>;
          return disabled ? <div key={game.slug}>{content}</div> : <Link key={game.slug} href={`/${game.slug}`}>{content}</Link>;
        })}</div>}
      </div>
    </main>
  );
}