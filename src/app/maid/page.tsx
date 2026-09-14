'use client';

import { useCallback } from 'react';
import { Suspense } from 'react';
import MaidComicListPage from '@/components/MaidComicListPage';
import { MaidComicAPI } from '@/lib/apiClient';

function MaidHomeContent() {
  const fetcher = useCallback(() => MaidComicAPI.getHome(), []);
  return <MaidComicListPage title="Maid Comic" fetcher={fetcher} />;
}

export default function MaidPage() {
  return <Suspense fallback={null}><MaidHomeContent /></Suspense>;
}
