// src/utils/watchedSlug.ts
// ─────────────────────────────────────────────────────────────
// Track which episode/chapter slugs have been visited.
// Uses localStorage for guests, Firestore for logged-in users
// (sync handled by the Firestore layer separately).
// ─────────────────────────────────────────────────────────────

const KEY = 'shiiinime__watched_slugs';
const MAX  = 1000;

function isClient() { return typeof window !== 'undefined'; }

export function markWatched(slug: string): void {
  if (!isClient() || !slug) return;
  try {
    const set = new Set<string>(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
    set.add(slug);
    const arr = Array.from(set).slice(-MAX);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch { /* quota */ }
}

export function isWatched(slug: string): boolean {
  if (!isClient() || !slug) return false;
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return arr.includes(slug);
  } catch { return false; }
}

export function getWatchedSlugs(): Set<string> {
  if (!isClient()) return new Set();
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch { return new Set(); }
}

/** Merge a set of slugs (e.g. from Firestore cloud sync) into local */
export function mergeWatchedSlugs(slugs: string[]): void {
  if (!isClient()) return;
  try {
    const existing = getWatchedSlugs();
    slugs.forEach((s) => existing.add(s));
    const arr = Array.from(existing).slice(-MAX);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch { /* quota */ }
}
