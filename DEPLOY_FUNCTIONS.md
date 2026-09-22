# 🚀 Deploy Firebase Cloud Functions

Panduan deploy Cloud Functions untuk notifikasi push Shiiinime.

## 📋 Prerequisites

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login ke Firebase

```bash
firebase login
```

Browser akan terbuka, login dengan akun Google yang punya project Firebase.

### 3. Initialize Firebase (One Time)

```bash
firebase init
```

Pilih:
- ✅ Functions
- ✅ Firestore (optional, jika belum)
- Select existing project: `shiiinimeauth` (atau project Anda)
- Language: **TypeScript**
- ESLint: Yes/No (terserah)
- Install dependencies: **Yes**

## 🔨 Build & Deploy

### Step 1: Install Dependencies

```bash
cd functions
npm install
```

### Step 2: Build TypeScript

```bash
npm run build
```

Ini akan compile `src/index.ts` menjadi `lib/index.js`.

### Step 3: Deploy All Functions

```bash
firebase deploy --only functions
```

Atau dari root directory:

```bash
firebase deploy --only functions --project shiiinimeauth
```

### Step 4: Verify Deployment

Check Firebase Console:
- Functions > Dashboard
- Lihat functions yang ter-deploy:
  - `onNewEpisode`
  - `onCommentReply`
  - `onFriendRequest`
  - `onFriendRequestAccepted`
  - `cleanupOldNotifications`
  - `updateFCMToken`

## 🐛 Troubleshooting

### Error: "Failed to deploy functions"

```bash
# Clear dan rebuild
cd functions
rm -rf lib node_modules
npm install
npm run build
firebase deploy --only functions
```

### Error: "Billing account not configured"

Cloud Functions butuh billing enabled (tapi ada free tier):
1. Firebase Console > Upgrade to Blaze plan
2. Set budget alert (free tier: 2M invocations/month)

### Error: "Permission denied"

```bash
# Re-login
firebase login --reauth
```

### Function Tidak Trigger

1. **Check Firestore Path**: Path di function harus match dengan path di Firestore
2. **Check Logs**:
   ```bash
   firebase functions:log
   ```
3. **Manual Test**: Buat test comment di Firestore, lihat logs

## 📊 Monitoring

### View Logs

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only onCommentReply

# Recent errors
firebase functions:log --only onCommentReply --lines 50
```

### Firebase Console

**Functions** > **Logs** - lihat real-time execution logs

**Firestore** > **Usage** - check trigger counts

## 🔄 Update Functions

Setelah edit code di `functions/src/index.ts`:

```bash
cd functions
npm run build
firebase deploy --only functions
```

Deploy specific function:

```bash
firebase deploy --only functions:onCommentReply
```

## ⚡ Quick Commands

```bash
# Build
cd functions && npm run build

# Deploy all
firebase deploy --only functions

# Deploy specific
firebase deploy --only functions:onCommentReply

# View logs
firebase functions:log --only onCommentReply

# Delete function
firebase functions:delete onOldFunctionName
```

## ✅ Test Notifications

### 1. Test Comment Reply

1. Login sebagai **User A**
2. Buat comment di episode
3. Logout, login sebagai **User B**
4. Reply ke comment User A
5. **User A** harus dapat notifikasi!

### 2. Check Logs

```bash
firebase functions:log --only onCommentReply --lines 20
```

Lihat:
- ✅ Function triggered
- ✅ Found original comment
- ✅ Got FCM token
- ✅ Sent notification

### 3. Check Firestore

**Collection: notifications**
- Harus ada document baru dengan:
  - `userId`: User A
  - `type`: "comment_reply"
  - `read`: false
  - `createdAt`: timestamp

### 4. Check Firebase Console

**Cloud Messaging** > **Diagnostics** - lihat successful/failed sends

## 🔐 Security

### Firestore Rules

Pastikan rules allow Cloud Functions write:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Notifications - users can only read their own, functions can write
    match /notifications/{notifId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Users collection - functions can update FCM token
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Comments - anyone can read, logged in users can write
    match /comments/{episodeSlug}/messages/{messageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

## 💰 Cost Estimation

**Free Tier (Spark Plan):**
- ❌ Cloud Functions not available

**Blaze Plan (Pay as you go):**
- ✅ 2M invocations/month FREE
- ✅ 400,000 GB-seconds compute FREE
- ✅ 200,000 CPU-seconds FREE
- After free tier: ~$0.40 per million invocations

**Shiiinime Usage Estimate:**
- 1000 comments/day = 1000 function calls
- 30,000 calls/month (well within free tier!)
- Cost: **$0/month** 🎉

## 📝 Function Details

### onCommentReply

**Trigger:** New document in `comments/{episodeSlug}/messages/{commentId}`  
**Condition:** Must have `replyTo` field  
**Action:** Send notification to original comment author

**Data Saved:**
```javascript
{
  userId: "original_author_uid",
  type: "comment_reply",
  title: "Username membalas komentar Anda",
  body: "Reply text...",
  data: { commentId, replyId, episodeSlug },
  read: false,
  createdAt: serverTimestamp()
}
```

### onNewEpisode

**Trigger:** New document in `anime/{animeId}/episodes/{episodeId}`  
**Action:** Notify all subscribers of that anime

### onFriendRequest

**Trigger:** New document in `friendRequests/{requestId}`  
**Action:** Notify the user receiving the request

## 🎯 Best Practices

1. **Use Batch Writes** untuk multiple notifications
2. **Set Timeout** max 540 seconds untuk functions
3. **Handle Errors** gracefully, log everything
4. **Remove Invalid Tokens** otomatis
5. **Limit Notification Rate** prevent spam

## 📚 Resources

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Cloud Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
- [FCM Server API](https://firebase.google.com/docs/cloud-messaging/send-message)

---

Selamat! Functions Anda sudah deploy dan notifikasi siap bekerja! 🎉
