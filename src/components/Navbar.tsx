'use client';
// src/components/Navbar.tsx

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search, Bookmark, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchSuggest } from '@/hooks/useSearchSuggest';
import type { ContentType } from '@/types/media';

const DESKTOP_TABS = [
  { href: '/',          label: 'Anime'  },
  { href: '/hentai',    label: 'Hentai' },
  { href: '/comic',     label: 'Komik'  },
  { href: '/anime/schedule', label: 'Jadwal' },
] as const;

function pathToType(p: string): ContentType {
  if (p.startsWith('/comic'))  return 'comic';
  if (p.startsWith('/hentai')) return 'hentai';
  return 'anime';
}

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const [query,      setQuery]      = useState('');
  const [showDrop,   setShowDrop]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const type = pathToType(pathname);
  const { suggestions } = useSearchSuggest(query, type);

  useEffect(() => {
    setShowDrop(suggestions.length > 0 && query.length >= 2);
  }, [suggestions, query]);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setShowDrop(false);
    setQuery('');
  }, [pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
    setShowDrop(false);
  };

  const handleSelect = (slug: string) => {
    router.push(`/${type}/${slug}`);
    setShowDrop(false);
    setQuery('');
  };

  return (
    <header className="sticky top-0 z-40 bg-bg/92 backdrop-blur-xl border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0 font-bold text-[1.2rem] tracking-tight">
          <span className="text-primary">Shiiii</span>
          <span className="text-cyan">Nime</span>
        </Link>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-1 ml-3" aria-label="Navigasi">
          {DESKTOP_TABS.map(({ href, label }) => {
            const active = href === '/'
              ? pathname === '/'
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'px-3 py-1.5 rounded-app text-[0.85rem] font-medium transition-all duration-150',
                  active
                    ? 'bg-cyan/10 text-cyan'
                    : 'text-secondary hover:text-primary hover:bg-surface'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <div ref={wrapRef} className="relative flex-1 max-w-xs ml-auto">
          <form onSubmit={handleSubmit} role="search">
            <div className={clsx(
              'flex items-center gap-2 bg-surface border rounded-app px-3 py-2',
              'transition-all duration-150',
              showDrop
                ? 'border-cyan/60 shadow-[0_0_0_2px_rgba(0,229,255,0.15)]'
                : 'border-border focus-within:border-cyan/60 focus-within:shadow-[0_0_0_2px_rgba(0,229,255,0.15)]'
            )}>
              <Search className="w-4 h-4 text-muted flex-shrink-0" aria-hidden />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDrop(true)}
                placeholder="Cari…"
                autoComplete="off"
                aria-label="Cari konten"
                aria-expanded={showDrop}
                className="bg-transparent flex-1 text-sm text-primary placeholder:text-muted outline-none min-w-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setShowDrop(false); }}
                  aria-label="Hapus"
                  className="text-muted hover:text-primary flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" aria-hidden />
                </button>
              )}
            </div>
          </form>

          {/* Suggestions dropdown */}
          {showDrop && (
            <div
              role="listbox"
              aria-label="Saran pencarian"
              className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-surface border border-border rounded-app overflow-hidden shadow-modal max-h-72 overflow-y-auto animate-slide-up"
            >
              {suggestions.map((item) => (
                <button
                  key={item.slug}
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelect(item.slug)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-surface-2 transition-colors focus-visible:bg-surface-2 outline-none"
                >
                  <div className="w-8 h-11 rounded bg-surface-2 overflow-hidden relative flex-shrink-0">
                    {item.poster ? (
                      <Image src={item.poster} alt="" fill sizes="32px" className="object-cover" loading="lazy" />
                    ) : (
                      <span className="text-muted text-xs flex items-center justify-center h-full">?</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{item.title}</p>
                    {item.sub && <p className="text-xs text-muted mt-0.5 truncate">{item.sub}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bookmark shortcut — desktop */}
        <Link
          href="/bookmarks"
          aria-label="Favorit"
          className={clsx(
            'hidden md:flex w-8 h-8 items-center justify-center rounded-app flex-shrink-0',
            'bg-surface border border-border text-secondary',
            'hover:text-primary hover:bg-surface-2 transition-all duration-150',
            pathname === '/bookmarks' && 'border-cyan/40 text-cyan bg-cyan/8'
          )}
        >
          <Bookmark className="w-4 h-4" aria-hidden />
        </Link>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={mobileOpen}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary flex-shrink-0"
        >
          {mobileOpen ? <X className="w-4 h-4" aria-hidden /> : <Menu className="w-4 h-4" aria-hidden />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <nav
          aria-label="Menu mobile"
          className="md:hidden border-t border-border bg-bg/98 px-4 py-3 flex flex-col gap-1 animate-slide-up"
        >
          {DESKTOP_TABS.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'px-4 py-2.5 rounded-app text-sm font-medium transition-colors',
                  active ? 'bg-cyan/10 text-cyan' : 'text-secondary hover:text-primary hover:bg-surface'
                )}
              >
                {label}
              </Link>
            );
          })}
          <Link href="/bookmarks" className="px-4 py-2.5 rounded-app text-sm font-medium text-secondary hover:text-primary hover:bg-surface transition-colors flex items-center gap-2">
            <Bookmark className="w-4 h-4" aria-hidden /> Favorit
          </Link>
        </nav>
      )}
    </header>
  );
}
