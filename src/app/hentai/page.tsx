'use client';
// src/app/hentai/page.tsx — Hentai Home

import { useCallback } from 'react';
import { HentaiAPI, toArray } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import SectionRow from '@/components/SectionRow';
import { SkeletonRow } from '@/components/SkeletonLoader';
import type { HentaiCard } from '@/types/media';

function toItems(raw: unknown) {
  return toArray(raw as HentaiCard[]).map((h) => {
    const item = h as unknown as Record<string, unknown>;
    const slug = String(
      item.slug ?? item.id ??
      (typeof item.link === 'string'
        ? item.link.replace(/\/$/, '').split('/').pop()
        : undefined) ??
      ''
    );
    return {
      slug,
      title:    String(item.title    ?? item.name     ?? ''),
      poster:   String(item.poster   ?? item.image    ?? item.thumbnail ?? ''),
      category: String(item.category ?? ''),
      meta:     item.episode != null
        ? `Ep. ${item.episode}`
        : (item.year ? String(item.year) : undefined),
    };
  }).filter((h) => h.slug);
}

export default function HentaiPage() {
  const home    = useApi(useCallback(() => HentaiAPI.getHome(),         []), []);
  const latest  = useApi(useCallback(() => HentaiAPI.getLatestHentai(), []), []);
  const jav     = useApi(useCallback(() => HentaiAPI.getLatestJAV(),    []), []);

  return (
    <div className="max-w-screen-xl mx-auto py-5">
      {/* Warning banner */}
      <div className="mx-4 mb-6 px-4 py-3 rounded-app bg-pink/10 border border-pink/25 flex items-start gap-2.5">
        <span className="text-pink text-lg leading-none mt-0.5" aria-hidden>⚠️</span>
        <p className="text-xs text-secondary leading-relaxed">
          <span className="font-semibold text-pink">Konten Dewasa (18+).</span>{' '}
          Halaman ini mengandung konten untuk orang dewasa. Pastikan Anda berusia 18 tahun ke atas.
        </p>
      </div>

      <SectionRow
        title="Beranda"
        items={toItems(home.data)}
        loading={home.loading}
        error={home.error}
        contentType="hentai"
        basePath="/hentai"
        moreHref="/hentai/list"
        accent="pink"
      />

      <SectionRow
        title="Hentai Terbaru"
        items={toItems(latest.data)}
        loading={latest.loading}
        error={latest.error}
        contentType="hentai"
        basePath="/hentai"
        moreHref="/hentai/latest"
        accent="violet"
      />

      <SectionRow
        title="JAV Terbaru"
        items={toItems(jav.data)}
        loading={jav.loading}
        error={jav.error}
        contentType="hentai"
        basePath="/hentai"
        moreHref="/hentai/jav"
        accent="cyan"
      />
    </div>
  );
}
