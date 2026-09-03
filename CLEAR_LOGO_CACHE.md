# 🎨 Logo Tidak Berubah? Clear Cache!

Logo sudah diganti dari folder `logo/` tapi masih tampil yang lama? Ini karena **browser/Vercel cache**. Berikut solusinya:

## ✅ Logo Sudah Benar

File `public/logo.png` sudah di-update dari `logo/logo.png`:
- ✅ Size: 36,049 bytes
- ✅ Path di Navbar: `/logo.png`
- ✅ Used in: Navbar, manifest.json, layout.tsx

## 🔄 Clear Cache

### 1. Clear Browser Cache (Paling Cepat!)

**Chrome/Edge:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

Atau:
```
1. Klik kanan di logo
2. Inspect Element (F12)
3. Klik kanan di Network tab
4. "Clear browser cache"
5. Refresh page (F5)
```

**Force reload image:**
```
1. Buka: https://shiiinimebeta.vercel.app/logo.png
2. Hard refresh: Ctrl + Shift + R
3. Kembali ke homepage
4. Logo akan update!
```

### 2. Clear Vercel Cache

Vercel akan auto-deploy dari GitHub push. Tunggu ~2-3 menit deployment selesai.

**Check deployment:**
```
https://vercel.com/[your-username]/shiiinimebeta/deployments
```

Lihat status "Ready" berarti sudah live.

### 3. Clear Next.js Cache (Local Dev)

Jika test di local (`npm run dev`):

```bash
# Stop dev server (Ctrl+C)

# Delete .next folder
Remove-Item -Recurse -Force .next

# Restart dev server
npm run dev
```

Logo akan fresh!

### 4. Add Cache-Busting Query (Quick Fix)

Jika cache sangat keras kepala, tambah version query:

```tsx
// Navbar.tsx
<Image 
  src="/logo.png?v=2" 
  alt="Shiiinime Logo" 
  width={32} 
  height={32}
/>
```

Setiap kali ganti logo, increment `v=3`, `v=4`, dll.

## 🧪 Test Logo Update

### Check di Browser:

1. **Direct URL:**
   ```
   https://shiiinimebeta.vercel.app/logo.png
   ```
   Hard refresh (Ctrl + Shift + R)

2. **Homepage:**
   ```
   https://shiiinimebeta.vercel.app
   ```
   Hard refresh

3. **Incognito/Private Mode:**
   - Buka browser incognito (Ctrl + Shift + N)
   - Navigate ke site
   - Logo harus sudah baru!

### Check File Updated:

```bash
# Compare file sizes
Get-Item public\logo.png, logo\logo.png | Select Name, Length, LastWriteTime
```

Both files harus sama (36,049 bytes).

## 🔍 Troubleshooting

### Logo Masih Lama Setelah Clear Cache?

**Check 1: File benar?**
```bash
# Di folder project
Get-FileHash public\logo.png
Get-FileHash logo\logo.png

# Hash harus sama!
```

**Check 2: Vercel deployment done?**
- Check Vercel dashboard
- Last deployment status: "Ready" ✅
- Time: > 2 minutes ago

**Check 3: Browser cache super stuck?**
```
Chrome Settings > Privacy > Clear browsing data
✅ Cached images and files
Time range: Last 24 hours
Clear data
```

### Logo Correct di Incognito, Wrong di Normal Browser?

**Solusi:** Browser cache issue!

```
Clear site data:
1. Chrome: F12 > Application > Storage > Clear site data
2. Or use Incognito until cache expires
```

## 🎯 Expected Result

After clearing cache, kamu akan lihat:

**Logo Baru:**
- ✅ Di Navbar (kiri atas)
- ✅ Di browser tab (favicon)
- ✅ Di PWA install icon
- ✅ Di manifest icons

**Locations:**
- `/` homepage
- All pages dengan Navbar
- Browser tab icon
- PWA splash screen

## 💡 Prevention

Untuk prevent cache issues di future:

### Option 1: Versioned Assets
```tsx
// Always use versioned URLs
<Image src="/logo.png?v=1" />
```

Increment version saat ganti logo.

### Option 2: Hash-based Filenames
```
logo.abc123.png (unique hash)
```

Next.js auto-handle ini untuk images di `/_next/static/`.

### Option 3: Set Cache Headers

Di `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/logo.png',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
  ];
}
```

Cache 1 hour, lalu revalidate.

## ✅ Current Status

- ✅ Logo file updated: `public/logo.png` (36,049 bytes)
- ✅ Navbar using: `/logo.png`
- ✅ Manifest using: `/logo.png`
- ✅ Layout metadata using: `/logo.png`
- ✅ Committed & pushed to GitHub
- ⏳ Vercel deployment: In progress or done
- ⏳ Browser cache: Need hard refresh

## 🚀 Quick Fix

**TL;DR:**

```
1. Hard refresh: Ctrl + Shift + R
2. Or incognito mode
3. Wait 2-3 minutes for Vercel deploy
4. Logo will update!
```

---

**Logo sudah benar di server, tinggal clear browser cache!** 🎨✨
