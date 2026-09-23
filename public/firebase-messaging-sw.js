// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let messaging;

async function initializeMessaging() {
  try {
    const response = await fetch('/api/firebase-config', { cache: 'no-store' });
    if (!response.ok) throw new Error('Firebase config unavailable');
    const config = await response.json();
    firebase.initializeApp(config);
    messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => showNotification(payload));
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Init failed:', error);
  }
}

function showNotification(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Shiiinime';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/logo.png',
    image: payload.notification?.image || payload.notification?.imageUrl,
    badge: '/logo.png',
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
}

initializeMessaging();

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

  // Make URL absolute
  const fullUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Check if there's already a window open with the same origin
      for (const client of clientList) {
        // Focus existing window and navigate
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            // Navigate to the URL
            return client.navigate(fullUrl);
          });
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
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
