'use client';
// src/app/page.tsx — Home Page (All Content Types)

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimeAPI, DonghuaAPI, ComicAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useSearchSuggest } from '@/hooks/useSearchSuggest';
import SectionRow from '@/components/SectionRow';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import { normaliseCardItem } from '@/utils/slugHelpers';
import HeroBanner from '@/components/HeroBanner';
import TopBanner from '@/components/TopBanner';

function toItems(raw: unknown, defaultStatus?: string, contentType: 'anime' | 'donghua' = 'anime') {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => normaliseCardItem(a, contentType))
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
  
  // Donghua sections - use getHome for data
  const donghuaHome = useApi(useCallback(() => DonghuaAPI.getHome(), []), []);
  
  // Comic sections
  const comicPopular = useApi(useCallback(() => ComicAPI.getPopular(), []), []);
  const comicLatest = useApi(useCallback(() => ComicAPI.getLatest(), []), []);
  
  // Movies
  const movies = useApi(useCallback(() => AnimeAPI.getMovies(), []), []);

  return (
    <div className="max-w-screen-xl mx-auto py-0">
      {/* Hero Banner */}
      <div className="relative">
        <HeroBanner />
        <HomeSearch />
      </div>

      {animeHome.loading && (
        <div className="px-4 mb-7"><SkeletonBanner /></div>
      )}

      {/* Anime Section */}
      <div className="px-4 mb-6 mt-6">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="text-cyan">📺</span> Anime
        </h2>
      </div>

      <div className="px-4">
        <TopBanner
          title="Top Anime"
          items={toItems(animeHome.data)}
          basePath="/stream/anime"
          accentColor="cyan"
        />
      </div>

      {/* Donghua Section - LOCKED (Coming Soon) */}
      <div className="px-4 mb-6 mt-12">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="text-yellow-400">🐉</span> Donghua
        </h2>
      </div>

      <div className="relative px-4 mb-8">
        {/* Blurred content behind */}
        <div className="blur-md pointer-events-none">
          <TopBanner
            title="Top Donghua"
            items={toItems(donghuaHome.data, 'Ongoing', 'donghua').slice(0, 6)}
            basePath="/stream/anime"
            accentColor="yellow-400"
          />
        </div>
        
        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-app border border-yellow-400/20">
          <div className="text-center max-w-sm px-4">
            <div className="w-16 h-16 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🐉</span>
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">
              Donghua Coming Soon
            </h3>
            <p className="text-sm text-secondary mb-4">
              Konten Donghua sedang dalam pengembangan dan akan segera hadir!
            </p>
            <a
              href="/donghua"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-app bg-yellow-400 text-bg font-semibold text-sm hover:brightness-110 transition-all"
            >
              🔔 Info Donghua
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

function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { suggestions, loading } = useSearchSuggest(query, 'anime');

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}&type=anime`);
  };

  return (
    <div ref={wrapRef} className="absolute inset-x-4 bottom-5 z-10 mx-auto max-w-2xl sm:inset-x-8">
      <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-white/20 bg-bg/80 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <Search className="ml-2 shrink-0 text-cyan" size={20} />
        <input
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Cari anime, judul, atau karakter..."
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-primary outline-none placeholder:text-secondary"
          aria-label="Cari anime"
        />
        <button type="submit" className="rounded-xl bg-cyan px-4 py-2 text-sm font-bold text-bg transition hover:brightness-110">
          Cari
        </button>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-surface/95 shadow-2xl backdrop-blur-xl">
          {loading && <div className="px-4 py-3 text-sm text-secondary">Mencari...</div>}
          {!loading && suggestions.length === 0 && <div className="px-4 py-3 text-sm text-secondary">Tidak ada judul ditemukan.</div>}
          {!loading && suggestions.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => router.push(`/anime/${item.slug}`)}
              className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition last:border-0 hover:bg-white/10"
            >
              {item.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.poster} alt="" className="h-10 w-8 rounded object-cover" />
              ) : <div className="h-10 w-8 rounded bg-white/10" />}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{item.title}</span>
              <ArrowRight size={15} className="shrink-0 text-secondary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
