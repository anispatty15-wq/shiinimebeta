// src/lib/firebase.ts
// ─────────────────────────────────────────────────────────────
// Firebase client SDK — lazy initialisation.
//
// Config is fetched from /api/firebase-config (server-side env)
// so API keys are NOT exposed in the JS bundle.
// ─────────────────────────────────────────────────────────────

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth,  GoogleAuthProvider, type Auth }   from 'firebase/auth';
import { getFirestore, type Firestore }               from 'firebase/firestore';

let app:  FirebaseApp | null = null;
let auth: Auth       | null  = null;
let db:   Firestore  | null  = null;
let initPromise: Promise<void> | null = null;

export const googleProvider = new GoogleAuthProvider();
export let   FIREBASE_READY = false;

// ── Initialise once — fetches config from server route ────────
export async function initFirebase(): Promise<void> {
  if (FIREBASE_READY) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch('/api/firebase-config');
      if (!res.ok) throw new Error('Firebase config not available');
      const config = await res.json();
      if (!config.apiKey) throw new Error('Empty Firebase config');

      const _app = getApps().length ? getApps()[0]! : initializeApp(config);
      app  = _app;
      auth = getAuth(_app);
      db   = getFirestore(_app);
      FIREBASE_READY = true;
    } catch (err) {
      console.warn('[Firebase] Init failed:', err);
      FIREBASE_READY = false;
    }
  })();

  return initPromise;
}

// Getters — call initFirebase() first
export function getFirebaseAuth():      Auth       | null { return auth; }
export function getFirebaseDb():        Firestore  | null { return db;   }
export function getFirebaseApp():       FirebaseApp | null { return app;  }

// Legacy named exports for compatibility
export { app, auth, db };
