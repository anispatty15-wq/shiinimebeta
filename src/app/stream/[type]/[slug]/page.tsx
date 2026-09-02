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
import { SkeletonBanner } from '@/components/SkeletonLoader';
import { useHistory } from '@/context/HistoryContext';
import { useAuth } from '@/context/AuthContext';
import { calcWatchXP } from '@/lib/xp';
import { formatTime } from '@/utils/storage';
import Comments from '@/components/Comments';
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

  // ── Watch progress tracking (iframe-compatible) ──────────
  // Since we can't access video events from cross-origin iframe,
  // we track elapsed time via a page-visibility-aware interval.
  const { saveWatchProgress, updateWatchPoster, checkVideoResume } = useHistory();
  const { user, awardXP } = useAuth();
  const savedToHistory    = useRef(false);
  const elapsedRef        = useRef(0);
  const xpAwardedRef      = useRef(0);     // minutes already XP-awarded
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showResume,    setShowResume]   = useState(false);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [xpToast,       setXpToast]      = useState<string | null>(null);

  // Initial save + check resume on episode load
  useEffect(() => {
    if (!rawEp || !slug) return;

    // Check if user has watched this episode before
    if (!savedToHistory.current) {
      savedToHistory.current = true;
      const prev = checkVideoResume(slug);

      if (prev.shouldResume && prev.positionSeconds > 10) {
        // Pre-fill elapsed with saved position so progress continues from there
        elapsedRef.current = prev.positionSeconds;
        setResumeSeconds(prev.positionSeconds);
        setShowResume(true);
      }

      // Save initial entry
      saveWatchProgress({
        slug,
        seriesSlug,
        title:           (rawEp as AnimeEpisodeData).title ?? title,
        episodeTitle:    (rawEp as AnimeEpisodeData).title ?? title,
        poster:          '',
        type:            isHentai ? 'hentai' : 'anime',
        positionSeconds: prev.positionSeconds,
        durationSeconds: 0,
        completed:       false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawEp, slug]);

  // Start interval timer when episode is loaded
  useEffect(() => {
    if (!rawEp || !slug) return;

    // Save progress every 15 seconds
    const SAVE_INTERVAL = 15_000;
    const TICK          = 1_000;

    intervalRef.current = setInterval(() => {
      // Only count time when page is visible (tab in focus)
      if (document.visibilityState !== 'visible') return;
      elapsedRef.current += 1;

      // Save to localStorage every 15 ticks
      if (elapsedRef.current % (SAVE_INTERVAL / TICK) === 0) {
        saveWatchProgress({
          slug,
          seriesSlug,
          title:           title,
          episodeTitle:    title,
          poster:          '',
          type:            isHentai ? 'hentai' : 'anime',
          positionSeconds: elapsedRef.current,
          durationSeconds: 0,
          completed:       false,
        });
      }

      // Award XP every 60 seconds to logged-in users
      if (user && elapsedRef.current % 60 === 0 && elapsedRef.current > 0) {
        const minutesDone = Math.floor(elapsedRef.current / 60);
        const newMinutes  = minutesDone - xpAwardedRef.current;
        if (newMinutes > 0) {
          const isFirst  = xpAwardedRef.current === 0 && minutesDone === 1;
          const xpGained = calcWatchXP(newMinutes, isFirst);
          xpAwardedRef.current = minutesDone;
          awardXP(xpGained, newMinutes).then(() => {
            setXpToast(`+${xpGained} XP`);
            setTimeout(() => setXpToast(null), 2500);
          });
        }
      }
    }, TICK);

    // Save on unmount / navigation away
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (slug && elapsedRef.current > 5) {
        saveWatchProgress({
          slug,
          seriesSlug,
          title, episodeTitle: title, poster: '',
          type:            isHentai ? 'hentai' : 'anime',
          positionSeconds: elapsedRef.current,
          durationSeconds: 0,
          completed:       elapsedRef.current > 1200, // mark complete after ~20 min
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawEp, slug]);

  // Backfill poster once series detail is loaded (from drawer)
  useEffect(() => {
    if (!slug || !detailData) return;
    const poster = (detailData as AnimeDetail | HentaiDetail).poster ?? '';
    if (poster) updateWatchPoster(slug, poster);
  }, [slug, detailData, updateWatchPoster]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showTimestampBar, setShowTimestampBar] = useState(false);

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
      {showResume && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowResume(false)}
        >
          <div
            className="w-full max-w-xs bg-surface border border-border rounded-app p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <span className="text-3xl block mb-2">🎬</span>
              <h3 className="text-sm font-bold text-primary mb-1">Lanjutkan Menonton?</h3>
              <p className="text-xs text-muted">
                Terakhir ditonton di <strong className="text-cyan">{formatTime(resumeSeconds)}</strong>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowResume(false);
                  setShowTimestampBar(true);
                  // Auto-hide bar after 30 seconds
                  setTimeout(() => setShowTimestampBar(false), 30_000);
                }}
                className={clsx(
                  'w-full py-2.5 rounded-app text-sm font-semibold transition-all',
                  isHentai ? 'bg-pink text-white hover:brightness-110' : 'bg-cyan text-bg hover:brightness-110'
                )}
              >
                Lanjut ({formatTime(resumeSeconds)})
              </button>
              <button
                onClick={() => {
                  elapsedRef.current = 0;
                  setShowResume(false);
                  setShowTimestampBar(false);
                }}
                className="w-full py-2 rounded-app text-sm text-muted hover:text-primary border border-border hover:border-primary/30 transition-all"
              >
                Mulai dari Awal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── XP toast notification ── */}
      {xpToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className={clsx(
            'px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce',
            isHentai ? 'bg-pink text-white' : 'bg-cyan text-bg'
          )}>
            ⚡ {xpToast}
          </div>
        </div>
      )}

      {/* ── Video player ── */}
      <VideoPlayer
        servers={servers}
        defaultUrl={streamUrl}
        title={title}
      />

      {/* ── Timestamp reminder bar (shown after "Lanjut" clicked) ── */}
      {showTimestampBar && resumeSeconds > 0 && (
        <div className={clsx(
          'px-4 py-2.5 flex items-center gap-3 text-sm border-b',
          isHentai
            ? 'bg-pink/10 border-pink/20'
            : 'bg-cyan/10 border-cyan/20'
        )}>
          <span className="text-lg" aria-hidden>⏩</span>
          <span className="flex-1 text-secondary text-xs leading-snug">
            Terakhir kamu menonton sampai{' '}
            <strong className={isHentai ? 'text-pink' : 'text-cyan'}>
              {formatTime(resumeSeconds)}
            </strong>
            {' '}— seek manual ke posisi ini di player.
          </span>
          <button
            onClick={() => setShowTimestampBar(false)}
            className="text-muted hover:text-primary text-xs flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

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

      {/* ── Comments ── */}
      <Comments episodeSlug={slug ?? ''} contentType={isHentai ? 'hentai' : 'anime'} />

      {/* ── Dev debug panel ── */}
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
