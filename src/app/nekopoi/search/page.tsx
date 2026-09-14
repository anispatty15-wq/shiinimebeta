'use client';
import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HentaiAPI } from '@/lib/api';
import NekopoiListPage from '@/components/NekopoiListPage';
function SearchContent() { const q = useSearchParams().get('q') || ''; const fetcher = useCallback((page: number) => q ? HentaiAPI.search(q, page) : Promise.resolve({ data: [], error: null, status: 200 }), [q]); return <NekopoiListPage title={q ? `Hasil: ${q}` : 'Cari'} fetcher={fetcher} />; }
export default function Page() { return <Suspense fallback={<div className="p-8 text-center text-secondary">Memuat pencarian...</div>}><SearchContent /></Suspense>; }
