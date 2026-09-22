'use client';
// src/app/read/[slug]/page.tsx
// Comic chapter reader screen.
// Query params:
//   series = series slug (for back-link and progress saving)

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ComicAPI } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import ComicReader from '@/components/ComicReader';
import ResumeModal from '@/components/ResumeModal';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import { useComicProgressSaver } from '@/context/HistoryContext';
import { markWatched } from '@/utils/watchedSlug';
import type { ComicChapterData } from '@/types/media';

// ── Inner component (uses useSearchParams → needs Suspense) ───
function ReadContent() {
  const { slug }   = useParams<{ slug: string }>();
  const sp         = useSearchParams();
  const seriesSlug = sp.get('series') ?? '';

  // ── Fetch chapter ──────────────────────────────────────────
  const { data: chapter, loading, error } = useApi(
    useCallback(() => ComicAPI.readChapter(slug ?? ''), [slug]),
    [slug]
  );

  const safeChapter: ComicChapterData = chapter ?? {
    title:             '',
    images:            [],
    prev_chapter_slug: '',
    next_chapter_slug: '',
  };

  // ── Comic reading progress ─────────────────────────────────
  const { currentPage, setCurrentPage, resumeState } = useComicProgressSaver(
    slug
      ? {
          slug,
          seriesSlug,
          title:        safeChapter.title,
          chapterTitle: safeChapter.title,
          poster:       '',
          totalPages:   safeChapter.images.length,
        }
      : null
  );

  // Mark chapter as read when page loads
  useEffect(() => {
    if (slug) markWatched(slug);
  }, [slug]);

  // ── Resume modal ───────────────────────────────────────────
  const [resumeOpen, setResumeOpen] = useState(false);
  const [didCheck,   setDidCheck]   = useState(false);

  useEffect(() => {
    if (didCheck || loading || !chapter) return;
    if (resumeState.shouldResume && resumeState.lastPage > 1) {
      setResumeOpen(true);
    }
    setDidCheck(true);
  }, [chapter, didCheck, loading, resumeState]);

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <SkeletonGrid count={4} />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted gap-3 px-4">
        <span className="text-4xl" aria-hidden>😵</span>
        <p className="text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Resume modal */}
      <ResumeModal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        icon="📖"
        title="Lanjutkan Membaca?"
        subtitle={safeChapter.title}
        highlight={`Halaman ${resumeState.lastPage}`}
        continueLabel={`Lanjut (Hal. ${resumeState.lastPage})`}
        restartLabel="Mulai dari Halaman 1"
        onContinue={() => {
          // scroll is handled inside ComicReader via resumePage prop
          setResumeOpen(false);
        }}
        onRestart={() => {
          setCurrentPage(1);
          setResumeOpen(false);
        }}
      />

      {/* Comic reader */}
      <ComicReader
        chapter={safeChapter}
        seriesSlug={seriesSlug}
        onPageChange={setCurrentPage}
        resumePage={resumeState.shouldResume ? resumeState.lastPage : undefined}
      />
    </>
  );
}

// ── Suspense fallback ─────────────────────────────────────────
function ReadFallback() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <SkeletonGrid count={4} />
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────
export default function ReadPage() {
  return (
    <Suspense fallback={<ReadFallback />}>
      <ReadContent />
    </Suspense>
  );
}
