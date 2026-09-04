'use client';
// src/context/HistoryContext.tsx
// ─────────────────────────────────────────────────────────────
// Provides watch & read history state across the app.
// Hydration-safe: localStorage only touched after mount.
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { WatchHistory, ReadHistory, formatTime } from '@/utils/storage';
import type { WatchEntry, ReadEntry } from '@/types/media';

// ── Context shape ─────────────────────────────────────────────
interface HistoryContextValue {
  // Watch history
  watchHistory:      WatchEntry[];
  saveWatchProgress: (entry: Omit<WatchEntry, 'updatedAt'>) => void;
  markWatchComplete: (slug: string) => void;
  removeWatch:       (slug: string) => void;
  clearWatch:        () => void;
  checkVideoResume:  (slug: string) => { shouldResume: boolean; positionSeconds: number; formatted: string };
  updateWatchPoster: (slug: string, poster: string) => void;

  // Read history
  readHistory:       ReadEntry[];
  saveReadProgress:  (entry: Omit<ReadEntry, 'updatedAt'>) => void;
  markReadComplete:  (slug: string) => void;
  removeRead:        (slug: string) => void;
  clearRead:         () => void;
  checkComicResume:  (slug: string) => { shouldResume: boolean; lastPage: number; totalPages: number };

  hydrated: boolean;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────
export function HistoryProvider({ children }: { children: ReactNode }) {
  const [watchHistory, setWatchHistory] = useState<WatchEntry[]>([]);
  const [readHistory,  setReadHistory]  = useState<ReadEntry[]>([]);
  const [hydrated,     setHydrated]     = useState(false);

  useEffect(() => {
    setWatchHistory(WatchHistory.getAll());
    setReadHistory(ReadHistory.getAll());
    setHydrated(true);
  }, []);

  // ── Watch ──────────────────────────────────────────────────
  const saveWatchProgress = useCallback(
    (entry: Omit<WatchEntry, 'updatedAt'>) => {
      WatchHistory.save(entry);
      setWatchHistory(WatchHistory.getAll());
    },
    []
  );

  const markWatchComplete = useCallback((slug: string) => {
    WatchHistory.markCompleted(slug);
    setWatchHistory(WatchHistory.getAll());
  }, []);

  const removeWatch = useCallback((slug: string) => {
    WatchHistory.remove(slug);
    setWatchHistory(WatchHistory.getAll());
  }, []);

  const clearWatch = useCallback(() => {
    WatchHistory.clear();
    setWatchHistory([]);
  }, []);

  const checkVideoResume = useCallback(
    (slug: string) => WatchHistory.checkResume(slug),
    []
  );

  const updateWatchPoster = useCallback((slug: string, poster: string) => {
    WatchHistory.updatePoster(slug, poster);
    setWatchHistory(WatchHistory.getAll());
  }, []);

  // ── Read ───────────────────────────────────────────────────
  const saveReadProgress = useCallback(
    (entry: Omit<ReadEntry, 'updatedAt'>) => {
      ReadHistory.save(entry);
      setReadHistory(ReadHistory.getAll());
    },
    []
  );

  const markReadComplete = useCallback((slug: string) => {
    ReadHistory.markCompleted(slug);
    setReadHistory(ReadHistory.getAll());
  }, []);

  const removeRead = useCallback((slug: string) => {
    ReadHistory.remove(slug);
    setReadHistory(ReadHistory.getAll());
  }, []);

  const clearRead = useCallback(() => {
    ReadHistory.clear();
    setReadHistory([]);
  }, []);

  const checkComicResume = useCallback(
    (slug: string) => ReadHistory.checkResume(slug),
    []
  );

  const value: HistoryContextValue = {
    watchHistory,
    saveWatchProgress,
    markWatchComplete,
    removeWatch,
    clearWatch,
    checkVideoResume,
    updateWatchPoster,

    readHistory,
    saveReadProgress,
    markReadComplete,
    removeRead,
    clearRead,
    checkComicResume,

    hydrated,
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────
export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error('useHistory must be used inside <HistoryProvider>');
  }
  return ctx;
}

// ── Video progress saver hook ─────────────────────────────────
/**
 * Attach to a <video> element.
 * Saves position every 5 seconds (throttled).
 * Marks complete on 'ended'.
 * Returns { resumeState, attachRef }.
 */
export interface VideoMeta {
  slug:          string;
  seriesSlug?:   string;
  title?:        string;
  episodeTitle?: string;
  poster?:       string;
  type?:         'anime' | 'hentai';
}

export function useVideoProgressSaver(meta: VideoMeta | null) {
  const { saveWatchProgress, markWatchComplete, checkVideoResume } = useHistory();
  const INTERVAL   = 5000;
  const lastSaveTs = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const resumeState = useState(() => {
    if (!meta?.slug) return { shouldResume: false, positionSeconds: 0, formatted: '0:00' };
    return checkVideoResume(meta.slug);
  })[0];

  const attachRef = useCallback(
    (videoEl: HTMLVideoElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (!videoEl || !meta?.slug) return;

      const onTimeUpdate = () => {
        const now = Date.now();
        if (now - lastSaveTs.current < INTERVAL) return;
        lastSaveTs.current = now;
        saveWatchProgress({
          slug:            meta.slug,
          seriesSlug:      meta.seriesSlug   ?? '',
          title:           meta.title        ?? '',
          episodeTitle:    meta.episodeTitle  ?? '',
          poster:          meta.poster        ?? '',
          type:            meta.type === 'hentai' ? 'hentai' : 'anime',
          positionSeconds: Math.floor(videoEl.currentTime ?? 0),
          durationSeconds: isFinite(videoEl.duration) ? Math.floor(videoEl.duration) : 0,
          completed:       false,
        });
      };

      const onEnded = () => markWatchComplete(meta.slug);

      videoEl.addEventListener('timeupdate', onTimeUpdate);
      videoEl.addEventListener('ended',      onEnded);
      cleanupRef.current = () => {
        videoEl.removeEventListener('timeupdate', onTimeUpdate);
        videoEl.removeEventListener('ended',      onEnded);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meta?.slug]
  );

  useEffect(() => () => { cleanupRef.current?.(); }, []);

  return { resumeState, attachRef, formatTime };
}

// ── Comic page tracker hook ───────────────────────────────────
/**
 * Tracks the currently visible page in the comic reader.
 * Saves to ReadHistory every 2 s (debounced).
 */
export interface ComicMeta {
  slug:          string;
  seriesSlug?:   string;
  title?:        string;
  chapterTitle?: string;
  poster?:       string;
  totalPages:    number;
}

export function useComicProgressSaver(meta: ComicMeta | null) {
  const { saveReadProgress, checkComicResume } = useHistory();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resumeState = useState(() => {
    if (!meta?.slug) return { shouldResume: false, lastPage: 1, totalPages: 0 };
    return checkComicResume(meta.slug);
  })[0];

  const [currentPage, setCurrentPageState] = useState(1);

  const setCurrentPage = useCallback(
    (page: number) => {
      if (!meta?.slug || page < 1) return;
      setCurrentPageState(page);
      
      // Clear existing timer
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      
      // If last page, save immediately. Otherwise debounce
      const isLastPage = page >= meta.totalPages;
      const delay = isLastPage ? 500 : 2000; // Fast save on completion
      
      saveTimerRef.current = setTimeout(() => {
        saveReadProgress({
          slug:         meta.slug,
          seriesSlug:   meta.seriesSlug  ?? '',
          title:        meta.title        ?? '',
          chapterTitle: meta.chapterTitle ?? '',
          poster:       meta.poster       ?? '',
          lastPage:     page,
          totalPages:   meta.totalPages,
          completed:    isLastPage,
        });
        
        // Also mark as watched immediately on completion
        if (isLastPage) {
          const { markWatched } = require('@/utils/watchedSlug');
          markWatched(meta.slug);
          console.log(`[ComicProgress] ✅ Marked chapter ${meta.slug} as completed`);
        }
      }, delay);
    },
    [meta, saveReadProgress]
  );

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  return { currentPage, setCurrentPage, resumeState };
}
