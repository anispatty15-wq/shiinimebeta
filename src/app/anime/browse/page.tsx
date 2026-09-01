'use client';
// src/app/anime/browse/page.tsx — Browse + Filter Anime

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, X, ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimeAPI, toArray } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import MediaCard from '@/components/MediaCard';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import { normaliseCardItem } from '@/utils/slugHelpers';
import type { SlugItem, AnimeFilterParams } from '@/types/media';

// ── Chip component ────────────────────────────────────────────
function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
        active
          ? 'bg-cyan text-bg border-cyan'
          : 'bg-surface text-secondary border-border hover:border-cyan/50 hover:text-cyan'
      )}
    >
      {label}
    </button>
  );
}

export default function AnimeBrowsePage() {
  const router = useRouter();

  // ── Filter state ──────────────────────────────────────────
  const [selectedGenres,  setGenres]  = useState<string[]>([]);
  const [selectedStatus,  setStatus]  = useState<string[]>([]);
  const [selectedType,    setType]    = useState<string[]>([]);
  const [selectedSeason,  setSeason]  = useState<string[]>([]);
  const [selectedOrder,   setOrder]   = useState('');
  const [showFilter,      setShowFilter] = useState(false);
  const [page,            setPage]    = useState(1);
  const [results,         setResults] = useState<ReturnType<typeof normaliseCardItem>[]>([]);
  const [loading,         setLoading] = useState(false);
  const [error,           setError]   = useState<string | null>(null);
  const [hasMore,         setHasMore] = useState(true);

  // ── Filter options ────────────────────────────────────────
  const { data: filterList } = useApi(
    useCallback(() => AnimeAPI.getFilterList(), []),
    []
  );

  const genres:   SlugItem[] = toArray((filterList as Record<string, unknown> | null)?.genres  as SlugItem[]) || [];
  const statuses: SlugItem[] = toArray((filterList as Record<string, unknown> | null)?.statuses as SlugItem[]) || [];
  const types:    SlugItem[] = toArray((filterList as Record<string, unknown> | null)?.types    as SlugItem[]) || [];
  const seasons:  SlugItem[] = toArray((filterList as Record<string, unknown> | null)?.seasons  as SlugItem[]) || [];
  const orders:   SlugItem[] = toArray((filterList as Record<string, unknown> | null)?.orders   as SlugItem[]) || [];

  // ── Fetch results ─────────────────────────────────────────
  const runFetch = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const params: AnimeFilterParams = {
        genre:  selectedGenres,
        status: selectedStatus,
        type:   selectedType,
        season: selectedSeason,
        order:  selectedOrder || undefined,
        page:   p,
      };
      // If no filter selected, use home/terbaru
      const result = (selectedGenres.length || selectedStatus.length || selectedType.length || selectedSeason.length || selectedOrder)
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
  }, [selectedGenres, selectedStatus, selectedType, selectedSeason, selectedOrder]);

  // Re-fetch on filter change
  useEffect(() => {
    setPage(1);
    setResults([]);
    void runFetch(1, false);
  }, [runFetch]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    void runFetch(next, true);
  };

  const clearFilters = () => {
    setGenres([]);
    setStatus([]);
    setType([]);
    setSeason([]);
    setOrder('');
  };

  const hasActiveFilter = selectedGenres.length > 0 || selectedStatus.length > 0 ||
    selectedType.length > 0 || selectedSeason.length > 0 || selectedOrder !== '';

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      {/* ── Sticky header ── */}
      <div className="sticky top-14 z-30 bg-bg/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Kembali"
          className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors flex-shrink-0">
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>
        <h1 className="text-[0.95rem] font-bold text-primary flex-1">Browse Anime</h1>
        <button
          onClick={() => setShowFilter((v) => !v)}
          aria-label="Filter"
          className={clsx(
            'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-app border transition-all',
            showFilter || hasActiveFilter
              ? 'bg-cyan/10 border-cyan text-cyan'
              : 'bg-surface border-border text-secondary hover:text-primary'
          )}
        >
          <Filter className="w-3.5 h-3.5" aria-hidden />
          Filter
          {hasActiveFilter && (
            <span className="bg-cyan text-bg rounded-full px-1.5 text-[0.65rem] font-bold">
              {selectedGenres.length + selectedStatus.length + selectedType.length + selectedSeason.length + (selectedOrder ? 1 : 0)}
            </span>
          )}
        </button>
        {hasActiveFilter && (
          <button onClick={clearFilters} aria-label="Reset filter"
            className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-muted hover:text-primary transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        )}
      </div>

      {/* ── Filter panel ── */}
      {showFilter && (
        <div className="border-b border-border bg-surface/50 px-4 py-4 space-y-4">
          {/* Genre */}
          {genres.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Genre</p>
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <Chip key={g.slug} label={g.name} active={selectedGenres.includes(g.slug)}
                    onClick={() => toggle(selectedGenres, g.slug, setGenres)} />
                ))}
              </div>
            </div>
          )}
          {/* Status */}
          {statuses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <Chip key={s.slug} label={s.name} active={selectedStatus.includes(s.slug)}
                    onClick={() => toggle(selectedStatus, s.slug, setStatus)} />
                ))}
              </div>
            </div>
          )}
          {/* Type */}
          {types.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Tipe</p>
              <div className="flex flex-wrap gap-2">
                {types.map((t) => (
                  <Chip key={t.slug} label={t.name} active={selectedType.includes(t.slug)}
                    onClick={() => toggle(selectedType, t.slug, setType)} />
                ))}
              </div>
            </div>
          )}
          {/* Season */}
          {seasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Season</p>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                {seasons.map((s) => (
                  <Chip key={s.slug} label={s.name} active={selectedSeason.includes(s.slug)}
                    onClick={() => toggle(selectedSeason, s.slug, setSeason)} />
                ))}
              </div>
            </div>
          )}
          {/* Order */}
          {orders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Urutkan</p>
              <div className="flex flex-wrap gap-2">
                {orders.map((o) => (
                  <Chip key={o.slug} label={o.name} active={selectedOrder === o.slug}
                    onClick={() => setOrder(selectedOrder === o.slug ? '' : o.slug)} />
                ))}
              </div>
            </div>
          )}
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
