# SplitSpace Engineering & Feature Roadmap (`todo.md`)
*Systematic Task Breakdown based on PRD, Design Document & Tech Rules*

---

## Progress Overview
- [x] **Phase 1: Project Blueprint & Foundation** (Completed)
- [x] **Phase 2: Mathematical Engine & Debt Graph Simplification** (Completed)
- [x] **Phase 3: Multi-Currency & Instant Settlement Gateways** (Completed)
- [x] **Phase 4: Multi-Tenant Cloud Security & Payload Sanitization** (Completed)
- [x] **Phase 5: Real-Time Firestore Synchronization & Concurrency** (Completed)
- [x] **Phase 6: Front-End Spacing, Padding & Mobile Polish** (Completed)
- [x] **Phase 7: CodeRabbit & GitHub Actions CI/CD Integration** (Completed)
- [x] **Phase 8: Advanced Capabilities & Feature Freeze** (Completed)

---

## Detailed Task Breakdown

### Phase 1: Project Blueprint & Foundation
- [x] Define Product Requirement Document (`docs/prd.md`) with personas, functional specs, and non-functional requirements.
- [x] Establish Design System Document (`docs/design.md`) detailing color tokens, typography, spacing/padding scale, and responsive breakpoints.
- [x] Formulate Tech Rules & Stack Specification (`docs/tech-rules.md`) defining architectural conventions and coding standards.
- [x] Initialize Git repository with semantic branch protection and clean `.gitignore`.
- [x] Configure Next.js 15 App Router, TypeScript 5, Tailwind CSS, and Motion/React.

### Phase 2: Mathematical Engine & Debt Simplification
- [x] Implement integer-cent arithmetic engine avoiding IEEE 754 floating-point drift.
- [x] Implement greedy bipartite debt minimization algorithm ($O(V)$ bank transfers).
- [x] Add prime divisor remainder cascade (distributing unallocated pennies sequentially across odd member counts).
- [x] Support 4 split modes: Equal, Exact, Percentage (with 100% parity check), and Weighted Shares.
- [x] Add automated test harness (`scripts/test-engine.mjs`) covering 10 mathematical edge cases.

### Phase 3: Multi-Currency & Instant Settlement Gateways
- [x] Support 10 major world currencies (INR, USD, EUR, GBP, AED, SGD, JPY, AUD, CAD, THB).
- [x] Implement live market exchange rates caching (`open.er-api.com`) with 10-minute TTL.
- [x] Build non-destructive **Multi-Currency Spend Lens** for on-the-fly dashboard conversion.
- [x] Implement 1-click native UPI deep linking (`upi://pay`) for Google Pay, PhonePe, and Paytm.
- [x] Implement PayPal.me international payment routing.
- [x] Build printable corporate-grade executive PDF statement generator (`export.ts`).

### Phase 4: Multi-Tenant Cloud Security & Payload Sanitization
- [x] Deploy hardened Cloud Firestore Security Rules (`firestore.rules`).
- [x] Restrict space subcollections to verified space members (`isSpaceMember`).
- [x] Prevent settlement forgery by enforcing `created_by_uid == request.auth.uid`.
- [x] Prevent activity audit trail actor spoofing (`actor_id == request.auth.uid`).
- [x] Sanitize CSV exports against DDE formula injection attacks (`sanitizeCsvField`).
- [x] Escape Markdown pipe delimiters (`\|`) in email ledger exports.

### Phase 5: Real-Time Sync & Concurrency
- [x] Implement real-time Firestore listeners (`onSnapshot`) for spaces, expenses, and activity.
- [x] Wrap invite token redemption (`joinInvite`) in atomic `runTransaction` to prevent lost updates under concurrent joins.
- [x] Enable offline detection banner with automatic reconnect listeners.
- [x] Flush in-memory session variables on logout to prevent state leakage.

### Phase 6: Front-End Spacing, Padding & Mobile Polish
- [x] Add mobile sidebar backdrop overlay to allow 1-click backdrop dismissal on touch devices.
- [x] Refine responsive modal padding on small viewports (320px–375px) to prevent cramped form inputs.
- [x] Adjust `.top-actions` button layout on mobile so primary "Add expense" CTA takes full prominent width.
- [x] Ensure expense list item titles and category badges wrap cleanly without truncating on narrow screens.
- [x] Verify horizontal scroll containment (`overflow-x: hidden`) across all viewports.
- [x] Decouple brand navigation and mobile close buttons with dedicated touch target padding and smooth alignment.

### Phase 7: CodeRabbit & GitHub Actions CI/CD Integration
- [x] Create `.coderabbit.yaml` with financial precision rules, Firestore guidelines, and automated PR review instructions.
- [x] Configure CI workflow (`docs/ci-workflow.yml`) running linting, build checks, and `node scripts/test-engine.mjs`.
- [x] Run full build verification and deployment to Firebase Hosting.

### Phase 8: Advanced Capabilities & Project Freeze
- [x] Multi-payer split expenses (allowing multiple people to co-pay a single transaction with live allocation validation).
- [x] Push notifications via Firebase Cloud Messaging (FCM Web Push SW, foreground toasts, device token registration).
- [ ] Receipt OCR & bill photo scanning via Gemini Vision / Firebase Storage (Deferred per user instruction).
