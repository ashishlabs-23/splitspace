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
  runTransaction,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Member, Space, Expense, SettlementRecord, Summary, Split, SplitMode, MemberBalance, SettlementInstruction, ActivityItem, ActivityType } from "./api";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeEmail(email?: string | null): string {
  return email ? email.trim().toLowerCase() : "";
}

function fallbackName(name: string | undefined | null, email?: string | null): string {
  return name?.trim() || (email ? email.split("@")[0] : "") || "Member";
}

function memberMatchesUser(member: Member, userId?: string, userEmail?: string): boolean {
  if (userId && member.userUid === userId) return true;
  if (userId && member.id === userId) return true;
  if (userEmail && member.email?.toLowerCase() === userEmail.toLowerCase()) return true;
  return false;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export const firestoreDb = {
  // -------------------------------------------------------------
  // USER PROFILE
  // -------------------------------------------------------------
  async syncUser(user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    emailVerified?: boolean;
    authProvider?: "password" | "google";
  }) {
    if (!db || !user.id) return;
    const userRef = doc(db, "users", user.id);
    const existing = await getDoc(userRef);
    const cleanUsername = user.name?.trim() || user.email.split("@")[0];
    const cleanEmail = user.email.toLowerCase().trim();

    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: user.id,
        username: cleanUsername,
        email: cleanEmail,
        photoURL: user.avatar || null,
        authProvider: user.authProvider || "password",
        emailVerified: Boolean(user.emailVerified),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        // Compatibility fields for existing UI components
        id: user.id,
        name: cleanUsername,
        avatar: user.avatar || null,
      });
    } else {
      const data = existing.data();
      const updates: any = {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: Boolean(user.emailVerified ?? data?.emailVerified),
      };
      if (cleanUsername && cleanUsername !== data?.username && cleanUsername !== data?.name) {
        updates.username = cleanUsername;
        updates.name = cleanUsername;
      }
      if (user.avatar) {
        updates.photoURL = user.avatar;
        updates.avatar = user.avatar;
      }
      await updateDoc(userRef, updates);
    }
  },

  // -------------------------------------------------------------
  // SPACES
  // -------------------------------------------------------------
  async getSpaces(userId?: string, userEmail?: string, userName?: string): Promise<Space[]> {
    if (!db) return [];
    if (!userId && !userEmail) return [];
    const database = db;

    const spacesRef = collection(database, "spaces");
    const q = query(spacesRef, where("memberUids", "array-contains", userId));
    const snap = await getDocs(q);

    const spaces: Space[] = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const expSnap = await getDocs(collection(database, "spaces", d.id, "expenses"));
        const rawExpenses = expSnap.docs.map((ed) => ed.data() as Expense);

        // Sync member names with actual username if matching current user
        const members: Member[] = (data.members || []).map((m: Member) => {
          const isSelf = memberMatchesUser(m, userId, userEmail);
          if (isSelf && userName && userName.trim().length >= 2 && userName.toLowerCase() !== "user") {
            return { ...m, name: userName.trim() };
          }
          return m;
        });

        const expenses: Expense[] = rawExpenses.map((exp) => {
          const isSelf = memberMatchesUser(exp.paid_by, userId, userEmail);
          if (isSelf && userName && userName.trim().length >= 2 && userName.toLowerCase() !== "user") {
            return {
              ...exp,
              paid_by: { ...exp.paid_by, name: userName.trim() },
            };
          }
          return exp;
        });

        return {
          id: d.id,
          title: data.title,
          emoji: data.emoji || "💸",
          period: data.period || null,
          currency: data.currency || "USD",
          members: members,
          expenses: expenses,
          created_at: data.createdAt || nowIso(),
        };
      })
    );

    return spaces;
  },

  async getSpace(spaceId: string, currentUserName?: string, currentUserEmail?: string, currentUserId?: string): Promise<Space> {
    if (!db) throw new Error("Database not connected");
    const spaceRef = doc(db, "spaces", spaceId);
    const spaceSnap = await getDoc(spaceRef);
    if (!spaceSnap.exists()) throw new Error("Space not found");

    const data = spaceSnap.data();
    const expSnap = await getDocs(query(collection(db, "spaces", spaceId, "expenses"), orderBy("created_at", "desc")));
    const rawExpenses = expSnap.docs.map((ed) => ed.data() as Expense);

    const members: Member[] = (data.members || []).map((m: Member) => {
      const isSelf = memberMatchesUser(m, currentUserId, currentUserEmail);
      if (isSelf && currentUserName && currentUserName.trim().length >= 2 && currentUserName.toLowerCase() !== "user") {
        return { ...m, name: currentUserName.trim() };
      }
      return m;
    });

    const expenses: Expense[] = rawExpenses.map((exp) => {
      const isSelf = memberMatchesUser(exp.paid_by, currentUserId, currentUserEmail);
      if (isSelf && currentUserName && currentUserName.trim().length >= 2 && currentUserName.toLowerCase() !== "user") {
        return {
          ...exp,
          paid_by: { ...exp.paid_by, name: currentUserName.trim() },
        };
      }
      return exp;
    });

    return {
      id: spaceSnap.id,
      title: data.title,
      emoji: data.emoji || "💸",
      period: data.period || null,
      currency: data.currency || "USD",
      members: members,
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
    const cleanEmail = normalizeEmail(user.email);
    const ownerMember: Member = {
      id: generateId(),
      name: fallbackName(user.name, cleanEmail),
      email: cleanEmail,
      role: "owner",
      avatar: user.avatar || null,
      userUid: user.id,
    };

    const spaceData = {
      id: spaceId,
      title: body.title.trim(),
      emoji: body.emoji || "💸",
      period: body.period || null,
      currency: (body.currency || "USD").toUpperCase(),
      createdBy: user.id,
      ownerUid: user.id,
      memberUids: [user.id],
      memberEmails: [cleanEmail],
      members: [ownerMember],
      createdAt: nowIso(),
      updatedAt: nowIso(),
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
    // Fetch all subcollection documents
    const expSnap = await getDocs(collection(db, "spaces", spaceId, "expenses"));
    const setSnap = await getDocs(collection(db, "spaces", spaceId, "settlements"));

    const allRefs = [
      ...expSnap.docs.map((d) => d.ref),
      ...setSnap.docs.map((d) => d.ref),
      doc(db, "spaces", spaceId),
    ];

    // Chunk into batches of 400 (Firestore limit is 500 ops per batch)
    for (let i = 0; i < allRefs.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = allRefs.slice(i, i + 400);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    return { ok: true };
  },

  async leaveSpace(spaceId: string, user: Member): Promise<{ ok: boolean }> {
    if (!db) throw new Error("Database not connected");
    const spaceRef = doc(db, "spaces", spaceId);
    await runTransaction(db, async (transaction) => {
      const spaceSnap = await transaction.get(spaceRef);
      if (!spaceSnap.exists()) return;

      const data = spaceSnap.data();
      if (data.ownerUid === user.id) {
        throw new Error("The space owner cannot leave. Delete the space or transfer ownership first.");
      }

      const updatedMembers = (data.members || []).filter(
        (member: Member) => !memberMatchesUser(member, user.id, user.email),
      );
      const updatedUids = (data.memberUids || []).filter((uid: string) => uid !== user.id);
      const updatedEmails = (data.memberEmails || []).filter((email: string) => email !== normalizeEmail(user.email));

      transaction.update(spaceRef, {
        members: updatedMembers,
        memberUids: updatedUids,
        memberEmails: updatedEmails,
        updatedAt: nowIso(),
      });
    });

    await this.logActivity(spaceId, {
      type: "member_left",
      actor_name: user.name || "Member",
      actor_id: user.id,
      details: `${user.name || "A member"} left the space`,
    });

    return { ok: true };
  },

  async addMember(spaceId: string, body: { name: string; email?: string }): Promise<Member> {
    if (!db) throw new Error("Database not connected");
    const spaceRef = doc(db, "spaces", spaceId);
    const normalizedEmail = body.email ? normalizeEmail(body.email) : "";
    const memberName = body.name.trim();
    const newMember: Member = {
      id: generateId(),
      name: memberName || (normalizedEmail ? normalizedEmail.split("@")[0] : "Member"),
      email: normalizedEmail,
      role: "member",
      avatar: null,
      userUid: null,
    };

    await runTransaction(db, async (transaction) => {
      const spaceSnap = await transaction.get(spaceRef);
      if (!spaceSnap.exists()) throw new Error("Space not found");

      const data = spaceSnap.data();
      const existing = normalizedEmail
        ? (data.members || []).some(
            (member: Member) => member.email && normalizeEmail(member.email) === normalizedEmail,
          )
        : (data.members || []).some(
            (member: Member) => member.name.trim().toLowerCase() === memberName.toLowerCase() && !member.email,
          );
      if (existing) {
        throw new Error(normalizedEmail ? "That email is already part of this space." : "A member with this name already exists in this space.");
      }

      const members = [...(data.members || []), newMember];
      const memberEmails = normalizedEmail
        ? uniqueStrings([...(data.memberEmails || []), normalizedEmail])
        : (data.memberEmails || []);

      transaction.update(spaceRef, {
        members,
        memberEmails,
        updatedAt: nowIso(),
      });
    });

    await this.logActivity(spaceId, {
      type: "member_joined",
      actor_name: newMember.name,
      actor_id: newMember.id,
      details: `${newMember.name} joined the space`,
    });

    return newMember;
  },

  // -------------------------------------------------------------
  // ACTIVITY AUDIT TRAIL / CHANGELOG
  // -------------------------------------------------------------
  async logActivity(
    spaceId: string,
    activity: {
      type: ActivityType;
      actor_name: string;
      actor_id: string;
      details: string;
      amount?: number;
      currency?: string;
    }
  ): Promise<void> {
    if (!db) return;
    try {
      const actId = generateId();
      const payload: any = {
        id: actId,
        space_id: spaceId,
        type: activity.type,
        actor_name: activity.actor_name,
        actor_id: activity.actor_id,
        details: activity.details,
        created_at: nowIso(),
      };
      if (typeof activity.amount === "number") {
        payload.amount = activity.amount;
      }
      if (activity.currency) {
        payload.currency = activity.currency;
      }
      await setDoc(doc(db, "spaces", spaceId, "activity", actId), payload);
    } catch (err) {
      console.warn("Could not log space activity:", err);
    }
  },

  async getActivities(spaceId: string): Promise<ActivityItem[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(
        query(collection(db, "spaces", spaceId, "activity"), orderBy("created_at", "desc"))
      );
      return snap.docs.map((d) => d.data() as ActivityItem);
    } catch (err) {
      console.warn("Failed to get activities:", err);
      return [];
    }
  },

  subscribeToActivity(
    spaceId: string,
    onData: (activities: ActivityItem[]) => void
  ): (() => void) {
    if (!db) return () => {};
    try {
      const q = query(collection(db, "spaces", spaceId, "activity"), orderBy("created_at", "desc"));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => d.data() as ActivityItem);
          onData(list);
        },
        (err) => console.warn("Activity subscription error:", err)
      );
    } catch {
      return () => {};
    }
  },

  calculateNextDueDate(interval: "weekly" | "monthly" | "yearly" = "monthly", fromDate?: string): string {
    const base = fromDate ? new Date(fromDate) : new Date();
    if (interval === "weekly") {
      base.setDate(base.getDate() + 7);
    } else if (interval === "yearly") {
      base.setFullYear(base.getFullYear() + 1);
    } else {
      base.setMonth(base.getMonth() + 1);
    }
    return base.toISOString().split("T")[0];
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
      is_recurring?: boolean;
      recurring_interval?: "weekly" | "monthly" | "yearly";
      next_due_date?: string;
    },
    actor: Member,
  ): Promise<Expense> {
    if (!db) throw new Error("Database not connected");
    const space = await this.getSpace(spaceId);
    const payer = space.members.find((m) => m.id === body.paid_by) || space.members[0];

    const expId = generateId();
    const timestamp = nowIso();
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
      created_at: timestamp,
      updated_at: timestamp,
      created_by_uid: actor.id,
    };

    if (body.is_recurring) {
      newExpense.is_recurring = true;
      newExpense.recurring_interval = body.recurring_interval || "monthly";
      newExpense.next_due_date = body.next_due_date || this.calculateNextDueDate(newExpense.recurring_interval);
    }

    await setDoc(doc(db, "spaces", spaceId, "expenses", expId), newExpense);

    await this.logActivity(spaceId, {
      type: "expense_created",
      actor_name: actor.name,
      actor_id: actor.id,
      details: `Added "${newExpense.title}" (${newExpense.currency} ${newExpense.amount.toFixed(2)}) paid by ${payer.name}`,
      amount: newExpense.amount,
      currency: newExpense.currency,
    });

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
      is_recurring?: boolean;
      recurring_interval?: "weekly" | "monthly" | "yearly";
      next_due_date?: string;
    },
    actor: Member,
  ): Promise<Expense> {
    if (!db) throw new Error("Database not connected");
    const space = await this.getSpace(spaceId);
    const payer = space.members.find((m) => m.id === body.paid_by) || space.members[0];
    const expenseRef = doc(db, "spaces", spaceId, "expenses", expenseId);
    const existingExpense = await getDoc(expenseRef);
    if (!existingExpense.exists()) throw new Error("Expense not found");
    const existingData = existingExpense.data() as Expense;

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
      created_at: existingData.created_at || nowIso(),
      updated_at: nowIso(),
      created_by_uid: existingData.created_by_uid || actor.id,
    };

    if (body.is_recurring) {
      updatedExpense.is_recurring = true;
      updatedExpense.recurring_interval = body.recurring_interval || existingData.recurring_interval || "monthly";
      updatedExpense.next_due_date = body.next_due_date || existingData.next_due_date || this.calculateNextDueDate(updatedExpense.recurring_interval);
    }

    await setDoc(expenseRef, updatedExpense);

    await this.logActivity(spaceId, {
      type: "expense_updated",
      actor_name: actor.name,
      actor_id: actor.id,
      details: `Updated "${updatedExpense.title}" (${updatedExpense.currency} ${updatedExpense.amount.toFixed(2)})`,
      amount: updatedExpense.amount,
      currency: updatedExpense.currency,
    });

    return updatedExpense;
  },

  async deleteExpense(spaceId: string, expenseId: string, actor?: Member | null): Promise<{ ok: boolean }> {
    if (!db) throw new Error("Database not connected");
    const expenseRef = doc(db, "spaces", spaceId, "expenses", expenseId);
    const snap = await getDoc(expenseRef);
    const data = snap.exists() ? (snap.data() as Expense) : null;
    await deleteDoc(expenseRef);

    if (actor && data) {
      await this.logActivity(spaceId, {
        type: "expense_deleted",
        actor_name: actor.name,
        actor_id: actor.id,
        details: `Deleted expense "${data.title}" (${data.currency} ${data.amount.toFixed(2)})`,
        amount: data.amount,
        currency: data.currency,
      });
    }

    return { ok: true };
  },

  async postRecurringExpense(spaceId: string, expenseId: string, actor: Member): Promise<Expense> {
    if (!db) throw new Error("Database not connected");
    const expRef = doc(db, "spaces", spaceId, "expenses", expenseId);
    const snap = await getDoc(expRef);
    if (!snap.exists()) throw new Error("Expense template not found");
    const exp = snap.data() as Expense;

    const nextDue = this.calculateNextDueDate(exp.recurring_interval || "monthly", exp.next_due_date || undefined);

    await updateDoc(expRef, {
      next_due_date: nextDue,
      updated_at: nowIso(),
    });

    const dateLabel = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const instanceTitle = `${exp.title} (${dateLabel})`;

    return this.createExpense(
      spaceId,
      {
        title: instanceTitle,
        amount: exp.amount,
        currency: exp.currency,
        original_amount: exp.original_amount ?? exp.amount,
        original_currency: exp.original_currency ?? exp.currency,
        exchange_rate: exp.exchange_rate ?? 1.0,
        category: exp.category,
        note: `Generated from recurring ${exp.recurring_interval || "monthly"} bill`,
        paid_by: exp.paid_by.id,
        split_mode: exp.split_mode || "equal",
        splits: exp.splits || [],
      },
      actor
    );
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
      original_amount?: number;
      original_currency?: string;
      exchange_rate?: number;
      payment_method?: string;
      note?: string;
    },
    actor: Member,
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
    const timestamp = nowIso();
    const settlement: SettlementRecord = {
      id: settleId,
      space_id: spaceId,
      from_member: fromMem,
      to_member: toMem,
      amount: Number(body.amount),
      currency: (body.currency || space.currency).toUpperCase(),
      note: body.note || null,
      created_at: timestamp,
      updated_at: timestamp,
      created_by_uid: actor.id,
    };

    if (body.original_amount !== undefined) {
      settlement.original_amount = Number(body.original_amount);
    }
    if (body.original_currency) {
      settlement.original_currency = body.original_currency.toUpperCase();
    }
    if (body.exchange_rate !== undefined) {
      settlement.exchange_rate = Number(body.exchange_rate);
    }
    if (body.payment_method) {
      settlement.payment_method = body.payment_method;
    }

    await setDoc(doc(db, "spaces", spaceId, "settlements", settleId), settlement);

    await this.logActivity(spaceId, {
      type: "settlement_created",
      actor_name: actor.name,
      actor_id: actor.id,
      details: `${fromMem.name} paid ${toMem.name} ${settlement.currency} ${settlement.amount.toFixed(2)}${body.payment_method ? ` via ${body.payment_method}` : ""}`,
      amount: settlement.amount,
      currency: settlement.currency,
    });

    return settlement;
  },

  async deleteSettlement(spaceId: string, settlementId: string, actor?: Member | null): Promise<{ ok: boolean }> {
    if (!db) throw new Error("Database not connected");
    const setRef = doc(db, "spaces", spaceId, "settlements", settlementId);
    const snap = await getDoc(setRef);
    const data = snap.exists() ? (snap.data() as SettlementRecord) : null;
    await deleteDoc(setRef);

    if (actor && data) {
      await this.logActivity(spaceId, {
        type: "settlement_deleted",
        actor_name: actor.name,
        actor_id: actor.id,
        details: `Deleted settlement of ${data.currency} ${data.amount.toFixed(2)} from ${data.from_member.name} to ${data.to_member.name}`,
        amount: data.amount,
        currency: data.currency,
      });
    }

    return { ok: true };
  },

  // -------------------------------------------------------------
  // SUMMARY & DEBT MINIMIZATION ALGORITHM (EXACT INTEGER CENTS)
  // -------------------------------------------------------------
  async getSummary(spaceId: string, currentUserId?: string, currentUserEmail?: string): Promise<Summary> {
    const space = await this.getSpace(spaceId);
    const settlements = await this.getSettlements(spaceId);
    const members = space.members;
    const expenses = space.expenses;

    let totalSpentCents = 0;
    const memberTotals: Record<string, {
      member: Member;
      total_paid_cents: number;
      total_owed_cents: number;
    }> = {};

    members.forEach((m) => {
      memberTotals[m.id] = {
        member: m,
        total_paid_cents: 0,
        total_owed_cents: 0,
      };
    });

    const ensureMember = (memberId: string, fallback?: Member) => {
      if (!memberTotals[memberId]) {
        const found = members.find((m) => m.id === memberId) || fallback;
        memberTotals[memberId] = {
          member: found || {
            id: memberId,
            name: "Former Member",
            email: "",
            role: "member",
          },
          total_paid_cents: 0,
          total_owed_cents: 0,
        };
      }
    };

    expenses.forEach((e) => {
      const expenseCents = Math.round(Number(e.amount) * 100);
      totalSpentCents += expenseCents;

      ensureMember(e.paid_by.id, e.paid_by);
      memberTotals[e.paid_by.id].total_paid_cents += expenseCents;

      if (e.splits && e.splits.length > 0) {
        e.splits.forEach((sp) => {
          ensureMember(sp.user_id);
          if (memberTotals[sp.user_id]) {
            memberTotals[sp.user_id].total_owed_cents += Math.round(Number(sp.amount) * 100);
          }
        });
      } else {
        const count = Math.max(members.length, 1);
        const baseCents = Math.floor(expenseCents / count);
        const remainderCents = expenseCents % count;

        members.forEach((m, idx) => {
          ensureMember(m.id, m);
          if (memberTotals[m.id]) {
            const shareCents = baseCents + (idx < remainderCents ? 1 : 0);
            memberTotals[m.id].total_owed_cents += shareCents;
          }
        });
      }
    });

    settlements.forEach((s) => {
      const settleCents = Math.round(Number(s.amount) * 100);
      ensureMember(s.from_member.id, s.from_member);
      ensureMember(s.to_member.id, s.to_member);
      if (memberTotals[s.from_member.id]) {
        memberTotals[s.from_member.id].total_paid_cents += settleCents;
      }
      if (memberTotals[s.to_member.id]) {
        memberTotals[s.to_member.id].total_owed_cents += settleCents;
      }
    });

    const memberBalances: MemberBalance[] = Object.values(memberTotals).map((mt) => {
      const netCents = mt.total_paid_cents - mt.total_owed_cents;
      return {
        member: mt.member,
        total_paid: mt.total_paid_cents / 100,
        total_owed: mt.total_owed_cents / 100,
        net_balance: netCents / 100,
        _netCents: netCents,
      } as MemberBalance & { _netCents: number };
    });

    // Exact integer debt-simplification greedy algorithm
    const debtors: { member: Member; balanceCents: number }[] = [];
    const creditors: { member: Member; balanceCents: number }[] = [];

    memberBalances.forEach((mb: any) => {
      if (mb._netCents < 0) {
        debtors.push({ member: mb.member, balanceCents: -mb._netCents });
      } else if (mb._netCents > 0) {
        creditors.push({ member: mb.member, balanceCents: mb._netCents });
      }
    });

    const settlementInstructions: SettlementInstruction[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settleCents = Math.min(debtor.balanceCents, creditor.balanceCents);

      if (settleCents > 0) {
        settlementInstructions.push({
          from_member: debtor.member,
          to_member: creditor.member,
          amount: settleCents / 100,
        });
      }

      debtor.balanceCents -= settleCents;
      creditor.balanceCents -= settleCents;
      if (debtor.balanceCents <= 0) dIdx++;
      if (creditor.balanceCents <= 0) cIdx++;
    }

    const currentMember = members.find(
      (m) => memberMatchesUser(m, currentUserId, currentUserEmail),
    );
    const callerBalance = currentMember && memberTotals[currentMember.id]
      ? (memberTotals[currentMember.id].total_paid_cents - memberTotals[currentMember.id].total_owed_cents) / 100
      : memberBalances[0]
      ? memberBalances[0].net_balance
      : 0;

    return {
      total_spent: totalSpentCents / 100,
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
  async createInvite(spaceId: string, user: Member): Promise<{ url: string; token: string }> {
    if (!db) throw new Error("Database not connected");
    const token = generateId().replace(/-/g, "").substring(0, 16);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const spaceRef = doc(db, "spaces", spaceId);
    const spaceSnap = await getDoc(spaceRef);
    const spaceData = spaceSnap.exists() ? spaceSnap.data() : null;

    await setDoc(doc(db, "invites", token), {
      token,
      spaceId,
      spaceTitle: spaceData?.title || "Shared Space",
      spaceEmoji: spaceData?.emoji || "👥",
      spaceCurrency: spaceData?.currency || "INR",
      createdByUid: user.id,
      createdByEmail: normalizeEmail(user.email),
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

    return {
      space_id: inv.spaceId,
      title: inv.spaceTitle || "Shared Space",
      emoji: inv.spaceEmoji || "👥",
    };
  },

  async joinInvite(token: string, user: Member): Promise<{ space_id: string }> {
    if (!db) throw new Error("Database not connected");
    const inviteRef = doc(db, "invites", token);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error("Invite link is invalid or expired");

    const invite = inviteSnap.data();
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      throw new Error("Invite link has expired");
    }

    const spaceRef = doc(db, "spaces", invite.spaceId);
    const spaceSnap = await getDoc(spaceRef);
    if (!spaceSnap.exists()) throw new Error("Space no longer exists");

    const data = spaceSnap.data();
    const normalizedEmail = normalizeEmail(user.email);
    const existingIndex = (data.members || []).findIndex((member: Member) =>
      memberMatchesUser(member, user.id, user.email) || normalizeEmail(member.email) === normalizedEmail,
    );

    const members = [...(data.members || [])] as Member[];
    if (existingIndex >= 0) {
      members[existingIndex] = {
        ...members[existingIndex],
        name: fallbackName(user.name, normalizedEmail),
        email: normalizedEmail,
        avatar: user.avatar || members[existingIndex].avatar || null,
        userUid: user.id,
      };
    } else {
      members.push({
        id: generateId(),
        name: fallbackName(user.name, normalizedEmail),
        email: normalizedEmail,
        role: "member",
        avatar: user.avatar || null,
        userUid: user.id,
      });
    }

    await updateDoc(spaceRef, {
      members,
      memberUids: uniqueStrings([...(data.memberUids || []), user.id]),
      memberEmails: uniqueStrings([...(data.memberEmails || []), normalizedEmail]),
      updatedAt: nowIso(),
    });

    await this.logActivity(invite.spaceId, {
      type: "member_joined",
      actor_name: user.name || "Member",
      actor_id: user.id,
      details: `${user.name || "A new member"} joined via invite link`,
    });

    return { space_id: invite.spaceId };
  },

  async revokeInvite(token: string): Promise<{ ok: boolean }> {
    if (!db) throw new Error("Database not connected");
    await deleteDoc(doc(db, "invites", token));
    return { ok: true };
  },

  // -------------------------------------------------------------
  // REAL-TIME LISTENER FOR ACTIVE SPACE
  // -------------------------------------------------------------
  subscribeToSpace(
    spaceId: string,
    onData: (data: { space: Space; settlements: SettlementRecord[] }) => void,
  ): () => void {
    if (!db) return () => {};
    const database = db;
    let spaceData: any = null;
    let expensesList: Expense[] = [];
    let settlementsList: SettlementRecord[] = [];

    const triggerUpdate = () => {
      if (!spaceData) return;
      const space: Space = {
        id: spaceId,
        title: spaceData.title,
        emoji: spaceData.emoji || "💸",
        period: spaceData.period || null,
        currency: spaceData.currency || "USD",
        members: spaceData.members || [],
        expenses: expensesList,
        created_at: spaceData.createdAt || nowIso(),
      };
      onData({ space, settlements: settlementsList });
    };

    const unsubSpace = onSnapshot(doc(database, "spaces", spaceId), (snap) => {
      if (snap.exists()) {
        spaceData = snap.data();
        triggerUpdate();
      }
    });

    const unsubExpenses = onSnapshot(
      query(collection(database, "spaces", spaceId, "expenses"), orderBy("created_at", "desc")),
      (snap) => {
        expensesList = snap.docs.map((d) => d.data() as Expense);
        triggerUpdate();
      },
    );

    const unsubSettlements = onSnapshot(
      query(collection(database, "spaces", spaceId, "settlements"), orderBy("created_at", "desc")),
      (snap) => {
        settlementsList = snap.docs.map((d) => d.data() as SettlementRecord);
        triggerUpdate();
      },
    );

    return () => {
      unsubSpace();
      unsubExpenses();
      unsubSettlements();
    };
  },
};
