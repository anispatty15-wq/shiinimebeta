'use client';
// src/app/anime/search-jikan/page.tsx
// Search anime using Jikan API (MyAnimeList data)

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Calendar, Star, Filter, Shuffle, Grid } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';

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

  // Fetch data on mount
  useEffect(() => {
    fetchUpcoming();
    fetchRecommendations();
    fetchSeasonal();
    fetchGenres();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const res = await fetch('https://api.jikan.moe/v4/seasons/upcoming?limit=24');
      const data = await res.json();
      setUpcoming(data.data || []);
    } catch (err) {
      console.error('Error fetching upcoming:', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('https://api.jikan.moe/v4/top/anime?limit=24');
      const data = await res.json();
      setRecommendations(data.data || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  const fetchSeasonal = async () => {
    try {
      const res = await fetch('https://api.jikan.moe/v4/seasons/now?limit=24');
      const data = await res.json();
      setSeasonal(data.data || []);
    } catch (err) {
      console.error('Error fetching seasonal:', err);
    }
  };

  const fetchGenres = async () => {
    try {
      const res = await fetch('https://api.jikan.moe/v4/genres/anime');
      const data = await res.json();
      setGenres(data.data || []);
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };

  const fetchByGenre = async (genreId: string) => {
    setLoading(true);
    setActiveTab('genres');
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?genres=${genreId}&limit=24`);
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      console.error('Error fetching by genre:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRandom = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.jikan.moe/v4/random/anime');
      const data = await res.json();
      if (data.data) {
        // Redirect to detail page
        window.open(`https://myanimelist.net/anime/${data.data.mal_id}`, '_blank');
      }
    } catch (err) {
      console.error('Error fetching random:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setActiveTab('search');

    try {
      let url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=24`;
      if (typeFilter) {
        url += `&type=${typeFilter}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      console.error('Error searching:', err);
      alert('Error searching anime. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 text-xs font-semibold text-yellow-400">
            <Star className="w-3 h-3 fill-yellow-400" />
            {anime.score.toFixed(1)}
          </div>
        )}
        {anime.type && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-cyan/90 text-bg text-xs font-bold">
            {anime.type}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-primary line-clamp-2 mb-1">
          {anime.title_english || anime.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted">
          {anime.episodes && <span>{anime.episodes} eps</span>}
          {anime.status && <span>• {anime.status}</span>}
        </div>
        {anime.aired?.from && (
          <p className="text-xs text-muted mt-1">
            {new Date(anime.aired.from).getFullYear()}
          </p>
        )}
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">
            🔍 Jikan Anime Search
          </h1>
          <p className="text-sm text-secondary">
            Cari anime dari MyAnimeList database • Upcoming • Recommendations
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-app px-4 py-3">
              <Search className="w-4 h-4 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari anime... (contoh: Naruto, One Piece)"
                className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-app bg-cyan text-bg font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted" />
            <span className="text-xs text-muted">Type:</span>
            {['', 'tv', 'movie', 'ova', 'special', 'ona'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={clsx(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all',
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
        <div className="flex items-center gap-2 mb-6 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
              activeTab === 'upcoming'
                ? 'border-cyan text-cyan'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            <Calendar className="w-4 h-4" />
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('seasonal')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
              activeTab === 'seasonal'
                ? 'border-cyan text-cyan'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            <Calendar className="w-4 h-4" />
            This Season
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
              activeTab === 'recommendations'
                ? 'border-cyan text-cyan'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Top Anime
          </button>
          <button
            onClick={() => setActiveTab('genres')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
              activeTab === 'genres'
                ? 'border-cyan text-cyan'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            <Grid className="w-4 h-4" />
            Genres
          </button>
          {results.length > 0 && activeTab === 'search' && (
            <button
              onClick={() => setActiveTab('search')}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
                activeTab === 'search'
                  ? 'border-cyan text-cyan'
                  : 'border-transparent text-secondary hover:text-primary'
              )}
            >
              <Search className="w-4 h-4" />
              Results ({results.length})
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={fetchRandom}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet hover:text-violet/80 transition-colors whitespace-nowrap"
          >
            <Shuffle className="w-4 h-4" />
            Random
          </button>
        </div>

        {/* Content */}
        {activeTab === 'genres' && !loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            {genres.map((genre) => (
              <button
                key={genre.mal_id}
                onClick={() => {
                  setSelectedGenre(genre.mal_id);
                  fetchByGenre(genre.mal_id);
                }}
                className={clsx(
                  'px-4 py-3 rounded-app text-sm font-medium transition-all',
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
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

        {activeTab === 'search' && results.length === 0 && !loading && query && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-sm text-secondary">Tidak ada hasil untuk "{query}"</p>
            <p className="text-xs text-muted mt-1">Coba keyword lain</p>
          </div>
        )}
      </div>
    </div>
  );
}
