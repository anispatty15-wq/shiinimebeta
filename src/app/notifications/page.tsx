'use client';
/**
 * Notifications Page
 * 
 * Display all notifications (episode updates, comment replies, friend requests)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Trash2, CheckCheck, Filter, Loader2 } from 'lucide-react';
import { useNotificationsList, type Notification } from '@/hooks/useNotificationsList';
import { useAuth } from '@/context/AuthContext';
import { clsx } from 'clsx';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotificationsList();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'new_episode' && notification.data?.animeId) {
      router.push(`/anime/${notification.data.animeId}`);
    } else if (notification.type === 'comment_reply' && notification.data?.animeId) {
      router.push(`/anime/${notification.data.animeId}?comment=${notification.data.commentId}`);
    } else if (notification.type === 'friend_request' || notification.type === 'friend_accepted') {
      router.push('/friends');
    }
  };

  const handleDelete = async (notificationId: string) => {
    setDeleting(notificationId);
    try {
      await deleteNotification(notificationId);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!confirm('Hapus semua notifikasi yang sudah dibaca?')) return;
    
    await deleteAllRead();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_episode':
        return '🎬';
      case 'comment_reply':
        return '💬';
      case 'friend_request':
        return '👋';
      case 'friend_accepted':
        return '✨';
      default:
        return '🔔';
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'new_episode':
        return 'Episode Baru';
      case 'comment_reply':
        return 'Balasan Komentar';
      case 'friend_request':
        return 'Friend Request';
      case 'friend_accepted':
        return 'Friend Accepted';
      default:
        return 'Notifikasi';
    }
  };

  if (!user) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-primary mb-2">Login Required</h2>
          <p className="text-secondary">Silakan login untuk melihat notifikasi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
          <Bell className="w-6 h-6 text-cyan" />
          Notifikasi
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-cyan/10 text-cyan text-sm font-semibold">
              {unreadCount}
            </span>
          )}
        </h1>
        <p className="text-sm text-secondary">
          Lihat semua notifikasi episode baru, balasan komentar, dan friend request
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {/* Filter */}
        <div className="flex gap-1 bg-surface border border-border rounded-app p-1">
          <button
            onClick={() => setFilter('all')}
            className={clsx(
              'px-3 py-1.5 rounded text-xs font-semibold transition-colors',
              filter === 'all'
                ? 'bg-cyan/10 text-cyan'
                : 'text-secondary hover:text-primary'
            )}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={clsx(
              'px-3 py-1.5 rounded text-xs font-semibold transition-colors',
              filter === 'unread'
                ? 'bg-cyan/10 text-cyan'
                : 'text-secondary hover:text-primary'
            )}
          >
            Belum Dibaca
            {unreadCount > 0 && ` (${unreadCount})`}
          </button>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-ghost text-xs py-2 px-3"
          >
            <CheckCheck className="w-4 h-4" />
            Tandai Semua Dibaca
          </button>
        )}

        {notifications.some((n) => n.read) && (
          <button
            onClick={handleDeleteAllRead}
            className="btn-ghost text-xs py-2 px-3 text-pink-400 hover:bg-pink-400/10"
          >
            <Trash2 className="w-4 h-4" />
            Hapus yang Dibaca
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-cyan animate-spin mx-auto mb-3" />
          <p className="text-sm text-secondary">Loading notifikasi...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-muted mx-auto mb-4" />
          <p className="text-secondary">
            {filter === 'unread' ? 'Tidak ada notifikasi baru' : 'Belum ada notifikasi'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={clsx(
                'group relative bg-surface border rounded-app p-4 transition-all cursor-pointer',
                notification.read
                  ? 'border-border hover:border-border/60'
                  : 'border-cyan/30 bg-cyan/5 hover:border-cyan/50'
              )}
            >
              {/* Unread indicator */}
              {!notification.read && (
                <div className="absolute top-4 left-0 w-1 h-1 rounded-full bg-cyan" />
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={clsx(
                    'w-10 h-10 rounded-app flex items-center justify-center flex-shrink-0',
                    notification.read ? 'bg-surface-2' : 'bg-cyan/10'
                  )}
                >
                  <span className="text-xl">{getIcon(notification.type)}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Type badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[0.65rem] font-semibold text-muted uppercase tracking-wide">
                      {getTypeLabel(notification.type)}
                    </span>
                    <span className="text-[0.65rem] text-muted">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className={clsx(
                      'text-sm font-semibold mb-0.5',
                      notification.read ? 'text-primary' : 'text-cyan'
                    )}
                  >
                    {notification.title}
                  </h3>

                  {/* Body */}
                  <p className="text-xs text-secondary line-clamp-2">
                    {notification.body}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                  disabled={deleting === notification.id}
                  className="w-8 h-8 flex items-center justify-center rounded text-muted hover:text-pink-400 hover:bg-pink-400/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Hapus notifikasi"
                >
                  {deleting === notification.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'Baru saja';
  } else if (minutes < 60) {
    return `${minutes} menit lalu`;
  } else if (hours < 24) {
    return `${hours} jam lalu`;
  } else if (days < 7) {
    return `${days} hari lalu`;
  } else {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}
