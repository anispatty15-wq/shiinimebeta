'use client';
import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/apiClient';
import AnimeListPage from '@/components/AnimeListPage';
export default function Page() {
  return <AnimeListPage title="Semua Anime" fetcher={useCallback(() => AnimeAPI.getCatalogAll(), [])} />;
}
