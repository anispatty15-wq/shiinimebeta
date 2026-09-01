'use client';
import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/api';
import BrowsePage from '@/components/BrowsePage';

export default function LiveActionPage() {
  const fetcher = useCallback((page: number) => AnimeAPI.getLiveAction(page), []);
  return (
    <BrowsePage
      title="Live Action"
      contentType="anime"
      fetcher={fetcher}
      accent="pink"
    />
  );
}
