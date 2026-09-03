'use client';
// src/components/BottomNav.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Heart, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';

// ── Custom SVG icons ──────────────────────────────────────────
function AnimeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx('w-5 h-5', active ? 'text-cyan' : 'text-muted')} fill="currentColor" aria-hidden>
      {/* Play circle — anime/streaming */}
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
    </svg>
  );
}

function HentaiIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx('w-5 h-5', active ? 'text-pink-400' : 'text-muted')} fill="currentColor" aria-hidden>
      {/* 18+ lock */}
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  );
}

function ComicIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx('w-5 h-5', active ? 'text-violet-400' : 'text-muted')} fill="currentColor" aria-hidden>
      {/* Open book */}
      <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
    </svg>
  );
}

function DonghuaIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx('w-5 h-5', active ? 'text-yellow-400' : 'text-muted')} fill="currentColor" aria-hidden>
      {/* Dragon/Chinese style */}
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
      <circle cx="9" cy="9" r="1.5"/>
      <circle cx="15" cy="9" r="1.5"/>
    </svg>
  );
}

const TABS = [
  { href: '/',               label: 'Anime',   hentai: false, icon: AnimeIcon,   activeColor: 'text-cyan' },
  { href: '/donghua',        label: 'Donghua', hentai: false, icon: DonghuaIcon, activeColor: 'text-yellow-400' },
  { href: '/hentai',         label: 'Hentai',  hentai: true,  icon: HentaiIcon,  activeColor: 'text-pink-400' },
  { href: '/comic',          label: 'Komik',   hentai: false, icon: ComicIcon,   activeColor: 'text-violet-400' },
  { href: '/favorites',      label: 'Favorit', hentai: false, icon: null,        activeColor: 'text-pink-400' },
] as const;

export default function BottomNav() {
  const pathname  = usePathname();
  const { user, isAdult } = useAuth();

  return (
    <nav
      aria-label="Navigasi utama"
      className={clsx(
        'md:hidden fixed bottom-0 left-0 right-0 z-50',
        'flex items-center justify-around pb-safe',
        'bg-surface/95 backdrop-blur-xl border-t border-border shadow-nav'
      )}
    >
      {TABS.map(({ href, label, hentai, icon: Icon, activeColor }) => {
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
              'py-3 text-[0.62rem] font-semibold transition-colors duration-150',
              active ? activeColor : 'text-muted hover:text-secondary'
            )}
          >
            <div className="relative">
              {/* Custom icon or fallback lucide */}
              {Icon ? (
                <Icon active={active} />
              ) : href === '/anime/schedule' ? (
                <CalendarDays className={clsx('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(0,229,255,0.7)]')} aria-hidden />
              ) : (
                <Heart className={clsx('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]')} aria-hidden />
              )}

              {/* Lock badge on Hentai if not adult */}
              {locked && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-pink-500 rounded-full flex items-center justify-center">
                  <Lock className="w-2 h-2 text-white" aria-hidden />
                </span>
              )}

              {/* Active glow dot */}
              {active && !locked && (
                <span className={clsx(
                  'absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                  href === '/hentai' ? 'bg-pink-400' : href === '/comic' ? 'bg-violet-400' : href === '/favorites' ? 'bg-pink-400' : 'bg-cyan'
                )} />
              )}
            </div>
            <span className={active ? activeColor : ''}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
