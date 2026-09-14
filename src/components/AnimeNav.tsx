'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import ContentSearch from './ContentSearch';

const LINKS = [
  ['/anime', 'Home'],
  ['/anime/ongoing', 'Ongoing'],
  ['/anime/completed', 'Completed'],
  ['/anime/all', 'All Anime'],
  ['/anime/schedule', 'Schedule'],
  ['/anime/genres', 'Genre'],
] as const;

export default function AnimeNav() {
  const pathname = usePathname();
  return (
    <>
      <ContentSearch type="anime" placeholder="Cari anime..." />
      <nav className="mx-4 mb-6 flex gap-2 overflow-x-auto border-b border-white/10 pb-2 no-scrollbar" aria-label="Navigasi Anime">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={clsx(
            'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
            pathname === href
              ? 'border-cyan/60 bg-cyan text-bg shadow-[0_0_16px_rgba(0,229,255,0.2)]'
              : 'border-white/5 bg-surface/70 text-secondary hover:-translate-y-0.5 hover:border-cyan/30 hover:bg-surface hover:text-primary'
          )}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
