'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BrowsePage from './BrowsePage';
import DonghuaNav from './DonghuaNav';
import type { ApiResult } from '@/types/media';

interface Props {
  title: string;
  fetcher: (page: number) => Promise<ApiResult<unknown>>;
}

function DonghuaListContent({ title, fetcher }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.get('page') || '1'));
  const pagedFetcher = useCallback((requestedPage: number) => fetcher(requestedPage), [fetcher]);

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <DonghuaNav />
      <BrowsePage
        title={`${title} - Halaman ${page}`}
        contentType="donghua"
        fetcher={pagedFetcher}
        accent="violet"
        showBack={false}
        initialPage={page}
      />
      <div className="flex items-center justify-center gap-3 px-4 pb-8">
        <button
          disabled={page <= 1}
          onClick={() => router.push(`?page=${page - 1}`)}
          className="btn-ghost text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>
        <span className="rounded-full bg-surface px-4 py-2 text-sm text-primary">Page {page}</span>
        <button
          onClick={() => router.push(`?page=${page + 1}`)}
          className="btn-ghost text-sm"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function DonghuaListPage(props: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-screen-xl px-4 py-12 text-center text-secondary">Memuat Donghua...</div>}>
      <DonghuaListContent {...props} />
    </Suspense>
  );
}
