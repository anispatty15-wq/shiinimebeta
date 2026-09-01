'use client';
import { useCallback } from 'react';
import { HentaiAPI } from '@/lib/api';
import BrowsePage from '@/components/BrowsePage';

export default function JAVLatestPage() {
  const fetcher = useCallback((page: number) => HentaiAPI.getLatestJAV(page), []);
  return (
    <BrowsePage title="JAV Terbaru" contentType="hentai" fetcher={fetcher} accent="violet" />
  );
}
