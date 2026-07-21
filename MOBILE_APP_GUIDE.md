# 📱 Complete Guide: Building Mobile Apps (Android & iOS)

This guide provides step-by-step instructions to convert this React Vite Ticket Verification & Organizer platform into native mobile applications for **Android (.apk / .aab)** and **iOS (.app / .ipa)**, as well as setting up as a **Progressive Web App (PWA)**.

---

## 🛠️ Method 1: Convert to Native Android & iOS using Capacitor

Capacitor (by Ionic) allows you to wrap your web app with native container shells and gives direct access to native APIs (like device cameras for high-speed QR scanning).

### Prerequisites
- **Node.js**: v18 or higher installed on your computer.
- **Android Studio** (for Android APK generation): [Download Android Studio](https://developer.android.com/studio)
- **Xcode** (for iOS build - requires a macOS computer): Available on Mac App Store.

---

### Step-by-Step Implementation

#### Step 1: Build the Web Production Bundle
First, compile your Vite web app into production static files:
```bash
npm run build
```
This generates the compiled code inside the `dist/` directory.

---

#### Step 2: Install Capacitor Core & CLI
In your project root terminal, install Capacitor:
```bash
npm install @capacitor/core @capacitor/cli
```

---

#### Step 3: Initialize Capacitor
Initialize Capacitor with your app name and package bundle identifier:
```bash
npx cap init "VerifyFlow Scanner" "com.verifyflow.app" --web-dir=dist
```

---

#### Step 4: Add Android and iOS Platforms
Install platform-specific dependencies:
```bash
# Install Android platform module
npm install @capacitor/android
npx cap add android

# (Optional - Mac only) Install iOS platform module
npm install @capacitor/ios
npx cap add ios
```

---

#### Step 5: Configure Native Camera Permissions
Since ticket check-in uses camera QR scanning, enable camera permissions in native config files:

##### For Android (`android/app/src/main/AndroidManifest.xml`):
Add the following lines inside the `<manifest>` tag:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.autofocus" />
```

##### For iOS (`ios/App/App/Info.plist`):
Add the camera usage description key:
```xml
<key>NSCameraUsageDescription</key>
<string>This app requires camera access to scan ticket QR codes for attendee check-in.</string>
```

---

#### Step 6: Synchronize Web Code with Native Projects
Whenever you update your web code, run build and sync:
```bash
npm run build
npx cap sync
```

---

#### Step 7: Build Native Apps

##### Building Android APK / Release:
Run the command below to open Android Studio:
```bash
npx cap open android
```
In Android Studio:
1. Wait for Gradle sync to complete.
2. Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** for a test APK.
3. Your generated `.apk` file will be located under `android/app/build/outputs/apk/debug/app-debug.apk`. You can install this directly on any Android device!
4. For Google Play Store release, click **Build** > **Generate Signed Bundle / APK**.

##### Building iOS App (macOS only):
Run the command below to open Xcode:
```bash
npx cap open ios
```
In Xcode:
1. Select your target device or simulator.
2. Set your **Signing & Capabilities** team account.
3. Click **Product** > **Run** or **Archive** to deploy to physical iPhones or TestFlight.

---

## 🌐 Method 2: Instant PWA (Progressive Web App - No App Store Needed)

Your web app already includes a PWA manifest configuration (`public/manifest.json`). When deployed on HTTPS (e.g. Vercel), users can install it directly from mobile browsers without downloading from Google Play or App Store!

### How to Install on Android (Chrome / Edge / Brave):
1. Open your deployed Vercel URL in mobile Chrome.
2. Tap the three dots menu (**⋮**) in the top right corner.
3. Tap **"Add to Home screen"** or **"Install App"**.
4. The app icon will appear on your home screen and run in fullscreen native mode without browser address bars!

### How to Install on iPhone / iPad (Safari):
1. Open your deployed Vercel URL in Safari.
2. Tap the **Share** button at the bottom navigation bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. The app will launch as a standalone iOS app with full camera access.

---

## ⚡ Summary Checklist for Local Development to Mobile
1. `npm install`
2. `npm run dev` (Test on laptop browser)
3. `npm run build`
4. `npx cap sync`
5. `npx cap open android` -> Generate APK!
