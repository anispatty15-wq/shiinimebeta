'use client';

import { useEffect, useState } from 'react';
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
  const { notifications } = useNotificationsList();
  const [open, setOpen] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const unreadChats = notifications.filter((notification) => !notification.read && notification.type === 'chat_message').length;

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

  if (!user) return null;

  return (
    <div className="fixed right-4 bottom-24 md:bottom-6 z-40">
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
            {loadingContacts ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Memuat kontak...</div>
            ) : contacts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted"><Users className="mx-auto mb-2 h-5 w-5" />Belum ada teman untuk diajak chat.</div>
            ) : contacts.map((contact) => (
              <button
                key={contact.uid}
                onClick={() => { setOpen(false); router.push(`/chat/${contact.uid}`); }}
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
        onClick={() => setOpen((value) => !value)}
        aria-label="Buka daftar chat"
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-pink text-white shadow-[0_8px_24px_rgba(233,30,140,0.35)] transition-transform hover:scale-105"
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
