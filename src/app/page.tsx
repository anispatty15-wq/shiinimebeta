'use client';
// src/app/page.tsx — Anime Home

import { useCallback } from 'react';
import { AnimeAPI, toArray } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import SectionRow    from '@/components/SectionRow';
import { SkeletonBanner, SkeletonRow } from '@/components/SkeletonLoader';
import type { AnimeCard } from '@/types/media';

function toCardItems(raw: unknown) {
  return toArray(raw as AnimeCard[]).map((a) => {
    // API may return slug in different fields depending on endpoint
    const item = a as Record<string, unknown>;
    const slug = String(
      item.slug ?? item.id ?? item.animeId ??
      // Some endpoints return a full URL — extract last path segment
      (typeof item.link === 'string'
        ? item.link.replace(/\/$/, '').split('/').pop()
        : undefined) ??
      ''
    );
    return {
      slug,
      title:  String(item.title  ?? item.name  ?? ''),
      poster: String(item.poster ?? item.image ?? item.thumbnail ?? item.cover ?? ''),
      status: String(item.status ?? ''),
      type:   String(item.type   ?? item.category ?? ''),
      score:  item.score  ?? undefined,
      meta:   item.episode != null
        ? `Ep. ${item.episode}`
        : (item.year ? String(item.year) : undefined),
    };
  }).filter((a) => a.slug); // drop items with no usable slug
}

export default function AnimePage() {
  const home    = useApi(useCallback(() => AnimeAPI.getHome(),    []), []);
  const terbaru = useApi(useCallback(() => AnimeAPI.getTerbaru(), []), []);
  const movies  = useApi(useCallback(() => AnimeAPI.getMovies(),  []), []);
  const donghua = useApi(useCallback(() => AnimeAPI.getDonghua(), []), []);

  return (
    <div className="max-w-screen-xl mx-auto py-5">
      {/* Banner placeholder */}
      {home.loading && (
        <div className="px-4 mb-7">
          <SkeletonBanner />
        </div>
      )}

      <SectionRow
        title="Terbaru & Ongoing"
        items={toCardItems(terbaru.data)}
        loading={terbaru.loading}
        error={terbaru.error}
        contentType="anime"
        basePath="/anime"
        moreHref="/anime/terbaru"
        accent="cyan"
      />

      <SectionRow
        title="Beranda"
        items={toCardItems(home.data)}
        loading={home.loading}
        error={home.error}
        contentType="anime"
        basePath="/anime"
        moreHref="/anime/list"
        accent="violet"
      />

      <SectionRow
        title="Anime Movie"
        items={toCardItems(movies.data)}
        loading={movies.loading}
        error={movies.error}
        contentType="anime"
        basePath="/anime"
        moreHref="/anime/movie"
        accent="pink"
      />

      <SectionRow
        title="Donghua Terbaru"
        items={toCardItems(donghua.data)}
        loading={donghua.loading}
        error={donghua.error}
        contentType="anime"
        basePath="/anime"
        moreHref="/anime/donghua"
        accent="cyan"
      />
    </div>
  );
}
