# BGI Event Ticket Scanner & Registrant Database System

An advanced, real-time ticket scanning, validation, and attendee registration system built for smooth event coordination. Designed with a highly polished, interactive futuristic cyber-slate dashboard theme, it operates 100% offline-capable and supports live QR camera scanning, manual backups, attendee credential creation, and instant reporting exports.

---

## 🛠️ Technology Stack Breakdown

This application is built with a premium, robust frontend stack and optimized client-side state engines:

### 1. Frontend Architecture
* **React 19**: Powered by functional components, custom hooks, and dynamic hydration contexts.
* **Vite**: Ultra-fast bundler for modern asset rendering and fast local development.
* **Tailwind CSS v4**: Implements custom design grids, responsive layout behaviors (`sm:`, `md:`, `lg:`), and custom-themed dark elements.
* **Framer Motion**: Delivers smooth fluid motion layout changes, alerts, and feedback transition effects.
* **jsQR**: Instant WebRTC client-side QR code decoding and processing directly from device cameras.
* **Lucide React**: Premium, consistent modern system vector icons.

### 2. Backend & System Runtime
* **Node.js**: The reliable development environment running with native ECMAScript Modules (`type: "module"`).
* **Express**: Serves production-ready assets and routes correctly under standard configurations.

### 3. Database & Local Persistence
* **Offline-Persistent database Engine (`src/db.ts`)**:
  * Utilizes robust custom browser **`localStorage`** wrappers to fully persist all registrant records, status logs, and ticket check-ins.
  * Hydrated and pre-seeded automatically with **72 initial registrants** representing various pass categories (General, VIP, Staff, Press).
  * Remembers and persists real-time check-in timestamps, status logs, and new registrations across server restarts or page refreshes.

---

## 🚀 Core Features

1. **Dual Mode Scanner**:
   * **Live Video Scan**: Real-time camera feed analysis for instant digital check-ins.
   * **Manual Input Console**: Fast alphanumeric fallback codes (`BGI-XXXXXX`) with immediate visual checks.
2. **Interactive Recent Activity Log**:
   * Displays check-in attempts (successful check-ins, warning-level duplicate attempts, and error-level invalid codes) with precise timestamps.
3. **Advanced Registrant Database**:
   * Multi-column filters for Ticket Type (VIP, General, Staff, Press) and Check-In Status.
   * Smart sorting options (by Ticket Code, Registration Date, or Check-In Timestamp).
   * **Custom 10-Item Pagination**: Limits table length automatically, ensuring high-density layout comfort on both desktop and mobile screens.
4. **Instant CSV Exporter**:
   * One-click download containing all currently filtered and sorted attendee registration statuses for external analytics.
5. **Interactive Ticket Console**:
   * Easy-to-use modals to issue brand new ticket passes on the fly or inspect active attendee details.
6. **Smart Audio alerts System**:
   * Synthesized sound triggers with distinct auditory frequencies (success chime, warning hum, error buzzer) for busy operators.

---

## 📱 Mobile-First Responsive Design & PWA

* **PWA Capability**: This application is pre-configured with a Progressive Web App manifest (`public/manifest.json`). When hosted on HTTPS, operators can simply open the link on Android or iOS, click **"Add to Home Screen"**, and run it as an installed app. It will open in standalone full-screen mode without browser UI, support fast offline-hydration, and maintain native device aesthetics.
* **Fluid Adaptive Grids**: The scanning station and activity log lay out side-by-side on desktop displays and collapse into touch-friendly stacks on smartphone viewports.
* **Robust Touch Targets**: Buttons and filters feature spacious hit zones (at least `44px`) to ensure error-free operation under high-traffic check-in environments.
* **Horizontal Scroll Wrappers**: Registrant databases are protected in strict scroll containers to keep device viewports perfectly aligned.
* **Visual Density Limits**: Clean paginated states prevent infinitely long lists on smaller mobile browsers.

---

## 📦 How to Build a Native Android APK

If you want to build a native Android `.apk` package to distribute to physical mobile scanners, you can easily wrap this Vite app using **Capacitor** (by Ionic):

### 1. Build the production web assets
```bash
npm run build
```
This will compile the single-page application inside the `dist/` folder.

### 2. Add Capacitor to your project
```bash
npm install @capacitor/core @capacitor/cli
```

### 3. Initialize Capacitor
```bash
npx cap init "BGI Gateway" "com.cftechlab.bgigateway" --web-dir=dist
```

### 4. Install and add the Android platform
```bash
npm install @capacitor/android
npx cap add android
```

### 5. Sync the compiled assets to the Android folder
```bash
npx cap sync
```

### 6. Build the APK inside Android Studio
```bash
npx cap open android
```
This opens the project in Android Studio. Simply go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**. Your native installer `.apk` is ready for your mobile device!

---

## 💻 How to Run Locally

### Prerequisites
Make sure you have Node.js (v18+) and npm installed on your system.

### Installation
```bash
# Install dependencies
npm install

# Boot development server
npm run dev
```

The application will run locally on your browser.

---

## 📤 Push and Sync to GitHub

To publish this project to your own GitHub profile:
1. Open the **AI Studio Settings / Project Menu** at the top corner of the screen.
2. Select the **Export / Connect to GitHub** option.
3. Authenticate with your GitHub account and authorize the export.
4. Select or create a repository (e.g., `bgi-ticket-scanner`), and AI Studio will instantly push the entire workspace to your repository.
