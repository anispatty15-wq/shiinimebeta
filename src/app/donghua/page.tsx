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
    .map((a) => normaliseCardItem(a, 'anime'))
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

  const hasData = (ongoingData.data && ongoingData.data.length > 0) ||
                  (latestData.data && latestData.data.length > 0);
  
  const isLoading = ongoingData.loading || latestData.loading;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {isLoading && (
        <div className="px-4 pt-6 mb-7"><SkeletonBanner /></div>
      )}

      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <span className="text-yellow-400">🐉</span> Donghua
        </h2>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 space-y-8">
        {!hasData && !isLoading && (
          <div className="text-center py-12 bg-surface rounded-app border border-border">
            <div className="text-6xl mb-4">🐉</div>
            <h3 className="text-lg font-bold text-primary mb-2">
              Donghua Segera Hadir!
            </h3>
            <p className="text-secondary text-sm">
              API donghua sedang dalam pengembangan. Data akan muncul setelah API tersedia.
            </p>
          </div>
        )}

        {/* Ongoing */}
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

        {/* Latest Updates */}
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
  );
}
