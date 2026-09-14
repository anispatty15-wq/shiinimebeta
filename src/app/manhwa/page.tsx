'use client';

import { useCallback } from 'react';
import BrowsePage from '@/components/BrowsePage';
import { ComicAPI } from '@/lib/api';

export default function ManhwaPage() {
  const fetcher = useCallback(() => ComicAPI.getManhwa(), []);
  return (
    <BrowsePage
      title="Manhwa"
      contentType="comic"
      fetcher={fetcher}
      accent="cyan"
    />
  );
}