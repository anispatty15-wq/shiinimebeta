# 🚀 Deploy Cloud Functions Sekarang!

Notifikasi belum berfungsi karena Cloud Functions belum di-deploy. Ikuti langkah berikut:

## ✅ Prerequisites (Sudah Selesai)

- ✅ Firebase CLI terinstall
- ✅ Functions code sudah dicompile
- ✅ Project ID configured: `shiinimeauth`

## 🔥 Deploy Steps

### 1. Login ke Firebase

Buka PowerShell/Terminal di folder project ini, lalu jalankan:

```bash
firebase login
```

Browser akan terbuka, pilih akun Google yang punya project Firebase `shiinimeauth`.

### 2. Verify Project

Setelah login, cek project:

```bash
firebase projects:list
```

Pastikan ada `shiinimeauth` dalam list.

### 3. Deploy Functions

```bash
firebase deploy --only functions
```

Proses ini akan:
- Upload 6 Cloud Functions
- Enable functions di Firebase
- Durasi: ~2-5 menit

### 4. Verify Deployment

Check di Firebase Console:
1. Buka https://console.firebase.google.com/project/shiinimeauth/functions
2. Lihat functions yang ter-deploy:
   - ✅ `onNewEpisode`
   - ✅ `onCommentReply` ⭐ (ini yang bikin notif reply berfungsi!)
   - ✅ `onFriendRequest`
   - ✅ `onFriendRequestAccepted`
   - ✅ `cleanupOldNotifications`
   - ✅ `updateFCMToken`

## 🧪 Test Notifikasi

Setelah deploy berhasil:

### Test Comment Reply Notification:

1. **Login User A** di browser normal
2. Buka episode, buat comment
3. **Login User B** di browser incognito/private
4. Reply ke comment User A
5. **User A** akan dapat notifikasi! 🎉

Check notifikasi di:
- Bell icon di Navbar (badge merah dengan angka)
- Halaman `/notifications`
- Push notification di device (jika sudah allow permission)

## 🐛 Troubleshooting

### Error: "Billing account required"

Cloud Functions butuh Firebase Blaze Plan (pay-as-you-go). Tapi jangan khawatir:

- **Free Tier:** 2 juta function calls/month GRATIS
- **Shiiinime usage:** ~30,000 calls/month (jauh di bawah limit)
- **Cost:** $0/bulan untuk traffic normal

Cara upgrade:
1. Firebase Console > Project Settings > Usage and Billing
2. Klik "Modify plan" > Pilih "Blaze Plan"
3. Set budget alert: $5/month (opsional)
4. Deploy lagi

### Error: "Permission denied"

```bash
firebase login --reauth
```

Lalu deploy lagi.

### Functions Tidak Trigger

Check logs untuk debug:

```bash
firebase functions:log --only onCommentReply
```

## 📊 Monitor Functions

### View Logs Real-time

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only onCommentReply --lines 50
```

### Firebase Console

**Functions** > **Logs** - lihat execution logs real-time

**Firestore** > **Usage** - check berapa kali function ke-trigger

## 🔄 Update Functions Nanti

Kalau kamu edit code di `functions/src/index.ts`:

```bash
cd functions
npm run build
firebase deploy --only functions
```

Deploy specific function saja:

```bash
firebase deploy --only functions:onCommentReply
```

## ✨ What's Next

Setelah functions deploy:

1. ✅ **Comment reply notifications work!**
2. ✅ Friend request notifications
3. ✅ New episode notifications
4. ✅ Auto cleanup old notifications (30 days)

## 💡 Tips

- Functions akan auto-trigger saat ada event di Firestore
- Tidak perlu restart server atau rebuild Next.js
- Logs bisa dilihat kapan saja via `firebase functions:log`
- Invalid FCM tokens akan di-cleanup otomatis

---

**TL;DR:**

```bash
# Login
firebase login

# Deploy
firebase deploy --only functions

# Test
# Reply ke comment, lihat notif muncul!
```

Selamat! Setelah deploy, semua notifikasi akan berfungsi! 🎉
