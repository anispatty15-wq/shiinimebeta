'use client';
import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/apiClient';
import AnimeListPage from '@/components/AnimeListPage';
export default function Page() {
  return <AnimeListPage title="Anime Completed" fetcher={useCallback((page: number) => AnimeAPI.getCatalogCompleted(page), [])} />;
}
