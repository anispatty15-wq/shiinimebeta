'use client';
// src/app/hentai/episode/[slug]/page.tsx

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Download, Monitor } from 'lucide-react';
import { clsx } from 'clsx';
import { HentaiAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import { useVideoProgressSaver } from '@/context/HistoryContext';
import ResumeModal from '@/components/ResumeModal';
import { SkeletonBanner } from '@/components/SkeletonLoader';
import type { StreamServer, DownloadOption } from '@/types/media';

export default function HentaiEpisodePage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();

  const { data: ep, loading, error } = useApi(
    useCallback(() => HentaiAPI.getEpisode(slug ?? ''), [slug]),
    [slug]
  );

  const servers:   StreamServer[]   = Array.isArray(ep?.servers)   ? ep!.servers   : [];
  const downloads: DownloadOption[] = Array.isArray(ep?.downloads) ? ep!.downloads : [];
  const [activeServer, setActiveServer] = useState<StreamServer | null>(null);

  useEffect(() => {
    if (servers.length > 0 && !activeServer) setActiveServer(servers[0] ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { resumeState, attachRef } = useVideoProgressSaver(
    ep ? { slug: ep.slug, seriesSlug: ep.seriesSlug ?? '', title: ep.title ?? '', episodeTitle: ep.title ?? '', poster: ep.poster ?? '', type: 'hentai' } : null
  );
  useEffect(() => { if (videoRef.current) attachRef(videoRef.current); }, [attachRef]);

  const [resumeOpen, setResumeOpen] = useState(false);
  const didCheck = useRef(false);
  useEffect(() => {
    if (didCheck.current || !ep) return;
    if (resumeState.shouldResume) setResumeOpen(true);
    didCheck.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep]);

  const handleContinue = () => { if (videoRef.current) { videoRef.current.currentTime = resumeState.positionSeconds; videoRef.current.play().catch(() => {}); } };
  const handleRestart  = () => { if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play().catch(() => {}); } };

  if (loading) return <div className="max-w-screen-xl mx-auto px-4 pt-4"><SkeletonBanner /></div>;

  if (error || !ep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <p className="text-sm">{error ?? 'Episode tidak ditemukan.'}</p>
        <button onClick={() => router.back()} className="btn-ghost text-sm">← Kembali</button>
      </div>
    );
  }

  const isIframe = !activeServer?.type || activeServer.type === 'iframe';

  return (
    <div className="max-w-screen-xl mx-auto">
      <ResumeModal
        open={resumeOpen} onClose={() => setResumeOpen(false)}
        icon="🎬" title="Lanjutkan Menonton?"
        subtitle={ep.title} highlight={`Terakhir di: ${resumeState.formatted}`}
        continueLabel={`Lanjut (${resumeState.formatted})`} restartLabel="Mulai dari Awal"
        onContinue={handleContinue} onRestart={handleRestart}
      />

      <div className="w-full aspect-video bg-black relative">
        {activeServer ? (
          isIframe ? (
            <iframe key={activeServer.url} src={activeServer.url} className="w-full h-full border-0" allowFullScreen allow="autoplay; fullscreen" title={ep.title ?? 'Video'} />
          ) : (
            <video ref={videoRef} src={activeServer.url} controls className="w-full h-full" playsInline />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">Pilih server</div>
        )}
      </div>

      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-primary line-clamp-1">{ep.title}</h1>
          {ep.number != null && <p className="text-xs text-muted mt-0.5">Episode {ep.number}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {ep.prevEpisode && (
            <button onClick={() => router.push(`/hentai/episode/${ep.prevEpisode}`)} aria-label="Episode sebelumnya" className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </button>
          )}
          {ep.nextEpisode && (
            <button onClick={() => router.push(`/hentai/episode/${ep.nextEpisode}`)} aria-label="Episode berikutnya" className="w-8 h-8 flex items-center justify-center rounded-app bg-pink text-white hover:brightness-110 transition-colors">
              <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {servers.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5" aria-hidden /> Server
          </p>
          <div className="flex flex-wrap gap-2">
            {servers.map((srv, i) => (
              <button key={i} onClick={() => setActiveServer(srv)}
                className={clsx('ep-pill', activeServer?.url === srv.url && 'active')}>
                {srv.name}{srv.quality ? ` · ${srv.quality}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {downloads.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" aria-hidden /> Unduh
          </p>
          <div className="space-y-3">
            {downloads.map((opt, i) => (
              <div key={i}>
                <p className="text-xs text-secondary font-medium mb-1.5">{opt.quality}{opt.size ? ` · ${opt.size}` : ''}</p>
                <div className="flex flex-wrap gap-2">
                  {(opt.links ?? []).map((lnk, j) => (
                    <a key={j} href={lnk.url} target="_blank" rel="noopener noreferrer" className="ep-pill hover:border-cyan hover:text-cyan">{lnk.host}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
