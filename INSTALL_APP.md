# 📱 Cara Install Shiiinime ke Home Screen

Panduan lengkap untuk install aplikasi Shiiinime sebagai PWA (Progressive Web App) agar notifikasi bisa muncul dan membuka aplikasi.

## 🔔 Kenapa Perlu Di-install?

✅ **Notifikasi push langsung ke HP**  
✅ **Akses cepat dari home screen**  
✅ **Pengalaman seperti aplikasi native**  
✅ **Bisa dibuka tanpa browser bar**  
✅ **Notifikasi klik langsung buka app**

---

## 📱 Cara Install di Android

### Chrome (Recommended)

1. **Buka website** di Chrome browser
2. Tunggu **popup "Add to Home screen"** muncul
3. Atau klik **menu (⋮)** > **"Add to Home screen"** atau **"Install app"**
4. Klik **"Install"** atau **"Add"**
5. Aplikasi akan muncul di home screen!

### Samsung Internet

1. Buka website di Samsung Internet
2. Tap **menu (☰)** di bawah
3. Pilih **"Add page to"** > **"Home screen"**
4. Tap **"Add"**

### Firefox

1. Buka website di Firefox
2. Tap **menu (⋮)** 
3. Pilih **"Install"**
4. Konfirmasi dengan tap **"Add to Home screen"**

---

## 🍎 Cara Install di iPhone/iPad

### Safari (iOS 14+)

1. **Buka website** di Safari
2. Tap tombol **Share (ikon kotak dengan panah)**
3. Scroll ke bawah, pilih **"Add to Home Screen"**
4. Edit nama jika perlu
5. Tap **"Add"**
6. Aplikasi muncul di home screen!

⚠️ **Penting untuk iOS:**
- Harus pakai **Safari**, bukan Chrome/Firefox
- Notifikasi push belum support di iOS browser
- Tapi app tetap bisa di-install dan diakses cepat

---

## 🔧 Setting Notifikasi Setelah Install

### 1. Buka App dari Home Screen

Tap icon Shiiinime di home screen, **jangan** buka dari browser.

### 2. Login Ke Akun

Login dengan akun Google/Facebook/Email Anda.

### 3. Aktifkan Notifikasi

- Akan muncul popup **"Aktifkan Notifikasi"**
- Tap **"🔔 Aktifkan"**
- Browser akan minta permission
- Tap **"Allow"** atau **"Izinkan"**

### 4. Test Notifikasi

- Coba balas komentar
- Atau tunggu episode baru rilis
- Notifikasi akan muncul di HP!

---

## 🎯 Troubleshooting

### Popup Install Tidak Muncul?

**Solusi:**
1. Clear browser cache
2. Reload halaman (swipe down refresh)
3. Tunggu 10 detik, popup auto muncul
4. Atau manual via browser menu

### Notifikasi Tidak Muncul?

**Cek ini:**

1. **App sudah di-install?**
   - Harus install via "Add to Home screen"
   - Bukan bookmark biasa

2. **Notifikasi sudah diaktifkan?**
   - Setting HP > Apps > Shiiinime > Notifications > **ON**
   - Setting browser juga harus allow notifications

3. **App dibuka dari home screen?**
   - Jangan buka dari browser tab
   - Harus tap icon di home screen

4. **Sudah login?**
   - Notifikasi hanya untuk user yang login
   - FCM token harus ter-register

5. **Permission granted?**
   - Check di setting browser/app
   - Kadang perlu revoke & allow lagi

### Notifikasi Tidak Buka App?

**Solusi:**

1. **Reinstall app:**
   - Hapus dari home screen
   - Clear browser cache
   - Install lagi

2. **Check manifest:**
   - `start_url` harus `/`
   - `scope` harus `/`

3. **Force close & reopen:**
   - Close app sepenuhnya
   - Buka lagi dari home screen

---

## 📊 Cek Status PWA

### Di Chrome (Desktop)

1. Buka DevTools (F12)
2. Tab **Application**
3. Lihat:
   - **Manifest** - harus ada dan valid
   - **Service Workers** - harus Active
   - **Background Services** - harus bisa receive notif

### Di Chrome (Mobile)

1. Buka chrome://serviceworker-internals/
2. Cari shiiinime
3. Status harus **ACTIVATED**

---

## ✅ Checklist Setelah Install

- [ ] App muncul di home screen dengan icon
- [ ] Buka app dari home screen (bukan browser)
- [ ] Status bar tidak ada (fullscreen mode)
- [ ] Login berhasil
- [ ] Popup "Aktifkan Notifikasi" muncul
- [ ] Permission granted
- [ ] Test notifikasi berhasil
- [ ] Klik notifikasi buka app (bukan browser tab)

---

## 🚀 Fitur PWA yang Tersedia

| Fitur | Android | iOS |
|-------|---------|-----|
| Install to Home Screen | ✅ | ✅ |
| Offline Mode | ✅ | ✅ |
| Push Notifications | ✅ | ❌* |
| Background Sync | ✅ | ❌ |
| App-like Experience | ✅ | ✅ |
| Auto Updates | ✅ | ✅ |

*iOS Safari belum support Web Push Notifications

---

## 📝 Catatan Penting

1. **HTTPS Required**
   - PWA dan notifications hanya work di HTTPS
   - Localhost juga bisa untuk testing

2. **Browser Support**
   - Android: Chrome, Edge, Samsung Internet, Firefox
   - iOS: Safari only (untuk install)

3. **Storage**
   - App size ~5-10MB
   - Cache otomatis untuk offline
   - Bisa di-uninstall kapan saja

4. **Updates**
   - App otomatis update saat ada versi baru
   - Service worker di-refresh otomatis
   - Tidak perlu download dari store

---

## 🆘 Masih Bermasalah?

1. **Clear Everything:**
   ```
   - Uninstall app dari home screen
   - Clear browser cache & data
   - Restart HP
   - Install ulang
   ```

2. **Check Console:**
   - Buka chrome://inspect (Android)
   - Lihat error di console
   - Screenshot & report

3. **Contact Support:**
   - Screenshot issue
   - Kirim ke developer
   - Include: Device, OS, Browser version

---

Selamat menikmati Shiiinime dengan notifikasi push! 🎉
