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

interface Staff {
  person: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  positions: string[];
}

interface Episode {
  mal_id: number;
  title: string;
  episode: string;
  url: string;
  aired?: string;
}

interface News {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  images: { jpg: { image_url: string } };
  excerpt: string;
}

interface Review {
  mal_id: number;
  url: string;
  user: {
    username: string;
    images: { jpg: { image_url: string } };
  };
  score: number;
  review: string;
  date: string;
}

interface Recommendation {
  entry: {
    mal_id: number;
    title: string;
    images: { jpg: { image_url: string } };
  };
  votes: number;
}

export default function JikanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'staff' | 'episodes' | 'news' | 'reviews' | 'recommendations'>('overview');

  useEffect(() => {
    if (!id) return;
    fetchAnimeDetail();
    fetchCharacters();
    fetchStaff();
    fetchEpisodes();
    fetchNews();
    fetchReviews();
    fetchRecommendations();
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
      setCharacters((data.data || []).slice(0, 12));
    } catch (err) {
      console.error('Error fetching characters:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/staff`);
      const data = await res.json();
      setStaff((data.data || []).slice(0, 12));
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const fetchEpisodes = async () => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes?page=1`);
      const data = await res.json();
      setEpisodes((data.data || []).slice(0, 20));
    } catch (err) {
      console.error('Error fetching episodes:', err);
    }
  };

  const fetchNews = async () => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/news`);
      const data = await res.json();
      setNews((data.data || []).slice(0, 6));
    } catch (err) {
      console.error('Error fetching news:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/reviews`);
      const data = await res.json();
      setReviews((data.data || []).slice(0, 5));
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/recommendations`);
      const data = await res.json();
      setRecommendations((data.data || []).slice(0, 12));
    } catch (err) {
      console.error('Error fetching recommendations:', err);
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

        {/* Tabs */}
        <div className="mt-12 border-b border-border overflow-x-auto">
          <div className="flex items-center gap-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'characters', label: `Characters (${characters.length})` },
              { id: 'staff', label: `Staff (${staff.length})` },
              { id: 'episodes', label: `Episodes (${episodes.length})` },
              { id: 'news', label: `News (${news.length})` },
              { id: 'reviews', label: `Reviews (${reviews.length})` },
              { id: 'recommendations', label: `Similar (${recommendations.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                  activeTab === tab.id
                    ? 'border-cyan text-cyan'
                    : 'border-transparent text-secondary hover:text-primary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Characters */}
          {activeTab === 'characters' && characters.length > 0 && (
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
          )}

          {/* Staff */}
          {activeTab === 'staff' && staff.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {staff.map((s, idx) => (
                <div
                  key={idx}
                  className="bg-surface border border-border rounded-app overflow-hidden"
                >
                  <div className="aspect-square relative bg-surface-2">
                    <Image
                      src={s.person.images.jpg.image_url}
                      alt={s.person.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-primary line-clamp-2">
                      {s.person.name}
                    </p>
                    <p className="text-[0.65rem] text-muted mt-0.5">
                      {s.positions.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Episodes */}
          {activeTab === 'episodes' && episodes.length > 0 && (
            <div className="space-y-2">
              {episodes.map((ep) => (
                <a
                  key={ep.mal_id}
                  href={ep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-surface border border-border rounded-app hover:border-cyan/40 transition-all"
                >
                  <span className="text-sm font-bold text-cyan">#{ep.episode}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">{ep.title}</p>
                    {ep.aired && (
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(ep.aired).toLocaleDateString('id-ID')}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* News */}
          {activeTab === 'news' && news.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {news.map((item) => (
                <a
                  key={item.mal_id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface border border-border rounded-app overflow-hidden hover:border-cyan/40 transition-all"
                >
                  <div className="aspect-video relative bg-surface-2">
                    <Image
                      src={item.images.jpg.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-primary line-clamp-2 mb-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-secondary line-clamp-3 mb-2">
                      {item.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{item.author_username}</span>
                      <span>{new Date(item.date).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && reviews.length > 0 && (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.mal_id}
                  className="bg-surface border border-border rounded-app p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 relative flex-shrink-0">
                      <Image
                        src={review.user.images.jpg.image_url}
                        alt={review.user.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primary">
                        {review.user.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-semibold text-yellow-400">
                            {review.score}/10
                          </span>
                        </div>
                        <span className="text-xs text-muted">
                          {new Date(review.date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-secondary leading-relaxed line-clamp-6">
                    {review.review}
                  </p>
                  <a
                    href={review.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan hover:text-cyan/80 mt-2 inline-block"
                  >
                    Read full review →
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {activeTab === 'recommendations' && recommendations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.map((rec, idx) => (
                <Link
                  key={idx}
                  href={`/anime/jikan/${rec.entry.mal_id}`}
                  className="bg-surface border border-border rounded-app overflow-hidden hover:border-cyan/40 transition-all group"
                >
                  <div className="aspect-[2/3] relative bg-surface-2">
                    <Image
                      src={rec.entry.images.jpg.image_url}
                      alt={rec.entry.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-primary line-clamp-2">
                      {rec.entry.title}
                    </p>
                    <p className="text-[0.65rem] text-muted mt-0.5">
                      {rec.votes} votes
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
