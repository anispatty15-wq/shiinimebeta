'use client';
import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { HentaiAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function HentaiGenrePage() {
  const { slug } = useParams<{ slug: string }>();
  const fetcher = useCallback((page: number) => HentaiAPI.getByGenre(slug ?? '', page), [slug]);
  const label = (slug ?? '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return <BrowsePage title={`Genre: ${label}`} contentType="hentai" fetcher={fetcher} accent="pink" />;
}
