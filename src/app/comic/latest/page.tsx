'use client';
import { useCallback } from 'react';
import { ComicAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function ComicLatestPage() {
  const fetcher = useCallback(() => ComicAPI.getLatest(), []);
  return (
    <BrowsePage title="Update Terbaru" contentType="comic" fetcher={fetcher} accent="violet" />
  );
}
