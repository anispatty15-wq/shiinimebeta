'use client';
import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { HentaiAPI } from '@/lib/api';
import NekopoiListPage from '@/components/NekopoiListPage';
export default function Page() { const { slug } = useParams<{ slug: string }>(); return <NekopoiListPage title={`Genre: ${slug ?? ''}`} fetcher={useCallback((page: number) => HentaiAPI.getByGenre(slug ?? '', page), [slug])} />; }
