'use client';
// src/context/BookmarkContext.tsx
// ─────────────────────────────────────────────────────────────
// Provides bookmark state across the whole app.
// Hydration-safe: all localStorage access is deferred to
// useEffect so SSR never touches window.localStorage.
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Bookmarks } from '@/utils/storage';
import type { BookmarkEntry, ContentType } from '@/types/media';

// ── Context shape ─────────────────────────────────────────────
interface BookmarkContextValue {
  /** All bookmarks for a given type */
  getBookmarks:   (type: ContentType) => BookmarkEntry[];
  /** Combined list from all types, sorted by savedAt */
  allBookmarks:   BookmarkEntry[];
  /** true if slug is bookmarked (optionally under a specific type) */
  isBookmarked:   (slug: string, type?: ContentType) => boolean;
  /** Toggle bookmark state — returns new bookmarked boolean */
  toggle:         (item: Omit<BookmarkEntry, 'savedAt'>) => boolean;
  /** Imperatively remove */
  remove:         (slug: string, type: ContentType) => void;
  /** Clear all or one type */
  clear:          (type?: ContentType) => void;
  /** True after first client-side hydration */
  hydrated:       boolean;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────
export function BookmarkProvider({ children }: { children: ReactNode }) {
  // We store a single revision counter — incrementing it causes
  // any subscriber to re-derive from localStorage without us
  // needing to mirror the full state in React.
  const [rev,      setRev]      = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate on client mount
  useEffect(() => {
    setHydrated(true);
  }, []);

  const bump = useCallback(() => setRev((r) => r + 1), []);

  const getBookmarks = useCallback(
    (type: ContentType): BookmarkEntry[] => {
      if (!hydrated) return [];
      return Bookmarks.getAll(type);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated, rev]
  );

  const allBookmarks: BookmarkEntry[] = hydrated
    ? Bookmarks.getAllCombined()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    : [];
  // Re-derive when rev changes
  // (allBookmarks is derived inline — we suppress the lint for this pattern)

  const isBookmarked = useCallback(
    (slug: string, type?: ContentType): boolean => {
      if (!hydrated || !slug) return false;
      return Bookmarks.isBookmarked(slug, type);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated, rev]
  );

  const toggle = useCallback(
    (item: Omit<BookmarkEntry, 'savedAt'>): boolean => {
      if (!item?.slug || !item?.type) return false;
      const next = Bookmarks.toggle(item);
      bump();
      return next;
    },
    [bump]
  );

  const remove = useCallback(
    (slug: string, type: ContentType) => {
      Bookmarks.remove(slug, type);
      bump();
    },
    [bump]
  );

  const clear = useCallback(
    (type?: ContentType) => {
      Bookmarks.clear(type);
      bump();
    },
    [bump]
  );

  const value: BookmarkContextValue = {
    getBookmarks,
    allBookmarks: hydrated ? Bookmarks.getAllCombined() : [],
    isBookmarked,
    toggle,
    remove,
    clear,
    hydrated,
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────
export function useBookmarks(): BookmarkContextValue {
  const ctx = useContext(BookmarkContext);
  if (!ctx) {
    throw new Error('useBookmarks must be used inside <BookmarkProvider>');
  }
  return ctx;
}

// ── Lightweight single-item hook ──────────────────────────────
export function useBookmarkToggle(
  item: Omit<BookmarkEntry, 'savedAt'> | null
) {
  const { isBookmarked, toggle, hydrated } = useBookmarks();
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!hydrated || !item?.slug || !item?.type) {
      setBookmarked(false);
      return;
    }
    setBookmarked(isBookmarked(item.slug, item.type));
  }, [hydrated, item?.slug, item?.type, isBookmarked]);

  const handleToggle = useCallback(() => {
    if (!item) return false;
    const next = toggle(item);
    setBookmarked(next);
    return next;
  }, [item, toggle]);

  return { bookmarked, toggle: handleToggle };
}
