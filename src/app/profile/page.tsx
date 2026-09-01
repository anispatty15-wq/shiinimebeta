'use client';
// src/app/profile/page.tsx
// ─────────────────────────────────────────────────────────────
// Halaman profil / login.
// • Belum login  → tampil tombol "Login dengan Google"
// • Sudah login  → tampil info akun, roles, akses 18+
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LogIn, LogOut, User, ShieldCheck, ShieldAlert,
  CheckCircle2, AlertCircle, History, Heart,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile, loading, isAdult, configMissing, signInWithGoogle, signOut, requestAdultRole } = useAuth();
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [reqDone,    setReqDone]    = useState(false);

  const handleRequestAdult = async () => {
    setRequesting(true);
    await requestAdultRole();
    setRequesting(false);
    setReqDone(true);
  };

  if (loading) {
    return (
      <div className="max-w-xs mx-auto px-4 pt-16 space-y-3">
        <div className="h-20 w-20 rounded-full bg-surface animate-pulse mx-auto" />
        <div className="h-5 bg-surface animate-pulse rounded mx-auto w-40" />
        <div className="h-4 bg-surface animate-pulse rounded mx-auto w-28" />
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 pt-16 pb-10 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mx-auto">
          <User className="w-10 h-10 text-muted" aria-hidden />
        </div>

        <div>
          <h1 className="text-lg font-bold text-primary mb-1">Masuk ke Shiinime</h1>
          <p className="text-sm text-secondary leading-relaxed">
            Login untuk menyimpan favorit, riwayat, dan mengakses konten 18+.
          </p>
        </div>

        {configMissing && (
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-app text-left">
            <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" aria-hidden />
            <p className="text-xs text-secondary leading-relaxed">
              Firebase belum dikonfigurasi. Isi <code className="text-orange-300">NEXT_PUBLIC_FIREBASE_*</code>{' '}
              di file <code className="text-orange-300">.env.local</code>.
            </p>
          </div>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={configMissing}
          className={clsx(
            'w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-app',
            'font-semibold text-sm transition-all',
            configMissing
              ? 'bg-surface border border-border text-muted cursor-not-allowed'
              : 'bg-white text-gray-800 hover:bg-gray-100 shadow-md hover:shadow-lg'
          )}
        >
          {/* Google icon */}
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <LogIn className="w-4 h-4" aria-hidden />
          Masuk dengan Google
        </button>

        <p className="text-xs text-muted">
          Dengan masuk, kamu menyetujui syarat layanan Shiinime.
        </p>
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────
  return (
    <div className="max-w-sm mx-auto px-4 pt-8 pb-16 space-y-6">

      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-surface border border-border flex-shrink-0 relative">
          {profile?.photoURL ? (
            <Image src={profile.photoURL} alt={profile.displayName} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-2xl text-muted">
              <User className="w-8 h-8" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-primary truncate">
            {profile?.displayName ?? 'User'}
          </h1>
          <p className="text-xs text-muted truncate">{profile?.email}</p>
          {/* Role badges */}
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {(profile?.roles ?? ['user']).map((role) => (
              <span
                key={role}
                className={clsx(
                  'text-[0.6rem] font-bold px-2 py-0.5 rounded-full border',
                  role === '18+'
                    ? 'bg-pink/15 border-pink/40 text-pink'
                    : 'bg-surface-2 border-border text-muted'
                )}
              >
                {role === '18+' ? '🔞 18+' : role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 18+ access section */}
      <div className={clsx(
        'rounded-app border p-4 space-y-3',
        isAdult ? 'border-pink/30 bg-pink/5' : 'border-border bg-surface'
      )}>
        <div className="flex items-start gap-3">
          {isAdult
            ? <ShieldCheck className="w-5 h-5 text-pink flex-shrink-0 mt-0.5" aria-hidden />
            : <ShieldAlert className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" aria-hidden />}
          <div>
            <p className="text-sm font-semibold text-primary">
              {isAdult ? 'Akses Konten 18+ Aktif' : 'Konten 18+ Terkunci'}
            </p>
            <p className="text-xs text-secondary mt-0.5 leading-relaxed">
              {isAdult
                ? 'Kamu bisa mengakses halaman Hentai.'
                : 'Untuk mengakses konten hentai, kamu harus berusia 18+ dan mengaktifkan akses 18+ di akun kamu.'}
            </p>
          </div>
        </div>

        {!isAdult && (
          <>
            {reqDone ? (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle2 className="w-4 h-4" aria-hidden />
                Akses 18+ berhasil diaktifkan! Refresh halaman jika belum berubah.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer select-none group">
                  <input type="checkbox" id="age-confirm" className="mt-0.5 accent-pink" required />
                  <span className="text-xs text-secondary leading-relaxed">
                    Saya menyatakan bahwa saya berusia <strong className="text-primary">18 tahun atau lebih</strong> dan memahami bahwa konten ini bersifat dewasa.
                  </span>
                </label>
                <button
                  onClick={() => {
                    const cb = document.getElementById('age-confirm') as HTMLInputElement;
                    if (!cb?.checked) { alert('Centang pernyataan terlebih dahulu.'); return; }
                    handleRequestAdult();
                  }}
                  disabled={requesting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-app bg-pink text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {requesting ? (
                    <span className="animate-pulse">Memproses…</span>
                  ) : (
                    <>🔞 Aktifkan Akses 18+</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="space-y-1.5">
        <Link href="/history" className="flex items-center gap-3 px-4 py-3 rounded-app bg-surface border border-border hover:bg-surface-2 transition-all">
          <History className="w-4 h-4 text-cyan" aria-hidden />
          <span className="text-sm font-medium text-primary">Riwayat Tontonan</span>
        </Link>
        <Link href="/favorites" className="flex items-center gap-3 px-4 py-3 rounded-app bg-surface border border-border hover:bg-surface-2 transition-all">
          <Heart className="w-4 h-4 text-pink" aria-hidden />
          <span className="text-sm font-medium text-primary">Favorit Saya</span>
        </Link>
      </div>

      {/* Sign out */}
      <button
        onClick={() => signOut().then(() => router.push('/'))}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-app bg-surface border border-border text-secondary hover:text-red-400 hover:border-red-400/40 transition-all text-sm font-semibold"
      >
        <LogOut className="w-4 h-4" aria-hidden />
        Keluar
      </button>
    </div>
  );
}
