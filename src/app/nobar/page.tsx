'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Lock, LogIn, Plus, Radio, Users } from 'lucide-react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { db, FIREBASE_READY } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { hashWatchPartyPassword, type WatchPartyRoom } from '@/lib/watchParty';
import WatchPartyRoomView from '@/components/WatchPartyRoom';
import AnimeEpisodePicker from '@/components/AnimeEpisodePicker';
import type { AnimeEpisodeListItem } from '@/types/media';

interface RoomForm {
  title: string;
  episodeSlug: string;
  visibility: 'public' | 'private';
  password: string;
}

const EMPTY_FORM: RoomForm = { title: '', episodeSlug: '', visibility: 'public', password: '' };

export default function WatchPartyLobby() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [rooms, setRooms] = useState<WatchPartyRoom[]>([]);
  const [form, setForm] = useState<RoomForm>(EMPTY_FORM);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [roomLink, setRoomLink] = useState('');

  useEffect(() => {
    if (!db || !FIREBASE_READY) return;
    return onSnapshot(query(collection(db, 'watchRooms'), orderBy('lastActiveAt', 'desc'), limit(30)), (snapshot) => {
      const nextRooms = snapshot.docs
        .map((snapshotDoc) => {
          const data = snapshotDoc.data();
          return {
            id: snapshotDoc.id,
            hostId: String(data.hostId ?? ''),
            hostName: String(data.hostName ?? 'Host'),
            title: String(data.title ?? 'Nobar Shiinime'),
            episodeSlug: String(data.episodeSlug ?? ''),
            streamUrl: String(data.streamUrl ?? ''),
            visibility: data.visibility === 'private' ? 'private' : 'public',
            lastActiveAt: data.lastActiveAt?.toDate?.(),
            createdAt: data.createdAt?.toDate?.() ?? new Date(0),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date(0),
          } as WatchPartyRoom;
        })
        .filter((room) => room.visibility === 'public')
        .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
      setRooms(nextRooms);
    }, () => setError('Daftar room belum bisa dimuat. Pastikan Firestore Rules sudah di-deploy.'));
  }, []);

  const createRoom = useCallback(async () => {
    if (!user || !db) return;
    const title = form.title.trim() || 'Nobar Shiinime';
    const episodeSlug = form.episodeSlug.trim();
    if (!episodeSlug) {
      setError('Isi slug episode terlebih dahulu.');
      return;
    }
    if (form.visibility === 'private' && form.password.length < 4) {
      setError('Password room private minimal 4 karakter.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const { doc, serverTimestamp, setDoc, collection } = await import('firebase/firestore');
      const { createWatchPartyId } = await import('@/lib/watchParty');
      const roomId = createWatchPartyId();
      await setDoc(doc(collection(db, 'watchRooms'), roomId), {
        hostId: user.uid,
        hostName: user.displayName ?? 'Host',
        title,
        episodeSlug,
        streamUrl: '',
        visibility: form.visibility,
        lastActiveAt: serverTimestamp(),
        ...(form.visibility === 'private' ? { passwordHash: await hashWatchPartyPassword(form.password) } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'watchRooms', roomId, 'members', user.uid), {
        displayName: user.displayName ?? 'User',
        photoURL: user.photoURL ?? '',
        joinedAt: serverTimestamp(),
        voiceEnabled: false,
      });
      setForm(EMPTY_FORM);
      setShowCreate(false);
      router.push(`/nobar/${roomId}`);
    } catch (createError) {
      console.error('[WatchParty] create room failed:', createError);
      setError('Room gagal dibuat. Coba lagi.');
    } finally {
      setCreating(false);
    }
  }, [form, router, user]);

  const openRoomLink = () => {
    const value = roomLink.trim();
    if (!value) return;
    try {
      const path = value.includes('/nobar/') ? new URL(value).pathname : `/nobar/${value.replace(/^\/+|\/+$/g, '')}`;
      if (!path.startsWith('/nobar/')) throw new Error('invalid room');
      router.push(path);
    } catch {
      setError('Masukkan link undangan atau ID room yang valid.');
    }
  };

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center text-secondary">Memuat nobar...</div>;

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <Radio className="mb-4 h-12 w-12 text-cyan" />
        <h1 className="text-xl font-bold text-primary">Nobar Shiinime</h1>
        <p className="mt-2 text-sm text-secondary">Login untuk membuat room, bergabung, dan ngobrol dengan teman.</p>
        <button onClick={signInWithGoogle} className="mt-6 flex items-center gap-2 rounded-app bg-cyan px-4 py-2.5 text-sm font-semibold text-bg">
          <LogIn className="h-4 w-4" /> Login dengan Google
        </button>
      </div>
    );
  }

  if (selectedRoomId) {
    return <WatchPartyRoomView roomId={selectedRoomId} onLeave={() => setSelectedRoomId(null)} />;
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan">Watch party</p>
          <h1 className="mt-1 text-2xl font-bold text-primary">Nobar bareng teman</h1>
          <p className="mt-1 text-sm text-secondary">Host mengatur episode, semua peserta ikut menonton.</p>
        </div>
        <button onClick={() => { setShowCreate((value) => !value); setError(''); }} className="flex items-center gap-2 rounded-app bg-cyan px-4 py-2.5 text-sm font-semibold text-bg">
          <Plus className="h-4 w-4" /> Buat room
        </button>
      </div>

      {error && <p className="mt-4 rounded-app border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-400">{error}</p>}

      {showCreate && (
        <div className="mt-5 rounded-app border border-cyan/30 bg-surface p-4">
          <h2 className="text-sm font-bold text-primary">Buat room baru</h2>
          <input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="Nama room (opsional), misalnya Nobar One Piece" className="mt-3 w-full rounded-app border border-border bg-bg px-3 py-2.5 text-sm text-primary outline-none focus:border-cyan" />
          <div className="mt-3"><AnimeEpisodePicker value={form.episodeSlug} onChange={(episode: AnimeEpisodeListItem) => setForm((value) => ({ ...value, episodeSlug: episode.slug, title: value.title || episode.title }))} /></div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(['public', 'private'] as const).map((visibility) => (
              <button key={visibility} onClick={() => setForm((value) => ({ ...value, visibility }))} className={`rounded-app border px-3 py-2 text-xs font-semibold ${form.visibility === visibility ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-secondary'}`}>
                {visibility === 'public' ? 'Public' : 'Private + password'}
              </button>
            ))}
            {form.visibility === 'private' && <input type="password" value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} placeholder="Password room" className="rounded-app border border-border bg-bg px-3 py-2 text-sm text-primary outline-none focus:border-cyan" />}
            <button disabled={creating} onClick={createRoom} className="ml-auto rounded-app bg-cyan px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50">{creating ? 'Membuat...' : 'Mulai nobar'}</button>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-app border border-border bg-surface p-4">
        <h2 className="text-sm font-bold text-primary">Masuk ke room undangan</h2>
        <p className="mt-1 text-xs text-secondary">Tempel link undangan atau masukkan ID room untuk masuk kembali.</p>
        <div className="mt-3 flex gap-2">
          <input value={roomLink} onChange={(event) => setRoomLink(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') openRoomLink(); }} placeholder="https://.../nobar/ID-room" className="min-w-0 flex-1 rounded-app border border-border bg-bg px-3 py-2.5 text-sm text-primary outline-none focus:border-cyan" />
          <button onClick={openRoomLink} className="flex items-center gap-1.5 rounded-app bg-cyan px-3 py-2 text-xs font-semibold text-bg"><ArrowRight className="h-3.5 w-3.5" /> Masuk</button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary"><Users className="h-4 w-4 text-cyan" /> Room public yang sedang tersedia</div>
      {rooms.length === 0 ? <p className="mt-4 rounded-app border border-border bg-surface p-5 text-sm text-secondary">Belum ada room public. Buat room pertama dan bagikan tautannya.</p> : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {rooms.map((room) => <button key={room.id} onClick={() => setSelectedRoomId(room.id)} className="text-left rounded-app border border-border bg-surface p-4 transition-colors hover:border-cyan/50">
            <p className="truncate text-sm font-semibold text-primary">{room.title}</p>
            <p className="mt-1 truncate text-xs text-secondary">Episode: {room.episodeSlug}</p>
            <p className="mt-3 text-xs text-muted">Host: {room.hostName}</p>
          </button>)}
        </div>
      )}
      <p className="mt-5 flex items-center gap-1.5 text-xs text-muted"><Lock className="h-3.5 w-3.5" /> Room private hanya bisa dibuka lewat tautan undangan dan password.</p>
    </div>
  );
}