'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchSuggest } from '@/hooks/useSearchSuggest';
import type { ContentType } from '@/types/media';

interface ContentSearchProps {
  type: ContentType;
  placeholder: string;
  submitPath?: string;
}

export default function ContentSearch({ type, placeholder, submitPath }: ContentSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { suggestions, loading } = useSearchSuggest(query, type);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    const target = submitPath
      ? `${submitPath}?q=${encodeURIComponent(query.trim())}&page=1`
      : type === 'donghua'
      ? `/donghua/search?q=${encodeURIComponent(query.trim())}&page=1`
      : type === 'anime'
        ? `/anime/search?q=${encodeURIComponent(query.trim())}`
      : `/search?q=${encodeURIComponent(query.trim())}&type=${type}`;
    router.push(target);
  };

  return (
    <div ref={wrapRef} className="relative z-20 mx-4 mb-6">
      <form onSubmit={submit} className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-surface/75 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-300 hover:border-cyan/30 hover:shadow-[0_14px_45px_rgba(0,229,255,0.08)] focus-within:border-cyan/60 focus-within:ring-2 focus-within:ring-cyan/10">
        <Search className="ml-2 shrink-0 text-cyan transition-transform duration-300 group-focus-within:scale-110" size={20} />
        <input
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-primary outline-none placeholder:text-secondary"
          aria-label={placeholder}
        />
        <button type="submit" className="rounded-xl bg-cyan px-4 py-2 text-sm font-bold text-bg shadow-[0_0_18px_rgba(0,229,255,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0">
          Cari
        </button>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute inset-x-0 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-surface/95 shadow-2xl backdrop-blur-xl">
          {loading && <div className="px-4 py-3 text-sm text-secondary">Mencari...</div>}
          {!loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-secondary">Tidak ada judul ditemukan.</div>
          )}
          {!loading && suggestions.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => router.push(type === 'donghua' ? `/detail/donghua/${item.slug}` : `/${type}/${item.slug}`)}
              className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition last:border-0 hover:bg-white/10"
            >
              {item.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.poster} alt="" className="h-10 w-8 rounded object-cover" />
              ) : <div className="h-10 w-8 rounded bg-white/10" />}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{item.title}</span>
              <ArrowRight size={15} className="shrink-0 text-secondary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
