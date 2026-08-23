import { firebaseAuthService, isFirebaseConfigured } from "./firebase";
import { firestoreDb } from "./firestore-db";
import { validateUsername, validateEmail, validatePassword } from "./validation";

export type MemberRole = "owner" | "admin" | "member";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  avatar?: string | null;
  emailVerified?: boolean;
  authProvider?: "password" | "google";
  userUid?: string | null;
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
  updated_at?: string;
  created_by_uid?: string;
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
  updated_at?: string;
  created_by_uid?: string;
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

function requireFirebaseConfigured() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase configuration is missing. Add the required keys to `frontend/.env.local`.");
  }
}

function getCurrentUser(): Member | null {
  return firebaseAuthService.getCurrentUser();
}

async function syncCurrentUser(user: Member) {
  await firestoreDb.syncUser({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    authProvider: user.authProvider,
  });
}

export const api = {
  login: async (email: string, password: string, name?: string): Promise<{ access_token: string; user: Member }> => {
    requireFirebaseConfigured();
    const emailRes = validateEmail(email);
    if (!emailRes.valid) throw new Error(emailRes.error);

    const res = await firebaseAuthService.loginWithEmail(emailRes.normalized, password, name);
    await syncCurrentUser(res.user);
    return { access_token: res.token, user: res.user };
  },

  loginWithGoogle: async (name?: string): Promise<{ access_token: string; user: Member }> => {
    requireFirebaseConfigured();
    const res = await firebaseAuthService.loginWithGoogle(name);
    await syncCurrentUser(res.user);
    return { access_token: res.token, user: res.user };
  },

  register: async (name: string, email: string, password: string): Promise<{ access_token: string; user: Member }> => {
    requireFirebaseConfigured();

    const userRes = validateUsername(name);
    if (!userRes.valid) throw new Error(userRes.error);

    const emailRes = validateEmail(email);
    if (!emailRes.valid) throw new Error(emailRes.error);

    const passRes = validatePassword(password);
    if (!passRes.valid) throw new Error(passRes.error);

    const res = await firebaseAuthService.registerWithEmail(userRes.sanitized, emailRes.normalized, password);
    await syncCurrentUser(res.user);
    return { access_token: res.token, user: res.user };
  },

  resendVerificationEmail: async (): Promise<{ message: string; ok: boolean }> => {
    requireFirebaseConfigured();
    await firebaseAuthService.resendVerificationEmail();
    return { message: "Verification email sent. Please check your inbox.", ok: true };
  },

  reloadUser: async (): Promise<Member | null> => {
    requireFirebaseConfigured();
    return firebaseAuthService.reloadUser();
  },

  logout: async (): Promise<{ message: string; ok: boolean }> => {
    await firebaseAuthService.logout();
    return { message: "Logged out successfully", ok: true };
  },

  forgotPassword: async (email: string): Promise<{ message: string; ok: boolean }> => {
    requireFirebaseConfigured();
    const emailRes = validateEmail(email);
    if (!emailRes.valid) throw new Error(emailRes.error);

    try {
      await firebaseAuthService.sendPasswordReset(emailRes.normalized);
    } catch {}

    return { message: "If an account exists with this email, a password reset link has been sent.", ok: true };
  },

  resetPassword: async (_token: string, _new_pass: string) => {
    return { message: "Password reset completed", ok: true };
  },

  me: async (): Promise<Member> => {
    const user = getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    return user;
  },

  spaces: async (): Promise<Space[]> => {
    requireFirebaseConfigured();
    const user = getCurrentUser();
    if (!user) return [];
    return firestoreDb.getSpaces(user.id, user.email, user.name);
  },

  space: async (id: string): Promise<Space> => {
    requireFirebaseConfigured();
    const user = getCurrentUser();
    return firestoreDb.getSpace(id, user?.name, user?.email, user?.id);
  },

  createSpace: async (body: Pick<Space, "title" | "emoji" | "period" | "currency">): Promise<Space> => {
    requireFirebaseConfigured();
    const user = getCurrentUser();
    if (!user) throw new Error("Authentication required to create a space");
    return firestoreDb.createSpace(body, user);
  },

  deleteSpace: async (spaceId: string): Promise<{ ok: boolean }> => {
    requireFirebaseConfigured();
    return firestoreDb.deleteSpace(spaceId);
  },

  leaveSpace: async (spaceId: string): Promise<{ ok: boolean }> => {
    requireFirebaseConfigured();
    const user = getCurrentUser();
    if (!user) return { ok: true };
    return firestoreDb.leaveSpace(spaceId, user);
  },

  addMember: async (spaceId: string, body: { name: string; email: string }): Promise<Member> => {
    requireFirebaseConfigured();
    return firestoreDb.addMember(spaceId, body);
  },

  summary: async (spaceId: string): Promise<Summary> => {
    requireFirebaseConfigured();
    const user = getCurrentUser();
    return firestoreDb.getSummary(spaceId, user?.id, user?.email);
  },

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
    requireFirebaseConfigured();
    const user = getCurrentUser();
    if (!user) throw new Error("Authentication required to add an expense");
    return firestoreDb.createExpense(spaceId, body, user);
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
    requireFirebaseConfigured();
    const user = getCurrentUser();
    if (!user) throw new Error("Authentication required to update an expense");
    return firestoreDb.updateExpense(spaceId, expenseId, body, user);
  },

  deleteExpense: async (spaceId: string, expenseId: string): Promise<{ ok: boolean }> => {
    requireFirebaseConfigured();
    return firestoreDb.deleteExpense(spaceId, expenseId);
  },

  settlements: async (spaceId: string): Promise<SettlementRecord[]> => {
    requireFirebaseConfigured();
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
    requireFirebaseConfigured();
    const user = getCurrentUser();
    if (!user) throw new Error("Authentication required to record a settlement");
    return firestoreDb.createSettlement(spaceId, body, user);
  },

  deleteSettlement: async (spaceId: string, settlementId: string): Promise<{ ok: boolean }> => {
    requireFirebaseConfigured();
    return firestoreDb.deleteSettlement(spaceId, settlementId);
  },

  invite: async (spaceId: string): Promise<{ url: string; token: string }> => {
    requireFirebaseConfigured();
    const user = getCurrentUser();
    if (!user) throw new Error("Authentication required to create an invite");
    return firestoreDb.createInvite(spaceId, user);
  },

  inviteInfo: async (tokenValue: string): Promise<{ space_id: string; title: string; emoji: string }> => {
    requireFirebaseConfigured();
    return firestoreDb.getInviteInfo(tokenValue);
  },

  join: async (tokenValue: string): Promise<{ space_id: string }> => {
    requireFirebaseConfigured();
    const user = getCurrentUser();
    if (!user) throw new Error("Authentication required to join space");
    return firestoreDb.joinInvite(tokenValue, user);
  },
};
