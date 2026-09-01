'use client';
// src/app/comic/chapter/[slug]/page.tsx — Comic Reader

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ComicAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import ComicReader from '@/components/ComicReader';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import type { ComicChapter } from '@/types/media';

export default function ComicChapterPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();

  const { data: raw, loading, error } = useApi(
    useCallback(() => ComicAPI.readChapter(slug ?? ''), [slug]),
    [slug]
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <SkeletonGrid count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <span className="text-4xl" aria-hidden>😵</span>
        <p className="text-sm">{error}</p>
        <button onClick={() => router.back()} className="btn-ghost text-sm">← Kembali</button>
      </div>
    );
  }

  // API may return string[] directly or a ComicChapter object
  let pages: string[] = [];
  let chapterMeta: Partial<ComicChapter> = {};

  if (Array.isArray(raw)) {
    pages = raw as string[];
  } else if (raw && typeof raw === 'object') {
    const ch = raw as ComicChapter;
    pages       = Array.isArray(ch.pages) ? ch.pages : [];
    chapterMeta = ch;
  }

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <span className="text-4xl" aria-hidden>📭</span>
        <p className="text-sm">Halaman chapter tidak tersedia.</p>
        <button onClick={() => router.back()} className="btn-ghost text-sm">← Kembali</button>
      </div>
    );
  }

  return (
    <ComicReader
      pages={pages}
      meta={{
        slug:         slug ?? '',
        seriesSlug:   chapterMeta.seriesSlug  ?? '',
        title:        chapterMeta.seriesTitle ?? '',
        chapterTitle: chapterMeta.title        ?? `Chapter ${chapterMeta.number ?? ''}`,
        poster:       chapterMeta.poster       ?? '',
        totalPages:   pages.length,
      }}
      prevChapter={chapterMeta.prevChapter ?? null}
      nextChapter={chapterMeta.nextChapter ?? null}
      chapterBase="/comic/chapter"
    />
  );
}
