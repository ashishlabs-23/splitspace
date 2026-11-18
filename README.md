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

- **⚡ Instant Group Spaces & Guest Demo Mode**: Create shared spaces for trips, households, projects, or events. Anyone can try the application immediately in 1-click **Guest Demo Mode** without signing up.
- **🚪 Direct App-First Experience**: Clean entry via a dedicated Auth/Welcome screen with Google 1-Click, Email/Password, and Demo space testing — marketing pages are on-demand rather than obstructing user entry.
- **🔗 Shareable Invite Engine & Deep Linking**: 1-click shareable invite links (`/?join={token}`) with public metadata preview and atomic Firestore membership synchronization, plus URL space deep-linking (`/?space={spaceId}`).
- **👥 Flexible Member Management**: Add group members with just their names without mandating email addresses (emails are optional).
- **💡 Smart Debt Minimization Engine**: Exact integer-cent greedy flow algorithm that reduces complex circular group debts down to the minimal number of direct settlement transactions while preserving zero-sum balance equilibrium even when members depart.
- **🔄 Live Real-Time Multi-Client Sync**: Subscribed to Firestore `onSnapshot` real-time listeners across spaces, expenses, and settlements. All participants see instant live ledger updates (<1 second) without page reloads.
- **🌍 Multi-Currency Spend Lens**: Real-time live exchange rate converter supporting INR, USD, EUR, GBP, AED, JPY, CAD with 1-click live toggle and 10-minute caching.
- **📊 4 Splitting Paradigms**: Equal (with subset member exclusions), Exact (with foreign currency cross-validation), Percentage, and Custom Weight Shares.
- **🔒 Enterprise-Grade Security**: Granular Firebase Security Rules protecting spaces, expenses, settlements, and member privacy.
- **📱 Touch & Mobile Optimized**: Responsive bento cards, gesture-driven slide-out drawers, tactile feedback, and dynamic keyboard shortcuts.
- **📄 Complete Ledger Export**: Instant RFC 4180 CSV data export, 1-click Gmail statement composer, and print-ready Corporate PDF settlement summaries.

---

## 🛠️ Technical Stack & Architecture

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (Turbopack, App Router, Static Export)](https://nextjs.org/) |
| **UI Library** | [React 19](https://react.dev/), [SmoothUI](https://smoothui.dev/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Motion & Micro-interactions** | [Framer Motion (`motion/react`)](https://motion.dev/) |
| **Authentication** | [Firebase Auth](https://firebase.google.com/products/auth) (Google 1-Click + Email/Password + Verification) |
| **Database** | [Google Cloud Firestore](https://firebase.google.com/products/firestore) (Atomic transactions, `onSnapshot` real-time listeners) |
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

## 🧪 Testing & Verification

### Run Accounting Engine Unit Tests

```bash
npm test --prefix frontend
```
Runs the 5-case engine suite in `scripts/test-engine.mjs` verifying penny-rounding elimination, transitive debt collapse, subset equal splits, and departed member balance equilibrium.

### Run Automated Live Production QA

```bash
node scripts/qa-live-site.js
```
Validates the live production site `https://splitspace-9d28f.web.app` across all JS bundles, CSS stylesheets, manifests, deep links, and service worker assets.

### Verify & Deploy Firestore Rules

```bash
# Verify active deployed rules
node scripts/verify-rules.js

# Test live invite generation and cleanup
node scripts/test-live-invite.js

# Deploy updated firestore.rules
node scripts/deploy-rules.js
```

---

## 🚢 Deploying to Production

### Deploy Frontend (Firebase Hosting)

```bash
cd frontend
npm run build
cd ..
node scripts/deploy-hosting.js
```

---

## ⚠️ Current Limitations & Roadmap

While SplitSpace provides accurate real-time debt calculation and multi-currency tracking, the following capabilities are currently on the product roadmap:

1. **Receipt / Bill Photo Attachments**: Direct camera capture and file upload for physical receipt photos (requires Firebase Storage integration).
2. **Base-Currency-Only Settlements**: Direct settlement payments are recorded in the space's base currency. Multi-currency settlement logging (e.g., settling in cash USD for an INR space) is currently handled via manual conversion.
3. **Recurring Expenses**: Automation for monthly repeating expenses (rent, utilities, subscription streaming services).
4. **Audit Trail & Changelog**: While transactions update in real time, an itemized visual change history ("who edited/deleted an expense and when") is not yet surfaced.
5. **Push Notifications (FCM)**: In-app real-time synchronization updates open tabs instantly, but background mobile/desktop push notifications for offline users are not yet active.
6. **In-App Payment Gateway**: Settlements are bookkeeping entries ("I paid you"); direct 1-click UPI / Stripe / PayPal bank transfer initiation inside the modal is planned.

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
