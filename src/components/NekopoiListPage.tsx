'use client';
import { Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BrowsePage from './BrowsePage';
import NekopoiNav from './NekopoiNav';
import NekopoiGuard from './NekopoiGuard';
import type { ApiResult } from '@/types/media';
interface Props { title: string; fetcher: (page: number) => Promise<ApiResult<unknown>>; }
function Content({ title, fetcher }: Props) {
  const params = useSearchParams(); const router = useRouter(); const page = Math.max(1, Number(params.get('page') || '1'));
  const paged = useCallback((requested: number) => fetcher(requested), [fetcher]);
  return <NekopoiGuard><div className="mx-auto max-w-screen-xl pb-10"><NekopoiNav /><BrowsePage title={`${title} - Halaman ${page}`} contentType="hentai" fetcher={paged} accent="pink" showBack={false} initialPage={page} /><div className="flex justify-center gap-3 px-4 pb-8"><button disabled={page <= 1} onClick={() => router.push(`?page=${page - 1}`)} className="btn-ghost text-sm disabled:opacity-40">← Previous</button><span className="rounded-full bg-surface px-4 py-2 text-sm text-primary">Page {page}</span><button onClick={() => router.push(`?page=${page + 1}`)} className="btn-ghost text-sm">Next →</button></div></div></NekopoiGuard>;
}
export default function NekopoiListPage(props: Props) { return <Suspense fallback={<div className="p-8 text-center text-secondary">Memuat section 18+...</div>}><Content {...props} /></Suspense>; }
