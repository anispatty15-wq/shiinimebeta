'use client';
// src/app/favorites/page.tsx
// ─────────────────────────────────────────────────────────────
// Favorites page — shows bookmarked anime, hentai, and comics
// Grouped by type with filter tabs
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useBookmarks } from '@/context/BookmarkContext';
import MediaCard from '@/components/MediaCard';
import type { ContentType } from '@/types/media';

type TabFilter = 'all' | ContentType;

export default function FavoritesPage() {
  const router = useRouter();
  const { allBookmarks, remove, clear, hydrated } = useBookmarks();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const filtered =
    activeTab === 'all'
      ? allBookmarks
      : allBookmarks.filter((b) => b.type === activeTab);

  const counts = {
    all:    allBookmarks.length,
    anime:  allBookmarks.filter((b) => b.type === 'anime').length,
    hentai: allBookmarks.filter((b) => b.type === 'hentai').length,
    comic:  allBookmarks.filter((b) => b.type === 'comic').length,
  };

  const isEmpty = filtered.length === 0;

  if (!hydrated) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-card bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-bg/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink fill-pink" aria-hidden />
            <h1 className="text-[0.95rem] font-bold text-primary">Favorit</h1>
          </div>
          {!isEmpty && (
            <button
              onClick={() => {
                if (confirm(`Hapus semua favorit${activeTab !== 'all' ? ` ${activeTab}` : ''}?`)) {
                  clear(activeTab === 'all' ? undefined : activeTab as ContentType);
                }
              }}
              className="text-xs text-muted hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden />
              Hapus Semua
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
              activeTab === 'all'
                ? 'bg-pink text-white'
                : 'bg-surface text-secondary hover:text-primary'
            )}
          >
            Semua ({counts.all})
          </button>
          <button
            onClick={() => setActiveTab('anime')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
              activeTab === 'anime'
                ? 'bg-cyan text-bg'
                : 'bg-surface text-secondary hover:text-primary'
            )}
          >
            Anime ({counts.anime})
          </button>
          <button
            onClick={() => setActiveTab('hentai')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
              activeTab === 'hentai'
                ? 'bg-pink text-white'
                : 'bg-surface text-secondary hover:text-primary'
            )}
          >
            Hentai ({counts.hentai})
          </button>
          <button
            onClick={() => setActiveTab('comic')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
              activeTab === 'comic'
                ? 'bg-violet text-bg'
                : 'bg-surface text-secondary hover:text-primary'
            )}
          >
            Komik ({counts.comic})
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        {isEmpty ? (
          <div className="text-center py-20 text-muted space-y-2">
            <span className="text-4xl block" aria-hidden>💔</span>
            <p className="text-sm font-medium">Belum ada favorit.</p>
            <p className="text-xs max-w-xs mx-auto">
              Klik ikon ❤️ di halaman detail untuk menambahkan anime, hentai, atau komik ke daftar favorit.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((item) => (
              <MediaCard
                key={item.slug}
                slug={item.slug}
                title={item.title}
                poster={item.poster}
                status=""
                type=""
                contentType={item.type}
                href={`/detail/${item.type}/${item.slug}`}
                onRemove={() => remove(item.slug, item.type)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
