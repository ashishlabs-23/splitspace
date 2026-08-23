import { Space, Summary, Member } from "./api";
import { formatMoney } from "./currencies";

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate formatted executive plain text statement suitable for email / messaging
 */
export function generateMemberEmailStatement(
  space: Space,
  summary: Summary | null,
  recipient?: Member | null,
  creatorName = "Ashish N"
): { subject: string; body: string } {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = `[SplitSpace] Expense & Settlement Statement — ${space.title}`;

  let body = `Dear Team,\n\n`;
  body += `Please find below the official expense and settlement statement for the current shared ${space.title} ledger.\n\n`;

  body += `### Expense Summary\n\n`;
  body += `**Ledger:** ${space.title}\n\n`;
  body += `**Reporting Date:** ${dateStr}\n\n`;
  body += `**Managed by:** ${creatorName}\n\n`;

  body += `| **Item** | **Amount** |\n`;
  body += `| ----------------------- | -------------: |\n`;
  body += `| Total Group Expenditure | **${formatMoney(summary?.total_spent || 0, space.currency)}** |\n`;
  body += `| Number of Expenses | ${space.expenses.length} |\n`;
  body += `| Total Participants | ${space.members.length} |\n\n`;

  if (recipient) {
    const memBalance = summary?.member_balances.find((x) => x.member.id === recipient.id);
    const net = memBalance ? memBalance.net_balance : 0;
    body += `### Individual Settlement – ${recipient.name}\n\n`;
    body += `| **Description** | **Amount** |\n`;
    body += `| ----------------------- | ------------: |\n`;
    body += `| Amount Paid | ${formatMoney(memBalance?.total_paid || 0, space.currency)} |\n`;
    body += `| Individual Share | **${formatMoney(memBalance?.total_owed || 0, space.currency)}** |\n`;
    body += `| **${net >= 0 ? "Net Balance Receivable" : "Net Balance Payable"}** | **${formatMoney(Math.abs(net), space.currency)}** |\n\n`;
  }

  body += `### Recommended Settlements\n\n`;
  if (summary?.settlements && summary.settlements.length > 0) {
    summary.settlements.forEach((s) => {
      body += `* **${s.from_member.name} → ${s.to_member.name}:** ${formatMoney(s.amount, space.currency)}\n`;
    });
  } else {
    body += `* All members are completely settled up! No outstanding balances.\n`;
  }
  body += `\n`;

  body += `### Itemized Expenses\n\n`;
  body += `| **Date** | **Category** | **Description** | **Paid By** | **Amount** |\n`;
  body += `| ----------- | ------------ | --------------- | ----------- | ---------: |\n`;
  space.expenses.forEach((e) => {
    const expDate = new Date(e.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const catLabel = e.category.charAt(0).toUpperCase() + e.category.slice(1);
    body += `| ${expDate} | ${catLabel} | ${e.title} | ${e.paid_by.name} | ${formatMoney(e.amount, space.currency)} |\n`;
  });
  body += `\n`;

  body += `Please review the statement and complete the settlement at your earliest convenience.\n\n`;
  body += `Thank you.\n\n`;
  body += `**${creatorName}**\n\n`;
  body += `*Generated via SplitSpace Expense Management System.*`;

  return { subject, body };
}

/**
 * 1-Click Launch Gmail in Browser (Reliable on all machines without desktop mail app)
 */
export function openGmailWeb(
  space: Space,
  summary: Summary | null,
  recipient?: Member | null,
  creatorName = "Ashish N"
) {
  const { subject, body } = generateMemberEmailStatement(space, summary, recipient, creatorName);
  const emailTo = recipient?.email || "";
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailTo)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, "_blank");
}

/**
 * Open native OS desktop mail client (mailto:)
 */
export function sendStatementEmail(
  space: Space,
  summary: Summary | null,
  recipient?: Member | null,
  creatorName = "Ashish N"
) {
  const { subject, body } = generateMemberEmailStatement(space, summary, recipient, creatorName);
  const emailTo = recipient?.email || "";
  const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, "_blank");
}

/**
 * Native Web Share (Mobile & Supported Browsers)
 */
export async function shareStatementWeb(
  space: Space,
  summary: Summary | null,
  recipient?: Member | null,
  creatorName = "Ashish N"
) {
  const { subject, body } = generateMemberEmailStatement(space, summary, recipient, creatorName);
  if (navigator.share) {
    try {
      await navigator.share({
        title: subject,
        text: body,
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Print / Save Corporate-Grade Executive Financial PDF Statement
 */
export function printSpacePdfStatement(space: Space, summary: Summary | null, user?: Member | null) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups in your browser to generate the printable PDF statement.");
    return;
  }

  const creatorName = user?.name || "Ashish N";
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const docRef = `SS-FIN-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const memberRows = space.members
    .map((m, idx) => {
      const b = summary?.member_balances.find((x) => x.member.id === m.id);
      const net = b ? b.net_balance : 0;
      const isPositive = net >= 0;
      const isZero = Math.abs(net) < 0.01;
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      return `
        <tr style="background:${bg}">
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0">
            <strong style="color:#0f172a;font-size:13px;display:block">${escapeHtml(m.name)}</strong>
            <span style="color:#64748b;font-size:11px">${escapeHtml(m.email)}</span>
          </td>
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0">
            <span style="background:#f1f5f9;color:#334155;font-weight:700;padding:3px 8px;border-radius:4px;font-size:10px;letter-spacing:0.04em;text-transform:uppercase">${escapeHtml(m.role)}</span>
          </td>
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155">${formatMoney(b?.total_paid || 0, space.currency)}</td>
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155">${formatMoney(b?.total_owed || 0, space.currency)}</td>
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;font-weight:800;font-size:13px;color:${isZero ? "#64748b" : isPositive ? "#059669" : "#dc2626"}">
            ${isZero ? "SETTLED (0.00)" : `${isPositive ? "+" : ""}${formatMoney(net, space.currency)}`}
          </td>
        </tr>
      `;
    })
    .join("");

  const settlementRows = (summary?.settlements || []).length
    ? (summary?.settlements || [])
        .map(
          (s, idx) => `
        <div style="padding:14px 18px;background:#ffffff;border:1px solid #e2e8f0;border-left:4px solid #0f766e;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 2px rgba(0,0,0,0.03)">
          <div style="display:flex;align-items:center;gap:14px">
            <span style="font-weight:800;color:#64748b;font-size:12px">#${idx + 1}</span>
            <div>
              <span style="font-weight:700;color:#0f172a;font-size:14px">${escapeHtml(s.from_member.name)}</span>
              <span style="color:#64748b;margin:0 8px;font-size:12px">transfers to</span>
              <span style="font-weight:700;color:#0f172a;font-size:14px">${escapeHtml(s.to_member.name)}</span>
            </div>
          </div>
          <div style="font-size:16px;font-weight:800;color:#0f766e;background:#f0fdf4;border:1px solid #bbf7d0;padding:6px 14px;border-radius:8px">
            ${formatMoney(s.amount, space.currency)}
          </div>
        </div>
      `
        )
        .join("")
    : `<div style="padding:18px;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;border-radius:8px;text-align:center;font-weight:700">✦ ALL ACCOUNTS ARE FULLY RECONCILED AND SETTLED. ZERO PENDING BALANCES.</div>`;

  const expenseRows = space.expenses
    .map((e, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      return `
        <tr style="background:${bg}">
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px;white-space:nowrap">${new Date(e.created_at).toLocaleDateString()}</td>
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0">
            <strong style="color:#0f172a;font-size:13px;display:block">${escapeHtml(e.title)}</strong>
            ${e.note ? `<span style="color:#64748b;font-size:11px">${escapeHtml(e.note)}</span>` : ""}
          </td>
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0">
            <span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase">${escapeHtml(e.category)}</span>
          </td>
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155">${escapeHtml(e.paid_by.name)}</td>
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;text-transform:capitalize;font-size:12px">${escapeHtml(e.split_mode || "equal")}</td>
          <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;font-weight:800;text-align:right;color:#0f172a;font-size:13px">${formatMoney(e.amount, space.currency)}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>FINANCIAL STATEMENT — ${escapeHtml(space.title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 48px;
            color: #0f172a;
            line-height: 1.5;
            background: #ffffff;
            font-size: 13px;
          }
          .statement-wrap {
            max-width: 880px;
            margin: 0 auto;
          }
          .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 24px;
            margin-bottom: 28px;
          }
          .brand-col {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .brand-logo {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: #0f172a;
            color: #ffffff;
            font-weight: 900;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            letter-spacing: -0.04em;
          }
          .brand-meta h1 {
            font-size: 24px;
            font-weight: 800;
            margin: 0;
            color: #0f172a;
            letter-spacing: -0.03em;
          }
          .brand-meta p {
            margin: 3px 0 0;
            color: #64748b;
            font-size: 12px;
            font-weight: 500;
          }
          .audit-meta {
            text-align: right;
            font-size: 12px;
            color: #334155;
          }
          .doc-ref-badge {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 6px;
            font-family: monospace;
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }
          .created-pill {
            display: block;
            color: #0f766e;
            font-weight: 700;
            font-size: 11px;
            margin-bottom: 4px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin-bottom: 32px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
          }
          .kpi-card span {
            display: block;
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 6px;
          }
          .kpi-card strong {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
          }
          .section-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 32px 0 14px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 28px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          .action-bar {
            text-align: right;
            margin-bottom: 28px;
          }
          .print-btn {
            background: #0f172a;
            color: #ffffff;
            border: none;
            padding: 11px 22px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
            transition: all 0.2s;
          }
          .print-btn:hover {
            background: #1e293b;
          }
          .formal-footer {
            margin-top: 48px;
            border-top: 2px solid #e2e8f0;
            padding-top: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            color: #64748b;
            font-size: 11px;
          }
          .signature-box {
            text-align: right;
          }
          .sign-line {
            width: 180px;
            height: 1px;
            background: #94a3b8;
            margin: 12px 0 6px auto;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .kpi-card { border: 1px solid #cbd5e1; }
          }
        </style>
      </head>
      <body>
        <div class="statement-wrap">
          <div class="no-print action-bar">
            <button onclick="window.print()" class="print-btn">🖨️ Print / Save Official PDF</button>
          </div>

          <!-- Document Header -->
          <div class="doc-header">
            <div class="brand-col">
              <div class="brand-logo">${escapeHtml(space.emoji)}</div>
              <div class="brand-meta">
                <h1>${escapeHtml(space.title)}</h1>
                <p>Audited Group Financial Statement & Settlement Schedule</p>
              </div>
            </div>
            <div class="audit-meta">
              <div class="doc-ref-badge">${docRef}</div>
              <div class="created-pill">✦ Engineered by ${escapeHtml(creatorName)}</div>
              <div>Issue Date: <strong>${escapeHtml(dateStr)}</strong> (${escapeHtml(timeStr)})</div>
              <div>Base Ledger Currency: <strong>${escapeHtml(space.currency)}</strong></div>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <span>Gross Spend</span>
              <strong>${formatMoney(summary?.total_spent || 0, space.currency)}</strong>
            </div>
            <div class="kpi-card">
              <span>Total Transactions</span>
              <strong>${space.expenses.length}</strong>
            </div>
            <div class="kpi-card">
              <span>Account Holders</span>
              <strong>${space.members.length}</strong>
            </div>
            <div class="kpi-card">
              <span>Reconciled Status</span>
              <strong style="color:#0f766e">${(summary?.settlements || []).length === 0 ? "Settled" : `${summary?.settlements.length} Pending`}</strong>
            </div>
          </div>

          <!-- Suggested Settlement Action Plan -->
          <div class="section-title">
            <span>Actionable Settlement Transfers</span>
            <span style="font-size:11px;color:#64748b;font-weight:500;text-transform:none">Minimised Debt Routing</span>
          </div>
          <div style="margin-bottom: 28px">
            ${settlementRows}
          </div>

          <!-- Member Position Breakdown -->
          <div class="section-title">
            <span>Member Accounting & Balance Matrix</span>
            <span style="font-size:11px;color:#64748b;font-weight:500;text-transform:none">Itemized Net Positions</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Account Holder</th>
                <th>Role</th>
                <th>Total Paid</th>
                <th>Expense Liability</th>
                <th>Net Settlement Position</th>
              </tr>
            </thead>
            <tbody>
              ${memberRows}
            </tbody>
          </table>

          <!-- Expense Audit Ledger -->
          <div class="section-title">
            <span>Transaction Audit Ledger</span>
            <span style="font-size:11px;color:#64748b;font-weight:500;text-transform:none">${space.expenses.length} Verified Entries</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Transaction Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Paid By</th>
                <th>Allocation Mode</th>
                <th style="text-align:right">Amount (${escapeHtml(space.currency)})</th>
              </tr>
            </thead>
            <tbody>
              ${expenseRows.length ? expenseRows : '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:18px">No recorded expenses found in this ledger.</td></tr>'}
            </tbody>
          </table>

          <!-- Corporate Legal Footer -->
          <div class="formal-footer">
            <div>
              <div style="font-weight:700;color:#0f172a">SplitSpace Financial Systems</div>
              <div>Confidential & Privileged Group Ledger Statement</div>
              <div style="margin-top:4px">Contribution & Engineering by <strong>${escapeHtml(creatorName)}</strong></div>
            </div>
            <div class="signature-box">
              <div>Authorized Ledger Representative:</div>
              <div class="sign-line"></div>
              <div style="font-weight:700;color:#0f172a">${escapeHtml(creatorName)}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
