'use client';
// src/components/SectionRow.tsx

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import MediaCard, { type MediaCardItem } from './MediaCard';
import { SkeletonRow } from './SkeletonLoader';
import type { ContentType } from '@/types/media';

interface SectionRowProps {
  title:       string;
  items:       MediaCardItem[];
  loading?:    boolean;
  error?:      string | null;
  contentType: ContentType;
  basePath:    string;
  moreHref?:   string;
  accent?:     'cyan' | 'violet' | 'pink';
  className?:  string;
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
      {/* Header — has horizontal padding */}
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

      {/* Scroll area — full bleed with padding inside */}
      {loading ? (
        <div className="px-4">
          <SkeletonRow count={6} />
        </div>
      ) : error ? (
        <p className="px-4 text-sm text-muted py-4">{error}</p>
      ) : items.length === 0 ? (
        <p className="px-4 text-sm text-muted py-4">Tidak ada konten.</p>
      ) : (
        /*
         * Technique: overflow-x-auto on the row itself, with px-4 as
         * padding so the first card isn't flush against the screen edge.
         * We do NOT wrap in another div — that would clip the overflow.
         */
        <div
          className="flex gap-3 overflow-x-auto pb-3 px-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item) => (
            <div key={item.slug} className="snap-start flex-shrink-0 w-36 sm:w-40">
              <MediaCard
                item={item}
                contentType={contentType}
                href={`${basePath}/${item.slug}`}
              />
            </div>
          ))}
          {/* Right-edge spacer so last card has breathing room */}
          <div className="flex-shrink-0 w-1" aria-hidden />
        </div>
      )}
    </section>
  );
}
