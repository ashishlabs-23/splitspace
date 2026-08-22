/**
 * SplitSpace — Hardened Google Apps Script Backend & Database
 * 
 * Security Features:
 * - Shared Secret validation via Script Properties (GAS_SECRET)
 * - Object-Level Access Control (requireMember verification on every space operation)
 * - Role-Based Access Control (RBAC: owner-only space deletion, owner/payer expense edit/delete)
 * - Formula & CSV Injection protection (sanitizeForSheet)
 * - Sanitized JSON error output (no internal stack trace leakage)
 * - Private space retrieval (no global database leakage)
 * 
 * Instructions:
 * 1. Open your Google Sheet > Extensions > Apps Script.
 * 2. Replace all content in Code.gs with this file.
 * 3. Go to Project Settings (gear icon) > Script Properties > Add property:
 *    - Property: GAS_SECRET
 *    - Value: (the same secret from your frontend .env.local)
 * 4. Click 'Deploy' > 'Manage deployments' > Edit > Version: New version > Deploy.
 */

// ==========================================
// CONFIGURATION & SCHEMAS
// ==========================================
const SHEETS = {
  USERS: "Users",
  SPACES: "Spaces",
  MEMBERS: "Members",
  EXPENSES: "Expenses",
  SPLITS: "Splits",
  SETTLEMENTS: "Settlements",
  INVITES: "Invites",
  ACTIVITIES: "Activities"
};

const SCHEMAS = {
  [SHEETS.USERS]: ["id", "email", "name", "avatar", "created_at"],
  [SHEETS.SPACES]: ["id", "title", "emoji", "period", "currency", "created_by", "created_at"],
  [SHEETS.MEMBERS]: ["id", "space_id", "user_id", "name", "email", "role", "created_at"],
  [SHEETS.EXPENSES]: ["id", "space_id", "title", "amount", "currency", "original_amount", "original_currency", "exchange_rate", "paid_by_member_id", "category", "note", "split_mode", "created_at"],
  [SHEETS.SPLITS]: ["id", "expense_id", "member_id", "amount", "split_mode", "split_value", "created_at"],
  [SHEETS.SETTLEMENTS]: ["id", "space_id", "from_member_id", "to_member_id", "amount", "currency", "note", "created_at"],
  [SHEETS.INVITES]: ["token", "space_id", "expires_at", "created_at"],
  [SHEETS.ACTIVITIES]: ["id", "space_id", "message", "created_at"]
};

// ==========================================
// SECURITY & SANITIZATION HELPERS
// ==========================================

function getExpectedSecret() {
  return PropertiesService.getScriptProperties().getProperty("GAS_SECRET") || "";
}

function verifyApiSecret(apiKey) {
  const expected = getExpectedSecret();
  if (!expected) {
    // If no secret configured yet in Script Properties, allow for initial deployment
    return true;
  }
  return apiKey === expected;
}

/**
 * Prevents CSV / Spreadsheet Formula Injection
 * Prepends a single quote if string begins with =, +, -, @, Tab, or Carriage Return
 */
function sanitizeForSheet(val) {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return trimmed;
}

function sanitizeRecord(sheetName, record) {
  const sanitized = {};
  Object.keys(record).forEach(k => {
    sanitized[k] = sanitizeForSheet(record[k]);
  });
  return sanitized;
}

// ==========================================
// REQUEST ROUTING (doGet & doPost)
// ==========================================

function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    initDatabase();

    const params = e && e.parameter ? e.parameter : {};
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        body = {};
      }
    }

    const payload = Object.assign({}, params, body);
    const action = payload.action || "health";
    const apiKey = payload.apiKey || params.apiKey || "";

    // 1. Mutual API Secret Verification
    if (!verifyApiSecret(apiKey)) {
      return jsonResponse({ ok: false, error: "Unauthorized: Invalid or missing API secret" }, 401);
    }

    const userId = payload.userId || "";
    const userEmail = (payload.userEmail || "").toLowerCase().trim();
    const userName = payload.userName || "";

    let result;
    switch (action) {
      case "health":
        result = { ok: true, version: "2.2.0-hardened", timestamp: new Date().toISOString() };
        break;

      // User Synchronization
      case "syncUser":
        result = syncUser({ id: userId, email: userEmail, name: userName, avatar: payload.avatar });
        break;

      // Spaces
      case "getSpaces":
        result = getSpaces(userId, userEmail);
        break;

      case "getSpace":
        result = getSpaceSecured(payload.spaceId || payload.id, userId, userEmail);
        break;

      case "createSpace":
        result = createSpaceSecured(payload, userId, userEmail, userName);
        break;

      case "deleteSpace":
        result = deleteSpaceSecured(payload.spaceId || payload.id, userId, userEmail);
        break;

      case "leaveSpace":
        result = leaveSpace(payload.spaceId, userId, userEmail);
        break;

      case "addMember":
        result = addMemberSecured(payload.spaceId, payload, userId, userEmail);
        break;

      case "getSummary":
        result = getSummarySecured(payload.spaceId, userId, userEmail);
        break;

      // Expenses
      case "createExpense":
        result = createExpenseSecured(payload.spaceId, payload, userId, userEmail);
        break;

      case "updateExpense":
        result = updateExpenseSecured(payload.spaceId, payload.expenseId || payload.id, payload, userId, userEmail);
        break;

      case "deleteExpense":
        result = deleteExpenseSecured(payload.spaceId, payload.expenseId || payload.id, userId, userEmail);
        break;

      // Settlements (Direct Payments)
      case "getSettlements":
        result = getSettlementsSecured(payload.spaceId, userId, userEmail);
        break;

      case "createSettlement":
        result = createSettlementSecured(payload.spaceId, payload, userId, userEmail);
        break;

      case "deleteSettlement":
        result = deleteSettlementSecured(payload.spaceId, payload.settlementId || payload.id, userId, userEmail);
        break;

      // Invites
      case "createInvite":
        result = createInviteSecured(payload.spaceId, userId, userEmail);
        break;

      case "getInviteInfo":
        result = getInviteInfo(payload.token);
        break;

      case "joinInvite":
        result = joinInvite(payload.token, userId, userName, userEmail);
        break;

      // Export CSV
      case "exportCsv":
        result = exportCsvSecured(payload.spaceId, userId, userEmail);
        break;

      default:
        result = { ok: false, error: `Unknown action: ${action}` };
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("SplitSpace API Error: " + error.toString() + (error.stack ? "\n" + error.stack : ""));
    // Sanitized error response - no internal stack traces leaked
    return jsonResponse({ ok: false, error: error.message || "An unexpected server error occurred" });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// DATABASE ACCESS & ROW OPERATIONS
// ==========================================

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = SCHEMAS[name];
    if (headers) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function getTableData(sheetName) {
  const sheet = getOrSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[1]) continue;
    const obj = { _rowIndex: i + 1 };
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    rows.push(obj);
  }
  return rows;
}

function insertRow(sheetName, record) {
  const sheet = getOrSheet(sheetName);
  const headers = SCHEMAS[sheetName];
  const sanitized = sanitizeRecord(sheetName, record);
  const row = headers.map(h => sanitized[h] !== undefined ? sanitized[h] : "");
  sheet.appendRow(row);
  return sanitized;
}

function updateRowByField(sheetName, field, value, updates) {
  const sheet = getOrSheet(sheetName);
  const rows = getTableData(sheetName);
  const match = rows.find(r => String(r[field]) === String(value));
  if (!match) return null;

  const headers = SCHEMAS[sheetName];
  const sanitized = sanitizeRecord(sheetName, updates);
  const rowIndex = match._rowIndex;
  headers.forEach((h, colIdx) => {
    if (sanitized[h] !== undefined) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(sanitized[h]);
    }
  });
  return Object.assign({}, match, sanitized);
}

function deleteRowsByField(sheetName, field, value) {
  const sheet = getOrSheet(sheetName);
  const rows = getTableData(sheetName);
  const toDelete = rows.filter(r => String(r[field]) === String(value)).reverse();
  toDelete.forEach(r => {
    sheet.deleteRow(r._rowIndex);
  });
  return toDelete.length;
}

function generateId() {
  return Utilities.getUuid();
}

function nowIso() {
  return new Date().toISOString();
}

// ==========================================
// AUTHORIZATION HELPERS (IDOR & RBAC)
// ==========================================

function findMember(spaceId, userId, userEmail) {
  const allMembers = getTableData(SHEETS.MEMBERS).filter(m => m.space_id === spaceId);
  return allMembers.find(m =>
    (userId && m.user_id && String(m.user_id) === String(userId)) ||
    (userEmail && m.email && m.email.toLowerCase() === String(userEmail).toLowerCase())
  );
}

function requireMember(spaceId, userId, userEmail) {
  if (!spaceId) throw new Error("Space ID is required");
  if (!userId && !userEmail) throw new Error("Unauthorized: User credentials required");

  const member = findMember(spaceId, userId, userEmail);
  if (!member) {
    throw new Error("Forbidden: You are not a member of this space");
  }
  return member;
}

function requireOwner(spaceId, userId, userEmail) {
  const member = requireMember(spaceId, userId, userEmail);
  if (member.role !== "owner") {
    throw new Error("Forbidden: Only the space owner can perform this action");
  }
  return member;
}

// ==========================================
// INITIALIZATION & SEEDING
// ==========================================

function initDatabase() {
  Object.keys(SCHEMAS).forEach(sheetName => {
    getOrSheet(sheetName);
  });
  const spaces = getTableData(SHEETS.SPACES);
  if (spaces.length === 0) {
    seedDemoData();
  }
}

function seedDemoData() {
  const demoUserId = "demo-user-ashish";
  insertRow(SHEETS.USERS, {
    id: demoUserId,
    email: "demo@splitspace.local",
    name: "Ashish",
    avatar: "",
    created_at: nowIso()
  });

  const spaceId = generateId();
  insertRow(SHEETS.SPACES, {
    id: spaceId,
    title: "Goa Weekend",
    emoji: "🌴",
    period: "18–20 Aug 2026",
    currency: "INR",
    created_by: demoUserId,
    created_at: nowIso()
  });

  const memberData = [
    { name: "Ashish", email: "demo@splitspace.local", role: "owner", user_id: demoUserId },
    { name: "Yatin", email: "yatin@example.com", role: "member", user_id: "" },
    { name: "Rohan", email: "rohan@example.com", role: "member", user_id: "" },
    { name: "Neha", email: "neha@example.com", role: "member", user_id: "" },
  ];

  const members = memberData.map(m => {
    const mem = {
      id: generateId(),
      space_id: spaceId,
      user_id: m.user_id,
      name: m.name,
      email: m.email,
      role: m.role,
      created_at: nowIso()
    };
    insertRow(SHEETS.MEMBERS, mem);
    return mem;
  });

  const seedExpenses = [
    { title: "Villa booking", amount: 8800, cat: "accommodation", payerIdx: 0, note: "2 nights booking" },
    { title: "Airport cabs", amount: 1460, cat: "transport", payerIdx: 3, note: "Both ways" },
    { title: "Dinner — Day 1", amount: 2240, cat: "food", payerIdx: 1, note: "Beach shack dinner" },
    { title: "Scooter rental", amount: 2100, cat: "transport", payerIdx: 2, note: "2 scooters for 2 days" }
  ];

  seedExpenses.forEach(se => {
    const expId = generateId();
    insertRow(SHEETS.EXPENSES, {
      id: expId,
      space_id: spaceId,
      title: se.title,
      amount: se.amount,
      currency: "INR",
      original_amount: se.amount,
      original_currency: "INR",
      exchange_rate: 1.0,
      paid_by_member_id: members[se.payerIdx].id,
      category: se.cat,
      note: se.note,
      split_mode: "equal",
      created_at: nowIso()
    });

    const share = se.amount / members.length;
    members.forEach(m => {
      insertRow(SHEETS.SPLITS, {
        id: generateId(),
        expense_id: expId,
        member_id: m.id,
        amount: share,
        split_mode: "equal",
        split_value: "",
        created_at: nowIso()
      });
    });
  });

  insertRow(SHEETS.SETTLEMENTS, {
    id: generateId(),
    space_id: spaceId,
    from_member_id: members[1].id,
    to_member_id: members[0].id,
    amount: 500,
    currency: "INR",
    note: "Partial advance payment via UPI",
    created_at: nowIso()
  });

  insertRow(SHEETS.ACTIVITIES, {
    id: generateId(),
    space_id: spaceId,
    message: "Demo space initialized with Goa Weekend expenses and settlements",
    created_at: nowIso()
  });
}

// ==========================================
// USER SYNC
// ==========================================

function syncUser(data) {
  if (!data.email) return { ok: false, error: "Email is required" };
  const users = getTableData(SHEETS.USERS);
  const emailNorm = data.email.toLowerCase().trim();
  let user = users.find(u => u.email.toLowerCase() === emailNorm);

  if (!user) {
    user = {
      id: data.id || generateId(),
      email: emailNorm,
      name: data.name || emailNorm.split("@")[0],
      avatar: data.avatar || "",
      created_at: nowIso()
    };
    insertRow(SHEETS.USERS, user);
  } else if (data.name && data.name !== user.name) {
    updateRowByField(SHEETS.USERS, "id", user.id, { name: data.name });
    user.name = data.name;
  }
  return { ok: true, user: user };
}

// ==========================================
// SPACES (SECURED)
// ==========================================

function getSpaces(userId, userEmail) {
  if (!userId && !userEmail) {
    // Never leak all spaces to unauthenticated requests
    return [];
  }

  const allSpaces = getTableData(SHEETS.SPACES);
  const allMembers = getTableData(SHEETS.MEMBERS);
  const allExpenses = getTableData(SHEETS.EXPENSES);

  // Find spaces where user is an explicit member or creator
  const userMembers = allMembers.filter(m =>
    (userId && m.user_id && String(m.user_id) === String(userId)) ||
    (userEmail && m.email && m.email.toLowerCase() === String(userEmail).toLowerCase())
  );
  const userSpaceIds = new Set(userMembers.map(m => m.space_id));

  const spaces = allSpaces.filter(s =>
    userSpaceIds.has(s.id) || (userId && String(s.created_by) === String(userId))
  );

  return spaces.map(s => {
    const members = allMembers.filter(m => m.space_id === s.id);
    const expenses = allExpenses.filter(e => e.space_id === s.id);
    return {
      id: s.id,
      title: s.title,
      emoji: s.emoji || "💸",
      period: s.period || null,
      currency: s.currency || "USD",
      members: members.map(formatMember),
      expenses: expenses.map(e => ({ id: e.id, amount: Number(e.amount) })),
      created_at: s.created_at
    };
  });
}

function getSpaceSecured(spaceId, userId, userEmail) {
  requireMember(spaceId, userId, userEmail);

  const spaces = getTableData(SHEETS.SPACES);
  const space = spaces.find(s => s.id === spaceId);
  if (!space) throw new Error("Space not found");

  const allMembers = getTableData(SHEETS.MEMBERS).filter(m => m.space_id === spaceId);
  const allExpenses = getTableData(SHEETS.EXPENSES).filter(e => e.space_id === spaceId);
  const allSplits = getTableData(SHEETS.SPLITS);
  const memberMap = new Map(allMembers.map(m => [m.id, formatMember(m)]));

  const expenses = allExpenses.map(e => {
    const splits = allSplits
      .filter(sp => sp.expense_id === e.id)
      .map(sp => ({
        user_id: sp.member_id,
        amount: Number(sp.amount),
        split_mode: sp.split_mode,
        split_value: sp.split_value ? Number(sp.split_value) : null
      }));

    return {
      id: e.id,
      title: e.title,
      amount: Number(e.amount),
      currency: e.currency || space.currency,
      original_amount: e.original_amount ? Number(e.original_amount) : Number(e.amount),
      original_currency: e.original_currency || e.currency,
      exchange_rate: e.exchange_rate ? Number(e.exchange_rate) : 1.0,
      paid_by: memberMap.get(e.paid_by_member_id) || { id: e.paid_by_member_id, name: "Unknown", email: "", role: "member" },
      category: e.category,
      note: e.note || null,
      split_mode: e.split_mode || "equal",
      splits: splits,
      created_at: e.created_at
    };
  });

  return {
    id: space.id,
    title: space.title,
    emoji: space.emoji || "💸",
    period: space.period || null,
    currency: space.currency || "USD",
    members: allMembers.map(formatMember),
    expenses: expenses,
    created_at: space.created_at
  };
}

function createSpaceSecured(payload, userId, userEmail, userName) {
  if (!userId && !userEmail) throw new Error("User credentials required to create a space");

  const spaceId = generateId();
  const space = {
    id: spaceId,
    title: sanitizeForSheet(payload.title || "New Space"),
    emoji: payload.emoji || "💸",
    period: payload.period ? sanitizeForSheet(payload.period) : null,
    currency: (payload.currency || "USD").toUpperCase(),
    created_by: userId || userEmail,
    created_at: nowIso()
  };
  insertRow(SHEETS.SPACES, space);

  // Add creator as owner member
  const memberId = generateId();
  const ownerMember = {
    id: memberId,
    space_id: spaceId,
    user_id: userId || "",
    name: sanitizeForSheet(userName || userEmail.split("@")[0] || "Owner"),
    email: userEmail || "",
    role: "owner",
    created_at: nowIso()
  };
  insertRow(SHEETS.MEMBERS, ownerMember);

  return getSpaceSecured(spaceId, userId, userEmail);
}

function deleteSpaceSecured(spaceId, userId, userEmail) {
  // Only owner can delete
  requireOwner(spaceId, userId, userEmail);

  deleteRowsByField(SHEETS.SPACES, "id", spaceId);
  deleteRowsByField(SHEETS.MEMBERS, "space_id", spaceId);

  const expenses = getTableData(SHEETS.EXPENSES).filter(e => e.space_id === spaceId);
  expenses.forEach(e => {
    deleteRowsByField(SHEETS.SPLITS, "expense_id", e.id);
  });
  deleteRowsByField(SHEETS.EXPENSES, "space_id", spaceId);
  deleteRowsByField(SHEETS.SETTLEMENTS, "space_id", spaceId);
  deleteRowsByField(SHEETS.INVITES, "space_id", spaceId);
  deleteRowsByField(SHEETS.ACTIVITIES, "space_id", spaceId);

  return { ok: true };
}

function leaveSpace(spaceId, userId, userEmail) {
  const member = requireMember(spaceId, userId, userEmail);
  if (member.role === "owner") {
    // Check if other owners exist
    const otherOwners = getTableData(SHEETS.MEMBERS).filter(m => m.space_id === spaceId && m.role === "owner" && m.id !== member.id);
    if (otherOwners.length === 0) {
      throw new Error("Space owner cannot leave without transferring ownership or deleting the space");
    }
  }
  deleteRowsByField(SHEETS.MEMBERS, "id", member.id);
  return { ok: true };
}

function addMemberSecured(spaceId, payload, userId, userEmail) {
  requireMember(spaceId, userId, userEmail);

  const memberEmail = (payload.email || "").toLowerCase().trim();
  const memberId = generateId();
  const member = {
    id: memberId,
    space_id: spaceId,
    user_id: payload.user_id || payload.userId || "",
    name: sanitizeForSheet(payload.name || "Member"),
    email: memberEmail,
    role: payload.role === "owner" ? "owner" : "member",
    created_at: nowIso()
  };
  insertRow(SHEETS.MEMBERS, member);
  return formatMember(member);
}

function formatMember(m) {
  return {
    id: m.id,
    name: m.name,
    email: m.email || "",
    role: m.role || "member",
    avatar: m.avatar || null
  };
}

// ==========================================
// EXPENSES (SECURED WITH RBAC)
// ==========================================

function createExpenseSecured(spaceId, payload, userId, userEmail) {
  requireMember(spaceId, userId, userEmail);

  const amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0) throw new Error("Amount must be a positive number");

  const expId = generateId();
  const currency = (payload.currency || "USD").toUpperCase();
  const origAmount = payload.original_amount !== undefined ? Number(payload.original_amount) : amount;
  const origCurrency = (payload.original_currency || currency).toUpperCase();
  const rate = payload.exchange_rate !== undefined ? Number(payload.exchange_rate) : 1.0;

  const expense = {
    id: expId,
    space_id: spaceId,
    title: sanitizeForSheet(payload.title),
    amount: amount,
    currency: currency,
    original_amount: origAmount,
    original_currency: origCurrency,
    exchange_rate: rate,
    paid_by_member_id: payload.paid_by,
    category: sanitizeForSheet(payload.category || "other"),
    note: payload.note ? sanitizeForSheet(payload.note) : "",
    split_mode: payload.split_mode || "equal",
    created_at: nowIso()
  };
  insertRow(SHEETS.EXPENSES, expense);

  const splits = payload.splits || [];
  splits.forEach(sp => {
    insertRow(SHEETS.SPLITS, {
      id: generateId(),
      expense_id: expId,
      member_id: sp.user_id || sp.member_id,
      amount: Number(sp.amount),
      split_mode: sp.split_mode || expense.split_mode,
      split_value: sp.split_value !== undefined ? Number(sp.split_value) : "",
      created_at: nowIso()
    });
  });

  const space = getSpaceSecured(spaceId, userId, userEmail);
  return space.expenses.find(e => e.id === expId);
}

function updateExpenseSecured(spaceId, expenseId, payload, userId, userEmail) {
  const member = requireMember(spaceId, userId, userEmail);

  const allExpenses = getTableData(SHEETS.EXPENSES);
  const expense = allExpenses.find(e => e.id === expenseId && e.space_id === spaceId);
  if (!expense) throw new Error("Expense not found");

  // RBAC: Only owner or payer can edit
  if (member.role !== "owner" && expense.paid_by_member_id !== member.id) {
    throw new Error("Forbidden: You can only edit your own expenses unless you are the space owner");
  }

  const amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0) throw new Error("Amount must be a positive number");

  const updates = {
    title: sanitizeForSheet(payload.title),
    amount: amount,
    currency: (payload.currency || expense.currency).toUpperCase(),
    original_amount: payload.original_amount !== undefined ? Number(payload.original_amount) : amount,
    original_currency: (payload.original_currency || payload.currency || expense.currency).toUpperCase(),
    exchange_rate: payload.exchange_rate !== undefined ? Number(payload.exchange_rate) : 1.0,
    paid_by_member_id: payload.paid_by,
    category: sanitizeForSheet(payload.category),
    note: payload.note ? sanitizeForSheet(payload.note) : "",
    split_mode: payload.split_mode || "equal"
  };
  updateRowByField(SHEETS.EXPENSES, "id", expenseId, updates);

  deleteRowsByField(SHEETS.SPLITS, "expense_id", expenseId);
  const splits = payload.splits || [];
  splits.forEach(sp => {
    insertRow(SHEETS.SPLITS, {
      id: generateId(),
      expense_id: expenseId,
      member_id: sp.user_id || sp.member_id,
      amount: Number(sp.amount),
      split_mode: sp.split_mode || updates.split_mode,
      split_value: sp.split_value !== undefined ? Number(sp.split_value) : "",
      created_at: nowIso()
    });
  });

  const space = getSpaceSecured(spaceId, userId, userEmail);
  return space.expenses.find(e => e.id === expenseId);
}

function deleteExpenseSecured(spaceId, expenseId, userId, userEmail) {
  const member = requireMember(spaceId, userId, userEmail);

  const allExpenses = getTableData(SHEETS.EXPENSES);
  const expense = allExpenses.find(e => e.id === expenseId && e.space_id === spaceId);
  if (!expense) throw new Error("Expense not found");

  // RBAC: Only owner or payer can delete
  if (member.role !== "owner" && expense.paid_by_member_id !== member.id) {
    throw new Error("Forbidden: You can only delete your own expenses unless you are the space owner");
  }

  deleteRowsByField(SHEETS.SPLITS, "expense_id", expenseId);
  deleteRowsByField(SHEETS.EXPENSES, "id", expenseId);
  return { ok: true };
}

// ==========================================
// SETTLEMENTS (SECURED)
// ==========================================

function getSettlementsSecured(spaceId, userId, userEmail) {
  requireMember(spaceId, userId, userEmail);

  const allSettlements = getTableData(SHEETS.SETTLEMENTS).filter(s => s.space_id === spaceId);
  const allMembers = getTableData(SHEETS.MEMBERS).filter(m => m.space_id === spaceId);
  const memberMap = new Map(allMembers.map(m => [m.id, formatMember(m)]));

  return allSettlements.map(s => ({
    id: s.id,
    space_id: s.space_id,
    from_member: memberMap.get(s.from_member_id) || { id: s.from_member_id, name: "Unknown", email: "", role: "member" },
    to_member: memberMap.get(s.to_member_id) || { id: s.to_member_id, name: "Unknown", email: "", role: "member" },
    amount: Number(s.amount),
    currency: s.currency || "USD",
    note: s.note || null,
    created_at: s.created_at
  }));
}

function createSettlementSecured(spaceId, payload, userId, userEmail) {
  requireMember(spaceId, userId, userEmail);

  const amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0) throw new Error("Settlement amount must be a positive number");

  const id = generateId();
  const settlement = {
    id: id,
    space_id: spaceId,
    from_member_id: payload.from_member_id,
    to_member_id: payload.to_member_id,
    amount: amount,
    currency: (payload.currency || "USD").toUpperCase(),
    note: payload.note ? sanitizeForSheet(payload.note) : "",
    created_at: nowIso()
  };
  insertRow(SHEETS.SETTLEMENTS, settlement);
  const settlements = getSettlementsSecured(spaceId, userId, userEmail);
  return settlements.find(s => s.id === id);
}

function deleteSettlementSecured(spaceId, settlementId, userId, userEmail) {
  const member = requireMember(spaceId, userId, userEmail);

  const allSettlements = getTableData(SHEETS.SETTLEMENTS);
  const settlement = allSettlements.find(s => s.id === settlementId && s.space_id === spaceId);
  if (!settlement) throw new Error("Settlement not found");

  // RBAC: Only owner or involved payer/payee can delete
  if (member.role !== "owner" && settlement.from_member_id !== member.id && settlement.to_member_id !== member.id) {
    throw new Error("Forbidden: Only involved parties or the owner can delete this settlement");
  }

  deleteRowsByField(SHEETS.SETTLEMENTS, "id", settlementId);
  return { ok: true };
}

// ==========================================
// SUMMARY & DEBT SIMPLIFICATION
// ==========================================

function getSummarySecured(spaceId, userId, userEmail) {
  const space = getSpaceSecured(spaceId, userId, userEmail);
  const settlements = getSettlementsSecured(spaceId, userId, userEmail);
  const members = space.members;
  const expenses = space.expenses;

  let totalSpent = 0;
  const memberTotals = {};
  members.forEach(m => {
    memberTotals[m.id] = {
      member: m,
      total_paid: 0,
      total_owed: 0,
      net_balance: 0
    };
  });

  expenses.forEach(e => {
    totalSpent += e.amount;
    if (memberTotals[e.paid_by.id]) {
      memberTotals[e.paid_by.id].total_paid += e.amount;
    }
    e.splits.forEach(sp => {
      if (memberTotals[sp.user_id]) {
        memberTotals[sp.user_id].total_owed += sp.amount;
      }
    });
  });

  settlements.forEach(s => {
    if (memberTotals[s.from_member.id]) {
      memberTotals[s.from_member.id].total_paid += s.amount;
    }
    if (memberTotals[s.to_member.id]) {
      memberTotals[s.to_member.id].total_owed += s.amount;
    }
  });

  const memberBalances = Object.values(memberTotals).map(mt => {
    mt.net_balance = Math.round((mt.total_paid - mt.total_owed) * 100) / 100;
    mt.total_paid = Math.round(mt.total_paid * 100) / 100;
    mt.total_owed = Math.round(mt.total_owed * 100) / 100;
    return mt;
  });

  const debtors = [];
  const creditors = [];

  memberBalances.forEach(mb => {
    if (mb.net_balance < -0.01) {
      debtors.push({ member: mb.member, balance: -mb.net_balance });
    } else if (mb.net_balance > 0.01) {
      creditors.push({ member: mb.member, balance: mb.net_balance });
    }
  });

  const settlementInstructions = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settleAmount = Math.min(debtor.balance, creditor.balance);

    if (settleAmount > 0.01) {
      settlementInstructions.push({
        from_member: debtor.member,
        to_member: creditor.member,
        amount: Math.round(settleAmount * 100) / 100
      });
    }

    debtor.balance -= settleAmount;
    creditor.balance -= settleAmount;
    if (debtor.balance <= 0.01) dIdx++;
    if (creditor.balance <= 0.01) cIdx++;
  }

  // Find caller's balance
  const currentMember = members.find(m =>
    (userId && m.user_id && String(m.user_id) === String(userId)) ||
    (userEmail && m.email && m.email.toLowerCase() === String(userEmail).toLowerCase())
  );
  const callerBalance = currentMember && memberTotals[currentMember.id]
    ? memberTotals[currentMember.id].net_balance
    : memberBalances[0] ? memberBalances[0].net_balance : 0;

  return {
    total_spent: Math.round(totalSpent * 100) / 100,
    your_balance: callerBalance,
    people_count: members.length,
    expense_count: expenses.length,
    settlements: settlementInstructions,
    recorded_settlements: settlements,
    member_balances: memberBalances
  };
}

// ==========================================
// INVITES (SECURED)
// ==========================================

function createInviteSecured(spaceId, userId, userEmail) {
  requireMember(spaceId, userId, userEmail);

  const token = Utilities.getUuid().replace(/-/g, "").substring(0, 16);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  insertRow(SHEETS.INVITES, {
    token: token,
    space_id: spaceId,
    expires_at: expiresAt,
    created_at: nowIso()
  });
  return { token: token, url: `/?join=${token}` };
}

function getInviteInfo(token) {
  const invites = getTableData(SHEETS.INVITES);
  const inv = invites.find(i => i.token === token);
  if (!inv) throw new Error("Invite link is invalid or expired");

  if (new Date(inv.expires_at).getTime() < Date.now()) {
    throw new Error("Invite link has expired");
  }

  const spaces = getTableData(SHEETS.SPACES);
  const space = spaces.find(s => s.id === inv.space_id);
  if (!space) throw new Error("Space no longer exists");

  return {
    space_id: space.id,
    title: space.title,
    emoji: space.emoji
  };
}

function joinInvite(token, userId, userName, userEmail) {
  if (!userId && !userEmail) throw new Error("Authentication required to join space");

  const invites = getTableData(SHEETS.INVITES);
  const inv = invites.find(i => i.token === token);
  if (!inv) throw new Error("Invite link is invalid or expired");

  if (new Date(inv.expires_at).getTime() < Date.now()) {
    throw new Error("Invite link has expired");
  }

  const members = getTableData(SHEETS.MEMBERS).filter(m => m.space_id === inv.space_id);
  const existing = members.find(m =>
    (userId && m.user_id && String(m.user_id) === String(userId)) ||
    (userEmail && m.email && m.email.toLowerCase() === userEmail.toLowerCase())
  );

  if (!existing) {
    insertRow(SHEETS.MEMBERS, {
      id: generateId(),
      space_id: inv.space_id,
      user_id: userId || "",
      name: sanitizeForSheet(userName || userEmail.split("@")[0] || "New Member"),
      email: userEmail || "",
      role: "member",
      created_at: nowIso()
    });
  }

  return { space_id: inv.space_id };
}

// ==========================================
// CSV EXPORT (SECURED & SANITIZED)
// ==========================================

function exportCsvSecured(spaceId, userId, userEmail) {
  const space = getSpaceSecured(spaceId, userId, userEmail);
  let csv = "Date,Title,Category,Amount,Currency,Paid By,Splits\n";
  space.expenses.forEach(e => {
    const splitSummary = e.splits.map(s => `${s.user_id}:${s.amount}`).join("; ");
    // Formula sanitization for CSV fields
    const safeTitle = sanitizeForSheet(e.title).replace(/"/g, '""');
    const safeCat = sanitizeForSheet(e.category).replace(/"/g, '""');
    const safePayer = sanitizeForSheet(e.paid_by.name).replace(/"/g, '""');
    csv += `"${e.created_at}","${safeTitle}","${safeCat}",${e.amount},"${e.currency}","${safePayer}","${splitSummary}"\n`;
  });
  return {
    csv: csv,
    filename: `splitspace-${space.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.csv`
  };
}
