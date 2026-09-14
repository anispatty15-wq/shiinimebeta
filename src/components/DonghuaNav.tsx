'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ContentSearch from './ContentSearch';
import { clsx } from 'clsx';

const LINKS = [
  ['/donghua', 'Home'],
  ['/donghua/ongoing', 'Ongoing'],
  ['/donghua/completed', 'Completed'],
  ['/donghua/latest', 'Latest'],
  ['/donghua/schedule', 'Schedule'],
  ['/donghua/az', 'A-Z'],
] as const;

export default function DonghuaNav() {
  const pathname = usePathname();
  return (
    <>
      <ContentSearch type="donghua" placeholder="Cari donghua..." />
      <nav className="mx-4 mb-6 flex gap-2 overflow-x-auto border-b border-border pb-2 no-scrollbar" aria-label="Navigasi Donghua">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={clsx(
            'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition',
            pathname === href ? 'bg-yellow-400 text-black' : 'bg-surface text-secondary hover:text-primary'
          )}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
