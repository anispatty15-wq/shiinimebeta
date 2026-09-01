'use client';
// src/components/HentaiGuard.tsx — 18+ access gate

import { useRouter } from 'next/navigation';
import { ShieldAlert, LogIn, Lock, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function HentaiGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdult, adultStatus, loading } = useAuth();
  const router = useRouter();

  // Consider approved if either: has 18+ role OR adultStatus is approved
  const hasAccess = isAdult || adultStatus === 'approved';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <GateScreen
        icon={<Lock className="w-8 h-8 text-pink" />}
        title="Konten Dewasa (18+)"
        desc="Kamu harus login untuk mengakses konten ini."
        action={{ label: 'Login dengan Google', onClick: () => router.push('/profile') }}
      />
    );
  }

  // Pending approval
  if (adultStatus === 'pending') {
    return (
      <GateScreen
        icon={<Clock className="w-8 h-8 text-yellow-400" />}
        title="Menunggu Persetujuan Admin"
        desc="Permintaan akses 18+ kamu sedang ditinjau oleh admin. Biasanya disetujui dalam 1×24 jam."
        badge={{ text: '⏳ Menunggu', color: 'bg-yellow-400/15 border-yellow-400/40 text-yellow-400' }}
      />
    );
  }

  // Rejected
  if (adultStatus === 'rejected') {
    return (
      <GateScreen
        icon={<ShieldAlert className="w-8 h-8 text-red-400" />}
        title="Permintaan Ditolak"
        desc="Permintaan akses 18+ kamu ditolak. Hubungi admin jika ada pertanyaan."
        badge={{ text: '✗ Ditolak', color: 'bg-red-400/15 border-red-400/40 text-red-400' }}
        action={{ label: 'Ke Profil', onClick: () => router.push('/profile') }}
      />
    );
  }

  // Logged in but no 18+ role and hasn't requested yet
  if (!hasAccess) {
    return (
      <GateScreen
        icon={<ShieldAlert className="w-8 h-8 text-pink" />}
        title="Verifikasi Umur Diperlukan"
        desc="Konten ini hanya untuk pengguna 18+. Aktifkan akses di halaman profil dan tunggu persetujuan admin."
        action={{ label: '🔞 Ajukan Akses 18+', onClick: () => router.push('/profile') }}
      />
    );
  }

  return <>{children}</>;
}

// ── Reusable gate screen ──────────────────────────────────────
function GateScreen({
  icon, title, desc, badge, action,
}: {
  icon:    React.ReactNode;
  title:   string;
  desc:    string;
  badge?:  { text: string; color: string };
  action?: { label: string; onClick: () => void };
}) {
  const router = useRouter();
  return (
    <div className="max-w-sm mx-auto px-4 py-16 text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-pink/10 border border-pink/30 flex items-center justify-center mx-auto">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-primary">{title}</h2>
        <p className="text-sm text-secondary leading-relaxed">{desc}</p>
        {badge && (
          <span className={`inline-block mt-1 text-xs font-semibold px-3 py-1 rounded-full border ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {action && (
          <button
            onClick={action.onClick}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-app bg-pink text-white font-semibold text-sm hover:brightness-110 transition-all"
          >
            <LogIn className="w-4 h-4" aria-hidden />
            {action.label}
          </button>
        )}
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
