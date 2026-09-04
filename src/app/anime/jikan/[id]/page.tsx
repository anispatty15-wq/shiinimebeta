'use client';
// src/app/anime/jikan/[id]/page.tsx
// Anime detail page from Jikan API

import { use, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star, Calendar, Tv, Play, Users, MessageCircle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import * as JikanAPI from '@/lib/jikan';

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
    
    // Load data sequentially with longer delays to avoid rate limits
    const loadData = async () => {
      await fetchAnimeDetail();
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await fetchCharacters();
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await fetchStaff();
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await fetchEpisodes();
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await fetchNews();
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await fetchReviews();
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await fetchRecommendations();
    };
    
    loadData();
  }, [id]);

  const fetchAnimeDetail = async () => {
    const data = await JikanAPI.getAnimeById(id);
    setAnime(data?.data || null);
    setLoading(false);
  };

  const fetchCharacters = async () => {
    const data = await JikanAPI.getAnimeCharacters(id);
    setCharacters((data?.data || []).slice(0, 12));
  };

  const fetchStaff = async () => {
    const data = await JikanAPI.getAnimeStaff(id);
    setStaff((data?.data || []).slice(0, 12));
  };

  const fetchEpisodes = async () => {
    const data = await JikanAPI.getAnimeEpisodes(id);
    setEpisodes((data?.data || []).slice(0, 20));
  };

  const fetchNews = async () => {
    const data = await JikanAPI.getAnimeNews(id);
    setNews((data?.data || []).slice(0, 6));
  };

  const fetchReviews = async () => {
    const data = await JikanAPI.getAnimeReviews(id);
    setReviews((data?.data || []).slice(0, 5));
  };

  const fetchRecommendations = async () => {
    const data = await JikanAPI.getAnimeRecommendations(id);
    setRecommendations((data?.data || []).slice(0, 12));
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
      <div className="relative h-[30vh] sm:h-[40vh] md:h-[50vh] overflow-hidden">
        <Image
          src={anime.images.jpg.large_image_url}
          alt={anime.title}
          fill
          className="object-cover blur-2xl opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-24 sm:-mt-32 relative z-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-secondary hover:text-primary transition-colors mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Back
        </button>

        <div className="grid md:grid-cols-[300px_1fr] gap-4 sm:gap-6">
          {/* Poster */}
          <div className="space-y-3 sm:space-y-4 md:block flex gap-4">
            <div className="aspect-[2/3] relative rounded-app overflow-hidden border border-border w-32 sm:w-40 md:w-full flex-shrink-0">
              <Image
                src={anime.images.jpg.large_image_url}
                alt={anime.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Actions */}
            <div className="flex-1 md:flex-none">
              <a
                href={`https://myanimelist.net/anime/${anime.mal_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-app bg-cyan text-bg text-xs sm:text-sm font-semibold hover:brightness-110 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                View on MAL
              </a>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1.5 sm:mb-2">{anime.title}</h1>
              {anime.title_english && anime.title_english !== anime.title && (
                <p className="text-base sm:text-lg text-secondary">{anime.title_english}</p>
              )}
              {anime.title_japanese && (
                <p className="text-xs sm:text-sm text-muted mt-1">{anime.title_japanese}</p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {anime.score && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs sm:text-sm font-semibold text-yellow-400">{anime.score.toFixed(2)}</span>
                </div>
              )}
              <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs sm:text-sm font-medium">
                {anime.type}
              </span>
              <span className="text-xs sm:text-sm text-secondary">{anime.episodes} eps</span>
              <span className="text-xs sm:text-sm text-secondary hidden xs:inline">{anime.status}</span>
            </div>

            {/* Synopsis */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-primary mb-1.5 sm:mb-2">Synopsis</h2>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                {anime.synopsis || 'No synopsis available.'}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-[0.65rem] sm:text-xs text-muted mb-1">Aired</p>
                <p className="text-xs sm:text-sm text-primary">
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
                  <p className="text-[0.65rem] sm:text-xs text-muted mb-1">Studios</p>
                  <p className="text-xs sm:text-sm text-primary">{anime.studios.map(s => s.name).join(', ')}</p>
                </div>
              )}

              {anime.source && (
                <div>
                  <p className="text-[0.65rem] sm:text-xs text-muted mb-1">Source</p>
                  <p className="text-xs sm:text-sm text-primary">{anime.source}</p>
                </div>
              )}

              {anime.duration && (
                <div>
                  <p className="text-[0.65rem] sm:text-xs text-muted mb-1">Duration</p>
                  <p className="text-xs sm:text-sm text-primary">{anime.duration}</p>
                </div>
              )}
            </div>

            {/* Genres */}
            {anime.genres.length > 0 && (
              <div>
                <p className="text-[0.65rem] sm:text-xs text-muted mb-2">Genres</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre.mal_id}
                      className="px-2.5 sm:px-3 py-1 rounded-full bg-surface-2 border border-border text-[0.65rem] sm:text-xs font-medium text-secondary"
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
        <div className="mt-8 sm:mt-12 border-b border-border overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1 sm:gap-2">
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
                  'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2',
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
        <div className="mt-4 sm:mt-6">
          {/* Characters */}
          {activeTab === 'characters' && (
            characters.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
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
                    <div className="p-1.5 sm:p-2">
                      <p className="text-[0.65rem] sm:text-xs font-semibold text-primary line-clamp-2">
                        {char.character.name}
                      </p>
                      <p className="text-[0.55rem] sm:text-[0.65rem] text-muted mt-0.5">{char.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-secondary">No characters data available</p>
              </div>
            )
          )}

          {/* Staff */}
          {activeTab === 'staff' && (
            staff.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
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
                    <div className="p-1.5 sm:p-2">
                      <p className="text-[0.65rem] sm:text-xs font-semibold text-primary line-clamp-2">
                        {s.person.name}
                      </p>
                      <p className="text-[0.55rem] sm:text-[0.65rem] text-muted mt-0.5">
                        {s.positions.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-secondary">No staff data available</p>
              </div>
            )
          )}

          {/* Episodes */}
          {activeTab === 'episodes' && (
            episodes.length > 0 ? (
              <div className="space-y-1.5 sm:space-y-2">
                {episodes.map((ep) => (
                  <a
                    key={ep.mal_id}
                    href={ep.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-surface border border-border rounded-app hover:border-cyan/40 transition-all"
                  >
                    <span className="text-xs sm:text-sm font-bold text-cyan flex-shrink-0">Episode {ep.episode}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-primary line-clamp-1">{ep.title}</p>
                      {ep.aired && (
                        <p className="text-[0.65rem] sm:text-xs text-muted mt-0.5">
                          {new Date(ep.aired).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Play className="w-10 h-10 sm:w-12 sm:h-12 text-muted mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-secondary">No episodes data available</p>
                <p className="text-[0.65rem] sm:text-xs text-muted mt-1">Episodes may not be available for this anime yet</p>
              </div>
            )
          )}

          {/* News */}
          {activeTab === 'news' && (
            news.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
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
                    <div className="p-2.5 sm:p-3">
                      <p className="text-xs sm:text-sm font-semibold text-primary line-clamp-2 mb-1.5 sm:mb-2">
                        {item.title}
                      </p>
                      <p className="text-[0.65rem] sm:text-xs text-secondary line-clamp-3 mb-1.5 sm:mb-2">
                        {item.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-[0.65rem] sm:text-xs text-muted">
                        <span className="truncate">{item.author_username}</span>
                        <span className="flex-shrink-0">{new Date(item.date).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-muted mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-secondary">No news available</p>
              </div>
            )
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            reviews.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.mal_id}
                    className="bg-surface border border-border rounded-app p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-surface-2 relative flex-shrink-0">
                        <Image
                          src={review.user.images.jpg.image_url}
                          alt={review.user.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-primary truncate">
                          {review.user.username}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-[0.65rem] sm:text-xs font-semibold text-yellow-400">
                              {review.score}/10
                            </span>
                          </div>
                          <span className="text-[0.65rem] sm:text-xs text-muted">
                            {new Date(review.date).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-secondary leading-relaxed line-clamp-6">
                      {review.review}
                    </p>
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.65rem] sm:text-xs text-cyan hover:text-cyan/80 mt-2 inline-block"
                    >
                      Read full review →
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Star className="w-10 h-10 sm:w-12 sm:h-12 text-muted mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-secondary">No reviews available yet</p>
              </div>
            )
          )}

          {/* Recommendations */}
          {activeTab === 'recommendations' && (
            recommendations.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
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
                    <div className="p-1.5 sm:p-2">
                      <p className="text-[0.65rem] sm:text-xs font-semibold text-primary line-clamp-2">
                        {rec.entry.title}
                      </p>
                      <p className="text-[0.55rem] sm:text-[0.65rem] text-muted mt-0.5">
                        {rec.votes} votes
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Tv className="w-10 h-10 sm:w-12 sm:h-12 text-muted mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-secondary">No recommendations available</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
