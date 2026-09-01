'use client';
// src/app/hentai/page.tsx — Hentai Home

import { useCallback } from 'react';
import { HentaiAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import SectionRow from '@/components/SectionRow';
import { normaliseCardItem } from '@/utils/slugHelpers';

function toItems(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => normaliseCardItem(h, 'hentai'))
    .filter(Boolean)
    .map((c) => ({
      slug:   c!.slug,
      title:  c!.title,
      poster: c!.poster,
      status: c!.status,
      type:   c!.typeLabel,
      score:  c!.score as string | number | undefined,
      meta:   c!.meta,
      href:   c!.href,  // /stream/hentai/... or /detail/hentai/...
    }));
}

export default function HentaiPage() {
  const home   = useApi(useCallback(() => HentaiAPI.getHome(),         []), []);
  const latest = useApi(useCallback(() => HentaiAPI.getLatestHentai(), []), []);
  const jav    = useApi(useCallback(() => HentaiAPI.getLatestJAV(),    []), []);

  return (
    <div className="max-w-screen-xl mx-auto py-5">
      <div className="mx-4 mb-6 px-4 py-3 rounded-app bg-pink/10 border border-pink/25 flex items-start gap-2.5">
        <span className="text-pink text-lg leading-none mt-0.5" aria-hidden>⚠️</span>
        <p className="text-xs text-secondary leading-relaxed">
          <span className="font-semibold text-pink">Konten Dewasa (18+).</span>{' '}
          Pastikan Anda berusia 18 tahun ke atas sebelum melanjutkan.
        </p>
      </div>

      <SectionRow
        title="Beranda"
        items={toItems(home.data)}
        loading={home.loading}
        error={home.error}
        contentType="hentai"
        basePath="/stream/hentai"
        moreHref="/hentai/list"
        accent="pink"
      />
      <SectionRow
        title="Hentai Terbaru"
        items={toItems(latest.data)}
        loading={latest.loading}
        error={latest.error}
        contentType="hentai"
        basePath="/stream/hentai"
        moreHref="/hentai/latest"
        accent="violet"
      />
      <SectionRow
        title="JAV Terbaru"
        items={toItems(jav.data)}
        loading={jav.loading}
        error={jav.error}
        contentType="hentai"
        basePath="/stream/hentai"
        moreHref="/hentai/jav"
        accent="cyan"
      />
    </div>
  );
}
