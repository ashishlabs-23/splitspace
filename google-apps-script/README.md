# SplitSpace — Google Apps Script (Google Sheets Database) Setup Guide

This guide walks you through setting up a Google Spreadsheet as your free, serverless database and deploying the Google Apps Script Web App for SplitSpace.

---

## 1. Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.new) (or open Google Drive and create a new blank spreadsheet).
2. Rename the spreadsheet to **SplitSpace Database**.

---

## 2. Open the Apps Script Editor & Paste Code

1. In your Google Sheet, click on the top menu: **Extensions > Apps Script**.
2. A new tab will open with the script editor.
3. Rename the project at top left from *Untitled project* to **SplitSpace API**.
4. Delete any existing code inside `Code.gs` and copy-paste the entire contents of [`Code.gs`](./Code.gs).
5. Click **Save** (💾 icon or `Ctrl + S` / `Cmd + S`).

---

## 3. Set the API Secret (Script Property)

To secure your Google Apps Script database from unauthorized public calls:
1. In the Apps Script left sidebar, click the ⚙️ **Project Settings** icon.
2. Scroll down to **Script Properties** and click **Add script property**.
3. Set:
   - **Property**: `GAS_SECRET`
   - **Value**: (copy the `GAS_SECRET` from your `frontend/.env.local`, e.g. `splitspace_sec_98f4a1c7b82e4e18b85b292e071`)
4. Click **Save script properties**.

---

## 4. Deploy as a Web App

1. In the Apps Script editor, click the blue **Deploy** button in the top right.
2. Select **New deployment** (or **Manage deployments** > Edit if updating).
3. Click the gear icon next to "Select type" and choose **Web app**.
4. Configure the deployment settings:
   - **Description**: `SplitSpace Hardened API v2`
   - **Execute as**: **Me (`your-email@gmail.com`)**
   - **Who has access**: **Anyone** *(Enables your Next.js server to communicate with the database)*
5. Click **Deploy**.
6. When prompted, click **Authorize access**, select your Google account, click **Advanced**, and then click **Go to SplitSpace API (unsafe)**, and **Allow**.
7. Copy the generated **Web App URL**. It will look like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## 5. Add the URL and Secret to SplitSpace Frontend

In your `frontend/.env.local` file (private, server-side only):

```env
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GAS_SECRET=splitspace_sec_98f4a1c7b82e4e18b85b292e071
```

---

## 6. Troubleshooting & Permissions

### Fix: "You need access" / Authorization Prompt
If requests return a Google login or "You need access" page:
1. In the Apps Script editor, click **Deploy > Manage deployments**.
2. Click the ✏️ **Edit** icon on the active deployment.
3. Under **Who has access**, make sure **Anyone** is selected (NOT *Only myself* or your workspace domain).
4. Under Version, select **New version** and click **Deploy**.

---

## 7. Security Architecture & Controls

| Security Control | Implementation |
| :--- | :--- |
| **Mutual API Authentication** | Validates `apiKey === GAS_SECRET` on every request. |
| **Object-Level Authorization (IDOR)** | Enforces `requireMember(spaceId, userId, userEmail)` before any read/write. |
| **Role-Based Access Control (RBAC)** | Deleting spaces requires `owner` role; editing/deleting expenses requires `owner` or expense creator. |
| **Formula & CSV Injection Sanitization** | User inputs starting with `=`, `+`, `-`, `@`, `\t`, `\r` are sanitized with leading single-quote `'`. |
| **Private Data Isolation** | `getSpaces` returns only spaces the authenticated user belongs to (no global database leaks). |
| **Concurrency Protection** | Uses Google Apps Script `LockService.getScriptLock()` to serialize writes and prevent race conditions. |
| **Sanitized Error Responses** | Internal stack traces and spreadsheet metadata are never returned to clients. |
