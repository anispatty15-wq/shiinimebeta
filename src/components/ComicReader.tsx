'use client';
// src/components/ComicReader.tsx
// ─────────────────────────────────────────────────────────────
// Anti-lag comic page reader.
//
// Performance strategy
// ──────────────────────────────────────────────────────────────
// 1. Every <img> uses loading="lazy" + decoding="async" so the
//    browser defers decode off the main thread.
// 2. A single IntersectionObserver (via useComicPageObserver)
//    fires the data-src → src swap only when a page is ~400px
//    from the viewport — preventing up-front network burst.
// 3. Each .comic-page wrapper has a min-height of 300px so the
//    layout doesn't shift when images load, keeping scrolling
//    smooth and preventing reflow jank.
// 4. The observer also reports which page is currently visible,
//    letting useComicProgressSaver throttle-save progress every
//    2 s without any scroll event listeners.
// 5. ResumeModal is shown once on mount if lastPage > 1.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, List, X } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useComicPageObserver } from '@/hooks/useIntersectionObserver';
import { useComicProgressSaver, type ComicMeta } from '@/context/HistoryContext';
import ResumeModal from './ResumeModal';

// ── Types ─────────────────────────────────────────────────────
interface ComicReaderProps {
  pages:       string[];   // array of image URLs
  meta:        ComicMeta;
  prevChapter?: string | null;
  nextChapter?: string | null;
  /** Base path for chapter navigation links, e.g. "/comic/chapter" */
  chapterBase?: string;
}

// ── ComicPage ─────────────────────────────────────────────────
interface ComicPageProps {
  url:        string;
  pageNumber: number;
  total:      number;
  onRegister: (el: HTMLElement | null, page: number) => void;
}

function ComicPage({ url, pageNumber, total, onRegister }: ComicPageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    onRegister(el, pageNumber);
    return () => onRegister(null, pageNumber);
  // Register once per page — onRegister is stable (useCallback)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  return (
    <div
      ref={wrapRef}
      id={`comic-page-${pageNumber}`}
      data-page={pageNumber}
      className="comic-page w-full max-w-2xl mx-auto relative"
      // Reserve minimum height to prevent layout shift
      style={{ minHeight: 300 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-src={url}
        src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAI="
        alt={`Halaman ${pageNumber} dari ${total}`}
        loading="lazy"
        decoding="async"
        className="w-full h-auto block"
        style={{ minHeight: 300 }}
      />
      {/* Page number badge */}
      <span
        aria-hidden="true"
        className="absolute bottom-2 right-2 bg-black/60 text-secondary text-[0.65rem] font-medium px-2 py-0.5 rounded pointer-events-none"
      >
        {pageNumber} / {total}
      </span>
    </div>
  );
}

// ── ComicReader (main) ────────────────────────────────────────
export default function ComicReader({
  pages,
  meta,
  prevChapter,
  nextChapter,
  chapterBase = '/comic/chapter',
}: ComicReaderProps) {
  const totalPages = pages.length;

  // ── Progress & resume ───────────────────────────────────────
  const { currentPage, setCurrentPage, resumeState } =
    useComicProgressSaver({ ...meta, totalPages });

  const [resumeOpen, setResumeOpen] = useState(false);
  const didShowResume = useRef(false);

  useEffect(() => {
    if (didShowResume.current) return;
    if (resumeState.shouldResume && resumeState.lastPage > 1) {
      setResumeOpen(true);
      didShowResume.current = true;
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll-to-page ──────────────────────────────────────────
  const scrollToPage = useCallback((page: number) => {
    const el = document.getElementById(`comic-page-${page}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // ── IntersectionObserver ────────────────────────────────────
  const { registerPage } = useComicPageObserver({
    onPageVisible: useCallback(
      (pageNum: number) => setCurrentPage(pageNum),
      [setCurrentPage]
    ),
    preloadMargin: '400px 0px',
  });

  // ── Chapter drawer (page list) ──────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Empty state ─────────────────────────────────────────────
  if (!pages || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3">
        <span className="text-4xl" aria-hidden>📭</span>
        <p className="text-sm font-medium">Halaman chapter tidak tersedia.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Resume Modal ── */}
      <ResumeModal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        icon="📖"
        title="Lanjutkan Membaca?"
        subtitle={meta.chapterTitle ?? ''}
        highlight={`Halaman ${resumeState.lastPage}`}
        continueLabel={`Lanjut (Hal. ${resumeState.lastPage})`}
        restartLabel="Mulai dari Hal. 1"
        onContinue={() => scrollToPage(resumeState.lastPage)}
        onRestart={() => scrollToPage(1)}
      />

      {/* ── Top bar ── */}
      <div className="sticky top-14 z-30 flex items-center justify-between px-4 py-2.5 bg-bg/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          {prevChapter && (
            <Link
              href={`${chapterBase}/${prevChapter}`}
              aria-label="Chapter sebelumnya"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </Link>
          )}
          <span className="text-xs font-medium text-secondary truncate">
            {meta.chapterTitle ?? `Chapter`}
          </span>
          {nextChapter && (
            <Link
              href={`${chapterBase}/${nextChapter}`}
              aria-label="Chapter berikutnya"
              className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="Daftar halaman"
            className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors"
          >
            <List className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* ── Page list drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="w-56 bg-surface border-l border-border flex flex-col animate-slide-up h-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-primary">Daftar Halaman</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Tutup" className="text-muted hover:text-primary transition-colors">
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 gap-2">
              {pages.map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => { scrollToPage(pg); setDrawerOpen(false); }}
                    aria-label={`Halaman ${pg}`}
                    className={clsx(
                      'aspect-square flex items-center justify-center rounded-app text-xs font-semibold transition-all',
                      pg === currentPage
                        ? 'bg-cyan text-bg shadow-glow-c'
                        : 'bg-surface-2 text-secondary hover:bg-cyan/15 hover:text-cyan'
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
      <main className="comic-reader" aria-label="Halaman komik">
        {pages.map((url, i) => (
          <ComicPage
            key={i}
            url={url ?? ''}
            pageNumber={i + 1}
            total={totalPages}
            onRegister={registerPage}
          />
        ))}
      </main>

      {/* ── Chapter navigation footer ── */}
      <div className="flex gap-3 justify-center py-8 px-4">
        {prevChapter ? (
          <Link href={`${chapterBase}/${prevChapter}`} className="btn-ghost text-sm flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" aria-hidden /> Chapter Sebelumnya
          </Link>
        ) : (
          <span />
        )}
        {nextChapter ? (
          <Link href={`${chapterBase}/${nextChapter}`} className="btn-primary text-sm flex items-center gap-1.5">
            Chapter Berikutnya <ChevronRight className="w-4 h-4" aria-hidden />
          </Link>
        ) : (
          <span className="text-sm text-muted self-center">Ini chapter terakhir</span>
        )}
      </div>
    </>
  );
}
