// src/lib/firebase.ts
// ─────────────────────────────────────────────────────────────
// Firebase client SDK — safe initialisation.
// If env vars are missing (build/dev without .env.local),
// we skip init and export null stubs so the app still builds.
// ─────────────────────────────────────────────────────────────

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth,  GoogleAuthProvider, type Auth }   from 'firebase/auth';
import { getFirestore, type Firestore }               from 'firebase/firestore';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';

// ── Stub values when config is missing ───────────────────────
// This prevents "auth/invalid-api-key" crash during next build.
let app:  FirebaseApp | null  = null;
let auth: Auth | null         = null;
let db:   Firestore | null    = null;

if (API_KEY) {
  const firebaseConfig = {
    apiKey:            API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? '',
  };
  const _app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  app  = _app;
  auth = getAuth(_app);
  db   = getFirestore(_app);
}

export { app, auth, db };
export const googleProvider = new GoogleAuthProvider();
export const FIREBASE_READY = Boolean(API_KEY);
