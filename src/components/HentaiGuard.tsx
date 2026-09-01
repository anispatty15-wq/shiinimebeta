'use client';
// src/components/HentaiGuard.tsx
// ─────────────────────────────────────────────────────────────
// Wraps any hentai page/layout.
// Shows a gate screen if:
//   1. User is not logged in            → "Login dulu"
//   2. User is logged in but no 18+ role → "Aktifkan 18+"
// ─────────────────────────────────────────────────────────────

import { useRouter } from 'next/navigation';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';

interface HentaiGuardProps {
  children: React.ReactNode;
}

export default function HentaiGuard({ children }: HentaiGuardProps) {
  const { user, isAdult, loading } = useAuth();
  const router = useRouter();

  // Still loading auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-pink border-t-transparent animate-spin" aria-label="Memuat…" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-pink/10 border border-pink/30 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-pink" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary mb-2">Konten Dewasa (18+)</h2>
          <p className="text-sm text-secondary leading-relaxed">
            Kamu harus <strong className="text-primary">login</strong> untuk mengakses konten ini.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-app bg-pink text-white font-semibold text-sm hover:brightness-110 transition-all"
          >
            <LogIn className="w-4 h-4" aria-hidden />
            Login dengan Google
          </button>
          <button
            onClick={() => router.back()}
            className="w-full py-2.5 rounded-app text-sm text-muted hover:text-primary transition-colors"
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  // Logged in but no 18+ role
  if (!isAdult) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-pink/10 border border-pink/30 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-pink" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary mb-2">Verifikasi Umur Diperlukan</h2>
          <p className="text-sm text-secondary leading-relaxed">
            Akun kamu belum diverifikasi untuk konten 18+.
            Aktifkan role <strong className="text-pink">18+</strong> di halaman profil.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-app bg-pink text-white font-semibold text-sm hover:brightness-110 transition-all"
          >
            🔞 Aktifkan di Profil
          </button>
          <button
            onClick={() => router.back()}
            className="w-full py-2.5 rounded-app text-sm text-muted hover:text-primary transition-colors"
          >
            ← Kembali
          </button>
        </div>

        {/* Warning card */}
        <div className={clsx(
          'mt-2 p-3 rounded-app border border-orange-500/30 bg-orange-500/5 text-left',
          'flex items-start gap-2'
        )}>
          <ShieldAlert className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" aria-hidden />
          <p className="text-xs text-secondary leading-relaxed">
            Konten ini hanya untuk pengguna <strong className="text-primary">18 tahun ke atas</strong>.
            Dengan mengaktifkan akses, kamu menyatakan telah memenuhi syarat usia.
          </p>
        </div>
      </div>
    );
  }

  // Has 18+ role — render children
  return <>{children}</>;
}
