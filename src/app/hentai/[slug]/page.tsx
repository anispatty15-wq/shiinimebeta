'use client';
// src/app/hentai/[slug]/page.tsx — REDIRECT SHIM

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isEpisodeSlug } from '@/utils/slugHelpers';

export default function HentaiSlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();

  useEffect(() => {
    if (!slug) return;
    if (isEpisodeSlug(slug)) {
      router.replace(`/stream/hentai/${slug}`);
    } else {
      router.replace(`/detail/hentai/${slug}`);
    }
  }, [slug, router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-muted text-sm">
      Mengalihkan…
    </div>
  );
}
