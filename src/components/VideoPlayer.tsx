'use client';
// src/components/VideoPlayer.tsx
// ─────────────────────────────────────────────────────────────
// iframe-based video player with:
//   • Server-switch tab list
//   • "Ganti Server" modal fallback
//   • loading shimmer while iframe loads
//   • proper sandbox + allowFullScreen
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { Monitor, AlertCircle, RefreshCw, Maximize2, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { StreamServer } from '@/types/media';

interface VideoPlayerProps {
  servers:       StreamServer[];
  /** direct stream_url to pre-select (may be empty) */
  defaultUrl?:   string;
  title?:        string;
  poster?:       string;
  /** Called each time the active server changes */
  onServerChange?: (server: StreamServer) => void;
}

export default function VideoPlayer({
  servers,
  defaultUrl,
  title,
  poster,
  onServerChange,
}: VideoPlayerProps) {
  // ── Merge defaultUrl as first server if not already present ──
  const mergedServers: StreamServer[] = (() => {
    const base = Array.isArray(servers) ? servers : [];
    if (defaultUrl && !base.some((s) => s.url === defaultUrl)) {
      return [{ name: 'Default', url: defaultUrl }, ...base];
    }
    return base.length > 0 ? base : defaultUrl ? [{ name: 'Default', url: defaultUrl }] : [];
  })();

  const [active,  setActive]  = useState<StreamServer | null>(mergedServers[0] ?? null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Re-sync when servers prop changes (e.g. new episode loaded)
  useEffect(() => {
    const first = mergedServers[0] ?? null;
    setActive(first);
    setLoading(true);
    setErrored(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultUrl, JSON.stringify(servers)]);

  const handleSelect = (srv: StreamServer) => {
    if (srv.url === active?.url) return;
    setActive(srv);
    setLoading(true);
    setErrored(false);
    setShowModal(false);
    onServerChange?.(srv);
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setErrored(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setErrored(true);
  };

  // ── No servers at all ────────────────────────────────────────
  if (mergedServers.length === 0) {
    return (
      <div className="w-full aspect-video bg-black flex flex-col items-center justify-center gap-3 text-muted rounded-none">
        <AlertCircle className="w-10 h-10 opacity-40" aria-hidden />
        <p className="text-sm text-center px-4">
          Server streaming tidak tersedia untuk episode ini.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── Player container ── */}
      <div className="w-full aspect-video bg-black relative overflow-hidden">
        {/* Shimmer while loading */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt={title ?? ''}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <RefreshCw className="w-8 h-8 text-cyan animate-spin" aria-hidden />
            <p className="text-xs text-muted relative">Memuat video…</p>
          </div>
        )}

        {/* Error overlay */}
        {errored && !loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/90">
            <AlertCircle className="w-10 h-10 text-orange-400" aria-hidden />
            <p className="text-sm text-secondary text-center px-6">
              Gagal memuat server ini. Coba server lain.
            </p>
            {mergedServers.length > 1 && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-ghost text-sm flex items-center gap-1.5 mt-1"
              >
                <Monitor className="w-4 h-4" aria-hidden /> Ganti Server
              </button>
            )}
          </div>
        )}

        {/* Iframe player */}
        {active?.url && (
          <iframe
            ref={iframeRef}
            key={active.url}
            src={active.url}
            title={title ?? 'Video Player'}
            className={clsx('w-full h-full border-0 transition-opacity duration-300', loading ? 'opacity-0' : 'opacity-100')}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-pointer-lock"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}

        {/* Fullscreen hint */}
        {!loading && !errored && (
          <button
            aria-label="Fullscreen"
            onClick={() => iframeRef.current?.requestFullscreen?.()}
            className="absolute bottom-3 right-3 z-10 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all"
          >
            <Maximize2 className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {/* ── Server tabs ── */}
      <div className="bg-[#0a0a10] px-4 py-3 flex items-center gap-2 flex-wrap border-b border-border">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-1.5 flex-shrink-0">
          <Monitor className="w-3.5 h-3.5" aria-hidden /> Server:
        </span>
        {mergedServers.slice(0, 5).map((srv, i) => (
          <button
            key={i}
            onClick={() => handleSelect(srv)}
            className={clsx(
              'px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
              active?.url === srv.url
                ? 'bg-cyan text-bg border-cyan shadow-glow-c'
                : 'bg-surface border-border text-secondary hover:border-cyan/50 hover:text-cyan'
            )}
          >
            {srv.name}
          </button>
        ))}
        {mergedServers.length > 5 && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 rounded-lg text-xs font-semibold border bg-surface border-border text-secondary hover:text-primary transition-all flex items-center gap-1"
          >
            +{mergedServers.length - 5} lainnya
            <ChevronDown className="w-3 h-3" aria-hidden />
          </button>
        )}
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mergedServers.map((srv, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(srv)}
                  className={clsx(
                    'w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                    active?.url === srv.url
                      ? 'bg-cyan/10 border-cyan text-cyan'
                      : 'bg-surface-2 border-border text-secondary hover:border-cyan/40 hover:text-primary'
                  )}
                >
                  {srv.name}
                  {active?.url === srv.url && (
                    <span className="ml-2 text-[0.65rem] bg-cyan text-bg px-1.5 py-0.5 rounded-full">Aktif</span>
                  )}
                </button>
              ))}
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
