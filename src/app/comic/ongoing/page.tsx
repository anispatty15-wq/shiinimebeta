'use client';
import { useCallback } from 'react';
import { ComicAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function ComicOngoingPage() {
  const fetcher = useCallback(() => ComicAPI.getOngoing(), []);
  return (
    <BrowsePage title="Ongoing" contentType="comic" fetcher={fetcher} accent="cyan" />
  );
}
