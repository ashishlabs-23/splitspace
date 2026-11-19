# SplitSpace Engineering Standards & Tech Rules

> **Version:** 2.0.0  
> **Status:** Active / Mandatory  
> **Target Audience:** All Software Engineers, AI Coding Agents, and Reviewers  

---

## 1. Executive Architecture Overview

SplitSpace is a high-performance, real-time group expense splitting and debt-minimization platform. It operates serverless on **Firebase Firestore & Authentication** with a client-first static export built on **Next.js App Router (15+)**, **React 19**, **TypeScript 5**, and **Tailwind CSS**.

The foundational engineering mandate of SplitSpace is **mathematical conservation of money**, **zero-drift ledger integrity**, and **strict multi-tenant data isolation**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 15+ Client App                          │
│  (React 19 • Tailwind CSS • Motion/React • Static Export • PWA Ready)  │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
         Firestore Snapshot Listeners          Firebase Auth
         (Real-time State Synchronization)     (Email/Password & Google)
                   │                                 │
                   ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Google Cloud Firestore                          │
│   /spaces/{spaceId}                                                    │
│     ├── /expenses/{expenseId}   (Double-Entry Integer Cent Splits)     │
│     ├── /settlements/{id}       (Bilateral Debt Settlement Records)    │
│     └── /activity/{activityId}  (Immutable Audit Stream)               │
│   /invites/{token}              (Time-to-Live Membership Tokens)       │
│   /users/{userId}               (User Profiles & Verified Identity)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack Definition & System Boundaries

| Layer | Technology | Version | Purpose & Constraints |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js App Router | `^15.x` / `16.x` | Static export (`output: "export"`) served via Firebase Hosting rewrites (`** -> /index.html`). |
| **UI Runtime** | React & React DOM | `^19.x` | Modern component architecture, `"use client"` for interactive stateful views, React 19 hooks. |
| **Language** | TypeScript | `^5.x` | Strict typing (`strict: true`). Zero `any` in core financial calculation engines. |
| **Styling** | Tailwind CSS & PostCSS | `^4.x` | Utility-first responsive design tokens, dark/light theme variables, tw-animate. |
| **Animation** | Motion (`motion/react`) | `^13.x` | Fluid layout transitions, spring physics, dynamic modals, and bento cards. |
| **Database & Auth** | Firebase JS SDK | `^12.x` | Cloud Firestore real-time listeners (`onSnapshot`), Firebase Authentication, batch writes. |
| **Validation** | Zod | `^4.x` | Runtime schema validation for forms, CSV imports, and API boundaries. |
| **Hosting** | Firebase Hosting | v2 | Global CDN edge caching with single-page app fallback rewrite rule. |
| **Test Runner** | Node.js Native Runner | `node:test` | Zero-dependency pure mathematical engine verification (`node scripts/test-engine.mjs`). |

---

## 3. Directory Organization & Codebase Conventions

The workspace is organized into explicit boundaries:

```
splitspaces/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI (Engine Tests, Linting, Build)
├── docs/
│   ├── architecture.md          # Architectural blueprints and diagrams
│   ├── design.md                # Design System & UI specifications
│   ├── prd.md                   # Product Requirement Document
│   └── tech-rules.md            # This document: Engineering rules and guidelines
├── firebase.json                # Hosting targets and Firestore rules mapping
├── firestore.rules              # Cloud Firestore security rules
├── frontend/
│   ├── next.config.ts           # Next.js configuration (static export, unoptimized images)
│   ├── package.json             # Frontend dependency manifest
│   ├── tsconfig.json            # Strict TypeScript configuration
│   └── src/
│       ├── app/                 # Next.js App Router root
│       │   ├── globals.css      # Design tokens, theme CSS variables, reset
│       │   ├── layout.tsx       # Root layout, font loader, meta viewport
│       │   └── page.tsx         # Root dynamic router (Landing vs. Active Space)
│       ├── components/
│       │   ├── auth/            # Auth modal, EmailVerification, UsernameSetup
│       │   ├── expenses/        # ExpenseRow, EmptyExpense, split indicators
│       │   ├── landing/         # Marketing landing page, FAQ, hero showcase
│       │   ├── modals/          # ExpenseModal, SettleUpModal, ActivityModal, ExportModal
│       │   ├── smoothui/        # Custom animated primitives (magnetic button, bento)
│       │   ├── spaces/          # SpaceHeader, SpaceSidebar, SpaceStats, SettlementList
│       │   └── ui/              # Base UI primitives (buttons, dialogs, avatars)
│       └── lib/
│           ├── api.ts           # Core domain TypeScript models and interfaces
│           ├── categories.ts    # Expense category taxonomies and metadata
│           ├── currencies.ts    # ISO currency definitions and exchange formatting
│           ├── export.ts        # CSV/PDF/Markdown export with formula injection defense
│           ├── firebase.ts      # Firebase app initialization & auth configuration
│           ├── firestore-db.ts  # Database operations, real-time sync & balance engine
│           ├── useAuth.ts       # React Auth context hook
│           └── validation.ts    # Zod schemas for user input and transactions
└── scripts/
    ├── test-engine.mjs          # Native test suite for ledger & debt simplification
    ├── verify-rules.js          # Pre-deployment validation for firestore.rules
    └── deploy-hosting.js        # Automated deployment harness for Firebase Hosting
```

### Component Guidelines
- **Client Directives:** Any component utilizing React hooks (`useState`, `useEffect`, `useCallback`) or browser APIs must include the `"use client";` directive at line 1.
- **Micro-Animations:** Use `motion/react` (e.g. `import { motion, AnimatePresence } from "motion/react"`). Prefer standard spring configurations over linear durations for physical feel.
- **No Direct Firebase Leaks in UI:** UI components must call the abstracted methods in `lib/firestore-db.ts` or custom hooks; never call raw `getDoc` or `setDoc` inside presentation components.

---

## 4. Algorithmic Invariants & State Management

SplitSpace processes financial transactions. Financial software cannot tolerate rounding drift, circular debt cycles, or phantom pennies.

### 4.1 The Integer Cent Invariant (No Floating-Point Money)
*Never* perform arithmetic calculations on currency floats (`0.1 + 0.2 !== 0.3`).
1. **Input Conversion:** As soon as an amount enters the system from user input, it must be normalized:
   ```typescript
   const expenseCents = Math.round(Number(amount) * 100);
   ```
2. **Internal Calculations:** All totals, member shares, settlements, and net balances must be calculated, accumulated, and compared exclusively in **integer cents**.
3. **Display Formatting:** Only convert back to fractional currency when formatting for UI rendering or file export:
   ```typescript
   const displayAmount = (cents / 100).toFixed(2);
   ```

### 4.2 Zero Unallocated Pennies (Deterministic Remainder Distribution)
When splitting $E$ cents among $N$ participants where $E \pmod N \neq 0$, division produces unallocated pennies.
- **Rule:** Every penny must be allocated. Dropping or floating fractional cents is strictly prohibited.
- **Deterministic Modulus Algorithm:**
  ```typescript
  const baseCents = Math.floor(expenseCents / count);
  const remainderCents = expenseCents % count;

  members.forEach((m, idx) => {
    // Deterministically assign +1 cent to the first remainderCents participants
    const shareCents = baseCents + (idx < remainderCents ? 1 : 0);
    memberTotals[m.id].total_owed_cents += shareCents;
  });
  ```
- **Sum Conservation Check:**  
  $$\sum_{i=1}^{N} \text{shareCents}_i = \text{expenseCents} \quad (\text{Identical to within } 0\text{ cents})$$

### 4.3 Conservation of Money (Double-Entry Balance Equilibrium)
Across any space at any moment:
$$\sum_{m \in \text{Members}} \text{net\_balance}_m = 0$$
- If member $A$ paid 3000 cents for $A, B, C$, then:
  - $A$: $+2000$ cents
  - $B$: $-1000$ cents
  - $C$: $-1000$ cents
  - Sum: $+2000 - 1000 - 1000 = 0$.
- Any non-zero sum indicates an algorithmic defect and must throw an error in verification tests.

### 4.4 Transitive Debt Simplification (Greedy Minimization)
To avoid unnecessary bank transfers, circular debts must be collapsed:
1. Divide participants into **Debtors** (net balance $< 0$) and **Creditors** (net balance $> 0$).
2. Order or match iteratively:
   ```typescript
   while (dIdx < debtors.length && cIdx < creditors.length) {
     const settleCents = Math.min(debtor.balanceCents, creditor.balanceCents);
     instructions.push({
       from_member: debtor.member,
       to_member: creditor.member,
       amount: settleCents / 100
     });
     debtor.balanceCents -= settleCents;
     creditor.balanceCents -= settleCents;
     if (debtor.balanceCents <= 0) dIdx++;
     if (creditor.balanceCents <= 0) cIdx++;
   }
   ```
3. A cycle of $A \to B \to C \to A$ must collapse to **0 transactions**.

### 4.5 Historical Balance & Departed Member Resilience
- If a member leaves or is omitted from the space's current member list, historical expenses involving them must **not** orphan funds.
- The engine must fall back to a retained record (`Former Member`) preserving historical double-entry balance equilibrium.

### 4.6 Real-Time State Synchronization (`onSnapshot`)
- Active space views subscribe to live Firestore snapshots for expenses, settlements, and member lists.
- Subscriptions must clean up automatically on unmount:
  ```typescript
  useEffect(() => {
    const unsubscribe = onSnapshot(queryRef, (snapshot) => {
      // Update local state deterministically
    });
    return () => unsubscribe();
  }, [spaceId]);
  ```

---

## 5. Security Rules Standards & Defense-in-Depth

All Firestore interactions are governed by `firestore.rules`. No client code is trusted.

### 5.1 Multi-Tenant Space Isolation
- Space subcollections (`expenses`, `settlements`, `activity`) are guarded by `isSpaceMember(spaceId)`:
  ```javascript
  function isSpaceMember(spaceId) {
    return isSignedIn() && request.auth.uid in spaceDoc(spaceId).data.memberUids;
  }
  ```
- Unauthenticated users cannot read or write any space data.
- Non-members receive immediate permission-denied responses from Firestore engine.

### 5.2 Immutable Fields & Verified Creator Checks
- **Base Space Fields:** Space creator `createdBy`, creation timestamp `createdAt`, and `id` can never be modified:
  ```javascript
  function baseSpaceFieldsUnchanged() {
    return (!resource.data.keys().hasAny(['id']) || request.resource.data.id == resource.data.id)
      && request.resource.data.createdBy == resource.data.createdBy
      && (!resource.data.keys().hasAny(['createdAt']) || request.resource.data.createdAt == resource.data.createdAt);
  }
  ```
- **Expense Modification:** Only the original creator (`created_by_uid == request.auth.uid`) or the Space Owner can edit or delete an expense.
- **Settlement Immutability:** Settlements can be created or deleted, but never modified in-place (`allow update: if false;`). This ensures an immutable audit trail.
- **Payload Whitelist:** All writes are restricted using `keys().hasOnly([...])` to prevent property injection attacks.

### 5.3 Export Sanitization (CSV / Formula Injection Defense)
Exported financial files are susceptible to **CSV Formula Injection / Dynamic Data Exchange (DDE)** attacks when opened in Microsoft Excel or Google Sheets.
- **Rule:** Any user-controllable string (title, note, member name, category) starting with dangerous formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) must be escaped with a single quote inside quotes:
  ```typescript
  export function sanitizeCsvField(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '""';
    const str = String(value).trim();
    if (/^[=\+\-@\t\r]/.test(str)) {
      return `"'${str.replace(/"/g, '""')}"`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  }
  ```
- **Markdown Tables:** Pipe characters (`|`) and line breaks must be sanitized with `sanitizeMarkdownCell()` to prevent column escaping.

---

## 6. Git Workflow, Branching & Conventional Commits

### 6.1 Branching Strategy
- **`main`**: Production trunk. Always deployable. Protected branch: direct pushes are forbidden.
- **Feature Branches**: Branch from `main` using structured naming:
  - `feat/<short-description>` (e.g., `feat/recurring-split-presets`)
  - `fix/<short-description>` (e.g., `fix/modulus-remainder-drift`)
  - `chore/<short-description>` (e.g., `chore/bump-firebase-sdk`)
  - `docs/<short-description>` (e.g., `docs/update-architecture`)
- **Pull Requests (PRs):** Must pass GitHub Actions CI checks and receive automated CodeRabbit sign-off prior to merging.

### 6.2 Semantic Conventional Commits
All commit messages must adhere to the Conventional Commits 1.0 specification:
```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

**Permitted Types:**
- `feat`: A new user-facing capability or API feature.
- `fix`: A bug fix or financial algorithm correction.
- `docs`: Documentation additions or revisions (`tech-rules.md`, `README.md`).
- `test`: Adding or refactoring unit tests (`scripts/test-engine.mjs`).
- `refactor`: Code changes that neither fix a bug nor add a feature.
- `perf`: Code changes that improve client render performance or Firestore query efficiency.
- `chore`: Tooling, dependency, or configuration updates.

**Examples:**
```bash
git commit -m "fix(engine): allocate remainder cents deterministically across odd member counts"
git commit -m "feat(export): add RFC 4180 CSV export with formula injection sanitization"
git commit -m "test(engine): add 5-node asymmetric graph circular debt test case"
```

---

## 7. Pre-Flight Quality Checklist ("Vibe Coding" Definition of Done)

Before submitting or approving any pull request:
1. [ ] **Integer Math Verified:** Are all currency calculations executed in integer cents?
2. [ ] **Zero Float Direct Math:** Is there zero IEEE 754 float arithmetic (`0.1 * 0.2`) on balances?
3. [ ] **Test Engine Passes:** Does `node scripts/test-engine.mjs` pass all tests with 0 failures?
4. [ ] **TypeScript Clean:** Does `npx tsc --noEmit` complete without errors?
5. [ ] **Rules Compliant:** Do payload writes obey `firestore.rules` whitelists and authorization?
6. [ ] **Formula Escaped:** Are all user-controlled strings in CSV/Markdown exports sanitized?
7. [ ] **Subscriptions Cleaned:** Do all React components unsubscribe from `onSnapshot` listeners on unmount?
