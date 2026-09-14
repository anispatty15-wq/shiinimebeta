'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import ContentSearch from './ContentSearch';
const links = [['/nekopoi', 'Home'], ['/nekopoi/hentai', 'Hentai'], ['/nekopoi/latest', 'Latest'], ['/nekopoi/jav', 'JAV'], ['/nekopoi/genres', 'Genres'], ['/nekopoi/category/3d-hentai', 'Categories']] as const;
export default function NekopoiNav() {
  const pathname = usePathname();
  return <><ContentSearch type="hentai" placeholder="Cari konten 18+..." submitPath="/nekopoi/search" /><nav className="mx-4 mb-6 flex gap-2 overflow-x-auto border-b border-pink/15 pb-2 no-scrollbar">{links.map(([href, label]) => <Link key={href} href={href} className={clsx('whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all', pathname === href ? 'border-pink/60 bg-pink text-white shadow-[0_0_16px_rgba(233,30,140,0.2)]' : 'border-white/5 bg-surface/70 text-secondary hover:border-pink/30 hover:text-primary')}>{label}</Link>)}</nav></>;
}
