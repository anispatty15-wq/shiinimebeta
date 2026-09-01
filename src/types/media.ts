// src/types/media.ts
// ─────────────────────────────────────────────────────────────
// All TypeScript interfaces for the Shiiinime API responses
// ─────────────────────────────────────────────────────────────

// ── Generic wrappers ──────────────────────────────────────────

export interface ApiResult<T> {
  data:   T | null;
  error:  string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data:        T[];
  currentPage?: number;
  totalPages?:  number;
  hasNext?:     boolean;
  hasPrev?:     boolean;
}

export type ContentType = 'anime' | 'hentai' | 'comic';

// ── Shared primitives ─────────────────────────────────────────

export interface SlugItem {
  id?:    string | number;
  name:   string;
  slug:   string;
  count?: number;
}

export interface StreamServer {
  name:     string;
  url:      string;
  quality?: string;
  type?:    'iframe' | 'mp4' | 'm3u8';
}

export interface DownloadLink {
  host: string;
  url:  string;
}

export interface DownloadOption {
  quality: string;
  size?:   string;
  links:   DownloadLink[];
}

// ─────────────────────────────────────────────────────────────
// A.  ANIME (Animekompi)
// ─────────────────────────────────────────────────────────────

export interface AnimeCard {
  slug:      string;
  title:     string;
  poster?:   string;
  image?:    string;
  status?:   string;
  type?:     string;
  score?:    string | number;
  episode?:  string | number;
  genres?:   string[];
  year?:     string | number;
}

export interface AnimeDetail {
  slug:         string;
  title:        string;
  altTitle?:    string;
  poster?:      string;
  synopsis?:    string;
  status?:      string;
  type?:        string;
  score?:       string | number;
  episodes?:    string | number;
  duration?:    string;
  aired?:       string;
  studio?:      string | string[];
  genres?:      (string | SlugItem)[];
  season?:      string;
  year?:        string | number;
  episodeList?: AnimeEpisodeItem[];
  related?:     AnimeCard[];
}

export interface AnimeEpisodeItem {
  slug:    string;
  title:   string;
  number:  string | number;
  date?:   string;
}

export interface AnimeEpisode {
  slug:         string;
  title:        string;
  number?:      string | number;
  seriesSlug?:  string;
  poster?:      string;
  servers?:     StreamServer[];
  downloads?:   DownloadOption[];
  prevEpisode?: string | null;
  nextEpisode?: string | null;
}

export interface AnimeSuggestion {
  slug:    string;
  title:   string;
  poster?: string;
  type?:   string;
  year?:   string | number;
}

export interface ScheduleItem {
  slug:     string;
  title:    string;
  episode?: string | number;
  time?:    string;
  poster?:  string;
}

export interface ScheduleDay {
  day:   string;
  items: ScheduleItem[];
}

export interface AnimeFilterParams {
  genre?:   string[];
  season?:  string[];
  status?:  string[];
  type?:    string[];
  order?:   string;
  page?:    number;
}

export interface AnimeFilterOptions {
  genres?:   SlugItem[];
  seasons?:  SlugItem[];
  statuses?: SlugItem[];
  types?:    SlugItem[];
  orders?:   SlugItem[];
}

// ─────────────────────────────────────────────────────────────
// B.  HENTAI (Nekopoi)
// ─────────────────────────────────────────────────────────────

export interface HentaiCard {
  slug:      string;
  title:     string;
  poster?:   string;
  image?:    string;
  category?: string;
  genres?:   string[];
  year?:     string | number;
  episode?:  string | number;
}

export interface HentaiDetail {
  slug:         string;
  title:        string;
  altTitle?:    string;
  poster?:      string;
  synopsis?:    string;
  category?:    string;
  genres?:      (string | SlugItem)[];
  year?:        string | number;
  studio?:      string;
  duration?:    string;
  episodeList?: HentaiEpisodeItem[];
  related?:     HentaiCard[];
}

export interface HentaiEpisodeItem {
  slug:   string;
  title:  string;
  number: string | number;
  date?:  string;
}

export interface HentaiEpisode {
  slug:         string;
  title:        string;
  number?:      string | number;
  seriesSlug?:  string;
  poster?:      string;
  servers?:     StreamServer[];
  downloads?:   DownloadOption[];
  prevEpisode?: string | null;
  nextEpisode?: string | null;
}

// ─────────────────────────────────────────────────────────────
// C.  COMIC (Westmanga)
// ─────────────────────────────────────────────────────────────

export interface ComicCard {
  slug:     string;
  title:    string;
  poster?:  string;
  image?:   string;
  cover?:   string;
  type?:    string;
  status?:  string;
  score?:   string | number;
  genres?:  string[];
  chapter?: string | number;
  date?:    string;
}

export interface ComicDetail {
  slug:          string;
  title:         string;
  altTitle?:     string;
  poster?:       string;
  synopsis?:     string;
  status?:       string;
  type?:         string;
  score?:        string | number;
  genres?:       (string | SlugItem)[];
  author?:       string;
  artist?:       string;
  released?:     string | number;
  updated?:      string;
  chapterList?:  ComicChapterItem[];
  related?:      ComicCard[];
}

export interface ComicChapterItem {
  slug:   string;
  title:  string;
  number: string | number;
  date?:  string;
}

export interface ComicChapter {
  slug:          string;
  title?:        string;
  number?:       string | number;
  seriesSlug?:   string;
  seriesTitle?:  string;
  poster?:       string;
  pages:         string[];
  prevChapter?:  string | null;
  nextChapter?:  string | null;
}

// ─────────────────────────────────────────────────────────────
// D.  LOCAL STORAGE entities
// ─────────────────────────────────────────────────────────────

export interface BookmarkEntry {
  slug:    string;
  id:      string;
  title:   string;
  poster:  string;
  type:    ContentType;
  savedAt: string;
}

export interface WatchEntry {
  slug:            string;
  seriesSlug:      string;
  title:           string;
  episodeTitle:    string;
  poster:          string;
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
  chapterTitle: string;
  poster:       string;
  lastPage:     number;
  totalPages:   number;
  completed:    boolean;
  updatedAt:    string;
}
