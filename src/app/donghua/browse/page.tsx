// src/app/donghua/browse/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Calendar } from 'lucide-react';
import MediaGrid from '@/components/MediaGrid';
import { MediaCard } from '@/types/media';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.shiiinime.my.id';

// A-Z Letters
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

export default function DonghuaBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [genres, setGenres] = useState<{ name: string; slug: string }[]>([]);
  const [results, setResults] = useState<MediaCard[]>([]);
  const [loading, setLoading] = useState(false);
  
  const selectedGenre = searchParams.get('genre') || '';
  const selectedLetter = searchParams.get('letter') || '';
  const selectedYear = searchParams.get('year') || '';
  const searchQuery = searchParams.get('q') || '';

  // Fetch genres
  useEffect(() => {
    fetch(`${API_BASE}/anime/donghua/genres`)
      .then(res => res.json())
      .then(data => {
        if (data.status && Array.isArray(data.data)) {
          setGenres(data.data);
        }
      })
      .catch(err => console.error('Error fetching genres:', err));
  }, []);

  // Fetch results based on filters
  useEffect(() => {
    setLoading(true);
    
    let url = '';
    if (searchQuery) {
      url = `${API_BASE}/anime/donghua/search/${encodeURIComponent(searchQuery)}/1`;
    } else if (selectedGenre) {
      url = `${API_BASE}/anime/donghua/genres/${selectedGenre}/1`;
    } else if (selectedLetter) {
      url = `${API_BASE}/anime/donghua/az-list/${selectedLetter}/1`;
    } else if (selectedYear) {
      url = `${API_BASE}/anime/donghua/seasons/${selectedYear}`;
    } else {
      url = `${API_BASE}/anime/donghua/home/1`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.status && Array.isArray(data.data)) {
          setResults(data.data);
        } else {
          setResults([]);
        }
      })
      .catch(err => {
        console.error('Error fetching donghua:', err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [selectedGenre, selectedLetter, selectedYear, searchQuery]);

  const handleFilterChange = (type: 'genre' | 'letter' | 'year', value: string) => {
    const params = new URLSearchParams();
    if (value) params.set(type, value);
    router.push(`/donghua/browse?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q') as string;
    if (query.trim()) {
      router.push(`/donghua/browse?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const currentYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Filter className="w-6 h-6 text-yellow-400" />
            Filter Donghua
          </h1>
          <p className="text-sm text-secondary mt-2">
            Cari donghua berdasarkan genre, huruf, atau tahun
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Cari donghua..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-app text-sm text-primary placeholder:text-muted outline-none focus:border-yellow-400/60"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-app transition-colors"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Genre Filter */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2">Genre</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('genre', '')}
                className={`px-3 py-1.5 text-xs rounded-app transition-colors ${
                  !selectedGenre
                    ? 'bg-yellow-400 text-black font-medium'
                    : 'bg-surface border border-border text-secondary hover:text-primary'
                }`}
              >
                Semua
              </button>
              {genres.map((genre) => (
                <button
                  key={genre.slug}
                  onClick={() => handleFilterChange('genre', genre.slug)}
                  className={`px-3 py-1.5 text-xs rounded-app transition-colors ${
                    selectedGenre === genre.slug
                      ? 'bg-yellow-400 text-black font-medium'
                      : 'bg-surface border border-border text-secondary hover:text-primary'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* A-Z Filter */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2">Huruf</h3>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handleFilterChange('letter', '')}
                className={`w-8 h-8 text-xs rounded-app transition-colors ${
                  !selectedLetter
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'bg-surface border border-border text-secondary hover:text-primary'
                }`}
              >
                All
              </button>
              {LETTERS.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleFilterChange('letter', letter)}
                  className={`w-8 h-8 text-xs rounded-app transition-colors ${
                    selectedLetter === letter
                      ? 'bg-yellow-400 text-black font-bold'
                      : 'bg-surface border border-border text-secondary hover:text-primary'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Year Filter */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Tahun
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('year', '')}
                className={`px-3 py-1.5 text-xs rounded-app transition-colors ${
                  !selectedYear
                    ? 'bg-yellow-400 text-black font-medium'
                    : 'bg-surface border border-border text-secondary hover:text-primary'
                }`}
              >
                Semua
              </button>
              {currentYears.map((year) => (
                <button
                  key={year}
                  onClick={() => handleFilterChange('year', year.toString())}
                  className={`px-3 py-1.5 text-xs rounded-app transition-colors ${
                    selectedYear === year.toString()
                      ? 'bg-yellow-400 text-black font-medium'
                      : 'bg-surface border border-border text-secondary hover:text-primary'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-secondary mt-4">Loading...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-secondary mb-4">
                {results.length} donghua ditemukan
              </p>
              <MediaGrid items={results} type="donghua" />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary">Tidak ada hasil ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
