'use client';
// src/components/MediaCard.tsx

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, Play, X } from 'lucide-react';
import { clsx } from 'clsx';
import { getPoster } from '@/lib/api';
import { useBookmarkToggle } from '@/context/BookmarkContext';
import type { BookmarkEntry, ContentType } from '@/types/media';

// ── Badge ──────────────────────────────────────────────────────
type BadgeVariant = 'ongoing' | 'completed' | 'movie' | 'hentai' | 'comic' | 'default';

const BADGE_CLASS: Record<BadgeVariant, string> = {
  ongoing:   'badge badge-ongoing',
  completed: 'badge badge-completed',
  movie:     'badge badge-movie',
  hentai:    'badge badge-hentai',
  comic:     'badge badge-comic',
  default:   'badge bg-white/10 text-secondary border-white/10',
};

function resolveBadge(status?: string, type?: string): BadgeVariant {
  const s = (status ?? type ?? '').toLowerCase();
  if (s.includes('ongoing') || s.includes('airing') || s.includes('tayang') || s.includes('berlangsung')) return 'ongoing';
  if (s.includes('completed') || s.includes('finished') || s.includes('selesai') || s.includes('tamat')) return 'completed';
  if (s.includes('movie') || s.includes('film'))       return 'movie';
  if (s.includes('hentai'))                            return 'hentai';
  if (s.includes('comic') || s.includes('manga') || s.includes('manhua') || s.includes('manhwa')) return 'comic';
  return 'default';
}

// ── Badge label ────────────────────────────────────────────────
function badgeLabel(status?: string, type?: string): string {
  const s = (status ?? '').trim();
  if (s) return s;
  const t = (type ?? '').trim();
  if (t) return t;
  return '';
}

// ── MediaCard ──────────────────────────────────────────────────
export interface MediaCardItem {
  slug:     string;
  id?:      string;
  title:    string;
  poster?:  string;
  image?:   string;
  cover?:   string;
  status?:  string;
  type?:    string;
  score?:   string | number;
  meta?:    string;
  progress?: number; // 0–100
}

interface MediaCardProps {
  item?:        MediaCardItem;  // optional when using direct props
  slug?:        string;
  title?:       string;
  poster?:      string;
  status?:      string;
  type?:        string;
  contentType:  ContentType;
  href:         string;
  badge?:       string;
  className?:   string;
  onRemove?:    () => void;  // for favorites page remove button
}

export default function MediaCard({
  item,
  slug: _slug,
  title: _title,
  poster: _poster,
  status: _status,
  type: _type,
  contentType,
  href,
  badge,
  className,
  onRemove,
}: MediaCardProps) {
  // Support both item prop (legacy) and direct props (new)
  const slug   = _slug   ?? item?.slug   ?? '';
  const title  = _title  ?? item?.title  ?? '';
  const status = _status ?? item?.status ?? '';
  const type   = _type   ?? item?.type   ?? '';
  const rawPoster = _poster ?? getPoster((item as Record<string, unknown>) ?? {});
  
  const [imgErr, setImgErr] = useState(false);

  const bmItem: Omit<BookmarkEntry, 'savedAt'> = {
    slug,
    id:     item?.id ?? slug,
    title,
    poster: rawPoster,
    type:   contentType,
  };
  const { bookmarked, toggle: toggleBookmark } = useBookmarkToggle(bmItem);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.();
  };

  const badgeText    = badge ?? badgeLabel(status, type);
  const badgeVariant = resolveBadge(status, type);

  return (
    <Link
      href={href}
      className={clsx(
        'group relative flex flex-col rounded-card overflow-hidden bg-surface',
        'border border-transparent will-transform',
        'transition-all duration-200',
        'hover:-translate-y-1 hover:scale-[1.025] hover:border-cyan/30 hover:shadow-card',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan',
        className
      )}
    >
      {/* ── Poster ── */}
      <div className="relative aspect-[2/3] min-h-[200px] overflow-hidden bg-surface-2 flex-shrink-0">
        {!imgErr && rawPoster ? (
          <Image
            src={rawPoster}
            alt={title}
            fill
            sizes="(max-width: 480px) 140px, (max-width: 768px) 160px, 175px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-3xl select-none">
            🎬
          </div>
        )}

        {/* Badge */}
        {badgeText && (
          <span className={clsx('absolute top-2 left-2 z-10', BADGE_CLASS[badgeVariant])}>
            {badgeText}
          </span>
        )}

        {/* Score */}
        {item?.score != null && (
          <span className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/65 backdrop-blur-sm rounded px-1.5 py-0.5 text-[0.68rem] font-bold text-yellow-400">
            ★ {item.score}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-card-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-end p-3">
          <div className="w-9 h-9 rounded-full bg-cyan flex items-center justify-center shadow-glow-c">
            <Play className="w-4 h-4 text-bg fill-current" aria-hidden />
          </div>
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          aria-label={bookmarked ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
          aria-pressed={bookmarked}
          className={clsx(
            'absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center',
            'bg-black/55 backdrop-blur-sm border transition-all duration-150',
            'opacity-0 group-hover:opacity-100 hover:scale-110',
            bookmarked
              ? 'border-pink text-pink !opacity-100'
              : 'border-white/20 text-white/70 hover:text-pink hover:border-pink'
          )}
        >
          <Heart
            className="w-3.5 h-3.5"
            fill={bookmarked ? 'currentColor' : 'none'}
            aria-hidden
          />
        </button>

        {/* Remove button (favorites page only) */}
        {onRemove && (
          <button
            onClick={handleRemove}
            aria-label="Hapus"
            className="absolute top-2 left-2 z-20 w-7 h-7 rounded-full flex items-center justify-center bg-red-500/90 backdrop-blur-sm text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        )}

        {/* Progress bar */}
        {typeof item?.progress === 'number' && item.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-20">
            <div
              className="h-full bg-cyan transition-[width] duration-300"
              style={{ width: `${Math.min(100, item.progress)}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="px-2.5 py-2.5 flex-1">
        <p
          title={title}
          className="text-[0.82rem] font-semibold text-primary truncate leading-snug"
        >
          {title}
        </p>
        {item?.meta && (
          <p className="mt-0.5 text-[0.72rem] text-muted truncate">{item.meta}</p>
        )}
      </div>
    </Link>
  );
}
