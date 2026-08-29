# SplitSpace — Modern Group Expense & Debt Settlement Engine

[![Live Demo](https://img.shields.io/badge/Live_Demo-splitspace--9d28f.web.app-00C7B7?style=for-the-badge&logo=firebase&logoColor=white)](https://splitspace-9d28f.web.app)
[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase_Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

SplitSpace is a high-performance, real-time group expense management and debt simplification platform. Built with **Next.js 16 (Turbopack, App Router)**, **React 19**, **Tailwind CSS**, **Framer Motion**, and **Google Firebase** (Authentication & Cloud Firestore).

🌐 **Live Application**: [https://splitspace-9d28f.web.app](https://splitspace-9d28f.web.app)

---

## ✨ Key Capabilities & Features

- **⚡ Instant Group Spaces**: Create distinct shared spaces for trips, households, projects, or events.
- **🔗 Shareable Invite Engine**: 1-click invite links with atomic Firestore membership synchronization.
- **💡 Smart Debt Minimization Engine**: Greedy flow debt-simplification algorithm that reduces complex circular group debts down to the minimal number of direct settlement transactions.
- **🌍 Multi-Currency Spend Lens**: Real-time live exchange rate converter supporting INR, USD, EUR, GBP, AED, JPY, CAD with 1-click live toggle.
- **📊 4 Splitting Paradigms**: Equal, Exact, Percentage, and Custom Weight Shares.
- **🔒 Enterprise-Grade Security**: Granular Firebase Security Rules protecting spaces, expenses, settlements, and member privacy.
- **📱 Touch & Mobile Optimized**: Ultra-responsive bento cards, gesture-driven slide-out drawers, tactile haptic feedback, and dynamic keyboard shortcuts.
- **📄 Complete Ledger Export**: Instant CSV data export and print-ready PDF settlement summaries.

---

## 🛠️ Technical Stack & Architecture

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (Turbopack, App Router)](https://nextjs.org/) |
| **UI Library** | [React 19](https://react.dev/), [SmoothUI](https://smoothui.dev/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Motion & Micro-interactions** | [Framer Motion (`motion/react`)](https://motion.dev/) |
| **Authentication** | [Firebase Auth](https://firebase.google.com/products/auth) (Google 1-Click + Email/Password + Email Verification) |
| **Database** | [Google Cloud Firestore](https://firebase.google.com/products/firestore) (Atomic transactions, zero-cold-start) |
| **Hosting & CDN** | [Firebase Hosting](https://firebase.google.com/products/hosting) |

---

## 🚀 Getting Started (Local Development)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/ashishlabs-23/splitspace.git
cd splitspace/frontend
npm install
```

### 2. Configure Environment Variables

Create `frontend/.env.local` with your Firebase project credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=splitspace-9d28f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=splitspace-9d28f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=splitspace-9d28f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=396055786543
NEXT_PUBLIC_FIREBASE_APP_ID=1:396055786543:web:6e1b6f007e0c...
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deploying to Production

### Deploy Frontend (Firebase Hosting)

```bash
cd frontend
npm run build
cd ..
npx firebase-tools deploy --only hosting
```

### Deploy Firestore Security Rules

```bash
node scripts/deploy-rules.js
```

Or verify active rules and tokens:

```bash
node scripts/verify-rules.js
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| <kbd>E</kbd> | Open New Expense Modal |
| <kbd>N</kbd> | Create New Space Modal |
| <kbd>I</kbd> | Open Invite Friends Modal |
| <kbd>S</kbd> | Record Direct Settlement |
| <kbd>X</kbd> | Export CSV / Print Summary |
| <kbd>[</kbd> | Toggle Sidebar Navigation |

---

## 📄 License

MIT © [Ashish Labs](https://github.com/ashishlabs-23)

