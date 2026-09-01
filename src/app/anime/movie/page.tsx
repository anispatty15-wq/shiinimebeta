'use client';
import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/api';
import BrowsePage from '@/components/BrowsePage';

export default function AnimeMoviePage() {
  const fetcher = useCallback((page: number) => AnimeAPI.getMovies(page), []);
  return (
    <BrowsePage
      title="Anime Movie"
      contentType="anime"
      fetcher={fetcher}
      accent="pink"
    />
  );
}
