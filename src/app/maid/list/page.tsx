'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import MaidComicListPage from '@/components/MaidComicListPage';
import { MaidComicAPI } from '@/lib/apiClient';

function ListContent() {
  const page = Number(useSearchParams().get('page') ?? '1') || 1;
  const fetcher = useCallback(() => MaidComicAPI.getList(page), [page]);
  return <MaidComicListPage title="Semua Maid Comic" fetcher={fetcher} />;
}

export default function MaidListPage() {
  return <Suspense fallback={null}><ListContent /></Suspense>;
}
