'use client';
// src/app/admin/page.tsx
// ─────────────────────────────────────────────────────────────
// Admin dashboard — approve / reject 18+ requests.
// Only accessible to users with a doc in /admins/{uid}.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Shield, CheckCircle2, XCircle, Clock,
  RefreshCw, Users, AlertCircle, User,
} from 'lucide-react';
import { clsx } from 'clsx';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import type { AdultStatus } from '@/context/AuthContext';

interface RequestUser {
  uid:         string;
  displayName: string;
  email:       string;
  photoURL:    string;
  adultStatus: AdultStatus;
  requestedAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState<RequestUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [filter,   setFilter]   = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [acting,   setActing]   = useState<string | null>(null); // uid being processed

  // ── Redirect if not admin ──────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace('/');
    }
  }, [authLoading, user, isAdmin, router]);

  // ── Fetch requests ────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);
    try {
      const col = collection(db, 'users');
      const q   = filter === 'all'
        ? query(col, where('adultStatus', 'in', ['pending', 'approved', 'rejected']))
        : query(col, where('adultStatus', '==', filter));

      const snap = await getDocs(q);
      const list: RequestUser[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid:         d.id,
          displayName: data.displayName ?? 'User',
          email:       data.email       ?? '',
          photoURL:    data.photoURL    ?? '',
          adultStatus: data.adultStatus ?? 'none',
          requestedAt: data.adultRequestAt?.toDate?.()
            ? new Date(data.adultRequestAt.toDate()).toLocaleString('id-ID')
            : '-',
        };
      });

      // Sort: pending first, then by requestedAt
      list.sort((a, b) => {
        if (a.adultStatus === 'pending' && b.adultStatus !== 'pending') return -1;
        if (b.adultStatus === 'pending' && a.adultStatus !== 'pending') return 1;
        return 0;
      });

      setRequests(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!authLoading && isAdmin) fetchRequests();
  }, [authLoading, isAdmin, fetchRequests]);

  // ── Approve / Reject ──────────────────────────────────────
  const handleAction = async (uid: string, action: 'approve' | 'reject') => {
    if (!db) return;
    setActing(uid);
    try {
      const newStatus: AdultStatus = action === 'approve' ? 'approved' : 'rejected';
      const newRoles = action === 'approve' ? ['user', '18+'] : ['user'];
      await updateDoc(doc(db, 'users', uid), {
        adultStatus: newStatus,
        roles:       newRoles,
      });
      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.uid === uid ? { ...r, adultStatus: newStatus } : r
        )
      );
    } catch (e) {
      console.error('[Admin] Action error:', e);
    } finally {
      setActing(null);
    }
  };

  // ── Guard ─────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-violet border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) return null; // redirecting

  const pendingCount = requests.filter((r) => r.adultStatus === 'pending').length;

  return (
    <div className="max-w-screen-lg mx-auto pb-16">

      {/* Header */}
      <div className="sticky top-14 z-30 bg-bg/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Shield className="w-5 h-5 text-violet flex-shrink-0" aria-hidden />
        <h1 className="text-[0.95rem] font-bold text-primary flex-1">Admin — Request Akses 18+</h1>
        <button
          onClick={fetchRequests}
          className="w-8 h-8 flex items-center justify-center rounded-app bg-surface border border-border text-secondary hover:text-primary transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} aria-hidden />
        </button>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending',   count: requests.filter((r) => r.adultStatus === 'pending').length,  color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
            { label: 'Disetujui', count: requests.filter((r) => r.adultStatus === 'approved').length, color: 'text-green-400',  bg: 'bg-green-400/10'  },
            { label: 'Ditolak',   count: requests.filter((r) => r.adultStatus === 'rejected').length, color: 'text-red-400',    bg: 'bg-red-400/10'    },
          ].map((s) => (
            <div key={s.label} className={clsx('rounded-app border border-border p-3 text-center', s.bg)}>
              <p className={clsx('text-2xl font-bold', s.color)}>{s.count}</p>
              <p className="text-xs text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-3 py-1.5 rounded-app text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0',
                filter === f
                  ? 'bg-violet/10 border-violet text-violet'
                  : 'bg-surface border-border text-secondary hover:text-primary'
              )}
            >
              {f === 'all' ? 'Semua' : f === 'pending' ? `⏳ Pending${pendingCount > 0 && filter !== 'pending' ? ` (${pendingCount})` : ''}` : f === 'approved' ? '✅ Disetujui' : '✗ Ditolak'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-app text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-app bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && requests.length === 0 && (
          <div className="text-center py-16 text-muted space-y-2">
            <Users className="w-10 h-10 mx-auto opacity-30" aria-hidden />
            <p className="text-sm">Tidak ada request {filter !== 'all' ? filter : ''}.</p>
          </div>
        )}

        {/* Request list */}
        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.uid}
                className={clsx(
                  'rounded-app border p-4 flex items-start gap-3 transition-all',
                  req.adultStatus === 'pending'  ? 'border-yellow-400/30 bg-yellow-400/5'
                  : req.adultStatus === 'approved' ? 'border-green-400/20 bg-surface'
                  : 'border-red-400/20 bg-surface'
                )}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 border border-border flex-shrink-0 relative">
                  {req.photoURL
                    ? <Image src={req.photoURL} alt="" fill sizes="40px" className="object-cover" />
                    : <div className="absolute inset-0 flex items-center justify-center"><User className="w-5 h-5 text-muted" /></div>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{req.displayName}</p>
                  <p className="text-xs text-muted truncate">{req.email}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Diajukan: {req.requestedAt}
                  </p>
                  {/* Status badge */}
                  <span className={clsx(
                    'inline-block mt-1.5 text-[0.65rem] font-bold px-2 py-0.5 rounded-full border',
                    req.adultStatus === 'pending'  ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400'
                    : req.adultStatus === 'approved' ? 'bg-green-400/15 border-green-400/40 text-green-400'
                    : 'bg-red-400/15 border-red-400/40 text-red-400'
                  )}>
                    {req.adultStatus === 'pending' ? '⏳ Pending'
                      : req.adultStatus === 'approved' ? '✅ Disetujui'
                      : '✗ Ditolak'}
                  </span>
                </div>

                {/* Action buttons — only for pending */}
                {req.adultStatus === 'pending' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(req.uid, 'approve')}
                      disabled={acting === req.uid}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-app bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-all disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
                      {acting === req.uid ? '…' : 'Setujui'}
                    </button>
                    <button
                      onClick={() => handleAction(req.uid, 'reject')}
                      disabled={acting === req.uid}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-app bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all disabled:opacity-60"
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden />
                      {acting === req.uid ? '…' : 'Tolak'}
                    </button>
                  </div>
                )}

                {/* Re-review approved/rejected */}
                {req.adultStatus !== 'pending' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {req.adultStatus === 'approved' ? (
                      <button
                        onClick={() => handleAction(req.uid, 'reject')}
                        disabled={acting === req.uid}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-app border border-red-400/40 text-red-400 text-xs hover:bg-red-400/10 transition-all disabled:opacity-60"
                      >
                        <XCircle className="w-3 h-3" aria-hidden />
                        Cabut
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(req.uid, 'approve')}
                        disabled={acting === req.uid}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-app border border-green-400/40 text-green-400 text-xs hover:bg-green-400/10 transition-all disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-3 h-3" aria-hidden />
                        Setujui
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* How to set admin */}
        <div className="mt-6 p-4 rounded-app bg-surface border border-border">
          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet" aria-hidden /> Cara tambah admin
          </p>
          <p className="text-xs text-secondary leading-relaxed">
            Buka <strong className="text-primary">Firebase Console → Firestore → Collection "admins"</strong>{' '}
            → Add document dengan <code className="text-cyan">Document ID = UID admin</code> dan field <code className="text-cyan">email: "email@kamu.com"</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
