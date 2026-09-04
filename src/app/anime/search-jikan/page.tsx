'use client';
// src/app/anime/search-jikan/page.tsx
// Search anime using Jikan API (MyAnimeList data)

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Calendar, Star, Filter, Shuffle, Grid } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import * as JikanAPI from '@/lib/jikan';

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  images: {
    jpg: {
      large_image_url: string;
      image_url: string;
    };
  };
  score?: number;
  episodes?: number;
  status: string;
  aired: {
    from: string;
    to?: string;
  };
  synopsis?: string;
  type: string;
  rating?: string;
}

export default function JikanSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<JikanAnime[]>([]);
  const [recommendations, setRecommendations] = useState<JikanAnime[]>([]);
  const [upcoming, setUpcoming] = useState<JikanAnime[]>([]);
  const [seasonal, setSeasonal] = useState<JikanAnime[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'upcoming' | 'recommendations' | 'seasonal' | 'genres'>('upcoming');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');

  // Fetch data on mount - sequentially to avoid rate limits
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      await fetchUpcoming();
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await fetchSeasonal();
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await fetchRecommendations();
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await fetchGenres();
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  const fetchUpcoming = async () => {
    const data = await JikanAPI.getUpcomingAnime(24);
    setUpcoming(data?.data || []);
  };

  const fetchRecommendations = async () => {
    const data = await JikanAPI.getTopAnime(24);
    setRecommendations(data?.data || []);
  };

  const fetchSeasonal = async () => {
    const data = await JikanAPI.getCurrentSeasonAnime(24);
    setSeasonal(data?.data || []);
  };

  const fetchGenres = async () => {
    const data = await JikanAPI.getAnimeGenres();
    setGenres(data?.data || []);
  };

  const fetchByGenre = async (genreId: string) => {
    setLoading(true);
    setActiveTab('genres');
    const data = await JikanAPI.getAnimeByGenre(genreId, 24);
    setResults(data?.data || []);
    setLoading(false);
  };

  const fetchRandom = async () => {
    setLoading(true);
    const data = await JikanAPI.getRandomAnime();
    if (data?.data) {
      window.open(`https://myanimelist.net/anime/${data.data.mal_id}`, '_blank');
    }
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setActiveTab('search');

    const data = await JikanAPI.searchAnime(query, { type: typeFilter });
    setResults(data?.data || []);
    setLoading(false);
  };

  const AnimeCard = ({ anime }: { anime: JikanAnime }) => (
    <Link
      href={`/anime/jikan/${anime.mal_id}`}
      className="bg-surface border border-border rounded-app overflow-hidden hover:border-cyan/40 transition-all group"
    >
      <div className="aspect-[2/3] relative bg-surface-2">
        <Image
          src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
          alt={anime.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {anime.score && (
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-black/70 text-[0.65rem] sm:text-xs font-semibold text-yellow-400">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400" />
            {anime.score.toFixed(1)}
          </div>
        )}
        {anime.type && (
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded bg-cyan/90 text-bg text-[0.6rem] sm:text-xs font-bold">
            {anime.type}
          </div>
        )}
      </div>
      <div className="p-1.5 sm:p-3">
        <h3 className="text-[0.65rem] sm:text-sm font-semibold text-primary line-clamp-2 mb-0.5 sm:mb-1 leading-tight">
          {anime.title_english || anime.title}
        </h3>
        <div className="flex items-center gap-1 sm:gap-2 text-[0.6rem] sm:text-xs text-muted">
          {anime.episodes && <span>{anime.episodes} eps</span>}
          {anime.status && <span className="hidden sm:inline">• {anime.status}</span>}
        </div>
        {anime.aired?.from && (
          <p className="text-[0.6rem] sm:text-xs text-muted mt-0.5 sm:mt-1">
            {new Date(anime.aired.from).getFullYear()}
          </p>
        )}
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2">
            🔍 Jikan Anime Search
          </h1>
          <p className="text-xs sm:text-sm text-secondary">
            Cari anime dari MyAnimeList database • Upcoming • Recommendations
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-app px-3 sm:px-4 py-2.5 sm:py-3">
              <Search className="w-4 h-4 text-muted flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari anime..."
                className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted outline-none w-full min-w-0"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-app bg-cyan text-bg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3 flex-wrap">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted flex-shrink-0" />
            <span className="text-xs text-muted">Type:</span>
            {['', 'tv', 'movie', 'ova', 'special', 'ona'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={clsx(
                  'px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                  typeFilter === type
                    ? 'bg-cyan text-bg'
                    : 'bg-surface-2 border border-border text-secondary hover:border-cyan/40'
                )}
              >
                {type || 'All'}
              </button>
            ))}
          </div>
        </form>

        {/* Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-border overflow-x-auto pb-0 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={clsx(
              'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
              activeTab === 'upcoming'
                ? 'border-cyan text-cyan'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Upcoming</span>
            <span className="xs:hidden">Up</span>
          </button>
          <button
            onClick={() => setActiveTab('seasonal')}
            className={clsx(
              'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
              activeTab === 'seasonal'
                ? 'border-cyan text-cyan'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">This Season</span>
            <span className="xs:hidden">Now</span>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={clsx(
              'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
              activeTab === 'recommendations'
                ? 'border-cyan text-cyan'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Top Anime</span>
            <span className="xs:hidden">Top</span>
          </button>
          <button
            onClick={() => setActiveTab('genres')}
            className={clsx(
              'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
              activeTab === 'genres'
                ? 'border-cyan text-cyan'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Genres
          </button>
          {results.length > 0 && activeTab === 'search' && (
            <button
              onClick={() => setActiveTab('search')}
              className={clsx(
                'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
                activeTab === 'search'
                  ? 'border-cyan text-cyan'
                  : 'border-transparent text-secondary hover:text-primary'
              )}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Results ({results.length})</span>
              <span className="xs:hidden">{results.length}</span>
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={fetchRandom}
            disabled={loading}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-violet hover:text-violet/80 transition-colors whitespace-nowrap"
          >
            <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Random</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'genres' && !loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {genres.map((genre) => (
              <button
                key={genre.mal_id}
                onClick={() => {
                  setSelectedGenre(genre.mal_id);
                  fetchByGenre(genre.mal_id);
                }}
                className={clsx(
                  'px-3 sm:px-4 py-2.5 sm:py-3 rounded-app text-xs sm:text-sm font-medium transition-all',
                  selectedGenre === genre.mal_id
                    ? 'bg-cyan text-bg'
                    : 'bg-surface border border-border text-secondary hover:border-cyan/40 hover:text-primary'
                )}
              >
                {genre.name}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm text-muted">Loading from MyAnimeList...</p>
              <p className="text-[0.65rem] sm:text-xs text-muted/60 mt-1">This may take a few seconds</p>
            </div>
          </div>
        ) : (
          <>
            {(
              (activeTab === 'upcoming' && upcoming.length === 0) ||
              (activeTab === 'seasonal' && seasonal.length === 0) ||
              (activeTab === 'recommendations' && recommendations.length === 0) ||
              ((activeTab === 'search' || activeTab === 'genres') && results.length === 0)
            ) ? (
              <div className="text-center py-12 sm:py-20">
                <Search className="w-10 h-10 sm:w-12 sm:h-12 text-muted mx-auto mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm text-secondary">No anime found</p>
                <p className="text-[0.65rem] sm:text-xs text-muted mt-1">Try refreshing the page or check back later</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                {activeTab === 'upcoming' && upcoming.map((anime) => (
                  <AnimeCard key={anime.mal_id} anime={anime} />
                ))}

                {activeTab === 'seasonal' && seasonal.map((anime) => (
                  <AnimeCard key={anime.mal_id} anime={anime} />
                ))}

                {activeTab === 'recommendations' && recommendations.map((anime) => (
                  <AnimeCard key={anime.mal_id} anime={anime} />
                ))}

                {(activeTab === 'search' || activeTab === 'genres') && results.map((anime) => (
                  <AnimeCard key={anime.mal_id} anime={anime} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'search' && results.length === 0 && !loading && query && (
          <div className="text-center py-12 sm:py-20">
            <Search className="w-10 h-10 sm:w-12 sm:h-12 text-muted mx-auto mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-secondary">Tidak ada hasil untuk "{query}"</p>
            <p className="text-[0.65rem] sm:text-xs text-muted mt-1">Coba keyword lain</p>
          </div>
        )}
      </div>
    </div>
  );
}
