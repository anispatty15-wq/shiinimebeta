'use client';
// src/components/SkeletonLoader.tsx

import { clsx } from 'clsx';

function SkeletonCard() {
  return (
    <div aria-hidden="true" className="rounded-card overflow-hidden bg-surface animate-pulse">
      <div className="aspect-[2/3] min-h-[200px] bg-surface-2 relative overflow-hidden">
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="p-2.5 space-y-2">
        <div className="h-3 rounded bg-surface-2 overflow-hidden relative">
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="h-2.5 w-3/5 rounded bg-surface-2 overflow-hidden relative">
          <div className="absolute inset-0 shimmer" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export function SkeletonGrid({ count = 12, className }: SkeletonGridProps) {
  return (
    <div className={clsx('card-grid', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow({ count = 6 }: { count?: number }) {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory px-0"
      style={{ scrollbarWidth: 'none' }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 snap-start w-36">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-5 pt-4">
      <div className="flex gap-5">
        <div className="w-32 flex-shrink-0 aspect-[2/3] rounded-card bg-surface-2 overflow-hidden relative">
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="flex-1 space-y-3 py-1">
          <div className="h-5 rounded bg-surface-2 w-4/5 relative overflow-hidden"><div className="absolute inset-0 shimmer" /></div>
          <div className="h-3 rounded bg-surface-2 w-2/5 relative overflow-hidden"><div className="absolute inset-0 shimmer" /></div>
          <div className="h-3 rounded bg-surface-2 w-3/5 relative overflow-hidden"><div className="absolute inset-0 shimmer" /></div>
          <div className="h-3 rounded bg-surface-2 w-1/3 relative overflow-hidden"><div className="absolute inset-0 shimmer" /></div>
        </div>
      </div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={clsx('h-3 rounded bg-surface-2 relative overflow-hidden', i === 3 && 'w-3/4')}>
            <div className="absolute inset-0 shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="w-full h-52 rounded-card bg-surface-2 overflow-hidden relative animate-pulse">
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}
