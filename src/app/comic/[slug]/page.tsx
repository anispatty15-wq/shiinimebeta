'use client';
// src/app/comic/[slug]/page.tsx — Comic Series Detail

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, BookOpen, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { ComicAPI, toArray } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import { useBookmarkToggle } from '@/context/BookmarkContext';
import { SkeletonDetail } from '@/components/SkeletonLoader';
import MediaCard from '@/components/MediaCard';

// ── Safe field extractors ──────────────────────────────────────
// API field names vary — try every known alias
function getStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== '') return String(v);
  }
  return '';
}

function getArr(obj: Record<string, unknown>, ...keys: string[]): unknown[] {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  return [];
}

// ── Chapter item shape ─────────────────────────────────────────
interface ChapterItem {
  slug:    string;
  title:   string;
  number:  string | number;
  date?:   string;
}

function extractChapters(raw: Record<string, unknown>): ChapterItem[] {
  const arr = getArr(
    raw,
    'chapterList', 'chapters', 'chapter_list',
    'episodeList', 'episodes', 'episode_list'
  );
  return arr.map((c) => {
    const item = c as Record<string, unknown>;
    return {
      slug:   getStr(item, 'slug', 'id', 'link'),
      title:  getStr(item, 'title', 'name', 'chapterTitle'),
      number: item.number ?? item.chapter ?? item.num ?? '',
      date:   getStr(item, 'date', 'updatedAt', 'updated_at'),
    };
  }).filter((c) => c.slug);
}

// ── Genre extractor ────────────────────────────────────────────
function extractGenres(raw: Record<string, unknown>): string[] {
  const arr = getArr(raw, 'genres', 'genre', 'tags', 'categories');
  return arr.map((g) => {
    if (typeof g === 'string') return g;
    const item = g as Record<string, unknown>;
    return getStr(item, 'name', 'title', 'label') || '';
  }).filter(Boolean);
}

export default function ComicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const [imgErr,  setImgErr]  = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: rawComic, loading, error } = useApi(
    useCallback(() => ComicAPI.getDetail(slug ?? ''), [slug]),
    [slug]
  );

  // ── Normalise — handle any field structure the API returns ──
  const comic = rawComic
    ? (rawComic as unknown as Record<string, unknown>)
    : null;

  const title    = comic ? getStr(comic, 'title', 'name', 'seriesTitle') : '';
  const altTitle = comic ? getStr(comic, 'altTitle', 'alternative', 'alt_title', 'synonyms') : '';
  const poster   = comic ? getStr(comic, 'poster', 'image', 'cover', 'thumbnail', 'coverImage') : '';
  const synopsis = comic ? getStr(comic, 'synopsis', 'description', 'summary', 'desc') : '';
  const status   = comic ? getStr(comic, 'status') : '';
  const type     = comic ? getStr(comic, 'type', 'format') : '';
  const score    = comic ? getStr(comic, 'score', 'rating', 'stars') : '';
  const author   = comic ? getStr(comic, 'author', 'authors', 'writer') : '';
  const artist   = comic ? getStr(comic, 'artist', 'artists', 'illustrator') : '';
  const released = comic ? getStr(comic, 'released', 'year', 'publishedAt', 'published') : '';
  const updated  = comic ? getStr(comic, 'updated', 'updatedAt', 'lastUpdate', 'last_update') : '';

  const genreList  = comic ? extractGenres(comic)   : [];
  const chapters   = comic ? extractChapters(comic) : [];
  const visibleCh  = showAll ? chapters : chapters.slice(0, 30);

  // Related comics
  const related = comic
    ? getArr(comic, 'related', 'recommendations', 'similar', 'relatedSeries')
    : [];

  const { bookmarked, toggle } = useBookmarkToggle(
    comic && title
      ? { slug: slug ?? '', id: slug ?? '', title, poster, type: 'comic' }
      : null
  );

  // ── Render states ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4">
        <SkeletonDetail />
      </div>
    );
  }

  if (error || !comic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <span className="text-4xl" aria-hidden>😵</span>
        <p className="text-sm text-center">
          {error ?? 'Gagal mengambil detail komik.'}
        </p>
        <button onClick={() => router.back()} className="btn-ghost text-sm mt-2">
          ← Kembali
        </button>
      </div>
    );
  }

  // DEBUG: if title is empty, show raw data in dev
  if (!title && process.env.NODE_ENV !== 'production') {
    console.warn('[ComicDetail] title empty — raw API response:', comic);
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* ── Hero ── */}
      <div className="relative">
        {poster && !imgErr && (
          <div className="absolute inset-0 overflow-hidden h-56">
            <Image
              src={poster} alt="" fill aria-hidden priority
              className="object-cover blur-2xl scale-110 opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/60 to-bg" />
          </div>
        )}

        <div className="relative z-10 flex gap-4 px-4 pt-6 pb-4">
          {/* Poster */}
          <div className="w-28 flex-shrink-0 rounded-card overflow-hidden shadow-card aspect-[2/3] bg-surface-2 relative">
            {poster && !imgErr ? (
              <Image
                src={poster} alt={title} fill sizes="112px"
                className="object-cover"
                onError={() => setImgErr(true)}
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted text-3xl">
                📚
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-base sm:text-lg font-bold text-primary leading-snug line-clamp-3 mb-1">
              {title || slug}
            </h1>
            {altTitle && (
              <p className="text-xs text-muted mb-2 line-clamp-1">{altTitle}</p>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3">
              {score && (
                <span className="flex items-center gap-1 text-xs text-yellow-400 font-semibold">
                  <Star className="w-3 h-3 fill-current" aria-hidden /> {score}
                </span>
              )}
              {status && (
                <span className={clsx(
                  'badge',
                  status.toLowerCase().includes('ongoing')
                    ? 'badge-ongoing'
                    : 'badge-completed'
                )}>
                  {status}
                </span>
              )}
              {type && <span className="badge badge-comic">{type}</span>}
            </div>

            {/* Meta */}
            <div className="text-xs text-muted space-y-0.5">
              {author   && <p>Penulis: <span className="text-secondary">{author}</span></p>}
              {artist   && author !== artist && <p>Artist: <span className="text-secondary">{artist}</span></p>}
              {released && <p>Terbit: <span className="text-secondary">{released}</span></p>}
              {updated  && <p>Update: <span className="text-secondary">{updated}</span></p>}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-4">
              {chapters.length > 0 && (
                <button
                  onClick={() => {
                    // Start from first (newest) chapter
                    const first = chapters[0];
                    if (first?.slug) router.push(`/comic/chapter/${first.slug}`);
                  }}
                  className="btn-violet text-sm px-4 py-2 flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" aria-hidden /> Baca
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
                <Heart
                  className="w-4 h-4"
                  fill={bookmarked ? 'currentColor' : 'none'}
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pb-8 space-y-6">

        {/* Genres */}
        {genreList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genreList.map((g) => (
              <span key={g} className="badge badge-comic">{g}</span>
            ))}
          </div>
        )}

        {/* Synopsis */}
        {synopsis && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-2">Sinopsis</h2>
            <p className="text-sm text-secondary leading-relaxed">{synopsis}</p>
          </section>
        )}

        {/* Chapter list */}
        {chapters.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">
              Daftar Chapter ({chapters.length})
            </h2>
            <div className="space-y-1.5">
              {visibleCh.map((ch) => (
                <button
                  key={ch.slug}
                  onClick={() => router.push(`/comic/chapter/${ch.slug}`)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-app bg-surface hover:bg-surface-2 border border-border hover:border-violet/40 transition-all text-left"
                >
                  <span className="text-sm font-medium text-primary">
                    {ch.title || `Chapter ${ch.number}`}
                  </span>
                  {ch.date && (
                    <span className="text-xs text-muted flex-shrink-0 ml-3">{ch.date}</span>
                  )}
                </button>
              ))}
            </div>
            {chapters.length > 30 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 flex items-center gap-1 text-xs text-cyan font-medium hover:underline"
              >
                {showAll ? (
                  <><ChevronUp className="w-3.5 h-3.5" aria-hidden /> Tampilkan lebih sedikit</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" aria-hidden /> Tampilkan semua ({chapters.length})</>
                )}
              </button>
            )}
          </section>
        )}

        {/* Empty state — data returned but no useful fields */}
        {!synopsis && chapters.length === 0 && !genreList.length && (
          <div className="text-center py-10 text-muted">
            <span className="text-3xl block mb-2" aria-hidden>📭</span>
            <p className="text-sm">Detail komik tidak lengkap dari sumber.</p>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">Komik Terkait</h2>
            <div className="card-grid">
              {toArray(related).map((r) => {
                const item = r as Record<string, unknown>;
                const rSlug = String(item.slug ?? item.id ?? '');
                const rTitle = String(item.title ?? item.name ?? '');
                const rPoster = String(item.poster ?? item.image ?? item.cover ?? '');
                if (!rSlug) return null;
                return (
                  <MediaCard
                    key={rSlug}
                    item={{ slug: rSlug, title: rTitle, poster: rPoster }}
                    contentType="comic"
                    href={`/comic/${rSlug}`}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
