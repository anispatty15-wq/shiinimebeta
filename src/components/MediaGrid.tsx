// src/components/MediaGrid.tsx
import Link from 'next/link';
import Image from 'next/image';
import { type MediaCard as MediaCardType, type ContentType } from '@/types/media';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedTitle } from '@/lib/localizedTitle';

interface MediaGridProps {
  items: MediaCardType[];
  type?: ContentType;
  columns?: 'auto' | 2 | 3 | 4 | 5 | 6;
}

export default function MediaGrid({ 
  items, 
  type = 'anime',
  columns = 'auto' 
}: MediaGridProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary">Tidak ada data</p>
      </div>
    );
  }

  const gridCols = columns === 'auto' 
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
    : `grid-cols-${columns}`;

  return (
    <div className={`grid min-w-0 ${gridCols} gap-4`}>
      {items.map((item, idx) => (
        <GridMediaCard key={`${item.slug}-${idx}`} item={item} type={type} />
      ))}
    </div>
  );
}

function GridMediaCard({ item, type }: { item: MediaCardType; type: ContentType }) {
  const href = `/detail/${type}/${item.slug}`;
  const { language } = useLanguage();
  const title = getLocalizedTitle(item, language);

  return (
    <Link href={href} className="group min-w-0">
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-app overflow-hidden bg-surface-2 mb-2">
        {item.poster ? (
          <Image
            src={item.poster}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-2xl">
            ?
          </div>
        )}
        
        {/* Episode/Chapter badge */}
        {(item.episode || item.chapter) && (
          <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded">
            {item.episode ? `Ep ${item.episode}` : `Ch ${item.chapter}`}
          </div>
        )}

        {/* Status badge */}
        {item.status && (
          <div className="absolute top-2 right-2 bg-cyan/90 text-white text-xs font-semibold px-2 py-1 rounded">
            {item.status}
          </div>
        )}

        {/* Type badge (if provided) */}
        {item.type && (
          <div className="absolute bottom-2 left-2 bg-surface/90 backdrop-blur-sm text-primary text-xs font-medium px-2 py-1 rounded">
            {item.type}
          </div>
        )}

        {/* Score badge */}
        {item.score && (
          <div className="absolute bottom-2 right-2 bg-yellow-400/90 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            ⭐ {item.score}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="break-words text-sm font-medium text-primary line-clamp-2 group-hover:text-cyan transition-colors mb-1">
        {title}
      </h3>

      {/* Date */}
      {item.date && (
        <p className="text-xs text-muted">
          {item.date}
        </p>
      )}
    </Link>
  );
}
