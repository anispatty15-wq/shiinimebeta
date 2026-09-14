'use client';
import { useCallback } from 'react';
import { HentaiAPI } from '@/lib/api';
import NekopoiListPage from '@/components/NekopoiListPage';
export default function Page() { return <NekopoiListPage title="Rilis Terbaru" fetcher={useCallback((page: number) => HentaiAPI.getHome(page), [])} />; }
