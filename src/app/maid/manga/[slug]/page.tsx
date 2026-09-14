'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import MaidComicNav from '@/components/MaidComicNav';
import { MaidComicAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import { SkeletonDetail } from '@/components/SkeletonLoader';

export default function MaidMangaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const result = useApi(useCallback(() => MaidComicAPI.getDetail(slug ?? ''), [slug]), [slug], null);
  const data = result.data;
  if (result.loading) return <div className="mx-auto max-w-screen-xl px-4"><SkeletonDetail /></div>;
  return <div className="mx-auto max-w-screen-xl pb-10"><MaidComicNav /><main className="flex gap-5 px-4">{result.error || !data ? <div className="w-full rounded-card border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-200">Manga tidak ditemukan atau API tidak dapat diakses: {result.error ?? 'Data kosong.'}</div> : <><div className="relative h-64 w-44 shrink-0 overflow-hidden rounded-card bg-surface">{data.cover && <Image src={data.cover} alt={data.title} fill className="object-cover" />}</div><div className="min-w-0 flex-1"><h1 className="text-xl font-bold text-primary">{data.title}</h1><p className="mt-3 text-sm leading-6 text-secondary">{data.synopsis || 'Sinopsis tidak tersedia.'}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-secondary">{[data.status, data.author && `Author: ${data.author}`, data.artist && `Artist: ${data.artist}`, ...data.genres].filter(Boolean).map((item) => <span key={item} className="rounded-full border border-border px-2.5 py-1">{item}</span>)}</div><h2 className="mt-6 mb-2 font-semibold text-primary">Daftar Chapter</h2><div className="flex flex-wrap gap-2">{data.chapters.map((chapter) => <Link key={chapter.slug} href={`/maid/chapter/${encodeURIComponent(chapter.slug)}?series=${encodeURIComponent(data.slug || slug || '')}`} className="rounded-full bg-violet px-3 py-1.5 text-xs font-semibold text-white">{chapter.title}</Link>)}</div></div></>}</main></div>;
}
