// src/lib/apiClient.ts
// ─────────────────────────────────────────────────────────────
// Central Axios instance + every API function for
// Anime (Animekompi), Hentai (Nekopoi), Comic (Westmanga)
//
// Rules
// • Every export is wrapped in safeRequest — never throws
// • Returns ApiResult<T> = { data, error, status }
// • cleanParams strips undefined/null/'' before sending
// ─────────────────────────────────────────────────────────────

import axios, { type AxiosInstance } from 'axios';
import type {
  ApiResult,
  PaginatedResponse,
  SlugItem,
  AnimeCard,
  AnimeDetail,
  AnimeEpisode,
  AnimeSuggestion,
  AnimeFilterParams,
  AnimeFilterOptions,
  ScheduleDay,
  HentaiCard,
  HentaiDetail,
  HentaiEpisode,
  ComicCard,
  ComicDetail,
  ComicChapter,
} from '@/types/media';

// ── Singleton ─────────────────────────────────────────────────
export const BASE_URL = 'https://www.sankavollerei.web.id';

// ALWAYS route through the Next.js server-side proxy.
// This way the real upstream IP is our Node.js server,
// not the user's browser IP — preventing IP bans.
// The proxy route injects proper User-Agent, Referer, etc.
const PROXY_BASE = '/api/proxy';

const http: AxiosInstance = axios.create({
  baseURL: PROXY_BASE,
  timeout: 20_000,
  headers: {
    Accept:         'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  },
});

// ── Request timing interceptor ───────────────────────────────
http.interceptors.request.use(
  (cfg) => { (cfg as typeof cfg & { _t: number })._t = Date.now(); return cfg; },
  (e)   => Promise.reject(e)
);
http.interceptors.response.use(
  (res) => {
    const t = (res.config as typeof res.config & { _t?: number })._t;
    if (t && Date.now() - t > 3000) {
      console.warn(`[api] slow (${Date.now() - t}ms): ${res.config.url}`);
    }
    return res;
  },
  (e) => Promise.reject(e)
);

// ── Core helpers ──────────────────────────────────────────────

function cleanParams(
  p: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

function buildQS(
  arrays:  Record<string, string[]>,
  scalars: Record<string, string | number | undefined | null> = {}
): string {
  const qs = new URLSearchParams();
  for (const [k, vals] of Object.entries(arrays)) {
    if (Array.isArray(vals)) vals.forEach((v) => v != null && v !== '' && qs.append(`${k}[]`, v));
  }
  for (const [k, v] of Object.entries(scalars)) {
    if (v != null && v !== '') qs.append(k, String(v));
  }
  return qs.toString();
}

const enc = (s: string) => s; // slugs are already URL-safe; Axios handles path encoding

async function safeRequest<T>(
  fn:       (ax: AxiosInstance) => Promise<{ data: T; status: number }>,
  fallback: T
): Promise<ApiResult<T>> {
  try {
    const res = await fn(http);
    return { data: res?.data ?? fallback, error: null, status: res?.status ?? 200 };
  } catch (err: unknown) {
    let status  = 0;
    let message = 'Unknown error';
    if (axios.isAxiosError(err)) {
      status  = err.response?.status ?? 0;
      const d = err.response?.data as Record<string, unknown> | undefined;
      message = String(d?.message ?? d?.error ?? err.message ?? 'Request failed');
    } else if (err instanceof Error) {
      message = err.message;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[api] ${status}: ${message}`);
    }
    return { data: fallback, error: message, status };
  }
}

// ═════════════════════════════════════════════════════════════
// A.  ANIME API  (Animekompi)
// ═════════════════════════════════════════════════════════════

export const AnimeAPI = {

  getHome(page = 1) {
    return safeRequest<PaginatedResponse<AnimeCard> | AnimeCard[]>(
      (ax) => ax.get('/anime/animekompi/home', { params: cleanParams({ page }) }),
      []
    );
  },

  getTerbaru(page = 1) {
    return safeRequest<PaginatedResponse<AnimeCard> | AnimeCard[]>(
      (ax) => ax.get('/anime/animekompi/terbaru', { params: cleanParams({ page }) }),
      []
    );
  },

  getDonghua(page = 1) {
    return safeRequest<PaginatedResponse<AnimeCard> | AnimeCard[]>(
      (ax) => ax.get('/anime/animekompi/donghua', { params: cleanParams({ page }) }),
      []
    );
  },

  getLiveAction(page = 1) {
    return safeRequest<PaginatedResponse<AnimeCard> | AnimeCard[]>(
      (ax) => ax.get('/anime/animekompi/live-action', { params: cleanParams({ page }) }),
      []
    );
  },

  getTokusatsu(page = 1) {
    return safeRequest<PaginatedResponse<AnimeCard> | AnimeCard[]>(
      (ax) => ax.get('/anime/animekompi/tokusatsu', { params: cleanParams({ page }) }),
      []
    );
  },

  getMovies(page = 1) {
    return safeRequest<PaginatedResponse<AnimeCard> | AnimeCard[]>(
      (ax) => ax.get('/anime/animekompi/movie', { params: cleanParams({ page }) }),
      []
    );
  },

  getSchedule() {
    return safeRequest<ScheduleDay[]>(
      (ax) => ax.get('/anime/animekompi/schedule'),
      []
    );
  },

  getAZList() {
    return safeRequest<AnimeCard[]>(
      (ax) => ax.get('/anime/animekompi/list'),
      []
    );
  },

  search(q: string, page = 1) {
    if (!q?.trim()) return Promise.resolve<ApiResult<AnimeCard[]>>({ data: [], error: 'Empty query', status: 400 });
    return safeRequest<PaginatedResponse<AnimeCard> | AnimeCard[]>(
      (ax) => ax.get('/anime/animekompi/search', { params: cleanParams({ q: q.trim(), page }) }),
      []
    );
  },

  suggest(q: string) {
    if (!q?.trim()) return Promise.resolve<ApiResult<AnimeSuggestion[]>>({ data: [], error: null, status: 200 });
    return safeRequest<AnimeSuggestion[]>(
      (ax) => ax.get('/anime/animekompi/search/suggest', { params: cleanParams({ q: q.trim() }) }),
      []
    );
  },

  filter(params: AnimeFilterParams) {
    const qs = buildQS(
      { genre: params.genre ?? [], season: params.season ?? [], status: params.status ?? [], type: params.type ?? [] },
      { order: params.order, page: params.page ?? 1 }
    );
    return safeRequest<PaginatedResponse<AnimeCard> | AnimeCard[]>(
      (ax) => ax.get(`/anime/animekompi/filter?${qs}`),
      []
    );
  },

  getFilterList() {
    return safeRequest<AnimeFilterOptions>(
      (ax) => ax.get('/anime/animekompi/filterlist'),
      {}
    );
  },

  getGenres() {
    return safeRequest<SlugItem[]>((ax) => ax.get('/anime/animekompi/genres'), []);
  },

  getDetail(slug: string) {
    if (!slug) return Promise.resolve<ApiResult<AnimeDetail | null>>({ data: null, error: 'Missing slug', status: 400 });
    // Strip any accidental leading slash
    const cleanSlug = slug.replace(/^\/+/, '');
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AnimeAPI.getDetail] slug="${cleanSlug}"`);
    }
    return safeRequest<AnimeDetail | null>(
      (ax) => ax.get(`/anime/animekompi/detail/${cleanSlug}`),
      null
    );
  },

  getEpisode(slug: string) {
    if (!slug) return Promise.resolve<ApiResult<AnimeEpisode | null>>({ data: null, error: 'Missing slug', status: 400 });
    const cleanSlug = slug.replace(/^\/+/, '');
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AnimeAPI.getEpisode] slug="${cleanSlug}"`);
    }
    return safeRequest<AnimeEpisode | null>(
      (ax) => ax.get(`/anime/animekompi/episode/${cleanSlug}`),
      null
    );
  },
};

// ═════════════════════════════════════════════════════════════
// B.  HENTAI API  (Nekopoi)
// ═════════════════════════════════════════════════════════════

export const HentaiAPI = {

  getHome() {
    return safeRequest<HentaiCard[]>(
      (ax) => ax.get('/anime/nekopoi/home'),
      []
    );
  },

  search(q: string, page = 1) {
    if (!q?.trim()) return Promise.resolve<ApiResult<HentaiCard[]>>({ data: [], error: 'Empty query', status: 400 });
    return safeRequest<PaginatedResponse<HentaiCard> | HentaiCard[]>(
      (ax) => ax.get('/anime/nekopoi/search', { params: cleanParams({ q: q.trim(), page }) }),
      []
    );
  },

  getHentaiList(page = 1) {
    return safeRequest<PaginatedResponse<HentaiCard> | HentaiCard[]>(
      (ax) => ax.get('/anime/nekopoi/hentai-list', { params: cleanParams({ page }) }),
      []
    );
  },

  getGenres() {
    return safeRequest<SlugItem[]>((ax) => ax.get('/anime/nekopoi/genres'), []);
  },

  getByGenre(slug: string, page = 1) {
    if (!slug) return Promise.resolve<ApiResult<HentaiCard[]>>({ data: [], error: 'Missing slug', status: 400 });
    return safeRequest<PaginatedResponse<HentaiCard> | HentaiCard[]>(
      (ax) => ax.get(`/anime/nekopoi/genre/${enc(slug)}`, { params: cleanParams({ page }) }),
      []
    );
  },

  getLatestHentai(page = 1) {
    return safeRequest<PaginatedResponse<HentaiCard> | HentaiCard[]>(
      (ax) => ax.get('/anime/nekopoi/latest-hentai', { params: cleanParams({ page }) }),
      []
    );
  },

  getLatestJAV(page = 1) {
    return safeRequest<PaginatedResponse<HentaiCard> | HentaiCard[]>(
      (ax) => ax.get('/anime/nekopoi/latest-jav', { params: cleanParams({ page }) }),
      []
    );
  },

  getDetail(slug: string) {
    if (!slug) return Promise.resolve<ApiResult<HentaiDetail | null>>({ data: null, error: 'Missing slug', status: 400 });
    const cleanSlug = slug.replace(/^\/+/, '');
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[HentaiAPI.getDetail] slug="${cleanSlug}"`);
    }
    return safeRequest<HentaiDetail | null>(
      (ax) => ax.get(`/anime/nekopoi/detail/${cleanSlug}`),
      null
    );
  },

  getEpisode(slug: string) {
    if (!slug) return Promise.resolve<ApiResult<HentaiEpisode | null>>({ data: null, error: 'Missing slug', status: 400 });
    const cleanSlug = slug.replace(/^\/+/, '');
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[HentaiAPI.getEpisode] slug="${cleanSlug}"`);
    }
    return safeRequest<HentaiEpisode | null>(
      (ax) => ax.get(`/anime/nekopoi/episode/${cleanSlug}`),
      null
    );
  },
};

// ═════════════════════════════════════════════════════════════
// C.  COMIC API  (Westmanga)
// ═════════════════════════════════════════════════════════════

export const ComicAPI = {

  getHome() {
    return safeRequest<Record<string, ComicCard[]>>(
      (ax) => ax.get('/comic/westmanga/home'),
      {}
    );
  },

  getGenres() {
    return safeRequest<SlugItem[]>((ax) => ax.get('/comic/westmanga/genres'), []);
  },

  getList(params: Record<string, unknown> = {}) {
    return safeRequest<PaginatedResponse<ComicCard> | ComicCard[]>(
      (ax) => ax.get('/comic/westmanga/list', { params: cleanParams(params) }),
      []
    );
  },

  getLatest()    { return safeRequest<ComicCard[]>((ax) => ax.get('/comic/westmanga/latest'),    []); },
  getPopular()   { return safeRequest<ComicCard[]>((ax) => ax.get('/comic/westmanga/popular'),   []); },
  getOngoing()   { return safeRequest<ComicCard[]>((ax) => ax.get('/comic/westmanga/ongoing'),   []); },
  getCompleted() { return safeRequest<ComicCard[]>((ax) => ax.get('/comic/westmanga/completed'), []); },
  getManga()     { return safeRequest<ComicCard[]>((ax) => ax.get('/comic/westmanga/manga'),     []); },
  getManhua()    { return safeRequest<ComicCard[]>((ax) => ax.get('/comic/westmanga/manhua'),    []); },
  getManhwa()    { return safeRequest<ComicCard[]>((ax) => ax.get('/comic/westmanga/manhwa'),    []); },

  search(q: string) {
    if (!q?.trim()) return Promise.resolve<ApiResult<ComicCard[]>>({ data: [], error: 'Empty query', status: 400 });
    return safeRequest<ComicCard[]>(
      (ax) => ax.get('/comic/westmanga/search', { params: cleanParams({ q: q.trim() }) }),
      []
    );
  },

  getDetail(slug: string) {
    if (!slug) return Promise.resolve<ApiResult<ComicDetail | null>>({ data: null, error: 'Missing slug', status: 400 });
    const cleanSlug = slug.replace(/^\/+/, '');
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ComicAPI.getDetail] slug="${cleanSlug}"`);
    }
    return safeRequest<ComicDetail | null>(
      (ax) => ax.get(`/comic/westmanga/detail/${cleanSlug}`),
      null
    );
  },

  readChapter(slug: string) {
    if (!slug) return Promise.resolve<ApiResult<ComicChapter | string[] | null>>({ data: null, error: 'Missing slug', status: 400 });
    const cleanSlug = slug.replace(/^\/+/, '');
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ComicAPI.readChapter] slug="${cleanSlug}"`);
    }
    return safeRequest<ComicChapter | string[] | null>(
      (ax) => ax.get(`/comic/westmanga/chapter/${cleanSlug}`),
      null
    );
  },
};

// ── Helper: normalise any list response to a plain array ──────
export function toArray<T>(
  res: T[] | PaginatedResponse<T> | null | undefined
): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const pr = res as PaginatedResponse<T>;
  if (Array.isArray(pr.data)) return pr.data;
  return [];
}

// ── Helper: extract poster regardless of key name ─────────────
export function getPoster(
  item: Record<string, unknown> | null | undefined
): string {
  if (!item) return '';
  return String(item.poster ?? item.image ?? item.cover ?? '');
}
