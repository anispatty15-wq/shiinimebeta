'use client';
// src/app/page.tsx — Anime Home

import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import SectionRow from '@/components/SectionRow';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import { normaliseCardItem } from '@/utils/slugHelpers';

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
    <div className="max-w-screen-xl mx-auto py-0 pb-20 md:pb-0">
      {home.loading && (
        <div className="px-4 pt-6 mb-7"><SkeletonBanner /></div>
      )}

      <div className="px-4 pt-6 mb-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <span className="text-cyan">📺</span> Anime
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
