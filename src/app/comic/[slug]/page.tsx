'use client';
// src/app/comic/[slug]/page.tsx — Comic Series Detail

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, BookOpen, ChevronRight, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { ComicAPI, getPoster, toArray } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import { useBookmarkToggle } from '@/context/BookmarkContext';
import { SkeletonDetail } from '@/components/SkeletonLoader';
import MediaCard from '@/components/MediaCard';
import type { ComicChapterItem } from '@/types/media';

export default function ComicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: comic, loading, error } = useApi(
    useCallback(() => ComicAPI.getDetail(slug ?? ''), [slug]),
    [slug]
  );

  const poster = getPoster(comic as Record<string, unknown> | null ?? {});

  const { bookmarked, toggle } = useBookmarkToggle(
    comic ? { slug: comic.slug, id: comic.slug, title: comic.title, poster, type: 'comic' } : null
  );

  if (loading) return <div className="max-w-screen-xl mx-auto px-4"><SkeletonDetail /></div>;

  if (error || !comic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <p className="text-sm">{error ?? 'Komik tidak ditemukan.'}</p>
        <button onClick={() => router.back()} className="btn-ghost text-sm">← Kembali</button>
      </div>
    );
  }

  const chapters: ComicChapterItem[] = Array.isArray(comic.chapterList)
    ? (comic.chapterList as ComicChapterItem[])
    : [];
  const visibleCh = showAll ? chapters : chapters.slice(0, 30);
  const genreList = (comic.genres ?? []).map((g) =>
    typeof g === 'string' ? g : (g as { name: string }).name
  );

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
              <Image src={poster} alt={comic.title} fill sizes="112px" className="object-cover" onError={() => setImgErr(true)} priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted text-3xl">📚</div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-lg font-bold text-primary leading-snug line-clamp-2 mb-1">{comic.title}</h1>
            {comic.altTitle && <p className="text-xs text-muted mb-2 line-clamp-1">{comic.altTitle}</p>}

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
              {comic.score != null && (
                <span className="flex items-center gap-1 text-xs text-yellow-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" aria-hidden /> {comic.score}
                </span>
              )}
              {comic.status && (
                <span className={clsx('badge', comic.status.toLowerCase().includes('ongoing') ? 'badge-ongoing' : 'badge-completed')}>
                  {comic.status}
                </span>
              )}
              {comic.type && <span className="badge badge-comic">{comic.type}</span>}
            </div>

            <div className="text-xs text-muted space-y-0.5">
              {comic.author   && <p>Penulis: <span className="text-secondary">{comic.author}</span></p>}
              {comic.released && <p>Terbit: <span className="text-secondary">{String(comic.released)}</span></p>}
              {comic.updated  && <p>Diperbarui: <span className="text-secondary">{comic.updated}</span></p>}
            </div>

            <div className="flex gap-2.5 mt-4">
              {chapters.length > 0 && (
                <button
                  onClick={() => router.push(`/comic/chapter/${chapters[chapters.length - 1]?.slug}`)}
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
                <Heart className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-6">
        {genreList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genreList.map((g) => <span key={g} className="badge badge-comic">{g}</span>)}
          </div>
        )}

        {comic.synopsis && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-2">Sinopsis</h2>
            <p className="text-sm text-secondary leading-relaxed">{comic.synopsis}</p>
          </section>
        )}

        {chapters.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">Daftar Chapter ({chapters.length})</h2>
            <div className="space-y-1.5">
              {visibleCh.map((ch) => (
                <button
                  key={ch.slug}
                  onClick={() => router.push(`/comic/chapter/${ch.slug}`)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-app bg-surface hover:bg-surface-2 border border-border hover:border-violet/40 transition-all text-left"
                >
                  <span className="text-sm font-medium text-primary">
                    {ch.title ?? `Chapter ${ch.number}`}
                  </span>
                  {ch.date && <span className="text-xs text-muted flex-shrink-0 ml-3">{ch.date}</span>}
                </button>
              ))}
            </div>
            {chapters.length > 30 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 flex items-center gap-1 text-xs text-violet-light font-medium hover:underline"
              >
                {showAll ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${chapters.length})`}
                <ChevronRight className={clsx('w-3.5 h-3.5 transition-transform', showAll && 'rotate-90')} aria-hidden />
              </button>
            )}
          </section>
        )}

        {Array.isArray(comic.related) && comic.related.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">Komik Terkait</h2>
            <div className="card-grid">
              {toArray(comic.related).map((r) => (
                <MediaCard
                  key={r.slug}
                  item={{ slug: r.slug, title: r.title, poster: r.poster ?? r.image ?? r.cover ?? '' }}
                  contentType="comic"
                  href={`/comic/${r.slug}`}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
