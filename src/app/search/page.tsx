'use client';
// src/app/search/page.tsx — Universal search results

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Clock3, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimeAPI, DonghuaAPI, HentaiAPI, ComicAPI, toArray } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import MediaCard from '@/components/MediaCard';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import type { ContentType } from '@/types/media';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedTitle } from '@/lib/localizedTitle';

type Tab = ContentType | 'donghua';
type SearchHistoryEntry = { query: string; type: Tab; createdAt: number };
const SEARCH_HISTORY_KEY = 'shiinime-search-history';
const TABS: { label: string; value: Tab }[] = [
  { label: 'Anime',   value: 'anime'   },
  { label: 'Donghua', value: 'donghua' },
  { label: 'Hentai',  value: 'hentai'  },
  { label: 'Komik',   value: 'comic'   },
];

function basePath(type: Tab): string {
  if (type === 'donghua') return '/donghua';
  return `/${type}`;
}

// ── Inner component that uses useSearchParams ─────────────────
// Must be wrapped in <Suspense> per Next.js 14 requirement.
function SearchContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { language, t } = useLanguage();

  const initialQ    = searchParams.get('q')    ?? '';
  const initialType = (searchParams.get('type') ?? 'anime') as Tab;

  const [query,   setQuery]   = useState(initialQ);
  const [tab,     setTab]     = useState<Tab>(initialType);
  const [items,   setItems]   = useState<{
    slug: string; title: string; poster?: string;
    status?: string; type?: string; titleEnglish?: string; titleJapanese?: string; titleIndonesian?: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const dq = useDebounce(query, 450);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]') as SearchHistoryEntry[];
      setSearchHistory(Array.isArray(stored) ? stored.slice(0, 8) : []);
    } catch {
      setSearchHistory([]);
    }
  }, []);

  const saveSearch = useCallback((value: string, type: Tab) => {
    const normalized = value.trim();
    if (!normalized) return;
    setSearchHistory((current) => {
      const nextEntry = { query: normalized, type, createdAt: Date.now() };
      const next = [
        nextEntry,
        ...current.filter((entry) => entry.query.toLowerCase() !== normalized.toLowerCase()),
      ].slice(0, 8);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
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
            titleEnglish: String(i.titleEnglish ?? i.title_english ?? i.english_title ?? ''),
            titleJapanese: String(i.titleJapanese ?? i.title_japanese ?? i.jp_title ?? ''),
            titleIndonesian: String(i.titleIndonesian ?? i.title_indonesian ?? i.indonesian_title ?? ''),
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

  useEffect(() => {
    void runSearch(dq, tab);
    if (dq.trim()) saveSearch(dq, tab);
  }, [dq, tab, runSearch, saveSearch]);

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const removeSearchHistory = (entry: SearchHistoryEntry) => {
    const next = searchHistory.filter((item) => item.createdAt !== entry.createdAt);
    setSearchHistory(next);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  };

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
          onChange={(e) => { setQuery(e.target.value); setShowHistory(true); }}
          onFocus={() => setShowHistory(true)}
          placeholder={language === 'ja' ? 'タイトルを検索…' : language === 'en' ? 'Search title…' : 'Cari judul…'}
          aria-label={t('search')}
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

      {showHistory && searchHistory.length > 0 && (
        <div className="mb-4 rounded-app border border-border bg-surface p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
              <Clock3 className="h-3.5 w-3.5" aria-hidden /> Riwayat pencarian
            </span>
            <button type="button" onClick={clearSearchHistory} className="flex items-center gap-1 text-[0.65rem] text-muted hover:text-pink">
              <Trash2 className="h-3 w-3" aria-hidden /> Hapus semua
            </button>
          </div>
          <div className="space-y-1">
            {searchHistory.map((entry) => (
              <div
                key={`${entry.type}-${entry.query}-${entry.createdAt}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-surface-2"
              >
                <button
                  type="button"
                  onClick={() => { setQuery(entry.query); setTab(entry.type); setShowHistory(false); }}
                  className="min-w-0 flex-1 truncate text-left text-xs text-secondary hover:text-cyan"
                >
                  {entry.query}
                </button>
                <button
                  type="button"
                  onClick={() => removeSearchHistory(entry)}
                  aria-label={`Hapus riwayat ${entry.query}`}
                  className="shrink-0 rounded p-1 text-muted hover:bg-pink/10 hover:text-pink"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {items.length} {language === 'ja' ? '件の結果' : language === 'en' ? 'results for' : 'hasil untuk'} &ldquo;{query}&rdquo;
          </p>
          <div className="card-grid">
            {items.map((item) => (
              <MediaCard
                key={item.slug}
                item={{ ...item, title: getLocalizedTitle(item, language) }}
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
