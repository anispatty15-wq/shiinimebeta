# 🔧 Fix White Screen After Google Login (Median.co)

## ❌ Problem

Setelah klik "Login with Google" di APK Median.co:
- Loading muncul (warna putih)
- Stuck di white screen
- Tidak kembali ke aplikasi

## ✅ Solution

### Step 1: Copy JavaScript Code to Median.co

1. **Buka file:** `median-inject.js` (di root folder project)
2. **Copy seluruh isi file** (Ctrl+A, Ctrl+C)
3. **Login ke Median.co Dashboard**
4. **Navigate:** Advanced > JavaScript Code
5. **Paste** seluruh code ke text editor
6. **Save**

### Step 2: Enable Custom Tabs

Di Median.co Dashboard:

1. **Navigate:** Navigation > OAuth Settings
2. **Enable:**
   - ✅ OAuth 2.0 Support
   - ✅ Use Chrome Custom Tabs (Android)
   - ✅ Use SFSafariViewController (iOS)
3. **Add Redirect URLs:**
   ```
   https://shiiinimebeta.vercel.app/__/auth/handler
   https://shiiinimeauth.firebaseapp.com/__/auth/handler
   ```
4. **Save**

### Step 3: Configure URL Handling

Di Median.co Dashboard:

1. **Navigate:** Navigation > URL Handling
2. **Add Rule 1:**
   ```
   Pattern: accounts.google.com/*
   Action: Open in Custom Tab
   Return to App: Yes
   ```
3. **Add Rule 2:**
   ```
   Pattern: *firebaseapp.com/*
   Action: Open in Custom Tab
   Return to App: Yes
   ```
4. **Add Rule 3:**
   ```
   Pattern: *__/auth/handler*
   Action: Stay in WebView
   Post-Action: Reload Page
   ```
5. **Save**

### Step 4: Enable JavaScript Bridge

Di Median.co Dashboard:

1. **Navigate:** Advanced > JavaScript Bridge
2. **Enable:**
   - ✅ Enable JavaScript Bridge
   - ✅ Allow Window.open()
   - ✅ Allow Popups for OAuth
3. **Allowed Domains:**
   ```
   accounts.google.com
   firebase.google.com
   firebaseapp.com
   googleapis.com
   ```
4. **Save**

### Step 5: Rebuild APK

Setelah semua settings di atas:

1. **Navigate:** Build > Build App
2. **Select:** Android APK
3. **Build** (tunggu ~10-15 menit)
4. **Download** APK baru
5. **Install** di HP (uninstall yang lama dulu)

### Step 6: Test Login

1. **Buka app**
2. **Klik Login with Google**
3. **Login di Custom Tab** (bukan browser eksternal)
4. **Should see:** Loading indicator dengan background gelap (#0F0F12)
5. **After ~2 seconds:** Auto redirect kembali ke app
6. **✅ Login successful!**

## 🔍 What the Fix Does

### median-inject.js Code:

1. **Detects OAuth callback URL** (`__/auth/handler`)
2. **Shows custom loading screen** (tidak white screen):
   - Background: Dark (#0F0F12)
   - Spinner: Cyan (#00E5FF)
   - Text: "Logging in..."
3. **Waits for Firebase** to process auth (2 seconds)
4. **Auto redirects** back to app/previous page
5. **Handles postMessage** from OAuth popup

### Custom Tab Configuration:

- **Opens OAuth in Custom Tab** (Chrome Custom Tab atau SFSafariViewController)
- **Not external browser** (tetap dalam app context)
- **Seamless return** to app after login
- **Better UX** dan faster

## 🐛 Still Not Working?

### Check 1: JavaScript Code Properly Injected

Test di Chrome DevTools (saat inspect Median WebView):

```javascript
console.log(window.ShiiinimeMedian);
// Should output: Object with helper functions
```

Jika `undefined`, berarti JavaScript code tidak ter-inject.

### Check 2: Redirect URLs in Firebase

Firebase Console > Authentication > Settings > Authorized domains:

```
✅ shiiinimebeta.vercel.app
✅ shiiinimeauth.firebaseapp.com
✅ median.co (untuk testing)
```

Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs:

**Authorized redirect URIs:**
```
✅ https://shiiinimebeta.vercel.app/__/auth/handler
✅ https://shiiinimeauth.firebaseapp.com/__/auth/handler
```

### Check 3: Test in Browser First

Sebelum test di APK:

1. **Buka:** https://shiiinimebeta.vercel.app di Chrome Android
2. **Try login** dengan Google
3. **Harus berhasil** tanpa white screen
4. **If works:** Issue is di Median config
5. **If not works:** Issue is di Firebase/web config

### Check 4: Enable Debug Logs

Di Median.co Dashboard:

**Advanced > WebView Settings:**
```
✅ Enable Console Logs
✅ Enable Remote Debugging
```

Rebuild APK, connect via USB, dan lihat Chrome DevTools logs:

```
chrome://inspect
> Select your device
> Inspect WebView
```

Lihat logs:
```
✅ 🚀 Shiiinime Median Bridge Initialized
✅ ✅ Median bridge ready
✅ 🔐 OAuth callback detected, processing...
✅ ✅ Auth processed, redirecting to: /
```

Jika tidak ada logs ini, JavaScript code tidak jalan.

## 📋 Quick Debug Checklist

- [ ] `median-inject.js` code di-copy paste ke Median Dashboard
- [ ] Custom Tabs enabled
- [ ] JavaScript Bridge enabled
- [ ] URL Handling rules added
- [ ] Redirect URLs correct di Firebase
- [ ] OAuth Client ID correct
- [ ] APK rebuilt after changes
- [ ] Old APK uninstalled before install new one
- [ ] Login works di browser (non-Median test)

## 💡 Alternative: Test with Capacitor

Jika Median masih bermasalah, bisa coba build dengan Capacitor:

```bash
npm run build:capacitor
npx cap open android
```

Build di Android Studio, test. Jika works di Capacitor, berarti issue specific ke Median.co config.

## 🎯 Expected Behavior After Fix

### Before Fix:
1. Klik "Login with Google"
2. Opens external browser
3. Login berhasil
4. **WHITE SCREEN** 😱
5. Stuck, harus force close app

### After Fix:
1. Klik "Login with Google"
2. Opens **Custom Tab** (masih dalam app)
3. Login berhasil
4. **Dark loading screen** dengan spinner 🎨
5. Text: "Logging in..."
6. Auto redirect (2 seconds)
7. **Back to app, logged in!** ✅

## 📞 Need More Help?

1. **Check MEDIAN_CONFIG.md** untuk full configuration
2. **Check median-inject.js** untuk code details
3. **Contact Median.co Support** via dashboard
4. **Firebase Console Logs** untuk auth errors

## ✅ Success Indicators

Jika fix berhasil, kamu akan lihat:

- ✅ Login tidak buka browser external
- ✅ Custom Tab opens (Chrome UI dengan back arrow)
- ✅ Setelah login: Dark loading screen (not white)
- ✅ Auto redirect kembali ke app
- ✅ User logged in successfully
- ✅ Profile muncul di Navbar

---

**TL;DR:**

1. Copy `median-inject.js` ke Median Dashboard > Advanced > JavaScript Code
2. Enable Custom Tabs di Navigation > OAuth Settings
3. Enable JavaScript Bridge di Advanced
4. Rebuild APK
5. Test login - should work! ✨

