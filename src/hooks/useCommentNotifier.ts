// src/hooks/useCommentNotifier.ts
'use client';

/**
 * Client-Side Comment Reply Notifier
 * 
 * Cara kerja:
 * 1. Setiap kali ada comment baru dengan replyTo field
 * 2. Components yang create comment akan trigger notification creation
 * 3. No Cloud Functions needed - 100% client-side
 * 
 * Note: Karena client-side, notification dibuat saat user yang reply submit comment
 */

import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CreateReplyNotificationParams {
  episodeSlug: string;
  replyToCommentId: string;
  replyAuthorId: string;
  replyAuthorName: string;
  replyText: string;
}

/**
 * Create notification for comment reply
 * Call this function when user submits a reply
 */
export async function createReplyNotification({
  episodeSlug,
  replyToCommentId,
  replyAuthorId,
  replyAuthorName,
  replyText,
}: CreateReplyNotificationParams): Promise<void> {
  if (!db) {
    console.error('Firestore not initialized');
    return;
  }

  try {
    // Get the original comment to find the author
    const originalCommentRef = doc(db, 'comments', episodeSlug, 'messages', replyToCommentId);
    const originalCommentSnap = await getDoc(originalCommentRef);

    if (!originalCommentSnap.exists()) {
      console.error('Original comment not found');
      return;
    }

    const originalComment = originalCommentSnap.data();
    const originalAuthorId = originalComment?.uid;

    // Don't notify if replying to own comment
    if (originalAuthorId === replyAuthorId) {
      return;
    }

    // Create notification
    await addDoc(collection(db, 'notifications'), {
      userId: originalAuthorId,
      type: 'comment_reply',
      title: `${replyAuthorName} membalas komentar Anda`,
      body: replyText.length > 100 ? `${replyText.substring(0, 100)}...` : replyText,
      data: {
        commentId: replyToCommentId,
        replyId: originalCommentSnap.id,
        episodeSlug,
        replyAuthorId,
        replyAuthorName,
      },
      read: false,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Reply notification created');
  } catch (error) {
    console.error('Error creating reply notification:', error);
  }
}

/**
 * Create notification for friend request
 */
export async function createFriendRequestNotification(
  fromUserId: string,
  fromUserName: string,
  fromUserAvatar: string,
  toUserId: string,
  requestId: string
): Promise<void> {
  if (!db) return;

  try {
    await addDoc(collection(db, 'notifications'), {
      userId: toUserId,
      type: 'friend_request',
      title: 'Friend Request Baru',
      body: `${fromUserName} ingin berteman dengan Anda`,
      data: {
        requestId,
        fromUserId,
        fromUserName,
        fromUserAvatar,
      },
      read: false,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Friend request notification created');
  } catch (error) {
    console.error('Error creating friend request notification:', error);
  }
}

/**
 * Create notification when friend request is accepted
 */
export async function createFriendAcceptedNotification(
  accepterUserId: string,
  accepterUserName: string,
  accepterUserAvatar: string,
  requesterUserId: string,
  requestId: string
): Promise<void> {
  if (!db) return;

  try {
    await addDoc(collection(db, 'notifications'), {
      userId: requesterUserId,
      type: 'friend_accepted',
      title: 'Friend Request Diterima',
      body: `${accepterUserName} menerima permintaan berteman Anda`,
      data: {
        requestId,
        userId: accepterUserId,
        userName: accepterUserName,
        userAvatar: accepterUserAvatar,
      },
      read: false,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Friend accepted notification created');
  } catch (error) {
    console.error('Error creating friend accepted notification:', error);
  }
}
