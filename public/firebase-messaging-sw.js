// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Note: Replace with your actual Firebase config
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Shiiinime';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon.svg',
    image: payload.notification?.image || payload.notification?.imageUrl,
    badge: '/icon.svg',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: false,
    actions: []
  };

  // Add actions based on notification type
  if (payload.data?.type === 'new_episode') {
    notificationOptions.actions = [
      { action: 'watch', title: '▶️ Tonton Sekarang' },
      { action: 'later', title: '⏰ Nanti' }
    ];
  } else if (payload.data?.type === 'comment_reply') {
    notificationOptions.actions = [
      { action: 'view', title: '👁️ Lihat' },
      { action: 'reply', title: '💬 Balas' }
    ];
  } else if (payload.data?.type === 'friend_request') {
    notificationOptions.actions = [
      { action: 'accept', title: '✅ Terima' },
      { action: 'view', title: '👀 Lihat' }
    ];
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.', event);

  event.notification.close();

  const clickAction = event.notification.data?.click_action;
  const notificationType = event.notification.data?.type;
  const action = event.action;

  let url = '/';

  // Determine URL based on notification type and action
  if (action === 'watch' || action === 'view') {
    url = clickAction || '/';
  } else if (action === 'accept' && notificationType === 'friend_request') {
    url = '/friends';
  } else if (action === 'reply' && notificationType === 'comment_reply') {
    url = clickAction || '/';
  } else if (action === 'later') {
    // Just close notification
    return;
  } else {
    // Default action (click on notification body)
    url = clickAction || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push event (for additional customization)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  // The notification is automatically shown by onBackgroundMessage
  // This event is here for additional processing if needed
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(clients.claim());
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});
