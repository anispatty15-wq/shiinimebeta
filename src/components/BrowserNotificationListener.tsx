'use client';

import { useEffect, useRef } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db, FIREBASE_READY } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

type BrowserNotificationData = {
  title?: string;
  body?: string;
  type?: string;
  data?: Record<string, unknown>;
};

export default function BrowserNotificationListener() {
  const { user } = useAuth();
  const knownIds = useRef(new Set<string>());
  const ready = useRef(false);

  useEffect(() => {
    knownIds.current = new Set();
    ready.current = false;

    if (!user || !FIREBASE_READY || !db || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(50)
    );

    return onSnapshot(notificationsQuery, async (snapshot) => {
      const newNotifications = snapshot.docChanges()
        .filter((change) => change.type === 'added' && !knownIds.current.has(change.doc.id))
        .map((change) => ({ id: change.doc.id, ...change.doc.data() } as BrowserNotificationData & { id: string }));

      snapshot.docs.forEach((notificationDoc) => knownIds.current.add(notificationDoc.id));

      // The initial snapshot only establishes the baseline and must not spam users.
      if (!ready.current) {
        ready.current = true;
        return;
      }

      if (Notification.permission !== 'granted') return;

      for (const notification of newNotifications) {
        const title = notification.title || 'Shiiinime';
        const options: NotificationOptions = {
          body: notification.body || 'Ada notifikasi baru.',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: notification.type || 'shiinime-notification',
          data: notification.data,
        };

        try {
          // Direct browser notifications work even when FCM/VAPID is not configured.
          new Notification(title, options);
        } catch (error) {
          console.error('[BrowserNotificationListener] Failed to show notification:', error);
        }
      }
    }, (error) => {
      console.error('[BrowserNotificationListener] Failed to listen:', error);
    });
  }, [user]);

  return null;
}
