// src/app/donghua/page.tsx
'use client';

import { useCallback } from 'react';
import SectionRow from '@/components/SectionRow';
import { DonghuaAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { normaliseCardItem } from '@/utils/slugHelpers';
import { SkeletonBanner } from '@/components/SkeletonLoader';

function toItems(raw: unknown, defaultStatus?: string) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => normaliseCardItem(a, 'donghua'))
    .filter(Boolean)
    .map((c) => ({
      slug:   c!.slug,
      title:  c!.title,
      poster: c!.poster,
      status: c!.status || defaultStatus || '',
      type:   c!.typeLabel,
      score:  c!.score as string | number | undefined,
      meta:   c!.meta,
      date:   c!.date,
      href:   c!.href,
    }));
}

export default function DonghuaPage() {
  const ongoingData = useApi(useCallback(() => DonghuaAPI.getOngoing(), []), []);
  const latestData = useApi(useCallback(() => DonghuaAPI.getLatest(), []), []);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <span className="text-yellow-400">🐉</span> Donghua
        </h2>
      </div>

      <div className="max-w-screen-xl mx-auto px-4">
        {/* Coming Soon Banner */}
        <div className="mb-12 p-8 md:p-12 rounded-app bg-gradient-to-br from-yellow-400/5 via-surface to-surface border border-yellow-400/20 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🐉</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-primary mb-3">
            Donghua Segera Hadir!
          </h3>
          <p className="text-base text-secondary max-w-md mx-auto mb-6">
            developer sedang menyiapkan Donghua untukmu. donghua akan segera hadir dalam waktu dekat.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
            <span className="px-3 py-1.5 rounded-full bg-surface border border-border">
              🎬 Ribuan judul
            </span>
            <span className="px-3 py-1.5 rounded-full bg-surface border border-border">
              ⚡ Update harian
            </span>
            <span className="px-3 py-1.5 rounded-full bg-surface border border-border">
              🌟 Kualitas HD
            </span>
          </div>
        </div>

        {/* Preview sections - blurred */}
        <div className="space-y-8 relative">
          {/* Blur overlay */}
          <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/30 pointer-events-none rounded-app" />
          
          <div className="opacity-40">
            <SectionRow
              title="Donghua Ongoing"
              items={toItems(ongoingData.data, 'Ongoing')}
              loading={ongoingData.loading}
              error={ongoingData.error}
              contentType="anime"
              basePath="/stream/anime"
              moreHref="/donghua/ongoing"
              accent="yellow-400"
            />
          </div>

          <div className="opacity-40">
            <SectionRow
              title="Update Terbaru"
              items={toItems(latestData.data, 'Ongoing')}
              loading={latestData.loading}
              error={latestData.error}
              contentType="anime"
              basePath="/stream/anime"
              moreHref="/donghua/latest"
              accent="yellow-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
