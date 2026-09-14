'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { FgoAPI, type FgoEntity, type FgoRegion, fgoImage } from '@/lib/fgoApi';

interface Props { section: string; id: string; region: FgoRegion; }

function Field({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
  return <div className="rounded-app border border-border bg-surface-2 p-3"><p className="text-[0.65rem] uppercase tracking-wider text-muted">{label}</p><p className="mt-1 break-words text-sm text-primary">{Array.isArray(value) ? value.map(String).join(', ') : String(value)}</p></div>;
}

export default function FgoDetailPage({ section, id, region }: Props) {
  const [item, setItem] = useState<FgoEntity | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); FgoAPI.getDetail(region, section, id).then(setItem).catch(() => setError('Failed to load FGO data.')).finally(() => setLoading(false)); }, [region, section, id]);
  if (loading) return <main className="min-h-screen px-4 py-20 text-center text-sm text-muted">Loading FGO data...</main>;
  if (error || !item) return <main className="min-h-screen px-4 py-20 text-center"><p className="text-sm text-red-400">{error || 'Data is not available for this region.'}</p><button type="button" onClick={() => window.location.reload()} className="btn-ghost mt-4 inline-flex gap-2 text-sm"><RefreshCw className="h-4 w-4" /> Retry</button></main>;
  return <main className="min-h-screen pb-24"><div className="mx-auto max-w-5xl px-4 py-7"><Link href={`/fgo/${section === 'servant' ? 'servants' : section}`} className="inline-flex items-center gap-2 text-sm text-secondary hover:text-cyan"><ArrowLeft className="h-4 w-4" /> Back to database</Link><section className="mt-6 overflow-hidden rounded-app border border-border bg-surface"><div className="grid gap-6 p-5 sm:grid-cols-[220px_1fr] sm:p-7"><div className="relative aspect-[3/4] overflow-hidden rounded-app bg-surface-2">{fgoImage(item) ? <img src={fgoImage(item)} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl text-muted">?</div>}</div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">FGO {section}</p><h1 className="mt-3 text-3xl font-black text-primary">{item.name}</h1><p className="mt-2 text-sm text-secondary">{item.originalName ?? 'Atlas Academy data'}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><Field label="Class" value={item.className} /><Field label="Rarity" value={item.rarity ? `${item.rarity} Star` : undefined} /><Field label="Type" value={item.type} /><Field label="Collection No." value={item.collectionNo} /></div></div></div>{item.description && <div className="border-t border-border p-5 sm:p-7"><h2 className="font-bold text-primary">Description</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-secondary">{item.description}</p></div>}</section></div></main>;
}