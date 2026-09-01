'use client';
// src/app/comic/page.tsx — Comic Home

import { useCallback } from 'react';
import { ComicAPI, toArray } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import SectionRow from '@/components/SectionRow';
import type { ComicCard } from '@/types/media';

function toItems(raw: unknown) {
  return toArray(raw as ComicCard[]).map((c) => {
    const item = c as Record<string, unknown>;
    const slug = String(
      item.slug ?? item.id ??
      (typeof item.link === 'string'
        ? item.link.replace(/\/$/, '').split('/').pop()
        : undefined) ??
      ''
    );
    return {
      slug,
      title:  String(item.title   ?? item.name  ?? ''),
      poster: String(item.poster  ?? item.image ?? item.cover ?? item.thumbnail ?? ''),
      status: String(item.status  ?? ''),
      type:   String(item.type    ?? ''),
      score:  item.score ?? undefined,
      meta:   item.chapter != null
        ? `Ch. ${item.chapter}`
        : (item.date ? String(item.date) : undefined),
    };
  }).filter((c) => c.slug);
}

export default function ComicPage() {
  const latest  = useApi(useCallback(() => ComicAPI.getLatest(),  []), []);
  const popular = useApi(useCallback(() => ComicAPI.getPopular(), []), []);
  const manga   = useApi(useCallback(() => ComicAPI.getManga(),   []), []);
  const manhua  = useApi(useCallback(() => ComicAPI.getManhua(),  []), []);
  const manhwa  = useApi(useCallback(() => ComicAPI.getManhwa(),  []), []);

  return (
    <div className="max-w-screen-xl mx-auto py-5">
      <SectionRow
        title="Update Terbaru"
        items={toItems(latest.data)}
        loading={latest.loading}
        error={latest.error}
        contentType="comic"
        basePath="/comic"
        moreHref="/comic/latest"
        accent="violet"
      />
      <SectionRow
        title="Paling Populer"
        items={toItems(popular.data)}
        loading={popular.loading}
        error={popular.error}
        contentType="comic"
        basePath="/comic"
        moreHref="/comic/popular"
        accent="cyan"
      />
      <SectionRow
        title="Manga (JP)"
        items={toItems(manga.data)}
        loading={manga.loading}
        error={manga.error}
        contentType="comic"
        basePath="/comic"
        moreHref="/comic/manga"
        accent="pink"
      />
      <SectionRow
        title="Manhua (CN)"
        items={toItems(manhua.data)}
        loading={manhua.loading}
        error={manhua.error}
        contentType="comic"
        basePath="/comic"
        accent="violet"
      />
      <SectionRow
        title="Manhwa (KR)"
        items={toItems(manhwa.data)}
        loading={manhwa.loading}
        error={manhwa.error}
        contentType="comic"
        basePath="/comic"
        accent="cyan"
      />
    </div>
  );
}
