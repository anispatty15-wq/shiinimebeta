'use client';
// src/app/anime/episode/[slug]/page.tsx
// ── REDIRECT SHIM ──
// Old route kept so bookmarked/shared URLs still work.
// Permanently redirects to the new /stream/anime/[slug] route.

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AnimeEpisodeRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();

  useEffect(() => {
    if (slug) router.replace(`/stream/anime/${slug}`);
  }, [slug, router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-muted text-sm">
      Mengalihkan…
    </div>
  );
}
