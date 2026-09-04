'use client';
// src/components/Navbar.tsx

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search, Menu, X, User, Heart, History, Bell, Shield, Clock } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchSuggest } from '@/hooks/useSearchSuggest';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import type { ContentType } from '@/types/media';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { href: '/',               label: 'Home'    },
  { href: '/anime',          label: 'Anime'   },
  { href: '/donghua',        label: 'Donghua' },
  { href: '/hentai',         label: 'Hentai'  },
  { href: '/comic',          label: 'Komik'   },
  { href: '/anime/schedule', label: 'Jadwal'  },
  { href: '/anime/browse',   label: 'Filter'  },
  { href: '/friends',        label: 'Teman'   },
  { href: '/notifications',  label: 'Notifikasi' },
  { href: '/history',        label: 'Riwayat' },
  { href: '/favorites',      label: 'Favorit' },
] as const;

function pathToType(p: string): ContentType {
  if (p.startsWith('/comic'))   return 'comic';
  if (p.startsWith('/hentai'))  return 'hentai';
  if (p.startsWith('/donghua')) return 'donghua';
  return 'anime';
}

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { isAdmin, user, signInWithGoogle } = useAuth();

  // Debug admin status
  useEffect(() => {
    console.log('%c[Navbar] Admin status', 'color: #00ff00; font-weight: bold; font-size: 16px;', { 
      isAdmin, 
      userUid: user?.uid,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    });
    
    // Show alert if admin (for debugging)
    if (isAdmin && user) {
      console.log('%c🛡️ ADMIN MODE ACTIVE!', 'color: #ff00ff; font-weight: bold; font-size: 20px; background: yellow;', {
        uid: user.uid,
        email: user.email
      });
    } else if (user && !isAdmin) {
      console.warn('%c⚠️ Logged in but NOT admin', 'color: orange; font-weight: bold;', {
        uid: user.uid,
        email: user.email,
        expectedAdminUid: 'tjG4P99RoxigBJlK4dUJrAnZxAk2'
      });
    }
  }, [isAdmin, user]);

  const [query,      setQuery]      = useState('');
  const [showDrop,   setShowDrop]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false); // mobile search expand
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const type = pathToType(pathname);
  const { suggestions } = useSearchSuggest(query, type);
  const { unreadCount } = useNotificationsList();

  useEffect(() => {
    setShowDrop(suggestions.length > 0 && query.length >= 2);
  }, [suggestions, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Reset on route change
  useEffect(() => {
    setMobileOpen(false);
    setShowSearch(false);
    setShowDrop(false);
    setQuery('');
  }, [pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${type}`);
    setShowDrop(false);
    setShowSearch(false);
  };

  const handleSelect = (slug: string) => {
    router.push(`/${type}/${slug}`);
    setShowDrop(false);
    setQuery('');
    setShowSearch(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-xl border-b border-border pt-safe">

      {/* ── Main bar ── */}
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-2 px-safe">

        {/* Logo — always visible, shrink-0 */}
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0 font-bold text-[1.05rem] tracking-tight"
        >
          <Image 
            src="/logo.png" 
            alt="Shiiinime Logo" 
            width={32} 
            height={32}
            className="flex-shrink-0"
          />
          <div className="flex items-center gap-1">
            <span className="text-primary">Shiiinime</span>
            <span className="text-cyan ml-1">Stream</span>
          </div>
        </Link>

        {/* Desktop nav tabs */}
        <nav className="hidden md:flex items-center gap-0.5 ml-2 overflow-x-auto no-scrollbar" aria-label="Navigasi">
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'px-2.5 py-1.5 rounded-app text-[0.82rem] font-medium whitespace-nowrap transition-all',
                  active ? 'bg-cyan/10 text-cyan' : 'text-secondary hover:text-primary hover:bg-surface'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop search */}
        <div ref={wrapRef} className="hidden md:block relative w-52 lg:w-64">
          <SearchBox
            query={query}
            setQuery={setQuery}
            showDrop={showDrop}
            setShowDrop={setShowDrop}
            suggestions={suggestions}
            inputRef={inputRef}
            onSubmit={handleSubmit}
            onSelect={handleSelect}
          />
        </div>

        {/* Mobile action icons */}
        <div className="md:hidden flex items-center gap-1">
          {/* Notifications icon */}
          <Link
            href="/notifications"
            aria-label="Notifikasi"
            className="w-8 h-8 flex items-center justify-center rounded-app text-secondary hover:text-primary relative"
          >
            <Bell className="w-4.5 h-4.5" aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[0.6rem] font-bold bg-pink-500 text-white rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Search icon — expands search bar */}
          <button
            onClick={() => { setShowSearch((v) => !v); setMobileOpen(false); }}
            aria-label="Cari"
            className="w-8 h-8 flex items-center justify-center rounded-app text-secondary hover:text-primary"
          >
            <Search className="w-4.5 h-4.5" aria-hidden />
          </button>

          {/* Profile / login */}
          <Link
            href="/profile"
            aria-label="Profil"
            className="w-8 h-8 flex items-center justify-center rounded-app text-secondary hover:text-primary"
          >
            <User className="w-4.5 h-4.5" aria-hidden />
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => { setMobileOpen((v) => !v); setShowSearch(false); }}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
            className="w-8 h-8 flex items-center justify-center rounded-app text-secondary hover:text-primary"
          >
            {mobileOpen
              ? <X className="w-4 h-4" aria-hidden />
              : <Menu className="w-4 h-4" aria-hidden />}
          </button>
        </div>

        {/* Desktop profile icon */}
        <Link
          href="/notifications"
          aria-label="Notifikasi"
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-all flex-shrink-0 relative"
        >
          <Bell className="w-4 h-4" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[0.65rem] font-bold bg-pink-500 text-white rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="hidden md:block relative">
          {user ? (
            <>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Profil"
                className={clsx(
                  'flex w-8 h-8 items-center justify-center rounded-app border transition-all flex-shrink-0',
                  isAdmin 
                    ? 'bg-violet/10 border-violet/40 text-violet hover:bg-violet/20' 
                    : 'bg-surface border-border text-secondary hover:text-primary'
                )}
              >
                {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-app shadow-lg py-2 z-50">
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  
                  {/* Debug: Always show admin link for testing */}
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-violet hover:text-violet/80 hover:bg-violet/10 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  ) : (
                    <div className="px-4 py-1 text-xs text-muted italic">
                      {user?.uid === 'tjG4P99RoxigBJlK4dUJrAnZxAk2' ? '⏳ Loading admin...' : null}
                    </div>
                  )}

                  <Link
                    href="/history"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    History
                  </Link>

                  <Link
                    href="/bookmarks"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    Bookmarks
                  </Link>

                  <div className="border-t border-border my-1" />

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      // Logout via Firebase
                      import('@/lib/firebase').then(({ auth }) => {
                        import('firebase/auth').then(({ signOut }) => {
                          signOut(auth).then(() => {
                            window.location.href = '/';
                          });
                        });
                      });
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-app bg-cyan text-bg text-sm font-semibold hover:brightness-110 transition-all"
            >
              <User className="w-4 h-4" />
              Login
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile search bar (expands below header) ── */}
      {showSearch && (
        <div ref={wrapRef} className="md:hidden border-t border-border bg-bg px-4 py-2.5">
          <SearchBox
            query={query}
            setQuery={setQuery}
            showDrop={showDrop}
            setShowDrop={setShowDrop}
            suggestions={suggestions}
            inputRef={inputRef}
            onSubmit={handleSubmit}
            onSelect={handleSelect}
            autoFocus
          />
        </div>
      )}

      {/* ── Mobile dropdown menu ── */}
      {mobileOpen && (
        <nav
          aria-label="Menu mobile"
          className="md:hidden border-t border-border bg-bg px-3 py-2 grid grid-cols-2 gap-1 animate-slide-up"
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'px-3 py-2.5 rounded-app text-sm font-medium transition-colors',
                  active ? 'bg-cyan/10 text-cyan' : 'text-secondary hover:text-primary hover:bg-surface'
                )}
              >
                {label}
              </Link>
            );
          })}
          
          {/* Admin Dashboard Link - Mobile */}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-2.5 rounded-app text-sm font-medium text-violet hover:text-violet/80 hover:bg-violet/10 transition-colors flex items-center gap-1.5 col-span-2 border border-violet/30"
            >
              <Shield className="w-4 h-4" aria-hidden /> Admin Dashboard
            </Link>
          )}
          
          {user ? (
            <Link
              href="/profile"
              className="px-3 py-2.5 rounded-app text-sm font-medium text-secondary hover:text-primary hover:bg-surface transition-colors flex items-center gap-1.5 col-span-2"
            >
              <User className="w-4 h-4" aria-hidden /> Profil
            </Link>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-3 py-2.5 rounded-app text-sm font-medium bg-cyan text-bg hover:brightness-110 transition-all flex items-center justify-center gap-1.5 col-span-2"
            >
              <User className="w-4 h-4" aria-hidden /> Login dengan Google
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

// ── Shared SearchBox component ────────────────────────────────
interface SearchBoxProps {
  query:       string;
  setQuery:    (v: string) => void;
  showDrop:    boolean;
  setShowDrop: (v: boolean) => void;
  suggestions: Array<{ slug: string; title: string; poster?: string; sub?: string }>;
  inputRef:    React.RefObject<HTMLInputElement>;
  onSubmit:    (e: React.FormEvent) => void;
  onSelect:    (slug: string) => void;
  autoFocus?:  boolean;
}

function SearchBox({
  query, setQuery, showDrop, setShowDrop,
  suggestions, inputRef, onSubmit, onSelect, autoFocus,
}: SearchBoxProps) {
  const pathname = usePathname();
  
  // Determine content type based on current path
  const getContentType = (): ContentType => {
    if (pathname.startsWith('/comic')) return 'comic';
    if (pathname.startsWith('/hentai')) return 'hentai';
    return 'anime';
  };

  const contentType = getContentType();

  // Different keywords based on content type
  const animeKeywords = [
    'One Piece...',
    'Naruto Shippuden...',
    'Attack on Titan...',
    'Demon Slayer...',
    'Jujutsu Kaisen...',
    'My Hero Academia...',
    'Spy x Family...',
    'Chainsaw Man...',
    'Tokyo Revengers...',
    'Bleach...',
  ];

  const hentaiKeywords = [
    'Overflow...',
    'Mankitsu Happening...',
    'Discipline...',
    'Euphoria...',
    'Boku to Misaki-sensei...',
    'Oni Chichi...',
    'Helter Skelter...',
    'Resort Boin...',
    'Tsun Tsun Maid...',
    'Kanojo x Kanojo...',
  ];

  const comicKeywords = [
    'Solo Leveling...',
    'Tower of God...',
    'The Beginning After The End...',
    'Omniscient Reader...',
    'Nano Machine...',
    'Return of the Mount Hua Sect...',
    'Eleceed...',
    'The God of High School...',
    'Noblesse...',
    'Lookism...',
  ];

  const donghuaKeywords = [
    'Battle Through the Heavens...',
    'Soul Land...',
    'The King\'s Avatar...',
    'Perfect World...',
    'Stellar Transformations...',
    'Tales of Demons and Gods...',
    'Martial Universe...',
    'Wu Geng Ji...',
    'The Daily Life of the Immortal King...',
    'Scissor Seven...',
  ];

  const searchKeywords = 
    contentType === 'hentai' ? hentaiKeywords :
    contentType === 'comic' ? comicKeywords :
    contentType === 'donghua' ? donghuaKeywords :
    animeKeywords;

  const typingText = useTypingEffect(searchKeywords, 120, 60, 2000);

  return (
    <div className="relative">
      <form onSubmit={onSubmit} role="search">
        <div className={clsx(
          'flex items-center gap-2 bg-surface border rounded-app px-3 py-2',
          showDrop
            ? 'border-cyan/60 shadow-[0_0_0_2px_rgba(0,229,255,0.12)]'
            : 'border-border focus-within:border-cyan/60'
        )}>
          <Search className="w-3.5 h-3.5 text-muted flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDrop(true)}
            placeholder={`Search ${typingText}`}
            autoComplete="off"
            autoFocus={autoFocus}
            aria-label="Cari konten"
            className="bg-transparent flex-1 text-sm text-primary placeholder:text-muted outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setShowDrop(false); }}
              aria-label="Hapus pencarian"
              className="text-muted hover:text-primary flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          )}
        </div>
      </form>

      {showDrop && suggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-surface border border-border rounded-app shadow-modal max-h-64 overflow-y-auto animate-slide-up"
        >
          {suggestions.map((item) => (
            <button
              key={item.slug}
              role="option"
              aria-selected={false}
              onClick={() => onSelect(item.slug)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors outline-none"
            >
              <div className="w-7 h-10 rounded bg-surface-2 overflow-hidden relative flex-shrink-0">
                {item.poster
                  ? <Image src={item.poster} alt="" fill sizes="28px" className="object-cover" loading="lazy" />
                  : <span className="flex items-center justify-center h-full text-muted text-xs">?</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">{item.title}</p>
                {item.sub && <p className="text-xs text-muted truncate mt-0.5">{item.sub}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
