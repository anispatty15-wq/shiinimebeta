'use client';
// src/app/hentai/[slug]/page.tsx — Hentai Series Detail

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { HentaiAPI, toArray } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import { useBookmarkToggle } from '@/context/BookmarkContext';
import { SkeletonDetail } from '@/components/SkeletonLoader';
import MediaCard from '@/components/MediaCard';
import { isEpisodeSlug } from '@/utils/slugHelpers';

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

interface EpItem { slug: string; title: string; number: string | number; date?: string; }

function extractEpisodes(raw: Record<string, unknown>): EpItem[] {
  const arr = getArr(raw, 'episodeList', 'episodes', 'episode_list', 'chapterList');
  return arr.map((e) => {
    const item = e as Record<string, unknown>;
    return {
      slug:   getStr(item, 'slug', 'id', 'link'),
      title:  getStr(item, 'title', 'name', 'episodeTitle'),
      number: item.number ?? item.episode ?? item.ep ?? '',
      date:   getStr(item, 'date', 'updatedAt'),
    };
  }).filter((e) => e.slug);
}

function extractGenres(raw: Record<string, unknown>): string[] {
  const arr = getArr(raw, 'genres', 'genre', 'tags', 'categories');
  return arr.map((g) => {
    if (typeof g === 'string') return g;
    const item = g as Record<string, unknown>;
    return getStr(item, 'name', 'title', 'label');
  }).filter(Boolean);
}

export default function HentaiDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const [imgErr,  setImgErr]  = useState(false);
  const [showAll, setShowAll] = useState(false);

  // If someone lands here with an episode slug, redirect to episode page
  if (slug && isEpisodeSlug(slug)) {
    router.replace(`/hentai/episode/${slug}`);
    return null;
  }

  const { data: rawSeries, loading, error } = useApi(
    useCallback(() => HentaiAPI.getDetail(slug ?? ''), [slug]),
    [slug]
  );

  const series  = rawSeries ? (rawSeries as unknown as Record<string, unknown>) : null;
  const title   = series ? getStr(series, 'title', 'name') : '';
  const altTitle = series ? getStr(series, 'altTitle', 'alternative', 'alt_title') : '';
  const poster  = series ? getStr(series, 'poster', 'image', 'cover', 'thumbnail') : '';
  const synopsis= series ? getStr(series, 'synopsis', 'description', 'summary') : '';
  const category= series ? getStr(series, 'category', 'type', 'format') : '';
  const studio  = series ? getStr(series, 'studio', 'producer', 'label') : '';
  const year    = series ? getStr(series, 'year', 'released', 'publishedAt') : '';
  const duration= series ? getStr(series, 'duration', 'runtime') : '';
  const genreList = series ? extractGenres(series) : [];
  const episodes  = series ? extractEpisodes(series) : [];
  const visibleEps = showAll ? episodes : episodes.slice(0, 20);
  const related = series ? getArr(series, 'related', 'recommendations', 'similar') : [];

  const { bookmarked, toggle } = useBookmarkToggle(
    series && title
      ? { slug: slug ?? '', id: slug ?? '', title, poster, type: 'hentai' }
      : null
  );

  if (loading) return <div className="max-w-screen-xl mx-auto px-4"><SkeletonDetail /></div>;

  if (error || !series) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <span className="text-4xl" aria-hidden>😵</span>
        <p className="text-sm text-center">{error ?? 'Gagal mengambil detail series Nekopoi.'}</p>
        <button onClick={() => router.back()} className="btn-ghost text-sm mt-2">← Kembali</button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Hero */}
      <div className="relative">
        {poster && !imgErr && (
          <div className="absolute inset-0 overflow-hidden h-52">
            <Image src={poster} alt="" fill className="object-cover blur-2xl scale-110 opacity-20" aria-hidden priority />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/60 to-bg" />
          </div>
        )}
        <div className="relative z-10 flex gap-4 px-4 pt-6 pb-4">
          <div className="w-28 flex-shrink-0 rounded-card overflow-hidden shadow-card aspect-[2/3] bg-surface-2 relative">
            {poster && !imgErr ? (
              <Image src={poster} alt={title} fill sizes="112px" className="object-cover" onError={() => setImgErr(true)} priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted text-3xl">🎬</div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-base sm:text-lg font-bold text-primary leading-snug line-clamp-3 mb-1">
              {title || slug}
            </h1>
            {altTitle && <p className="text-xs text-muted mb-2 line-clamp-1">{altTitle}</p>}
            <div className="flex flex-wrap gap-2 mb-3">
              {category && <span className="badge badge-hentai">{category}</span>}
              {year && <span className="text-xs text-muted">{year}</span>}
              {studio && <span className="text-xs text-muted">{studio}</span>}
              {duration && <span className="text-xs text-muted">{duration}</span>}
            </div>
            <div className="flex gap-2.5 mt-3">
              {episodes.length > 0 && (
                <button
                  onClick={() => router.push(`/hentai/episode/${episodes[0]?.slug}`)}
                  className="btn-pink text-sm px-4 py-2 flex items-center gap-1.5"
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
                  bookmarked ? 'bg-pink/15 border-pink text-pink' : 'bg-surface border-border text-muted hover:text-pink hover:border-pink'
                )}
              >
                <Heart className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-6">
        {genreList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genreList.map((g) => <span key={g} className="badge badge-hentai">{g}</span>)}
          </div>
        )}

        {synopsis && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-2">Sinopsis</h2>
            <p className="text-sm text-secondary leading-relaxed">{synopsis}</p>
          </section>
        )}

        {episodes.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">Episode ({episodes.length})</h2>
            <div className="flex flex-wrap gap-2">
              {visibleEps.map((ep) => (
                <button
                  key={ep.slug}
                  onClick={() => router.push(`/hentai/episode/${ep.slug}`)}
                  className="ep-pill"
                >
                  {ep.number ? `Ep. ${ep.number}` : ep.title}
                </button>
              ))}
            </div>
            {episodes.length > 20 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 flex items-center gap-1 text-xs text-cyan font-medium hover:underline"
              >
                {showAll
                  ? <><ChevronUp className="w-3.5 h-3.5" aria-hidden /> Lebih sedikit</>
                  : <><ChevronDown className="w-3.5 h-3.5" aria-hidden /> Semua ({episodes.length})</>}
              </button>
            )}
          </section>
        )}

        {!synopsis && episodes.length === 0 && !genreList.length && (
          <div className="text-center py-10 text-muted">
            <span className="text-3xl block mb-2" aria-hidden>📭</span>
            <p className="text-sm">Detail series tidak lengkap dari sumber.</p>
          </div>
        )}

        {related.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">Terkait</h2>
            <div className="card-grid">
              {toArray(related).map((r) => {
                const item = r as Record<string, unknown>;
                const rSlug = String(item.slug ?? item.id ?? '');
                if (!rSlug) return null;
                return (
                  <MediaCard
                    key={rSlug}
                    item={{ slug: rSlug, title: String(item.title ?? ''), poster: String(item.poster ?? item.image ?? '') }}
                    contentType="hentai"
                    href={`/hentai/${rSlug}`}
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
