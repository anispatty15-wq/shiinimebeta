'use client';
import { useCallback } from 'react';
import { AnimeAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function DonghuaPage() {
  const fetcher = useCallback((page: number) => AnimeAPI.getDonghua(page), []);
  return (
    <BrowsePage
      title="Donghua Terbaru"
      contentType="anime"
      fetcher={fetcher}
      accent="violet"
    />
  );
}
