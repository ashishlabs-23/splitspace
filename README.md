# SplitSpace — Super Version

A user-first group expense app. The complexity stays behind the scenes: users create a space, invite people, add expenses, and SplitSpace tells them exactly who needs to pay whom.

## Modern Serverless Architecture

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Authentication**: Firebase Authentication (Email/Password, 1-Click Google Sign-In, Password Reset, Auth State)
- **Database**: Firebase Cloud Firestore (Sub-30ms real-time NoSQL database with atomic transactions and granular security rules)
- **Zero-Config Fallback**: Built-in mock data mode so you can run and test locally immediately without waiting for setup

---

## Quick Start (Run Locally)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Firebase Setup (Authentication & Cloud Firestore)

### 1. Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/) > Your project (`splitspace-9d28f`).
2. In **Build > Authentication > Sign-in method**, enable **Email/Password** and **Google**.

### 2. Enable Cloud Firestore Database
1. In Firebase Console, go to **Build > Firestore Database**.
2. Click **Create database** -> Choose **Start in test mode** (or production mode) -> Select your location.
3. In the **Rules** tab, paste the contents of [`firestore.rules`](./firestore.rules) and click **Publish**.

### 3. Environment Variables
Your `frontend/.env.local` contains your active Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=splitspace-9d28f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=splitspace-9d28f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=splitspace-9d28f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=396055786543
NEXT_PUBLIC_FIREBASE_APP_ID=1:396055786543:web:...
```

---

## Main UX Principles

1. A new user should understand the app immediately.
2. Add-expense requires only title, amount, payer, and who shares it.
3. Equal splitting is the default; custom splitting is an advanced option.
4. The app shows actionable settlement instructions instead of raw accounting numbers.
5. Every space is independent, so one user can keep separate trips/events/projects.
