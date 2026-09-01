'use client';
import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AnimeAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function AnimeSeasonPage() {
  const { slug } = useParams<{ slug: string }>();
  const fetcher = useCallback((page: number) => AnimeAPI.getBySeason(slug ?? '', page), [slug]);
  const label = (slug ?? '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return <BrowsePage title={`Season: ${label}`} contentType="anime" fetcher={fetcher} accent="violet" />;
}
