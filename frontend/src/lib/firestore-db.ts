import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { Member, Space, Expense, SettlementRecord, Summary, Split, SplitMode } from "./api";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
}

function nowIso(): string {
  return new Date().toISOString();
}

export const firestoreDb = {
  // -------------------------------------------------------------
  // USER PROFILE
  // -------------------------------------------------------------
  async syncUser(user: { id: string; email: string; name: string; avatar?: string | null }) {
    if (!db || !user.id) return;
    const userRef = doc(db, "users", user.id);
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, {
        id: user.id,
        email: user.email.toLowerCase(),
        name: user.name || user.email.split("@")[0],
        avatar: user.avatar || null,
        createdAt: nowIso(),
      });
    } else if (user.name && user.name !== existing.data()?.name) {
      await updateDoc(userRef, { name: user.name });
    }
  },

  // -------------------------------------------------------------
  // SPACES
  // -------------------------------------------------------------
  async getSpaces(userId?: string, userEmail?: string): Promise<Space[]> {
    if (!db) return [];
    if (!userId && !userEmail) return [];

    const spacesRef = collection(db, "spaces");
    let q = query(spacesRef, where("memberUids", "array-contains", userId));
    const snap = await getDocs(q);

    const spaces: Space[] = [];
    for (const d of snap.docs) {
      const data = d.data();
      // Fetch expenses subcollection
      const expSnap = await getDocs(collection(db, "spaces", d.id, "expenses"));
      const expenses = expSnap.docs.map((ed) => ed.data() as Expense);

      spaces.push({
        id: d.id,
        title: data.title,
        emoji: data.emoji || "💸",
        period: data.period || null,
        currency: data.currency || "USD",
        members: data.members || [],
        expenses: expenses,
        created_at: data.createdAt || nowIso(),
      });
    }

    // If user has no spaces yet, seed the default Goa Weekend demo space
    if (spaces.length === 0 && userId) {
      const demoSpace = await this.seedInitialSpace(userId, userEmail || "");
      if (demoSpace) spaces.push(demoSpace);
    }

    return spaces;
  },

  async getSpace(spaceId: string): Promise<Space> {
    if (!db) throw new Error("Database not connected");
    const spaceRef = doc(db, "spaces", spaceId);
    const spaceSnap = await getDoc(spaceRef);
    if (!spaceSnap.exists()) throw new Error("Space not found");

    const data = spaceSnap.data();
    const expSnap = await getDocs(query(collection(db, "spaces", spaceId, "expenses"), orderBy("created_at", "desc")));
    const expenses = expSnap.docs.map((ed) => ed.data() as Expense);

    return {
      id: spaceSnap.id,
      title: data.title,
      emoji: data.emoji || "💸",
      period: data.period || null,
      currency: data.currency || "USD",
      members: data.members || [],
      expenses: expenses,
      created_at: data.createdAt || nowIso(),
    };
  },

  async createSpace(
    body: Pick<Space, "title" | "emoji" | "period" | "currency">,
    user: Member
  ): Promise<Space> {
    if (!db) throw new Error("Database not connected");
    const spaceId = generateId();
    const ownerMember: Member = {
      id: generateId(),
      name: user.name || user.email.split("@")[0] || "Owner",
      email: user.email,
      role: "owner",
      avatar: user.avatar || null,
    };

    const spaceData = {
      id: spaceId,
      title: body.title.trim(),
      emoji: body.emoji || "💸",
      period: body.period || null,
      currency: (body.currency || "USD").toUpperCase(),
      createdBy: user.id,
      memberUids: [user.id],
      members: [ownerMember],
      createdAt: nowIso(),
    };

    await setDoc(doc(db, "spaces", spaceId), spaceData);

    return {
      id: spaceId,
      title: spaceData.title,
      emoji: spaceData.emoji,
      period: spaceData.period,
      currency: spaceData.currency,
      members: [ownerMember],
      expenses: [],
      created_at: spaceData.createdAt,
    };
  },

  async deleteSpace(spaceId: string): Promise<{ ok: boolean }> {
    if (!db) throw new Error("Database not connected");
    // Delete subcollections batch
    const batch = writeBatch(db);
    const expSnap = await getDocs(collection(db, "spaces", spaceId, "expenses"));
    expSnap.docs.forEach((d) => batch.delete(d.ref));

    const setSnap = await getDocs(collection(db, "spaces", spaceId, "settlements"));
    setSnap.docs.forEach((d) => batch.delete(d.ref));

    batch.delete(doc(db, "spaces", spaceId));
    await batch.commit();

    return { ok: true };
  },

  async leaveSpace(spaceId: string, user: Member): Promise<{ ok: boolean }> {
    if (!db) throw new Error("Database not connected");
    const spaceRef = doc(db, "spaces", spaceId);
    const spaceSnap = await getDoc(spaceRef);
    if (!spaceSnap.exists()) return { ok: true };

    const data = spaceSnap.data();
    const updatedMembers = (data.members || []).filter(
      (m: Member) => m.email.toLowerCase() !== user.email.toLowerCase()
    );
    const updatedUids = (data.memberUids || []).filter((uid: string) => uid !== user.id);

    await updateDoc(spaceRef, {
      members: updatedMembers,
      memberUids: updatedUids,
    });
    return { ok: true };
  },

  async addMember(spaceId: string, body: { name: string; email: string }): Promise<Member> {
    if (!db) throw new Error("Database not connected");
    const spaceRef = doc(db, "spaces", spaceId);
    const spaceSnap = await getDoc(spaceRef);
    if (!spaceSnap.exists()) throw new Error("Space not found");

    const data = spaceSnap.data();
    const newMember: Member = {
      id: generateId(),
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      role: "member",
      avatar: null,
    };

    const members = [...(data.members || []), newMember];
    await updateDoc(spaceRef, { members });
    return newMember;
  },

  // -------------------------------------------------------------
  // EXPENSES
  // -------------------------------------------------------------
  async createExpense(
    spaceId: string,
    body: {
      title: string;
      amount: number;
      currency?: string;
      original_amount?: number;
      original_currency?: string;
      exchange_rate?: number;
      category: string;
      note?: string;
      paid_by: string;
      split_mode: SplitMode;
      splits: Split[];
    }
  ): Promise<Expense> {
    if (!db) throw new Error("Database not connected");
    const space = await this.getSpace(spaceId);
    const payer = space.members.find((m) => m.id === body.paid_by) || space.members[0];

    const expId = generateId();
    const newExpense: Expense = {
      id: expId,
      title: body.title.trim(),
      amount: Number(body.amount),
      currency: (body.currency || space.currency).toUpperCase(),
      original_amount: body.original_amount !== undefined ? Number(body.original_amount) : Number(body.amount),
      original_currency: (body.original_currency || body.currency || space.currency).toUpperCase(),
      exchange_rate: body.exchange_rate !== undefined ? Number(body.exchange_rate) : 1.0,
      paid_by: payer,
      category: body.category,
      note: body.note || null,
      split_mode: body.split_mode || "equal",
      splits: body.splits || [],
      created_at: nowIso(),
    };

    await setDoc(doc(db, "spaces", spaceId, "expenses", expId), newExpense);
    return newExpense;
  },

  async updateExpense(
    spaceId: string,
    expenseId: string,
    body: {
      title: string;
      amount: number;
      currency?: string;
      original_amount?: number;
      original_currency?: string;
      exchange_rate?: number;
      category: string;
      note?: string;
      paid_by: string;
      split_mode: SplitMode;
      splits: Split[];
    }
  ): Promise<Expense> {
    if (!db) throw new Error("Database not connected");
    const space = await this.getSpace(spaceId);
    const payer = space.members.find((m) => m.id === body.paid_by) || space.members[0];

    const updatedExpense: Expense = {
      id: expenseId,
      title: body.title.trim(),
      amount: Number(body.amount),
      currency: (body.currency || space.currency).toUpperCase(),
      original_amount: body.original_amount !== undefined ? Number(body.original_amount) : Number(body.amount),
      original_currency: (body.original_currency || body.currency || space.currency).toUpperCase(),
      exchange_rate: body.exchange_rate !== undefined ? Number(body.exchange_rate) : 1.0,
      paid_by: payer,
      category: body.category,
      note: body.note || null,
      split_mode: body.split_mode || "equal",
      splits: body.splits || [],
      created_at: nowIso(),
    };

    await setDoc(doc(db, "spaces", spaceId, "expenses", expenseId), updatedExpense);
    return updatedExpense;
  },

  async deleteExpense(spaceId: string, expenseId: string): Promise<{ ok: boolean }> {
    if (!db) throw new Error("Database not connected");
    await deleteDoc(doc(db, "spaces", spaceId, "expenses", expenseId));
    return { ok: true };
  },

  // -------------------------------------------------------------
  // SETTLEMENTS (DIRECT PAYMENTS)
  // -------------------------------------------------------------
  async getSettlements(spaceId: string): Promise<SettlementRecord[]> {
    if (!db) return [];
    const snap = await getDocs(query(collection(db, "spaces", spaceId, "settlements"), orderBy("created_at", "desc")));
    return snap.docs.map((d) => d.data() as SettlementRecord);
  },

  async createSettlement(
    spaceId: string,
    body: {
      from_member_id: string;
      to_member_id: string;
      amount: number;
      currency?: string;
      note?: string;
    }
  ): Promise<SettlementRecord> {
    if (!db) throw new Error("Database not connected");
    const space = await this.getSpace(spaceId);
    const fromMem = space.members.find((m) => m.id === body.from_member_id) || {
      id: body.from_member_id,
      name: "Member",
      email: "",
      role: "member" as const,
    };
    const toMem = space.members.find((m) => m.id === body.to_member_id) || {
      id: body.to_member_id,
      name: "Member",
      email: "",
      role: "member" as const,
    };

    const settleId = generateId();
    const settlement: SettlementRecord = {
      id: settleId,
      space_id: spaceId,
      from_member: fromMem,
      to_member: toMem,
      amount: Number(body.amount),
      currency: (body.currency || space.currency).toUpperCase(),
      note: body.note || null,
      created_at: nowIso(),
    };

    await setDoc(doc(db, "spaces", spaceId, "settlements", settleId), settlement);
    return settlement;
  },

  async deleteSettlement(spaceId: string, settlementId: string): Promise<{ ok: boolean }> {
    if (!db) throw new Error("Database not connected");
    await deleteDoc(doc(db, "spaces", spaceId, "settlements", settlementId));
    return { ok: true };
  },

  // -------------------------------------------------------------
  // SUMMARY & DEBT MINIMIZATION ALGORITHM
  // -------------------------------------------------------------
  async getSummary(spaceId: string, currentUserId?: string, currentUserEmail?: string): Promise<Summary> {
    const space = await this.getSpace(spaceId);
    const settlements = await this.getSettlements(spaceId);
    const members = space.members;
    const expenses = space.expenses;

    let totalSpent = 0;
    const memberTotals: Record<string, any> = {};

    members.forEach((m) => {
      memberTotals[m.id] = {
        member: m,
        total_paid: 0,
        total_owed: 0,
        net_balance: 0,
      };
    });

    expenses.forEach((e) => {
      totalSpent += e.amount;
      if (memberTotals[e.paid_by.id]) {
        memberTotals[e.paid_by.id].total_paid += e.amount;
      }
      if (e.split_mode === "equal" || !e.splits || e.splits.length === 0) {
        const perPerson = Math.round((e.amount / Math.max(members.length, 1)) * 100) / 100;
        members.forEach((m) => {
          if (memberTotals[m.id]) {
            memberTotals[m.id].total_owed += perPerson;
          }
        });
      } else {
        e.splits.forEach((sp) => {
          if (memberTotals[sp.user_id]) {
            memberTotals[sp.user_id].total_owed += sp.amount;
          }
        });
      }
    });

    settlements.forEach((s) => {
      if (memberTotals[s.from_member.id]) {
        memberTotals[s.from_member.id].total_paid += s.amount;
      }
      if (memberTotals[s.to_member.id]) {
        memberTotals[s.to_member.id].total_owed += s.amount;
      }
    });

    const memberBalances = Object.values(memberTotals).map((mt: any) => {
      mt.net_balance = Math.round((mt.total_paid - mt.total_owed) * 100) / 100;
      mt.total_paid = Math.round(mt.total_paid * 100) / 100;
      mt.total_owed = Math.round(mt.total_owed * 100) / 100;
      return mt;
    });

    // Debt Simplification algorithm
    const debtors: any[] = [];
    const creditors: any[] = [];
    memberBalances.forEach((mb: any) => {
      if (mb.net_balance < -0.01) {
        debtors.push({ member: mb.member, balance: -mb.net_balance });
      } else if (mb.net_balance > 0.01) {
        creditors.push({ member: mb.member, balance: mb.net_balance });
      }
    });

    const settlementInstructions: any[] = [];
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
          amount: Math.round(settleAmount * 100) / 100,
        });
      }

      debtor.balance -= settleAmount;
      creditor.balance -= settleAmount;
      if (debtor.balance <= 0.01) dIdx++;
      if (creditor.balance <= 0.01) cIdx++;
    }

    const currentMember = members.find(
      (m) =>
        (currentUserEmail && m.email.toLowerCase() === currentUserEmail.toLowerCase()) ||
        (currentUserId && m.id === currentUserId)
    );
    const callerBalance = currentMember && memberTotals[currentMember.id]
      ? memberTotals[currentMember.id].net_balance
      : memberBalances[0]
      ? memberBalances[0].net_balance
      : 0;

    return {
      total_spent: Math.round(totalSpent * 100) / 100,
      your_balance: callerBalance,
      people_count: members.length,
      expense_count: expenses.length,
      settlements: settlementInstructions,
      recorded_settlements: settlements,
      member_balances: memberBalances,
    };
  },

  // -------------------------------------------------------------
  // INVITES
  // -------------------------------------------------------------
  async createInvite(spaceId: string): Promise<{ url: string; token: string }> {
    if (!db) throw new Error("Database not connected");
    const token = generateId().replace(/-/g, "").substring(0, 16);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await setDoc(doc(db, "invites", token), {
      token,
      spaceId,
      expiresAt,
      createdAt: nowIso(),
    });

    const origin = typeof window !== "undefined" ? window.location.origin : "https://splitspace-9d28f.web.app";
    return { token, url: `${origin}/?join=${token}` };
  },

  async getInviteInfo(token: string): Promise<{ space_id: string; title: string; emoji: string }> {
    if (!db) throw new Error("Database not connected");
    const invSnap = await getDoc(doc(db, "invites", token));
    if (!invSnap.exists()) throw new Error("Invite link is invalid or expired");

    const inv = invSnap.data();
    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      throw new Error("Invite link has expired");
    }

    const space = await this.getSpace(inv.spaceId);
    return {
      space_id: space.id,
      title: space.title,
      emoji: space.emoji,
    };
  },

  async joinInvite(token: string, user: Member): Promise<{ space_id: string }> {
    if (!db) throw new Error("Database not connected");
    const invSnap = await getDoc(doc(db, "invites", token));
    if (!invSnap.exists()) throw new Error("Invite link is invalid or expired");

    const inv = invSnap.data();
    const spaceRef = doc(db, "spaces", inv.spaceId);
    const spaceSnap = await getDoc(spaceRef);
    if (!spaceSnap.exists()) throw new Error("Space no longer exists");

    const data = spaceSnap.data();
    const existing = (data.members || []).find(
      (m: Member) => m.email.toLowerCase() === user.email.toLowerCase()
    );

    if (!existing) {
      const newMember: Member = {
        id: generateId(),
        name: user.name || user.email.split("@")[0] || "Member",
        email: user.email.toLowerCase(),
        role: "member",
        avatar: user.avatar || null,
      };
      const updatedMembers = [...(data.members || []), newMember];
      const updatedUids = [...(data.memberUids || []), user.id];

      await updateDoc(spaceRef, {
        members: updatedMembers,
        memberUids: updatedUids,
      });
    }

    return { space_id: inv.spaceId };
  },

  // -------------------------------------------------------------
  // INITIAL SEEDING FOR NEW USERS
  // -------------------------------------------------------------
  async seedInitialSpace(userId: string, userEmail: string): Promise<Space> {
    if (!db) throw new Error("Database not connected");
    const spaceId = generateId();
    const ownerMember: Member = {
      id: generateId(),
      name: userEmail.split("@")[0] || "You",
      email: userEmail || "demo@splitspace.local",
      role: "owner",
      avatar: null,
    };
    const member2: Member = {
      id: generateId(),
      name: "Yatin",
      email: "yatin@example.com",
      role: "member",
      avatar: null,
    };
    const member3: Member = {
      id: generateId(),
      name: "Rohan",
      email: "rohan@example.com",
      role: "member",
      avatar: null,
    };
    const member4: Member = {
      id: generateId(),
      name: "Neha",
      email: "neha@example.com",
      role: "member",
      avatar: null,
    };

    const members = [ownerMember, member2, member3, member4];

    const spaceData = {
      id: spaceId,
      title: "Goa Weekend",
      emoji: "🌴",
      period: "18–20 Aug 2026",
      currency: "INR",
      createdBy: userId,
      memberUids: [userId],
      members: members,
      createdAt: nowIso(),
    };

    await setDoc(doc(db, "spaces", spaceId), spaceData);

    // Add seed expenses
    const exp1: Expense = {
      id: generateId(),
      title: "Villa booking",
      amount: 8800,
      currency: "INR",
      original_amount: 8800,
      original_currency: "INR",
      exchange_rate: 1.0,
      paid_by: ownerMember,
      category: "accommodation",
      note: "2 nights booking",
      split_mode: "equal",
      splits: members.map((m) => ({ user_id: m.id, amount: 2200 })),
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    };
    await setDoc(doc(db, "spaces", spaceId, "expenses", exp1.id), exp1);

    const exp2: Expense = {
      id: generateId(),
      title: "Dinner — Day 1",
      amount: 2240,
      currency: "INR",
      original_amount: 2240,
      original_currency: "INR",
      exchange_rate: 1.0,
      paid_by: member2,
      category: "food",
      note: "Beach shack dinner",
      split_mode: "equal",
      splits: members.map((m) => ({ user_id: m.id, amount: 560 })),
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    };
    await setDoc(doc(db, "spaces", spaceId, "expenses", exp2.id), exp2);

    return {
      id: spaceId,
      title: spaceData.title,
      emoji: spaceData.emoji,
      period: spaceData.period,
      currency: spaceData.currency,
      members: members,
      expenses: [exp2, exp1],
      created_at: spaceData.createdAt,
    };
  },
};
