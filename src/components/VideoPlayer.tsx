'use client';
// src/components/VideoPlayer.tsx
// ─────────────────────────────────────────────────────────────
// Smart video player that:
//   1. Detects URL type (iframe embed / M3U8 / MP4 / direct)
//   2. For iframe embeds from blocked origins → routes through
//      /api/stream-proxy to bypass X-Frame-Options
//   3. For M3U8 → routes through proxy so segments load too
//   4. For MP4 → uses native <video> element directly
//   5. Falls back gracefully with server-switch UI
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import {
  Monitor, AlertCircle, RefreshCw,
  Maximize2, ChevronDown, ShieldAlert,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { StreamServer } from '@/types/media';

// ── URL classifier ────────────────────────────────────────────
type UrlKind = 'mp4' | 'm3u8' | 'iframe';

function classifyUrl(url: string): UrlKind {
  if (!url) return 'iframe';
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'mp4';
  if (lower.endsWith('.m3u8'))                            return 'm3u8';
  return 'iframe';
}

// ── Domains that are known to block iframes (X-Frame-Options: DENY) ─
const BLOCKED_DOMAINS = [
  'nekopoi.care',
  'animekompi.web.id',
  'vidstreaming.io',
  'gogoanime',
  'kwik.si',
  'kwik.cx',
  'mega.nz',
];

function isBlockedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return BLOCKED_DOMAINS.some((d) => host.includes(d));
  } catch {
    return false;
  }
}

// ── Build proxy URL ───────────────────────────────────────────
function toProxyUrl(url: string): string {
  return `/api/stream-proxy?url=${encodeURIComponent(url)}`;
}

// ── Component ─────────────────────────────────────────────────
interface VideoPlayerProps {
  servers:         StreamServer[];
  defaultUrl?:     string;
  title?:          string;
  poster?:         string;
  onServerChange?: (server: StreamServer) => void;
}

export default function VideoPlayer({
  servers,
  defaultUrl,
  title,
  poster,
  onServerChange,
}: VideoPlayerProps) {
  // Merge defaultUrl into servers list
  const mergedServers: StreamServer[] = (() => {
    const base = Array.isArray(servers) ? servers : [];
    if (defaultUrl && !base.some((s) => s.url === defaultUrl)) {
      return [{ name: 'Server 1', url: defaultUrl }, ...base];
    }
    return base.length > 0
      ? base
      : defaultUrl
        ? [{ name: 'Server 1', url: defaultUrl }]
        : [];
  })();

  const [active,     setActive]    = useState<StreamServer | null>(mergedServers[0] ?? null);
  const [loading,    setLoading]   = useState(true);
  const [errored,    setErrored]   = useState(false);
  const [showModal,  setShowModal] = useState(false);
  const [useProxy,   setUseProxy]  = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);

  // Reset state when active server changes
  useEffect(() => {
    const first = mergedServers[0] ?? null;
    setActive(first);
    setLoading(true);
    setErrored(false);
    setUseProxy(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultUrl, JSON.stringify(servers)]);

  // Auto-enable proxy for known blocked domains
  useEffect(() => {
    if (active?.url && isBlockedDomain(active.url)) {
      setUseProxy(true);
    }
  }, [active?.url]);

  const handleSelect = (srv: StreamServer) => {
    if (srv.url === active?.url) return;
    setActive(srv);
    setLoading(true);
    setErrored(false);
    setUseProxy(isBlockedDomain(srv.url));
    setShowModal(false);
    onServerChange?.(srv);
  };

  // When iframe errors, try proxy automatically
  const handleIframeError = () => {
    if (!useProxy && active?.url) {
      setUseProxy(true);   // retry with proxy
      setLoading(true);
      setErrored(false);
    } else {
      setLoading(false);
      setErrored(true);
    }
  };

  const handleIframeLoad  = () => { setLoading(false); setErrored(false); };
  const handleVideoLoad   = () => { setLoading(false); setErrored(false); };
  const handleVideoError  = () => { setLoading(false); setErrored(true);  };

  // ── No servers ──────────────────────────────────────────────
  if (mergedServers.length === 0) {
    return (
      <div className="w-full aspect-video bg-black flex flex-col items-center justify-center gap-3 text-muted">
        <AlertCircle className="w-10 h-10 opacity-40" aria-hidden />
        <p className="text-sm text-center px-4">
          Server streaming tidak tersedia untuk episode ini.
        </p>
        <details className="text-[0.65rem] text-muted max-w-sm w-full px-4">
          <summary className="cursor-pointer hover:text-primary transition-colors text-center py-1">
            Lihat data API (debug)
          </summary>
          <pre className="mt-2 bg-surface border border-border rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap break-all text-left">
            defaultUrl: &quot;{defaultUrl || '(kosong)'}&quot;{'\n'}
            servers: {JSON.stringify(servers, null, 1)}
          </pre>
        </details>
      </div>
    );
  }

  // ── Determine what to render ─────────────────────────────────
  const activeUrl  = active?.url ?? '';
  const kind       = classifyUrl(activeUrl);
  const resolvedUrl = useProxy ? toProxyUrl(activeUrl) : activeUrl;

  return (
    <div className="w-full">
      {/* ── Player ── */}
      <div className="w-full aspect-video bg-black relative overflow-hidden">

        {/* Loading shimmer */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster} alt="" aria-hidden
                className="absolute inset-0 w-full h-full object-cover opacity-15"
              />
            )}
            <RefreshCw className="w-8 h-8 text-cyan animate-spin relative" aria-hidden />
            <p className="text-xs text-muted relative">Memuat video…</p>
            {useProxy && (
              <p className="text-[0.65rem] text-cyan/70 relative flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" aria-hidden /> Menggunakan proxy
              </p>
            )}
          </div>
        )}

        {/* Error overlay */}
        {errored && !loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/92 px-6">
            <AlertCircle className="w-10 h-10 text-orange-400" aria-hidden />
            <p className="text-sm text-secondary text-center">
              Gagal memuat server ini.
            </p>
            <div className="flex gap-2">
              {!useProxy && (
                <button
                  onClick={() => { setUseProxy(true); setLoading(true); setErrored(false); }}
                  className="flex items-center gap-1.5 text-xs btn-ghost px-3 py-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan" aria-hidden />
                  Coba via Proxy
                </button>
              )}
              {mergedServers.length > 1 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 text-xs btn-ghost px-3 py-2"
                >
                  <Monitor className="w-3.5 h-3.5" aria-hidden />
                  Ganti Server
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── MP4 / M3U8 → native <video> ── */}
        {(kind === 'mp4' || kind === 'm3u8') && activeUrl && (
          <video
            ref={videoRef}
            key={resolvedUrl}
            src={resolvedUrl}
            controls
            playsInline
            poster={poster}
            className={clsx('w-full h-full', loading ? 'opacity-0' : 'opacity-100')}
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
          />
        )}

        {/* ── iframe (embed pages) ── */}
        {kind === 'iframe' && activeUrl && (
          <iframe
            ref={iframeRef}
            key={resolvedUrl + (useProxy ? '-proxied' : '')}
            src={resolvedUrl}
            title={title ?? 'Video Player'}
            className={clsx(
              'w-full h-full border-0 transition-opacity duration-300',
              loading ? 'opacity-0' : 'opacity-100'
            )}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-pointer-lock"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}

        {/* Fullscreen button */}
        {!loading && !errored && (
          <button
            aria-label="Fullscreen"
            onClick={() => {
              const el = iframeRef.current ?? videoRef.current;
              el?.requestFullscreen?.();
            }}
            className="absolute bottom-3 right-3 z-10 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
          >
            <Maximize2 className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {/* ── Server tabs ── */}
      <div className="bg-[#0a0a10] px-4 py-2.5 flex items-center gap-2 flex-wrap border-b border-border">
        <span className="text-xs font-semibold text-muted flex items-center gap-1.5 flex-shrink-0">
          <Monitor className="w-3.5 h-3.5" aria-hidden /> Server:
        </span>

        {mergedServers.slice(0, 6).map((srv, i) => {
          const isActive = active?.url === srv.url;
          const willProxy = isBlockedDomain(srv.url) || useProxy;
          return (
            <button
              key={i}
              onClick={() => handleSelect(srv)}
              className={clsx(
                'px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1',
                isActive
                  ? 'bg-cyan text-bg border-cyan shadow-glow-c'
                  : 'bg-surface border-border text-secondary hover:border-cyan/50 hover:text-cyan'
              )}
            >
              {srv.name}
              {willProxy && (
                <ShieldAlert
                  className={clsx('w-3 h-3', isActive ? 'text-bg/70' : 'text-cyan/60')}
                  aria-label="Proxy aktif"
                />
              )}
            </button>
          );
        })}

        {mergedServers.length > 6 && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 rounded-lg text-xs font-semibold border bg-surface border-border text-secondary hover:text-primary transition-all flex items-center gap-1"
          >
            +{mergedServers.length - 6} lainnya
            <ChevronDown className="w-3 h-3" aria-hidden />
          </button>
        )}

        {/* Manual proxy toggle */}
        <button
          onClick={() => {
            setUseProxy((v) => !v);
            setLoading(true);
            setErrored(false);
          }}
          title={useProxy ? 'Nonaktifkan proxy' : 'Aktifkan proxy (jika server diblokir)'}
          className={clsx(
            'ml-auto px-2.5 py-1 rounded-lg text-[0.65rem] font-semibold border transition-all flex items-center gap-1',
            useProxy
              ? 'bg-cyan/10 border-cyan/50 text-cyan'
              : 'bg-surface border-border text-muted hover:text-secondary'
          )}
        >
          <ShieldAlert className="w-3 h-3" aria-hidden />
          {useProxy ? 'Proxy ON' : 'Proxy'}
        </button>
      </div>

      {/* ── Server selection modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm bg-surface border border-border rounded-app p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan" aria-hidden /> Pilih Server
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {mergedServers.map((srv, i) => {
                const isActive    = active?.url === srv.url;
                const willProxy   = isBlockedDomain(srv.url);
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(srv)}
                    className={clsx(
                      'w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2',
                      isActive
                        ? 'bg-cyan/10 border-cyan text-cyan'
                        : 'bg-surface-2 border-border text-secondary hover:border-cyan/40 hover:text-primary'
                    )}
                  >
                    <span className="flex-1">{srv.name}</span>
                    {willProxy && (
                      <span className="text-[0.6rem] text-cyan/70 border border-cyan/30 px-1.5 py-0.5 rounded">
                        proxy
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[0.65rem] bg-cyan text-bg px-1.5 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 btn-ghost text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
