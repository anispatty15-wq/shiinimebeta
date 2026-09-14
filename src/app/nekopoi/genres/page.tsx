'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HentaiAPI, toArray } from '@/lib/api';
import NekopoiGuard from '@/components/NekopoiGuard';
import NekopoiNav from '@/components/NekopoiNav';
export default function Page() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  useEffect(() => { void HentaiAPI.getGenres().then((r) => setItems(toArray(r.data).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object'))); }, []);
  return <NekopoiGuard><div className="mx-auto max-w-screen-xl pb-10"><NekopoiNav /><div className="px-4"><h1 className="mb-5 text-xl font-bold text-primary">Genres 18+</h1><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{items.map((x, i) => { const slug = String(x.slug ?? x.id ?? x.name ?? ''); return <Link key={`${slug}-${i}`} href={`/nekopoi/genre/${encodeURIComponent(slug)}`} className="rounded-app border border-border bg-surface px-4 py-3 text-sm text-primary hover:border-pink/50">{String(x.name ?? x.title ?? slug)}</Link>; })}</div></div></div></NekopoiGuard>;
}
