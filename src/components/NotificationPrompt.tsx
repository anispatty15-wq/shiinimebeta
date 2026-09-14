'use client';
/**
 * NotificationPrompt Component
 * 
 * Shows a prompt to enable push notifications
 * Displays after user is logged in and hasn't granted permission yet
 */

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationPrompt() {
  const { user } = useAuth();
  const { isSupported, permission, requestPermission } = useNotifications();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if dismissed in localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        setIsDismissed(true);
        localStorage.setItem('notification-prompt-dismissed', 'true');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // Don't show if:
  // - User not logged in
  // - Already dismissed
  // - Not supported
  // - Permission already granted or denied
  if (
    !user ||
    isDismissed ||
    !isSupported ||
    permission !== 'default'
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-surface border border-border rounded-app shadow-modal p-4 relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-muted hover:text-primary transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-app bg-cyan/10 flex items-center justify-center mb-3">
          <Bell className="w-6 h-6 text-cyan" />
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-primary mb-1">
          Aktifkan Notifikasi
        </h3>
        <p className="text-sm text-secondary mb-4">
          Dapatkan notifikasi saat episode baru rilis, ada balasan komentar, dan friend request.
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="btn-primary flex-1 text-sm py-2"
          >
            {isLoading ? 'Mengaktifkan...' : '🔔 Aktifkan'}
          </button>
          <button
            onClick={handleDismiss}
            className="btn-ghost text-sm py-2 px-3"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
}
