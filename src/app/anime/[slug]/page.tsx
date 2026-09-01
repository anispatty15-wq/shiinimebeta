'use client';
// src/app/anime/[slug]/page.tsx — Anime Detail

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Play, ChevronRight, Star, Calendar, Clock, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimeAPI, getPoster, toArray } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import { useBookmarkToggle } from '@/context/BookmarkContext';
import { SkeletonDetail } from '@/components/SkeletonLoader';
import MediaCard from '@/components/MediaCard';
import type { AnimeEpisodeItem } from '@/types/media';

export default function AnimeDetailPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: anime, loading, error } = useApi(
    useCallback(() => AnimeAPI.getDetail(slug ?? ''), [slug]),
    [slug]
  );

  const poster = getPoster(anime as Record<string, unknown> | null ?? {});

  const { bookmarked, toggle } = useBookmarkToggle(
    anime
      ? { slug: anime.slug, id: anime.slug, title: anime.title, poster, type: 'anime' }
      : null
  );

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4">
        <SkeletonDetail />
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <span className="text-4xl" aria-hidden>😵</span>
        <p className="text-sm font-medium text-center">{error ?? 'Anime tidak ditemukan.'}</p>
        <button onClick={() => router.back()} className="btn-ghost text-sm mt-2">← Kembali</button>
      </div>
    );
  }

  const episodes: AnimeEpisodeItem[] = Array.isArray(anime.episodeList)
    ? (anime.episodeList as AnimeEpisodeItem[])
    : [];
  const visibleEps = showAll ? episodes : episodes.slice(0, 20);

  const genreList = (anime.genres ?? []).map((g) =>
    typeof g === 'string' ? g : (g as { name: string }).name
  );

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* ── Hero section ── */}
      <div className="relative">
        {/* Blurred backdrop */}
        {poster && !imgErr && (
          <div className="absolute inset-0 overflow-hidden h-56 md:h-72">
            <Image
              src={poster}
              alt=""
              fill
              className="object-cover blur-2xl scale-110 opacity-25"
              priority
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/60 to-bg" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex gap-4 px-4 pt-6 pb-4">
          {/* Poster */}
          <div className="w-28 sm:w-32 flex-shrink-0 rounded-card overflow-hidden shadow-card aspect-[2/3] bg-surface-2 relative">
            {poster && !imgErr ? (
              <Image
                src={poster}
                alt={anime.title}
                fill
                sizes="128px"
                className="object-cover"
                onError={() => setImgErr(true)}
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted text-3xl">🎬</div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-lg sm:text-xl font-bold text-primary leading-snug line-clamp-2 mb-1">
              {anime.title}
            </h1>
            {anime.altTitle && (
              <p className="text-xs text-muted mb-3 line-clamp-1">{anime.altTitle}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
              {anime.score != null && (
                <span className="flex items-center gap-1 text-xs text-yellow-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" aria-hidden /> {anime.score}
                </span>
              )}
              {anime.status && (
                <span className={clsx(
                  'badge',
                  anime.status.toLowerCase().includes('ongoing') ? 'badge-ongoing' : 'badge-completed'
                )}>
                  {anime.status}
                </span>
              )}
              {anime.type && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Layers className="w-3 h-3" aria-hidden /> {anime.type}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {anime.aired    && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden />{anime.aired}</span>}
              {anime.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden />{anime.duration}</span>}
              {anime.episodes && <span>{anime.episodes} ep</span>}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-4">
              {episodes.length > 0 && (
                <button
                  onClick={() => router.push(`/anime/episode/${episodes[0]?.slug}`)}
                  className="btn-primary text-sm px-4 py-2"
                >
                  <Play className="w-4 h-4 fill-current" aria-hidden /> Tonton
                </button>
              )}
              <button
                onClick={() => toggle()}
                aria-label={bookmarked ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                aria-pressed={bookmarked}
                className={clsx(
                  'flex items-center justify-center w-9 h-9 rounded-app border transition-all',
                  bookmarked
                    ? 'bg-pink/15 border-pink text-pink'
                    : 'bg-surface border-border text-muted hover:text-pink hover:border-pink'
                )}
              >
                <Heart className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pb-8 space-y-7">

        {/* Genres */}
        {genreList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genreList.map((g) => (
              <span key={g} className="badge badge-ongoing cursor-default">{g}</span>
            ))}
          </div>
        )}

        {/* Synopsis */}
        {anime.synopsis && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-2">Sinopsis</h2>
            <p className="text-sm text-secondary leading-relaxed">{anime.synopsis}</p>
          </section>
        )}

        {/* Episode list */}
        {episodes.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">
              Daftar Episode ({episodes.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {visibleEps.map((ep) => (
                <button
                  key={ep.slug}
                  onClick={() => router.push(`/anime/episode/${ep.slug}`)}
                  className="ep-pill"
                >
                  {ep.number ?? ep.title}
                </button>
              ))}
            </div>
            {episodes.length > 20 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 flex items-center gap-1 text-xs text-cyan font-medium hover:underline"
              >
                {showAll ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${episodes.length})`}
                <ChevronRight className={clsx('w-3.5 h-3.5 transition-transform', showAll && 'rotate-90')} aria-hidden />
              </button>
            )}
          </section>
        )}

        {/* Related */}
        {Array.isArray(anime.related) && anime.related.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">Anime Terkait</h2>
            <div className="card-grid">
              {toArray(anime.related).map((r) => (
                <MediaCard
                  key={r.slug}
                  item={{ slug: r.slug, title: r.title, poster: r.poster ?? r.image ?? '', status: r.status, type: r.type }}
                  contentType="anime"
                  href={`/anime/${r.slug}`}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
