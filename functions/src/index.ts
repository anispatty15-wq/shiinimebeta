/**
 * Shiiinime Cloud Functions
 * 
 * Functions untuk mengirim notifikasi push:
 * - Episode baru rilis
 * - Balasan komentar
 * - Friend request dan accept
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ============================================================================
// NOTIFIKASI EPISODE BARU
// ============================================================================

/**
 * Trigger ketika episode baru ditambahkan ke anime
 * Path: anime/{animeId}/episodes/{episodeId}
 */
export const onNewEpisode = functions.firestore
  .document('anime/{animeId}/episodes/{episodeId}')
  .onCreate(async (snap, context) => {
    const { animeId, episodeId } = context.params;
    const episodeData = snap.data();

    try {
      // Get anime info
      const animeDoc = await db.collection('anime').doc(animeId).get();
      if (!animeDoc.exists) {
        console.log('Anime not found:', animeId);
        return null;
      }

      const animeData = animeDoc.data();
      const animeTitle = animeData?.title || 'Anime';
      const episodeNumber = episodeData?.episode || episodeId;
      const poster = animeData?.poster || '';

      // Get users yang subscribe ke anime ini
      const subscribersSnapshot = await db
        .collection('subscriptions')
        .where('animeId', '==', animeId)
        .where('notifyNewEpisode', '==', true)
        .get();

      if (subscribersSnapshot.empty) {
        console.log('No subscribers for anime:', animeId);
        return null;
      }

      // Collect FCM tokens
      const tokens: string[] = [];
      const notificationPromises: Promise<any>[] = [];

      subscribersSnapshot.forEach((doc) => {
        const userId = doc.data().userId;
        
        // Save notification to user's notifications collection
        notificationPromises.push(
          db.collection('notifications').add({
            userId,
            type: 'new_episode',
            title: `${animeTitle} - Episode ${episodeNumber}`,
            body: `Episode baru telah dirilis!`,
            data: {
              animeId,
              episodeId,
              animeTitle,
              episodeNumber,
              poster,
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        );

        // Get user's FCM token
        const tokenPromise = db.collection('users').doc(userId).get()
          .then((userDoc) => {
            const fcmToken = userDoc.data()?.fcmToken;
            if (fcmToken) {
              tokens.push(fcmToken);
            }
          });
        
        notificationPromises.push(tokenPromise);
      });

      // Wait for all notifications to be saved
      await Promise.all(notificationPromises);

      // Send push notifications
      if (tokens.length > 0) {
        const message: admin.messaging.MulticastMessage = {
          notification: {
            title: `${animeTitle} - Episode ${episodeNumber}`,
            body: `Episode baru telah dirilis! Tonton sekarang 🎬`,
            imageUrl: poster || undefined,
          },
          data: {
            type: 'new_episode',
            animeId,
            episodeId,
            click_action: `/anime/${animeId}/episode/${episodeId}`,
          },
          tokens,
        };

        const response = await messaging.sendEachForMulticast(message);
        console.log(`Sent ${response.successCount} notifications for episode ${episodeNumber} of ${animeTitle}`);
        
        // Log failed sends
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(tokens[idx]);
              console.error('Failed to send to token:', tokens[idx], resp.error);
            }
          });

          // Remove invalid tokens
          const removePromises = failedTokens.map(async (token) => {
            const userQuery = await db.collection('users').where('fcmToken', '==', token).get();
            userQuery.forEach((doc) => {
              doc.ref.update({ fcmToken: admin.firestore.FieldValue.delete() });
            });
          });
          await Promise.all(removePromises);
        }
      }

      return null;
    } catch (error) {
      console.error('Error sending new episode notification:', error);
      return null;
    }
  });

// ============================================================================
// NOTIFIKASI BALASAN KOMENTAR
// ============================================================================

/**
 * Trigger ketika ada reply ke komentar user
 * Path: comments/{commentId}/replies/{replyId}
 */
export const onCommentReply = functions.firestore
  .document('comments/{commentId}/replies/{replyId}')
  .onCreate(async (snap, context) => {
    const { commentId, replyId } = context.params;
    const replyData = snap.data();

    try {
      // Get original comment
      const commentDoc = await db.collection('comments').doc(commentId).get();
      if (!commentDoc.exists) {
        console.log('Comment not found:', commentId);
        return null;
      }

      const commentData = commentDoc.data();
      const originalAuthorId = commentData?.userId;
      const replyAuthorId = replyData?.userId;

      // Don't notify if replying to own comment
      if (originalAuthorId === replyAuthorId) {
        return null;
      }

      // Get reply author info
      const replyAuthorDoc = await db.collection('users').doc(replyAuthorId).get();
      const replyAuthorName = replyAuthorDoc.data()?.displayName || 'Seseorang';
      const replyText = replyData?.text || '';
      const animeId = commentData?.animeId;
      const animeTitle = commentData?.animeTitle || 'anime';

      // Get original author's FCM token
      const originalAuthorDoc = await db.collection('users').doc(originalAuthorId).get();
      const fcmToken = originalAuthorDoc.data()?.fcmToken;

      // Save notification
      await db.collection('notifications').add({
        userId: originalAuthorId,
        type: 'comment_reply',
        title: `${replyAuthorName} membalas komentar Anda`,
        body: replyText.length > 100 ? `${replyText.substring(0, 100)}...` : replyText,
        data: {
          commentId,
          replyId,
          animeId,
          animeTitle,
          replyAuthorId,
          replyAuthorName,
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send push notification
      if (fcmToken) {
        const message: admin.messaging.Message = {
          notification: {
            title: `${replyAuthorName} membalas komentar Anda`,
            body: replyText.length > 80 ? `${replyText.substring(0, 80)}...` : replyText,
          },
          data: {
            type: 'comment_reply',
            commentId,
            replyId,
            animeId: animeId || '',
            click_action: `/anime/${animeId}?comment=${commentId}`,
          },
          token: fcmToken,
        };

        await messaging.send(message);
        console.log(`Sent comment reply notification to user ${originalAuthorId}`);
      }

      return null;
    } catch (error) {
      console.error('Error sending comment reply notification:', error);
      return null;
    }
  });

// ============================================================================
// NOTIFIKASI FRIEND REQUEST
// ============================================================================

/**
 * Trigger ketika ada friend request baru
 * Path: friendRequests/{requestId}
 */
export const onFriendRequest = functions.firestore
  .document('friendRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const requestData = snap.data();
    const { requestId } = context.params;

    try {
      const fromUserId = requestData?.fromUserId;
      const toUserId = requestData?.toUserId;

      // Get sender info
      const fromUserDoc = await db.collection('users').doc(fromUserId).get();
      const fromUserName = fromUserDoc.data()?.displayName || 'Seseorang';
      const fromUserAvatar = fromUserDoc.data()?.photoURL || '';

      // Get receiver's FCM token
      const toUserDoc = await db.collection('users').doc(toUserId).get();
      const fcmToken = toUserDoc.data()?.fcmToken;

      // Save notification
      await db.collection('notifications').add({
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send push notification
      if (fcmToken) {
        const message: admin.messaging.Message = {
          notification: {
            title: 'Friend Request Baru 👋',
            body: `${fromUserName} ingin berteman dengan Anda`,
            imageUrl: fromUserAvatar || undefined,
          },
          data: {
            type: 'friend_request',
            requestId,
            fromUserId,
            click_action: '/friends',
          },
          token: fcmToken,
        };

        await messaging.send(message);
        console.log(`Sent friend request notification to user ${toUserId}`);
      }

      return null;
    } catch (error) {
      console.error('Error sending friend request notification:', error);
      return null;
    }
  });

/**
 * Trigger ketika friend request diterima
 * Path: friendRequests/{requestId}
 */
export const onFriendRequestAccepted = functions.firestore
  .document('friendRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { requestId } = context.params;

    // Check if status changed to accepted
    if (beforeData?.status !== 'accepted' && afterData?.status === 'accepted') {
      try {
        const fromUserId = afterData?.fromUserId;
        const toUserId = afterData?.toUserId;

        // Get accepter info
        const toUserDoc = await db.collection('users').doc(toUserId).get();
        const toUserName = toUserDoc.data()?.displayName || 'Seseorang';
        const toUserAvatar = toUserDoc.data()?.photoURL || '';

        // Get original requester's FCM token
        const fromUserDoc = await db.collection('users').doc(fromUserId).get();
        const fcmToken = fromUserDoc.data()?.fcmToken;

        // Save notification
        await db.collection('notifications').add({
          userId: fromUserId,
          type: 'friend_accepted',
          title: 'Friend Request Diterima',
          body: `${toUserName} menerima permintaan berteman Anda`,
          data: {
            requestId,
            userId: toUserId,
            userName: toUserName,
            userAvatar: toUserAvatar,
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send push notification
        if (fcmToken) {
          const message: admin.messaging.Message = {
            notification: {
              title: 'Friend Request Diterima ✨',
              body: `${toUserName} sekarang berteman dengan Anda!`,
              imageUrl: toUserAvatar || undefined,
            },
            data: {
              type: 'friend_accepted',
              requestId,
              userId: toUserId,
              click_action: '/friends',
            },
            token: fcmToken,
          };

          await messaging.send(message);
          console.log(`Sent friend accepted notification to user ${fromUserId}`);
        }

        return null;
      } catch (error) {
        console.error('Error sending friend accepted notification:', error);
        return null;
      }
    }

    return null;
  });

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Cleanup old notifications (older than 30 days)
 * Scheduled to run daily at midnight
 */
export const cleanupOldNotifications = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const oldNotifications = await db
        .collection('notifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .get();

      const batch = db.batch();
      oldNotifications.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${oldNotifications.size} old notifications`);
      
      return null;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return null;
    }
  });

/**
 * Update user's FCM token
 * HTTP Callable function
 */
export const updateFCMToken = functions.https.onCall(async (data, context) => {
  const userId = context.auth?.uid;
  const fcmToken = data.fcmToken;

  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!fcmToken) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
  }

  try {
    await db.collection('users').doc(userId).update({
      fcmToken,
      fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating FCM token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update FCM token');
  }
});
