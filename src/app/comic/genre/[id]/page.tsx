'use client';
import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ComicAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function ComicGenrePage() {
  const { id } = useParams<{ id: string }>();
  const fetcher = useCallback(() => ComicAPI.getByGenre(id ?? ''), [id]);
  const label = (id ?? '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return (
    <BrowsePage title={`Genre: ${label}`} contentType="comic" fetcher={fetcher} accent="violet" />
  );
}
