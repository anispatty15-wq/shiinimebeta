'use client';
// src/app/bookmarks/page.tsx — Favourites

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useBookmarks } from '@/context/BookmarkContext';
import MediaCard from '@/components/MediaCard';
import type { ContentType } from '@/types/media';

type Tab = ContentType | 'all';
const TABS: { label: string; value: Tab }[] = [
  { label: 'Semua',  value: 'all'    },
  { label: 'Anime',  value: 'anime'  },
  { label: 'Hentai', value: 'hentai' },
  { label: 'Komik',  value: 'comic'  },
];

function hrefFor(type: ContentType, slug: string) {
  return `/${type}/${slug}`;
}

export default function BookmarksPage() {
  const { allBookmarks, getBookmarks, clear, hydrated } = useBookmarks();
  const [tab, setTab] = useState<Tab>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const items =
    tab === 'all'
      ? allBookmarks
      : getBookmarks(tab as ContentType);

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    clear(tab === 'all' ? undefined : (tab as ContentType));
    setConfirmClear(false);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-primary">Favorit Saya</h1>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            onBlur={() => setConfirmClear(false)}
            className={clsx(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-app border transition-all',
              confirmClear
                ? 'bg-red-500/15 border-red-500/50 text-red-400'
                : 'bg-surface border-border text-muted hover:text-primary hover:border-white/20'
            )}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
            {confirmClear ? 'Konfirmasi Hapus' : 'Hapus Semua'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setTab(value); setConfirmClear(false); }}
            className={clsx(
              'px-4 py-2 text-sm font-semibold border-b-2 transition-all duration-150 -mb-px',
              tab === value
                ? 'border-cyan text-cyan'
                : 'border-transparent text-muted hover:text-secondary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!hydrated ? (
        // Show empty state while hydrating to prevent mismatch
        <div className="text-center py-20 text-muted">
          <span className="text-4xl block mb-3" aria-hidden>♥</span>
          <p className="text-sm">Memuat…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted space-y-2">
          <span className="text-5xl block opacity-40" aria-hidden>♡</span>
          <p className="text-sm font-semibold text-secondary">Belum ada favorit</p>
          <p className="text-xs max-w-xs mx-auto leading-relaxed">
            Tekan ikon hati pada kartu anime, hentai, atau komik untuk menyimpannya di sini.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted mb-3">{items.length} item tersimpan</p>
          <div className="card-grid">
            {items.map((bm) => (
              <MediaCard
                key={`${bm.type}-${bm.slug}`}
                item={{
                  slug:   bm.slug,
                  id:     bm.id,
                  title:  bm.title,
                  poster: bm.poster,
                }}
                contentType={bm.type}
                href={hrefFor(bm.type, bm.slug)}
                badge={bm.type}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
