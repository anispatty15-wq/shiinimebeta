// src/components/TopBanner.tsx - Banner for top-rated content with ranking
'use client';

import { useState } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface TopItem {
  slug: string;
  title: string;
  poster: string;
  score?: string | number;
  status?: string;
  type?: string;
  href: string;
}

interface TopBannerProps {
  items: TopItem[];
  title: string;
  basePath?: string;
  accentColor?: string;
}

export default function TopBanner({
  items,
  title,
  basePath = '/stream/anime',
  accentColor = 'cyan',
}: TopBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [lastTapIndex, setLastTapIndex] = useState(-1);
  
  // Sort by score descending and take top 10
  // If no items have scores, just take first 10 items as-is
  const hasScores = items.some(item => item.score && parseFloat(String(item.score)) > 0);
  
  const topItems = hasScores
    ? [...items]
        .filter(item => item.score && parseFloat(String(item.score)) > 0)
        .sort((a, b) => {
          const scoreA = parseFloat(String(a.score || 0));
          const scoreB = parseFloat(String(b.score || 0));
          return scoreB - scoreA;
        })
        .slice(0, 10)
    : items.slice(0, 10); // Fallback: just show first 10 without filtering

  if (topItems.length === 0) return null;

  const currentItem = topItems[currentIndex];
  const zoomedItem = zoomedIndex !== null ? topItems[zoomedIndex] : null;
  
  const handleThumbnailTap = (index: number) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0 && lastTapIndex === index) {
      // Double tap on same thumbnail - open zoom
      setZoomedIndex(index);
    } else {
      // Single tap - just change current
      setCurrentIndex(index);
    }
    
    setLastTapTime(now);
    setLastTapIndex(index);
  };

  return (
    <div className="relative mb-8">
      {/* Main Banner */}
      <div className="relative aspect-[21/9] md:aspect-[21/7] rounded-app overflow-hidden bg-surface border border-border">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={currentItem.poster}
            alt={currentItem.title}
            fill
            className="object-cover opacity-30 blur-sm"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-6 md:p-8">
          {/* Ranking Badge */}
          <div className={`inline-flex items-center gap-2 w-fit mb-3 px-3 py-1.5 rounded-full bg-${accentColor}/10 border border-${accentColor}/30`}>
            <TrendingUp className={`w-4 h-4 text-${accentColor}`} />
            <span className={`text-sm font-bold text-${accentColor}`}>
              #{currentIndex + 1} Top Rated
            </span>
          </div>

          {/* Title */}
          <Link 
            href={currentItem.href}
            className="block mb-2 hover:opacity-80 transition-opacity"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-primary line-clamp-2">
              {currentItem.title}
            </h3>
          </Link>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-secondary">
            {currentItem.score && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-yellow-400">
                  {parseFloat(String(currentItem.score)).toFixed(1)}
                </span>
              </div>
            )}
            {currentItem.type && (
              <span className="px-2 py-0.5 rounded bg-surface/50 border border-border text-xs">
                {currentItem.type}
              </span>
            )}
            {currentItem.status && (
              <span className={`px-2 py-0.5 rounded text-xs ${
                currentItem.status.toLowerCase().includes('ongoing') 
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
              }`}>
                {currentItem.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Top 10 List */}
      <div className="mt-4 grid grid-cols-5 md:grid-cols-10 gap-2">
        {topItems.map((item, index) => (
          <button
            key={item.slug}
            onClick={() => setCurrentIndex(index)}
            onTouchStart={() => handleThumbnailTap(index)}
            className={`relative aspect-[2/3] rounded overflow-hidden border-2 transition-all ${
              currentIndex === index
                ? `border-${accentColor} shadow-lg`
                : 'border-transparent hover:border-border'
            }`}
          >
            {/* Rank Badge */}
            <div className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
              index === 0 
                ? 'bg-yellow-500 text-black'
                : index === 1
                ? 'bg-gray-400 text-black'
                : index === 2
                ? 'bg-orange-600 text-white'
                : 'bg-surface/90 text-primary border border-border'
            }`}>
              {index + 1}
            </div>

            {/* Poster */}
            <Image
              src={item.poster}
              alt={item.title}
              fill
              className={`object-cover transition-opacity ${
                currentIndex === index ? 'opacity-100' : 'opacity-60'
              }`}
              unoptimized
            />

            {/* Score */}
            {item.score && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-semibold text-white">
                  {parseFloat(String(item.score)).toFixed(1)}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Zoom Modal - Portrait only (mobile) */}
      {zoomedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm md:hidden"
          onClick={() => setZoomedIndex(null)}
        >
          <div 
            className="relative w-full max-w-sm mx-4 animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setZoomedIndex(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-surface/80 border border-border flex items-center justify-center text-muted hover:text-primary transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Zoomed Poster */}
            <div className="relative aspect-[2/3] rounded-app overflow-hidden border-2 border-cyan shadow-2xl">
              <Image
                src={zoomedItem.poster}
                alt={zoomedItem.title}
                fill
                className="object-cover"
                unoptimized
              />
              
              {/* Rank Badge */}
              <div className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                zoomedIndex === 0 
                  ? 'bg-yellow-500 text-black'
                  : zoomedIndex === 1
                  ? 'bg-gray-400 text-black'
                  : zoomedIndex === 2
                  ? 'bg-orange-600 text-white'
                  : 'bg-surface/90 text-primary border border-border'
              }`}>
                #{(zoomedIndex ?? 0) + 1}
              </div>

              {/* Score Badge */}
              {zoomedItem.score && (
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/80 flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">
                    {parseFloat(String(zoomedItem.score)).toFixed(1)}
                  </span>
                </div>
              )}

              {/* Info Overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
                <h4 className="text-base font-bold text-white mb-1 line-clamp-2">
                  {zoomedItem.title}
                </h4>
                {zoomedItem.status && (
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                    zoomedItem.status.toLowerCase().includes('ongoing') 
                      ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                      : 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                  }`}>
                    {zoomedItem.status}
                  </span>
                )}
              </div>
            </div>

            {/* Action button */}
            <Link
              href={zoomedItem.href}
              className="mt-4 w-full block text-center px-6 py-3 rounded-app bg-cyan text-bg font-semibold hover:brightness-110 transition-all"
            >
              Tonton Sekarang
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
