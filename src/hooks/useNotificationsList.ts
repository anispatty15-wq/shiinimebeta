/**
 * useNotificationsList Hook
 * 
 * Manages notification list, marking as read, and deleting
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export interface Notification {
  id: string;
  userId: string;
  type: 'new_episode' | 'comment_reply' | 'friend_request' | 'friend_accepted';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export function useNotificationsList() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const notifList: Notification[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        userId: doc.data().userId,
        type: doc.data().type,
        title: doc.data().title,
        body: doc.data().body,
        data: doc.data().data,
        read: doc.data().read ?? false,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      setNotifications(notifList);
      setUnreadCount(notifList.filter((n) => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, {
        read: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const unreadQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(unreadQuery);
      
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notifRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user]);

  // Delete all read notifications
  const deleteAllRead = useCallback(async () => {
    if (!user) return;

    try {
      const readQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', true)
      );

      const snapshot = await getDocs(readQuery);
      
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting all read notifications:', error);
    }
  }, [user]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  };
}
