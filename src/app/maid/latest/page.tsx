'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import MaidComicListPage from '@/components/MaidComicListPage';
import { MaidComicAPI } from '@/lib/apiClient';

function LatestContent() {
  const page = Number(useSearchParams().get('page') ?? '1') || 1;
  const fetcher = useCallback(() => MaidComicAPI.getLatest(page), [page]);
  return <MaidComicListPage title="Maid Comic Terbaru" fetcher={fetcher} />;
}

export default function MaidLatestPage() {
  return <Suspense fallback={null}><LatestContent /></Suspense>;
}
