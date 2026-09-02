'use client';
// src/components/Comments.tsx
// ─────────────────────────────────────────────────────────────
// Realtime comments section using Firestore.
//
// Firestore path: /comments/{episodeSlug}/messages/{id}
//   text:        string
//   uid:         string
//   displayName: string
//   photoURL:    string
//   level:       number
//   badge:       string  (emoji)
//   createdAt:   Timestamp
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, type Timestamp,
} from 'firebase/firestore';
import { MessageCircle, Send, User, LogIn } from 'lucide-react';
import { clsx } from 'clsx';
import { db, FIREBASE_READY } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getLevelFromXP, XP_COMMENT } from '@/lib/xp';

interface Comment {
  id:          string;
  text:        string;
  uid:         string;
  displayName: string;
  photoURL:    string;
  level:       number;
  badge:       string;
  levelName:   string;
  levelColor:  string;
  createdAt:   Timestamp | null;
}

interface CommentsProps {
  episodeSlug: string;
  contentType: 'anime' | 'hentai';
}

export default function Comments({ episodeSlug, contentType }: CommentsProps) {
  const { user, profile, awardXP } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Listen to Firestore comments in realtime ───────────────
  useEffect(() => {
    if (!FIREBASE_READY || !db) return;

    const col = collection(db, 'comments', episodeSlug, 'messages');
    const q   = query(col, orderBy('createdAt', 'asc'), limit(100));

    const unsub = onSnapshot(q, (snap) => {
      const list: Comment[] = snap.docs.map((d) => {
        const data = d.data();
        const lvl  = getLevelFromXP(data.xp ?? 0);
        return {
          id:          d.id,
          text:        data.text ?? '',
          uid:         data.uid  ?? '',
          displayName: data.displayName ?? 'User',
          photoURL:    data.photoURL    ?? '',
          level:       data.level       ?? 1,
          badge:       data.badge       ?? lvl.badge,
          levelName:   data.levelName   ?? lvl.name,
          levelColor:  lvl.color,
          createdAt:   data.createdAt   ?? null,
        };
      });
      setComments(list);
      setLoaded(true);
    });

    return unsub;
  }, [episodeSlug]);

  // Auto-scroll to bottom on new comment
  useEffect(() => {
    if (loaded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length, loaded]);

  // ── Submit comment ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !profile || !db || sending) return;

    setSending(true);
    const lvl = getLevelFromXP(profile.xp ?? 0);
    try {
      await addDoc(collection(db, 'comments', episodeSlug, 'messages'), {
        text:        text.trim(),
        uid:         user.uid,
        displayName: profile.displayName,
        photoURL:    profile.photoURL,
        level:       lvl.level,
        levelName:   lvl.name,
        badge:       lvl.badge,
        xp:          profile.xp ?? 0,
        createdAt:   serverTimestamp(),
      });
      setText('');
      // Award XP for commenting
      await awardXP(XP_COMMENT, 0);
    } catch (err) {
      console.error('[Comments] Error posting comment:', err);
    } finally {
      setSending(false);
    }
  };

  const isHentai = contentType === 'hentai';

  return (
    <section className="px-4 py-5 border-t border-border">
      <h2 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
        <MessageCircle className={clsx('w-4 h-4', isHentai ? 'text-pink' : 'text-cyan')} aria-hidden />
        Komentar
        {comments.length > 0 && (
          <span className="text-xs text-muted font-normal">({comments.length})</span>
        )}
      </h2>

      {/* Comment list */}
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
        {!loaded && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-surface-2 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-surface-2 rounded w-24" />
                  <div className="h-3 bg-surface-2 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {loaded && comments.length === 0 && (
          <p className="text-xs text-muted text-center py-4">
            Belum ada komentar. Jadilah yang pertama!
          </p>
        )}

        {comments.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-2 border border-border flex-shrink-0 relative">
              {c.photoURL ? (
                <Image src={c.photoURL} alt="" fill sizes="32px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-4 h-4 text-muted" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + badge */}
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-xs font-semibold text-primary">
                  {c.displayName}
                </span>
                <span
                  title={`Lv.${c.level} ${c.levelName}`}
                  className={clsx(
                    'text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full bg-surface-2 border border-border',
                    c.levelColor
                  )}
                >
                  {c.badge} Lv.{c.level}
                </span>
                {c.createdAt && (
                  <span className="text-[0.6rem] text-muted ml-auto">
                    {new Date(c.createdAt.toMillis()).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              {/* Text */}
              <p className="text-sm text-secondary leading-relaxed break-words">
                {c.text}
              </p>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!FIREBASE_READY ? (
        <p className="text-xs text-muted">Komentar tidak tersedia (Firebase belum dikonfigurasi).</p>
      ) : !user ? (
        <div className="flex items-center gap-3 p-3 rounded-app bg-surface border border-border">
          <LogIn className="w-4 h-4 text-muted flex-shrink-0" aria-hidden />
          <p className="text-xs text-secondary flex-1">
            <a href="/profile" className={clsx('font-semibold', isHentai ? 'text-pink' : 'text-cyan')}>
              Login
            </a>{' '}
            untuk bisa berkomentar.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-2 border border-border flex-shrink-0 relative">
            {profile?.photoURL ? (
              <Image src={profile.photoURL} alt="" fill sizes="32px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <User className="w-4 h-4 text-muted" />
              </div>
            )}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis komentar…"
              maxLength={500}
              className="flex-1 bg-surface border border-border rounded-app px-3 py-2 text-sm text-primary placeholder:text-muted outline-none focus:border-cyan/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className={clsx(
                'w-9 h-9 flex items-center justify-center rounded-app font-semibold transition-all flex-shrink-0',
                isHentai
                  ? 'bg-pink text-white hover:brightness-110 disabled:opacity-40'
                  : 'bg-cyan text-bg hover:brightness-110 disabled:opacity-40'
              )}
              aria-label="Kirim komentar"
            >
              <Send className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
