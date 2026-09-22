'use client';
// src/app/page.tsx — Anime Home

import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import SectionRow from '@/components/SectionRow';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import { normaliseCardItem } from '@/utils/slugHelpers';
import TopBanner from '@/components/TopBanner';

function toItems(raw: unknown, defaultStatus?: string) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => normaliseCardItem(a, 'anime'))
    .filter(Boolean)
    .map((c) => ({
      slug:   c!.slug,
      title:  c!.title,
      poster: c!.poster,
      // Use defaultStatus if card has no status (e.g. for "Terbaru" section)
      status: c!.status || defaultStatus || '',
      type:   c!.typeLabel,
      score:  c!.score as string | number | undefined,
      meta:   c!.meta,
      date:   c!.date,
      href:   c!.href,
    }));
}

export default function AnimePage() {
  const home = useApi(useCallback(() => AnimeAPI.getHome(), []), []);
  const terbaru = useApi(useCallback(() => AnimeAPI.getTerbaru(), []), []);
  const movies = useApi(useCallback(() => AnimeAPI.getMovies(), []), []);

  return (
    <div className="max-w-screen-xl mx-auto py-0 pb-20 md:pb-0">
      {home.loading && (
        <div className="px-4 pt-6 mb-7"><SkeletonBanner /></div>
      )}

      <div className="px-4 pt-6 mb-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <span className="text-cyan">📺</span> Anime
        </h2>
      </div>

      <div className="px-4">
        <TopBanner
          title="Top Anime"
          items={toItems(home.data)}
          basePath="/stream/anime"
          accentColor="cyan"
        />
      </div>

      <div className="mt-8">
        <SectionRow
          title="Anime Terbaru"
          items={toItems(terbaru.data, 'Ongoing')}
          loading={terbaru.loading}
          error={terbaru.error}
          contentType="anime"
          basePath="/stream/anime"
          moreHref="/anime/terbaru"
          accent="cyan"
        />
      </div>

      <div className="mt-8">
        <SectionRow
          title="Anime Movie"
          items={toItems(movies.data, 'Movie')}
          loading={movies.loading}
          error={movies.error}
          contentType="anime"
          basePath="/stream/anime"
          moreHref="/anime/movie"
          accent="pink"
        />
      </div>
    </div>
  );
}
