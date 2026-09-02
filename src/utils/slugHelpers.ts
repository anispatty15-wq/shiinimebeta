// src/utils/slugHelpers.ts
// ─────────────────────────────────────────────────────────────
// Route resolver — maps API slugs to the correct Next.js routes.
//
// Route structure (new):
//   Detail :  /detail/[type]/[slug]     e.g. /detail/anime/one-piece
//   Stream :  /stream/[type]/[slug]     e.g. /stream/anime/one-piece-ep-1
//   Read   :  /read/[slug]?series=...   e.g. /read/chapter-1?series=slug
// ─────────────────────────────────────────────────────────────

import type { ContentType } from '@/types/media';

// ── Episode slug detection ─────────────────────────────────────
/**
 * Returns true when the slug looks like an episode/chapter slug.
 * Animekompi & Nekopoi append "-episode-N" or "-ep-N" to episode slugs.
 */
export function isEpisodeSlug(slug: string): boolean {
  if (!slug) return false;
  return /[_-]episode[_-]\d|[_-]ep[_-]\d|\bep\d+\b/i.test(slug);
}

// ── Primary resolver ───────────────────────────────────────────
/**
 * Given a raw API item and content type, build the correct href.
 *
 * - anime/hentai + episode slug  →  /stream/[type]/[slug]
 * - anime/hentai + series slug   →  /detail/[type]/[slug]
 * - comic                        →  /detail/comic/[slug]  (chapters open from detail)
 */
export function resolveHref(
  item: Record<string, unknown>,
  type: ContentType,
  forceDetail = false,   // ← true = always go to detail page first
): { slug: string; href: string; isEpisode: boolean; seriesSlug: string } {
  const raw = String(
    item.slug ??
    item.id   ??
    (typeof item.link === 'string'
      ? item.link.replace(/\/$/, '').split('/').pop()
      : undefined) ??
    ''
  );

  if (!raw) return { slug: '', href: '#', isEpisode: false, seriesSlug: '' };

  // Comic always goes to detail
  if (type === 'comic') {
    return { slug: raw, href: `/detail/comic/${raw}`, isEpisode: false, seriesSlug: raw };
  }

  const episode = isEpisodeSlug(raw);

  if (episode && !forceDetail) {
    // Direct stream — used inside drawer / episode list only
    return { slug: raw, href: `/stream/${type}/${raw}`, isEpisode: true, seriesSlug: '' };
  }

  if (episode && forceDetail) {
    // Strip episode suffix to get series slug → go to detail
    const seriesSlug = raw
      .replace(/(-episode-\d.*$)/i, '')
      .replace(/(-ep-\d+.*$)/i, '')
      .replace(/(-eps-\d+.*$)/i, '');
    return {
      slug:       raw,
      href:       `/detail/${type}/${seriesSlug}`,
      isEpisode:  true,
      seriesSlug,
    };
  }

  return { slug: raw, href: `/detail/${type}/${raw}`, isEpisode: false, seriesSlug: raw };
}

// ── Card normaliser ────────────────────────────────────────────
/**
 * Convert any raw API list item into a standardised card object
 * with a pre-resolved href ready to pass to MediaCard / SectionRow.
 */
export function normaliseCardItem(
  raw: unknown,
  type: ContentType,
  forceDetail = true,   // ← default: always go to detail first
): {
  slug:      string;
  title:     string;
  poster:    string;
  status:    string;
  typeLabel: string;
  score:     unknown;
  meta:      string | undefined;
  href:      string;
  isEpisode: boolean;
  seriesSlug: string;
} | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const { slug, href, isEpisode, seriesSlug } = resolveHref(item, type, forceDetail);
  if (!slug) return null;

  let meta: string | undefined;
  if (item.episode != null) meta = `Ep. ${item.episode}`;
  else if (item.chapter != null) meta = `Ch. ${item.chapter}`;
  else if (item.year)  meta = String(item.year);
  else if (item.date)  meta = String(item.date);

  return {
    slug,
    title:     String(item.title ?? item.name ?? ''),
    poster:    String(item.poster ?? item.image ?? item.thumbnail ?? item.cover ?? ''),
    // If it's an episode card and no status, mark as Ongoing
    status:    String(item.status ?? (isEpisode ? 'Ongoing' : '')),
    typeLabel: String(item.type ?? item.category ?? ''),
    score:     item.score ?? undefined,
    meta,
    href,
    isEpisode,
    seriesSlug,
  };
}
