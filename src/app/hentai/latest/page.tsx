'use client';
import { useCallback } from 'react';
import { HentaiAPI } from '@/lib/api';
import BrowsePage from '@/components/BrowsePage';

export default function HentaiLatestPage() {
  const fetcher = useCallback((page: number) => HentaiAPI.getLatestHentai(page), []);
  return (
    <BrowsePage title="Hentai Terbaru" contentType="hentai" fetcher={fetcher} accent="pink" />
  );
}
