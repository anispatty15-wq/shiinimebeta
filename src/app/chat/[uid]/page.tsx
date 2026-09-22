'use client';
// src/app/chat/[uid]/page.tsx
// Direct message chat with another user

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, Send, User, Loader2, MessageCircle, ImagePlus, X
} from 'lucide-react';
import {
  collection, doc, getDoc, addDoc, query,
  orderBy, onSnapshot, serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  senderId: string;
  createdAt: any;
}

interface OtherUser {
  uid: string;
  displayName: string;
  photoURL: string;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error('Cloudinary belum dikonfigurasi.');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Upload gambar ke Cloudinary gagal.');
  const result = await response.json() as { secure_url?: string };
  if (!result.secure_url) throw new Error('Cloudinary tidak mengembalikan URL gambar.');
  return result.secure_url;
}

export default function ChatPage() {
  const { uid: otherUid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get conversation ID (sorted UIDs)
  const getConversationId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join('_');
  };

  // Fetch other user info
  useEffect(() => {
    if (!otherUid || !db) return;

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', otherUid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setOtherUser({
            uid: otherUid,
            displayName: data.displayName ?? 'User',
            photoURL: data.photoURL ?? '',
          });
        }
      } catch (err) {
        console.error('Error fetching other user:', err);
      }
    };

    fetchUser();
  }, [otherUid]);

  // Listen to messages
  useEffect(() => {
    if (!user || !otherUid || !db) {
      setLoading(false);
      return;
    }

    const conversationId = getConversationId(user.uid, otherUid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, otherUid]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !otherUid || !db || (!inputText.trim() && !selectedImage)) return;

    const text = inputText.trim();
    if (text.length > 500) {
      alert('Pesan terlalu panjang! Maksimal 500 karakter.');
      return;
    }

    setSending(true);
    setInputText('');

    try {
      const conversationId = getConversationId(user.uid, otherUid);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      let imageUrl = '';

      if (selectedImage) {
        if (selectedImage.size > 10 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 10 MB.');
        imageUrl = await uploadToCloudinary(selectedImage);
      }
      
      await addDoc(messagesRef, {
        text: text || '',
        ...(imageUrl ? { imageUrl } : {}),
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: otherUid,
        senderId: user.uid,
        type: 'chat_message',
        title: 'Pesan chat baru',
        body: text ? text.slice(0, 100) : 'Mengirim gambar',
        data: { chatUid: user.uid },
        read: false,
        createdAt: serverTimestamp(),
      });

      // Focus back to input
      inputRef.current?.focus();
      setSelectedImage(null);
      setImagePreview('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Gagal mengirim pesan. Coba lagi.');
      setInputText(text); // Restore text
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-sm text-secondary">Login dulu untuk chat!</p>
          <button
            onClick={() => router.push('/profile')}
            className="mt-4 px-4 py-2 rounded-lg bg-cyan text-bg font-semibold hover:brightness-110"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-0 flex-col overflow-hidden bg-bg md:h-[calc(100dvh-3.5rem)]">
      {/* Header */}
      <div className="z-20 flex shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-app text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {otherUser && (
          <>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 flex-shrink-0 relative">
              {otherUser.photoURL ? (
                <Image 
                  src={otherUser.photoURL} 
                  alt={otherUser.displayName} 
                  fill 
                  className="object-cover" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-5 h-5 text-muted" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-primary truncate">
                {otherUser.displayName}
              </h1>
              <p className="text-xs text-muted">Chat langsung</p>
            </div>

            <button
              onClick={() => router.push(`/profile/${otherUid}`)}
              className="text-xs text-cyan hover:text-cyan/80 transition-colors"
            >
              View Profile
            </button>
          </>
        )}
      </div>

      {/* Messages area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-sm text-secondary">Belum ada pesan</p>
            <p className="text-xs text-muted mt-1">Kirim pesan pertama!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user.uid;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                    isMine
                      ? 'bg-cyan text-bg rounded-br-sm'
                      : 'bg-surface border border-border text-primary rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  {msg.imageUrl && (
                    <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="block mt-2">
                      <img src={msg.imageUrl} alt="Lampiran chat" className="max-w-full max-h-64 rounded-lg object-cover" />
                    </a>
                  )}
                  {msg.createdAt && (
                    <p
                      className={`text-[0.65rem] mt-1 ${
                        isMine ? 'text-bg/60' : 'text-muted'
                      }`}
                    >
                      {new Date(msg.createdAt.toDate()).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="z-20 flex shrink-0 items-center gap-2 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur"
      >
        {imagePreview && (
          <div className="absolute bottom-16 left-4 flex items-center gap-2 rounded-app bg-surface border border-border p-2 shadow-lg">
            <img src={imagePreview} alt="Preview lampiran" className="h-14 w-14 rounded object-cover" />
            <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(''); }} className="text-muted hover:text-red-500" aria-label="Hapus gambar">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <label className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-secondary hover:text-pink cursor-pointer flex-shrink-0" aria-label="Kirim gambar">
          <ImagePlus className="w-5 h-5" />
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setSelectedImage(file);
              setImagePreview(URL.createObjectURL(file));
            }}
          />
        </label>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tulis pesan..."
          maxLength={500}
          className="flex-1 px-4 py-2.5 rounded-full bg-surface-2 border border-border text-sm text-primary placeholder:text-muted outline-none focus:border-cyan/60 transition-colors"
        />
        <button
          type="submit"
          disabled={(!inputText.trim() && !selectedImage) || sending}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan text-bg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
