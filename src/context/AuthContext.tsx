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
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, googleProvider, FIREBASE_READY } from '@/lib/firebase';
import { getLevelFromXP } from '@/lib/xp';
import { pushToCloud, pullFromCloud } from '@/lib/cloudSync';

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
  xp:           number;
  level:        number;
  totalMinutes: number;
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
  requestAdultRole: () => Promise<void>;
  /** Award XP to user (called from stream page) */
  awardXP:          (xp: number, minutes: number) => Promise<void>;
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
  // ── Sync Firestore user doc ───────────────────────────────
  const syncProfile = useCallback(async (u: User) => {
    if (CONFIG_MISSING || !db) {
      setProfile({ uid: u.uid, displayName: u.displayName ?? 'User',
        email: u.email ?? '', photoURL: u.photoURL ?? '',
        roles: ['user'], adultStatus: 'none', isAdmin: false,
        xp: 0, level: 1, totalMinutes: 0 });
      return;
    }
    try {
      const userRef  = doc(db, 'users', u.uid);
      const adminRef = doc(db, 'admins', u.uid);

      const [snap, adminSnap] = await Promise.allSettled([
        getDoc(userRef),
        getDoc(adminRef),
      ]);

      const userSnap  = snap.status      === 'fulfilled' ? snap.value      : null;
      const adminDoc  = adminSnap.status === 'fulfilled' ? adminSnap.value : null;
      const isAdmin   = adminDoc?.exists() ?? false;

      // Debug logs
      console.log('[AuthContext] Admin check:', { 
        uid: u.uid, 
        adminDocExists: adminDoc?.exists(), 
        isAdmin,
        adminData: adminDoc?.data(),
        userSnapStatus: snap.status,
        adminSnapStatus: adminSnap.status,
        adminError: adminSnap.status === 'rejected' ? adminSnap.reason : null
      });

      if (userSnap?.exists()) {
        const d = userSnap.data();

        // Build correct roles array
        let roles: string[] = Array.isArray(d.roles) ? [...d.roles] : ['user'];

        // Fix: remove invalid role values like 'admins', keep only valid ones
        roles = roles.filter((r) => ['user', '18+', 'admin'].includes(r));
        if (!roles.includes('user')) roles.unshift('user');

        // Admin always gets 18+ automatically
        if (isAdmin && !roles.includes('18+')) roles.push('18+');

        // Admin status
        const adultStatus: AdultStatus = isAdmin
          ? 'approved'
          : (d.adultStatus as AdultStatus) ?? 'none';

        // Auto-fix doc if roles/isAdmin/adultStatus is wrong
        const needsFix =
          JSON.stringify(roles) !== JSON.stringify(d.roles) ||
          d.isAdmin !== isAdmin ||
          (isAdmin && d.adultStatus !== 'approved');

        if (needsFix) {
          updateDoc(userRef, { roles, isAdmin, adultStatus }).catch(() => {});
        }

        setProfile({
          uid:         u.uid,
          displayName: d.displayName ?? u.displayName ?? '',
          email:       d.email       ?? u.email        ?? '',
          photoURL:    d.photoURL    ?? u.photoURL      ?? '',
          roles,
          adultStatus,
          isAdmin,
          xp:           Number(d.xp           ?? 0),
          level:        Number(d.level         ?? 1),
          totalMinutes: Number(d.totalMinutes  ?? 0),
        });
      } else {
        // First login — create doc
        const roles = isAdmin ? ['user', '18+'] : ['user'];
        const p: UserProfile = {
          uid: u.uid, displayName: u.displayName ?? 'User',
          email: u.email ?? '', photoURL: u.photoURL ?? '',
          roles, adultStatus: isAdmin ? 'approved' : 'none', isAdmin,
          xp: 0, level: 1, totalMinutes: 0,
        };
        await setDoc(userRef, { ...p, createdAt: serverTimestamp() });
        setProfile(p);
      }
    } catch (err) {
      console.error('[Auth] Firestore sync error:', err);
      setProfile({ uid: u.uid, displayName: u.displayName ?? 'User',
        email: u.email ?? '', photoURL: u.photoURL ?? '',
        roles: ['user'], adultStatus: 'none', isAdmin: false,
        xp: 0, level: 1, totalMinutes: 0 });
    }
  }, []);

  useEffect(() => {
    if (CONFIG_MISSING || !auth) { setLoading(false); return; }
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Initial sync
        await syncProfile(u);
        // Pull cloud data → merge into localStorage
        pullFromCloud(u.uid).catch(() => {});
        // Realtime listener on user doc — keeps XP/level live
        if (db) {
          unsubProfile?.();
          unsubProfile = onSnapshot(doc(db, 'users', u.uid), (snap) => {
            if (!snap.exists()) return;
            const d = snap.data();
            setProfile((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                xp:           Number(d.xp           ?? prev.xp),
                level:        Number(d.level         ?? prev.level),
                totalMinutes: Number(d.totalMinutes  ?? prev.totalMinutes),
              };
            });
          });
        }
      } else {
        setProfile(null);
        unsubProfile?.();
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, [syncProfile]);

  const signInWithGoogle = useCallback(async () => {
    if (CONFIG_MISSING || !auth) {
      alert('Firebase belum dikonfigurasi. Pastikan NEXT_PUBLIC_FIREBASE_* sudah diisi di Vercel.');
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
    try {
      // Push local data to cloud before signing out
      if (user) await pushToCloud(user.uid).catch(() => {});
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) { console.error('[Auth] Sign out error:', err); }
  }, [user]);

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

  // ── Award XP ──────────────────────────────────────────────
  const awardXP = useCallback(async (xp: number, minutes: number) => {
    if (!user || !db || xp <= 0) return;
    try {
      const newXP       = (profile?.xp ?? 0) + xp;
      const newMinutes  = (profile?.totalMinutes ?? 0) + minutes;
      const newLevel    = getLevelFromXP(newXP).level;
      await updateDoc(doc(db, 'users', user.uid), {
        xp:           newXP,
        totalMinutes: newMinutes,
        level:        newLevel,
      });
      setProfile((prev) => prev
        ? { ...prev, xp: newXP, totalMinutes: newMinutes, level: newLevel }
        : prev
      );
    } catch (err) { console.error('[Auth] Award XP error:', err); }
  }, [user, profile?.xp, profile?.totalMinutes]);

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdult, isAdmin,
      adultStatus, configMissing: CONFIG_MISSING,
      signInWithGoogle, signOut, requestAdultRole, awardXP,
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
