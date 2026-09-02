'use client';
// src/components/UserProfilePopup.tsx
// ─────────────────────────────────────────────────────────────
// Popup yang muncul saat user klik nama/avatar di komentar.
// Menampilkan: avatar, nama, level, badge, XP, total menit nonton.
// Smooth fade+scale transition.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, User, Shield, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { getLevelFromXP, getXPProgress } from '@/lib/xp';

export interface PopupUser {
  uid:          string;
  displayName:  string;
  photoURL:     string;
  level:        number;
  badge:        string;
  levelName:    string;
  xp:           number;
  totalMinutes: number;
  isAdmin?:     boolean;
}

interface Props {
  user:    PopupUser | null;
  onClose: () => void;
}

export default function UserProfilePopup({ user, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) {
      // Small delay so CSS transition plays
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [user]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  if (!user) return null;

  const lvlInfo = getLevelFromXP(user.xp ?? 0);
  const xpData  = getXPProgress(user.xp ?? 0);

  return (
    // Backdrop
    <div
      className={clsx(
        'fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-250',
        visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none pointer-events-none'
      )}
      onClick={handleClose}
    >
      {/* Card */}
      <div
        className={clsx(
          'relative w-full max-w-xs bg-surface border border-border rounded-2xl shadow-2xl',
          'transition-all duration-250 ease-out',
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-muted hover:text-primary transition-colors"
          aria-label="Tutup"
        >
          <X className="w-3.5 h-3.5" aria-hidden />
        </button>

        {/* Avatar + name */}
        <div className="flex flex-col items-center pt-7 pb-4 px-5">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-surface-2 relative mb-3">
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName} fill sizes="64px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <User className="w-8 h-8 text-muted" />
              </div>
            )}
          </div>

          <h3 className="text-sm font-bold text-primary">{user.displayName}</h3>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap justify-center">
            <span className={clsx(
              'text-[0.62rem] font-bold px-2 py-0.5 rounded-full border',
              lvlInfo.color, 'bg-surface-2 border-border'
            )}>
              {user.badge} Lv.{user.level} {user.levelName}
            </span>
            {user.isAdmin && (
              <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded-full border bg-violet/15 border-violet/40 text-violet flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" aria-hidden /> Admin
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border mx-4" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="text-center">
            <p className={clsx('text-lg font-bold', lvlInfo.color)}>{user.xp ?? 0}</p>
            <p className="text-[0.65rem] text-muted">Total XP</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-primary flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted" aria-hidden />
              {user.totalMinutes ?? 0}
            </p>
            <p className="text-[0.65rem] text-muted">Menit ditonton</p>
          </div>
        </div>

        {/* XP Progress */}
        {xpData.current.maxXP > 0 && (
          <div className="px-4 pb-4">
            <div className="flex justify-between text-[0.6rem] text-muted mb-1">
              <span>{xpData.xpInLevel} / {xpData.xpNeeded} XP</span>
              <span>→ {xpData.current.nextLevel}</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan to-violet rounded-full transition-all duration-500"
                style={{ width: `${xpData.percent}%` }}
              />
            </div>
          </div>
        )}
        {xpData.current.maxXP === 0 && (
          <p className="text-xs text-center text-yellow-400 font-semibold pb-4">🏆 Level Maksimal!</p>
        )}
      </div>
    </div>
  );
}
