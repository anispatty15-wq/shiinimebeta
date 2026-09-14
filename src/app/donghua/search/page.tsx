'use client';
import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { DonghuaAPI } from '@/lib/api';
import DonghuaListPage from '@/components/DonghuaListPage';
import { Suspense } from 'react';
function SearchContent() {
  const query = useSearchParams().get('q') || '';
  const fetcher = useCallback((page: number) => query ? DonghuaAPI.search(query, page) : Promise.resolve({ data: [], error: null }), [query]);
  return <DonghuaListPage title={query ? `Hasil: ${query}` : 'Cari Donghua'} fetcher={fetcher} />;
}
export default function Page() {
  return <Suspense fallback={<div className="p-8 text-center text-secondary">Memuat pencarian...</div>}><SearchContent /></Suspense>;
}
