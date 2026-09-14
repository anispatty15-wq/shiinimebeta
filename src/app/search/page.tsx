'use client';
// src/app/search/page.tsx — Universal search results

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Loader2, Search, Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimeAPI, DonghuaAPI, HentaiAPI, ComicAPI, toArray } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchSuggest } from '@/hooks/useSearchSuggest';
import MediaCard from '@/components/MediaCard';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import type { ContentType } from '@/types/media';

type Tab = ContentType | 'donghua';
const TABS: { label: string; value: Tab }[] = [
  { label: 'Anime',   value: 'anime'   },
  { label: 'Donghua', value: 'donghua' },
  { label: 'Hentai',  value: 'hentai'  },
  { label: 'Komik',   value: 'comic'   },
];

const TYPE_META: Record<Tab, { label: string }> = {
  anime: { label: 'Anime' },
  donghua: { label: 'Donghua' },
  hentai: { label: 'Hentai' },
  comic: { label: 'Komik' },
};

function basePath(type: Tab): string {
  if (type === 'donghua') return '/donghua';
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const dq = useDebounce(query, 450);
  const { suggestions, loading: suggestionsLoading } = useSearchSuggest(
    query,
    tab === 'donghua' ? 'anime' : tab
  );

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const runSearch = useCallback(async (q: string, t: Tab) => {
    if (!q.trim()) { setItems([]); return; }
    setLoading(true);
    setError(null);
    try {
      let raw: unknown[] = [];
      if (t === 'anime') {
        const r = await AnimeAPI.search(q, 1);
        raw = toArray(r.data as Parameters<typeof toArray>[0]);
      } else if (t === 'donghua') {
        const r = await DonghuaAPI.search(q, 1);
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) setShowSuggestions(false);
  };

  const selectSuggestion = (slug: string) => {
    router.push(`${basePath(tab)}/${slug}`);
    setShowSuggestions(false);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 md:py-10">
      <section className="relative overflow-visible rounded-2xl border border-white/[0.08] bg-gradient-to-br from-surface via-surface to-violet/10 px-5 py-7 md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cyan">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Jelajahi koleksi
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary md:text-4xl">Cari tontonan favoritmu</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary">Temukan anime, donghua, hentai, dan komik dalam satu pencarian.</p>

          <div ref={searchRef} className="relative mt-6">
            <form onSubmit={handleSubmit} role="search">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-bg/80 p-1.5 shadow-2xl shadow-black/20 transition-all focus-within:border-cyan/60 focus-within:ring-4 focus-within:ring-cyan/10">
                <Search className="ml-3 h-5 w-5 flex-shrink-0 text-cyan" aria-hidden />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                  placeholder={`Cari ${TYPE_META[tab].label.toLowerCase()}...`}
                  aria-label="Cari konten"
                  className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-primary outline-none placeholder:text-muted"
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(''); setItems([]); setShowSuggestions(false); }} aria-label="Hapus pencarian" className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-primary">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
                <button type="submit" className="hidden rounded-lg bg-cyan px-4 py-3 text-sm font-bold text-bg transition hover:brightness-110 sm:block">Cari</button>
              </div>
            </form>
            {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
              <div role="listbox" className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-white/10 bg-surface/95 shadow-2xl backdrop-blur-xl">
                {suggestionsLoading && <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Mencari judul...</div>}
                {suggestions.map((item) => (
                  <button key={item.slug} type="button" role="option" onClick={() => selectSuggestion(item.slug)} className="flex w-full items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-left transition hover:bg-white/[0.06]">
                    <div className="h-12 w-9 flex-shrink-0 overflow-hidden rounded bg-surface-2">
                      {item.poster ? <Image src={item.poster} alt="" width={36} height={48} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted">?</div>}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-primary">{item.title}</span>
                      {item.sub && <span className="mt-0.5 block truncate text-xs text-muted">{item.sub}</span>}
                    </span>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted" aria-hidden />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 gap-1 overflow-x-auto rounded-xl border border-border bg-surface/60 p-1 no-scrollbar">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setTab(value); setShowSuggestions(false); }}
            className={clsx(
              'whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-150',
              tab === value
                ? 'bg-cyan text-bg shadow-glow-c'
                : 'text-muted hover:bg-white/10 hover:text-primary'
            )}
          >
            {label}
          </button>
        ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <SkeletonGrid count={12} />
      ) : error ? (
        <div className="rounded-2xl border border-red-400/10 bg-red-400/5 py-16 text-center text-muted">
          <p className="text-sm">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="space-y-2 rounded-2xl border border-border bg-surface/50 py-20 text-center text-muted">
          <span className="text-4xl block" aria-hidden>🔍</span>
          <p className="text-sm font-medium">
            {query.trim()
              ? `Tidak ada hasil untuk "${query}"`
              : 'Masukkan kata kunci pencarian.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan">{TYPE_META[tab].label}</p>
              <h2 className="mt-1 text-lg font-bold text-primary">Hasil pencarian</h2>
            </div>
            <p className="text-right text-xs text-muted">{items.length} judul untuk <span className="font-semibold text-secondary">&ldquo;{query}&rdquo;</span></p>
          </div>
          <div className="card-grid">
            {items.map((item) => (
              <MediaCard
                key={item.slug}
                item={item}
                contentType={tab === 'donghua' ? 'anime' : tab}
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
