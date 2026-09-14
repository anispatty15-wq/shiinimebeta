'use client';
import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { DonghuaAPI } from '@/lib/api';
import DonghuaListPage from '@/components/DonghuaListPage';
import Link from 'next/link';
import { Suspense } from 'react';
function AzContent() {
  const params = useSearchParams();
  const letter = params.get('letter') || 'A';
  const letters = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  const fetcher = useCallback((page: number) => letter === 'ALL' ? DonghuaAPI.getHome(page) : DonghuaAPI.getByLetter(letter.toLowerCase(), page), [letter]);
  return <><div className="mx-4 mb-5 flex flex-wrap gap-1">{letters.map((item) => <Link key={item} href={`/donghua/az?letter=${item}&page=1`} className={`rounded px-3 py-1.5 text-xs ${item === letter ? 'bg-yellow-400 text-black' : 'bg-surface text-secondary'}`}>{item}</Link>)}</div><DonghuaListPage title={`Donghua A-Z ${letter}`} fetcher={fetcher} /></>;
}
export default function Page() {
  return <Suspense fallback={<div className="p-8 text-center text-secondary">Memuat A-Z...</div>}><AzContent /></Suspense>;
}
