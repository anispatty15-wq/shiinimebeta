// src/app/donghua/page.tsx
'use client';

import { useCallback } from 'react';
import SectionRow from '@/components/SectionRow';
import { DonghuaAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { normaliseCardItem } from '@/utils/slugHelpers';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import DonghuaNav from '@/components/DonghuaNav';
import TopBanner from '@/components/TopBanner';

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
  const homeData = useApi(useCallback(() => DonghuaAPI.getHome(), []), []);
  const ongoingData = useApi(useCallback(() => DonghuaAPI.getOngoing(), []), []);
  const latestData = useApi(useCallback(() => DonghuaAPI.getLatest(), []), []);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <DonghuaNav />
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <span className="text-yellow-400">🐉</span> Donghua
        </h2>
      </div>

      <div className="max-w-screen-xl mx-auto px-4">
        {homeData.loading && <SkeletonBanner />}
        <TopBanner
          title="Donghua Pilihan"
          items={toItems(homeData.data)}
          basePath="/detail/donghua"
          accentColor="violet"
        />
        <SectionRow title="Donghua Ongoing" items={toItems(ongoingData.data, 'Ongoing')} loading={ongoingData.loading} error={ongoingData.error} contentType="donghua" basePath="/detail/donghua" moreHref="/donghua/ongoing" accent="violet" />
        <SectionRow title="Update Terbaru" items={toItems(latestData.data, 'Ongoing')} loading={latestData.loading} error={latestData.error} contentType="donghua" basePath="/detail/donghua" moreHref="/donghua/latest" accent="violet" />
      </div>
    </div>
  );
}
