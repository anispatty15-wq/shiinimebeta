'use client';
// src/components/BottomNav.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Tv2, BookOpen, Heart, CalendarDays, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';

const TABS = [
  { href: '/',               label: 'Anime',   Icon: Home,        hentai: false },
  { href: '/hentai',         label: 'Hentai',  Icon: Tv2,         hentai: true  },
  { href: '/comic',          label: 'Komik',   Icon: BookOpen,    hentai: false },
  { href: '/anime/schedule', label: 'Jadwal',  Icon: CalendarDays,hentai: false },
  { href: '/favorites',      label: 'Favorit', Icon: Heart,       hentai: false },
] as const;

export default function BottomNav() {
  const pathname  = usePathname();
  const { user, isAdult } = useAuth();

  return (
    <nav
      aria-label="Navigasi utama"
      className={clsx(
        'md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe',
        'flex items-center justify-around',
        'bg-surface/95 backdrop-blur-xl border-t border-border shadow-nav'
      )}
    >
      {TABS.map(({ href, label, Icon, hentai }) => {
        const active  = href === '/' ? pathname === '/' : pathname.startsWith(href);
        const locked  = hentai && (!user || !isAdult);

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'flex flex-1 flex-col items-center justify-center gap-0.5',
              'py-3 text-[0.62rem] font-semibold transition-colors duration-150 relative',
              active
                ? locked ? 'text-pink' : 'text-cyan'
                : 'text-muted hover:text-secondary'
            )}
          >
            <div className="relative">
              <Icon
                className={clsx(
                  'w-5 h-5 transition-all duration-150',
                  active && !locked && 'drop-shadow-[0_0_6px_rgba(0,229,255,0.7)]',
                  active && locked  && 'drop-shadow-[0_0_6px_rgba(236,72,153,0.7)]'
                )}
                aria-hidden
              />
              {/* Lock badge on Hentai when not adult */}
              {locked && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-pink rounded-full flex items-center justify-center">
                  <Lock className="w-2 h-2 text-white" aria-hidden />
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
