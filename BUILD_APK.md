# 📦 Cara Build APK Shiiinime

Panduan lengkap untuk build aplikasi Android APK menggunakan Capacitor.

## 📋 Prerequisites

### 1. Install Android Studio

1. Download [Android Studio](https://developer.android.com/studio)
2. Install dengan semua default components
3. Buka Android Studio > More Actions > SDK Manager
4. Install:
   - Android SDK Platform 33 (atau terbaru)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Google Play services

### 2. Setup Environment Variables

Tambahkan ke System Environment Variables:

```
ANDROID_HOME = C:\Users\YourName\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr
```

Tambahkan ke PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\cmdline-tools\latest\bin
%ANDROID_HOME%\emulator
```

### 3. Verify Installation

```bash
# Test adb
adb --version

# Test Java
java --version

# Test Gradle (akan auto-download)
```

---

## 🚀 Build APK

### Step 1: Export Next.js

```bash
npm run build
npm run export
```

Ini akan create folder `out/` dengan static files.

### Step 2: Initialize Android Project

Hanya sekali di awal:

```bash
npx cap add android
```

### Step 3: Sync Files ke Android

Setiap kali ada perubahan code:

```bash
npx cap sync
```

### Step 4: Open di Android Studio

```bash
npx cap open android
```

Atau manual: Buka Android Studio > Open > pilih folder `android/`

### Step 5: Build APK

Di Android Studio:

1. **Menu** > **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
2. Tunggu proses build selesai
3. Klik **locate** untuk cari file APK
4. File ada di: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔐 Build Release APK (Signed)

### 1. Generate Keystore

```bash
cd android/app
keytool -genkey -v -keystore shiiinime-release-key.keystore -alias shiiinime -keyalg RSA -keysize 2048 -validity 10000
```

Isi data:
- Password: (simpan baik-baik!)
- Name: Your Name
- Organization: Shiiinime
- City, State, Country: (isi sesuai)

### 2. Setup Gradle Signing

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('shiiinime-release-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'shiiinime'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Build Release APK

Di Android Studio:

1. **Build** > **Select Build Variant** > pilih **release**
2. **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
3. File ada di: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎨 Customize App

### 1. Icon & Splash Screen

Generate icons di [Icon Kitchen](https://icon.kitchen/) atau [App Icon Generator](https://www.appicon.co/)

Copy ke:
```
android/app/src/main/res/
  ├── mipmap-hdpi/
  ├── mipmap-mdpi/
  ├── mipmap-xhdpi/
  ├── mipmap-xxhdpi/
  └── mipmap-xxxhdpi/
```

### 2. App Name

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Shiiinime</string>
    <string name="title_activity_main">Shiiinime Stream</string>
    <string name="package_name">com.shiiinime.app</string>
</resources>
```

### 3. Package Name

Edit `capacitor.config.ts`:

```typescript
appId: 'com.shiiinime.app', // Your unique package name
```

### 4. Version & Build Number

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1        // Increment setiap upload baru
        versionName "1.0.0"  // Semantic versioning
    }
}
```

---

## 🔧 Fix Login Google Issue

### 1. Enable Custom Tabs

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <application>
        ...
        <activity
            android:name="com.getcapacitor.MainActivity"
            android:launchMode="singleTask"
            android:exported="true">
            
            <!-- Add this intent-filter -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" />
                <data android:host="shiiinimebeta.vercel.app" />
            </intent-filter>
        </activity>
    </application>
    
    <!-- Add internet permission -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

### 2. Add Firebase OAuth Redirect

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Project Settings > Authentication
3. Add Android App SHA-1 fingerprint

Get SHA-1:
```bash
cd android
./gradlew signingReport
```

Copy SHA-1 dan tambahkan di Firebase Console.

### 3. Update Google Sign-In Config

Buat file `android/app/google-services.json` dari Firebase Console:
1. Download `google-services.json`
2. Copy ke `android/app/`

---

## 📱 Testing

### Test di Emulator

1. Buka Android Studio
2. **Tools** > **Device Manager**
3. Create Virtual Device (Pixel 5, API 33)
4. Run: `npx cap run android`

### Test di Real Device

1. Enable **Developer Options** di HP:
   - Settings > About Phone > tap Build Number 7x
2. Enable **USB Debugging**
3. Connect HP via USB
4. Run: `npx cap run android`

---

## 🐛 Troubleshooting

### Build Failed: SDK Not Found

```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Gradle Build Failed

```bash
cd android
./gradlew clean
./gradlew build
```

### Login Stuck/Not Working

1. Check `AndroidManifest.xml` ada internet permission
2. Check Firebase SHA-1 fingerprint sudah ditambahkan
3. Check `google-services.json` ada di `android/app/`
4. Rebuild: `npx cap sync && npx cap open android`

### App Crashes on Start

1. Check logs: `adb logcat`
2. Check `capacitor.config.ts` webDir = 'out'
3. Rebuild: `npm run export && npx cap sync`

### White Screen

1. Check `next.config.js` ada `output: 'export'`
2. Check `images: { unoptimized: true }`
3. Check `out/` folder exists after `npm run export`

---

## 📊 File Size Optimization

### 1. Enable ProGuard

Edit `android/app/build.gradle`:

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
    }
}
```

### 2. Split APKs by ABI

```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a'
            universalApk false
        }
    }
}
```

### 3. Use App Bundle (AAB)

**Build** > **Generate Signed Bundle / APK** > **Android App Bundle**

Buat upload ke Play Store, ukuran lebih kecil.

---

## 📤 Distribution

### Option 1: Direct APK

Upload `app-release.apk` ke:
- Google Drive
- GitHub Releases
- Your website

### Option 2: Google Play Store

1. Build App Bundle (AAB)
2. Buat akun Google Play Developer ($25 one-time)
3. Upload AAB
4. Submit for review

### Option 3: F-Droid / Aurora Store

Open-source alternative stores.

---

## ✅ Final Checklist

- [ ] Android Studio installed
- [ ] Environment variables set
- [ ] `npm run export` success
- [ ] `npx cap sync` success
- [ ] Login works in app
- [ ] Notifications work
- [ ] All features tested
- [ ] Icons & splash screen customized
- [ ] Version number updated
- [ ] Keystore created & saved securely
- [ ] APK signed and tested
- [ ] APK size optimized

---

## 🚀 Quick Build Commands

```bash
# Development build
npm run export && npx cap sync && npx cap open android

# After code changes
npx cap sync

# Build release APK
# 1. Android Studio > Build > Build APK
# 2. Find at: android/app/build/outputs/apk/release/

# Or via command line
cd android
./gradlew assembleRelease
```

---

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Docs](https://developer.android.com/)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Generate Icons](https://icon.kitchen/)

---

Selamat building! 🎉 Jika ada masalah, check Troubleshooting section atau buka issue di GitHub.
