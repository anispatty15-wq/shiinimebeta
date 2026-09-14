'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import MediaCard from '@/components/MediaCard';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import MaidComicNav from '@/components/MaidComicNav';
import { MaidComicAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import type { MaidComicCard } from '@/types/media';

type Fetcher = () => ReturnType<typeof MaidComicAPI.getHome>;

function cards(data: unknown): MaidComicCard[] {
  if (Array.isArray(data)) return data as MaidComicCard[];
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: MaidComicCard[] }).data;
  }
  return [];
}

export default function MaidComicListPage({ title, fetcher }: { title: string; fetcher: Fetcher }) {
  const router = useRouter();
  const params = useSearchParams();
  const result = useApi(fetcher, [fetcher]);
  const items = cards(result.data);
  const page = Number(params.get('page') ?? '1') || 1;
  const query = params.toString();
  const nextPage = page + 1;
  const canNext = Boolean(result.data && !Array.isArray(result.data) && (result.data as { hasNext?: boolean; totalPages?: number }).hasNext)
    || (!result.error && items.length > 0 && page === 1);
  const changePage = (next: number) => {
    const nextParams = new URLSearchParams(query);
    nextParams.set('page', String(next));
    router.push(`${window.location.pathname}?${nextParams.toString()}`);
  };
  return (
    <div className="mx-auto max-w-screen-xl pb-10">
      <MaidComicNav />
      <main className="px-4">
        <h1 className="mb-4 text-xl font-bold text-primary">{title}</h1>
        {result.loading && <SkeletonGrid count={6} />}
        {result.error && <div className="rounded-card border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">Gagal memuat Maid Comic: {result.error}</div>}
        {!result.loading && !result.error && items.length === 0 && <div className="rounded-card border border-border bg-surface p-8 text-center text-sm text-secondary">Belum ada manga yang tersedia.</div>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <MediaCard key={item.slug} item={item} contentType="comic" href={`/maid/manga/${encodeURIComponent(item.slug)}`} />
          ))}
        </div>
        {(page > 1 || canNext) && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button disabled={page <= 1} onClick={() => changePage(page - 1)} className="btn-ghost text-sm disabled:opacity-40">Sebelumnya</button>
            <span className="text-sm text-secondary">Halaman {page}</span>
            <button disabled={!canNext} onClick={() => changePage(nextPage)} className="btn-ghost text-sm disabled:opacity-40">Berikutnya</button>
          </div>
        )}
      </main>
    </div>
  );
}

export function MaidSearchPage() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;
  const fetcher = useCallback(() => MaidComicAPI.search(q, page), [q, page]);
  return <MaidComicListPage title={q ? `Hasil pencarian: ${q}` : 'Cari Maid Comic'} fetcher={fetcher} />;
}

export function MaidGenrePage({ slug }: { slug: string }) {
  const params = useSearchParams();
  const page = Number(params.get('page') ?? '1') || 1;
  const fetcher = useCallback(() => MaidComicAPI.getByGenre(slug, page), [slug, page]);
  return <MaidComicListPage title={`Genre: ${slug}`} fetcher={fetcher} />;
}
