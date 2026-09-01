'use client';
// src/app/page.tsx — Anime Home

import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import SectionRow from '@/components/SectionRow';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import { normaliseCardItem } from '@/utils/slugHelpers';

function toItems(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => normaliseCardItem(a, 'anime'))
    .filter(Boolean)
    .map((c) => ({
      slug:   c!.slug,
      title:  c!.title,
      poster: c!.poster,
      status: c!.status,
      type:   c!.typeLabel,
      score:  c!.score as string | number | undefined,
      meta:   c!.meta,
      href:   c!.href,   // /stream/anime/... or /detail/anime/...
    }));
}

export default function AnimePage() {
  const home    = useApi(useCallback(() => AnimeAPI.getHome(),    []), []);
  const terbaru = useApi(useCallback(() => AnimeAPI.getTerbaru(), []), []);
  const movies  = useApi(useCallback(() => AnimeAPI.getMovies(),  []), []);
  const donghua = useApi(useCallback(() => AnimeAPI.getDonghua(), []), []);

  return (
    <div className="max-w-screen-xl mx-auto py-5">
      {home.loading && (
        <div className="px-4 mb-7"><SkeletonBanner /></div>
      )}

      <SectionRow
        title="Terbaru & Ongoing"
        items={toItems(terbaru.data)}
        loading={terbaru.loading}
        error={terbaru.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/anime/terbaru"
        accent="cyan"
      />
      <SectionRow
        title="Beranda"
        items={toItems(home.data)}
        loading={home.loading}
        error={home.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/anime/browse"
        accent="violet"
      />
      <SectionRow
        title="Anime Movie"
        items={toItems(movies.data)}
        loading={movies.loading}
        error={movies.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/anime/movie"
        accent="pink"
      />
      <SectionRow
        title="Donghua Terbaru"
        items={toItems(donghua.data)}
        loading={donghua.loading}
        error={donghua.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/anime/donghua"
        accent="cyan"
      />
    </div>
  );
}
