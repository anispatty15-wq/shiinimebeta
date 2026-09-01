'use client';
// src/hooks/useApi.ts
// ─────────────────────────────────────────────────────────────
// Generic data-fetching hook that wraps any ApiResult-returning
// function with loading / error state management.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResult } from '@/types/media';

interface UseApiState<T> {
  data:     T | null;
  loading:  boolean;
  error:    string | null;
  refetch:  () => void;
}

/**
 * @param fetcher   Function that returns a Promise<ApiResult<T>>
 * @param deps      Dependency array — re-fetches when values change
 * @param initial   Initial data value (defaults to null)
 * @param skip      If true, the fetch is not triggered
 */
export function useApi<T>(
  fetcher:  () => Promise<ApiResult<T>>,
  deps:     unknown[] = [],
  initial:  T | null = null,
  skip      = false
): UseApiState<T> {
  const [data,    setData]    = useState<T | null>(initial);
  const [loading, setLoading] = useState(!skip);
  const [error,   setError]   = useState<string | null>(null);

  // Keep latest fetcher reference without adding it to deps
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  const run = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (result.error) {
        setError(result.error);
        setData(initial);
      } else {
        setData(result.data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setData(initial);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  useEffect(() => { void run(); }, [run]);

  return { data, loading, error, refetch: run };
}

// ── usePaginatedApi ────────────────────────────────────────────
/**
 * Extends useApi with page state management.
 * `loadMore` appends next page results to `items`.
 */
interface UsePaginatedState<T> {
  items:      T[];
  loading:    boolean;
  error:      string | null;
  page:       number;
  hasMore:    boolean;
  loadMore:   () => void;
  reset:      () => void;
}

export function usePaginatedApi<T>(
  fetcher: (page: number) => Promise<ApiResult<T[] | { data: T[]; hasNext?: boolean; totalPages?: number; currentPage?: number }>>,
  deps: unknown[] = []
): UsePaginatedState<T> {
  const [items,   setItems]   = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  const fetchPage = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(p);
      if (result.error) {
        setError(result.error);
        return;
      }
      const raw = result.data;
      let arr: T[] = [];
      let more = false;

      if (Array.isArray(raw)) {
        arr  = raw;
        more = raw.length > 0;
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as { data: T[] }).data)) {
        const pr = raw as { data: T[]; hasNext?: boolean; totalPages?: number; currentPage?: number };
        arr  = pr.data;
        more = pr.hasNext ?? (pr.currentPage != null && pr.totalPages != null
          ? pr.currentPage < pr.totalPages
          : arr.length > 0);
      }

      setItems((prev) => append ? [...prev, ...arr] : arr);
      setHasMore(more);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Initial fetch / re-fetch on dep change
  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    void fetchPage(1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    void fetchPage(next, true);
  }, [loading, hasMore, page, fetchPage]);

  const reset = useCallback(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setError(null);
    void fetchPage(1, false);
  }, [fetchPage]);

  return { items, loading, error, page, hasMore, loadMore, reset };
}
