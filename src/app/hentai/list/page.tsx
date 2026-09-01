'use client';
import { useCallback } from 'react';
import { HentaiAPI } from '@/lib/apiClient';
import BrowsePage from '@/components/BrowsePage';

export default function HentaiListPage() {
  const fetcher = useCallback((page: number) => HentaiAPI.getHentaiList(page), []);
  return (
    <BrowsePage title="Daftar Hentai" contentType="hentai" fetcher={fetcher} accent="pink" />
  );
}
