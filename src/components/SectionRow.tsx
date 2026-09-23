'use client';
// src/components/SectionRow.tsx

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useRef } from 'react';
import MediaCard, { type MediaCardItem } from './MediaCard';
import { SkeletonRow } from './SkeletonLoader';
import type { ContentType } from '@/types/media';

export interface SectionRowItem extends MediaCardItem {
  /** Pre-resolved href — if provided, overrides basePath + slug */
  href?: string;
}

interface SectionRowProps {
  title:        string;
  items:        SectionRowItem[];
  loading?:     boolean;
  error?:       string | null;
  contentType:  ContentType;
  /** Fallback base path if item.href is not set, e.g. "/anime" */
  basePath:     string;
  moreHref?:    string;
  accent?:      'cyan' | 'violet' | 'pink' | 'yellow';
  className?:   string;
}

const ACCENT_BAR: Record<string, string> = {
  cyan:   'bg-cyan',
  violet: 'bg-violet',
  pink:   'bg-pink',
  yellow: 'bg-yellow-400',
};

export default function SectionRow({
  title,
  items,
  loading = false,
  error = null,
  contentType,
  basePath,
  moreHref,
  accent = 'cyan',
  className,
}: SectionRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, moved: false, pointerType: '', startX: 0, startScrollLeft: 0 });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Mouse users should click cards normally; drag scrolling is for touch/pen.
    if (event.pointerType === 'mouse') return;
    const row = rowRef.current;
    if (!row) return;
    dragState.current = {
      active: true,
      moved: false,
      pointerType: event.pointerType,
      startX: event.clientX,
      startScrollLeft: row.scrollLeft,
    };
    row.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const row = rowRef.current;
    if (!row || !dragState.current.active) return;
    const distance = event.clientX - dragState.current.startX;
    if (Math.abs(distance) > 4) dragState.current.moved = true;
    row.scrollLeft = dragState.current.startScrollLeft - distance;
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    const row = rowRef.current;
    if (row?.hasPointerCapture(event.pointerId)) row.releasePointerCapture(event.pointerId);
    dragState.current.active = false;
  };

  const preventClickAfterDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.pointerType !== 'mouse' && dragState.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragState.current.moved = false;
    }
  };

  const scrollRow = (direction: -1 | 1) => {
    rowRef.current?.scrollBy({
      left: direction * 320,
      behavior: 'smooth',
    });
  };

  return (
    <section className={clsx('mb-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="flex items-center gap-2.5 text-[0.95rem] font-semibold text-primary">
          <span
            className={clsx('block w-1 h-[1.1em] rounded-full flex-shrink-0', ACCENT_BAR[accent])}
            aria-hidden
          />
          {title}
        </h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="flex items-center gap-1 text-xs font-medium text-cyan hover:brightness-90 transition-colors"
          >
            Semua <ChevronRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-4">
          <SkeletonRow count={6} />
        </div>
      ) : error ? (
        <p className="px-4 text-sm text-muted py-4">{error}</p>
      ) : items.length === 0 ? (
        <p className="px-4 text-sm text-muted py-4">Tidak ada konten.</p>
      ) : (
        <div className="relative group/scroll">
          <div
            ref={rowRef}
            className="scroll-row flex gap-3 overflow-x-auto pb-3 px-4 snap-x snap-mandatory"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onClickCapture={preventClickAfterDrag}
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' } as React.CSSProperties}
          >
            {items.map((item) => {
              // Use pre-resolved href if available, else build from basePath
              const cardHref = item.href ?? `${basePath}/${item.slug}`;
              return (
                <div key={`${item.slug}-${cardHref}`} className="scroll-item snap-start flex-shrink-0 w-36 sm:w-40">
                  <MediaCard
                    item={item}
                    contentType={contentType}
                    href={cardHref}
                  />
                </div>
              );
            })}
            <div className="flex-shrink-0 w-1" aria-hidden />
          </div>
          <button
            type="button"
            onClick={() => scrollRow(-1)}
            className="scroll-arrow left-1"
            aria-label={`Geser ${title} ke kiri`}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollRow(1)}
            className="scroll-arrow right-1"
            aria-label={`Geser ${title} ke kanan`}
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
