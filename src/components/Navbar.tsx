'use client';
// src/components/Navbar.tsx

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search, Menu, X, User, Heart, History, Bell, Shield, Clock, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchSuggest } from '@/hooks/useSearchSuggest';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import type { ContentType } from '@/types/media';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, type Language } from '@/context/LanguageContext';

const NAV_LINKS = [
  { href: '/', key: 'home' },
  { href: '/anime', key: 'anime' },
  { href: '/donghua', key: 'donghua' },
  { href: '/hentai', key: 'hentai' },
  { href: '/comic', key: 'comic' },
  { href: '/anime/schedule', key: 'schedule' },
  { href: '/anime/browse', key: 'filter' },
  { href: '/anime/search-jikan', key: 'jikan' },
  { href: '/friends', key: 'friends' },
  { href: '/notifications', key: 'notifications' },
  { href: '/history', key: 'history' },
  { href: '/favorites', key: 'favorites' },
  { href: '/tools',               key: 'tools' },
  { href: '/nobar',               key: 'nobar' },
] as const;

// The five primary destinations are already present in BottomNav on mobile.
// Keep the hamburger menu focused on secondary pages to avoid duplicate buttons.
const MOBILE_MENU_LINKS = NAV_LINKS.filter(({ href }) => (
  !['/', '/anime', '/donghua', '/hentai', '/comic', '/notifications'].includes(href)
));

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
  const { language, setLanguage, theme, setTheme, t } = useLanguage();

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
  const brandText = useTypingEffect(['Shiinime Stream'], 130, 75, 2600);

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

  const handleLogout = async () => {
    if (!user) return;
    if (!window.confirm('Yakin ingin logout dari akun ini?')) return;

    try {
      const { auth } = await import('@/lib/firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.alert('Gagal logout. Coba lagi.');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-xl border-b border-border pt-safe relative">

      {/* ── Main bar ── */}
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-2 px-safe">

        {/* Logo — always visible, shrink-0 */}
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 font-bold text-[1.05rem] tracking-tight"
        >
          <Image 
            src="/logo.png" 
            alt="Shiiinime Logo" 
            width={32} 
            height={32}
            className="flex-shrink-0"
          />
          <div className="flex min-w-[8.5rem] items-center text-[0.9rem] sm:min-w-[10.5rem] sm:text-[1.05rem]" aria-label="Shiinime Stream">
            <span className="truncate text-primary">
              {brandText.slice(0, 'Shiinime'.length)}
            </span>
            {brandText.length > 'Shiinime'.length && (
              <span className="truncate text-cyan">
                {brandText.slice('Shiinime'.length)}
              </span>
            )}
          </div>
        </Link>

        {/* Desktop nav tabs */}
        <nav className="nav-scroll hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex" aria-label="Navigasi">
          {NAV_LINKS.map(({ href, key }) => {
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
                {t(key)}
              </Link>
            );
          })}
        </nav>

        {/* Desktop search */}
        <div ref={wrapRef} className="relative hidden w-36 shrink-0 md:block lg:w-48 xl:w-56">
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

        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
          aria-label={t('language')}
          className="hidden md:block h-8 rounded-app border border-border bg-surface px-2 text-xs font-semibold text-secondary"
        >
          <option value="id">ID</option>
          <option value="en">EN</option>
          <option value="ja">JP</option>
        </select>

        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-app border border-border bg-surface text-secondary hover:text-primary md:flex"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Mobile action icons */}
        <div className="md:hidden flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
            className="flex h-8 w-8 items-center justify-center rounded-app text-secondary hover:text-primary"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {/* Notifications icon */}
          <Link
            href="/notifications"
            aria-label={t('notifications')}
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
            aria-label={t('search')}
            className="w-8 h-8 flex items-center justify-center rounded-app text-secondary hover:text-primary"
          >
            <Search className="w-4.5 h-4.5" aria-hidden />
          </button>

          {/* Profile / login */}
          <Link
            href="/profile"
            aria-label={t('profile')}
            className="w-8 h-8 flex items-center justify-center rounded-app text-secondary hover:text-primary"
          >
            <User className="w-4.5 h-4.5" aria-hidden />
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => { setMobileOpen((v) => !v); setShowSearch(false); }}
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
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
                    {t('myProfile')}
                  </Link>
                  
                  {/* Debug: Always show admin link for testing */}
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-violet hover:text-violet/80 hover:bg-violet/10 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      {t('adminDashboard')}
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
                    {t('history')}
                  </Link>

                  <Link
                    href="/bookmarks"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    {t('bookmarks')}
                  </Link>

                  <div className="border-t border-border my-1" />

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      void handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('logout')}
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
              {t('login')}
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
          className="md:hidden absolute top-full left-0 right-0 max-h-[calc(100dvh-7rem)] overflow-y-auto border-t border-border bg-bg px-3 py-2 grid grid-cols-2 gap-1 animate-slide-up shadow-xl"
        >
          {MOBILE_MENU_LINKS.map(({ href, key }) => {
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
                {t(key)}
              </Link>
            );
          })}
          
          {/* Admin Dashboard Link - Mobile */}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-2.5 rounded-app text-sm font-medium text-violet hover:text-violet/80 hover:bg-violet/10 transition-colors flex items-center gap-1.5 col-span-2 border border-violet/30"
            >
              <Shield className="w-4 h-4" aria-hidden /> {t('adminDashboard')}
            </Link>
          )}

          <label className="col-span-2 flex items-center justify-between px-3 py-2.5 text-sm text-secondary">
            <span>{t('language')}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="rounded border border-border bg-surface px-2 py-1 text-xs font-semibold text-primary"
              aria-label={t('language')}
            >
              <option value="id">ID</option>
              <option value="en">EN</option>
              <option value="ja">JP</option>
            </select>
          </label>
          
          {user ? (
            <Link
              href="/profile"
              className="px-3 py-2.5 rounded-app text-sm font-medium text-secondary hover:text-primary hover:bg-surface transition-colors flex items-center gap-1.5 col-span-2"
            >
              <User className="w-4 h-4" aria-hidden /> {t('profile')}
            </Link>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-3 py-2.5 rounded-app text-sm font-medium bg-cyan text-bg hover:brightness-110 transition-all flex items-center justify-center gap-1.5 col-span-2"
            >
              <User className="w-4 h-4" aria-hidden /> {t('login')} Google
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
