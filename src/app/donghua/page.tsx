// src/app/donghua/page.tsx
'use client';

import { useCallback } from 'react';
import { Metadata } from 'next';
import HeroBanner from '@/components/HeroBanner';
import SectionRow from '@/components/SectionRow';
import { DonghuaAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { normaliseCardItem } from '@/utils/slugHelpers';

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
  const latestData = useApi(useCallback(() => DonghuaAPI.getLatest(), []), []);
  const ongoingData = useApi(useCallback(() => DonghuaAPI.getOngoing(), []), []);
  const homeData = useApi(useCallback(() => DonghuaAPI.getHome(), []), []);

  const hasData = (latestData.data && latestData.data.length > 0) ||
                  (ongoingData.data && ongoingData.data.length > 0) ||
                  (homeData.data && homeData.data.length > 0);
  
  const isLoading = latestData.loading || ongoingData.loading || homeData.loading;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Hero Banner */}
      <HeroBanner
        title="Donghua"
        subtitle="Nonton donghua (anime China) subtitle Indonesia"
        accentColor="text-yellow-400"
      />

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
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

        {/* Ongoing */}
        <SectionRow
          title="Sedang Tayang"
          items={toItems(ongoingData.data, 'Ongoing')}
          loading={ongoingData.loading}
          error={ongoingData.error}
          contentType="anime"
          basePath="/stream/anime"
          moreHref="/donghua/ongoing"
          accent="yellow-400"
        />

        {/* Popular/Home */}
        <SectionRow
          title="Populer"
          items={toItems(homeData.data)}
          loading={homeData.loading}
          error={homeData.error}
          contentType="anime"
          basePath="/stream/anime"
          moreHref="/donghua/browse"
          accent="yellow-400"
        />
      </div>
    </div>
  );
}
