'use client';
import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { HentaiAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import NekopoiGuard from '@/components/NekopoiGuard';
import NekopoiNav from '@/components/NekopoiNav';
export default function Page() {
  return <NekopoiGuard><DetailContent /></NekopoiGuard>;
}
function DetailContent() {
  const { slug } = useParams<{ slug: string }>(); const result = useApi(useCallback(() => HentaiAPI.getDetail(slug ?? ''), [slug]), [slug], null); const data = result.data;
  if (result.loading) return <div className="p-12 text-center text-secondary">Memuat detail...</div>;
  if (result.error || !data) return <div className="p-12 text-center text-secondary">{result.error ?? 'Konten tidak ditemukan.'}</div>;
  return <div className="mx-auto max-w-screen-xl pb-10"><NekopoiNav /><main className="flex gap-5 px-4"><div className="relative h-64 w-44 shrink-0 overflow-hidden rounded-card bg-surface">{data.poster && <Image src={data.poster} alt={data.title} fill className="object-cover" />}</div><div><h1 className="text-xl font-bold text-primary">{data.title}</h1><p className="mt-3 text-sm leading-6 text-secondary">{data.synopsis}</p><div className="mt-5 flex flex-wrap gap-2">{data.episode_list.map((ep) => <Link key={ep.slug} href={`/nekopoi/episode/${ep.slug}`} className="rounded-full bg-pink px-3 py-1.5 text-xs font-semibold text-white">{ep.title}</Link>)}</div></div></main></div>;
}
