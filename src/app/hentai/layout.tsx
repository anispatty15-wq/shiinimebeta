// src/app/hentai/layout.tsx
// Wraps ALL /hentai/* routes with the 18+ guard.
// No 'use client' needed here — HentaiGuard is already client component.

import HentaiGuard from '@/components/HentaiGuard';

export default function HentaiLayout({ children }: { children: React.ReactNode }) {
  return <HentaiGuard>{children}</HentaiGuard>;
}
