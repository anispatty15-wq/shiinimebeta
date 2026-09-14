'use client';
import { useCallback } from 'react';
import { ComicAPI } from '@/lib/api';
import BrowsePage from '@/components/BrowsePage';

export default function ManhuaPage() {
  const fetcher = useCallback(() => ComicAPI.getManhua(), []);
  return (
    <BrowsePage title="Manhua (China)" contentType="comic" fetcher={fetcher} accent="violet" />
  );
}
