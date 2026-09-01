// src/lib/api.ts
// ─────────────────────────────────────────────────────────────
// Single Axios instance + every API function.
//
// Rules enforced here:
//  1. Every request goes through /api/proxy → server injects
//     correct User-Agent / Referer so our IP stays safe.
//  2. safeCall() wraps every request in try/catch and always
//     returns { data, error }.
//  3. Every parser uses defensive fallbacks so the UI never
//     receives undefined/null for critical list fields.
// ─────────────────────────────────────────────────────────────

import axios, { type AxiosInstance } from 'axios';
import type {
  ApiEnvelope,
  AnimeDetail,
  AnimeEpisodeData,
  HentaiDetail,
  HentaiEpisodeData,
  ComicDetail,
  ComicChapterData,
  MediaCard,
  StreamServer,
  DownloadResolution,
} from '@/types/media';

// ─────────────────────────────────────────────────────────────
// Axios instance
// In the browser all requests go to /api/proxy/<path>
// so the Node.js server adds the correct headers.
// ─────────────────────────────────────────────────────────────
const http: AxiosInstance = axios.create({
  baseURL: '/api/proxy',
  timeout: 20_000,
  headers: {
    Accept:         'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────
// Result type
// ─────────────────────────────────────────────────────────────
export interface ApiResult<T> {
  data:   T;
  error:  string | null;
}

// ─────────────────────────────────────────────────────────────
// Core helper
// ─────────────────────────────────────────────────────────────

/**
 * Execute an Axios request and always return { data, error }.
 * Never throws — callers never need to wrap in try/catch.
 */
async function safeCall<T>(
  fn:       (ax: AxiosInstance) => Promise<{ data: unknown; status: number }>,
  parser:   (raw: unknown) => T,
  fallback: T,
): Promise<ApiResult<T>> {
  try {
    const res     = await fn(http);
    const payload = res?.data;
    return { data: parser(payload), error: null };
  } catch (err: unknown) {
    let message = 'Terjadi kesalahan jaringan.';
    if (axios.isAxiosError(err)) {
      const d = err.response?.data as Record<string, unknown> | undefined;
      message = String(d?.message ?? d?.error ?? err.message ?? message);
    } else if (err instanceof Error) {
      message = err.message;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('[api]', message);
    }
    return { data: fallback, error: message };
  }
}

// ─────────────────────────────────────────────────────────────
// Generic parsers
// ─────────────────────────────────────────────────────────────

/** Unwrap the { status, data } envelope and return data */
function unwrap<T>(raw: unknown): T {
  const env = raw as ApiEnvelope<T> | null;
  if (env && typeof env === 'object' && 'data' in env) return env.data;
  return raw as T;
}

/** Safely coerce a value to string */
function str(v: unknown, fallback = ''): string {
  if (v == null) return fallback;
  return String(v);
}

/** Safely coerce a value to a string[] */
function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x)).filter(Boolean);
}

/** Safely coerce any value to a typed array, with per-item mapping */
function mapArr<T>(v: unknown, fn: (item: unknown) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  return v.map(fn).filter((x): x is T => x !== null);
}

// ─────────────────────────────────────────────────────────────
// Domain parsers  — strict against the JSON contract
// ─────────────────────────────────────────────────────────────

function parseMediaCard(raw: unknown): MediaCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const slug = str(o.slug ?? o.id ?? '');
  if (!slug) return null;
  return {
    slug,
    title:   str(o.title ?? o.name, '(Tanpa Judul)'),
    poster:  str(o.poster ?? o.image ?? o.cover ?? o.thumbnail),
    type:    str(o.type),
    status:  str(o.status),
    score:   o.score != null ? String(o.score) : undefined,
    episode: o.episode != null ? String(o.episode) : undefined,
    chapter: o.chapter != null ? String(o.chapter) : undefined,
    date:    str(o.date),
  };
}

function parseAnimeDetail(raw: unknown): AnimeDetail {
  const o = (unwrap(raw) ?? {}) as Record<string, unknown>;
  return {
    title:    str(o.title, '(Tanpa Judul)'),
    poster:   str(o.poster ?? o.image ?? o.cover),
    synopsis: str(o.synopsis ?? o.description ?? o.summary),
    genres:   strArr(o.genres ?? o.genre),
    episode_list: mapArr(o.episode_list ?? o.episodes ?? o.episodeList, (item) => {
      if (!item || typeof item !== 'object') return null;
      const e = item as Record<string, unknown>;
      const slug = str(e.slug ?? e.id ?? '');
      if (!slug) return null;
      return { title: str(e.title ?? e.name, `Ep.${slug}`), slug, date: str(e.date ?? e.release_date) };
    }),
  };
}

function parseAnimeEpisodeData(raw: unknown): AnimeEpisodeData {
  const o = (unwrap(raw) ?? {}) as Record<string, unknown>;
  const stream_servers: StreamServer[] = mapArr(
    o.stream_servers ?? o.servers ?? o.streamingLinks ?? o.links,
    (item) => {
      if (!item || typeof item !== 'object') return null;
      const s = item as Record<string, unknown>;
      const url = str(s.url ?? s.link ?? s.src ?? s.iframe ?? s.embed);
      if (!url) return null;
      return { name: str(s.name ?? s.server ?? 'Server', 'Server'), url };
    }
  );

  const download_links: DownloadResolution[] = mapArr(
    o.download_links ?? o.downloads ?? o.download,
    (item) => {
      if (!item || typeof item !== 'object') return null;
      const d = item as Record<string, unknown>;
      const links = mapArr(d.links ?? d.urls ?? d.mirrors, (l) => {
        if (!l || typeof l !== 'object') return null;
        const li = l as Record<string, unknown>;
        const url = str(li.url ?? li.link ?? li.href);
        if (!url) return null;
        return { name: str(li.name ?? li.host ?? li.label, 'Download'), url };
      });
      return {
        resolution: str(d.resolution ?? d.quality ?? d.label, 'Default'),
        links,
      };
    }
  );

  // direct stream_url fallback
  const stream_url =
    str(o.stream_url ?? o.streamUrl ?? o.url) ||
    stream_servers[0]?.url ||
    '';

  return {
    title:             str(o.title ?? o.episodeTitle, '(Tanpa Judul)'),
    stream_url,
    stream_servers,
    download_links,
    prev_episode_slug: str(o.prev_episode_slug ?? o.prevSlug ?? o.prevEpisode),
    next_episode_slug: str(o.next_episode_slug ?? o.nextSlug ?? o.nextEpisode),
  };
}

function parseHentaiDetail(raw: unknown): HentaiDetail {
  const o = (unwrap(raw) ?? {}) as Record<string, unknown>;
  return {
    title:    str(o.title, '(Tanpa Judul)'),
    poster:   str(o.poster ?? o.image ?? o.cover),
    synopsis: str(o.synopsis ?? o.description ?? o.summary),
    episode_list: mapArr(o.episode_list ?? o.episodes ?? o.episodeList, (item) => {
      if (!item || typeof item !== 'object') return null;
      const e = item as Record<string, unknown>;
      const slug = str(e.slug ?? e.id ?? '');
      if (!slug) return null;
      return { title: str(e.title ?? e.name, `Ep.${slug}`), slug };
    }),
  };
}

function parseHentaiEpisodeData(raw: unknown): HentaiEpisodeData {
  const o = (unwrap(raw) ?? {}) as Record<string, unknown>;
  const stream_servers: StreamServer[] = mapArr(
    o.stream_servers ?? o.servers ?? o.streamingLinks ?? o.links,
    (item) => {
      if (!item || typeof item !== 'object') return null;
      const s = item as Record<string, unknown>;
      const url = str(s.url ?? s.link ?? s.src ?? s.iframe ?? s.embed);
      if (!url) return null;
      return { name: str(s.name ?? s.server, 'Server'), url };
    }
  );
  const stream_url =
    str(o.stream_url ?? o.streamUrl ?? o.url) ||
    stream_servers[0]?.url ||
    '';
  const download_links: DownloadResolution[] = mapArr(
    o.download_links ?? o.downloads ?? [],
    (item) => {
      if (!item || typeof item !== 'object') return null;
      const d = item as Record<string, unknown>;
      const links = mapArr(d.links ?? d.urls ?? [], (l) => {
        if (!l || typeof l !== 'object') return null;
        const li = l as Record<string, unknown>;
        const url = str(li.url ?? li.link ?? li.href);
        if (!url) return null;
        return { name: str(li.name ?? li.host, 'Download'), url };
      });
      return { resolution: str(d.resolution ?? d.quality, 'Default'), links };
    }
  );
  return {
    title: str(o.title, '(Tanpa Judul)'),
    stream_url,
    stream_servers,
    download_links,
  };
}

function parseComicDetail(raw: unknown): ComicDetail {
  const o = (unwrap(raw) ?? {}) as Record<string, unknown>;
  return {
    title:    str(o.title, '(Tanpa Judul)'),
    poster:   str(o.poster ?? o.image ?? o.cover),
    synopsis: str(o.synopsis ?? o.description ?? o.summary),
    chapters: mapArr(
      o.chapters ?? o.chapter_list ?? o.chapterList ?? o.episode_list,
      (item) => {
        if (!item || typeof item !== 'object') return null;
        const c = item as Record<string, unknown>;
        const slug = str(c.slug ?? c.id ?? '');
        if (!slug) return null;
        return {
          title:        str(c.title ?? c.name, `Chapter ${slug}`),
          slug,
          release_date: str(c.release_date ?? c.date ?? c.updatedAt),
        };
      }
    ),
  };
}

function parseComicChapterData(raw: unknown): ComicChapterData {
  const o = (unwrap(raw) ?? {}) as Record<string, unknown>;
  const images: string[] = mapArr(
    o.images ?? o.pages ?? o.imageList ?? o.imgs,
    (item) => {
      const url = str(
        typeof item === 'string'
          ? item
          : (item as Record<string, unknown>)?.url ??
            (item as Record<string, unknown>)?.src ??
            (item as Record<string, unknown>)?.image
      );
      return url || null;
    }
  );
  return {
    title:             str(o.title, '(Tanpa Judul)'),
    images,
    prev_chapter_slug: str(o.prev_chapter_slug ?? o.prevSlug ?? o.prev),
    next_chapter_slug: str(o.next_chapter_slug ?? o.nextSlug ?? o.next),
  };
}

function parseMediaList(raw: unknown): MediaCard[] {
  const o = (unwrap(raw) ?? raw) as unknown;
  const arr =
    Array.isArray(o) ? o :
    Array.isArray((o as Record<string, unknown>)?.data) ? (o as Record<string, unknown>).data as unknown[] :
    [];
  return mapArr(arr, parseMediaCard);
}

// ─────────────────────────────────────────────────────────────
// Public API functions
// ─────────────────────────────────────────────────────────────

const FALLBACK_LIST: MediaCard[]       = [];
const FALLBACK_ANIME_DETAIL: AnimeDetail  = { title: '', poster: '', synopsis: '', genres: [], episode_list: [] };
const FALLBACK_ANIME_EP: AnimeEpisodeData = { title: '', stream_url: '', stream_servers: [], download_links: [], prev_episode_slug: '', next_episode_slug: '' };
const FALLBACK_HENTAI_DETAIL: HentaiDetail = { title: '', poster: '', synopsis: '', episode_list: [] };
const FALLBACK_HENTAI_EP: HentaiEpisodeData = { title: '', stream_url: '', stream_servers: [], download_links: [] };
const FALLBACK_COMIC_DETAIL: ComicDetail   = { title: '', poster: '', synopsis: '', chapters: [] };
const FALLBACK_CHAPTER: ComicChapterData   = { title: '', images: [], prev_chapter_slug: '', next_chapter_slug: '' };

// ── ANIME ─────────────────────────────────────────────────────
export const AnimeAPI = {
  getHome:    (page = 1) => safeCall((ax) => ax.get('/anime/animekompi/home',    { params: { page } }), parseMediaList, FALLBACK_LIST),
  getTerbaru: (page = 1) => safeCall((ax) => ax.get('/anime/animekompi/terbaru', { params: { page } }), parseMediaList, FALLBACK_LIST),
  getDonghua: (page = 1) => safeCall((ax) => ax.get('/anime/animekompi/donghua', { params: { page } }), parseMediaList, FALLBACK_LIST),
  getMovies:  (page = 1) => safeCall((ax) => ax.get('/anime/animekompi/movie',   { params: { page } }), parseMediaList, FALLBACK_LIST),
  getLiveAction: (page = 1) => safeCall((ax) => ax.get('/anime/animekompi/live-action', { params: { page } }), parseMediaList, FALLBACK_LIST),
  getTokusatsu: (page = 1)  => safeCall((ax) => ax.get('/anime/animekompi/tokusatsu',  { params: { page } }), parseMediaList, FALLBACK_LIST),
  getSchedule: () => safeCall((ax) => ax.get('/anime/animekompi/schedule'), (r) => unwrap(r) ?? {}, {}),
  getGenres:   () => safeCall((ax) => ax.get('/anime/animekompi/genres'),   parseMediaList, FALLBACK_LIST),
  getFilterList: () => safeCall((ax) => ax.get('/anime/animekompi/filterlist'), (r) => unwrap(r) ?? {}, {}),
  filter: (qs: string) => safeCall((ax) => ax.get(`/anime/animekompi/filter?${qs}`), parseMediaList, FALLBACK_LIST),
  getByGenre:  (slug: string, page = 1) => safeCall((ax) => ax.get(`/anime/animekompi/genre/${slug}`,  { params: { page } }), parseMediaList, FALLBACK_LIST),
  getBySeason: (slug: string, page = 1) => safeCall((ax) => ax.get(`/anime/animekompi/season/${slug}`, { params: { page } }), parseMediaList, FALLBACK_LIST),
  getByStudio: (slug: string, page = 1) => safeCall((ax) => ax.get(`/anime/animekompi/studio/${slug}`, { params: { page } }), parseMediaList, FALLBACK_LIST),
  search: (q: string, page = 1) => safeCall((ax) => ax.get('/anime/animekompi/search', { params: { q: q.trim(), page } }), parseMediaList, FALLBACK_LIST),
  suggest: (q: string)           => safeCall((ax) => ax.get('/anime/animekompi/search/suggest', { params: { q: q.trim() } }), parseMediaList, FALLBACK_LIST),
  getDetail:  (slug: string)     => safeCall((ax) => ax.get(`/anime/animekompi/detail/${slug}`),  parseAnimeDetail,      FALLBACK_ANIME_DETAIL),
  getEpisode: (slug: string)     => safeCall((ax) => ax.get(`/anime/animekompi/episode/${slug}`), parseAnimeEpisodeData, FALLBACK_ANIME_EP),
};

// ── HENTAI ────────────────────────────────────────────────────
export const HentaiAPI = {
  getHome:        ()           => safeCall((ax) => ax.get('/anime/nekopoi/home'),                                  parseMediaList, FALLBACK_LIST),
  getLatestHentai:(page = 1)   => safeCall((ax) => ax.get('/anime/nekopoi/latest-hentai',  { params: { page } }), parseMediaList, FALLBACK_LIST),
  getLatestJAV:   (page = 1)   => safeCall((ax) => ax.get('/anime/nekopoi/latest-jav',     { params: { page } }), parseMediaList, FALLBACK_LIST),
  getHentaiList:  (page = 1)   => safeCall((ax) => ax.get('/anime/nekopoi/hentai-list',    { params: { page } }), parseMediaList, FALLBACK_LIST),
  getGenres:      ()           => safeCall((ax) => ax.get('/anime/nekopoi/genres'),                               parseMediaList, FALLBACK_LIST),
  getByGenre:     (slug: string, page = 1) => safeCall((ax) => ax.get(`/anime/nekopoi/genre/${slug}`, { params: { page } }), parseMediaList, FALLBACK_LIST),
  getByCategory:  (slug: string, page = 1) => safeCall((ax) => ax.get(`/anime/nekopoi/category/${slug}`, { params: { page } }), parseMediaList, FALLBACK_LIST),
  search:         (q: string, page = 1)    => safeCall((ax) => ax.get('/anime/nekopoi/search', { params: { q: q.trim(), page } }), parseMediaList, FALLBACK_LIST),
  getDetail:      (slug: string)  => safeCall((ax) => ax.get(`/anime/nekopoi/detail/${slug}`),  parseHentaiDetail,      FALLBACK_HENTAI_DETAIL),
  getEpisode:     (slug: string)  => safeCall((ax) => ax.get(`/anime/nekopoi/episode/${slug}`), parseHentaiEpisodeData, FALLBACK_HENTAI_EP),
};

// ── COMIC ─────────────────────────────────────────────────────
export const ComicAPI = {
  getHome:      ()             => safeCall((ax) => ax.get('/comic/westmanga/home'),       parseMediaList, FALLBACK_LIST),
  getLatest:    ()             => safeCall((ax) => ax.get('/comic/westmanga/latest'),     parseMediaList, FALLBACK_LIST),
  getPopular:   ()             => safeCall((ax) => ax.get('/comic/westmanga/popular'),    parseMediaList, FALLBACK_LIST),
  getOngoing:   ()             => safeCall((ax) => ax.get('/comic/westmanga/ongoing'),    parseMediaList, FALLBACK_LIST),
  getCompleted: ()             => safeCall((ax) => ax.get('/comic/westmanga/completed'),  parseMediaList, FALLBACK_LIST),
  getManga:     ()             => safeCall((ax) => ax.get('/comic/westmanga/manga'),      parseMediaList, FALLBACK_LIST),
  getManhua:    ()             => safeCall((ax) => ax.get('/comic/westmanga/manhua'),     parseMediaList, FALLBACK_LIST),
  getManhwa:    ()             => safeCall((ax) => ax.get('/comic/westmanga/manhwa'),     parseMediaList, FALLBACK_LIST),
  getGenres:    ()             => safeCall((ax) => ax.get('/comic/westmanga/genres'),     parseMediaList, FALLBACK_LIST),
  getByGenre:   (id: string)   => safeCall((ax) => ax.get(`/comic/westmanga/genre/${id}`), parseMediaList, FALLBACK_LIST),
  search:       (q: string)    => safeCall((ax) => ax.get('/comic/westmanga/search', { params: { q: q.trim() } }), parseMediaList, FALLBACK_LIST),
  getDetail:    (slug: string) => safeCall((ax) => ax.get(`/comic/westmanga/detail/${slug}`),  parseComicDetail,      FALLBACK_COMIC_DETAIL),
  readChapter:  (slug: string) => safeCall((ax) => ax.get(`/comic/westmanga/chapter/${slug}`), parseComicChapterData, FALLBACK_CHAPTER),
};
