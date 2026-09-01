'use client';
// src/context/AuthContext.tsx
// ─────────────────────────────────────────────────────────────
// Firestore user document structure:
//   /users/{uid}
//     displayName:    string
//     email:          string
//     photoURL:       string
//     roles:          string[]   ['user'] | ['user','18+'] | ['user','admin']
//     adultStatus:    'none' | 'pending' | 'approved' | 'rejected'
//     adultRequestAt: Timestamp  (when user submitted request)
//     createdAt:      Timestamp
//
// Admin doc:  /admins/{uid}  { uid, email }
//   → Only these UIDs can approve/reject 18+ requests
//
// Role flow:
//   user clicks "Request 18+"
//     → adultStatus = 'pending'
//   admin approves
//     → roles += '18+', adultStatus = 'approved'
//   admin rejects
//     → adultStatus = 'rejected'
// ─────────────────────────────────────────────────────────────

import {
  createContext, useCallback, useContext,
  useEffect, useState, type ReactNode,
} from 'react';
import {
  onAuthStateChanged, signInWithPopup,
  signOut as firebaseSignOut, type User,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, FIREBASE_READY } from '@/lib/firebase';

// ── Types ─────────────────────────────────────────────────────
export type AdultStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid:          string;
  displayName:  string;
  email:        string;
  photoURL:     string;
  roles:        string[];
  adultStatus:  AdultStatus;
  isAdmin:      boolean;
}

interface AuthContextValue {
  user:             User | null;
  profile:          UserProfile | null;
  loading:          boolean;
  isAdult:          boolean;
  isAdmin:          boolean;
  adultStatus:      AdultStatus;
  configMissing:    boolean;
  signInWithGoogle: () => Promise<void>;
  signOut:          () => Promise<void>;
  /** Submit 18+ request → sets adultStatus = 'pending' */
  requestAdultRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const CONFIG_MISSING = !FIREBASE_READY;

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdult     = profile?.roles?.includes('18+')   ?? false;
  const isAdmin     = profile?.isAdmin                   ?? false;
  const adultStatus = profile?.adultStatus               ?? 'none';

  // ── Sync Firestore user doc ───────────────────────────────
  const syncProfile = useCallback(async (u: User) => {
    if (CONFIG_MISSING || !db) {
      setProfile({ uid: u.uid, displayName: u.displayName ?? 'User',
        email: u.email ?? '', photoURL: u.photoURL ?? '',
        roles: ['user'], adultStatus: 'none', isAdmin: false });
      return;
    }
    try {
      const userRef  = doc(db, 'users', u.uid);
      const adminRef = doc(db, 'admins', u.uid);

      // Fetch both in parallel — adminRef may fail if rules block it,
      // so we catch individually
      const [snap, adminSnap] = await Promise.allSettled([
        getDoc(userRef),
        getDoc(adminRef),
      ]);

      const userSnap  = snap.status      === 'fulfilled' ? snap.value      : null;
      const adminDoc  = adminSnap.status === 'fulfilled' ? adminSnap.value : null;
      const isAdmin   = adminDoc?.exists() ?? false;

      if (userSnap?.exists()) {
        const d = userSnap.data();
        const roles: string[] = Array.isArray(d.roles) ? d.roles : ['user'];

        // Auto-grant 18+ to admin if not already there
        if (isAdmin && !roles.includes('18+')) roles.push('18+');

        // Update isAdmin field in doc if it changed
        if (d.isAdmin !== isAdmin) {
          updateDoc(userRef, { isAdmin, roles }).catch(() => {});
        }

        setProfile({
          uid:         u.uid,
          displayName: d.displayName ?? u.displayName ?? '',
          email:       d.email       ?? u.email        ?? '',
          photoURL:    d.photoURL    ?? u.photoURL      ?? '',
          roles,
          adultStatus: (d.adultStatus as AdultStatus) ?? 'none',
          isAdmin,
        });
      } else {
        // First login — create doc
        const roles = isAdmin ? ['user', '18+'] : ['user'];
        const p: UserProfile = {
          uid: u.uid, displayName: u.displayName ?? 'User',
          email: u.email ?? '', photoURL: u.photoURL ?? '',
          roles, adultStatus: isAdmin ? 'approved' : 'none', isAdmin,
        };
        await setDoc(userRef, { ...p, createdAt: serverTimestamp() });
        setProfile(p);
      }
    } catch (err) {
      console.error('[Auth] Firestore sync error:', err);
      setProfile({ uid: u.uid, displayName: u.displayName ?? 'User',
        email: u.email ?? '', photoURL: u.photoURL ?? '',
        roles: ['user'], adultStatus: 'none', isAdmin: false });
    }
  }, []);

  useEffect(() => {
    if (CONFIG_MISSING || !auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await syncProfile(u); else setProfile(null);
      setLoading(false);
    });
    return unsub;
  }, [syncProfile]);

  const signInWithGoogle = useCallback(async () => {
    if (CONFIG_MISSING || !auth) {
      alert('Firebase belum dikonfigurasi. Isi NEXT_PUBLIC_FIREBASE_* di .env.local');
      return;
    }
    try { await signInWithPopup(auth, googleProvider); }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('popup-closed')) console.error('[Auth] Login error:', msg);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    try { await firebaseSignOut(auth); setUser(null); setProfile(null); }
    catch (err) { console.error('[Auth] Sign out error:', err); }
  }, []);

  // ── Request 18+ — hanya set status 'pending', BUKAN langsung beri role ──
  const requestAdultRole = useCallback(async () => {
    if (!user || !db) return;
    if (adultStatus === 'pending' || adultStatus === 'approved') return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        adultStatus:    'pending',
        adultRequestAt: serverTimestamp(),
      });
      setProfile((prev) => prev ? { ...prev, adultStatus: 'pending' } : prev);
    } catch (err) { console.error('[Auth] Request adult role error:', err); }
  }, [user, adultStatus]);

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdult, isAdmin,
      adultStatus, configMissing: CONFIG_MISSING,
      signInWithGoogle, signOut, requestAdultRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
