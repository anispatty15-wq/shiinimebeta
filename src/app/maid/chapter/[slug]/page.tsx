'use client';

import { Suspense, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import MaidComicNav from '@/components/MaidComicNav';
import ComicReader from '@/components/ComicReader';
import { MaidComicAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import type { ComicChapterData } from '@/types/media';

function ChapterContent() {
  const { slug } = useParams<{ slug: string }>();
  const series = useSearchParams().get('series') ?? '';
  const result = useApi(useCallback(() => MaidComicAPI.readChapter(slug ?? ''), [slug]), [slug], null);
  if (result.loading) return <><MaidComicNav /><div className="mx-auto max-w-2xl px-4 py-6"><SkeletonGrid count={4} /></div></>;
  if (result.error || !result.data || result.data.images.length === 0) return <><MaidComicNav /><div className="p-12 text-center text-sm text-secondary">Chapter tidak ditemukan atau belum memiliki halaman. {result.error ?? ''}</div></>;
  const chapter: ComicChapterData = { title: result.data.title, images: result.data.images, prev_chapter_slug: result.data.prev_chapter_slug, next_chapter_slug: result.data.next_chapter_slug };
  return <><MaidComicNav /><ComicReader chapter={chapter} seriesSlug={series} chapterBase="/maid/chapter" /></>;
}

export default function MaidChapterPage() {
  return <Suspense fallback={null}><ChapterContent /></Suspense>;
}
