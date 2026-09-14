'use client';

import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AnimeAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import { getPoster, toArray } from '@/lib/api';

export default function AnimeCatalogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const result = useApi(useCallback(() => AnimeAPI.getCatalogDetail(slug ?? ''), [slug]), [slug], null);
  const raw = result.data as Record<string, unknown> | null;
  const data = raw && typeof raw.data === 'object' && raw.data !== null ? raw.data as Record<string, unknown> : raw;
  const title = String(data?.title ?? data?.name ?? slug ?? '');
  const poster = data ? getPoster(data) : '';
  const synopsis = String(data?.synopsis ?? data?.description ?? data?.summary ?? '');
  const episodes = toArray(data?.episodes ?? data?.episode_list ?? data?.episodeList);

  if (result.loading) return <div className="p-12 text-center text-secondary">Memuat detail anime...</div>;
  if (result.error || !data) return <div className="p-12 text-center text-secondary">{result.error ?? 'Anime tidak ditemukan.'}</div>;

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        {poster ? <Image src={poster} alt={title} width={220} height={330} className="h-auto w-40 rounded-card object-cover" /> : <div className="flex h-60 w-40 items-center justify-center rounded-card bg-surface text-4xl">🎬</div>}
        <div>
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {synopsis && <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary">{synopsis}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            {episodes.map((episode, index) => {
              const item = episode as Record<string, unknown>;
              const episodeSlug = String(item.slug ?? item.id ?? '');
              return episodeSlug ? <Link key={`${episodeSlug}-${index}`} href={`/anime/episode/${episodeSlug}`} className="rounded-full bg-cyan px-3 py-1.5 text-xs font-semibold text-bg">Episode {String(item.episode ?? item.number ?? index + 1)}</Link> : null;
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
