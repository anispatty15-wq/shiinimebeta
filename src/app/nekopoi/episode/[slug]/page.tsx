'use client';
import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { HentaiAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import NekopoiGuard from '@/components/NekopoiGuard';
import NekopoiNav from '@/components/NekopoiNav';
export default function Page() { return <NekopoiGuard><EpisodeContent /></NekopoiGuard>; }
function EpisodeContent() { const { slug } = useParams<{ slug: string }>(); const result = useApi(useCallback(() => HentaiAPI.getEpisode(slug ?? ''), [slug]), [slug], null); const data = result.data; if (result.loading) return <div className="p-12 text-center text-secondary">Memuat episode...</div>; if (result.error || !data) return <div className="p-12 text-center text-secondary">{result.error ?? 'Episode tidak ditemukan.'}</div>; return <div className="mx-auto max-w-screen-xl pb-10"><NekopoiNav /><main className="px-4"><h1 className="mb-5 text-xl font-bold text-primary">{data.title}</h1>{data.stream_url && <iframe title={data.title} src={data.stream_url} className="aspect-video w-full rounded-card bg-black" allowFullScreen />}</main></div>; }
