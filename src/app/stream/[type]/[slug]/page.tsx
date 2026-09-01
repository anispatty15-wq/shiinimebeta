'use client';
// src/app/stream/[type]/[slug]/page.tsx
// Video streaming screen for anime and hentai episodes.
// Route params:
//   type = 'anime' | 'hentai'
//   slug = episode slug

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Download,
  List, X, AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimeAPI, HentaiAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import VideoPlayer from '@/components/VideoPlayer';
import ResumeModal from '@/components/ResumeModal';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import { useVideoProgressSaver } from '@/context/HistoryContext';
import type { AnimeEpisodeData, HentaiEpisodeData } from '@/types/media';

export default function StreamPage() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const router         = useRouter();
  const [showDrawer,  setShowDrawer]  = useState(false);
  const [showDebug,   setShowDebug]   = useState(false);

  const isHentai = type === 'hentai';

  // ── Fetch episode data ─────────────────────────────────────
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

  const rawEp: AnimeEpisodeData | HentaiEpisodeData | null =
    isHentai
      ? (hentaiFetch.data as HentaiEpisodeData | null)
      : (animeFetch.data  as AnimeEpisodeData  | null);

  // ── Extract fields (contract-safe) ────────────────────────
  const title        = rawEp?.title                                    ?? '';
  const streamUrl    = rawEp?.stream_url                               ?? '';
  const servers      = rawEp?.stream_servers                           ?? [];
  const downloads    = rawEp?.download_links                           ?? [];
  const prevSlug     = (rawEp as AnimeEpisodeData | null)?.prev_episode_slug ?? '';
  const nextSlug     = (rawEp as AnimeEpisodeData | null)?.next_episode_slug ?? '';

  // ── Resume modal ───────────────────────────────────────────
  const { resumeState, attachRef } = useVideoProgressSaver(
    rawEp && slug
      ? {
          slug,
          seriesSlug:  '',
          title,
          episodeTitle: title,
          poster:       '',
          type:         isHentai ? 'hentai' : 'anime',
        }
      : null
  );
  const [resumeOpen, setResumeOpen] = useState(false);
  const didCheck = useRef(false);
  const videoRef  = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (didCheck.current || !rawEp) return;
    if (resumeState.shouldResume) setResumeOpen(true);
    didCheck.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawEp]);

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 pt-4 space-y-3">
        <SkeletonBanner />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 rounded-app bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (error || !rawEp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <AlertCircle className="w-10 h-10 opacity-50" aria-hidden />
        <p className="text-sm text-center">{error ?? 'Episode tidak ditemukan.'}</p>
        <button onClick={() => router.back()} className="btn-ghost text-sm mt-2">
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

      {/* ── Episode info + prev/next ── */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
        <h1 className="text-sm font-bold text-primary line-clamp-2 flex-1">
          {title || (slug ?? '').replace(/-/g, ' ')}
        </h1>
        <div className="flex gap-2 flex-shrink-0">
          {prevSlug && (
            <Link
              href={`/stream/${type}/${prevSlug}`}
              aria-label="Episode sebelumnya"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </Link>
          )}
          {nextSlug && (
            <Link
              href={`/stream/${type}/${nextSlug}`}
              aria-label="Episode berikutnya"
              className={clsx(
                'w-8 h-8 flex items-center justify-center rounded-app transition-colors',
                isHentai
                  ? 'bg-pink text-white hover:brightness-110'
                  : 'bg-cyan text-bg hover:brightness-110'
              )}
            >
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Link>
          )}
          {/* Open episode list from series */}
          <button
            onClick={() => setShowDrawer(true)}
            aria-label="Daftar episode"
            className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors"
          >
            <List className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* ── Download links ── */}
      {downloads.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" aria-hidden /> Unduh
          </p>
          <div className="space-y-3">
            {downloads.map((opt, i) => (
              <div key={i}>
                <p className="text-xs text-secondary font-semibold mb-1.5">{opt.resolution}</p>
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

      {/* ── Debug (dev only) ── */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="px-4 pb-8">
          <button
            onClick={() => setShowDebug((v) => !v)}
            className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1.5"
          >
            [DEV] {showDebug ? 'Sembunyikan' : 'Tampilkan'} raw API response
          </button>
          {showDebug && (
            <pre className="mt-2 text-[0.65rem] text-secondary bg-surface border border-border rounded-app p-3 overflow-x-auto max-h-80">
              {JSON.stringify(rawEp, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* ── Episode list drawer (quick picker, no detail API needed) ── */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDrawer(false)}
            aria-hidden
          />
          <div className="w-64 bg-surface border-l border-border flex flex-col h-full animate-fade-up overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="text-sm font-semibold text-primary">Episode</span>
              <button
                onClick={() => setShowDrawer(false)}
                aria-label="Tutup"
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 text-center text-xs text-muted py-8">
              <p>Buka halaman detail untuk melihat daftar lengkap episode.</p>
              <button
                onClick={() => { setShowDrawer(false); router.back(); }}
                className="mt-3 btn-ghost text-xs"
              >
                ← Ke Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
