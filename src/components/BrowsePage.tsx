'use client';
// src/components/BrowsePage.tsx
// ─────────────────────────────────────────────────────────────
// Reusable full-page browse layout used by terbaru, donghua,
// movie, live-action, tokusatsu, genre, season, etc.
// Supports:
//   • Paginated card grid
//   • Infinite scroll (optional)
//   • Back button
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import MediaCard from './MediaCard';
import { SkeletonGrid } from './SkeletonLoader';
import type { ContentType } from '@/types/media';
import type { ApiResult } from '@/types/media';
import { toArray } from '@/lib/api';
import { normaliseCardItem } from '@/utils/slugHelpers';

interface BrowsePageProps {
  title:       string;
  contentType: ContentType;
  /** Fetcher receives page number, returns ApiResult */
  fetcher: (page: number) => Promise<ApiResult<unknown>>;
  accent?:  'cyan' | 'violet' | 'pink';
  /** Show back button */
  showBack?: boolean;
  /** Extra header content (e.g. filter chips) */
  headerSlot?: React.ReactNode;
}

export default function BrowsePage({
  title,
  contentType,
  fetcher,
  accent = 'cyan',
  showBack = true,
  headerSlot,
}: BrowsePageProps) {
  const router = useRouter();

  const [items,   setItems]   = useState<ReturnType<typeof normaliseCardItem>[]>([]);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetcherRef  = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  const ACCENT_COLOR: Record<string, string> = {
    cyan:   'bg-cyan',
    violet: 'bg-violet',
    pink:   'bg-pink',
  };

  const loadPage = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(p);
      if (result.error) { setError(result.error); return; }

      const raw  = toArray(result.data as unknown[]);
      const mapped = raw
        .map((a) => normaliseCardItem(a, contentType))
        .filter(Boolean) as NonNullable<ReturnType<typeof normaliseCardItem>>[];

      setItems((prev) => append ? [...prev, ...mapped] : mapped);
      // Stop if returned less than ~12 items (last page)
      setHasMore(raw.length >= 10);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [contentType]);

  // Initial load
  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    void loadPage(1, false);
  }, [loadPage]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        const next = page + 1;
        setPage(next);
        void loadPage(next, true);
      }
    }, { rootMargin: '300px' });

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, loadPage]);

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      {/* ── Page header ── */}
      <div className="sticky top-14 z-30 bg-bg/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            aria-label="Kembali"
            className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
          </button>
        )}
        <h1 className="flex items-center gap-2 text-[0.95rem] font-bold text-primary flex-1 min-w-0 truncate">
          <span className={clsx('block w-1 h-[1.1em] rounded-full flex-shrink-0', ACCENT_COLOR[accent])} aria-hidden />
          {title}
        </h1>
        {items.length > 0 && !loading && (
          <span className="text-xs text-muted flex-shrink-0">{items.length} item</span>
        )}
      </div>

      {/* Extra header slot (filters, chips, etc.) */}
      {headerSlot && (
        <div className="px-4 py-3 border-b border-border">{headerSlot}</div>
      )}

      {/* ── Content ── */}
      <div className="px-4 pt-5">
        {/* Error */}
        {error && !loading && items.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-4 text-muted">
            <span className="text-4xl" aria-hidden>😵</span>
            <p className="text-sm text-center">{error}</p>
            <button
              onClick={() => { setPage(1); setItems([]); void loadPage(1, false); }}
              className="btn-ghost text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" aria-hidden /> Coba lagi
            </button>
          </div>
        )}

        {/* Initial skeleton */}
        {loading && items.length === 0 && <SkeletonGrid count={12} />}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3 text-muted">
            <span className="text-4xl" aria-hidden>📭</span>
            <p className="text-sm">Tidak ada konten.</p>
          </div>
        )}

        {/* Card grid */}
        {items.length > 0 && (
          <div className="card-grid">
            {items.map((item) => (
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
                contentType={contentType}
                href={item!.href}
              />
            ))}
          </div>
        )}

        {/* Load more skeleton */}
        {loading && items.length > 0 && (
          <div className="mt-6">
            <SkeletonGrid count={6} />
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="h-10 mt-4" aria-hidden />
        )}

        {/* End of list */}
        {!hasMore && items.length > 0 && (
          <p className="text-center text-xs text-muted mt-8 pb-4">
            — Semua konten sudah ditampilkan —
          </p>
        )}
      </div>
    </div>
  );
}
