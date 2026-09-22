// src/utils/storage.ts
// ─────────────────────────────────────────────────────────────
// Safe LocalStorage utilities — all JSON.parse wrapped in
// try/catch, all writes guarded against QuotaExceededError.
// isClient() prevents SSR / hydration crashes.
// ─────────────────────────────────────────────────────────────

import type {
  BookmarkEntry,
  ContentType,
  WatchEntry,
  ReadEntry,
} from '@/types/media';

// ── Keys ──────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  WATCH_HISTORY:    'shiiinime__watch',
  READ_HISTORY:     'shiiinime__read',
  BOOKMARKS_ANIME:  'shiiinime__bm_anime',
  BOOKMARKS_HENTAI: 'shiiinime__bm_hentai',
  BOOKMARKS_COMIC:  'shiiinime__bm_comic',
} as const;

const BM_KEY: Record<ContentType, string> = {
  anime:  STORAGE_KEYS.BOOKMARKS_ANIME,
  hentai: STORAGE_KEYS.BOOKMARKS_HENTAI,
  comic:  STORAGE_KEYS.BOOKMARKS_COMIC,
};

// ── Limits ────────────────────────────────────────────────────
const MAX_HISTORY   = 200;
const MAX_BOOKMARKS = 500;

// ── Primitives ────────────────────────────────────────────────
function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function lsGet<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown): boolean {
  if (!isClient()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function lsRemove(key: string): void {
  if (!isClient()) return;
  try { localStorage.removeItem(key); } catch { /* quota */ }
}

function clamp<T>(arr: T[], max: number): T[] {
  return arr.length > max ? arr.slice(0, max) : arr;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ═════════════════════════════════════════════════════════════
// WATCH HISTORY
// ═════════════════════════════════════════════════════════════

export const WatchHistory = {
  getAll(): WatchEntry[] {
    return lsGet<WatchEntry[]>(STORAGE_KEYS.WATCH_HISTORY, []);
  },

  get(slug: string): WatchEntry | null {
    if (!slug) return null;
    return this.getAll().find((e) => e?.slug === slug) ?? null;
  },

  save(entry: Omit<WatchEntry, 'updatedAt'>): boolean {
    if (!entry?.slug) return false;
    let all  = this.getAll();
    const idx = all.findIndex((e) => e?.slug === entry.slug);

    const updated: WatchEntry = {
      slug:            String(entry.slug),
      seriesSlug:      String(entry.seriesSlug      ?? ''),
      title:           String(entry.title           ?? ''),
      episodeTitle:    String(entry.episodeTitle     ?? ''),
      poster:          String(entry.poster          ?? ''),
      type:            entry.type === 'hentai' ? 'hentai' : 'anime',
      positionSeconds: Math.max(0, Math.floor(Number(entry.positionSeconds) || 0)),
      durationSeconds: Math.max(0, Math.floor(Number(entry.durationSeconds) || 0)),
      completed:       Boolean(entry.completed),
      updatedAt:       nowISO(),
    };

    if (idx !== -1) all[idx] = updated;
    else all.unshift(updated);

    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return lsSet(STORAGE_KEYS.WATCH_HISTORY, clamp(all, MAX_HISTORY));
  },

  markCompleted(slug: string): boolean {
    const e = this.get(slug);
    if (!e) return false;
    return this.save({ ...e, completed: true });
  },

  remove(slug: string): boolean {
    return lsSet(STORAGE_KEYS.WATCH_HISTORY, this.getAll().filter((e) => e?.slug !== slug));
  },

  clear(): void { lsRemove(STORAGE_KEYS.WATCH_HISTORY); },

  /** Update poster URL for an existing entry (backfill after detail is loaded) */
  updatePoster(slug: string, poster: string): boolean {
    if (!slug || !poster) return false;
    const e = this.get(slug);
    if (!e || e.poster) return false; // already has poster
    return this.save({ ...e, poster });
  },

  checkResume(slug: string): { shouldResume: boolean; positionSeconds: number; formatted: string } {
    const fallback = { shouldResume: false, positionSeconds: 0, formatted: '0:00' };
    if (!slug) return fallback;
    const e = this.get(slug);
    if (!e) return fallback;
    const pos  = e.positionSeconds ?? 0;
    const dur  = e.durationSeconds ?? 0;
    const done = e.completed || (dur > 0 && pos / dur >= 0.9);
    return { shouldResume: pos > 10 && !done, positionSeconds: pos, formatted: formatTime(pos) };
  },
};

// ═════════════════════════════════════════════════════════════
// READ HISTORY
// ═════════════════════════════════════════════════════════════

export const ReadHistory = {
  getAll(): ReadEntry[] {
    return lsGet<ReadEntry[]>(STORAGE_KEYS.READ_HISTORY, []);
  },

  get(slug: string): ReadEntry | null {
    if (!slug) return null;
    return this.getAll().find((e) => e?.slug === slug) ?? null;
  },

  save(entry: Omit<ReadEntry, 'updatedAt'>): boolean {
    if (!entry?.slug) return false;
    let all  = this.getAll();
    const idx = all.findIndex((e) => e?.slug === entry.slug);

    const updated: ReadEntry = {
      slug:         String(entry.slug),
      seriesSlug:   String(entry.seriesSlug  ?? ''),
      title:        String(entry.title        ?? ''),
      chapterTitle: String(entry.chapterTitle ?? ''),
      poster:       String(entry.poster       ?? ''),
      lastPage:     Math.max(1, Math.round(Number(entry.lastPage)   || 1)),
      totalPages:   Math.max(0, Math.round(Number(entry.totalPages) || 0)),
      completed:    Boolean(entry.completed),
      updatedAt:    nowISO(),
    };

    if (idx !== -1) all[idx] = updated;
    else all.unshift(updated);

    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return lsSet(STORAGE_KEYS.READ_HISTORY, clamp(all, MAX_HISTORY));
  },

  markCompleted(slug: string): boolean {
    const e = this.get(slug);
    if (!e) return false;
    return this.save({ ...e, completed: true });
  },

  remove(slug: string): boolean {
    return lsSet(STORAGE_KEYS.READ_HISTORY, this.getAll().filter((e) => e?.slug !== slug));
  },

  clear(): void { lsRemove(STORAGE_KEYS.READ_HISTORY); },

  checkResume(slug: string): { shouldResume: boolean; lastPage: number; totalPages: number } {
    const fallback = { shouldResume: false, lastPage: 1, totalPages: 0 };
    if (!slug) return fallback;
    const e = this.get(slug);
    if (!e) return fallback;
    const lp    = e.lastPage   ?? 1;
    const total = e.totalPages ?? 0;
    const done  = e.completed  || (total > 0 && lp >= total);
    return { shouldResume: lp > 1 && !done, lastPage: lp, totalPages: total };
  },
};

// ═════════════════════════════════════════════════════════════
// BOOKMARKS
// ═════════════════════════════════════════════════════════════

export const Bookmarks = {
  getAll(type: ContentType): BookmarkEntry[] {
    return lsGet<BookmarkEntry[]>(BM_KEY[type], []);
  },

  isBookmarked(slug: string, type?: ContentType): boolean {
    if (!slug) return false;
    if (type) return this.getAll(type).some((e) => e?.slug === slug);
    return (['anime', 'hentai', 'comic'] as ContentType[]).some((t) =>
      this.getAll(t).some((e) => e?.slug === slug)
    );
  },

  add(item: Omit<BookmarkEntry, 'savedAt'>): boolean {
    if (!item?.slug || !item?.type) return false;
    let list = this.getAll(item.type);
    if (list.some((e) => e?.slug === item.slug)) return true;
    const entry: BookmarkEntry = {
      slug:    String(item.slug),
      id:      String(item.id    ?? item.slug),
      title:   String(item.title ?? ''),
      poster:  String(item.poster ?? ''),
      type:    item.type,
      savedAt: nowISO(),
    };
    list.unshift(entry);
    return lsSet(BM_KEY[item.type], clamp(list, MAX_BOOKMARKS));
  },

  remove(slug: string, type: ContentType): boolean {
    return lsSet(BM_KEY[type], this.getAll(type).filter((e) => e?.slug !== slug));
  },

  toggle(item: Omit<BookmarkEntry, 'savedAt'>): boolean {
    if (!item?.slug || !item?.type) return false;
    if (this.isBookmarked(item.slug, item.type)) {
      this.remove(item.slug, item.type);
      return false;
    }
    this.add(item);
    return true;
  },

  getAllCombined(): BookmarkEntry[] {
    return [
      ...this.getAll('anime'),
      ...this.getAll('hentai'),
      ...this.getAll('comic'),
    ].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  },

  clear(type?: ContentType): void {
    if (type) lsRemove(BM_KEY[type]);
    else Object.values(BM_KEY).forEach(lsRemove);
  },
};

// ═════════════════════════════════════════════════════════════
// UTILITIES
// ═════════════════════════════════════════════════════════════

export function formatTime(secs: number): string {
  const s   = Math.max(0, Math.floor(Number(secs) || 0));
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm  = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss  = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(lsRemove);
}

export function storageUsage(): string {
  if (!isClient()) return 'N/A';
  try {
    let total = 0;
    Object.values(STORAGE_KEYS).forEach((k) => {
      const v = localStorage.getItem(k);
      if (v) total += v.length * 2;
    });
    if (total < 1024)        return `${total} B`;
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
    return `${(total / (1024 * 1024)).toFixed(2)} MB`;
  } catch { return 'N/A'; }
}
