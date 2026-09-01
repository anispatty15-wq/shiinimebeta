'use client';
import { useCallback } from 'react';
import { ComicAPI } from '@/lib/api';
import BrowsePage from '@/components/BrowsePage';

export default function ComicCompletedPage() {
  const fetcher = useCallback(() => ComicAPI.getCompleted(), []);
  return (
    <BrowsePage title="Completed" contentType="comic" fetcher={fetcher} accent="violet" />
  );
}
