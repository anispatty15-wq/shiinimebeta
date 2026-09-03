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
  addDoc, 
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

export interface User {
  uid: string;
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
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('uid', '==', friendId), limit(1))
        );

        if (!userDoc.empty) {
          const friendData = userDoc.docs[0].data();
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
      const requestsQuery = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(requestsQuery);
      const requests: FriendRequest[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as FriendRequest[];

      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  }, [user]);

  // Load sent requests
  const loadSentRequests = useCallback(async () => {
    if (!user) return;

    try {
      const requestsQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(requestsQuery);
      const requests: FriendRequest[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as FriendRequest[];

      setSentRequests(requests);
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  }, [user]);

  // Search users
  const searchUsers = async (searchTerm: string): Promise<User[]> => {
    if (!searchTerm.trim() || !user) return [];

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );

      const snapshot = await getDocs(usersQuery);
      const users: User[] = snapshot.docs
        .map((doc) => ({
          uid: doc.data().uid,
          displayName: doc.data().displayName,
          photoURL: doc.data().photoURL,
          email: doc.data().email,
        }))
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
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        fromUserName: user.displayName || 'Anonymous',
        fromUserAvatar: user.photoURL || '',
        toUserId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

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
      const fromUserId = requestData.fromUserId;

      // Update request status
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      });

      // Add to friends collection (both ways)
      await addDoc(collection(db, 'friends'), {
        userId: user.uid,
        friendId: fromUserId,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'friends'), {
        userId: fromUserId,
        friendId: user.uid,
        createdAt: serverTimestamp(),
      });

      await loadPendingRequests();
      await loadFriends();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
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
