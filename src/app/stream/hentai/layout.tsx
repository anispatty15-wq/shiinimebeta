// src/app/stream/hentai/layout.tsx
// Gate for streaming hentai episodes — same 18+ guard.

import HentaiGuard from '@/components/HentaiGuard';

export default function StreamHentaiLayout({ children }: { children: React.ReactNode }) {
  return <HentaiGuard>{children}</HentaiGuard>;
}
