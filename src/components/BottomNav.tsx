'use client';
// src/components/BottomNav.tsx
// Floating bottom navigation bar — mobile only (hidden on md+)

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Tv2, BookOpen, Heart, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';

const TABS = [
  { href: '/',               label: 'Anime',   Icon: Home        },
  { href: '/hentai',         label: 'Hentai',  Icon: Tv2         },
  { href: '/comic',          label: 'Komik',   Icon: BookOpen    },
  { href: '/anime/schedule', label: 'Jadwal',  Icon: CalendarDays },
  { href: '/favorites',      label: 'Favorit', Icon: Heart       },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className={clsx(
        'md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe',
        'flex items-center justify-around',
        'bg-surface/95 backdrop-blur-xl border-t border-border shadow-nav'
      )}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = href === '/'
          ? pathname === '/'
          : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'flex flex-1 flex-col items-center justify-center gap-1',
              'py-3 text-[0.65rem] font-semibold transition-colors duration-150',
              active
                ? 'text-cyan'
                : 'text-muted hover:text-secondary'
            )}
          >
            <Icon
              className={clsx(
                'w-5 h-5 transition-all duration-150',
                active && 'drop-shadow-[0_0_6px_rgba(0,229,255,0.7)]'
              )}
              aria-hidden
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
