'use client';
// src/components/Comments.tsx — Realtime comments with like + reply + profile popup

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { MessageCircle, Send, User, LogIn, CornerDownRight, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { db, FIREBASE_READY } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getLevelFromXP, XP_COMMENT } from '@/lib/xp';
import { isCommentAllowed } from '@/lib/wordFilter';
import UserProfilePopup, { type PopupUser } from '@/components/UserProfilePopup';
import { createReplyNotification } from '@/hooks/useCommentNotifier';

// ── Types ─────────────────────────────────────────────────────
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
  xp:          number;
  totalMinutes:number;
  isAdmin:     boolean;
  replyTo?:    string;
  replyToName?: string;
  replyToText?: string;
  createdAt:   Timestamp | null;
}

interface CommentsProps {
  episodeSlug: string;
  contentType: 'anime' | 'hentai';
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ photoURL, name, size = 8 }: { photoURL?: string; name: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full overflow-hidden bg-surface-2 border border-border flex-shrink-0 relative`;
  return (
    <div className={cls}>
      {photoURL
        ? <Image src={photoURL} alt={name} fill sizes="40px" className="object-cover" />
        : <div className="absolute inset-0 flex items-center justify-center"><User className="w-4 h-4 text-muted" /></div>}
    </div>
  );
}

// ── Single comment row ────────────────────────────────────────
function CommentRow({
  comment, isHentai,
  onReply, onProfile,
}: {
  comment:    Comment;
  isHentai:   boolean;
  onReply:    (comment: Comment) => void;
  onProfile:  (comment: Comment) => void;
}) {
  const accentColor = isHentai ? 'text-pink' : 'text-cyan';

  return (
    <div className={clsx('flex gap-2', comment.replyTo && 'ml-8 mt-1')}>
      {/* Avatar — clickable */}
      <button
        onClick={() => onProfile(comment)}
        className="flex-shrink-0 mt-0.5 hover:opacity-80 transition-opacity"
        aria-label={`Lihat profil ${comment.displayName}`}
      >
        <Avatar photoURL={comment.photoURL} name={comment.displayName} size={8} />
      </button>

      <div className="flex-1 min-w-0">
        {/* Name + badge + time */}
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <button
            onClick={() => onProfile(comment)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {comment.displayName}
          </button>
          <span className={clsx(
            'text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full bg-surface-2 border border-border',
            comment.levelColor
          )}>
            {comment.badge} Lv.{comment.level}
          </span>
          {comment.isAdmin && (
            <span className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full bg-violet/15 border border-violet/40 text-violet">
              Admin
            </span>
          )}
          {comment.createdAt && (
            <span className="text-[0.58rem] text-muted/60 ml-auto">
              {new Date(comment.createdAt.toMillis()).toLocaleString('id-ID', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* Reply-to preview */}
        {comment.replyTo && comment.replyToName && (
          <div className={clsx(
            'mb-1.5 p-2 rounded border-l-2 bg-surface/50',
            isHentai ? 'border-pink/50' : 'border-cyan/50'
          )}>
            <div className={clsx('flex items-center gap-1 text-[0.65rem] mb-0.5', accentColor)}>
              <CornerDownRight className="w-3 h-3" aria-hidden />
              <span className="font-semibold">@{comment.replyToName}</span>
            </div>
            {comment.replyToText && (
              <p className="text-xs text-muted line-clamp-2 pl-4">
                {comment.replyToText}
              </p>
            )}
          </div>
        )}

        {/* Text */}
        <p className="text-sm text-secondary leading-relaxed break-words">{comment.text}</p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1">
          {/* Reply */}
          <button
            onClick={() => onReply(comment)}
            className="flex items-center gap-1 text-[0.65rem] text-muted hover:text-primary transition-colors"
          >
            <CornerDownRight className="w-3.5 h-3.5" aria-hidden />
            Balas
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function Comments({ episodeSlug, contentType }: CommentsProps) {
  const { user, profile, awardXP } = useAuth();
  const [comments,   setComments]   = useState<Comment[]>([]);
  const [text,       setText]       = useState('');
  const [sending,    setSending]    = useState(false);
  const [loaded,     setLoaded]     = useState(false);
  const [filterErr,  setFilterErr]  = useState<string | null>(null);
  const [replyTo,    setReplyTo]    = useState<Comment | null>(null);
  const [popupUser,  setPopupUser]  = useState<PopupUser | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const isHentai   = contentType === 'hentai';

  // ── Firestore listener ────────────────────────────────────
  useEffect(() => {
    if (!FIREBASE_READY || !db) return;
    const col = collection(db, 'comments', episodeSlug, 'messages');
    const q   = query(col, orderBy('createdAt', 'asc'), limit(200));

    const unsub = onSnapshot(q, (snap) => {
      const list: Comment[] = snap.docs.map((d) => {
        const data = d.data();
        const lvl  = getLevelFromXP(data.xp ?? 0);
        return {
          id:           d.id,
          text:         data.text         ?? '',
          uid:          data.uid          ?? '',
          displayName:  data.displayName  ?? 'User',
          photoURL:     data.photoURL     ?? '',
          level:        data.level        ?? 1,
          badge:        data.badge        ?? lvl.badge,
          levelName:    data.levelName    ?? lvl.name,
          levelColor:   lvl.color,
          xp:           data.xp           ?? 0,
          totalMinutes: data.totalMinutes ?? 0,
          isAdmin:      data.isAdmin      ?? false,
          likes:        Array.isArray(data.likes) ? data.likes : [],
          replyTo:      data.replyTo      ?? null,
          replyToName:  data.replyToName  ?? null,
          replyToText:  data.replyToText  ?? null,
          createdAt:    data.createdAt    ?? null,
        };
      });
      setComments(list);
      setLoaded(true);
    });
    return unsub;
  }, [episodeSlug]);

  useEffect(() => {
    if (loaded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length, loaded]);

  // ── Start reply ───────────────────────────────────────────
  const handleReply = useCallback((comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  }, []);

  // ── Profile popup ─────────────────────────────────────────
  const handleProfile = useCallback((comment: Comment) => {
    setPopupUser({
      uid:          comment.uid,
      displayName:  comment.displayName,
      photoURL:     comment.photoURL,
      level:        comment.level,
      badge:        comment.badge,
      levelName:    comment.levelName,
      xp:           comment.xp,
      totalMinutes: comment.totalMinutes,
      isAdmin:      comment.isAdmin,
    });
  }, []);

  // ── Submit comment ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !profile || !db || sending) return;

    const check = isCommentAllowed(text);
    if (!check.ok) { setFilterErr(check.reason ?? 'Tidak diizinkan.'); return; }
    setFilterErr(null);

    setSending(true);
    const lvl = getLevelFromXP(profile.xp ?? 0);
    const trimmedText = check.cleaned ?? text.trim();
    
    try {
      await addDoc(collection(db, 'comments', episodeSlug, 'messages'), {
        text:         trimmedText,
        uid:          user.uid,
        displayName:  profile.displayName,
        photoURL:     profile.photoURL,
        level:        lvl.level,
        levelName:    lvl.name,
        badge:        lvl.badge,
        xp:           profile.xp           ?? 0,
        totalMinutes: profile.totalMinutes  ?? 0,
        isAdmin:      profile.isAdmin       ?? false,
        replyTo:      replyTo?.id     ?? null,
        replyToName:  replyTo?.displayName ?? null,
        replyToText:  replyTo?.text ?? null,
        createdAt:    serverTimestamp(),
      });

      // Create notification if this is a reply
      if (replyTo?.id) {
        await createReplyNotification({
          episodeSlug,
          replyToCommentId: replyTo.id,
          replyAuthorId: user.uid,
          replyAuthorName: profile.displayName,
          replyText: trimmedText,
        });
      }

      setText('');
      setReplyTo(null);
      await awardXP(XP_COMMENT, 0);
    } catch (err) {
      console.error('[Comments] Error:', err);
    } finally {
      setSending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <section className="px-4 py-5 border-t border-border">
        {/* Header */}
        <h2 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
          <MessageCircle className={clsx('w-4 h-4', isHentai ? 'text-pink' : 'text-cyan')} aria-hidden />
          Komentar
          {comments.length > 0 && (
            <span className="text-xs text-muted font-normal">({comments.length})</span>
          )}
        </h2>

        {/* Comment list */}
        <div className="space-y-3.5 mb-4 max-h-96 overflow-y-auto pr-1">
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
            <p className="text-xs text-muted text-center py-6">
              Belum ada komentar. Jadilah yang pertama! 💬
            </p>
          )}

          {loaded && comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              isHentai={isHentai}
              onReply={handleReply}
              onProfile={handleProfile}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply preview with quoted text */}
        {replyTo && (
          <div className={clsx(
            'flex items-start gap-2 px-3 py-2 mb-2 rounded-app border',
            isHentai ? 'bg-pink/5 border-pink/20' : 'bg-cyan/5 border-cyan/20'
          )}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <CornerDownRight className={clsx('w-3.5 h-3.5 flex-shrink-0', isHentai ? 'text-pink' : 'text-cyan')} aria-hidden />
                <span className="text-xs font-semibold text-primary">
                  Membalas @{replyTo.displayName}
                </span>
              </div>
              <p className="text-xs text-secondary line-clamp-2 pl-5">
                "{replyTo.text}"
              </p>
            </div>
            <button 
              onClick={() => setReplyTo(null)} 
              className="text-muted hover:text-primary flex-shrink-0 mt-0.5" 
              aria-label="Batal balas"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}

        {/* Input */}
        {!FIREBASE_READY ? (
          <p className="text-xs text-muted">Komentar tidak tersedia.</p>
        ) : !user ? (
          <div className="flex items-center gap-3 p-3 rounded-app bg-surface border border-border">
            <LogIn className="w-4 h-4 text-muted flex-shrink-0" aria-hidden />
            <p className="text-xs text-secondary flex-1">
              <a href="/profile" className={clsx('font-semibold', isHentai ? 'text-pink' : 'text-cyan')}>Login</a>{' '}
              untuk berkomentar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Avatar photoURL={profile?.photoURL} name={profile?.displayName ?? ''} size={8} />
            <div className="flex-1 flex flex-col gap-1.5">
              {filterErr && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 px-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                  <span>{filterErr}</span>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => { setText(e.target.value); if (filterErr) setFilterErr(null); }}
                  placeholder={replyTo ? `Balas @${replyTo.displayName}…` : 'Tulis komentar…'}
                  maxLength={500}
                  className={clsx(
                    'flex-1 bg-surface border rounded-app px-3 py-2 text-sm text-primary placeholder:text-muted outline-none transition-colors',
                    filterErr ? 'border-red-400/60' : 'border-border focus:border-cyan/60'
                  )}
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  aria-label="Kirim"
                  className={clsx(
                    'w-9 h-9 flex items-center justify-center rounded-app transition-all flex-shrink-0',
                    isHentai ? 'bg-pink text-white hover:brightness-110 disabled:opacity-40'
                             : 'bg-cyan text-bg hover:brightness-110 disabled:opacity-40'
                  )}
                >
                  <Send className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Profile popup */}
      <UserProfilePopup user={popupUser} onClose={() => setPopupUser(null)} />
    </>
  );
}
