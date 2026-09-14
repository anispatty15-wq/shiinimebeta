'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BrowsePage from './BrowsePage';
import AnimeNav from './AnimeNav';
import type { ApiResult } from '@/types/media';

interface Props {
  title: string;
  fetcher: (page: number) => Promise<ApiResult<unknown>>;
}

function AnimeListContent({ title, fetcher }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.get('page') || '1'));
  const pagedFetcher = useCallback((requestedPage: number) => fetcher(requestedPage), [fetcher]);

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <AnimeNav />
      <BrowsePage title={`${title} - Halaman ${page}`} contentType="anime" fetcher={pagedFetcher} accent="cyan" showBack={false} initialPage={page} />
      <div className="flex items-center justify-center gap-3 px-4 pb-8">
        <button disabled={page <= 1} onClick={() => router.push(`?page=${page - 1}`)} className="btn-ghost text-sm disabled:opacity-40">← Previous</button>
        <span className="rounded-full bg-surface px-4 py-2 text-sm text-primary">Page {page}</span>
        <button onClick={() => router.push(`?page=${page + 1}`)} className="btn-ghost text-sm">Next →</button>
      </div>
    </div>
  );
}

export default function AnimeListPage(props: Props) {
  return <Suspense fallback={<div className="p-8 text-center text-secondary">Memuat Anime...</div>}><AnimeListContent {...props} /></Suspense>;
}
