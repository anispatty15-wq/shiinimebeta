'use client';
// src/app/history/page.tsx
// ─────────────────────────────────────────────────────────────
// History page — shows watch history (video) and read history (comic)
// Grouped by contentType with ability to clear/remove items
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { History, Trash2, Clock, Play, Book, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useHistory } from '@/context/HistoryContext';
import { formatTime } from '@/utils/storage';

type Tab = 'watch' | 'read';

export default function HistoryPage() {
  const router  = useRouter();
  const {
    watchHistory,
    readHistory,
    removeWatch,
    removeRead,
    clearWatch,
    clearRead,
    hydrated,
  } = useHistory();

  const [activeTab, setActiveTab] = useState<Tab>('watch');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentList = activeTab === 'watch' ? watchHistory : readHistory;
  const isEmpty = currentList.length === 0;

  const handleClear = () => {
    if (activeTab === 'watch') clearWatch();
    else clearRead();
    setShowClearConfirm(false);
  };

  if (!hydrated) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 pt-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-app bg-surface animate-pulse" />
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
            <History className="w-5 h-5 text-cyan" aria-hidden />
            <h1 className="text-[0.95rem] font-bold text-primary">Riwayat</h1>
          </div>
          {!isEmpty && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-muted hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden />
              Hapus Semua
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('watch')}
            className={clsx(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === 'watch'
                ? 'bg-cyan text-bg'
                : 'bg-surface text-secondary hover:text-primary'
            )}
          >
            <Play className="w-4 h-4 inline mr-1.5 -mt-0.5" aria-hidden />
            Ditonton ({watchHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={clsx(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === 'read'
                ? 'bg-violet text-bg'
                : 'bg-surface text-secondary hover:text-primary'
            )}
          >
            <Book className="w-4 h-4 inline mr-1.5 -mt-0.5" aria-hidden />
            Dibaca ({readHistory.length})
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        {isEmpty ? (
          <div className="text-center py-20 text-muted space-y-2">
            <span className="text-4xl block" aria-hidden>
              {activeTab === 'watch' ? '📺' : '📖'}
            </span>
            <p className="text-sm font-medium">Belum ada riwayat.</p>
            <p className="text-xs max-w-xs mx-auto">
              {activeTab === 'watch'
                ? 'Video yang kamu tonton akan muncul di sini.'
                : 'Komik yang kamu baca akan muncul di sini.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTab === 'watch'
              ? watchHistory.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/stream/${entry.type}/${entry.slug}`}
                    className="flex items-center gap-3 px-3 py-3 rounded-app bg-surface hover:bg-surface-2 border border-border hover:border-cyan/40 transition-all relative group"
                  >
                    {/* Poster */}
                    <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-surface-2 relative">
                      {entry.poster ? (
                        <Image
                          src={entry.poster}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl text-muted">
                          🎬
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-primary line-clamp-1 mb-0.5">
                        {entry.episodeTitle || entry.title}
                      </h3>
                      {entry.episodeTitle && entry.title && (
                        <p className="text-xs text-muted truncate mb-1">{entry.title}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden />
                          {formatTime(entry.positionSeconds)} / {formatTime(entry.durationSeconds)}
                        </span>
                        {entry.completed && (
                          <span className="text-cyan text-[0.65rem] font-semibold">✓ Selesai</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full transition-all',
                            entry.type === 'hentai' ? 'bg-pink' : 'bg-cyan'
                          )}
                          style={{
                            width: entry.durationSeconds > 0
                              ? `${Math.min(100, (entry.positionSeconds / entry.durationSeconds) * 100)}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeWatch(entry.slug);
                      }}
                      aria-label="Hapus dari riwayat"
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-2/90 text-muted hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </Link>
                ))
              : readHistory.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/read/${entry.slug}?series=${entry.seriesSlug}`}
                    className="flex items-center gap-3 px-3 py-3 rounded-app bg-surface hover:bg-surface-2 border border-border hover:border-violet/40 transition-all relative group"
                  >
                    {/* Poster */}
                    <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-surface-2 relative">
                      {entry.poster ? (
                        <Image
                          src={entry.poster}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl text-muted">
                          📚
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-primary line-clamp-1 mb-0.5">
                        {entry.chapterTitle || entry.title}
                      </h3>
                      {entry.chapterTitle && entry.title && (
                        <p className="text-xs text-muted truncate mb-1">{entry.title}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-secondary">
                        <span>
                          Halaman {entry.lastPage} / {entry.totalPages}
                        </span>
                        {entry.completed && (
                          <span className="text-violet text-[0.65rem] font-semibold">✓ Selesai</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet transition-all"
                          style={{
                            width: entry.totalPages > 0
                              ? `${Math.min(100, (entry.lastPage / entry.totalPages) * 100)}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeRead(entry.slug);
                      }}
                      aria-label="Hapus dari riwayat"
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-surface-2/90 text-muted hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </Link>
                ))}
          </div>
        )}
      </div>

      {/* Clear confirmation modal */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="w-full max-w-xs bg-surface border border-border rounded-app p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden />
              <div>
                <h3 className="text-sm font-bold text-primary mb-1">Hapus Semua Riwayat?</h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Tindakan ini tidak bisa dibatalkan. Semua riwayat{' '}
                  {activeTab === 'watch' ? 'tontonan' : 'bacaan'} akan dihapus permanen.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 btn-ghost text-sm py-2"
              >
                Batal
              </button>
              <button
                onClick={handleClear}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-app text-sm py-2 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
