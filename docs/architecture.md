# Architecture Notes

## Client (Next.js 16 + React 19)

The Next.js client uses Turbopack, Tailwind CSS, Framer Motion, and client-side App Router structure. State centers around the currently active space, with real-time Firestore listeners keeping members in sync.

## Cloud Firestore Database & Security Rules

SplitSpace operates serverless on Google Cloud Firestore:
- `/spaces/{space_id}`: Primary space metadata and membership lists (`memberUids`, `memberEmails`, `members`).
- `/spaces/{space_id}/expenses/{expense_id}`: Granular expense records with immutable split allocations.
- `/spaces/{space_id}/settlements/{settlement_id}`: Direct peer-to-peer settlement transaction records.
- `/invites/{token}`: Shareable invite records with time-to-live expirations.

Granular Firestore Security Rules enforce access boundaries:
- Only verified space members can read/write expenses and settlements.
- Base space fields (creator, creation timestamp) cannot be tampered with.
- Members cannot delete spaces unless they are the space owner.

## Debt Engine & Simplification

The accounting engine performs an exact integer-cent debt minimization pass:
1. Calculates net balance per participant using immutable expense split entries.
2. Segregates participants into creditors (net positive balance) and debtors (net negative balance).
3. Executes a greedy transitive debt matching algorithm to collapse circular liabilities into minimal direct transactions.

## Multi-Currency Spend Lens

Expenses support multi-currency logging with live conversion to the space's base currency, cached with 10-minute TTLs. Real-time conversion preserves both original expenditure and normalized group accounting.
