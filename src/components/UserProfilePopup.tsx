'use client';
// src/components/UserProfilePopup.tsx
// ─────────────────────────────────────────────────────────────
// Popup yang muncul saat user klik nama/avatar di komentar.
// Menampilkan: avatar, nama, level, badge, XP, total menit nonton.
// Actions: Add Friend, View Profile, Chat, Report
// Smooth fade+scale transition.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, User, Shield, Clock, UserPlus, Eye, MessageCircle, Flag, Heart, UserCheck, UserX } from 'lucide-react';
import { clsx } from 'clsx';
import { getLevelFromXP, getXPProgress } from '@/lib/xp';
import { useAuth } from '@/context/AuthContext';
import { useFriendSystem } from '@/hooks/useFriendSystem';

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
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.uid === user?.uid;
  
  // Real friend system
  const { status: friendStatus, loading: friendLoading, sendRequest, acceptRequest, removeFriend } = useFriendSystem(user?.uid);

  useEffect(() => {
    if (user) {
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

  const handleAddFriend = () => {
    if (!currentUser) {
      alert('Login dulu untuk add friend!');
      return;
    }
    sendRequest();
  };

  const handleAcceptFriend = () => {
    if (!currentUser) return;
    acceptRequest();
  };

  const handleRemoveFriend = () => {
    if (!currentUser) return;
    if (confirm(`Remove ${user?.displayName} dari friend list?`)) {
      removeFriend();
    }
  };

  const handleFollow = () => {
    if (!currentUser) {
      alert('Login dulu untuk follow!');
      return;
    }
    setIsFollowing(!isFollowing);
  };

  const handleChat = () => {
    if (!currentUser) {
      alert('Login dulu untuk chat!');
      return;
    }
    // Redirect to chat page
    router.push(`/chat/${user?.uid}`);
    handleClose();
  };

  const handleReport = () => {
    if (!currentUser) {
      alert('Login dulu untuk report!');
      return;
    }
    const reason = prompt(`Report ${user?.displayName}?\nAlasan:`);
    if (reason) {
      alert('Report submitted. Thanks for keeping our community safe!');
    }
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

        {/* Action Buttons - only show if not own profile */}
        {!isOwnProfile && currentUser && (
          <>
            <div className="border-t border-border mx-4" />
            <div className="p-4 grid grid-cols-2 gap-2">
              {/* Add Friend / Friends Status */}
              {friendStatus === 'none' && (
                <button
                  onClick={handleAddFriend}
                  disabled={friendLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Friend
                </button>
              )}

              {friendStatus === 'pending' && (
                <button
                  disabled
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 cursor-not-allowed"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Pending
                </button>
              )}

              {friendStatus === 'incoming' && (
                <button
                  onClick={handleAcceptFriend}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Accept
                </button>
              )}

              {friendStatus === 'friends' && (
                <button
                  onClick={handleRemoveFriend}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all group"
                >
                  <UserCheck className="w-3.5 h-3.5 group-hover:hidden" />
                  <UserX className="w-3.5 h-3.5 hidden group-hover:block" />
                  <span className="group-hover:hidden">Friends</span>
                  <span className="hidden group-hover:inline">Remove</span>
                </button>
              )}

              {/* Follow */}
              <button
                onClick={handleFollow}
                className={clsx(
                  'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                  isFollowing
                    ? 'bg-pink/10 border border-pink/30 text-pink hover:bg-pink/20'
                    : 'bg-surface-2 border border-border text-secondary hover:border-pink/30 hover:text-pink'
                )}
              >
                <Heart className={clsx('w-3.5 h-3.5', isFollowing && 'fill-pink')} />
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              {/* View Profile */}
              <Link
                href={`/profile/${user.uid}`}
                onClick={handleClose}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet/10 border border-violet/30 text-violet hover:bg-violet/20 transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                View Profile
              </Link>

              {/* Chat */}
              <button
                onClick={handleChat}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-surface-2 border border-border text-secondary hover:border-cyan/30 hover:text-cyan transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat
              </button>
            </div>

            {/* Report button */}
            <div className="px-4 pb-4">
              <button
                onClick={handleReport}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.65rem] font-semibold bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Flag className="w-3 h-3" />
                Report User
              </button>
            </div>
          </>
        )}

        {/* View own profile link */}
        {isOwnProfile && (
          <>
            <div className="border-t border-border mx-4" />
            <div className="p-4">
              <Link
                href={`/profile/${user.uid}`}
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-cyan text-bg hover:brightness-110 transition-all"
              >
                <Eye className="w-4 h-4" />
                Lihat Profil Saya
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
