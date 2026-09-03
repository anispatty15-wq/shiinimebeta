'use client';
// src/app/page.tsx — Home Page (All Content Types)

import { useCallback } from 'react';
import { AnimeAPI, DonghuaAPI, HentaiAPI, ComicAPI } from '@/lib/api';
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

function toComicItems(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => normaliseCardItem(c, 'comic'))
    .filter(Boolean)
    .map((c) => ({
      slug:   c!.slug,
      title:  c!.title,
      poster: c!.poster,
      status: c!.status || '',
      type:   c!.typeLabel,
      score:  c!.score as string | number | undefined,
      meta:   c!.meta,
      date:   c!.date,
      href:   c!.href,
    }));
}

export default function HomePage() {
  // Anime sections
  const animeHome = useApi(useCallback(() => AnimeAPI.getHome(), []), []);
  
  // Donghua sections
  const donghuaLatest = useApi(useCallback(() => DonghuaAPI.getLatest(), []), []);
  
  // Hentai sections
  const hentaiHome = useApi(useCallback(() => HentaiAPI.getHome(), []), []);
  
  // Comic sections
  const comicPopular = useApi(useCallback(() => ComicAPI.getPopular(), []), []);
  const comicLatest = useApi(useCallback(() => ComicAPI.getLatest(), []), []);
  
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
      <div className="px-4 mb-6 mt-6">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="text-cyan">📺</span> Anime
        </h2>
      </div>

      <SectionRow
        title="Top Anime"
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
        title="Top Donghua"
        items={toItems(donghuaLatest.data, 'Ongoing')}
        loading={donghuaLatest.loading}
        error={donghuaLatest.error}
        contentType="anime"
        basePath="/stream/anime"
        moreHref="/donghua"
        accent="yellow-400"
      />

      {/* Hentai Section - LOCKED (18+ only) */}
      <div className="px-4 mb-6 mt-12">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="text-pink-400">🔞</span> Hentai
        </h2>
      </div>

      <div className="relative px-4 mb-8">
        {/* Blurred content behind */}
        <div className="blur-md pointer-events-none">
          <SectionRow
            title="Top Hentai"
            items={toItems(hentaiHome.data).slice(0, 6)}
            loading={hentaiHome.loading}
            error={hentaiHome.error}
            contentType="hentai"
            basePath="/stream/hentai"
            moreHref="/hentai"
            accent="pink"
          />
        </div>
        
        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-app border border-pink/20">
          <div className="text-center max-w-sm px-4">
            <div className="w-16 h-16 rounded-full bg-pink/10 border border-pink/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">
              Konten Dewasa (18+)
            </h3>
            <p className="text-sm text-secondary mb-4">
              Verifikasi usia di profil untuk mengakses konten ini
            </p>
            <a
              href="/hentai"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-app bg-pink text-white font-semibold text-sm hover:brightness-110 transition-all"
            >
              🔞 Buka Hentai
            </a>
          </div>
        </div>
      </div>

      {/* Comic Section */}
      <div className="px-4 mb-6 mt-12">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="text-violet-400">📚</span> Komik
        </h2>
      </div>

      <SectionRow
        title="Komik Populer"
        items={toComicItems(comicPopular.data)}
        loading={comicPopular.loading}
        error={comicPopular.error}
        contentType="comic"
        basePath="/read/comic"
        moreHref="/comic"
        accent="violet"
      />

      <div className="mt-8">
        <SectionRow
          title="Komik Terbaru"
          items={toComicItems(comicLatest.data)}
          loading={comicLatest.loading}
          error={comicLatest.error}
          contentType="comic"
          basePath="/read/comic"
          moreHref="/comic"
          accent="violet"
        />
      </div>

      {/* Movies Section */}
      <div className="px-4 mb-6 mt-12">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="text-pink-400">🎬</span> Anime Movie
        </h2>
      </div>

      <div className="mb-20">
        <SectionRow
          title="Top Movie"
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
