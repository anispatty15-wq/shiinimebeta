'use client';
// src/app/profile/[uid]/page.tsx
// User profile page - shows user stats, level, badges, watch history, bookmarks

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, Shield, Clock, Star, Heart, MessageCircle,
  Share2,
  UserPlus, TrendingUp, ArrowLeft, Users, Award, UserCheck, UserX,
  ShieldCheck, Send, CheckCircle2, XCircle
  ,ImagePlus
} from 'lucide-react';
import { clsx } from 'clsx';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getLevelFromXP, getXPProgress } from '@/lib/xp';
import { useFriendSystem } from '@/hooks/useFriendSystem';
import { useFriends } from '@/hooks/useFriends';
import { useBookmarks } from '@/context/BookmarkContext';

interface UserProfile {
  uid: string;
  publicId?: string;
  displayName: string;
  photoURL: string;
  email?: string;
  xp: number;
  totalMinutes: number;
  isAdmin?: boolean;
  createdAt?: any;
  bio?: string;
  backgroundURL?: string;
}

export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const {
    user: currentUser,
    isAdmin: currentUserIsAdmin,
    adultStatus,
    isAdult,
    requestAdultRole,
  } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [requestingAdult, setRequestingAdult] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [backgroundDraft, setBackgroundDraft] = useState('');
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [cropSource, setCropSource] = useState('');
  const [cropImageSize, setCropImageSize] = useState({ width: 320, height: 180 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const cropDrag = useState<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const isOwnProfile = currentUser?.uid === uid;

  // Real friend system
  const { 
    status: friendStatus, 
    loading: friendLoading,
    sendRequest,
    acceptRequest,
    removeFriend
  } = useFriendSystem(uid);
  const { friends: friendList } = useFriends();
  const { allBookmarks } = useBookmarks();

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

  const handleLogout = async () => {
    if (!currentUser) return;
    if (!confirm('Yakin ingin logout dari akun ini?')) return;

    try {
      const { auth } = await import('@/lib/firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Gagal logout. Coba lagi.');
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

  const handleShareProfile = async () => {
    const profileURL = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: profile?.displayName ?? 'Profil', url: profileURL });
      } else {
        await navigator.clipboard.writeText(profileURL);
        alert('Link profil berhasil disalin.');
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') console.error('Gagal membagikan profil:', error);
    }
  };

  const handleAdultRequest = async () => {
    setRequestingAdult(true);
    try {
      await requestAdultRole();
    } finally {
      setRequestingAdult(false);
    }
  };

  const startProfileEdit = () => {
    setDisplayNameDraft(profile?.displayName ?? '');
    setBioDraft(profile?.bio ?? '');
    setBackgroundDraft(profile?.backgroundURL ?? '');
    setBackgroundFile(null);
    setBackgroundPreview(profile?.backgroundURL ?? '');
    setAvatarFile(null);
    setAvatarPreview(profile?.photoURL ?? '');
    setProfileError('');
    setEditingProfile(true);
  };

  const cropBackgroundTo16x9 = (file: File, position: { x: number; y: number }, zoom: number): Promise<File> => new Promise((resolve, reject) => {
    const image = new window.Image();
    const objectURL = URL.createObjectURL(file);
    image.onload = () => {
      const frameWidth = 320;
      const frameHeight = 180;
      const baseScale = Math.max(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight);
      const displayScale = baseScale * zoom;
      const sourceX = Math.max(0, Math.min(image.naturalWidth - frameWidth / displayScale, -position.x / displayScale));
      const sourceY = Math.max(0, Math.min(image.naturalHeight - frameHeight / displayScale, -position.y / displayScale));
      const sourceWidth = frameWidth / displayScale;
      const sourceHeight = frameHeight / displayScale;

      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 900;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectURL);
        reject(new Error('Browser tidak mendukung pemotongan gambar.'));
        return;
      }
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectURL);
        if (!blob) {
          reject(new Error('Gagal memproses gambar latar.'));
          return;
        }
        resolve(new File([blob], `profile-background-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.88);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectURL);
      reject(new Error('Gambar latar tidak dapat dibaca.'));
    };
    image.src = objectURL;
  });

  const uploadBackground = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
    if (!cloudName || !uploadPreset) throw new Error('Cloudinary belum dikonfigurasi.');
    if (!file.type.startsWith('image/')) throw new Error('File latar harus berupa gambar.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 10 MB.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json() as { secure_url?: string; error?: { message?: string } };
    if (!response.ok) {
      throw new Error(`Cloudinary (${cloudName}/${uploadPreset}): ${result.error?.message ?? 'upload ditolak'}`);
    }
    if (!result.secure_url) throw new Error('Cloudinary tidak mengembalikan URL latar.');
    return result.secure_url;
  };

  const saveProfile = async () => {
    if (!currentUser || !db) return;
    setSavingProfile(true);
    setProfileError('');
    try {
      const nextDisplayName = displayNameDraft.trim().replace(/\s+/g, ' ').slice(0, 30) || profile?.displayName || 'User';
      const bio = bioDraft.trim().slice(0, 240);
      const backgroundURL = backgroundFile
        ? await uploadBackground(backgroundFile)
        : backgroundDraft.trim().slice(0, 500);
      const avatarURL = avatarFile ? await uploadBackground(avatarFile) : profile?.photoURL ?? '';

      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: nextDisplayName,
        photoURL: avatarURL,
        bio,
        backgroundURL,
      });

      setProfile((prev) => prev ? { ...prev, displayName: nextDisplayName, photoURL: avatarURL, bio, backgroundURL } : prev);
      setDisplayNameDraft(nextDisplayName);
      setBackgroundDraft(backgroundURL);
      setBackgroundFile(null);
      setBackgroundPreview(backgroundURL);
      setAvatarFile(null);
      setAvatarPreview(avatarURL);
      setEditingProfile(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kesalahan tidak diketahui.';
      setProfileError(message);
      console.error('[Profile] Save error:', message);
    } finally {
      setSavingProfile(false);
    }
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
          <div
            className="h-32 bg-gradient-to-br from-cyan/20 via-violet/20 to-pink/20 bg-cover bg-center"
            style={profile.backgroundURL ? { backgroundImage: `url(${profile.backgroundURL})` } : undefined}
          />

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
              {profile.publicId && <p className="mb-2 text-xs text-muted">ID: {profile.publicId}</p>}
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
                <button
                  onClick={handleShareProfile}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-secondary hover:border-pink/40 hover:text-pink"
                >
                  <Share2 className="h-4 w-4" /> Bagikan
                </button>
              </div>
            )}

            {/* Edit profile button for own profile */}
            {isOwnProfile && (
              <div className="flex items-center gap-2">
                <button onClick={startProfileEdit} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-cyan text-bg hover:brightness-110 transition-all">
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-surface-2 border border-border text-secondary hover:text-red-400 hover:border-red-400/40 transition-all"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {isOwnProfile && editingProfile && (
          <div className="bg-surface border border-border rounded-app p-5 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-primary">Edit Profil</h2>
              <button onClick={() => setEditingProfile(false)} className="text-sm text-muted hover:text-primary">Tutup</button>
            </div>
            {profileError && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                {profileError}
              </div>
            )}
            <label className="block text-xs font-semibold text-secondary">
              Nickname
              <input
                value={displayNameDraft}
                onChange={(event) => setDisplayNameDraft(event.target.value)}
                maxLength={30}
                placeholder="Nama tampilan kamu"
                className="mt-1 w-full rounded-app border border-border bg-surface-2 p-3 text-sm text-primary outline-none focus:border-pink"
              />
            </label>
            <div className="mt-4 text-xs font-semibold text-secondary">
              <span>Foto Profil</span>
              <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-app border border-dashed border-cyan/40 bg-surface-2 px-3 py-3 text-sm text-secondary hover:border-cyan">
                <ImagePlus className="h-5 w-5 text-cyan" />
                <span>{avatarFile ? avatarFile.name : 'Pilih foto profil'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      alert('Foto profil harus berupa gambar.');
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      alert('Ukuran foto maksimal 5 MB.');
                      return;
                    }
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
              {avatarPreview && (
                <div className="relative mt-2 h-20 w-20 overflow-hidden rounded-full border border-border">
                  <img src={avatarPreview} alt="Preview avatar" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <label className="block text-xs font-semibold text-secondary mt-4">
              Bio
              <textarea value={bioDraft} onChange={(event) => setBioDraft(event.target.value)} maxLength={240} rows={3} placeholder="Ceritakan sedikit tentang kamu..." className="mt-1 w-full rounded-app border border-border bg-surface-2 p-3 text-sm text-primary outline-none focus:border-pink" />
            </label>
            <div className="text-xs font-semibold text-secondary">
              <span>Latar Belakang</span>
              <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-app border border-dashed border-pink/40 bg-surface-2 px-3 py-3 text-sm text-secondary hover:border-pink">
                <ImagePlus className="h-5 w-5 text-pink" />
                <span>{backgroundFile ? backgroundFile.name : 'Pilih gambar latar'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      alert('File latar harus berupa gambar.');
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      alert('Ukuran gambar maksimal 10 MB.');
                      return;
                    }
                    setBackgroundFile(file);
                    setCropSource(URL.createObjectURL(file));
                    const previewURL = URL.createObjectURL(file);
                    const previewImage = new window.Image();
                    previewImage.onload = () => {
                      setCropImageSize({ width: previewImage.naturalWidth, height: previewImage.naturalHeight });
                      URL.revokeObjectURL(previewURL);
                    };
                    previewImage.src = previewURL;
                    setCropZoom(1);
                    setCropPosition({ x: 0, y: 0 });
                  }}
                />
              </label>
              <p className="mt-1 text-[0.7rem] font-normal text-muted">Geser dan zoom gambar untuk memilih crop 16:9.</p>
              {cropSource && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
                  <div className="w-full max-w-md rounded-2xl bg-surface p-4 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-primary">Pangkas Latar 16:9</h3>
                      <button type="button" onClick={() => setCropSource('')} className="text-sm text-muted">Batal</button>
                    </div>
                    <div
                      className="relative mx-auto aspect-video w-full max-w-[320px] overflow-hidden rounded-lg bg-black touch-none"
                      onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        cropDrag[1]({ x: event.clientX, y: event.clientY, startX: cropPosition.x, startY: cropPosition.y });
                      }}
                      onPointerMove={(event) => {
                        const drag = cropDrag[0];
                        if (drag) setCropPosition({ x: drag.startX + event.clientX - drag.x, y: drag.startY + event.clientY - drag.y });
                      }}
                      onPointerUp={() => cropDrag[1](null)}
                    >
                      <img
                        src={cropSource}
                        alt="Atur crop latar"
                        draggable={false}
                        onLoad={(event) => {
                          const image = event.currentTarget;
                          const baseScale = Math.max(320 / image.naturalWidth, 180 / image.naturalHeight);
                          image.style.width = `${image.naturalWidth * baseScale * cropZoom}px`;
                          image.style.height = `${image.naturalHeight * baseScale * cropZoom}px`;
                        }}
                        className="pointer-events-none absolute max-w-none select-none"
                        style={{
                          width: `${cropImageSize.width * Math.max(320 / cropImageSize.width, 180 / cropImageSize.height) * cropZoom}px`,
                          height: `${cropImageSize.height * Math.max(320 / cropImageSize.width, 180 / cropImageSize.height) * cropZoom}px`,
                          left: `${cropPosition.x}px`,
                          top: `${cropPosition.y}px`,
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                    <label className="mt-4 block text-xs text-secondary">
                      Zoom
                      <input type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} className="mt-2 w-full accent-pink" />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const file = backgroundFile;
                        if (!file) return;
                        void cropBackgroundTo16x9(file, cropPosition, cropZoom).then((croppedFile) => {
                          setBackgroundFile(croppedFile);
                          setBackgroundPreview(URL.createObjectURL(croppedFile));
                          setCropSource('');
                        }).catch((error: Error) => alert(error.message));
                      }}
                      className="mt-4 w-full rounded-app bg-pink px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Gunakan Crop
                    </button>
                  </div>
                </div>
              )}
              {backgroundPreview && (
                <div className="relative mt-2 h-24 overflow-hidden rounded-app border border-border">
                  <img src={backgroundPreview} alt="Preview latar belakang" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <button onClick={saveProfile} disabled={savingProfile} className="inline-flex items-center gap-2 rounded-app bg-pink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        )}

        {isOwnProfile && (
          <div className="bg-surface border border-pink/25 rounded-app p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-pink/10 border border-pink/25 flex items-center justify-center flex-shrink-0">
                {currentUserIsAdmin || isAdult
                  ? <ShieldCheck className="w-5 h-5 text-green-500" />
                  : <Shield className="w-5 h-5 text-pink" />}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-primary">Akses Konten 18+</h2>
                {currentUserIsAdmin || isAdult ? (
                  <p className="text-xs text-green-600 mt-1">Akses aktif. Akun admin memiliki akses otomatis.</p>
                ) : adultStatus === 'pending' ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-yellow-600">
                    <Clock className="w-4 h-4" /> Menunggu persetujuan admin.
                  </div>
                ) : adultStatus === 'rejected' ? (
                  <div className="space-y-2 mt-1">
                    <p className="flex items-center gap-2 text-xs text-red-500"><XCircle className="w-4 h-4" /> Pengajuan ditolak admin.</p>
                    <button
                      onClick={handleAdultRequest}
                      disabled={requestingAdult}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-app bg-pink text-white text-xs font-semibold disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" /> Ajukan Lagi
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 mt-1">
                    <p className="text-xs text-secondary">Ajukan akses dan tunggu konfirmasi admin.</p>
                    <button
                      onClick={handleAdultRequest}
                      disabled={requestingAdult}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-app bg-pink text-white text-xs font-semibold disabled:opacity-60"
                    >
                      {requestingAdult ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {requestingAdult ? 'Mengirim...' : 'Ajukan Akses 18+'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Quick links */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/friends"
            className="block bg-surface border border-border rounded-app p-6 text-center hover:border-cyan/40 hover:bg-surface-2 transition-all"
          >
            <Users className="w-8 h-8 text-cyan mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-primary mb-1">Friends</h3>
            <p className="text-xs text-muted">{friendList.length} teman terhubung</p>
          </Link>

          <Link
            href="/favorites"
            className="block bg-surface border border-border rounded-app p-6 text-center hover:border-pink/40 hover:bg-surface-2 transition-all"
          >
            <Heart className="w-8 h-8 text-pink fill-pink mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-primary mb-1">Bookmarks</h3>
            <p className="text-xs text-muted">{allBookmarks.length} favorit tersimpan</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
