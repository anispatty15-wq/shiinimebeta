'use client';
// src/app/anime/jikan/[id]/page.tsx
// Anime detail page from Jikan API

import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Star, Calendar, Tv, Play, Users, MessageCircle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface AnimeDetail {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: {
    jpg: { large_image_url: string };
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
  genres: Array<{ mal_id: number; name: string }>;
  studios: Array<{ name: string }>;
  producers: Array<{ name: string }>;
  duration?: string;
  source?: string;
}

interface Character {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: string;
  voice_actors?: Array<{ person: { name: string }; language: string }>;
}

export default function JikanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchAnimeDetail();
    fetchCharacters();
  }, [id]);

  const fetchAnimeDetail = async () => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
      const data = await res.json();
      setAnime(data.data);
    } catch (err) {
      console.error('Error fetching anime:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/characters`);
      const data = await res.json();
      setCharacters((data.data || []).slice(0, 12)); // Top 12 characters
    } catch (err) {
      console.error('Error fetching characters:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Loading anime...</p>
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-secondary">Anime not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-lg bg-cyan text-bg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <Image
          src={anime.images.jpg.large_image_url}
          alt={anime.title}
          fill
          className="object-cover blur-2xl opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Poster */}
          <div className="space-y-4">
            <div className="aspect-[2/3] relative rounded-app overflow-hidden border border-border">
              <Image
                src={anime.images.jpg.large_image_url}
                alt={anime.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Actions */}
            <a
              href={`https://myanimelist.net/anime/${anime.mal_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-app bg-cyan text-bg font-semibold hover:brightness-110 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              View on MAL
            </a>
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">{anime.title}</h1>
              {anime.title_english && anime.title_english !== anime.title && (
                <p className="text-lg text-secondary">{anime.title_english}</p>
              )}
              {anime.title_japanese && (
                <p className="text-sm text-muted mt-1">{anime.title_japanese}</p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 flex-wrap">
              {anime.score && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">{anime.score.toFixed(2)}</span>
                </div>
              )}
              <span className="px-3 py-1.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-sm font-medium">
                {anime.type}
              </span>
              <span className="text-sm text-secondary">{anime.episodes} episodes</span>
              <span className="text-sm text-secondary">{anime.status}</span>
            </div>

            {/* Synopsis */}
            <div>
              <h2 className="text-lg font-semibold text-primary mb-2">Synopsis</h2>
              <p className="text-sm text-secondary leading-relaxed">
                {anime.synopsis || 'No synopsis available.'}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted mb-1">Aired</p>
                <p className="text-sm text-primary">
                  {new Date(anime.aired.from).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {anime.aired.to && ` - ${new Date(anime.aired.to).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}`}
                </p>
              </div>

              {anime.studios.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-1">Studios</p>
                  <p className="text-sm text-primary">{anime.studios.map(s => s.name).join(', ')}</p>
                </div>
              )}

              {anime.source && (
                <div>
                  <p className="text-xs text-muted mb-1">Source</p>
                  <p className="text-sm text-primary">{anime.source}</p>
                </div>
              )}

              {anime.duration && (
                <div>
                  <p className="text-xs text-muted mb-1">Duration</p>
                  <p className="text-sm text-primary">{anime.duration}</p>
                </div>
              )}
            </div>

            {/* Genres */}
            {anime.genres.length > 0 && (
              <div>
                <p className="text-xs text-muted mb-2">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre.mal_id}
                      className="px-3 py-1 rounded-full bg-surface-2 border border-border text-xs font-medium text-secondary"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Characters */}
        {characters.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-primary mb-4">Characters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {characters.map((char) => (
                <div
                  key={char.character.mal_id}
                  className="bg-surface border border-border rounded-app overflow-hidden"
                >
                  <div className="aspect-square relative bg-surface-2">
                    <Image
                      src={char.character.images.jpg.image_url}
                      alt={char.character.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-primary line-clamp-2">
                      {char.character.name}
                    </p>
                    <p className="text-[0.65rem] text-muted mt-0.5">{char.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
