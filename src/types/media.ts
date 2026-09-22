// src/types/media.ts
// ─────────────────────────────────────────────────────────────
// TypeScript interfaces that STRICTLY match the JSON response
// contract documented in the API spec. Do not add extra fields
// unless they appear in the actual response.
// ─────────────────────────────────────────────────────────────

// ── Content type discriminator ────────────────────────────────
export type ContentType = 'anime' | 'hentai' | 'comic' | 'donghua';

// ─────────────────────────────────────────────────────────────
// Generic API envelope
// All endpoints return: { status: true, data: <T> }
// ─────────────────────────────────────────────────────────────
export interface ApiEnvelope<T> {
  status: boolean;
  data:   T;
}

// ─────────────────────────────────────────────────────────────
// A.  ANIMEKOMPI
// ─────────────────────────────────────────────────────────────

/** One item in an episode list on the detail page */
export interface AnimeEpisodeListItem {
  title: string;
  slug:  string;
  date:  string;
}

/** GET /anime/animekompi/detail/:slug → envelope.data */
export interface AnimeDetail {
  title:        string;
  poster:       string;
  synopsis:     string;
  genres:       string[];
  episode_list: AnimeEpisodeListItem[];
}

/** One streaming server option */
export interface StreamServer {
  name: string;
  url:  string;
}

/** One download resolution group */
export interface DownloadResolution {
  resolution: string;
  links: {
    name: string;
    url:  string;
  }[];
}

/** GET /anime/animekompi/episode/:slug → envelope.data */
export interface AnimeEpisodeData {
  title:             string;
  stream_url:        string;
  stream_servers:    StreamServer[];
  download_links:    DownloadResolution[];
  prev_episode_slug: string;
  next_episode_slug: string;
}

// ─────────────────────────────────────────────────────────────
// B.  NEKOPOI
// ─────────────────────────────────────────────────────────────

/** One item in hentai episode list */
export interface HentaiEpisodeListItem {
  title: string;
  slug:  string;
}

/** GET /anime/nekopoi/detail/:slug → envelope.data */
export interface HentaiDetail {
  title:        string;
  poster:       string;
  synopsis:     string;
  episode_list: HentaiEpisodeListItem[];
}

/** GET /anime/nekopoi/episode/:slug → envelope.data */
export interface HentaiEpisodeData {
  title:          string;
  stream_url:     string;
  stream_servers: StreamServer[];
  download_links: DownloadResolution[];
}

// ─────────────────────────────────────────────────────────────
// C.  WESTMANGA
// ─────────────────────────────────────────────────────────────

/** One chapter item in the comic detail */
export interface ComicChapterItem {
  title:        string;
  slug:         string;
  release_date: string;
}

/** GET /comic/westmanga/detail/:slug → envelope.data */
export interface ComicDetail {
  title:    string;
  poster:   string;
  synopsis: string;
  chapters: ComicChapterItem[];
}

/** GET /comic/westmanga/chapter/:slug → envelope.data */
export interface ComicChapterData {
  title:             string;
  images:            string[];
  prev_chapter_slug: string;
  next_chapter_slug: string;
}

// ─────────────────────────────────────────────────────────────
// D.  Listing / Card shapes (home & search responses)
// ─────────────────────────────────────────────────────────────

/** Generic media card used across all listing endpoints */
export interface MediaCard {
  title:   string;
  slug:    string;
  poster:  string;
  /** Optional metadata shown under the title */
  type?:   string;
  status?: string;
  score?:  string | number;
  episode?: string | number;
  chapter?: string | number;
  date?:   string;
}

// ─────────────────────────────────────────────────────────────
// E.  Local-storage entities (bookmark / history)
// ─────────────────────────────────────────────────────────────

export interface BookmarkEntry {
  slug:    string;
  title:   string;
  poster:  string;
  type:    ContentType;
  savedAt: string;
}

export interface WatchEntry {
  slug:            string;
  seriesSlug:      string;
  title:           string;
  type:            'anime' | 'hentai';
  positionSeconds: number;
  durationSeconds: number;
  completed:       boolean;
  updatedAt:       string;
}

export interface ReadEntry {
  slug:         string;
  seriesSlug:   string;
  title:        string;
  lastPage:     number;
  totalPages:   number;
  completed:    boolean;
  updatedAt:    string;
}
