'use client';
// src/app/stream/[type]/[slug]/page.tsx
// ─────────────────────────────────────────────────────────────
// VIDEO PLAYER PAGE — handles both anime and hentai streams.
//
// Endpoints used:
//   Anime:  GET /anime/animekompi/episode/:slug
//           GET /anime/animekompi/detail/:seriesSlug   (for episode list drawer)
//   Hentai: GET /anime/nekopoi/episode/:slug
//           GET /anime/nekopoi/detail/:seriesSlug      (for episode list drawer)
//
// URL structure:
//   /stream/anime/[episodeSlug]
//   /stream/hentai/[episodeSlug]
//
// Series slug is derived from the episode slug by stripping
// the "-episode-N..." suffix, then used to:
//   • Link "Info Series" → /detail/[type]/[seriesSlug]
//   • Fetch the episode list for the drawer
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Download,
  Info, List, X, AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimeAPI, HentaiAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import VideoPlayer from '@/components/VideoPlayer';
import ResumeModal from '@/components/ResumeModal';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import { useVideoProgressSaver } from '@/context/HistoryContext';
import type {
  AnimeEpisodeData,
  HentaiEpisodeData,
  AnimeDetail,
  HentaiDetail,
} from '@/types/media';

// ─────────────────────────────────────────────────────────────
// Series slug extractor
//
// Episode slugs from Animekompi / Nekopoi follow the pattern:
//   {series-slug}-episode-{N}-subtitle-indonesia
//
// We strip everything from "-episode-" onwards to get the series slug.
// ─────────────────────────────────────────────────────────────
function deriveSeriesSlug(episodeSlug: string): string {
  if (!episodeSlug) return '';

  // Try the most common separator patterns
  const patterns = [
    // "-episode-09-subtitle-indonesia" style
    /(-episode-\d.*$)/i,
    // "-ep-09" style
    /(-ep-\d+.*$)/i,
    // "-eps-09" style
    /(-eps-\d+.*$)/i,
  ];

  for (const pattern of patterns) {
    const stripped = episodeSlug.replace(pattern, '');
    if (stripped && stripped !== episodeSlug) return stripped;
  }

  // Fallback: remove last two dash-separated segments
  // e.g. "great-anime-season-2-09" → "great-anime-season-2"
  const parts = episodeSlug.split('-');
  if (parts.length > 2) {
    // if last part is numeric, strip it
    if (/^\d+$/.test(parts[parts.length - 1] ?? '')) {
      return parts.slice(0, -1).join('-');
    }
  }

  return episodeSlug; // give up, return as-is
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function StreamPage() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const router         = useRouter();

  const isHentai   = type === 'hentai';
  const seriesSlug = useMemo(() => deriveSeriesSlug(slug ?? ''), [slug]);

  const [showDrawer, setShowDrawer] = useState(false);
  const [showDebug,  setShowDebug]  = useState(false);

  // ── Fetch the episode stream data ─────────────────────────
  const animeFetch  = useApi(
    useCallback(() => AnimeAPI.getEpisode(slug ?? ''),  [slug]),
    [slug], null, isHentai
  );
  const hentaiFetch = useApi(
    useCallback(() => HentaiAPI.getEpisode(slug ?? ''), [slug]),
    [slug], null, !isHentai
  );

  const loading = isHentai ? hentaiFetch.loading : animeFetch.loading;
  const error   = isHentai ? hentaiFetch.error   : animeFetch.error;
  const rawEp   = (isHentai ? hentaiFetch.data : animeFetch.data) as
    AnimeEpisodeData | HentaiEpisodeData | null;

  // ── Fetch series detail (for episode list in drawer) ──────
  // Only fetches when the drawer is opened (skip=true initially)
  const animeDetailFetch  = useApi(
    useCallback(() => AnimeAPI.getDetail(seriesSlug),  [seriesSlug]),
    [seriesSlug], null, isHentai || !showDrawer
  );
  const hentaiDetailFetch = useApi(
    useCallback(() => HentaiAPI.getDetail(seriesSlug), [seriesSlug]),
    [seriesSlug], null, !isHentai || !showDrawer
  );

  const detailData = isHentai
    ? (hentaiDetailFetch.data as HentaiDetail | null)
    : (animeDetailFetch.data  as AnimeDetail  | null);

  const episodeList = (detailData as AnimeDetail | null)?.episode_list
    ?? (detailData as HentaiDetail | null)?.episode_list
    ?? [];

  // ── Extract episode fields ────────────────────────────────
  const title     = rawEp?.title            ?? '';
  const streamUrl = rawEp?.stream_url       ?? '';
  const servers   = rawEp?.stream_servers   ?? [];
  const downloads = rawEp?.download_links   ?? [];
  const prevSlug  = (rawEp as AnimeEpisodeData | null)?.prev_episode_slug ?? '';
  const nextSlug  = (rawEp as AnimeEpisodeData | null)?.next_episode_slug ?? '';

  // ── Video progress saver ─────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { resumeState, attachRef } = useVideoProgressSaver(
    rawEp && slug
      ? { slug, seriesSlug, title, episodeTitle: title, poster: '', type: isHentai ? 'hentai' : 'anime' }
      : null
  );
  const [resumeOpen, setResumeOpen] = useState(false);
  const didCheck = useRef(false);
  useEffect(() => {
    if (didCheck.current || !rawEp) return;
    if (resumeState.shouldResume) setResumeOpen(true);
    didCheck.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawEp]);

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 pt-4 space-y-3">
        <SkeletonBanner />
        <div className="h-10 rounded-app bg-surface animate-pulse" />
        <div className="h-10 rounded-app bg-surface animate-pulse w-3/4" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error || !rawEp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <AlertCircle className="w-10 h-10 opacity-50" aria-hidden />
        <p className="text-sm text-center">{error ?? 'Episode tidak ditemukan.'}</p>
        {seriesSlug && (
          <Link href={`/detail/${type}/${seriesSlug}`} className="btn-ghost text-sm mt-1">
            Lihat Info Series
          </Link>
        )}
        <button onClick={() => router.back()} className="text-xs text-muted hover:text-primary">
          ← Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto">

      {/* ── Resume modal ── */}
      <ResumeModal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        icon="🎬"
        title="Lanjutkan Menonton?"
        subtitle={title}
        highlight={`Terakhir di: ${resumeState.formatted}`}
        continueLabel={`Lanjut (${resumeState.formatted})`}
        restartLabel="Mulai dari Awal"
        onContinue={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = resumeState.positionSeconds;
            videoRef.current.play().catch(() => {});
          }
        }}
        onRestart={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
          }
        }}
      />

      {/* ── Video player ── */}
      <VideoPlayer
        servers={servers}
        defaultUrl={streamUrl}
        title={title}
      />

      {/* ── Episode title + navigation bar ── */}
      <div className="px-4 pt-3.5 pb-3 flex items-start justify-between gap-3 border-b border-border">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-primary line-clamp-2 leading-snug">
            {title || (slug ?? '').replace(/-/g, ' ')}
          </h1>
          {seriesSlug && (
            <p className="text-xs text-muted mt-0.5 truncate">
              Series: {seriesSlug.replace(/-/g, ' ')}
            </p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Previous episode */}
          {prevSlug && (
            <Link
              href={`/stream/${type}/${prevSlug}`}
              aria-label="Episode sebelumnya"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </Link>
          )}

          {/* Next episode */}
          {nextSlug && (
            <Link
              href={`/stream/${type}/${nextSlug}`}
              aria-label="Episode berikutnya"
              className={clsx(
                'w-8 h-8 flex items-center justify-center rounded-app transition-colors font-bold',
                isHentai
                  ? 'bg-pink-500 text-white hover:brightness-110'
                  : 'bg-cyan text-bg hover:brightness-110'
              )}
            >
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Link>
          )}

          {/* Episode list drawer */}
          <button
            onClick={() => setShowDrawer(true)}
            aria-label="Daftar episode"
            className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors"
          >
            <List className="w-4 h-4" aria-hidden />
          </button>

          {/* Info series */}
          {seriesSlug && (
            <Link
              href={`/detail/${type}/${seriesSlug}`}
              aria-label="Info series"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-cyan transition-colors"
            >
              <Info className="w-4 h-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      {/* ── Download links ── */}
      {downloads.length > 0 && (
        <div className="px-4 py-4 border-b border-border">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" aria-hidden /> Unduh
          </p>
          <div className="space-y-3">
            {downloads.map((opt, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-secondary mb-1.5">{opt.resolution}</p>
                <div className="flex flex-wrap gap-2">
                  {(opt.links ?? []).map((lnk, j) => (
                    <a
                      key={j}
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ep-pill hover:border-cyan hover:text-cyan"
                    >
                      {lnk.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Series info quick card ── */}
      {seriesSlug && (
        <div className="px-4 py-4">
          <Link
            href={`/detail/${type}/${seriesSlug}`}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-app border transition-all',
              'bg-surface hover:bg-surface-2',
              isHentai ? 'border-pink-500/25 hover:border-pink-500/50' : 'border-cyan/20 hover:border-cyan/50'
            )}
          >
            <Info className={clsx('w-5 h-5 flex-shrink-0', isHentai ? 'text-pink-400' : 'text-cyan')} aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">Lihat Info Series</p>
              <p className="text-xs text-muted truncate mt-0.5">
                Sinopsis, daftar episode, dan info lengkap
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" aria-hidden />
          </Link>
        </div>
      )}

      {/* ── Dev debug panel (visible always for now to diagnose stream issue) ── */}
      <div className="px-4 pb-8">
        <details className="text-xs">
          <summary className="cursor-pointer text-muted hover:text-primary transition-colors py-2">
            🔧 Debug: lihat raw API response
          </summary>
          <pre className="mt-2 text-[0.65rem] text-secondary bg-surface border border-border rounded-app p-3 overflow-x-auto max-h-80 whitespace-pre-wrap break-all">
            {JSON.stringify({ slug, seriesSlug, rawEp }, null, 2)}
          </pre>
        </details>
      </div>

      {/* ── Episode list drawer ── */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/65 backdrop-blur-sm"
            onClick={() => setShowDrawer(false)}
            aria-hidden
          />

          {/* Drawer panel */}
          <div className="w-64 sm:w-72 bg-surface border-l border-border flex flex-col h-full overflow-hidden animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="text-sm font-bold text-primary">Daftar Episode</span>
              <button
                onClick={() => setShowDrawer(false)}
                aria-label="Tutup drawer"
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            {/* Series info link */}
            {seriesSlug && (
              <Link
                href={`/detail/${type}/${seriesSlug}`}
                onClick={() => setShowDrawer(false)}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 border-b border-border text-xs text-secondary hover:text-cyan transition-colors"
              >
                <Info className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                <span className="truncate">Info lengkap: {seriesSlug.replace(/-/g, ' ')}</span>
              </Link>
            )}

            {/* Episode list */}
            <div className="flex-1 overflow-y-auto">
              {(animeDetailFetch.loading || hentaiDetailFetch.loading) && (
                <div className="flex flex-col gap-2 p-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-9 rounded-lg bg-surface-2 animate-pulse" />
                  ))}
                </div>
              )}

              {episodeList.length > 0 && (
                <div className="p-2 space-y-1">
                  {episodeList.map((ep) => {
                    const isActive = ep.slug === slug;
                    return (
                      <Link
                        key={ep.slug}
                        href={`/stream/${type}/${ep.slug}`}
                        onClick={() => setShowDrawer(false)}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all',
                          isActive
                            ? isHentai
                              ? 'bg-pink-500/15 text-pink-400 font-semibold border border-pink-500/30'
                              : 'bg-cyan/10 text-cyan font-semibold border border-cyan/30'
                            : 'text-secondary hover:bg-surface-2 hover:text-primary border border-transparent'
                        )}
                      >
                        {isActive && (
                          <span
                            className={clsx(
                              'w-1.5 h-1.5 rounded-full flex-shrink-0',
                              isHentai ? 'bg-pink-400' : 'bg-cyan'
                            )}
                            aria-hidden
                          />
                        )}
                        <span className="truncate">{ep.title}</span>
                        {(ep as { date?: string }).date && (
                          <span className="text-[0.65rem] text-muted flex-shrink-0 ml-auto">
                            {(ep as { date?: string }).date}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Empty — series not found or no episodes */}
              {!animeDetailFetch.loading && !hentaiDetailFetch.loading && episodeList.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-2 text-muted px-4">
                  <p className="text-xs text-center">
                    Daftar episode tidak tersedia.
                  </p>
                  {seriesSlug && (
                    <Link
                      href={`/detail/${type}/${seriesSlug}`}
                      onClick={() => setShowDrawer(false)}
                      className="text-xs text-cyan hover:underline mt-1"
                    >
                      Buka halaman detail →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Footer — back to series */}
            {seriesSlug && (
              <div className="border-t border-border p-3 flex-shrink-0">
                <Link
                  href={`/detail/${type}/${seriesSlug}`}
                  onClick={() => setShowDrawer(false)}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-app text-sm font-semibold transition-all',
                    isHentai ? 'btn-pink' : 'btn-primary'
                  )}
                >
                  <Info className="w-4 h-4" aria-hidden />
                  Info Series Lengkap
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
