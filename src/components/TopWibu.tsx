'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, User } from 'lucide-react';
import { db, FIREBASE_READY } from '@/lib/firebase';
import { getLevelFromXP } from '@/lib/xp';

interface TopWibuUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  xp: number;
}

export default function TopWibu() {
  const [users, setUsers] = useState<TopWibuUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadTopWibu = async () => {
      if (!FIREBASE_READY || !db) {
        setLoading(false);
        return;
      }

      try {
        let snapshot;
        try {
          snapshot = await getDocs(query(collection(db, 'users'), orderBy('xp', 'desc')));
        } catch {
          // Keep the leaderboard working when the optional Firestore index is absent.
          snapshot = await getDocs(query(collection(db, 'users'), limit(100)));
        }

        const topUsers = snapshot.docs
          .map((userDoc) => {
            const data = userDoc.data();
            return {
              uid: userDoc.id,
              displayName: String(data.displayName ?? 'Wibu'),
              photoURL: typeof data.photoURL === 'string' ? data.photoURL : '',
              xp: Number(data.xp ?? 0),
            };
          })
          .filter((user) => user.displayName.trim())
          .sort((a, b) => b.xp - a.xp)
          .slice(0, 3);

        if (!cancelled) setUsers(topUsers);
      } catch (error) {
        console.error('[TopWibu] Failed to load leaderboard:', error);
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTopWibu();
    return () => { cancelled = true; };
  }, []);

  if (!loading && users.length === 0) return null;

  const visibleUsers = showAll ? users : users.slice(0, 3);

  return (
    <section className="px-4 pt-5 pb-2" aria-labelledby="top-wibu-title">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-400" aria-hidden />
        <h2 id="top-wibu-title" className="text-sm font-bold text-primary">Top Wibu</h2>
        <span className="text-xs text-muted">Level tertinggi</span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {loading
          ? [1, 2, 3].map((rank) => (
              <div key={rank} className="h-24 animate-pulse rounded-app border border-border bg-surface" />
            ))
          : visibleUsers.map((topUser, index) => {
              const level = getLevelFromXP(topUser.xp);
              return (
                <Link
                  href={`/profile/${topUser.uid}`}
                  key={topUser.uid}
                  className="relative flex min-w-0 flex-col items-center gap-1.5 rounded-app border border-border bg-surface px-2 py-3 text-center shadow-sm transition-colors hover:border-cyan/60 sm:flex-row sm:gap-3 sm:px-3 sm:py-2 sm:text-left"
                >
                  <span className="absolute -top-2 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[0.6rem] font-bold text-gray-900">
                    #{index + 1}
                  </span>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface-2 sm:h-11 sm:w-11">
                    {topUser.photoURL ? (
                      <Image src={topUser.photoURL} alt={topUser.displayName} fill sizes="44px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted">
                        <User className="h-5 w-5" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 max-w-full">
                    <p className="break-words text-[0.68rem] font-semibold leading-tight text-primary sm:text-sm">{topUser.displayName}</p>
                    <p className={`break-words text-[0.58rem] font-medium leading-tight ${level.color}`}>Lv.{level.level} · {level.name}</p>
                  </div>
                </Link>
              );
            })}
      </div>

      {!loading && users.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((shown) => !shown)}
          className="mt-3 w-full rounded-app border border-border bg-surface px-3 py-2 text-xs font-semibold text-secondary transition-colors hover:border-cyan/60 hover:text-cyan"
        >
          {showAll ? 'Sembunyikan daftar' : `Lihat semua Top Wibu (${users.length})`}
        </button>
      )}
    </section>
  );
}
