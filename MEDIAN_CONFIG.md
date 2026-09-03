# 📱 Setup Median.co untuk Shiiinime

Panduan lengkap konfigurasi Median.co agar login Google dan notifikasi push bekerja sempurna.

## 🔧 Median.co Configuration

### 1. Basic App Settings

Di Median.co Dashboard:

```
App Name: Shiiinime
Website URL: https://shiiinimebeta.vercel.app
Package Name (Android): com.shiiinime.app
Bundle ID (iOS): com.shiiinime.app
```

### 2. Enable OAuth Deep Linking

**Navigation** > **Deep Linking**:

✅ Enable Deep Linking  
✅ Enable Universal Links (iOS)  
✅ Enable App Links (Android)

**URL Scheme:**
```
shiiinime://
```

**Associated Domains (iOS):**
```
shiiinimebeta.vercel.app
shiiinimeauth.firebaseapp.com
```

**Deep Link Prefixes:**
```
https://shiiinimebeta.vercel.app
https://shiiinimeauth.firebaseapp.com
```

### 3. Enable Custom Tabs for OAuth

**Navigation** > **OAuth & Deep Linking**:

✅ **Enable OAuth 2.0 Support**  
✅ **Use Chrome Custom Tabs** (Android)  
✅ **Use SFSafariViewController** (iOS)

**OAuth Redirect URLs:**
```
https://shiiinimebeta.vercel.app/__/auth/handler
https://shiiinimeauth.firebaseapp.com/__/auth/handler
```

### 4. JavaScript Bridge Settings

**Advanced** > **JavaScript Bridge**:

✅ **Enable JavaScript Bridge**  
✅ **Allow Window.open()**  
✅ **Allow Popups for OAuth**

**Allowed Domains for Popups:**
```
accounts.google.com
firebase.google.com
firebaseapp.com
```

### 5. Push Notifications Setup

**Push Notifications** > **Configuration**:

#### Android (FCM):

1. Upload `google-services.json` dari Firebase Console
2. **Server Key**: Copy dari Firebase Console > Cloud Messaging > Server Key
3. **Sender ID**: Copy dari Firebase Console > Cloud Messaging > Sender ID

#### iOS (APNs):

1. Upload APNs Certificate (.p12 file)
2. Enter Certificate Password
3. Select Environment: Production

**Notification Settings:**
```
✅ Show badge on icon
✅ Play sound
✅ Show notification when app is open
✅ Handle notification click
```

**Click Action:**
```
Open URL from notification data
```

### 6. WebView Settings

**Advanced** > **WebView**:

```
✅ Enable JavaScript
✅ Enable DOM Storage
✅ Enable Cookies
✅ Enable Local Storage
✅ Enable Session Storage
✅ Support Multiple Windows
```

**User Agent:**
```
Append to default: ShiiinimeApp/1.0
```

**Zoom:**
```
✅ Disable zoom controls
✅ Support viewport meta tag
Initial scale: 1.0
```

### 7. Permissions (Android)

**App Configuration** > **Permissions**:

```
✅ Internet
✅ Access Network State
✅ Access WiFi State
✅ Vibrate
✅ Receive Boot Completed
✅ Wake Lock
✅ Foreground Service
✅ Post Notifications
```

### 8. Security Settings

**Advanced** > **Security**:

```
✅ Use HTTPS only
✅ Clear cookies on logout
✅ Disable screenshot (optional)
⬜ Disable screen recording (optional)
```

**SSL Pinning:**
```
⬜ Disable (unless you setup certificate pinning)
```

---

## 🔐 Fix Google OAuth Login

### Problem: Login membuka browser eksternal

**Solusi di Median.co:**

#### Option 1: Enable OAuth dalam WebView

**Navigation** > **OAuth Settings**:

```
OAuth Flow: In-App WebView
Provider: Google
Client ID: YOUR_GOOGLE_CLIENT_ID

Redirect URL Whitelist:
- https://shiiinimebeta.vercel.app/__/auth/handler
- https://shiiinimeauth.firebaseapp.com/__/auth/handler
```

#### Option 2: JavaScript Injection untuk Handle OAuth

**Advanced** > **JavaScript Code**:

```javascript
// Inject ini untuk handle OAuth redirect
window.addEventListener('load', function() {
  // Override window.open untuk OAuth popups
  const originalWindowOpen = window.open;
  window.open = function(url, target, features) {
    // Jika OAuth URL, buka di Custom Tab
    if (url && (url.includes('accounts.google.com') || url.includes('firebase'))) {
      // Median akan handle ini dengan Custom Tabs
      return originalWindowOpen.call(window, url, '_blank', features);
    }
    return originalWindowOpen.call(window, url, target, features);
  };
});
```

#### Option 3: Custom URL Scheme Handling

**Navigation** > **URL Handling**:

```
External URL Pattern: accounts.google.com/*
Action: Open in Custom Tab
Return to App: Yes

External URL Pattern: firebase*.com/*  
Action: Open in Custom Tab
Return to App: Yes
```

---

## 🔔 Setup Push Notifications

### 1. Update Firebase untuk Median

**Firebase Console** > **Project Settings** > **Cloud Messaging**:

1. **Android**: 
   - Upload SHA-1 dari Median.co (mereka provide)
   - Copy Server Key ke Median.co dashboard

2. **iOS**:
   - Upload APNs Certificate
   - Enable Push Notifications capability

### 2. Median.co Notification Handler

**Push Notifications** > **Custom Handling**:

```javascript
// Inject JavaScript untuk handle notification click
median.notifications.onReceive = function(notification) {
  console.log('Notification received:', notification);
  
  // Handle different notification types
  if (notification.data) {
    const type = notification.data.type;
    const clickAction = notification.data.click_action;
    
    if (clickAction) {
      // Navigate to URL
      window.location.href = clickAction;
    }
  }
};

median.notifications.onClick = function(notification) {
  console.log('Notification clicked:', notification);
  
  // Open the app and navigate
  if (notification.data && notification.data.click_action) {
    window.location.href = notification.data.click_action;
  }
};
```

### 3. Request Permission di App

Median akan auto-request notification permission saat app first launch.

Atau manual dengan JavaScript:

```javascript
// Request notification permission
if (typeof median !== 'undefined' && median.notifications) {
  median.notifications.requestPermission(function(granted) {
    if (granted) {
      console.log('Notification permission granted');
      // Get FCM token
      median.notifications.getToken(function(token) {
        console.log('FCM Token:', token);
        // Send token to your server/Firebase
      });
    }
  });
}
```

---

## 🎨 App Customization

### 1. App Icon & Splash Screen

**App Configuration** > **Branding**:

- Upload 1024x1024 icon (PNG, no transparency untuk Android)
- Upload 2048x2048 splash screen
- Background color: `#0F0F12`
- Theme color: `#00E5FF`

### 2. Status Bar & Navigation Bar

**Appearance** > **System UI**:

```
Status Bar Style: Light Content
Status Bar Color: #0F0F12
Status Bar Transparent: Yes

Navigation Bar Color: #0F0F12
Navigation Bar Style: Light
```

### 3. Loading Screen

**Appearance** > **Loading**:

```
Show loading indicator: Yes
Loading color: #00E5FF
Background: #0F0F12
```

---

## 📱 Testing

### Android

1. **Build di Median.co**
2. Download APK
3. Install di HP
4. Test:
   - ✅ Login Google (harus buka dalam app, tidak keluar)
   - ✅ Notifikasi muncul
   - ✅ Klik notifikasi buka app
   - ✅ All navigation works

### iOS

1. **Build di Median.co**
2. Download via TestFlight
3. Test sama seperti Android

---

## 🐛 Troubleshooting

### Login Masih Buka Browser External

**Solusi:**

1. **Enable Custom Tabs** di Median settings
2. **Whitelist OAuth URLs**:
   ```
   accounts.google.com/*
   *.firebaseapp.com/*
   ```
3. **Enable JavaScript Bridge** untuk window.open()
4. **Check OAuth Redirect URLs** sudah benar

### Login Stuck/White Screen Setelah Pencet Masuk

**Problem:** Setelah login Google berhasil, muncul white screen dan tidak kembali ke app.

**Root Cause:** OAuth redirect tidak properly handled oleh Median WebView.

**Solusi:**

#### Option 1: Update JavaScript Injection

Pastikan JavaScript code dari `median-inject.js` sudah di-inject ke Median:

**Advanced** > **JavaScript Code** - paste seluruh isi `median-inject.js`

Code ini akan:
- ✅ Detect OAuth callback URL
- ✅ Show loading indicator (tidak white screen)
- ✅ Auto redirect kembali ke app

#### Option 2: Configure Redirect URLs di Median

**Navigation** > **OAuth Settings**:

```
OAuth Callback Handling: Custom
Callback URL Pattern: __/auth/handler
Action: Stay in WebView
Post-Callback Action: Reload Page
```

#### Option 3: Add Custom URL Handling

**Navigation** > **URL Handling**:

```
Pattern: *__/auth/handler*
Handling: Stay in WebView
Loading Screen: Show custom loading (background #0F0F12, spinner #00E5FF)
After Load: Navigate to /
```

#### Option 4: Firebase Auth Configuration

Di Firebase Console > Authentication > Settings:

**Authorized domains:**
- Add: `shiiinimebeta.vercel.app`
- Add: `median.co` (untuk testing)
- Add: `localhost` (untuk testing)

**Authorized redirect URIs** (di Google Cloud Console):
- `https://shiiinimebeta.vercel.app/__/auth/handler`
- `https://shiiinimeauth.firebaseapp.com/__/auth/handler`
- `com.shiiinime.app://__/auth/handler` (untuk deep link)

#### Option 5: Test di Browser First

Sebelum test di Median, pastikan login works di browser:

1. Buka website di Chrome Android
2. Try login Google
3. Harus berhasil tanpa white screen
4. If works di browser, then issue is di Median config

### Notifikasi Tidak Muncul

**Cek:**

1. ✅ `google-services.json` uploaded di Median
2. ✅ FCM Server Key correct
3. ✅ SHA-1 fingerprint added ke Firebase
4. ✅ Notification permission granted di HP
5. ✅ App not killed by battery saver

### Notifikasi Tidak Buka App

**Solusi:**

1. **Deep Link Configuration**:
   - Enable Deep Linking di Median
   - Add URL scheme: `shiiinime://`
   
2. **Update Cloud Functions**:
   ```javascript
   // Tambahkan custom click_action
   data: {
     click_action: 'shiiinime://notifications'
   }
   ```

3. **Handle Deep Link** di website:
   ```javascript
   // Detect if opened from deep link
   if (window.location.href.startsWith('shiiinime://')) {
     const path = window.location.href.replace('shiiinime://', '/');
     window.history.replaceState({}, '', path);
   }
   ```

### OAuth Callback Tidak Kembali ke App

**Solusi:**

1. **Add Redirect URL** di Firebase Console:
   ```
   https://shiiinimebeta.vercel.app/__/auth/handler
   com.shiiinime.app://__/auth/handler
   ```

2. **Enable App Links** di Median:
   - Android: Deep Links + App Links
   - iOS: Universal Links

3. **Verify .well-known/assetlinks.json** exists di domain

---

## ✅ Final Checklist

### Median.co Settings:
- [ ] Deep Linking enabled
- [ ] OAuth Custom Tabs enabled
- [ ] JavaScript Bridge enabled
- [ ] Push Notifications configured
- [ ] google-services.json uploaded
- [ ] All permissions granted
- [ ] App icons & splash uploaded

### Firebase Settings:
- [ ] OAuth Redirect URLs added
- [ ] SHA-1 fingerprint added (from Median)
- [ ] Server Key copied to Median
- [ ] Cloud Functions deployed
- [ ] Test notifications sent

### Testing:
- [ ] Login works in-app
- [ ] Notifications received
- [ ] Notification click opens app
- [ ] Deep links work
- [ ] All features functional

---

## 📚 Resources

- [Median.co Documentation](https://median.co/docs/)
- [Median OAuth Setup](https://median.co/docs/oauth)
- [Median Push Notifications](https://median.co/docs/push-notifications)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)

---

## 🚀 Build Commands

Di Median.co Dashboard:

1. **Configure App** (settings di atas)
2. **Build App**:
   - Android: APK / AAB
   - iOS: IPA / TestFlight
3. **Download** atau publish to Store

Build time: ~10-15 menit

---

## 💡 Tips

1. **Use Custom Tab** bukan External Browser untuk OAuth
2. **Enable All JavaScript features** yang dibutuhkan
3. **Test di Real Device** bukan emulator
4. **Check SHA-1** fingerprint match antara Median & Firebase
5. **Monitor Firebase Console** untuk debug auth issues

---

Jika masih ada masalah, contact Median.co support atau buka ticket di dashboard mereka. Mereka sangat responsive! 🎉
