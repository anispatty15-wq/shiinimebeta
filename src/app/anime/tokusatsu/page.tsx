'use client';
import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function TokusatsuPage() {
  const fetcher = useCallback((page: number) => AnimeAPI.getTokusatsu(page), []);
  return (
    <BrowsePage
      title="Tokusatsu"
      contentType="anime"
      fetcher={fetcher}
      accent="cyan"
    />
  );
}
