'use client';
// src/app/page.tsx — Home Page (All Content Types)

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
      status: c!.status || defaultStatus || '',
      type:   c!.typeLabel,
      score:  c!.score as string | number | undefined,
      meta:   c!.meta,
      date:   c!.date,
      href:   c!.href,
    }));
}

export default function HomePage() {
  // Anime sections
  const animeTerbaru = useApi(useCallback(() => AnimeAPI.getTerbaru(), []), []);
  const animeHome = useApi(useCallback(() => AnimeAPI.getHome(), []), []);
  
  // Donghua sections
  const donghuaTerbaru = useApi(useCallback(() => AnimeAPI.getDonghua(), []), []);
  
  // Movies
  const movies = useApi(useCallback(() => AnimeAPI.getMovies(), []), []);

  return (
    <div className="max-w-screen-xl mx-auto py-0">
      {/* Hero Banner */}
      <HeroBanner 
        title="Shiiinime Stream"
        subtitle="Nonton Anime, Donghua, Hentai & Baca Komik Online"
      />

      {animeHome.loading && (
        <div className="px-4 mb-7"><SkeletonBanner /></div>
      )}

      {/* Anime Section */}
      <div className="px-4 mb-6">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="text-cyan">📺</span> Anime
        </h2>
      </div>

      <SectionRow
        title="Anime Terbaru & Ongoing"
        items={toItems(animeTerbaru.data, 'Ongoing')}
        loading={animeTerbaru.loading}
        error={animeTerbaru.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/anime"
        accent="cyan"
      />

      <SectionRow
        title="Anime Beranda"
        items={toItems(animeHome.data)}
        loading={animeHome.loading}
        error={animeHome.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/anime"
        accent="cyan"
      />

      {/* Donghua Section */}
      <div className="px-4 mb-6 mt-12">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="text-yellow-400">🐉</span> Donghua
        </h2>
      </div>

      <SectionRow
        title="Donghua Terbaru"
        items={toItems(donghuaTerbaru.data, 'Ongoing')}
        loading={donghuaTerbaru.loading}
        error={donghuaTerbaru.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/donghua"
        accent="yellow-400"
      />

      {/* Movies Section */}
      <div className="px-4 mb-6 mt-12">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="text-pink-400">🎬</span> Anime Movie
        </h2>
      </div>

      <SectionRow
        title="Movie Terbaru"
        items={toItems(movies.data, 'Movie')}
        loading={movies.loading}
        error={movies.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/anime/movie"
        accent="pink"
      />
    </div>
  );
}
