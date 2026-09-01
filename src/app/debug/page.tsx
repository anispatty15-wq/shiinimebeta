'use client';
// TEMPORARY DEBUG PAGE — delete after fixing
// Visit /debug after login to see raw auth + firestore data

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export default function DebugPage() {
  const { user, profile, isAdmin, isAdult, adultStatus, loading } = useAuth();
  const [userDoc,  setUserDoc]  = useState<Record<string, unknown> | null>(null);
  const [adminDoc, setAdminDoc] = useState<Record<string, unknown> | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    setFetching(true);
    Promise.all([
      getDoc(doc(db, 'users',  user.uid)),
      getDoc(doc(db, 'admins', user.uid)),
    ]).then(([u, a]) => {
      setUserDoc(u.exists()  ? u.data()  as Record<string, unknown> : { error: 'doc tidak ada' });
      setAdminDoc(a.exists() ? a.data()  as Record<string, unknown> : { error: 'tidak ada di collection admins' });
    }).catch((e) => {
      setUserDoc({ error: String(e) });
    }).finally(() => setFetching(false));
  }, [user]);

  if (loading) return <p className="p-8 text-muted">Loading auth…</p>;
  if (!user)   return <p className="p-8 text-muted">Belum login. Login dulu di /profile</p>;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-5 font-mono text-xs">
      <h1 className="text-base font-bold text-primary">🔧 Debug Auth</h1>

      <section className="space-y-1">
        <p className="text-muted font-semibold">AUTH STATE (dari context)</p>
        <pre className="bg-surface border border-border rounded p-3 overflow-x-auto whitespace-pre-wrap">{JSON.stringify({
          uid:         user.uid,
          email:       user.email,
          isAdmin,
          isAdult,
          adultStatus,
          roles:       profile?.roles,
          profileAdmin: profile?.isAdmin,
        }, null, 2)}</pre>
      </section>

      <section className="space-y-1">
        <p className="text-muted font-semibold">FIRESTORE /users/{user.uid}</p>
        <pre className="bg-surface border border-border rounded p-3 overflow-x-auto whitespace-pre-wrap">
          {fetching ? 'Fetching…' : JSON.stringify(userDoc, null, 2)}
        </pre>
      </section>

      <section className="space-y-1">
        <p className="text-muted font-semibold">FIRESTORE /admins/{user.uid}</p>
        <pre className="bg-surface border border-border rounded p-3 overflow-x-auto whitespace-pre-wrap">
          {fetching ? 'Fetching…' : JSON.stringify(adminDoc, null, 2)}
        </pre>
      </section>

      <p className="text-muted text-[0.65rem]">
        Kalau /admins/{'{uid}'} error = UID belum ada di collection admins.
      </p>
    </div>
  );
}
