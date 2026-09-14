'use client';
// src/app/anime/genre/[slug]/page.tsx

import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AnimeAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function AnimeGenrePage() {
  const { slug } = useParams<{ slug: string }>();

  const fetcher = useCallback(
    (page: number) => AnimeAPI.getByGenre(slug ?? '', page),
    [slug]
  );

  // Prettify slug: "slice-of-life" → "Slice Of Life"
  const label = (slug ?? '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <BrowsePage
      title={`Genre: ${label}`}
      contentType="anime"
      fetcher={fetcher}
      accent="cyan"
    />
  );
}
