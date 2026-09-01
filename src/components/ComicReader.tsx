'use client';
// src/components/ComicReader.tsx
// ─────────────────────────────────────────────────────────────
// Anti-lag comic page reader.
//
// Anti-lag strategy:
//  • loading="lazy" + decoding="async" — browser defers each
//    image decode off the main thread until needed.
//  • min-h-[300px] on every image container prevents layout
//    shift (CLS), keeping scroll smooth and avoiding reflow.
//  • IntersectionObserver tracks the active page number for
//    progress saving without ANY scroll event listeners.
//  • Single shared observer instance for all pages.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, List, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { ComicChapterData } from '@/types/media';

interface ComicReaderProps {
  chapter:       ComicChapterData;
  /** slug of the comic series, used to build back-link */
  seriesSlug:    string;
  /** Called whenever the visible page changes (for progress saving) */
  onPageChange?: (page: number) => void;
  /** If provided, auto-scroll to this page on mount */
  resumePage?:   number;
}

// ── Individual page component ─────────────────────────────────
interface ComicPageProps {
  src:        string;
  pageNumber: number;
  total:      number;
  onVisible:  (page: number) => void;
}

function ComicPage({ src, pageNumber, total, onVisible }: ComicPageProps) {
  const ref    = useRef<HTMLDivElement>(null);
  const [err,  setErr]    = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Register with the shared observer via a custom event or
  // directly here with a local observer on this element.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) onVisible(pageNumber); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pageNumber, onVisible]);

  return (
    <div
      ref={ref}
      id={`page-${pageNumber}`}
      data-page={pageNumber}
      className="relative w-full max-w-2xl mx-auto bg-[#111]"
      style={{ minHeight: 300 }}
    >
      {/* Shimmer placeholder */}
      {!loaded && !err && (
        <div
          className="absolute inset-0 bg-surface-2 overflow-hidden"
          style={{ minHeight: 300 }}
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent bg-[length:200%_100%] animate-shimmer" />
        </div>
      )}

      {/* Page image */}
      {!err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Halaman ${pageNumber} dari ${total}`}
          loading="lazy"
          decoding="async"
          className={clsx(
            'w-full h-auto block transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{ minHeight: 300 }}
          onLoad={() => setLoaded(true)}
          onError={() => { setErr(true); setLoaded(true); }}
        />
      ) : (
        <div
          className="w-full flex items-center justify-center text-muted text-xs py-10"
          style={{ minHeight: 300 }}
        >
          Gagal memuat halaman {pageNumber}
        </div>
      )}

      {/* Page badge */}
      <span
        aria-hidden
        className="absolute bottom-2 right-2 bg-black/60 text-secondary text-[0.65rem] font-medium px-2 py-0.5 rounded pointer-events-none"
      >
        {pageNumber} / {total}
      </span>
    </div>
  );
}

// ── Main reader ───────────────────────────────────────────────
export default function ComicReader({
  chapter,
  seriesSlug,
  onPageChange,
  resumePage,
}: ComicReaderProps) {
  const images = chapter.images ?? [];
  const total  = images.length;

  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const didResume = useRef(false);

  // Stable onVisible callback
  const handlePageVisible = useCallback((page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  }, [onPageChange]);

  // Scroll to resume page on mount (only once)
  useEffect(() => {
    if (didResume.current) return;
    if (resumePage && resumePage > 1 && resumePage <= total) {
      const el = document.getElementById(`page-${resumePage}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        didResume.current = true;
      }
    }
  // Run once after render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  const scrollToPage = (page: number) => {
    const el = document.getElementById(`page-${page}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setDrawerOpen(false);
  };

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted">
        <span className="text-4xl" aria-hidden>📭</span>
        <p className="text-sm">Halaman chapter tidak tersedia.</p>
        {seriesSlug && (
          <Link href={`/detail/comic/${seriesSlug}`} className="btn-ghost text-sm">
            ← Kembali ke detail
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── Sticky top bar ── */}
      <div className="sticky top-14 z-30 bg-bg/95 backdrop-blur border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {seriesSlug && (
            <Link
              href={`/detail/comic/${seriesSlug}`}
              aria-label="Kembali ke detail"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </Link>
          )}
          {chapter.prev_chapter_slug && (
            <Link
              href={`/read/${chapter.prev_chapter_slug}?series=${seriesSlug}`}
              aria-label="Chapter sebelumnya"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4 -translate-x-0.5" aria-hidden />
            </Link>
          )}
          <p className="text-xs font-semibold text-primary truncate max-w-[140px]">
            {chapter.title || 'Chapter'}
          </p>
          {chapter.next_chapter_slug && (
            <Link
              href={`/read/${chapter.next_chapter_slug}?series=${seriesSlug}`}
              aria-label="Chapter berikutnya"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4 translate-x-0.5" aria-hidden />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted">{currentPage} / {total}</span>
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="Daftar halaman"
            className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors"
          >
            <List className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* ── Page drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="w-52 bg-surface border-l border-border flex flex-col animate-fade-up h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="text-sm font-semibold text-primary">Halaman</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Tutup" className="text-muted hover:text-primary transition-colors">
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 gap-2">
              {Array.from({ length: total }).map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => scrollToPage(pg)}
                    aria-label={`Halaman ${pg}`}
                    className={clsx(
                      'aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all',
                      pg === currentPage
                        ? 'bg-cyan text-bg shadow-glow-c'
                        : 'bg-surface-2 text-secondary hover:bg-cyan/15 hover:text-cyan border border-border'
                    )}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Pages ── */}
      <main
        className="flex flex-col items-center gap-0.5 bg-black min-h-screen py-2"
        aria-label="Halaman komik"
      >
        {images.map((src, i) => (
          <ComicPage
            key={i}
            src={src || ''}
            pageNumber={i + 1}
            total={total}
            onVisible={handlePageVisible}
          />
        ))}
      </main>

      {/* ── Bottom navigation ── */}
      <div className="flex gap-3 justify-center py-8 px-4 bg-bg border-t border-border">
        {chapter.prev_chapter_slug ? (
          <Link
            href={`/read/${chapter.prev_chapter_slug}?series=${seriesSlug}`}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden /> Chapter Sebelumnya
          </Link>
        ) : <span />}
        {chapter.next_chapter_slug ? (
          <Link
            href={`/read/${chapter.next_chapter_slug}?series=${seriesSlug}`}
            className="btn-violet text-sm flex items-center gap-1.5"
          >
            Chapter Berikutnya <ChevronRight className="w-4 h-4" aria-hidden />
          </Link>
        ) : (
          <span className="text-xs text-muted self-center">— Ini chapter terakhir —</span>
        )}
      </div>
    </>
  );
}
