'use client';
// src/app/hentai/episode/[slug]/page.tsx — Hentai Video Player

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Download, Monitor, AlertCircle, Code2 } from 'lucide-react';
import { clsx } from 'clsx';
import { HentaiAPI } from '@/lib/apiClient';
import { useApi } from '@/hooks/useApi';
import { useVideoProgressSaver } from '@/context/HistoryContext';
import ResumeModal from '@/components/ResumeModal';
import { SkeletonBanner } from '@/components/SkeletonLoader';

function getStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== '') return String(v);
  }
  return '';
}
function getArr(obj: Record<string, unknown>, ...keys: string[]): unknown[] {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  return [];
}

interface Server { name: string; url: string; quality?: string; isIframe: boolean; }
interface DlGroup { quality: string; size?: string; links: { host: string; url: string }[]; }

function extractServers(raw: Record<string, unknown>): Server[] {
  const arr = getArr(raw, 'servers', 'streamingLinks', 'streaming', 'links', 'mirror', 'mirrors', 'players', 'sources', 'videos');

  if (arr.length > 0) {
    return arr.flatMap((s) => {
      const item = s as Record<string, unknown>;
      const nested = getArr(item, 'servers', 'links', 'sources');
      if (nested.length > 0) {
        return nested.map((n) => {
          const ni = n as Record<string, unknown>;
          const url = getStr(ni, 'url', 'link', 'src', 'file', 'iframe', 'embed');
          return {
            name:     getStr(ni, 'name', 'server', 'host', 'label') || getStr(item, 'quality', 'label', 'name') || 'Server',
            url,
            quality:  getStr(item, 'quality', 'resolution') || getStr(ni, 'quality'),
            isIframe: !ni.type || ni.type === 'iframe' || ni.type === 'embed',
          };
        }).filter((s) => s.url);
      }
      const url = getStr(item, 'url', 'link', 'src', 'file', 'iframe', 'embed', 'streamUrl');
      if (!url) return [];
      return [{
        name:     getStr(item, 'name', 'server', 'host', 'label') || 'Server',
        url,
        quality:  getStr(item, 'quality', 'resolution'),
        isIframe: !item.type || item.type === 'iframe' || item.type === 'embed',
      }];
    });
  }

  const directUrl = getStr(raw, 'url', 'link', 'src', 'file', 'iframe', 'embed', 'streamUrl', 'videoUrl');
  if (directUrl) return [{ name: 'Server 1', url: directUrl, isIframe: true }];
  return [];
}

function extractDownloads(raw: Record<string, unknown>): DlGroup[] {
  const arr = getArr(raw, 'downloads', 'download', 'downloadLinks', 'dl');
  return arr.map((d) => {
    const item = d as Record<string, unknown>;
    const linksRaw = getArr(item, 'links', 'urls', 'hosts', 'mirrors');
    return {
      quality: getStr(item, 'quality', 'resolution', 'label') || 'Download',
      size:    getStr(item, 'size', 'filesize') || undefined,
      links: linksRaw.map((l) => {
        const li = l as Record<string, unknown>;
        return {
          host: getStr(li, 'host', 'name', 'label', 'server') || 'Download',
          url:  getStr(li, 'url', 'link', 'href', 'src'),
        };
      }).filter((l) => l.url),
    };
  }).filter((g) => g.links.length > 0);
}

export default function HentaiEpisodePage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const [showDebug, setShowDebug] = useState(false);

  const { data: rawEp, loading, error } = useApi(
    useCallback(() => HentaiAPI.getEpisode(slug ?? ''), [slug]),
    [slug]
  );

  const ep = rawEp ? (rawEp as unknown as Record<string, unknown>) : null;

  const title       = ep ? getStr(ep, 'title', 'episodeTitle', 'name') : '';
  const number      = ep ? getStr(ep, 'number', 'episode', 'ep') : '';
  const poster      = ep ? getStr(ep, 'poster', 'image', 'thumbnail', 'cover') : '';
  const prevEpisode = ep ? getStr(ep, 'prevEpisode', 'prevSlug', 'prev') : '';
  const nextEpisode = ep ? getStr(ep, 'nextEpisode', 'nextSlug', 'next') : '';
  const seriesSlug  = ep ? getStr(ep, 'seriesSlug', 'parent', 'series') : '';
  const servers     = ep ? extractServers(ep) : [];
  const downloads   = ep ? extractDownloads(ep) : [];

  const [activeServer, setActiveServer] = useState<Server | null>(null);
  useEffect(() => {
    if (servers.length > 0 && !activeServer) setActiveServer(servers[0] ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawEp]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { resumeState, attachRef } = useVideoProgressSaver(
    ep && slug ? { slug, seriesSlug, title, episodeTitle: title, poster, type: 'hentai' } : null
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

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        <SkeletonBanner />
        <div className="mt-4 space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-app bg-surface animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error || !ep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <AlertCircle className="w-10 h-10 text-muted" aria-hidden />
        <p className="text-sm text-center">{error ?? 'Episode tidak ditemukan.'}</p>
        <button onClick={() => router.back()} className="btn-ghost text-sm">← Kembali</button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <ResumeModal
        open={resumeOpen} onClose={() => setResumeOpen(false)}
        icon="🎬" title="Lanjutkan Menonton?" subtitle={title}
        highlight={`Terakhir di: ${resumeState.formatted}`}
        continueLabel={`Lanjut (${resumeState.formatted})`} restartLabel="Mulai dari Awal"
        onContinue={() => { if (videoRef.current) { videoRef.current.currentTime = resumeState.positionSeconds; videoRef.current.play().catch(() => {}); } }}
        onRestart={() => { if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play().catch(() => {}); } }}
      />

      {/* Player */}
      <div className="w-full aspect-video bg-black relative">
        {activeServer ? (
          activeServer.isIframe ? (
            <iframe
              key={activeServer.url} src={activeServer.url}
              className="w-full h-full border-0" allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              title={title || 'Video'}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
          ) : (
            <video ref={videoRef} src={activeServer.url} controls className="w-full h-full" playsInline />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
            <Monitor className="w-8 h-8 opacity-40" aria-hidden />
            <p className="text-sm">Pilih server di bawah</p>
          </div>
        )}
      </div>

      {/* Info + nav */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-primary line-clamp-2">{title || slug?.replace(/-/g, ' ')}</h1>
          {number && <p className="text-xs text-muted mt-0.5">Episode {number}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {prevEpisode && (
            <button onClick={() => router.push(`/hentai/episode/${prevEpisode}`)} aria-label="Episode sebelumnya"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </button>
          )}
          {nextEpisode && (
            <button onClick={() => router.push(`/hentai/episode/${nextEpisode}`)} aria-label="Episode berikutnya"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-pink text-white hover:brightness-110 transition-colors">
              <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          )}
          {seriesSlug && (
            <button onClick={() => router.push(`/hentai/${seriesSlug}`)}
              className="px-3 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-xs text-secondary hover:text-primary transition-colors">
              Info
            </button>
          )}
        </div>
      </div>

      {/* Server tabs */}
      <div className="px-4 pb-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" aria-hidden /> Server
        </p>
        {servers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {servers.map((srv, i) => (
              <button key={i} onClick={() => setActiveServer(srv)}
                className={clsx('ep-pill', activeServer?.url === srv.url && 'active')}>
                {srv.name}{srv.quality ? ` · ${srv.quality}` : ''}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">API tidak mengembalikan link streaming.</p>
        )}
      </div>

      {/* Downloads */}
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
                  {opt.links.map((lnk, j) => (
                    <a key={j} href={lnk.url} target="_blank" rel="noopener noreferrer" className="ep-pill hover:border-cyan hover:text-cyan">{lnk.host}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug (dev only) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="px-4 pb-8">
          <button onClick={() => setShowDebug((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors">
            <Code2 className="w-3.5 h-3.5" aria-hidden />
            {showDebug ? 'Sembunyikan' : 'Tampilkan'} raw API response
          </button>
          {showDebug && (
            <pre className="mt-3 text-[0.68rem] text-secondary bg-surface border border-border rounded-app p-3 overflow-x-auto max-h-96">
              {JSON.stringify(ep, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
