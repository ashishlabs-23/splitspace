import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification,
  reload,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import type { Member } from "./api";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== "undefined" && isFirebaseConfigured()) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };

export function mapFirebaseUserToMember(user: FirebaseUser): Member {
  const isGoogle = user.providerData?.some((provider) => provider.providerId === "google.com") || false;

  return {
    id: user.uid,
    name: user.displayName?.trim() || user.email?.split("@")[0] || "User",
    email: (user.email || "").toLowerCase().trim(),
    role: "owner",
    avatar: user.photoURL || null,
    emailVerified: Boolean(user.emailVerified || isGoogle),
    authProvider: isGoogle ? "google" : "password",
    userUid: user.uid,
  };
}

export const firebaseAuthService = {
  async loginWithEmail(email: string, pass: string, name?: string): Promise<{ user: Member; token: string }> {
    if (!auth) throw new Error("Firebase is not configured. Please check `frontend/.env.local`.");
    const normalizedEmail = email.toLowerCase().trim();
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);

    if (name?.trim() && name.trim() !== cred.user.displayName) {
      try {
        await updateProfile(cred.user, { displayName: name.trim() });
      } catch (error) {
        console.warn("Could not update display name on login:", error);
      }
    }

    const token = await cred.user.getIdToken();
    const user = mapFirebaseUserToMember({
      ...cred.user,
      displayName: name?.trim() || cred.user.displayName,
    } as FirebaseUser);

    return { user, token };
  },

  async registerWithEmail(name: string, email: string, pass: string): Promise<{ user: Member; token: string }> {
    if (!auth) throw new Error("Firebase is not configured. Please check `frontend/.env.local`.");
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);

    if (trimmedName) {
      await updateProfile(cred.user, { displayName: trimmedName });
    }

    try {
      await sendEmailVerification(cred.user);
    } catch (error) {
      console.warn("Could not send email verification automatically:", error);
    }

    const token = await cred.user.getIdToken();
    const user = mapFirebaseUserToMember({
      ...cred.user,
      displayName: trimmedName || cred.user.displayName,
    } as FirebaseUser);

    return { user, token };
  },

  async loginWithGoogle(customName?: string): Promise<{ user: Member; token: string }> {
    if (!auth) throw new Error("Firebase is not configured. Please check `frontend/.env.local`.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);

    const chosenName = customName?.trim() || cred.user.displayName || cred.user.email?.split("@")[0] || "User";
    if (customName?.trim() && customName.trim() !== cred.user.displayName) {
      try {
        await updateProfile(cred.user, { displayName: customName.trim() });
      } catch (error) {
        console.warn("Could not update display name on Google login:", error);
      }
    }

    const token = await cred.user.getIdToken();
    const user = mapFirebaseUserToMember({
      ...cred.user,
      displayName: chosenName,
    } as FirebaseUser);

    return { user, token };
  },

  async logout(): Promise<void> {
    if (auth) {
      await firebaseSignOut(auth);
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    if (!auth) throw new Error("Firebase is not configured. Please check `frontend/.env.local`.");
    await firebaseSendPasswordResetEmail(auth, email.toLowerCase().trim());
  },

  async resendVerificationEmail(): Promise<void> {
    if (!auth?.currentUser) throw new Error("No authenticated user to send verification email to.");
    await sendEmailVerification(auth.currentUser);
  },

  async reloadUser(): Promise<Member | null> {
    if (!auth?.currentUser) return null;
    await reload(auth.currentUser);
    return mapFirebaseUserToMember(auth.currentUser);
  },

  getCurrentUser(): Member | null {
    if (!auth?.currentUser) return null;
    return mapFirebaseUserToMember(auth.currentUser);
  },

  onAuthChange(callback: (user: Member | null) => void): () => void {
    if (!auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, (fbUser) => {
      callback(fbUser ? mapFirebaseUserToMember(fbUser) : null);
    });
  },
};
