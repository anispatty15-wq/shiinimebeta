'use client';
// src/app/search/page.tsx — Universal search results

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimeAPI, HentaiAPI, ComicAPI, toArray } from '@/lib/apiClient';
import { useDebounce } from '@/hooks/useDebounce';
import MediaCard from '@/components/MediaCard';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import type { ContentType } from '@/types/media';

type Tab = ContentType;
const TABS: { label: string; value: Tab }[] = [
  { label: 'Anime',  value: 'anime'  },
  { label: 'Hentai', value: 'hentai' },
  { label: 'Komik',  value: 'comic'  },
];

function basePath(type: Tab): string {
  return `/${type}`;
}

// ── Inner component that uses useSearchParams ─────────────────
// Must be wrapped in <Suspense> per Next.js 14 requirement.
function SearchContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const initialQ    = searchParams.get('q')    ?? '';
  const initialType = (searchParams.get('type') ?? 'anime') as Tab;

  const [query,   setQuery]   = useState(initialQ);
  const [tab,     setTab]     = useState<Tab>(initialType);
  const [items,   setItems]   = useState<{
    slug: string; title: string; poster?: string;
    status?: string; type?: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const dq = useDebounce(query, 450);

  const runSearch = useCallback(async (q: string, t: Tab) => {
    if (!q.trim()) { setItems([]); return; }
    setLoading(true);
    setError(null);
    try {
      let raw: unknown[] = [];
      if (t === 'anime') {
        const r = await AnimeAPI.search(q, 1);
        raw = toArray(r.data as Parameters<typeof toArray>[0]);
      } else if (t === 'hentai') {
        const r = await HentaiAPI.search(q, 1);
        raw = toArray(r.data as Parameters<typeof toArray>[0]);
      } else {
        const r = await ComicAPI.search(q);
        raw = Array.isArray(r.data) ? r.data : [];
      }
      setItems(
        raw.map((it) => {
          const i = it as Record<string, unknown>;
          return {
            slug:   String(i.slug   ?? ''),
            title:  String(i.title  ?? ''),
            poster: String(i.poster ?? i.image ?? i.cover ?? ''),
            status: String(i.status ?? ''),
            type:   String(i.type   ?? i.category ?? ''),
          };
        })
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat hasil.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void runSearch(dq, tab); }, [dq, tab, runSearch]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('type', tab);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [query, tab, router]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-5">
      {/* Search input */}
      <div className="flex items-center gap-2 bg-surface border border-border rounded-app px-3.5 py-2.5 mb-4 focus-within:border-cyan/60 focus-within:shadow-[0_0_0_2px_rgba(0,229,255,0.12)] transition-all">
        <Search className="w-4 h-4 text-muted flex-shrink-0" aria-hidden />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul…"
          aria-label="Cari"
          className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted outline-none min-w-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setItems([]); }}
            aria-label="Hapus"
            className="text-muted hover:text-primary flex-shrink-0"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={clsx(
              'px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150 -mb-px',
              tab === value
                ? 'border-cyan text-cyan'
                : 'border-transparent text-muted hover:text-secondary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <SkeletonGrid count={12} />
      ) : error ? (
        <div className="text-center py-16 text-muted">
          <p className="text-sm">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted space-y-2">
          <span className="text-4xl block" aria-hidden>🔍</span>
          <p className="text-sm font-medium">
            {query.trim()
              ? `Tidak ada hasil untuk "${query}"`
              : 'Masukkan kata kunci pencarian.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted mb-3">
            {items.length} hasil untuk &ldquo;{query}&rdquo;
          </p>
          <div className="card-grid">
            {items.map((item) => (
              <MediaCard
                key={item.slug}
                item={item}
                contentType={tab}
                href={`${basePath(tab)}/${item.slug}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Fallback UI while Suspense resolves ───────────────────────
function SearchFallback() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-5">
      <div className="h-11 rounded-app bg-surface animate-pulse mb-4" />
      <div className="h-10 rounded bg-surface animate-pulse mb-5" />
      <SkeletonGrid count={12} />
    </div>
  );
}

// ── Page export — wraps content in Suspense ───────────────────
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}
