'use client';
import { useCallback } from 'react';
import { ComicAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function MangaPage() {
  const fetcher = useCallback(() => ComicAPI.getManga(), []);
  return (
    <BrowsePage title="Manga (Jepang)" contentType="comic" fetcher={fetcher} accent="pink" />
  );
}
