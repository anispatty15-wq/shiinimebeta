'use client';
import { useCallback } from 'react';
import { HentaiAPI } from '@/lib/api';
import NekopoiListPage from '@/components/NekopoiListPage';
export default function Page() { return <NekopoiListPage title="Semua Hentai" fetcher={useCallback((page: number) => HentaiAPI.getHentaiList(page), [])} />; }
