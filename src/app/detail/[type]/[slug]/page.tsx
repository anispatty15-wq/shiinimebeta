'use client';
// src/app/detail/[type]/[slug]/page.tsx
// Universal detail screen — handles anime, hentai, and comic.
// Route params:
//   type  = 'anime' | 'hentai' | 'comic'
//   slug  = series slug from API

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, Play, BookOpen,
  ChevronDown, ChevronUp, Star,
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimeAPI, HentaiAPI, ComicAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useBookmarkToggle } from '@/context/BookmarkContext';
import { SkeletonDetail } from '@/components/SkeletonLoader';
import type {
  AnimeDetail, HentaiDetail, ComicDetail, ContentType,
} from '@/types/media';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function badgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('ongoing')) return 'badge badge-ongoing';
  if (s.includes('complete')) return 'badge badge-completed';
  if (s.includes('movie')) return 'badge badge-movie';
  return 'badge bg-white/10 border-white/10 text-secondary';
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function DetailPage() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const router         = useRouter();
  const [imgErr,   setImgErr]   = useState(false);
  const [showAll,  setShowAll]  = useState(false);

  const contentType = (type as ContentType) ?? 'anime';

  // ── Fetch detail based on type ─────────────────────────────
  const animeFetch  = useApi(useCallback(() => AnimeAPI.getDetail(slug ?? ''),  [slug]), [slug], null, contentType !== 'anime');
  const hentaiFetch = useApi(useCallback(() => HentaiAPI.getDetail(slug ?? ''), [slug]), [slug], null, contentType !== 'hentai');
  const comicFetch  = useApi(useCallback(() => ComicAPI.getDetail(slug ?? ''),  [slug]), [slug], null, contentType !== 'comic');

  const loading = animeFetch.loading || hentaiFetch.loading || comicFetch.loading;
  const error   = animeFetch.error   || hentaiFetch.error   || comicFetch.error;

  // ── Type-safe data extraction ──────────────────────────────
  const animeData  = contentType === 'anime'  ? (animeFetch.data  as AnimeDetail  | null) : null;
  const hentaiData = contentType === 'hentai' ? (hentaiFetch.data as HentaiDetail | null) : null;
  const comicData  = contentType === 'comic'  ? (comicFetch.data  as ComicDetail  | null) : null;

  const title    = animeData?.title  ?? hentaiData?.title  ?? comicData?.title  ?? '';
  const poster   = animeData?.poster ?? hentaiData?.poster ?? comicData?.poster ?? '';
  const synopsis = animeData?.synopsis ?? hentaiData?.synopsis ?? comicData?.synopsis ?? '';
  const genres   = animeData?.genres ?? [];

  const episodeList = animeData?.episode_list  ?? hentaiData?.episode_list ?? [];
  const chapterList = comicData?.chapters ?? [];

  const allItems = contentType === 'comic' ? chapterList : episodeList;
  const visibleItems = showAll ? allItems : allItems.slice(0, 20);

  // ── Bookmark ───────────────────────────────────────────────
  const { bookmarked, toggle } = useBookmarkToggle(
    title ? { slug: slug ?? '', title, poster, type: contentType } : null
  );

  // ── Render states ──────────────────────────────────────────
  if (loading) {
    return <div className="max-w-screen-xl mx-auto px-4"><SkeletonDetail /></div>;
  }

  if (error || (!animeData && !hentaiData && !comicData)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <span className="text-4xl" aria-hidden>😵</span>
        <p className="text-sm text-center">{error ?? 'Konten tidak ditemukan.'}</p>
        <button onClick={() => router.back()} className="btn-ghost text-sm mt-2">
          ← Kembali
        </button>
      </div>
    );
  }

  // ── Determine action button & links ───────────────────────
  const firstEpisodeSlug = episodeList[0]?.slug ?? '';
  const firstChapterSlug = chapterList[0]?.slug ?? '';
  const streamHref = contentType === 'comic'
    ? `/read/${firstChapterSlug}?series=${slug}`
    : `/stream/${contentType}/${firstEpisodeSlug}`;

  const canPlay = contentType === 'comic'
    ? chapterList.length > 0
    : episodeList.length > 0;

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* ── Hero ── */}
      <div className="relative">
        {/* Background blur */}
        {poster && !imgErr && (
          <div className="absolute inset-0 overflow-hidden h-56" aria-hidden>
            <Image src={poster} alt="" fill className="object-cover blur-2xl scale-110 opacity-[0.18]" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/60 to-bg" />
          </div>
        )}

        <div className="relative z-10 flex gap-4 px-4 pt-6 pb-4">
          {/* Poster */}
          <div className="w-28 sm:w-32 flex-shrink-0 rounded-card overflow-hidden shadow-card aspect-[2/3] bg-surface-2 relative">
            {poster && !imgErr ? (
              <Image
                src={poster}
                alt={title}
                fill
                sizes="128px"
                className="object-cover"
                priority
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-3xl text-muted">
                {contentType === 'comic' ? '📚' : '🎬'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-base sm:text-lg font-bold text-primary leading-snug line-clamp-3 mb-2">
              {title || slug}
            </h1>

            {/* Genres (anime only) */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {genres.slice(0, 5).map((g) => (
                  <span key={g} className={badgeClass(g)}>{g}</span>
                ))}
              </div>
            )}

            {/* Counts */}
            <p className="text-xs text-muted mb-4">
              {contentType === 'comic'
                ? `${chapterList.length} chapter`
                : `${episodeList.length} episode`}
            </p>

            {/* Actions */}
            <div className="flex gap-2.5 flex-wrap">
              {canPlay && (
                <Link
                  href={streamHref}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-app text-sm font-bold transition-all',
                    contentType === 'comic'
                      ? 'btn-violet'
                      : contentType === 'hentai'
                        ? 'btn-pink'
                        : 'btn-primary'
                  )}
                >
                  {contentType === 'comic'
                    ? <><BookOpen className="w-4 h-4" aria-hidden /> Baca</>
                    : <><Play className="w-4 h-4 fill-current" aria-hidden /> Tonton</>}
                </Link>
              )}

              <button
                onClick={() => toggle()}
                aria-label={bookmarked ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                aria-pressed={bookmarked}
                className={clsx(
                  'w-9 h-9 flex items-center justify-center rounded-app border transition-all',
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
      <div className="px-4 pb-10 space-y-7">

        {/* Synopsis */}
        {synopsis && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-2">Sinopsis</h2>
            <p className="text-sm text-secondary leading-relaxed">{synopsis}</p>
          </section>
        )}

        {/* Episode / Chapter list */}
        {allItems.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">
              {contentType === 'comic' ? 'Daftar Chapter' : 'Daftar Episode'}{' '}
              <span className="text-muted font-normal">({allItems.length})</span>
            </h2>

            {contentType === 'comic' ? (
              /* Chapter list — vertical rows with date */
              <div className="space-y-1.5">
                {(visibleItems as typeof chapterList).map((ch) => (
                  <Link
                    key={ch.slug}
                    href={`/read/${ch.slug}?series=${slug}`}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-app bg-surface hover:bg-surface-2 border border-border hover:border-violet/40 transition-all"
                  >
                    <span className="text-sm font-medium text-primary truncate">{ch.title}</span>
                    {ch.release_date && (
                      <span className="text-xs text-muted flex-shrink-0 ml-3">{ch.release_date}</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              /* Episode number pills — compact, extract number from title */
              <div className="flex flex-wrap gap-1.5">
                {(visibleItems as typeof episodeList).map((ep, idx) => {
                  const nums    = ep.title.match(/\d+/g);
                  const epLabel = nums ? nums[nums.length - 1] : String(idx + 1);
                  return (
                    <Link
                      key={ep.slug}
                      href={`/stream/${contentType}/${ep.slug}`}
                      title={ep.title}
                      className="ep-pill min-w-[2.75rem] text-center px-2"
                    >
                      {epLabel}
                    </Link>
                  );
                })}
              </div>
            )}

            {allItems.length > 20 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 flex items-center gap-1 text-xs text-cyan font-medium hover:underline"
              >
                {showAll
                  ? <><ChevronUp className="w-3.5 h-3.5" aria-hidden /> Tampilkan lebih sedikit</>
                  : <><ChevronDown className="w-3.5 h-3.5" aria-hidden /> Tampilkan semua ({allItems.length})</>}
              </button>
            )}
          </section>
        )}

        {/* Empty state */}
        {allItems.length === 0 && !loading && (
          <div className="text-center py-10 text-muted">
            <span className="text-3xl block mb-2" aria-hidden>📭</span>
            <p className="text-sm">Tidak ada episode/chapter tersedia saat ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
