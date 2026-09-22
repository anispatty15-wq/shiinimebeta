'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Loader2, MessageCircle, Users, X } from 'lucide-react';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

const ADMIN_UID = 'pp4P99R0xdgB1fk4dUjFAnZsAnK2';

interface ChatContact {
  uid: string;
  displayName: string;
  photoURL: string;
  admin?: boolean;
}

export default function ChatBubble() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { notifications, markAsRead } = useNotificationsList();
  const [open, setOpen] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const dragged = useRef(false);
  const unreadChats = notifications.filter((notification) => !notification.read && notification.type === 'chat_message').length;
  const chatNotifications = notifications
    .filter((notification) => notification.type === 'chat_message')
    .slice(0, 8);
  const chatSenders = chatNotifications.filter((notification, index, list) => {
    const senderId = notification.data?.chatUid ?? notification.senderId;
    return senderId && list.findIndex((item) => (item.data?.chatUid ?? item.senderId) === senderId) === index;
  });
  const contactNames = new Map(contacts.map((contact) => [contact.uid, contact.displayName]));

  const openChat = async (uid: string, notificationIds: string[] = []) => {
    await Promise.all(notificationIds.map((notificationId) => markAsRead(notificationId)));
    setOpen(false);
    router.push(`/chat/${uid}`);
  };

  useEffect(() => {
    if (!open || !user || !db) return;
    let cancelled = false;

    const loadContacts = async () => {
      setLoadingContacts(true);
      try {
        const contactIds = new Set<string>();
        if (isAdmin) {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          usersSnapshot.forEach((item) => {
            if (item.id !== user.uid) contactIds.add(item.id);
          });
        } else {
          const friendsSnapshot = await getDocs(query(collection(db, 'friends'), where('userId', '==', user.uid)));
          friendsSnapshot.forEach((item) => {
            const friendId = item.data().friendId as string | undefined;
            if (friendId && friendId !== user.uid) contactIds.add(friendId);
          });
          contactIds.add(ADMIN_UID);
        }

        const loaded: ChatContact[] = [];
        for (const contactId of contactIds) {
          const item = await getDoc(doc(db, 'users', contactId));
          if (item.exists()) {
            const data = item.data();
            loaded.push({
              uid: contactId,
              displayName: data.displayName ?? 'Member',
              photoURL: data.photoURL ?? '',
              admin: contactId === ADMIN_UID,
            });
          } else if (contactId === ADMIN_UID) {
            loaded.push({ uid: contactId, displayName: 'Admin Shiiinime', photoURL: '', admin: true });
          }
        }
        loaded.sort((a, b) => Number(Boolean(b.admin)) - Number(Boolean(a.admin)) || a.displayName.localeCompare(b.displayName));
        if (!cancelled) setContacts(loaded);
      } catch (error) {
        console.error('[ChatBubble] Contact load error:', error);
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    };

    void loadContacts();
    return () => { cancelled = true; };
  }, [open, user, isAdmin]);

  useEffect(() => {
    const saved = window.localStorage.getItem('chat-bubble-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { x?: number; y?: number };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') setDragOffset({ x: parsed.x, y: parsed.y });
      } catch {
        window.localStorage.removeItem('chat-bubble-position');
      }
    }
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY, offsetX: dragOffset.x, offsetY: dragOffset.y };
    dragged.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStart.current) return;
    const next = {
      x: dragStart.current.offsetX + event.clientX - dragStart.current.x,
      y: dragStart.current.offsetY + event.clientY - dragStart.current.y,
    };
    if (Math.abs(next.x - dragStart.current.offsetX) > 4 || Math.abs(next.y - dragStart.current.offsetY) > 4) dragged.current = true;
    setDragOffset(next);
  };

  const handlePointerUp = () => {
    if (dragStart.current) {
      window.localStorage.setItem('chat-bubble-position', JSON.stringify(dragOffset));
    }
    dragStart.current = null;
  };

  if (!user) return null;

  return (
    <div
      className="fixed right-4 bottom-24 md:bottom-6 z-40"
      style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
    >
      {open && (
        <div className="absolute bottom-14 right-0 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-pink/25 bg-white shadow-[0_12px_40px_rgba(31,24,29,0.2)]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <MessageCircle className="h-4 w-4 text-pink" />
            <p className="flex-1 text-sm font-bold text-primary">{isAdmin ? 'Chat Semua Member' : 'Chat'}</p>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-primary" aria-label="Tutup chat">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {chatNotifications.length > 0 && (
              <div className="mb-2 border-b border-border pb-2">
                <p className="px-3 pb-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                  Pesan masuk
                </p>
                {chatSenders.map((notification) => {
                  const senderId = notification.data?.chatUid ?? notification.senderId;
                  if (!senderId) return null;
                  const senderNotifications = chatNotifications.filter(
                    (item) => (item.data?.chatUid ?? item.senderId) === senderId
                  );
                  return (
                    <button
                      key={notification.id}
                      onClick={() => openChat(senderId, senderNotifications.filter((item) => !item.read).map((item) => item.id))}
                      className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left hover:bg-pink/10"
                    >
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-border' : 'bg-pink'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-primary">
                          {contactNames.get(senderId) ?? 'Pesan baru'}
                        </span>
                        <span className="block truncate text-[0.7rem] text-muted">{notification.body}</span>
                      </span>
                      {senderNotifications.filter((item) => !item.read).length > 1 && (
                        <span className="rounded-full bg-pink/15 px-1.5 py-0.5 text-[0.6rem] font-bold text-pink">
                          {senderNotifications.filter((item) => !item.read).length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {loadingContacts ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Memuat kontak...</div>
            ) : contacts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted"><Users className="mx-auto mb-2 h-5 w-5" />Belum ada teman untuk diajak chat.</div>
            ) : contacts.map((contact) => (
              <button
                key={contact.uid}
                onClick={() => openChat(
                  contact.uid,
                  chatNotifications
                    .filter((notification) => (notification.data?.chatUid ?? notification.senderId) === contact.uid && !notification.read)
                    .map((notification) => notification.id)
                )}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-pink/10"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-pink/15 text-sm font-bold text-pink">
                  {contact.photoURL ? <img src={contact.photoURL} alt="" className="h-full w-full object-cover" /> : contact.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">{contact.displayName}</span>
                {contact.admin && <span className="text-[0.62rem] font-bold text-pink">ADMIN</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => {
          if (!dragged.current) setOpen((value) => !value);
        }}
        aria-label="Buka daftar chat"
        className="relative flex h-12 w-12 cursor-grab touch-none items-center justify-center rounded-full bg-pink text-white shadow-[0_8px_24px_rgba(233,30,140,0.35)] transition-transform hover:scale-105 active:cursor-grabbing"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
      {unreadChats > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-bold text-white">
          {unreadChats > 9 ? '9+' : unreadChats}
        </span>
      )}
      </button>
    </div>
  );
}
