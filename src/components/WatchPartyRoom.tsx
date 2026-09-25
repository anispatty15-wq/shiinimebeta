'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2, Lock, LogOut, Mic, MicOff, Radio, Settings2, Trash2, Users, Volume2 } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { AnimeAPI } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { hashWatchPartyPassword, type WatchPartyMember, type WatchPartyPlayback, type WatchPartyRoom } from '@/lib/watchParty';
import AnimeEpisodePicker from '@/components/AnimeEpisodePicker';

interface WatchPartyRoomProps {
  roomId: string;
  onLeave?: () => void;
}

interface SignalMessage {
  id: string;
  senderId: string;
  recipientId: string;
  type: 'offer' | 'answer' | 'candidate';
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

interface PeerConnectionState {
  connection: RTCPeerConnection;
  audio?: HTMLAudioElement;
  analyser?: AnalyserNode;
  speaking?: boolean;
}

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function WatchPartyRoomView({ roomId, onLeave }: WatchPartyRoomProps) {
  const { user, loading: authLoading } = useAuth();
  const [room, setRoom] = useState<WatchPartyRoom | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [members, setMembers] = useState<WatchPartyMember[]>([]);
  const [password, setPassword] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [episodeSlug, setEpisodeSlug] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [connectedVoiceUsers, setConnectedVoiceUsers] = useState(0);
  const [speakingUsers, setSpeakingUsers] = useState<string[]>([]);
  const [playback, setPlayback] = useState<WatchPartyPlayback | undefined>();
  const playbackRevision = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);
  const localSpeakingFrame = useRef<number | null>(null);
  const peerConnections = useRef(new Map<string, PeerConnectionState>());
  const localStream = useRef<MediaStream | null>(null);

  const isHost = room?.hostId === user?.uid;

  useEffect(() => {
    if (authLoading) return;
    if (!roomId) {
      setRoomLoading(false);
      setRoomError('ID room tidak valid.');
      return;
    }
    if (!db) {
      setRoomLoading(false);
      setRoomError('Firebase belum siap. Muat ulang halaman.');
      return;
    }
    if (!user) {
      setRoomLoading(false);
      return;
    }
    setRoomError('');
    setRoomLoading(true);
    return onSnapshot(doc(db, 'watchRooms', roomId), (snapshot) => {
      if (!snapshot.exists()) {
        setRoom(null);
        setRoomLoading(false);
        setRoomError('Room tidak ditemukan atau sudah ditutup.');
        return;
      }
      const data = snapshot.data();
      setRoom({
        id: snapshot.id,
        hostId: String(data.hostId ?? ''),
        hostName: String(data.hostName ?? 'Host'),
        title: String(data.title ?? 'Nobar Shiinime'),
        episodeSlug: String(data.episodeSlug ?? ''),
        streamUrl: String(data.streamUrl ?? ''),
        visibility: data.visibility === 'private' ? 'private' : 'public',
        passwordHash: typeof data.passwordHash === 'string' ? data.passwordHash : undefined,
        lastActiveAt: data.lastActiveAt?.toDate?.(),
        createdAt: data.createdAt?.toDate?.(),
        updatedAt: data.updatedAt?.toDate?.(),
        playback: data.playback ? {
          position: Math.max(0, Number(data.playback.position) || 0),
          isPlaying: data.playback.isPlaying === true,
          updatedAt: data.playback.updatedAt?.toDate?.(),
        } : undefined,
      });
      if (data.playback) {
        setPlayback({
          position: Math.max(0, Number(data.playback.position) || 0),
          isPlaying: data.playback.isPlaying === true,
          updatedAt: data.playback.updatedAt?.toDate?.(),
        });
        playbackRevision.current += 1;
      }
      setRoomLoading(false);
    }, (error) => {
      console.error('[WatchParty] room listener failed:', error);
      setRoom(null);
      setRoomLoading(false);
      setRoomError('Room belum bisa dibuka. Periksa koneksi dan login kamu.');
    });
  }, [authLoading, roomId, user]);

  useEffect(() => {
    if (!room) return;
    setEpisodeSlug(room.episodeSlug);
    setEpisodeTitle(room.title);
    setStreamUrl(room.streamUrl);
    if (room.visibility === 'public' || room.hostId === user?.uid) setAccessGranted(true);
  }, [room, user?.uid]);

  useEffect(() => {
    if (!db || !user || !room || !isHost || !accessGranted) return;
    const roomRef = doc(db, 'watchRooms', roomId);
    const refreshActivity = () => updateDoc(roomRef, { lastActiveAt: serverTimestamp() }).catch(() => {});
    refreshActivity();
    const interval = window.setInterval(refreshActivity, 30000);
    return () => window.clearInterval(interval);
  }, [accessGranted, isHost, room, roomId, user]);

  useEffect(() => {
    if (!db || !roomId || !accessGranted || !user) return;
    void setDoc(doc(db, 'watchRooms', roomId, 'members', user.uid), {
      displayName: user.displayName ?? 'User',
      photoURL: user.photoURL ?? '',
      joinedAt: serverTimestamp(),
      voiceEnabled: false,
    }, { merge: true }).catch(() => {});
    return onSnapshot(collection(db, 'watchRooms', roomId, 'members'), (snapshot) => {
      setMembers(snapshot.docs.map((memberDoc) => {
        const data = memberDoc.data();
        return {
          uid: memberDoc.id,
          displayName: String(data.displayName ?? 'User'),
          photoURL: typeof data.photoURL === 'string' ? data.photoURL : '',
          joinedAt: data.joinedAt?.toDate?.(),
          voiceEnabled: data.voiceEnabled === true,
        };
      }));
    });
  }, [accessGranted, roomId, user]);

  const leaveRoom = useCallback(async () => {
    if (db && user && accessGranted) {
      if (isHost) {
        const memberSnapshot = await getDocs(collection(db, 'watchRooms', roomId, 'members')).catch(() => null);
        const signalSnapshot = await getDocs(collection(db, 'watchRooms', roomId, 'signals')).catch(() => null);
        if (memberSnapshot && signalSnapshot) {
          const batch = writeBatch(db);
          memberSnapshot.docs.forEach((member) => batch.delete(member.ref));
          signalSnapshot.docs.forEach((signal) => batch.delete(signal.ref));
          batch.delete(doc(db, 'watchRooms', roomId));
          await batch.commit().catch(() => {});
        }
      } else {
        await deleteDoc(doc(db, 'watchRooms', roomId, 'members', user.uid)).catch(() => {});
      }
    }
    localStream.current?.getTracks().forEach((track) => track.stop());
    peerConnections.current.forEach(({ connection, audio }) => {
      connection.close();
      audio?.remove();
    });
    peerConnections.current.clear();
    audioContext.current?.close().catch(() => {});
    onLeave?.();
  }, [accessGranted, isHost, onLeave, roomId, user]);

  const deleteRoom = async () => {
    if (!db || !user || !isHost) return;
    if (!window.confirm('Hapus room nobar ini? Semua peserta akan dikeluarkan.')) return;
    try {
      const memberSnapshot = await getDocs(collection(db, 'watchRooms', roomId, 'members'));
      const signalSnapshot = await getDocs(collection(db, 'watchRooms', roomId, 'signals'));
      const batch = writeBatch(db);
      memberSnapshot.docs.forEach((member) => batch.delete(member.ref));
      signalSnapshot.docs.forEach((signal) => batch.delete(signal.ref));
      batch.delete(doc(db, 'watchRooms', roomId));
      await batch.commit();
      localStream.current?.getTracks().forEach((track) => track.stop());
      peerConnections.current.forEach(({ connection, audio }) => {
        connection.close();
        audio?.remove();
      });
      peerConnections.current.clear();
      onLeave?.();
    } catch (error) {
      console.error('[WatchParty] delete room failed:', error);
      setVoiceError('Room gagal dihapus. Coba lagi.');
    }
  };

  useEffect(() => () => {
    localStream.current?.getTracks().forEach((track) => track.stop());
    peerConnections.current.forEach(({ connection, audio }) => {
      connection.close();
      audio?.remove();
    });
    peerConnections.current.clear();
    audioContext.current?.close().catch(() => {});
  }, []);

  const publishPlayback = useCallback(async (state: { position: number; isPlaying: boolean }) => {
    if (!db || !isHost) return;
    await updateDoc(doc(db, 'watchRooms', roomId), {
      playback: { position: state.position, isPlaying: state.isPlaying, updatedAt: serverTimestamp() },
    }).catch(() => {});
  }, [isHost, roomId]);

  const joinRoom = useCallback(async () => {
    if (!db || !user || !room) return;
    if (room.visibility === 'private' && room.passwordHash !== await hashWatchPartyPassword(password)) {
      setAccessError('Password room salah.');
      return;
    }
    setAccessError('');
    try {
      await setDoc(doc(db, 'watchRooms', roomId, 'members', user.uid), {
        displayName: user.displayName ?? 'User',
        photoURL: user.photoURL ?? '',
        joinedAt: serverTimestamp(),
        voiceEnabled: false,
      }, { merge: true });
      setAccessGranted(true);
    } catch (error) {
      console.error('[WatchParty] join room failed:', error);
      setAccessError('Gagal masuk room. Periksa koneksi atau login kamu.');
    }
  }, [password, room, roomId, user]);

  const copyInvite = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const updateEpisode = async () => {
    if (!db || !room || !isHost || !episodeSlug.trim()) return;
    setSavingEpisode(true);
    setVoiceError('');
    try {
      const result = await AnimeAPI.getEpisode(episodeSlug.trim());
      const nextEpisode = result.data;
      const nextTitle = nextEpisode.title || episodeSlug.trim().replace(/-/g, ' ');
      const nextStreamUrl = nextEpisode.stream_url || nextEpisode.stream_servers?.[0]?.url || '';
      await updateDoc(doc(db, 'watchRooms', roomId), {
        episodeSlug: episodeSlug.trim(),
        title: nextTitle,
        streamUrl: nextStreamUrl,
        playback: { position: 0, isPlaying: false, updatedAt: serverTimestamp() },
        updatedAt: serverTimestamp(),
      });
      setEpisodeTitle(nextTitle);
      setStreamUrl(nextStreamUrl);
    } catch (error) {
      console.error('[WatchParty] update episode failed:', error);
      setVoiceError('Episode gagal diganti. Periksa slug episode.');
    } finally {
      setSavingEpisode(false);
    }
  };

  const toggleVoice = async () => {
    if (!db || !user) return;
    if (voiceEnabled) {
      localStream.current?.getTracks().forEach((track) => track.stop());
      localStream.current = null;
      await updateDoc(doc(db, 'watchRooms', roomId, 'members', user.uid), { voiceEnabled: false }).catch(() => {});
      setVoiceEnabled(false);
      return;
    }
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      await updateDoc(doc(db, 'watchRooms', roomId, 'members', user.uid), { voiceEnabled: true });
      setVoiceEnabled(true);
      setVoiceError('Voice aktif. Izinkan mikrofon di browser bila diminta.');
    } catch {
      setVoiceError('Mikrofon tidak tersedia atau izin belum diberikan.');
    }
  };

  useEffect(() => {
    if (!voiceEnabled || !user || !localStream.current) return;
    const context = audioContext.current ?? new AudioContext();
    audioContext.current = context;
    void context.resume().catch(() => {});
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(localStream.current).connect(analyser);
    const levels = new Uint8Array(analyser.fftSize);
    const updateSpeaking = () => {
      analyser.getByteTimeDomainData(levels);
      const loud = levels.some((value) => Math.abs(value - 128) > 18);
      setSpeakingUsers((current) => loud
        ? [...new Set([...current, user.uid])]
        : current.filter((uid) => uid !== user.uid));
      localSpeakingFrame.current = requestAnimationFrame(updateSpeaking);
    };
    updateSpeaking();
    return () => {
      if (localSpeakingFrame.current !== null) cancelAnimationFrame(localSpeakingFrame.current);
      setSpeakingUsers((current) => current.filter((uid) => uid !== user.uid));
    };
  }, [user, voiceEnabled]);

  useEffect(() => {
    if (!db || !user || !accessGranted || !voiceEnabled) return;
    const signalQuery = collection(db, 'watchRooms', roomId, 'signals');
    return onSnapshot(query(signalQuery, where('recipientId', '==', user.uid)), async (snapshot) => {
      for (const signalDoc of snapshot.docs) {
        const signal = { id: signalDoc.id, ...signalDoc.data() } as SignalMessage;
        if (signal.recipientId !== user.uid || signal.senderId === user.uid) continue;
        const existing = peerConnections.current.get(signal.senderId);
        const peer = existing?.connection ?? new RTCPeerConnection(rtcConfig);
        if (!existing) {
          peer.ontrack = (event) => {
            const audio = document.createElement('audio');
            audio.autoplay = true;
            audio.playsInline = true;
            audio.volume = 1;
            audio.srcObject = event.streams[0] ?? null;
            document.body.appendChild(audio);
            void audio.play().catch(() => {});
            const context = audioContext.current ?? new AudioContext();
            audioContext.current = context;
            const analyser = context.createAnalyser();
            analyser.fftSize = 512;
            context.createMediaStreamSource(event.streams[0]).connect(analyser);
            const levels = new Uint8Array(analyser.fftSize);
            const updateSpeaking = () => {
              const state = peerConnections.current.get(signal.senderId);
              if (!state || state.audio !== audio) return;
              analyser.getByteTimeDomainData(levels);
              const loud = levels.some((value) => Math.abs(value - 128) > 18);
              if (loud !== state.speaking) {
                state.speaking = loud;
                setSpeakingUsers((current) => loud ? [...new Set([...current, signal.senderId])] : current.filter((uid) => uid !== signal.senderId));
              }
              requestAnimationFrame(updateSpeaking);
            };
            peerConnections.current.set(signal.senderId, { connection: peer, audio, analyser });
            updateSpeaking();
          };
          localStream.current?.getTracks().forEach((track) => peer.addTrack(track, localStream.current!));
          peer.onicecandidate = (event) => {
            if (event.candidate) void setDoc(doc(signalQuery), {
              senderId: user.uid,
              recipientId: signal.senderId,
              type: 'candidate',
              payload: event.candidate.toJSON(),
              createdAt: serverTimestamp(),
            });
          };
        }
        if (signal.type === 'offer') {
          await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          await setDoc(doc(signalQuery), { senderId: user.uid, recipientId: signal.senderId, type: 'answer', payload: answer, createdAt: serverTimestamp() });
        } else if (signal.type === 'answer') {
          await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        } else if (signal.type === 'candidate') {
          await peer.addIceCandidate(signal.payload as RTCIceCandidateInit).catch(() => {});
        }
        await deleteDoc(signalDoc.ref).catch(() => {});
      }
      setConnectedVoiceUsers(peerConnections.current.size);
    });
  }, [accessGranted, roomId, user, voiceEnabled]);

  // The lower UID creates the offer so each pair has exactly one initiator.
  useEffect(() => {
    if (!db || !user || !accessGranted || !voiceEnabled || !localStream.current) return;
    const signalQuery = collection(db, 'watchRooms', roomId, 'signals');
    const voiceMembers = members.filter((member) => member.voiceEnabled && member.uid !== user.uid && user.uid < member.uid);

    voiceMembers.forEach((member) => {
      if (peerConnections.current.has(member.uid)) return;
      const connection = new RTCPeerConnection(rtcConfig);
      localStream.current?.getTracks().forEach((track) => connection.addTrack(track, localStream.current!));
      connection.onicecandidate = (event) => {
        if (event.candidate) void setDoc(doc(signalQuery), {
          senderId: user.uid,
          recipientId: member.uid,
          type: 'candidate',
          payload: event.candidate.toJSON(),
          createdAt: serverTimestamp(),
        });
      };
      peerConnections.current.set(member.uid, { connection });
      void connection.createOffer().then(async (offer) => {
        await connection.setLocalDescription(offer);
        await setDoc(doc(signalQuery), {
          senderId: user.uid,
          recipientId: member.uid,
          type: 'offer',
          payload: offer,
          createdAt: serverTimestamp(),
        });
      });
    });
  }, [accessGranted, members, roomId, user, voiceEnabled]);

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center text-secondary">Memuat room...</div>;

  if (!user) return <div className="flex min-h-[60vh] items-center justify-center text-secondary">Login untuk masuk ke room nobar.</div>;

  if (roomLoading) return <div className="flex min-h-[60vh] items-center justify-center text-secondary">Memuat room...</div>;

  if (!room) return <div className="flex min-h-[60vh] items-center justify-center text-secondary">{roomError || 'Room tidak ditemukan atau sudah ditutup.'}</div>;

  if (!accessGranted) return (
    <div className="mx-auto flex min-h-[65vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Lock className="mb-4 h-12 w-12 text-cyan" />
      <h1 className="text-xl font-bold text-primary">{room.title}</h1>
      <p className="mt-2 text-sm text-secondary">Room private. Masukkan password dari host untuk bergabung.</p>
      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password room" className="mt-5 w-full rounded-app border border-border bg-surface px-3 py-2.5 text-sm text-primary outline-none focus:border-cyan" onKeyDown={(event) => { if (event.key === 'Enter') void joinRoom(); }} />
      {accessError && <p className="mt-2 text-xs text-red-400">{accessError}</p>}
      <button onClick={() => void joinRoom()} className="mt-4 w-full rounded-app bg-cyan py-2.5 text-sm font-semibold text-bg">Gabung room</button>
      <button onClick={onLeave} className="mt-3 text-xs text-muted hover:text-primary">Kembali ke lobby</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-5 pb-24">
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <Radio className="h-5 w-5 text-cyan" />
        <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-bold text-primary">{room.title}</h1><p className="text-xs text-secondary">Host: {room.hostName} · {room.visibility === 'private' ? 'Private' : 'Public'} · {members.length} peserta</p></div>
        <button onClick={() => void copyInvite()} className="flex items-center gap-1.5 rounded-app border border-cyan/40 px-3 py-2 text-xs font-semibold text-cyan">{copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />} {copied ? 'Tersalin' : 'Salin undangan'}</button>
        {isHost && <button onClick={() => void deleteRoom()} className="flex items-center gap-1.5 rounded-app border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5" /> Hapus room</button>}
        <button onClick={() => void leaveRoom()} className="flex items-center gap-1.5 rounded-app border border-border px-3 py-2 text-xs text-secondary hover:text-red-400"><LogOut className="h-3.5 w-3.5" /> Keluar</button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="min-w-0">
          <VideoPlayer defaultUrl={streamUrl} servers={[]} title={episodeTitle} playbackRole={isHost ? 'host' : 'viewer'} syncPlayback={playback ? { position: playback.position + (playback.isPlaying && playback.updatedAt ? (Date.now() - playback.updatedAt.getTime()) / 1000 : 0), isPlaying: playback.isPlaying, revision: playbackRevision.current } : undefined} onPlaybackChange={publishPlayback} />
          <div className="mt-3 rounded-app border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-muted">Episode aktif</p><p className="mt-1 text-sm font-semibold text-primary">{episodeTitle || episodeSlug}</p></div><div className="flex items-center gap-2 text-xs text-secondary"><Volume2 className="h-4 w-4 text-cyan" /> {connectedVoiceUsers} voice terhubung</div></div>
            {isHost && <div className="mt-4 border-t border-border pt-3"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary"><Settings2 className="h-4 w-4 text-cyan" /> Ganti anime atau episode</div><AnimeEpisodePicker value={episodeSlug} onChange={(episode) => setEpisodeSlug(episode.slug)} /><button disabled={savingEpisode || !episodeSlug} onClick={() => void updateEpisode()} className="mt-2 rounded-app bg-cyan px-3 py-2 text-xs font-semibold text-bg disabled:opacity-50">{savingEpisode ? 'Memuat...' : 'Terapkan episode terpilih'}</button></div>}
            {voiceError && <p className="mt-3 text-xs text-secondary">{voiceError}</p>}
          </div>
        </main>
        <aside className="rounded-app border border-border bg-surface p-4">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-primary"><Users className="h-4 w-4 text-cyan" /> Peserta</h2><button onClick={() => void toggleVoice()} className={`flex items-center gap-1.5 rounded-app px-2.5 py-1.5 text-xs font-semibold ${voiceEnabled ? 'bg-red-400/15 text-red-400' : 'bg-cyan/10 text-cyan'}`}>{voiceEnabled ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />} {voiceEnabled ? 'Matikan' : 'Voice'}</button></div>
          <div className="mt-3 space-y-2">{members.map((member) => <div key={member.uid} className="flex items-center gap-2 rounded-app bg-bg px-2.5 py-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/15 text-xs font-bold text-cyan">{member.displayName.slice(0, 1).toUpperCase()}</div><span className="min-w-0 flex-1 truncate text-xs text-primary">{member.displayName}{member.uid === room.hostId ? ' (Host)' : ''}</span>{member.voiceEnabled && <Mic className={`h-3.5 w-3.5 ${speakingUsers.includes(member.uid) ? 'text-green-400 animate-pulse' : 'text-secondary'}`} />}</div>)}</div>
          <div className="mt-4 border-t border-border pt-3"><p className="text-xs leading-relaxed text-muted">Bagikan tautan room ini untuk mengundang teman. Room private tetap membutuhkan password.</p><button onClick={() => void copyInvite()} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-app border border-border py-2 text-xs font-semibold text-secondary hover:text-primary"><Copy className="h-3.5 w-3.5" /> Salin tautan undangan</button></div>
        </aside>
      </div>
      <p className="mt-4 text-xs text-muted">Voice menggunakan koneksi peer-to-peer browser. Jangan bagikan tautan private dan password di tempat umum.</p>
    </div>
  );
}