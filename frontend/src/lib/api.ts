import { firebaseAuthService, isFirebaseConfigured } from "./firebase";
import { firestoreDb } from "./firestore-db";

export type MemberRole = "owner" | "admin" | "member";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  avatar?: string | null;
}

export type SplitMode = "equal" | "exact" | "percentage" | "shares";

export interface Split {
  user_id: string;
  amount: number;
  split_mode?: SplitMode;
  split_value?: number | null;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  original_amount?: number | null;
  original_currency?: string | null;
  exchange_rate?: number | null;
  paid_by: Member;
  category: string;
  note?: string | null;
  created_at: string;
  split_mode?: SplitMode;
  splits: Split[];
}

export interface SettlementRecord {
  id: string;
  space_id: string;
  from_member: Member;
  to_member: Member;
  amount: number;
  currency: string;
  note?: string | null;
  created_at: string;
}

export interface Space {
  id: string;
  title: string;
  emoji: string;
  period?: string | null;
  currency: string;
  members: Member[];
  expenses: Expense[];
  created_at: string;
}

export interface SettlementInstruction {
  from_member: Member;
  to_member: Member;
  amount: number;
}

export interface MemberBalance {
  member: Member;
  net_balance: number;
  total_paid: number;
  total_owed: number;
}

export interface Summary {
  total_spent: number;
  your_balance: number;
  people_count: number;
  expense_count: number;
  settlements: SettlementInstruction[];
  recorded_settlements: SettlementRecord[];
  member_balances: MemberBalance[];
}

function getCurrentUser(): Member | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("splitspace_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const api = {
  // -------------------------------------------------------------
  // FIREBASE AUTHENTICATION
  // -------------------------------------------------------------
  login: async (email: string, password: string, name?: string): Promise<{ access_token: string; user: Member }> => {
    if (isFirebaseConfigured()) {
      const res = await firebaseAuthService.loginWithEmail(email, password, name);
      localStorage.setItem("splitspace_token", res.token);
      localStorage.setItem("splitspace_user", JSON.stringify(res.user));
      try {
        await firestoreDb.syncUser({ id: res.user.id, email: res.user.email, name: res.user.name, avatar: res.user.avatar });
      } catch (err) {
        console.warn("User sync notice:", err);
      }
      return { access_token: res.token, user: res.user };
    }

    // Offline / Demo fallback
    const user: Member = {
      id: "demo-user-ashish",
      name: name?.trim() || (email === "demo@splitspace.local" ? "Ashish N" : email.split("@")[0]),
      email: email,
      role: "owner",
    };
    const token = "mock-firebase-token-" + Date.now();
    localStorage.setItem("splitspace_token", token);
    localStorage.setItem("splitspace_user", JSON.stringify(user));
    return { access_token: token, user };
  },

  loginWithGoogle: async (): Promise<{ access_token: string; user: Member }> => {
    if (!isFirebaseConfigured()) {
      throw new Error("Firebase configuration is missing in .env.local.");
    }
    const res = await firebaseAuthService.loginWithGoogle();
    localStorage.setItem("splitspace_token", res.token);
    localStorage.setItem("splitspace_user", JSON.stringify(res.user));
    try {
      await firestoreDb.syncUser({ id: res.user.id, email: res.user.email, name: res.user.name, avatar: res.user.avatar });
    } catch (err) {
      console.warn("User sync notice:", err);
    }
    return { access_token: res.token, user: res.user };
  },

  register: async (name: string, email: string, password: string): Promise<{ access_token: string; user: Member }> => {
    if (isFirebaseConfigured()) {
      const res = await firebaseAuthService.registerWithEmail(name, email, password);
      localStorage.setItem("splitspace_token", res.token);
      localStorage.setItem("splitspace_user", JSON.stringify(res.user));
      try {
        await firestoreDb.syncUser({ id: res.user.id, email: res.user.email, name: res.user.name });
      } catch (err) {
        console.warn("User sync notice:", err);
      }
      return { access_token: res.token, user: res.user };
    }

    const user: Member = {
      id: "user-" + Date.now(),
      name: name.trim() || email.split("@")[0],
      email: email,
      role: "owner",
    };
    const token = "mock-firebase-token-" + Date.now();
    localStorage.setItem("splitspace_token", token);
    localStorage.setItem("splitspace_user", JSON.stringify(user));
    return { access_token: token, user };
  },

  logout: async (): Promise<{ message: string; ok: boolean }> => {
    await firebaseAuthService.logout();
    return { message: "Logged out successfully", ok: true };
  },

  forgotPassword: async (email: string): Promise<{ message: string; ok: boolean }> => {
    if (isFirebaseConfigured()) {
      await firebaseAuthService.sendPasswordReset(email);
      return { message: `Password reset link sent to ${email}`, ok: true };
    }
    return { message: "Demo mode: Password reset email simulated.", ok: true };
  },

  resetPassword: async (_token: string, _new_pass: string) => {
    return { message: "Password reset completed", ok: true };
  },

  me: async (): Promise<Member> => {
    const user = getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    return user;
  },

  // -------------------------------------------------------------
  // SPACES (BACKED BY CLOUD FIRESTORE)
  // -------------------------------------------------------------
  spaces: async (): Promise<Space[]> => {
    const user = getCurrentUser();
    if (isFirebaseConfigured() && user) {
      return firestoreDb.getSpaces(user.id, user.email);
    }
    return [];
  },

  space: async (id: string): Promise<Space> => {
    return firestoreDb.getSpace(id);
  },

  createSpace: async (body: Pick<Space, "title" | "emoji" | "period" | "currency">): Promise<Space> => {
    const user = getCurrentUser();
    if (!user) throw new Error("Authentication required to create a space");
    return firestoreDb.createSpace(body, user);
  },

  deleteSpace: async (spaceId: string): Promise<{ ok: boolean }> => {
    return firestoreDb.deleteSpace(spaceId);
  },

  leaveSpace: async (spaceId: string): Promise<{ ok: boolean }> => {
    const user = getCurrentUser();
    if (!user) return { ok: true };
    return firestoreDb.leaveSpace(spaceId, user);
  },

  addMember: async (spaceId: string, body: { name: string; email: string }): Promise<Member> => {
    return firestoreDb.addMember(spaceId, body);
  },

  summary: async (spaceId: string): Promise<Summary> => {
    const user = getCurrentUser();
    return firestoreDb.getSummary(spaceId, user?.id, user?.email);
  },

  // -------------------------------------------------------------
  // EXPENSES
  // -------------------------------------------------------------
  createExpense: async (
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
  ): Promise<Expense> => {
    return firestoreDb.createExpense(spaceId, body);
  },

  updateExpense: async (
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
  ): Promise<Expense> => {
    return firestoreDb.updateExpense(spaceId, expenseId, body);
  },

  deleteExpense: async (spaceId: string, expenseId: string): Promise<{ ok: boolean }> => {
    return firestoreDb.deleteExpense(spaceId, expenseId);
  },

  // -------------------------------------------------------------
  // SETTLEMENTS (DIRECT PAYMENTS)
  // -------------------------------------------------------------
  settlements: async (spaceId: string): Promise<SettlementRecord[]> => {
    return firestoreDb.getSettlements(spaceId);
  },

  createSettlement: async (
    spaceId: string,
    body: {
      from_member_id: string;
      to_member_id: string;
      amount: number;
      currency?: string;
      note?: string;
    }
  ): Promise<SettlementRecord> => {
    return firestoreDb.createSettlement(spaceId, body);
  },

  deleteSettlement: async (spaceId: string, settlementId: string): Promise<{ ok: boolean }> => {
    return firestoreDb.deleteSettlement(spaceId, settlementId);
  },

  // -------------------------------------------------------------
  // INVITES
  // -------------------------------------------------------------
  invite: async (spaceId: string): Promise<{ url: string; token: string }> => {
    return firestoreDb.createInvite(spaceId);
  },

  inviteInfo: async (tokenValue: string): Promise<{ space_id: string; title: string; emoji: string }> => {
    return firestoreDb.getInviteInfo(tokenValue);
  },

  join: async (tokenValue: string): Promise<{ space_id: string }> => {
    const user = getCurrentUser();
    if (!user) throw new Error("Authentication required to join space");
    return firestoreDb.joinInvite(tokenValue, user);
  },

  // -------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------
  exportCsvUrl: (spaceId: string) => `/api/gas?action=exportCsv&spaceId=${spaceId}`,
};
