'use client';
import { useCallback } from 'react';
import { ComicAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function ManhwaPage() {
  const fetcher = useCallback(() => ComicAPI.getManhwa(), []);
  return (
    <BrowsePage title="Manhwa (Korea)" contentType="comic" fetcher={fetcher} accent="cyan" />
  );
}
