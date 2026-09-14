'use client';
// src/app/page.tsx — Anime Home

import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import SectionRow from '@/components/SectionRow';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import { normaliseCardItem } from '@/utils/slugHelpers';
import TopBanner from '@/components/TopBanner';
import AnimeNav from '@/components/AnimeNav';

function toItems(raw: unknown, defaultStatus?: string) {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)
      ? (raw as { data: unknown[] }).data
      : [];
  return list
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
  const home = useApi(useCallback(() => AnimeAPI.getCatalogHome(), []), []);
  const terbaru = useApi(useCallback(() => AnimeAPI.getCatalogOngoing(), []), []);
  const movies = useApi(useCallback(() => AnimeAPI.getCatalogCompleted(), []), []);

  return (
    <div className="max-w-screen-xl mx-auto py-0 pb-20 md:pb-0">
      <AnimeNav />
      {home.loading && (
        <div className="px-4 pt-6 mb-7"><SkeletonBanner /></div>
      )}

      <div className="px-4 pt-6 mb-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          Anime
        </h2>
      </div>

      <div className="anime-section-enter px-4">
        <TopBanner
          title="Top Anime"
          items={toItems(home.data)}
          basePath="/stream/anime"
          accentColor="cyan"
        />
      </div>

      <div className="anime-section-enter mt-8 [animation-delay:80ms]">
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

      <div className="anime-section-enter mt-8 [animation-delay:160ms]">
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
