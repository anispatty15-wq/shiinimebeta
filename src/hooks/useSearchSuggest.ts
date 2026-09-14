'use client';
// src/hooks/useSearchSuggest.ts
// Debounced search-suggestion hook used by the Navbar.

import { useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';
import { ComicAPI, DonghuaAPI, HentaiAPI, toArray } from '@/lib/api';
import { AnimeAPI as CatalogAnimeAPI, MaidComicAPI } from '@/lib/apiClient';
import type { ContentType } from '@/types/media';

export interface SuggestionItem {
  slug:    string;
  title:   string;
  poster?: string;
  sub?:    string;
}

export function useSearchSuggest(query: string, type: ContentType | 'maid' = 'anime') {
  const dq = useDebounce(query.trim(), 400);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (!dq || dq.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchFn = async () => {
      try {
        let raw: unknown[] = [];

        if (type === 'maid') {
          const r = await MaidComicAPI.search(dq, 1);
          const result = r.data;
          raw = Array.isArray(result) ? result : (result && typeof result === 'object' && Array.isArray(result.data) ? result.data : []);
        } else if (type === 'comic') {
          const r = await ComicAPI.search(dq);
          raw = toArray(r.data as Parameters<typeof toArray>[0]);
        } else if (type === 'hentai') {
          const r = await HentaiAPI.search(dq, 1);
          raw = toArray(r.data as Parameters<typeof toArray>[0]);
        } else if (type === 'donghua') {
          const r = await DonghuaAPI.search(dq, 1);
          raw = toArray(r.data as Parameters<typeof toArray>[0]);
        } else {
          const r = await CatalogAnimeAPI.searchCatalog(dq);
          raw = toArray(r.data as Parameters<typeof toArray>[0]);
        }

        if (cancelled) return;

        const mapped: SuggestionItem[] = raw.slice(0, 8).map((it) => {
          const i = it as Record<string, unknown>;
          return {
            slug:   String(i.slug  ?? ''),
            title:  String(i.title ?? i.name ?? ''),
            poster: String(i.poster ?? i.image ?? i.cover ?? ''),
            sub:    String(i.type  ?? i.year  ?? i.category ?? ''),
          };
        });

        setSuggestions(mapped);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchFn();
    return () => { cancelled = true; };
  }, [dq, type]);

  return { suggestions, loading };
}
