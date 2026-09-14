'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import MaidComicNav from '@/components/MaidComicNav';
import { MaidComicAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';

export default function MaidGenresPage() {
  const result = useApi(useCallback(() => MaidComicAPI.getGenres(), []), []);
  return <div className="mx-auto max-w-screen-xl pb-10"><MaidComicNav /><main className="px-4"><h1 className="mb-4 text-xl font-bold text-primary">Genre Maid Comic</h1>{result.loading && <p className="text-sm text-secondary">Memuat genre...</p>}{result.error && <p className="text-sm text-red-300">Gagal memuat genre: {result.error}</p>}<div className="flex flex-wrap gap-2">{(result.data ?? []).map((genre) => <Link key={genre.slug} href={`/maid/genre/${encodeURIComponent(genre.slug)}`} className="rounded-full border border-border bg-surface px-3 py-2 text-sm text-secondary hover:text-primary">{genre.title ?? genre.name ?? genre.slug}</Link>)}</div></main></div>;
}
