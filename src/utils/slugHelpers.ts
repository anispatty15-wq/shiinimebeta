// src/utils/slugHelpers.ts
// ─────────────────────────────────────────────────────────────
// Utilities to detect whether a slug is an episode/chapter
// slug or a series/detail slug, and to build the right href.
// ─────────────────────────────────────────────────────────────

/**
 * Detect if a slug looks like an episode slug.
 * Episode slugs from Animekompi/Nekopoi typically contain
 * "episode-N" or "ep-N" somewhere in them.
 *
 * Examples:
 *   "boruto-episode-280-subtitle-indonesia" → true  (episode)
 *   "liar-game-episode-22-subtitle-indonesia" → true
 *   "aku-no-onna-kanbu-episode-7-subtitle-indonesia" → true
 *   "grand-blue-dreaming" → false (series)
 *   "kuroinu-kedakaki-seijo-wa-hakudaku-ni-somaru" → false
 */
export function isEpisodeSlug(slug: string): boolean {
  if (!slug) return false;
  return /[_-]episode[_-]\d|[_-]ep[_-]\d|\bep\d+\b/i.test(slug);
}

/**
 * Given a raw API item (any shape), extract the best slug
 * and determine the correct route href.
 *
 * @param item       Raw API object
 * @param type       'anime' | 'hentai' | 'comic'
 * @returns          { slug, href, isEpisode }
 */
export function resolveHref(
  item: Record<string, unknown>,
  type: 'anime' | 'hentai' | 'comic'
): { slug: string; href: string; isEpisode: boolean } {
  // Extract slug — try multiple field names the API might use
  const raw = String(
    item.slug          ??
    item.id            ??
    item.episodeSlug   ??
    item.seriesSlug    ??
    (typeof item.link === 'string'
      ? item.link.replace(/\/$/, '').split('/').pop()
      : undefined)     ??
    ''
  );

  if (!raw) return { slug: '', href: '#', isEpisode: false };

  // Comic slugs are always series slugs (chapters come from detail page)
  if (type === 'comic') {
    return { slug: raw, href: `/comic/${raw}`, isEpisode: false };
  }

  // For anime/hentai: detect if this is an episode or series slug
  const episode = isEpisodeSlug(raw);
  if (episode) {
    const base = type === 'hentai' ? '/hentai/episode' : '/anime/episode';
    return { slug: raw, href: `${base}/${raw}`, isEpisode: true };
  }

  // Series slug → detail page
  const base = type === 'hentai' ? '/hentai' : '/anime';
  return { slug: raw, href: `${base}/${raw}`, isEpisode: false };
}

/**
 * Normalise a raw API item to a MediaCardItem shape.
 * Works for anime, hentai, and comic.
 */
export function normaliseCardItem(
  raw: unknown,
  type: 'anime' | 'hentai' | 'comic'
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
} | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const { slug, href, isEpisode } = resolveHref(item, type);
  if (!slug) return null;

  // Build meta label
  let meta: string | undefined;
  if (item.episode != null) meta = `Ep. ${item.episode}`;
  else if (item.chapter != null) meta = `Ch. ${item.chapter}`;
  else if (item.year)    meta = String(item.year);
  else if (item.date)    meta = String(item.date);

  return {
    slug,
    title:     String(item.title ?? item.name ?? ''),
    poster:    String(item.poster ?? item.image ?? item.thumbnail ?? item.cover ?? ''),
    status:    String(item.status ?? ''),
    typeLabel: String(item.type ?? item.category ?? ''),
    score:     item.score ?? undefined,
    meta,
    href,
    isEpisode,
  };
}
