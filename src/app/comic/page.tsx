'use client';
// src/app/comic/page.tsx — Comic Home

import { useCallback } from 'react';
import { ComicAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import SectionRow from '@/components/SectionRow';
import { normaliseCardItem } from '@/utils/slugHelpers';

function toItems(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => normaliseCardItem(c, 'comic'))
    .filter(Boolean)
    .map((c) => ({
      slug:   c!.slug,
      title:  c!.title,
      poster: c!.poster,
      status: c!.status,
      type:   c!.typeLabel,
      score:  c!.score as string | number | undefined,
      meta:   c!.meta,
      href:   c!.href,  // always /detail/comic/...
    }));
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
        basePath="/detail/comic"
        moreHref="/comic/latest"
        accent="violet"
      />
      <SectionRow
        title="Paling Populer"
        items={toItems(popular.data)}
        loading={popular.loading}
        error={popular.error}
        contentType="comic"
        basePath="/detail/comic"
        moreHref="/comic/popular"
        accent="cyan"
      />
      <SectionRow
        title="Manga (JP)"
        items={toItems(manga.data)}
        loading={manga.loading}
        error={manga.error}
        contentType="comic"
        basePath="/detail/comic"
        moreHref="/comic/manga"
        accent="pink"
      />
      <SectionRow
        title="Manhua (CN)"
        items={toItems(manhua.data)}
        loading={manhua.loading}
        error={manhua.error}
        contentType="comic"
        basePath="/detail/comic"
        moreHref="/comic/manhua"
        accent="violet"
      />
      <SectionRow
        title="Manhwa (KR)"
        items={toItems(manhwa.data)}
        loading={manhwa.loading}
        error={manhwa.error}
        contentType="comic"
        basePath="/detail/comic"
        moreHref="/comic/manhwa"
        accent="cyan"
      />
    </div>
  );
}
