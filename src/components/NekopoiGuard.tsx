'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

const KEY = 'shiinime-nekopoi-age-gate';

export default function NekopoiGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => setAllowed(window.localStorage.getItem(KEY) === 'confirmed'), []);

  if (allowed === null) return <div className="min-h-[50vh] animate-pulse bg-surface/20" />;
  if (!allowed) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-md items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-pink/25 bg-surface/80 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-pink/40 bg-pink/10">
            <ShieldAlert className="h-8 w-8 text-pink" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-pink">18+ Area</p>
          <h1 className="text-xl font-bold text-primary">Konten dewasa</h1>
          <p className="mt-3 text-sm leading-6 text-secondary">Section ini hanya untuk pengguna berusia 18 tahun atau lebih.</p>
          <div className="mt-7 flex gap-3">
            <button onClick={() => { window.localStorage.setItem(KEY, 'confirmed'); setAllowed(true); }} className="flex-1 rounded-xl bg-pink px-4 py-3 text-sm font-bold text-white transition hover:brightness-110">Saya 18+</button>
            <button onClick={() => window.history.back()} className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-secondary transition hover:text-primary">Kembali</button>
          </div>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
