'use client';
// src/components/SectionRow.tsx

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
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
  accent?:      'cyan' | 'violet' | 'pink';
  className?:   string;
}

const ACCENT_BAR: Record<string, string> = {
  cyan:   'bg-cyan',
  violet: 'bg-violet',
  pink:   'bg-pink',
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
        <div
          className="flex gap-3 overflow-x-auto pb-3 px-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {items.map((item) => {
            // Use pre-resolved href if available, else build from basePath
            const cardHref = item.href ?? `${basePath}/${item.slug}`;
            return (
              <div key={`${item.slug}-${cardHref}`} className="snap-start flex-shrink-0 w-36 sm:w-40">
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
      )}
    </section>
  );
}
