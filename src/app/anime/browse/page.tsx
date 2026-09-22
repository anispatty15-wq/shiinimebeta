'use client';
// src/app/anime/browse/page.tsx — Browse + Filter Anime

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, X, ChevronLeft, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimeAPI, toArray } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import MediaCard from '@/components/MediaCard';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import { normaliseCardItem } from '@/utils/slugHelpers';
import type { AnimeFilterParams } from '@/types/media';

// ── Normalise filter list item from API ─────────────────────
// API may return: string | { slug, name } | { id, title } | etc.
interface FilterItem { slug: string; name: string; }

function toFilterItems(raw: unknown): FilterItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): FilterItem | null => {
      if (!item) return null;
      // Plain string — use as both slug and name
      if (typeof item === 'string') {
        return { slug: item.toLowerCase().replace(/\s+/g, '-'), name: item };
      }
      if (typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const slug = String(o.slug ?? o.id ?? o.value ?? o.key ?? o.name ?? '').trim();
      const name = String(o.name ?? o.title ?? o.label ?? o.text ?? slug).trim();
      if (!slug && !name) return null;
      return { slug: slug || name.toLowerCase().replace(/\s+/g, '-'), name: name || slug };
    })
    .filter((x): x is FilterItem => x !== null && Boolean(x.slug));
}

// ── Chip component ────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all select-none',
        active
          ? 'bg-cyan text-bg border-cyan shadow-glow-c'
          : 'bg-surface text-secondary border-border hover:border-cyan/50 hover:text-cyan'
      )}
    >
      {label}
    </button>
  );
}

// ── Toggle helper ─────────────────────────────────────────────
function toggleVal(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

// ─────────────────────────────────────────────────────────────
export default function AnimeBrowsePage() {
  const router = useRouter();

  // ── Committed filter (used for fetch) ─────────────────────
  const [activeGenres,  setActiveGenres]  = useState<string[]>([]);
  const [activeStatus,  setActiveStatus]  = useState<string[]>([]);
  const [activeType,    setActiveType]    = useState<string[]>([]);
  const [activeSeason,  setActiveSeason]  = useState<string[]>([]);
  const [activeOrder,   setActiveOrder]   = useState('');

  // ── Draft filter (UI state before "Terapkan") ─────────────
  const [draftGenres,  setDraftGenres]  = useState<string[]>([]);
  const [draftStatus,  setDraftStatus]  = useState<string[]>([]);
  const [draftType,    setDraftType]    = useState<string[]>([]);
  const [draftSeason,  setDraftSeason]  = useState<string[]>([]);
  const [draftOrder,   setDraftOrder]   = useState('');

  const [showFilter, setShowFilter] = useState(false);
  const [page,       setPage]       = useState(1);
  const [results,    setResults]    = useState<ReturnType<typeof normaliseCardItem>[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [hasMore,    setHasMore]    = useState(true);

  // ── Filter options from API ────────────────────────────────
  const { data: filterList } = useApi(
    useCallback(() => AnimeAPI.getFilterList(), []),
    []
  );

  const fl = (filterList ?? {}) as Record<string, unknown>;
  const genres   = toFilterItems(fl.genres   ?? fl.genre);
  const statuses = toFilterItems(fl.statuses ?? fl.status);
  const types    = toFilterItems(fl.types    ?? fl.type);
  const seasons  = toFilterItems(fl.seasons  ?? fl.season);
  const orders   = toFilterItems(fl.orders   ?? fl.order ?? fl.sort);

  // ── Fetch results ─────────────────────────────────────────
  const runFetch = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const hasFilter = activeGenres.length || activeStatus.length ||
                        activeType.length   || activeSeason.length || activeOrder;

      const params: AnimeFilterParams = {
        genre:  activeGenres,
        status: activeStatus,
        type:   activeType,
        season: activeSeason,
        order:  activeOrder || undefined,
        page:   p,
      };

      const result = hasFilter
        ? await AnimeAPI.filter(params)
        : await AnimeAPI.getTerbaru(p);

      const raw    = toArray(result.data as unknown[]);
      const mapped = raw
        .map((a) => normaliseCardItem(a, 'anime'))
        .filter(Boolean) as NonNullable<ReturnType<typeof normaliseCardItem>>[];

      setResults((prev) => append ? [...prev, ...mapped] : mapped);
      setHasMore(raw.length >= 10);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [activeGenres, activeStatus, activeType, activeSeason, activeOrder]);

  useEffect(() => {
    setPage(1);
    setResults([]);
    void runFetch(1, false);
  }, [runFetch]);

  // ── Apply draft → committed ───────────────────────────────
  const applyFilter = () => {
    setActiveGenres([...draftGenres]);
    setActiveStatus([...draftStatus]);
    setActiveType([...draftType]);
    setActiveSeason([...draftSeason]);
    setActiveOrder(draftOrder);
    setShowFilter(false);
  };

  // ── Reset ────────────────────────────────────────────────
  const clearAll = () => {
    setDraftGenres([]);  setDraftStatus([]);  setDraftType([]);
    setDraftSeason([]);  setDraftOrder('');
    setActiveGenres([]); setActiveStatus([]); setActiveType([]);
    setActiveSeason([]); setActiveOrder('');
  };

  // Open filter panel — sync active → draft
  const openFilter = () => {
    setDraftGenres([...activeGenres]);
    setDraftStatus([...activeStatus]);
    setDraftType([...activeType]);
    setDraftSeason([...activeSeason]);
    setDraftOrder(activeOrder);
    setShowFilter(true);
  };

  const activeCount =
    activeGenres.length + activeStatus.length +
    activeType.length   + activeSeason.length +
    (activeOrder ? 1 : 0);

  const draftCount =
    draftGenres.length + draftStatus.length +
    draftType.length   + draftSeason.length +
    (draftOrder ? 1 : 0);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    void runFetch(next, true);
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-10">

      {/* ── Sticky header ── */}
      <div className="sticky top-14 z-30 bg-bg/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} aria-label="Kembali"
          className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors flex-shrink-0">
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>
        <h1 className="text-[0.95rem] font-bold text-primary flex-1">Browse Anime</h1>

        {activeCount > 0 && (
          <button onClick={clearAll} aria-label="Reset filter"
            className="flex items-center gap-1 text-xs text-muted hover:text-red-400 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" aria-hidden />
            Reset
          </button>
        )}

        <button
          onClick={() => showFilter ? setShowFilter(false) : openFilter()}
          className={clsx(
            'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-app border transition-all flex-shrink-0',
            showFilter || activeCount > 0
              ? 'bg-cyan/10 border-cyan text-cyan'
              : 'bg-surface border-border text-secondary hover:text-primary'
          )}
        >
          <Filter className="w-3.5 h-3.5" aria-hidden />
          Filter
          {activeCount > 0 && (
            <span className="bg-cyan text-bg rounded-full px-1.5 text-[0.65rem] font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter panel (draft mode) ── */}
      {showFilter && (
        <div className="border-b border-border bg-surface/40 backdrop-blur">
          <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Genre */}
            {genres.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Genre</p>
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <Chip
                      key={g.slug}
                      label={g.name}
                      active={draftGenres.includes(g.slug)}
                      onClick={() => setDraftGenres(toggleVal(draftGenres, g.slug))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            {statuses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((s) => (
                    <Chip
                      key={s.slug}
                      label={s.name}
                      active={draftStatus.includes(s.slug)}
                      onClick={() => setDraftStatus(toggleVal(draftStatus, s.slug))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Type */}
            {types.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Tipe</p>
                <div className="flex flex-wrap gap-1.5">
                  {types.map((t) => (
                    <Chip
                      key={t.slug}
                      label={t.name}
                      active={draftType.includes(t.slug)}
                      onClick={() => setDraftType(toggleVal(draftType, t.slug))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Season */}
            {seasons.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Season</p>
                <div className="flex flex-wrap gap-1.5">
                  {seasons.map((s) => (
                    <Chip
                      key={s.slug}
                      label={s.name}
                      active={draftSeason.includes(s.slug)}
                      onClick={() => setDraftSeason(toggleVal(draftSeason, s.slug))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Order */}
            {orders.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Urutkan</p>
                <div className="flex flex-wrap gap-1.5">
                  {orders.map((o) => (
                    <Chip
                      key={o.slug}
                      label={o.name}
                      active={draftOrder === o.slug}
                      onClick={() => setDraftOrder(draftOrder === o.slug ? '' : o.slug)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Action bar ── */}
          <div className="sticky bottom-0 px-4 py-3 bg-bg border-t border-border flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDraftGenres([]); setDraftStatus([]); setDraftType([]);
                setDraftSeason([]); setDraftOrder('');
              }}
              className="btn-ghost text-sm py-2 px-4"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={applyFilter}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-app bg-cyan text-bg font-bold text-sm hover:brightness-110 transition-all"
            >
              <Search className="w-4 h-4" aria-hidden />
              Terapkan{draftCount > 0 ? ` (${draftCount} filter)` : ''}
            </button>
          </div>
        </div>
      )}

      {/* ── Active filter summary chips ── */}
      {activeCount > 0 && !showFilter && (
        <div className="px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar border-b border-border bg-surface/30">
          {[
            ...activeGenres.map((s) => ({ label: genres.find((g) => g.slug === s)?.name ?? s, key: `g-${s}`, clear: () => setActiveGenres((p) => p.filter((x) => x !== s)) })),
            ...activeStatus.map((s) => ({ label: statuses.find((g) => g.slug === s)?.name ?? s, key: `st-${s}`, clear: () => setActiveStatus((p) => p.filter((x) => x !== s)) })),
            ...activeType.map((s)   => ({ label: types.find((g) => g.slug === s)?.name ?? s, key: `tp-${s}`,   clear: () => setActiveType((p) => p.filter((x) => x !== s)) })),
            ...activeSeason.map((s) => ({ label: seasons.find((g) => g.slug === s)?.name ?? s, key: `se-${s}`, clear: () => setActiveSeason((p) => p.filter((x) => x !== s)) })),
            ...(activeOrder ? [{ label: orders.find((o) => o.slug === activeOrder)?.name ?? activeOrder, key: 'ord', clear: () => setActiveOrder('') }] : []),
          ].map(({ label, key, clear }) => (
            <button
              key={key}
              onClick={clear}
              className="flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full bg-cyan/15 border border-cyan/40 text-cyan text-xs font-medium hover:bg-red-500/15 hover:border-red-400/40 hover:text-red-400 transition-all flex-shrink-0"
            >
              {label}
              <X className="w-3 h-3" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {/* ── Results ── */}
      <div className="px-4 pt-5">
        {error && !loading && results.length === 0 && (
          <div className="text-center py-20 text-muted">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && results.length === 0 && <SkeletonGrid count={12} />}

        {!loading && !error && results.length === 0 && (
          <div className="text-center py-20 text-muted">
            <span className="text-4xl block mb-3" aria-hidden>🔍</span>
            <p className="text-sm">Tidak ada anime dengan filter ini.</p>
            <button onClick={clearAll} className="mt-3 btn-ghost text-xs">
              Reset filter
            </button>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="card-grid">
              {results.map((item) => (
                <MediaCard
                  key={`${item!.slug}-${item!.href}`}
                  item={{
                    slug:   item!.slug,
                    title:  item!.title,
                    poster: item!.poster,
                    status: item!.status,
                    type:   item!.typeLabel,
                    score:  item!.score as string | number | undefined,
                    meta:   item!.meta,
                  }}
                  contentType="anime"
                  href={item!.href}
                />
              ))}
            </div>
            {loading && <div className="mt-6"><SkeletonGrid count={6} /></div>}
            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <button onClick={loadMore} className="btn-ghost text-sm px-8">
                  Muat lebih banyak
                </button>
              </div>
            )}
            {!hasMore && (
              <p className="text-center text-xs text-muted mt-8">— Semua sudah ditampilkan —</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
