# 🎫 VerifyFlow - Real-Time Ticket Scanner, Event Organizer & Registrant Platform

A modern, real-time ticket scanning, validation, organizer management, and attendee registration system built for event organizers, summits, and expos. 

Features real-time **Firebase Firestore synchronization**, offline fallback capabilities, live camera QR scanning, manual code check-in, custom organizer logo uploads, custom event banner picture uploads, and instant CSV exports.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons, jsQR.
- **Backend & Database**: Firebase Firestore (Real-time live multi-device syncing across devices) with browser `localStorage` instant fallback caching.
- **Image Processing**: Client-side canvas compression for organizer logos and event cover photos before database storage.
- **Deployment**: Optimized for **Vercel**, Cloud Run, and GitHub Pages.

---

## ✨ Key Features

1. **Firebase Real-Time Multi-Device Sync**:
   - Organizers can scan tickets simultaneously on multiple phones or devices; check-in status updates instantly across all connected screens via Firestore listeners.
2. **Organizer Profile & Logo Upload**:
   - Register organizer accounts with custom company name, password, and custom logo image upload.
3. **Event Management & Custom Banner Pictures**:
   - Create public or private events with custom title, date, venue, description, theme accent color, and custom cover photo / banner picture uploads.
4. **Dual-Mode High Speed Ticket Verification**:
   - **Live Camera Scanner**: Instant WebRTC camera feed decoding.
   - **Manual Code Input**: High-speed backup input with instant sound alerts (Success, Warning, Error).
5. **Attendee Registration & Badge Issuance**:
   - Public landing page where attendees can discover public events and register for pass categories (VIP, General, Staff, Press).
6. **Filtered Database & CSV Export**:
   - Search, filter by pass type or check-in status, paginate, and export reports to CSV.

---

## 💻 How to Run Locally on Your Laptop

### Prerequisites
- Install **Node.js** (v18 or higher) and **npm** on your computer.

### Step 1: Clone the Repository
```bash
git clone <your-github-repo-url>
cd <repo-folder-name>
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` (or the URL shown in your terminal).

---

## 🚀 How to Deploy to Vercel

Deploying to Vercel takes less than 2 minutes and is completely free:

### Option A: Via GitHub (Recommended)
1. Push your code to your GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New"** > **"Project"**.
3. Import your GitHub repository.
4. Vercel will automatically detect **Vite**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Vercel will build and deploy your live HTTPS link!

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy directly from terminal
vercel
```

---

## 📱 Building Mobile Apps (Android APK & iOS)

A complete step-by-step guide on how to convert this web app into native Android (`.apk`) and iOS apps using Capacitor or PWA is available in the dedicated documentation file:

👉 **Read [MOBILE_APP_GUIDE.md](./MOBILE_APP_GUIDE.md)** for Android Studio setup, camera permissions, and APK build commands.

---

## 📄 License
MIT License. Built for seamless event operations and ticket verification.
