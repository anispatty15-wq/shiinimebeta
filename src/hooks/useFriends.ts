/**
 * useFriends Hook
 * 
 * Manages friend relationships, friend requests, and user search
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc, 
  writeBatch,
  updateDoc, 
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  or,
  and,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  createFriendRequestNotification,
  createFriendAcceptedNotification 
} from './useCommentNotifier';

export interface User {
  uid: string;
  publicId?: string;
  displayName: string;
  photoURL?: string;
  email?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface Friend {
  uid: string;
  displayName: string;
  photoURL?: string;
  friendsSince: Date;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load friends
  const loadFriends = useCallback(async () => {
    if (!user) return;

    try {
      const friendsQuery = query(
        collection(db, 'friends'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(friendsQuery);
      const friendsList: Friend[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const friendId = data.friendId;

        // Get friend user info
        const userDoc = await getDoc(doc(db, 'users', friendId));

        if (userDoc.exists()) {
          const friendData = userDoc.data();
          friendsList.push({
            uid: friendId,
            displayName: friendData.displayName || 'Unknown',
            photoURL: friendData.photoURL,
            friendsSince: data.createdAt?.toDate() || new Date(),
          });
        }
      }

      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }, [user]);

  // Load pending requests (received)
  const loadPendingRequests = useCallback(async () => {
    if (!user) return;

    try {
      const requestsQuery = query(collection(db, 'friendRequests'), orderBy('createdAt', 'desc'), limit(100));

      const snapshot = await getDocs(requestsQuery);
      const requests = await Promise.all(snapshot.docs.map(async (requestDoc) => {
        const data = requestDoc.data();
        const fromUserId = data.fromUserId ?? data.from;
        let sender = data.fromUserName || data.fromName || '';
        let senderAvatar = data.fromUserAvatar || data.fromAvatar || '';
        if (fromUserId && (!sender || !senderAvatar)) {
          const senderDoc = await getDoc(doc(db, 'users', fromUserId));
          if (senderDoc.exists()) {
            const senderData = senderDoc.data();
            sender = sender || senderData.displayName || 'Seseorang';
            senderAvatar = senderAvatar || senderData.photoURL || '';
          }
        }
        return {
        id: requestDoc.id,
        ...data,
        fromUserId,
        toUserId: data.toUserId ?? data.to,
        fromUserName: sender || 'Seseorang',
        fromUserAvatar: senderAvatar,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
      })).then((items) => items.filter((request) => request.toUserId === user.uid && request.status === 'pending')) as FriendRequest[];

      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  }, [user]);

  // Load sent requests
  const loadSentRequests = useCallback(async () => {
    if (!user) return;

    try {
      const requestsQuery = query(collection(db, 'friendRequests'), orderBy('createdAt', 'desc'), limit(100));

      const snapshot = await getDocs(requestsQuery);
      const requests: FriendRequest[] = snapshot.docs.map((requestDoc) => {
        const data = requestDoc.data();
        return {
        id: requestDoc.id,
        ...data,
        fromUserId: data.fromUserId ?? data.from,
        toUserId: data.toUserId ?? data.to,
        fromUserName: data.fromUserName ?? 'Seseorang',
        createdAt: data.createdAt?.toDate() || new Date(),
      }; }).filter((request) => request.fromUserId === user.uid && request.status === 'pending') as FriendRequest[];

      setSentRequests(requests);
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  }, [user]);

  // Search users
  const searchUsers = async (searchTerm: string): Promise<User[]> => {
    if (!searchTerm.trim() || !user) return [];

    try {
      const snapshot = await getDocs(query(collection(db, 'users'), limit(100)));
      const normalized = searchTerm.trim().toLowerCase();
      const users: User[] = snapshot.docs
        .map((doc) => ({
          uid: doc.id,
          publicId: doc.data().publicId,
          displayName: doc.data().displayName,
          photoURL: doc.data().photoURL,
          email: doc.data().email,
        }))
        .filter((u) => u.displayName?.toLowerCase().includes(normalized) || u.publicId === searchTerm.trim())
        .filter((u) => u.uid !== user.uid); // Exclude current user

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Send friend request
  const sendFriendRequest = async (toUserId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if already friends
      const friendsQuery = query(
        collection(db, 'friends'),
        where('userId', '==', user.uid),
        where('friendId', '==', toUserId)
      );
      const friendsSnapshot = await getDocs(friendsQuery);
      if (!friendsSnapshot.empty) {
        throw new Error('Already friends');
      }

      // Check if request already exists
      const existingQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', user.uid),
        where('toUserId', '==', toUserId),
        where('status', '==', 'pending')
      );
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        throw new Error('Request already sent');
      }

      // Create friend request
      const requestDoc = await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        fromUserName: user.displayName || 'Anonymous',
        fromUserAvatar: user.photoURL || '',
        toUserId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Create notification for the recipient
      await createFriendRequestNotification(
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || '',
        toUserId,
        requestDoc.id
      );

      await loadSentRequests();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      
      // Get request data
      const requestSnapshot = await getDocs(
        query(collection(db, 'friendRequests'), where('__name__', '==', requestId))
      );
      
      if (requestSnapshot.empty) {
        throw new Error('Request not found');
      }

      const requestData = requestSnapshot.docs[0].data();
      const fromUserId = requestData.fromUserId ?? requestData.from;
      const toUserId = requestData.toUserId ?? requestData.to;
      if (!fromUserId || toUserId !== user.uid) {
        throw new Error('Friend request tidak valid');
      }

      // Complete the request and create both friendship records atomically.
      // This prevents a half-accepted request when one write fails.
      const batch = writeBatch(db);
      batch.update(requestRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'friends', `${user.uid}_${fromUserId}`), {
        userId: user.uid,
        friendId: fromUserId,
        createdAt: serverTimestamp(),
      }, { merge: true });
      batch.set(doc(db, 'friends', `${fromUserId}_${user.uid}`), {
        userId: fromUserId,
        friendId: user.uid,
        createdAt: serverTimestamp(),
      }, { merge: true });
      await batch.commit();

      // Create notification for the requester
      await createFriendAcceptedNotification(
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || '',
        fromUserId,
        requestId
      );

      await loadPendingRequests();
      await loadFriends();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert(error instanceof Error ? error.message : 'Gagal menerima friend request. Coba lagi.');
      return false;
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
      });

      await loadPendingRequests();
      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return false;
    }
  };

  // Cancel sent request
  const cancelFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      await deleteDoc(requestRef);

      await loadSentRequests();
      return true;
    } catch (error) {
      console.error('Error canceling friend request:', error);
      return false;
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Remove from both sides
      const query1 = query(
        collection(db, 'friends'),
        where('userId', '==', user.uid),
        where('friendId', '==', friendId)
      );
      const snapshot1 = await getDocs(query1);
      snapshot1.forEach((doc) => deleteDoc(doc.ref));

      const query2 = query(
        collection(db, 'friends'),
        where('userId', '==', friendId),
        where('friendId', '==', user.uid)
      );
      const snapshot2 = await getDocs(query2);
      snapshot2.forEach((doc) => deleteDoc(doc.ref));

      await loadFriends();
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  };

  // Load all data on mount
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        loadFriends(),
        loadPendingRequests(),
        loadSentRequests(),
      ]).finally(() => setLoading(false));
    } else {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setLoading(false);
    }
  }, [user, loadFriends, loadPendingRequests, loadSentRequests]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    reload: () => {
      loadFriends();
      loadPendingRequests();
      loadSentRequests();
    },
  };
}
