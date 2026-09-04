// src/lib/jikan.ts
// Jikan API helper with rate limiting

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

let lastRequestTime = 0;

/**
 * Fetch data from Jikan API with rate limiting
 */
async function fetchJikan<T>(endpoint: string, retries = 3): Promise<T | null> {
  try {
    // Rate limiting - wait if needed
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    lastRequestTime = Date.now();

    const url = `${JIKAN_BASE_URL}${endpoint}`;
    console.log('[Jikan] Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        // Rate limited - wait and retry
        console.warn('[Jikan] Rate limited, retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchJikan<T>(endpoint, retries - 1);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Jikan] Error:', endpoint, error);
    if (retries > 0) {
      console.log('[Jikan] Retrying...', retries, 'attempts left');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchJikan<T>(endpoint, retries - 1);
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// ANIME ENDPOINTS
// ─────────────────────────────────────────────────────────────

export async function getAnimeById(id: string) {
  return fetchJikan<any>(`/anime/${id}/full`);
}

export async function searchAnime(query: string, filters?: { type?: string; genres?: string }) {
  let endpoint = `/anime?q=${encodeURIComponent(query)}&limit=24`;
  if (filters?.type) endpoint += `&type=${filters.type}`;
  if (filters?.genres) endpoint += `&genres=${filters.genres}`;
  return fetchJikan<any>(endpoint);
}

export async function getUpcomingAnime(limit = 24) {
  return fetchJikan<any>(`/seasons/upcoming?limit=${limit}`);
}

export async function getCurrentSeasonAnime(limit = 24) {
  return fetchJikan<any>(`/seasons/now?limit=${limit}`);
}

export async function getTopAnime(limit = 24) {
  return fetchJikan<any>(`/top/anime?limit=${limit}`);
}

export async function getAnimeByGenre(genreId: string, limit = 24) {
  return fetchJikan<any>(`/anime?genres=${genreId}&limit=${limit}`);
}

export async function getRandomAnime() {
  return fetchJikan<any>('/random/anime');
}

// ─────────────────────────────────────────────────────────────
// ANIME DETAIL ENDPOINTS
// ─────────────────────────────────────────────────────────────

export async function getAnimeCharacters(id: string) {
  return fetchJikan<any>(`/anime/${id}/characters`);
}

export async function getAnimeStaff(id: string) {
  return fetchJikan<any>(`/anime/${id}/staff`);
}

export async function getAnimeEpisodes(id: string, page = 1) {
  return fetchJikan<any>(`/anime/${id}/episodes?page=${page}`);
}

export async function getAnimeNews(id: string) {
  return fetchJikan<any>(`/anime/${id}/news`);
}

export async function getAnimeReviews(id: string) {
  return fetchJikan<any>(`/anime/${id}/reviews`);
}

export async function getAnimeRecommendations(id: string) {
  return fetchJikan<any>(`/anime/${id}/recommendations`);
}

export async function getAnimeStatistics(id: string) {
  return fetchJikan<any>(`/anime/${id}/statistics`);
}

// ─────────────────────────────────────────────────────────────
// GENRES
// ─────────────────────────────────────────────────────────────

export async function getAnimeGenres() {
  return fetchJikan<any>('/genres/anime');
}

// ─────────────────────────────────────────────────────────────
// SCHEDULES
// ─────────────────────────────────────────────────────────────

export async function getSchedule() {
  return fetchJikan<any>('/schedules');
}

// ─────────────────────────────────────────────────────────────
// WATCH
// ─────────────────────────────────────────────────────────────

export async function getRecentEpisodes() {
  return fetchJikan<any>('/watch/episodes');
}

export async function getPopularEpisodes() {
  return fetchJikan<any>('/watch/episodes/popular');
}

export async function getRecentPromos() {
  return fetchJikan<any>('/watch/promos');
}

export async function getPopularPromos() {
  return fetchJikan<any>('/watch/promos/popular');
}
