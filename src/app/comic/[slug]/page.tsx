'use client';
// src/app/comic/[slug]/page.tsx — REDIRECT SHIM

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ComicSlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();

  useEffect(() => {
    if (slug) router.replace(`/detail/comic/${slug}`);
  }, [slug, router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-muted text-sm">
      Mengalihkan…
    </div>
  );
}
