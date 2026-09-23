// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => value.trim().length > 0);
const app: FirebaseApp = hasFirebaseConfig
  ? (getApps().length ? getApps()[0]! : initializeApp(firebaseConfig))
  : (null as unknown as FirebaseApp);
// Keep the existing non-null exports for consumers; runtime entry points are
// gated by FIREBASE_READY before using them when deployment env is incomplete.
const auth: Auth = app ? getAuth(app) : (null as unknown as Auth);
const db: Firestore = app ? getFirestore(app) : (null as unknown as Firestore);

export { app, auth, db };
export const googleProvider = new GoogleAuthProvider();
export const FIREBASE_READY = hasFirebaseConfig;
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export async function initFirebase() { /* no-op */ }
