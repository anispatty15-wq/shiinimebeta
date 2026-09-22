'use client';
// src/app/profile/[uid]/page.tsx
// User profile page - shows user stats, level, badges, watch history, bookmarks

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, Shield, Clock, Star, Heart, MessageCircle,
  UserPlus, TrendingUp, ArrowLeft, Users, Award, UserCheck, UserX
} from 'lucide-react';
import { clsx } from 'clsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getLevelFromXP, getXPProgress } from '@/lib/xp';
import { useFriendSystem } from '@/hooks/useFriendSystem';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email?: string;
  xp: number;
  totalMinutes: number;
  isAdmin?: boolean;
  createdAt?: any;
  bio?: string;
}

export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.uid === uid;

  // Real friend system
  const { 
    status: friendStatus, 
    loading: friendLoading,
    sendRequest,
    acceptRequest,
    removeFriend
  } = useFriendSystem(uid);

  useEffect(() => {
    if (!uid) return;

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setProfile({ uid, ...userDoc.data() } as UserProfile);
        } else {
          // User document doesn't exist yet - try to create it from auth
          // This handles the case where user logged in but document not created
          console.warn(`User document not found for ${uid}, checking auth...`);
          
          // If viewing own profile, we can create the document
          if (currentUser?.uid === uid) {
            // Document will be created by AuthContext, wait and retry
            setTimeout(async () => {
              const retry = await getDoc(doc(db, 'users', uid));
              if (retry.exists()) {
                setProfile({ uid, ...retry.data() } as UserProfile);
              }
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [uid, currentUser]);

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
    if (confirm(`Remove ${profile?.displayName} dari friend list?`)) {
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
    router.push(`/chat/${uid}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Loading profile...</p>
          <p className="text-xs text-muted/60 mt-1">Tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <User className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">User Not Found</h2>
          <p className="text-sm text-secondary mb-2">
            Profile ini tidak ditemukan atau sedang dimuat.
          </p>
          {currentUser?.uid === uid && (
            <p className="text-xs text-yellow-400 mb-6">
              ℹ️ Jika ini profil kamu, coba refresh halaman atau login ulang.
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 border border-border text-secondary hover:text-primary transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan text-bg font-semibold hover:brightness-110 transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const lvlInfo = getLevelFromXP(profile.xp ?? 0);
  const xpData = getXPProgress(profile.xp ?? 0);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>

        {/* Profile Header */}
        <div className="bg-surface border border-border rounded-app overflow-hidden mb-6">
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-br from-cyan/20 via-violet/20 to-pink/20" />

          <div className="px-6 pb-6 -mt-16">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface bg-surface-2 relative mb-4">
              {profile.photoURL ? (
                <Image src={profile.photoURL} alt={profile.displayName} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-12 h-12 text-muted" />
                </div>
              )}
            </div>

            {/* Name + badges */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-primary mb-2">{profile.displayName}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx(
                  'text-xs font-bold px-3 py-1 rounded-full border',
                  lvlInfo.color, 'bg-surface-2 border-border'
                )}>
                  {lvlInfo.badge} Lv.{lvlInfo.level} {lvlInfo.name}
                </span>
                {profile.isAdmin && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full border bg-violet/15 border-violet/40 text-violet flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-secondary mb-4">{profile.bio}</p>
            )}

            {/* Action buttons - only show if not own profile */}
            {!isOwnProfile && currentUser && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Friend button with status */}
                {friendStatus === 'none' && (
                  <button
                    onClick={handleAddFriend}
                    disabled={friendLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-cyan text-bg hover:brightness-110 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                  </button>
                )}

                {friendStatus === 'pending' && (
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4" />
                    Pending
                  </button>
                )}

                {friendStatus === 'incoming' && (
                  <button
                    onClick={handleAcceptFriend}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    Accept Request
                  </button>
                )}

                {friendStatus === 'friends' && (
                  <button
                    onClick={handleRemoveFriend}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all group"
                  >
                    <UserCheck className="w-4 h-4 group-hover:hidden" />
                    <UserX className="w-4 h-4 hidden group-hover:block" />
                    <span className="group-hover:hidden">Friends</span>
                    <span className="hidden group-hover:inline">Remove</span>
                  </button>
                )}

                <button
                  onClick={handleFollow}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                    isFollowing
                      ? 'bg-pink/10 border border-pink/30 text-pink hover:bg-pink/20'
                      : 'bg-surface-2 border border-border text-secondary hover:border-pink/30 hover:text-pink'
                  )}
                >
                  <Heart className={clsx('w-4 h-4', isFollowing && 'fill-pink')} />
                  {isFollowing ? 'Following' : 'Follow'}
                </button>

                <button
                  onClick={handleChat}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-surface-2 border border-border text-secondary hover:border-cyan/30 hover:text-cyan transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
              </div>
            )}

            {/* Edit profile button for own profile */}
            {isOwnProfile && (
              <div className="flex items-center gap-2">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-cyan text-bg hover:brightness-110 transition-all"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={() => {
                    import('@/lib/firebase').then(({ auth }) => {
                      import('firebase/auth').then(({ signOut }) => {
                        signOut(auth).then(() => router.push('/'));
                      });
                    });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-surface-2 border border-border text-secondary hover:text-red-400 hover:border-red-400/40 transition-all"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-app p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <p className="text-2xl font-bold text-primary">{profile.xp ?? 0}</p>
            </div>
            <p className="text-xs text-muted">Total XP</p>
          </div>

          <div className="bg-surface border border-border rounded-app p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-cyan" />
              <p className="text-2xl font-bold text-primary">{profile.totalMinutes ?? 0}</p>
            </div>
            <p className="text-xs text-muted">Menit ditonton</p>
          </div>

          <div className="bg-surface border border-border rounded-app p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-violet" />
              <p className="text-2xl font-bold text-primary">{lvlInfo.level}</p>
            </div>
            <p className="text-xs text-muted">Level</p>
          </div>

          <div className="bg-surface border border-border rounded-app p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-5 h-5 text-pink" />
              <p className="text-2xl font-bold text-primary">{lvlInfo.badge}</p>
            </div>
            <p className="text-xs text-muted">Badge</p>
          </div>
        </div>

        {/* XP Progress */}
        {xpData.current.maxXP > 0 && (
          <div className="bg-surface border border-border rounded-app p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-primary">Level Progress</h3>
              <span className="text-xs text-muted">{xpData.percent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-cyan to-violet rounded-full transition-all duration-500"
                style={{ width: `${xpData.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{xpData.xpInLevel} / {xpData.xpNeeded} XP</span>
              <span>→ {xpData.current.nextLevel}</span>
            </div>
          </div>
        )}

        {/* Coming Soon Sections */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-app p-6 text-center">
            <Users className="w-8 h-8 text-muted mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-primary mb-1">Friends</h3>
            <p className="text-xs text-muted">Coming Soon</p>
          </div>

          <div className="bg-surface border border-border rounded-app p-6 text-center">
            <Heart className="w-8 h-8 text-muted mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-primary mb-1">Bookmarks</h3>
            <p className="text-xs text-muted">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
