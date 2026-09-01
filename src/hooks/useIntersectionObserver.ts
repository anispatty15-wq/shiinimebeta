'use client';
// src/hooks/useIntersectionObserver.ts
// ─────────────────────────────────────────────────────────────
// Generic IntersectionObserver hook used by:
//   • ComicReader   — lazy-load page images + track active page
//   • MediaCard     — staggered entrance animations
//   • "load more"   — infinite scroll trigger
// ─────────────────────────────────────────────────────────────

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

// ── useInView ─────────────────────────────────────────────────
/**
 * Returns a ref and a boolean indicating whether the element
 * is currently intersecting the viewport.
 *
 * @param options  Standard IntersectionObserver options
 * @param once     If true, stops observing after first intersection
 */
export function useInView(
  options?: IntersectionObserverInit,
  once = false
): [RefObject<HTMLElement>, boolean] {
  const ref     = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      options
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options, once]);

  return [ref as RefObject<HTMLElement>, inView];
}

// ── useInfiniteScroll ─────────────────────────────────────────
/**
 * Calls `onLoadMore` when the sentinel element enters the viewport.
 * Use as the last element in a list to trigger pagination.
 *
 * @param onLoadMore  Callback — should fetch the next page
 * @param enabled     Gate to prevent calls when already loading / no more pages
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  enabled = true
): RefObject<HTMLDivElement> {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !enabled || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore();
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, enabled]);

  return sentinelRef as RefObject<HTMLDivElement>;
}

// ── useComicPageObserver ──────────────────────────────────────
/**
 * Observes an array of comic-page elements to:
 *   1. Lazy-load the image when the page approaches the viewport
 *   2. Report which page is currently most visible (for progress saving)
 *
 * Usage:
 *   const { containerRef, registerPage } = useComicPageObserver({
 *     onPageVisible: (pageNumber) => setCurrentPage(pageNumber),
 *   });
 *
 *   // Inside render:
 *   <div ref={(el) => registerPage(el, index + 1)}>
 *     <img data-src={url} ... />
 *   </div>
 */
interface ComicObserverOptions {
  onPageVisible?: (pageNumber: number) => void;
  preloadMargin?: string; // rootMargin for image lazy-load, default "400px"
}

export function useComicPageObserver(options: ComicObserverOptions = {}) {
  const { onPageVisible, preloadMargin = '400px 0px' } = options;

  // We keep a single observer for all pages (more efficient than N observers)
  const observerRef    = useRef<IntersectionObserver | null>(null);
  const pageMapRef     = useRef<Map<Element, number>>(new Map());
  const containerRef   = useRef<HTMLDivElement>(null);

  // Build observer once on mount
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = pageMapRef.current.get(entry.target);
          if (pageNum == null) return;

          if (entry.isIntersecting) {
            // ── 1. Lazy-load image ─────────────────────────
            const img = entry.target.querySelector<HTMLImageElement>('img[data-src]');
            if (img) {
              const src = img.dataset.src;
              if (src && img.src !== src) {
                img.src = src;
                img.removeAttribute('data-src');

                img.onload  = () => entry.target.classList.add('loaded');
                img.onerror = () => entry.target.classList.add('error');
              }
            }

            // ── 2. Track active page ───────────────────────
            onPageVisible?.(pageNum);
          }
        });
      },
      {
        rootMargin: preloadMargin,
        threshold:  0.1,
      }
    );

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [onPageVisible, preloadMargin]);

  // Register a page element with its 1-based index
  const registerPage = useCallback(
    (el: HTMLElement | null, pageNumber: number) => {
      if (!el || !observerRef.current) return;
      pageMapRef.current.set(el, pageNumber);
      observerRef.current.observe(el);
    },
    []
  );

  // Unregister (call in cleanup / unmount)
  const unregisterPage = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    pageMapRef.current.delete(el);
    observerRef.current?.unobserve(el);
  }, []);

  // Tear down everything (call when chapter changes)
  const resetObserver = useCallback(() => {
    observerRef.current?.disconnect();
    pageMapRef.current.clear();
  }, []);

  return { containerRef, registerPage, unregisterPage, resetObserver };
}
