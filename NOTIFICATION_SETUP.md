# 🔔 Panduan Setup Notifikasi Push

Dokumentasi lengkap untuk setup sistem notifikasi Shiiinime.

## 📋 Fitur Notifikasi

1. **Episode Baru** - Notifikasi saat episode baru dirilis
2. **Balasan Komentar** - Notifikasi saat ada yang membalas komentar Anda
3. **Friend Request** - Notifikasi saat ada permintaan berteman
4. **Friend Accepted** - Notifikasi saat permintaan berteman diterima

## 🚀 Setup Firebase Cloud Messaging

### 1. Firebase Console Setup

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Pergi ke **Project Settings** > **Cloud Messaging**
4. Di tab **Web Push certificates**, klik **Generate Key Pair**
5. Copy VAPID key yang dihasilkan

### 2. Environment Variables

Tambahkan ke file `.env.local`:

```env
# Firebase Configuration (sudah ada)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# FCM VAPID Key (tambahkan ini)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-from-step-1
```

### 3. Update Service Worker Config

Edit file `public/firebase-messaging-sw.js`:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});
```

⚠️ **Penting:** Replace placeholder values dengan config Firebase Anda yang sebenarnya.

## 📦 Install Firebase Functions Dependencies

```bash
cd functions
npm install
```

## 🔨 Build & Deploy Cloud Functions

### Build Functions

```bash
cd functions
npm run build
```

### Deploy ke Firebase

```bash
# Deploy semua functions
firebase deploy --only functions

# Deploy function tertentu
firebase deploy --only functions:onNewEpisode
firebase deploy --only functions:onCommentReply
firebase deploy --only functions:onFriendRequest
```

### Test Locally (Optional)

```bash
cd functions
npm run serve
```

## 🗂️ Firestore Indexes

Indexes sudah didefinisikan di `firestore.indexes.json`. Deploy dengan:

```bash
firebase deploy --only firestore:indexes
```

Atau indexes akan otomatis dibuat saat menjalankan query pertama kali (Firestore akan memberikan link untuk membuat index).

## 📱 Testing Notifications

### 1. Test di Browser

1. Login ke aplikasi
2. Klik **Aktifkan Notifikasi** saat prompt muncul
3. Allow notifications di browser
4. Test dengan menambahkan episode baru atau balas komentar

### 2. Test Cloud Functions Locally

```bash
# Install Firebase emulator
npm install -g firebase-tools

# Start emulators
firebase emulators:start --only functions,firestore
```

### 3. Manual Test FCM Token

Gunakan Firebase Console untuk kirim test notification:
1. **Cloud Messaging** > **Send test message**
2. Paste FCM token dari console browser (lihat di Network tab atau Console log)
3. Kirim test notification

## 🔧 Troubleshooting

### Notification Permission Denied

Jika user menolak permission:
1. User harus manually enable di browser settings
2. Chrome: Settings > Privacy and Security > Site Settings > Notifications
3. Clear localStorage `notification-prompt-dismissed` untuk show prompt lagi

### Service Worker Not Registered

```bash
# Pastikan file ada di public folder
ls public/firebase-messaging-sw.js

# Check browser console untuk error
# Service worker harus di-serve dari root domain
```

### FCM Token Not Saved

Check di Firestore:
- Collection: `users`
- Document: `{userId}`
- Field: `fcmToken` should exist

### Cloud Functions Not Triggering

1. Check Firebase Console > Functions > Logs
2. Pastikan Firestore triggers sudah aktif
3. Verify collection paths match (`comments/{id}/messages`, `friendRequests/{id}`, etc.)

### Notification Not Showing on Mobile

1. Pastikan app adalah PWA (installed to home screen)
2. Check manifest.json sudah benar
3. Verify `gcm_sender_id` di manifest.json

## 📊 Monitoring

### Check Function Logs

```bash
firebase functions:log
```

### Firestore Rules

Pastikan rules mengizinkan Cloud Functions menulis notifications:

```javascript
// firestore.rules
match /notifications/{notifId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow write: if request.auth != null; // For cloud functions
}
```

## 🎯 Best Practices

1. **Rate Limiting** - Jangan spam notifications
2. **Batching** - Group similar notifications
3. **Clean Old Tokens** - Remove invalid FCM tokens (sudah ada di code)
4. **User Preferences** - Let users customize notification settings
5. **Quiet Hours** - Consider time zones untuk episode notifications

## 📝 Data Structure

### Notifications Collection

```typescript
{
  userId: string,
  type: 'new_episode' | 'comment_reply' | 'friend_request' | 'friend_accepted',
  title: string,
  body: string,
  data: {
    animeId?: string,
    episodeId?: string,
    commentId?: string,
    // ... other data
  },
  read: boolean,
  createdAt: Timestamp
}
```

### Subscriptions Collection (Optional untuk Episode Notifications)

```typescript
{
  userId: string,
  animeId: string,
  notifyNewEpisode: boolean,
  createdAt: Timestamp
}
```

## 🔐 Security Notes

1. Never expose server keys in client code
2. VAPID keys are public and safe in client
3. Validate all inputs di Cloud Functions
4. Use Firestore Security Rules untuk protect data
5. Rate limit notification sending

## 📚 Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)

## ✅ Checklist Deployment

- [ ] VAPID key generated dan added to `.env.local`
- [ ] Service worker config updated dengan Firebase config
- [ ] Functions dependencies installed
- [ ] Functions deployed ke Firebase
- [ ] Firestore indexes deployed
- [ ] Firestore rules updated
- [ ] Testing notifications works
- [ ] PWA manifest configured correctly
- [ ] Service worker registered successfully
- [ ] Monitoring & logging setup

---

Untuk pertanyaan atau issues, check Firebase Console logs dan browser console untuk debugging.
