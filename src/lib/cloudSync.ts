// src/lib/cloudSync.ts
// ─────────────────────────────────────────────────────────────
// Syncs localStorage data to Firestore when user is logged in.
//
// Firestore paths:
//   /userData/{uid}/watchHistory   → array (last 200)
//   /userData/{uid}/bookmarks      → array (last 500)
//   /userData/{uid}/watchedSlugs   → array (last 1000)
//
// Strategy: MERGE local + cloud (union), no deletion.
// Called once on login and before tab close.
// ─────────────────────────────────────────────────────────────

import {
  doc, getDoc, setDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WatchHistory, Bookmarks } from '@/utils/storage';
import { getWatchedSlugs, mergeWatchedSlugs } from '@/utils/watchedSlug';
import type { ContentType } from '@/types/media';

const CONTENT_TYPES: ContentType[] = ['anime', 'hentai', 'comic'];

/** Upload local data to Firestore */
export async function pushToCloud(uid: string): Promise<void> {
  if (!db || !uid) return;
  try {
    const ref = doc(db, 'userData', uid);
    await setDoc(ref, {
      watchHistory:  WatchHistory.getAll().slice(0, 200),
      bookmarks:     CONTENT_TYPES.flatMap((t) => Bookmarks.getAll(t)).slice(0, 500),
      watchedSlugs:  Array.from(getWatchedSlugs()).slice(0, 1000),
      syncedAt:      new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[CloudSync] Push failed:', err);
  }
}

/** Download cloud data and merge into localStorage */
export async function pullFromCloud(uid: string): Promise<void> {
  if (!db || !uid) return;
  try {
    const ref  = doc(db, 'userData', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();

    // Merge watch history
    if (Array.isArray(data.watchHistory)) {
      for (const entry of data.watchHistory) {
        WatchHistory.save(entry);
      }
    }

    // Merge bookmarks
    if (Array.isArray(data.bookmarks)) {
      for (const bm of data.bookmarks) {
        if (bm?.slug && bm?.type) {
          Bookmarks.add(bm);
        }
      }
    }

    // Merge watched slugs
    if (Array.isArray(data.watchedSlugs)) {
      mergeWatchedSlugs(data.watchedSlugs);
    }
  } catch (err) {
    console.warn('[CloudSync] Pull failed:', err);
  }
}
