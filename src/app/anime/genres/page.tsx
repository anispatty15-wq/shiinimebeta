'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnimeNav from '@/components/AnimeNav';
import { AnimeAPI } from '@/lib/apiClient';
import { toArray } from '@/lib/api';

export default function AnimeGenresPage() {
  const [genres, setGenres] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void AnimeAPI.getCatalogGenres().then((result) => {
      setGenres(toArray(result.data).filter((item): item is Record<string, unknown> => !!item && typeof item === 'object'));
      setLoading(false);
    });
  }, []);
  return <div className="max-w-screen-xl mx-auto pb-10"><AnimeNav /><div className="px-4"><h1 className="mb-5 text-xl font-bold text-primary">Genre Anime</h1>{loading ? <div className="animate-pulse rounded-app bg-surface h-24" /> : genres.length === 0 ? <p className="text-sm text-secondary">Genre tidak tersedia.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{genres.map((genre, index) => { const slug = String(genre.slug ?? genre.id ?? genre.name ?? ''); const name = String(genre.name ?? genre.title ?? slug); return <Link key={`${slug}-${index}`} href={`/anime/genre/${encodeURIComponent(slug)}`} className="rounded-app border border-border bg-surface px-4 py-3 text-sm text-primary hover:border-cyan/60 hover:text-cyan">{name}</Link>; })}</div>}</div></div>;
}
