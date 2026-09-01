'use client';
// src/context/AuthContext.tsx
// ─────────────────────────────────────────────────────────────
// Google Auth + Firestore user profile.
//
// User document structure in Firestore:
//   /users/{uid}
//     displayName: string
//     email:       string
//     photoURL:    string
//     roles:       string[]   ← e.g. ['user', '18+']
//     createdAt:   Timestamp
//
// Access rules:
//   • Hentai: requires roles to include '18+'
//   • Any logged-in user can request 18+ via profile page
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, FIREBASE_READY } from '@/lib/firebase';

// ── Types ─────────────────────────────────────────────────────
export interface UserProfile {
  uid:         string;
  displayName: string;
  email:       string;
  photoURL:    string;
  roles:       string[];   // e.g. ['user'] or ['user', '18+']
}

interface AuthContextValue {
  user:         User | null;
  profile:      UserProfile | null;
  loading:      boolean;
  /** true if user has the '18+' role */
  isAdult:      boolean;
  /** true if firebase config is missing (dev without .env) */
  configMissing: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut:          () => Promise<void>;
  /** Request 18+ role — sets role in Firestore */
  requestAdultRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Check Firebase config ─────────────────────────────────────
const CONFIG_MISSING = !FIREBASE_READY;

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdult = profile?.roles?.includes('18+') ?? false;

  // ── Fetch / create Firestore user doc ─────────────────────
  const syncProfile = useCallback(async (u: User) => {
    if (CONFIG_MISSING || !db) {
      // Fallback: build profile from Firebase Auth only (no Firestore)
      setProfile({
        uid:         u.uid,
        displayName: u.displayName ?? 'User',
        email:       u.email ?? '',
        photoURL:    u.photoURL ?? '',
        roles:       ['user'],
      });
      return;
    }
    try {
      const ref  = doc(db, 'users', u.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        setProfile({
          uid:         u.uid,
          displayName: d.displayName ?? u.displayName ?? '',
          email:       d.email       ?? u.email        ?? '',
          photoURL:    d.photoURL    ?? u.photoURL      ?? '',
          roles:       Array.isArray(d.roles) ? d.roles : ['user'],
        });
      } else {
        // First login — create doc
        const newProfile: UserProfile = {
          uid:         u.uid,
          displayName: u.displayName ?? 'User',
          email:       u.email       ?? '',
          photoURL:    u.photoURL    ?? '',
          roles:       ['user'],
        };
        await setDoc(ref, { ...newProfile, createdAt: serverTimestamp() });
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('[Auth] Firestore sync error:', err);
      // Still set basic profile from auth
      setProfile({
        uid:         u.uid,
        displayName: u.displayName ?? 'User',
        email:       u.email ?? '',
        photoURL:    u.photoURL ?? '',
        roles:       ['user'],
      });
    }
  }, []);

  // ── Listen to auth state ───────────────────────────────────
  useEffect(() => {
    if (CONFIG_MISSING || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await syncProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [syncProfile]);

  // ── Sign in ────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    if (CONFIG_MISSING || !auth) {
      alert('Firebase belum dikonfigurasi. Isi NEXT_PUBLIC_FIREBASE_* di .env.local');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('popup-closed')) console.error('[Auth] Login error:', msg);
    }
  }, []);

  // ── Sign out ───────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    }
  }, []);

  // ── Request 18+ role ──────────────────────────────────────
  const requestAdultRole = useCallback(async () => {
    if (!user || !db) return;
    try {
      const ref = doc(db, 'users', user.uid);
      const newRoles = Array.from(new Set([...(profile?.roles ?? ['user']), '18+']));
      await updateDoc(ref, { roles: newRoles });
      setProfile((prev) => prev ? { ...prev, roles: newRoles } : prev);
    } catch (err) {
      console.error('[Auth] Role update error:', err);
    }
  }, [user, profile]);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    isAdult,
    configMissing: CONFIG_MISSING,
    signInWithGoogle,
    signOut,
    requestAdultRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
