'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, TrendingUp } from 'lucide-react';

type SearchHistoryEntry = { query: string; type: string; createdAt: number };
const SEARCH_HISTORY_KEY = 'shiinime-search-history';
const DEFAULT_SEARCHES = ['One Piece', 'Naruto', 'Solo Leveling', 'Jujutsu Kaisen', 'Demon Slayer', 'Blue Lock'];

export default function PopularSearches() {
  const [searches, setSearches] = useState<string[]>(DEFAULT_SEARCHES);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]') as SearchHistoryEntry[];
      const recent = Array.isArray(stored) ? stored.map((entry) => entry.query.trim()).filter(Boolean) : [];
      setSearches([...new Set([...recent, ...DEFAULT_SEARCHES])].slice(0, 6));
    } catch {
      setSearches(DEFAULT_SEARCHES);
    }
  }, []);

  return (
    <section className="px-4 pt-4 pb-1" aria-labelledby="popular-searches-title">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-cyan" aria-hidden />
        <h2 id="popular-searches-title" className="text-sm font-bold text-primary">Sering Dicari</h2>
        <span className="text-xs text-muted">Anime populer</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {searches.map((search) => (
          <Link
            key={search}
            href={`/search?q=${encodeURIComponent(search)}&type=anime`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-cyan/60 hover:text-cyan"
          >
            <Search className="h-3 w-3" aria-hidden />
            {search}
          </Link>
        ))}
      </div>
    </section>
  );
}
