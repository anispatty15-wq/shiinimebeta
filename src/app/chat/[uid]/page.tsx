'use client';
// src/app/chat/[uid]/page.tsx
// Direct message chat with another user

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, Send, User, Loader2, MessageCircle, ImagePlus, Video, Gift, X
} from 'lucide-react';
import {
  collection, doc, getDoc, addDoc, query,
  orderBy, onSnapshot, serverTimestamp, setDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { CHAT_GIFTS, getChatGift, type ChatGift } from '@/lib/gifts';
import { compressMedia } from '@/lib/mediaCompression';

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  giftId?: string;
  giftName?: string;
  giftEmoji?: string;
  senderId: string;
  createdAt: any;
}

interface OtherUser {
  uid: string;
  displayName: string;
  photoURL: string;
}

interface GiphyResult {
  id: string;
  title: string;
  url: string;
  preview: string;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
  if (!cloudName || !uploadPreset) throw new Error('Cloudinary belum dikonfigurasi.');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Upload media ke Cloudinary gagal.');
  const result = await response.json() as { secure_url?: string };
  if (!result.secure_url) throw new Error('Cloudinary tidak mengembalikan URL media.');
  return result.secure_url;
}

export default function ChatPage() {
  const { uid: otherUid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [otherUserLoading, setOtherUserLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [showGifts, setShowGifts] = useState(false);
  const [selectedGift, setSelectedGift] = useState<ChatGift | null>(null);
  const [gifSuggestions, setGifSuggestions] = useState<GiphyResult[]>([]);
  const [gifSearching, setGifSearching] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const query = inputText.trim();
    if (query.length < 2) {
      setGifSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setGifSearching(true);
      try {
        const response = await fetch(`/api/giphy/search?q=${encodeURIComponent(query)}`);
        const payload = await response.json() as { results?: GiphyResult[] };
        setGifSuggestions(response.ok ? (payload.results ?? []).slice(0, 6) : []);
      } catch {
        setGifSuggestions([]);
      } finally {
        setGifSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [inputText]);

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
    const firestore = db;
    setOtherUserLoading(true);
    setOtherUser(null);

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', otherUid));
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
      } finally {
        setOtherUserLoading(false);
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
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const loadMessages = async () => {
      try {
        const deletionDoc = await getDoc(
          doc(db, 'userData', user.uid, 'chatDeletions', conversationId)
        );
        const deletedAt = deletionDoc.exists()
          ? Number(deletionDoc.data().deletedAt ?? 0)
          : null;
        if (cancelled) return;

        unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs: Message[] = [];
          snapshot.forEach((messageDoc) => {
            const message = { id: messageDoc.id, ...messageDoc.data() } as Message;
            const createdAt = message.createdAt?.toMillis?.() ?? 0;
            if (!deletedAt || !createdAt || createdAt > deletedAt) {
              msgs.push(message);
            }
          });
          setMessages(msgs);
          setLoading(false);
        }, (error) => {
          console.error('Error listening to chat:', error);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading chat:', error);
        setLoading(false);
      }
    };

    void loadMessages();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user, otherUid]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !otherUid || !db || (!inputText.trim() && !selectedImage && !selectedMediaUrl && !selectedGift)) return;

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
      let mediaUrl = '';

      if (selectedMediaUrl) {
        mediaUrl = selectedMediaUrl;
      } else if (selectedImage) {
        mediaUrl = await uploadToCloudinary(await compressMedia(selectedImage));
      }
      
      await addDoc(messagesRef, {
        text: text || '',
        ...(mediaUrl ? { mediaUrl, mediaType, ...(mediaType === 'image' ? { imageUrl: mediaUrl } : {}) } : {}),
        ...(selectedGift ? { giftId: selectedGift.id, giftName: selectedGift.name, giftEmoji: selectedGift.emoji } : {}),
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: otherUid,
        senderId: user.uid,
        type: 'chat_message',
        title: 'Pesan chat baru',
        body: text ? text.slice(0, 100) : selectedGift ? `Mengirim gift ${selectedGift.emoji}` : mediaType === 'video' ? 'Mengirim video' : 'Mengirim gambar',
        data: { chatUid: user.uid },
        read: false,
        createdAt: serverTimestamp(),
      });

      // Focus back to input
      inputRef.current?.focus();
      setSelectedImage(null);
      setSelectedMediaUrl('');
      setImagePreview('');
      setSelectedGift(null);
      setShowGifts(false);
      setGifSuggestions([]);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Gagal mengirim pesan. Coba lagi.');
      setInputText(text); // Restore text
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!user || !otherUid || !db) return;
    const targetName = otherUser?.displayName ?? 'orang ini';
    if (!window.confirm(`Hapus chat dengan ${targetName} untuk akun kamu? Pesan tetap tersimpan untuk pengguna lain.`)) {
      return;
    }

    try {
      setDeletingChat(true);
      const conversationId = getConversationId(user.uid, otherUid);
      const deletedAt = Date.now();
      await setDoc(doc(db, 'userData', user.uid, 'chatDeletions', conversationId), {
        deletedAt,
        updatedAt: serverTimestamp(),
      });
      setMessages([]);
    } catch (err) {
      console.error('Error deleting chat:', err);
      alert('Gagal menghapus chat. Coba lagi.');
    } finally {
      setDeletingChat(false);
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

  if (loading || otherUserLoading) {
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
    <div className="fixed inset-x-0 top-16 bottom-16 z-30 flex min-h-0 flex-col overflow-hidden bg-bg md:bottom-0 md:top-14">
      {/* Header */}
      <div className="z-20 flex shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-app text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {otherUser ? (
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/profile/${otherUid}`)}
                className="text-xs text-cyan hover:text-cyan/80 transition-colors"
              >
                View Profile
              </button>
              <button
                onClick={handleDeleteChat}
                disabled={deletingChat}
                className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {deletingChat ? 'Menghapus...' : 'Hapus untuk saya'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-2" />
            <div className="h-3 w-28 animate-pulse rounded bg-surface-2" />
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 pb-28 md:pb-24">
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
                  {msg.mediaUrl && msg.mediaType === 'video' && (
                    <video src={msg.mediaUrl} controls preload="metadata" className="mt-2 max-w-full max-h-64 rounded-lg" />
                  )}
                  {msg.giftId && (
                    <div className="mt-2 rounded-xl border border-pink-300/40 bg-pink-500/10 px-4 py-3 text-center">
                      <div className="text-4xl">{msg.giftEmoji ?? getChatGift(msg.giftId)?.emoji ?? '🎁'}</div>
                      <p className="mt-1 text-xs font-semibold">{msg.giftName ?? getChatGift(msg.giftId)?.name ?? 'Gift'}</p>
                    </div>
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
        className="fixed inset-x-0 bottom-16 z-40 flex w-full shrink-0 items-center gap-2 border-y border-border bg-surface/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:bottom-0 md:px-4"
      >
        {gifSuggestions.length > 0 && (
          <div className="absolute bottom-16 left-3 right-3 z-30 rounded-xl border border-border bg-surface p-2 shadow-xl">
            <div className="mb-1 flex items-center justify-between text-[0.65rem] text-muted"><span>GIF rekomendasi</span>{gifSearching && <Loader2 className="h-3 w-3 animate-spin" />}</div>
            <div className="grid grid-cols-3 gap-1">
              {gifSuggestions.map((gif) => <button key={gif.id} type="button" onClick={() => { setSelectedImage(null); setSelectedMediaUrl(gif.url); setMediaType('image'); setImagePreview(gif.preview); setGifSuggestions([]); }} className="overflow-hidden rounded-lg"><img src={gif.preview} alt={gif.title} className="h-14 w-full object-cover" /></button>)}
            </div>
          </div>
        )}
        {imagePreview && (
          <div className="absolute bottom-16 left-4 flex items-center gap-2 rounded-app bg-surface border border-border p-2 shadow-lg">
            {mediaType === 'video' ? <video src={imagePreview} className="h-14 w-14 rounded object-cover" /> : <img src={imagePreview} alt="Preview lampiran" className="h-14 w-14 rounded object-cover" />}
            <button type="button" onClick={() => { setSelectedImage(null); setSelectedMediaUrl(''); setImagePreview(''); }} className="text-muted hover:text-red-500" aria-label="Hapus media">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {selectedGift && (
          <div className="absolute bottom-16 left-3 flex items-center gap-2 rounded-xl border border-border bg-surface p-2 shadow-lg">
            <span className="text-2xl">{selectedGift.emoji}</span>
            <span className="max-w-28 truncate text-xs font-semibold text-primary">{selectedGift.name}</span>
            <button type="button" onClick={() => setSelectedGift(null)} className="text-muted hover:text-red-500" aria-label="Hapus gift">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-secondary hover:text-pink" aria-label="Kirim gambar atau video">
          <ImagePlus className="w-5 h-5" />
          <input
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void compressMedia(file).then((compressed) => {
                setSelectedImage(compressed);
                setSelectedMediaUrl('');
                setMediaType(compressed.type.startsWith('video/') ? 'video' : 'image');
                setImagePreview(URL.createObjectURL(compressed));
              }).catch((error: Error) => alert(error.message));
            }}
          />
        </label>
        <div className="relative shrink-0">
          <button type="button" onClick={() => setShowGifts((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-secondary hover:text-yellow-400" aria-label="Pilih gift">
            <Gift className="w-5 h-5" />
          </button>
          {showGifts && (
            <div className="absolute bottom-12 left-0 z-30 w-48 rounded-xl border border-border bg-surface p-3 shadow-xl">
              <div className="mb-2 text-[0.65rem] font-semibold text-muted">Pilih gift</div>
              <div className="grid grid-cols-3 gap-2">
                {CHAT_GIFTS.map((gift) => (
                  <button key={gift.id} type="button" onClick={() => { setSelectedGift(gift); setShowGifts(false); }} className="flex h-12 w-full items-center justify-center rounded-lg border border-transparent text-2xl hover:border-yellow-400/30 hover:bg-surface-2" title={gift.name}>
                    {gift.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tulis pesan..."
          maxLength={500}
          className="min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-4 py-2.5 text-sm text-primary outline-none transition-colors placeholder:text-muted focus:border-cyan/60"
        />
        <button
          type="submit"
          disabled={(!inputText.trim() && !selectedImage && !selectedMediaUrl && !selectedGift) || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan text-bg hover:brightness-110 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
