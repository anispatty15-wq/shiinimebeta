'use client';
// src/app/profile/page.tsx
// Redirect to /profile/[uid] page

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfileRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      // Redirect to own profile
      router.replace(`/profile/${user.uid}`);
    } else {
      // Not logged in - redirect to home
      router.replace('/');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-cyan animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted">Loading profile...</p>
      </div>
    </div>
  );
}
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
            <ShieldAlert className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-secondary leading-relaxed">
              Firebase belum dikonfigurasi. Isi <code className="text-orange-300">NEXT_PUBLIC_FIREBASE_*</code> di Vercel Environment Variables.
            </p>
          </div>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={configMissing}
          className={clsx(
            'w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-app font-semibold text-sm transition-all',
            configMissing
              ? 'bg-surface border border-border text-muted cursor-not-allowed'
              : 'bg-white text-gray-800 hover:bg-gray-100 shadow-md hover:shadow-lg'
          )}
        >
          <GoogleIcon />
          <LogIn className="w-4 h-4" aria-hidden />
          Masuk dengan Google
        </button>
        <p className="text-xs text-muted">Dengan masuk, kamu menyetujui syarat layanan Shiinime.</p>
      </div>
    );
  }

  // ── Logged in ─────────────────────────────────────────────
  const statusCfg = STATUS_CONFIG[adultStatus];

  return (
    <div className="max-w-sm mx-auto px-4 pt-8 pb-20 space-y-5">

      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-surface border-2 border-border flex-shrink-0 relative">
          {profile?.photoURL ? (
            <Image src={profile.photoURL} alt={profile.displayName} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-8 h-8 text-muted" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-primary truncate">{profile?.displayName ?? 'User'}</h1>
          <p className="text-xs text-muted truncate">{profile?.email}</p>
          {/* Role badges */}
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {(profile?.roles ?? ['user']).map((role) => (
              <span key={role} className={clsx(
                'text-[0.6rem] font-bold px-2 py-0.5 rounded-full border',
                role === '18+' ? 'bg-pink/15 border-pink/40 text-pink' : 'bg-surface-2 border-border text-muted'
              )}>
                {role === '18+' ? '🔞 18+' : role}
              </span>
            ))}
            {isAdmin && (
              <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full border bg-violet/15 border-violet/40 text-violet flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" aria-hidden /> Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* XP / Level card */}
      {xpData && (
        <div className="rounded-app border border-border bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>{xpData.current.badge}</span>
              <div>
                <p className={`text-sm font-bold ${xpData.current.color}`}>
                  {xpData.current.name}
                </p>
                <p className="text-xs text-muted">Level {xpData.current.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-primary">{profile?.xp ?? 0} XP</p>
              <p className="text-[0.65rem] text-muted">
                {profile?.totalMinutes ?? 0} menit ditonton
              </p>
            </div>
          </div>
          {/* XP progress bar */}
          {xpData.current.maxXP > 0 ? (
            <div>
              <div className="flex justify-between text-[0.62rem] text-muted mb-1">
                <span>{xpData.xpInLevel} / {xpData.xpNeeded} XP</span>
                <span>→ {xpData.current.nextLevel}</span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan to-violet transition-all rounded-full"
                  style={{ width: `${xpData.percent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-center text-yellow-400 font-semibold">
              🏆 Level Maksimal!
            </p>
          )}
          <p className="text-[0.62rem] text-muted leading-relaxed">
            ⚡ +1 XP/menit nonton · +5 XP komentar · +10 XP episode baru
          </p>
        </div>
      )}

      {/* Admin shortcut */}
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-3 px-4 py-3 rounded-app bg-violet/10 border border-violet/30 hover:bg-violet/15 transition-all"
        >
          <Shield className="w-4 h-4 text-violet flex-shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary">Dashboard Admin</p>
            <p className="text-xs text-muted">Kelola request akses 18+</p>
          </div>
          <span className="text-xs text-violet">→</span>
        </Link>
      )}

      {/* 18+ access section */}
      <div className={clsx(
        'rounded-app border p-4 space-y-3',
        isAdult ? 'border-green-400/30 bg-green-400/5'
          : adultStatus === 'pending' ? 'border-yellow-400/30 bg-yellow-400/5'
          : adultStatus === 'rejected' ? 'border-red-400/30 bg-red-400/5'
          : 'border-border bg-surface'
      )}>
        {/* Status header */}
        <div className="flex items-start gap-3">
          {isAdult
            ? <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            : adultStatus === 'pending'
              ? <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              : adultStatus === 'rejected'
                ? <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                : <ShieldAlert className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />}
          <div>
            <p className="text-sm font-semibold text-primary">
              {isAdult ? 'Akses 18+ Aktif' : 'Akses Konten 18+'}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={clsx(
                'text-[0.65rem] font-bold px-2 py-0.5 rounded-full border',
                statusCfg.color
              )}>
                {statusCfg.icon} {statusCfg.text}
              </span>
            </div>
          </div>
        </div>

        {/* Action based on status */}
        {adultStatus === 'none' && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-secondary leading-relaxed">
              Untuk mengakses halaman Hentai, ajukan permintaan akses 18+. Admin akan meninjau dan menyetujui dalam 1×24 jam.
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ageChecked}
                onChange={(e) => setAgeChecked(e.target.checked)}
                className="mt-0.5 accent-pink flex-shrink-0"
              />
              <span className="text-xs text-secondary leading-relaxed">
                Saya menyatakan berusia <strong className="text-primary">18 tahun atau lebih</strong> dan memahami konten ini bersifat dewasa.
              </span>
            </label>
            <button
              onClick={handleRequest}
              disabled={requesting || !ageChecked}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-app bg-pink text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requesting ? <span className="animate-pulse">Memproses…</span> : '🔞 Ajukan Akses 18+'}
            </button>
          </div>
        )}

        {adultStatus === 'pending' && (
          <p className="text-xs text-secondary leading-relaxed">
            Permintaanmu sedang ditinjau oleh admin. Refresh halaman setelah beberapa waktu untuk melihat hasilnya.
          </p>
        )}

        {adultStatus === 'rejected' && (
          <div className="space-y-2">
            <p className="text-xs text-secondary leading-relaxed">
              Permintaanmu ditolak. Jika ada pertanyaan, hubungi admin.
            </p>
          </div>
        )}

        {isAdult && (
          <p className="text-xs text-secondary">Kamu bisa mengakses semua konten hentai.</p>
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

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
