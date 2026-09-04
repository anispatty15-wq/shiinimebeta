// src/hooks/useFriendSystem.ts
// Friend system logic - send/accept/reject requests

import { useState, useEffect } from 'react';
import {
  collection, doc, setDoc, deleteDoc, getDoc, getDocs,
  query, where, serverTimestamp, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export type FriendStatus = 'none' | 'pending' | 'friends' | 'incoming';

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export function useFriendSystem(targetUserId?: string) {
  const { user } = useAuth();
  const [status, setStatus] = useState<FriendStatus>('none');
  const [loading, setLoading] = useState(true);

  // Check friend status with target user
  useEffect(() => {
    if (!user || !targetUserId || !db) {
      setLoading(false);
      return;
    }

    let unsub: Unsubscribe | undefined;

    const checkStatus = async () => {
      try {
        // Check if already friends
        const friendDoc = await getDoc(doc(db, 'friends', `${user.uid}_${targetUserId}`));
        if (friendDoc.exists()) {
          setStatus('friends');
          setLoading(false);
          return;
        }

        // Check if we sent a request
        const sentRequest = await getDoc(doc(db, 'friendRequests', `${user.uid}_${targetUserId}`));
        if (sentRequest.exists() && sentRequest.data()?.status === 'pending') {
          setStatus('pending');
          setLoading(false);
          return;
        }

        // Check if we received a request
        const receivedRequest = await getDoc(doc(db, 'friendRequests', `${targetUserId}_${user.uid}`));
        if (receivedRequest.exists() && receivedRequest.data()?.status === 'pending') {
          setStatus('incoming');
          setLoading(false);
          return;
        }

        setStatus('none');
        setLoading(false);

        // Real-time updates
        unsub = onSnapshot(
          collection(db, 'friendRequests'),
          () => {
            checkStatus();
          }
        );
      } catch (err) {
        console.error('Error checking friend status:', err);
        setLoading(false);
      }
    };

    checkStatus();

    return () => unsub?.();
  }, [user, targetUserId]);

  // Send friend request
  const sendRequest = async () => {
    if (!user || !targetUserId || !db) return;

    try {
      const requestId = `${user.uid}_${targetUserId}`;
      await setDoc(doc(db, 'friendRequests', requestId), {
        from: user.uid,
        to: targetUserId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setStatus('pending');
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Gagal mengirim friend request. Coba lagi.');
    }
  };

  // Accept friend request
  const acceptRequest = async () => {
    if (!user || !targetUserId || !db) return;

    try {
      const requestId = `${targetUserId}_${user.uid}`;
      
      // Create friendship (both directions)
      await setDoc(doc(db, 'friends', `${user.uid}_${targetUserId}`), {
        userId: user.uid,
        friendId: targetUserId,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'friends', `${targetUserId}_${user.uid}`), {
        userId: targetUserId,
        friendId: user.uid,
        createdAt: serverTimestamp(),
      });

      // Delete request
      await deleteDoc(doc(db, 'friendRequests', requestId));
      
      setStatus('friends');
    } catch (err) {
      console.error('Error accepting friend request:', err);
      alert('Gagal accept friend request. Coba lagi.');
    }
  };

  // Reject/Cancel request
  const rejectRequest = async () => {
    if (!user || !targetUserId || !db) return;

    try {
      // Could be incoming or outgoing
      const requestId1 = `${user.uid}_${targetUserId}`;
      const requestId2 = `${targetUserId}_${user.uid}`;

      await deleteDoc(doc(db, 'friendRequests', requestId1)).catch(() => {});
      await deleteDoc(doc(db, 'friendRequests', requestId2)).catch(() => {});
      
      setStatus('none');
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  };

  // Remove friend
  const removeFriend = async () => {
    if (!user || !targetUserId || !db) return;

    try {
      await deleteDoc(doc(db, 'friends', `${user.uid}_${targetUserId}`));
      await deleteDoc(doc(db, 'friends', `${targetUserId}_${user.uid}`));
      
      setStatus('none');
    } catch (err) {
      console.error('Error removing friend:', err);
      alert('Gagal remove friend. Coba lagi.');
    }
  };

  return {
    status,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  };
}
