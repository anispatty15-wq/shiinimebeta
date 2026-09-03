'use client';
// src/app/page.tsx — Anime Home

import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import SectionRow from '@/components/SectionRow';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import { normaliseCardItem } from '@/utils/slugHelpers';
import HeroBanner from '@/components/HeroBanner';

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

  return (
    <div className="max-w-screen-xl mx-auto py-0">
      {/* Hero Banner */}
      <HeroBanner title="Anime" subtitle="Nonton anime subtitle Indonesia terbaru" />

      {home.loading && (
        <div className="px-4 mb-7"><SkeletonBanner /></div>
      )}

      <div className="px-4 mb-6 mt-6">
        <h2 className="text-xl font-bold text-primary mb-4">
          📺 Top Anime
        </h2>
      </div>

      <SectionRow
        title="Top Anime"
        items={toItems(home.data)}
        loading={home.loading}
        error={home.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/anime/browse"
        accent="cyan"
      />
    </div>
  );
}
