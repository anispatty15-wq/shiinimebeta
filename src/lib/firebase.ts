// src/lib/firebase.ts
// ─────────────────────────────────────────────────────────────
// Firebase Web SDK initialisation.
//
// SECURITY NOTE:
// Firebase Web API keys are NOT secrets — they are identifiers.
// Real security comes from Firestore Rules + Auth domain restrictions.
// See: https://firebase.google.com/docs/projects/api-keys
//
// To prevent misuse from other domains:
//   1. Google Cloud Console → APIs & Services → Credentials
//      → Restrict API key to HTTP referrers:
//        - shiinimebeta.vercel.app/*
//        - localhost:3000/*
//   2. Firebase Console → Authentication → Authorized domains
//      → Only add your domains
//   3. Firestore Rules restrict who can read/write data
// ─────────────────────────────────────────────────────────────

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth,  GoogleAuthProvider, type Auth }   from 'firebase/auth';
import { getFirestore, type Firestore }               from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY             ?? '',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         ?? '',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID          ?? '',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID              ?? '',
};

let app:  FirebaseApp | null = null;
let auth: Auth        | null = null;
let db:   Firestore   | null = null;

if (firebaseConfig.apiKey) {
  const _app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  app  = _app;
  auth = getAuth(_app);
  db   = getFirestore(_app);
}

export { app, auth, db };
export const googleProvider = new GoogleAuthProvider();
export const FIREBASE_READY = Boolean(firebaseConfig.apiKey);
// Legacy compat
export async function initFirebase() { /* no-op, already initialised above */ }
