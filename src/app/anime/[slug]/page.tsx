'use client';
// src/app/anime/[slug]/page.tsx — REDIRECT SHIM
// Old /anime/[slug] → new /detail/anime/[slug]

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isEpisodeSlug } from '@/utils/slugHelpers';

export default function AnimeSlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();

  useEffect(() => {
    if (!slug) return;
    if (isEpisodeSlug(slug)) {
      router.replace(`/stream/anime/${slug}`);
    } else {
      router.replace(`/detail/anime/${slug}`);
    }
  }, [slug, router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-muted text-sm">
      Mengalihkan…
    </div>
  );
}
