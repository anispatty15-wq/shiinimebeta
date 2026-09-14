'use client';
import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimeAPI } from '@/lib/apiClient';
import AnimeListPage from '@/components/AnimeListPage';
function SearchContent() {
  const query = useSearchParams().get('q') || '';
  const fetcher = useCallback(() => query ? AnimeAPI.searchCatalog(query) : Promise.resolve({ data: [], error: null, status: 200 }), [query]);
  return <AnimeListPage title={query ? `Hasil: ${query}` : 'Cari Anime'} fetcher={fetcher} />;
}
export default function Page() {
  return <Suspense fallback={<div className="p-8 text-center text-secondary">Memuat pencarian...</div>}><SearchContent /></Suspense>;
}
