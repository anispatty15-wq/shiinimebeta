'use client';
import { useCallback } from 'react';
import { HentaiAPI } from '@/lib/api';
import NekopoiListPage from '@/components/NekopoiListPage';
export default function Page() { return <NekopoiListPage title="JAV Terbaru" fetcher={useCallback((page: number) => HentaiAPI.getLatestJAV(page), [])} />; }
