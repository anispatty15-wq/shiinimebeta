'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2, Lock, LogOut, Mic, MicOff, Radio, Send, Settings2, Users, Volume2 } from 'lucide-react';
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { AnimeAPI } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { hashWatchPartyPassword, type WatchPartyMember, type WatchPartyRoom } from '@/lib/watchParty';

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
}

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function WatchPartyRoomView({ roomId, onLeave }: WatchPartyRoomProps) {
  const { user } = useAuth();
  const [room, setRoom] = useState<WatchPartyRoom | null>(null);
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
  const peerConnections = useRef(new Map<string, PeerConnectionState>());
  const localStream = useRef<MediaStream | null>(null);

  const isHost = room?.hostId === user?.uid;

  useEffect(() => {
    if (!db || !roomId) return;
    return onSnapshot(doc(db, 'watchRooms', roomId), (snapshot) => {
      if (!snapshot.exists()) {
        setRoom(null);
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
        createdAt: data.createdAt?.toDate?.(),
        updatedAt: data.updatedAt?.toDate?.(),
      });
    });
  }, [roomId]);

  useEffect(() => {
    if (!room) return;
    setEpisodeSlug(room.episodeSlug);
    setEpisodeTitle(room.title);
    setStreamUrl(room.streamUrl);
    if (room.visibility === 'public' || room.hostId === user?.uid) setAccessGranted(true);
  }, [room, user?.uid]);

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
      await deleteDoc(doc(db, 'watchRooms', roomId, 'members', user.uid)).catch(() => {});
    }
    localStream.current?.getTracks().forEach((track) => track.stop());
    peerConnections.current.forEach(({ connection, audio }) => {
      connection.close();
      audio?.remove();
    });
    peerConnections.current.clear();
    onLeave?.();
  }, [accessGranted, onLeave, roomId, user]);

  useEffect(() => () => { void leaveRoom(); }, [leaveRoom]);

  const joinRoom = useCallback(async () => {
    if (!db || !user || !room) return;
    if (room.visibility === 'private' && room.passwordHash !== await hashWatchPartyPassword(password)) {
      setAccessError('Password room salah.');
      return;
    }
    setAccessError('');
    await setDoc(doc(db, 'watchRooms', roomId, 'members', user.uid), {
      displayName: user.displayName ?? 'User',
      photoURL: user.photoURL ?? '',
      joinedAt: serverTimestamp(),
      voiceEnabled: false,
    }, { merge: true });
    setAccessGranted(true);
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
            audio.srcObject = event.streams[0] ?? null;
            document.body.appendChild(audio);
            peerConnections.current.set(signal.senderId, { connection: peer, audio });
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

  if (!room) return <div className="flex min-h-[60vh] items-center justify-center text-secondary">Room tidak ditemukan atau sudah ditutup.</div>;

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
        <button onClick={() => void leaveRoom()} className="flex items-center gap-1.5 rounded-app border border-border px-3 py-2 text-xs text-secondary hover:text-red-400"><LogOut className="h-3.5 w-3.5" /> Keluar</button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="min-w-0">
          <VideoPlayer defaultUrl={streamUrl} servers={[]} title={episodeTitle} />
          <div className="mt-3 rounded-app border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-muted">Episode aktif</p><p className="mt-1 text-sm font-semibold text-primary">{episodeTitle || episodeSlug}</p></div><div className="flex items-center gap-2 text-xs text-secondary"><Volume2 className="h-4 w-4 text-cyan" /> {connectedVoiceUsers} voice terhubung</div></div>
            {isHost && <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3"><Settings2 className="mt-2 h-4 w-4 text-cyan" /><input value={episodeSlug} onChange={(event) => setEpisodeSlug(event.target.value)} placeholder="Slug episode baru" className="min-w-[14rem] flex-1 rounded-app border border-border bg-bg px-3 py-2 text-sm text-primary outline-none focus:border-cyan" /><button disabled={savingEpisode} onClick={() => void updateEpisode()} className="rounded-app bg-cyan px-3 py-2 text-xs font-semibold text-bg disabled:opacity-50">{savingEpisode ? 'Memuat...' : 'Ganti episode'}</button></div>}
            {voiceError && <p className="mt-3 text-xs text-secondary">{voiceError}</p>}
          </div>
        </main>
        <aside className="rounded-app border border-border bg-surface p-4">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-primary"><Users className="h-4 w-4 text-cyan" /> Peserta</h2><button onClick={() => void toggleVoice()} className={`flex items-center gap-1.5 rounded-app px-2.5 py-1.5 text-xs font-semibold ${voiceEnabled ? 'bg-red-400/15 text-red-400' : 'bg-cyan/10 text-cyan'}`}>{voiceEnabled ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />} {voiceEnabled ? 'Matikan' : 'Voice'}</button></div>
          <div className="mt-3 space-y-2">{members.map((member) => <div key={member.uid} className="flex items-center gap-2 rounded-app bg-bg px-2.5 py-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/15 text-xs font-bold text-cyan">{member.displayName.slice(0, 1).toUpperCase()}</div><span className="min-w-0 flex-1 truncate text-xs text-primary">{member.displayName}{member.uid === room.hostId ? ' (Host)' : ''}</span>{member.voiceEnabled && <Mic className="h-3.5 w-3.5 text-green-400" />}</div>)}</div>
          <div className="mt-4 border-t border-border pt-3"><p className="text-xs leading-relaxed text-muted">Bagikan tautan room ini untuk mengundang teman. Room private tetap membutuhkan password.</p><button onClick={() => void copyInvite()} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-app border border-border py-2 text-xs font-semibold text-secondary hover:text-primary"><Copy className="h-3.5 w-3.5" /> Salin tautan undangan</button></div>
        </aside>
      </div>
      <p className="mt-4 text-xs text-muted">Voice menggunakan koneksi peer-to-peer browser. Jangan bagikan tautan private dan password di tempat umum.</p>
    </div>
  );
}