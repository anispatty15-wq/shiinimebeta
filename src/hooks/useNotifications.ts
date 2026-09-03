/**
 * useNotifications Hook
 * 
 * Handles push notification permissions, FCM token management,
 * and foreground message listening
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export interface NotificationPayload {
  title: string;
  body: string;
  type: 'new_episode' | 'comment_reply' | 'friend_request' | 'friend_accepted';
  data?: Record<string, any>;
}

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [latestNotification, setLatestNotification] = useState<NotificationPayload | null>(null);

  // Check if notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window;
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Get FCM token after permission granted
        await getFCMToken();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Get FCM token
  const getFCMToken = useCallback(async (): Promise<string | null> => {
    if (!isSupported || !user) {
      return null;
    }

    try {
      // Register service worker first
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      const messaging = getMessaging(app);
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log('FCM Token obtained:', token);
        setFcmToken(token);

        // Send token to backend
        const functions = getFunctions(app);
        const updateToken = httpsCallable(functions, 'updateFCMToken');
        
        await updateToken({ fcmToken: token });
        console.log('FCM token saved to backend');

        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }, [isSupported, user]);

  // Listen to foreground messages
  useEffect(() => {
    if (!isSupported || !user || permission !== 'granted') {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupMessageListener = async () => {
      try {
        const messaging = getMessaging(app);
        
        unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
          console.log('Foreground message received:', payload);

          const notification: NotificationPayload = {
            title: payload.notification?.title || 'Shiiinime',
            body: payload.notification?.body || '',
            type: (payload.data?.type as any) || 'new_episode',
            data: payload.data,
          };

          setLatestNotification(notification);

          // Show browser notification if app is in background
          if (document.hidden) {
            new Notification(notification.title, {
              body: notification.body,
              icon: '/icon.svg',
              badge: '/icon.svg',
              tag: notification.type,
              data: notification.data,
            });
          }
        });
      } catch (error) {
        console.error('Error setting up message listener:', error);
      }
    };

    setupMessageListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isSupported, user, permission]);

  // Auto-request permission if user is logged in and permission is default
  useEffect(() => {
    if (user && permission === 'default' && isSupported) {
      // Don't auto-request immediately, wait for user interaction
      // This is just to prepare the state
    }
  }, [user, permission, isSupported]);

  return {
    isSupported,
    permission,
    fcmToken,
    latestNotification,
    requestPermission,
    getFCMToken,
    hasPermission: permission === 'granted',
  };
}
