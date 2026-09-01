'use client';
import { useCallback } from 'react';
import { ComicAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function ComicPopularPage() {
  const fetcher = useCallback(() => ComicAPI.getPopular(), []);
  return (
    <BrowsePage title="Komik Populer" contentType="comic" fetcher={fetcher} accent="cyan" />
  );
}
