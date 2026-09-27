# Add Admin User to Firestore

## Cara Manual (Firebase Console)

1. Buka Firebase Console: https://console.firebase.google.com/project/shiinimeauth/firestore
2. Pilih tab **Firestore Database**
3. Klik **+ Start collection**
4. Collection ID: `admins`
5. Klik **Next**
6. Document ID: **Custom ID** → masukkan UID kamu dari screenshot: `tjG4P99RoxigBJlK4dUJrAnZxAk2`
7. Tambahkan fields:
   - Field: `uid`, Type: `string`, Value: `tjG4P99RoxigBJlK4dUJrAnZxAk2`
   - Field: `email`, Type: `string`, Value: email Google kamu (misal: `anispatty@gmail.com`)
8. Klik **Save**

## Cara dengan Script (Otomatis)

Buat file `add-admin.js` di folder `shiiinime/`:

```javascript
// add-admin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download dari Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addAdmin() {
  const adminUid = 'tjG4P99RoxigBJlK4dUJrAnZxAk2'; // UID kamu
  const adminEmail = 'anispatty@gmail.com'; // Email Google kamu
  
  try {
    await db.collection('admins').doc(adminUid).set({
      uid: adminUid,
      email: adminEmail,
      addedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Admin added successfully!');
    console.log(`UID: ${adminUid}`);
    console.log(`Email: ${adminEmail}`);
  } catch (error) {
    console.error('❌ Error adding admin:', error);
  }
  
  process.exit(0);
}

addAdmin();
```

Jalankan:
```bash
node add-admin.js
```

## Verifikasi Admin Document

Setelah ditambahkan, cek di Firebase Console:
- Collection: `admins`
- Document: `tjG4P99RoxigBJlK4dUJrAnZxAk2`
- Fields: `{ uid: "...", email: "..." }`

## Cara Cek di Browser Console

Setelah login, buka Developer Tools (F12) dan cek console log:

```
[AuthContext] Admin check: {
  uid: "tjG4P99RoxigBJlK4dUJrAnZxAk2",
  adminDocExists: true,  ← Harus TRUE
  isAdmin: true,         ← Harus TRUE
  adminData: { uid: "...", email: "..." }
}

[Navbar] Admin status: {
  isAdmin: true,         ← Harus TRUE
  userUid: "tjG4P99RoxigBJlK4dUJrAnZxAk2"
}
```

## Troubleshooting

### Admin link tidak muncul?
1. **Cek console log** - Apakah `isAdmin: true`?
2. **Cek Firestore Rules** - Sudah deployed? (Sudah ✅)
3. **Hard refresh** - Ctrl+Shift+R
4. **Logout & login ulang**
5. **Cek admin document ada** di Firebase Console

### isAdmin masih false?
1. **Document ID harus sama persis** dengan UID kamu
2. **Collection name harus `admins`** (bukan `admin`)
3. **Firestore rules** harus allow read untuk logged-in users:
   ```javascript
   match /admins/{uid} {
     allow read: if isLoggedIn();
     allow write: if false;
   }
   ```
4. **Clear browser cache** dan login ulang

---

**UID Kamu**: `tjG4P99RoxigBJlK4dUJrAnZxAk2`
**Email**: (ganti dengan email Google kamu)
**Status**: ⚠️ Perlu ditambahkan ke Firestore collection `admins`
