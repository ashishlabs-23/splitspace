# Architecture notes

## Client

The Next.js client keeps a small local UI state and delegates server state to typed API helpers. The screen intentionally centers around one active space at a time.

## Server

FastAPI exposes clear resource boundaries:
- `/auth/*`
- `/spaces`
- `/spaces/{space_id}/members`
- `/spaces/{space_id}/expenses`
- `/spaces/{space_id}/summary`
- `/spaces/{space_id}/invite`

The summary endpoint performs debt simplification using a greedy creditor/debtor matching pass. Expense splits are persisted as individual ledger rows, which prevents the frontend from becoming the accounting source of truth.

## Security

- Passwords are hashed with Argon2 through `pwdlib`.
- API routes require JWT bearer authentication.
- Space membership is checked server-side on resource requests.
- Expense split totals are validated server-side.
- Secrets are environment variables.

## Usability

Advanced accounting features are deliberately hidden behind an explicit `Custom` split choice. The common path stays extremely short.
