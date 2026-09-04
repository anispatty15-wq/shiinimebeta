'use client';
// src/app/chat/[uid]/page.tsx
// Simple DM chat page

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Send, User, Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  collection, doc, getDoc, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

interface ChatUser {
  uid: string;
  displayName: string;
  photoURL: string;
}

export default function ChatPage() {
  const { uid: otherUserId } = useParams<{ uid: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate conversation ID (sorted UIDs)
  const conversationId = user && otherUserId
    ? [user.uid, otherUserId].sort().join('_')
    : '';

  // Fetch other user info
  useEffect(() => {
    if (!otherUserId || !db) return;

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setOtherUser({
            uid: otherUserId,
            displayName: data.displayName || 'User',
            photoURL: data.photoURL || '',
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [otherUserId]);

  // Listen to messages
  useEffect(() => {
    if (!conversationId || !db) return;

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsub();
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationId || !db || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        text: newMessage.trim(),
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Gagal mengirim pesan. Coba lagi.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan animate-spin" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted mx-auto mb-4" />
          <p className="text-sm text-secondary">User tidak ditemukan</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan text-bg font-semibold hover:brightness-110 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 relative flex-shrink-0">
          {otherUser.photoURL ? (
            <Image src={otherUser.photoURL} alt={otherUser.displayName} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-5 h-5 text-muted" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-primary truncate">{otherUser.displayName}</h2>
          <p className="text-xs text-muted">Chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-sm text-secondary">Belum ada pesan. Mulai chat!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === user?.uid;
          return (
            <div
              key={msg.id}
              className={clsx(
                'flex gap-2',
                isMine ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={clsx(
                  'max-w-[75%] px-4 py-2 rounded-2xl text-sm',
                  isMine
                    ? 'bg-cyan text-bg rounded-br-none'
                    : 'bg-surface-2 text-primary rounded-bl-none'
                )}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="bg-surface border-t border-border p-4 flex items-center gap-3"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ketik pesan..."
          className="flex-1 px-4 py-2 rounded-full bg-surface-2 border border-border text-sm text-primary placeholder:text-muted focus:outline-none focus:border-cyan transition-colors"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="w-10 h-10 rounded-full bg-cyan text-bg flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
