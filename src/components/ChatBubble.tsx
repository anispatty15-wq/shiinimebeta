'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useNotificationsList } from '@/hooks/useNotificationsList';

export default function ChatBubble() {
  const { notifications } = useNotificationsList();
  const unreadChats = notifications.filter((notification) => !notification.read && notification.type === 'chat_message').length;

  return (
    <Link
      href="/notifications"
      aria-label="Pesan dan notifikasi chat"
      className="fixed right-4 bottom-24 md:bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-pink text-white shadow-[0_8px_24px_rgba(233,30,140,0.35)] transition-transform hover:scale-105"
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      {unreadChats > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-bold text-white">
          {unreadChats > 9 ? '9+' : unreadChats}
        </span>
      )}
    </Link>
  );
}
