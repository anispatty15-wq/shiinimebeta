'use client';

import Link from 'next/link';
import ContentSearch from '@/components/ContentSearch';

export default function MaidComicNav() {
  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {[
          ['/maid', 'Home'],
          ['/maid/list', 'Semua'],
          ['/maid/latest', 'Terbaru'],
          ['/maid/genres', 'Genre'],
          ['/comic', 'Comic lain'],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-secondary transition hover:border-violet/50 hover:text-primary">
            {label}
          </Link>
        ))}
      </div>
      <ContentSearch type="comic" suggestionType="maid" submitPath="/maid/search" placeholder="Cari Maid Comic..." />
    </div>
  );
}
