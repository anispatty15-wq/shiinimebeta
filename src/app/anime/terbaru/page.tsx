'use client';
import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function AnimeTerbaruPage() {
  const fetcher = useCallback((page: number) => AnimeAPI.getTerbaru(page), []);
  return (
    <BrowsePage
      title="Anime Terbaru (Ongoing)"
      contentType="anime"
      fetcher={fetcher}
      accent="cyan"
    />
  );
}
