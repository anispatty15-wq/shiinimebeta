'use client';
/**
 * NotificationToast Component
 * 
 * Shows in-app notification toast when receiving foreground messages
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { useNotifications, type NotificationPayload } from '@/hooks/useNotifications';

export default function NotificationToast() {
  const { latestNotification } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (latestNotification) {
      setNotification(latestNotification);
      setVisible(true);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification]);

  const handleClick = () => {
    if (notification?.data?.click_action) {
      router.push(notification.data.click_action);
    } else if (notification?.type === 'new_episode' && notification?.data?.animeId) {
      router.push(`/anime/${notification.data.animeId}`);
    } else if (notification?.type === 'friend_request') {
      router.push('/friends');
    } else {
      router.push('/notifications');
    }
    setVisible(false);
  };

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible || !notification) {
    return null;
  }

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
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

  return (
    <div 
      className="fixed top-16 md:top-4 right-4 left-4 md:left-auto md:w-96 z-[60] animate-slide-up"
      role="alert"
      aria-live="polite"
    >
      <div 
        onClick={handleClick}
        className="bg-surface border border-border rounded-app shadow-modal p-4 cursor-pointer hover:bg-surface-2 transition-colors relative group"
      >
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex gap-3 items-start">
          {/* Icon */}
          <div className="w-10 h-10 rounded-app bg-cyan/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">{getIcon()}</span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-sm font-semibold text-primary mb-0.5 truncate">
              {notification.title}
            </h4>
            <p className="text-xs text-secondary line-clamp-2">
              {notification.body}
            </p>
          </div>
        </div>

        {/* Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-2 rounded-b-app overflow-hidden">
          <div 
            className="h-full bg-cyan animate-[slide-left_5s_linear]"
            style={{
              animation: 'slide-left 5s linear forwards'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-left {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
