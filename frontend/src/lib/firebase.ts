import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { Member } from "./api";

// Firebase Configuration from Environment Variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== "undefined") {
  if (isFirebaseConfigured()) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

export { auth, db };

export function mapFirebaseUserToMember(user: FirebaseUser): Member {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "User",
    email: user.email || "",
    role: "owner",
    avatar: user.photoURL || null,
  };
}

export const firebaseAuthService = {
  async loginWithEmail(email: string, pass: string, name?: string): Promise<{ user: Member; token: string }> {
    if (!auth) throw new Error("Firebase is not configured. Please check your credentials in .env.local.");
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (name && name.trim()) {
      try {
        await updateProfile(cred.user, { displayName: name.trim() });
      } catch (e) {
        console.warn("Could not update displayName on login:", e);
      }
    }
    const token = await cred.user.getIdToken();
    const user = mapFirebaseUserToMember({
      ...cred.user,
      displayName: (name && name.trim()) || cred.user.displayName,
    } as FirebaseUser);
    return { user, token };
  },

  async registerWithEmail(name: string, email: string, pass: string): Promise<{ user: Member; token: string }> {
    if (!auth) throw new Error("Firebase is not configured. Please check your credentials in .env.local.");
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    const token = await cred.user.getIdToken();
    const user = mapFirebaseUserToMember({
      ...cred.user,
      displayName: name.trim() || cred.user.displayName,
    } as FirebaseUser);
    return { user, token };
  },

  async loginWithGoogle(): Promise<{ user: Member; token: string }> {
    if (!auth) throw new Error("Firebase is not configured. Please check your credentials in .env.local.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    const token = await cred.user.getIdToken();
    const user = mapFirebaseUserToMember(cred.user);
    return { user, token };
  },

  async logout(): Promise<void> {
    if (auth) {
      await firebaseSignOut(auth);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("splitspace_token");
      localStorage.removeItem("splitspace_user");
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    if (!auth) throw new Error("Firebase is not configured. Please check your credentials in .env.local.");
    await firebaseSendPasswordResetEmail(auth, email);
  },

  onAuthChange(callback: (user: Member | null) => void): () => void {
    if (!auth) {
      const cached = typeof window !== "undefined" ? localStorage.getItem("splitspace_user") : null;
      if (cached) {
        try {
          callback(JSON.parse(cached));
        } catch {
          callback(null);
        }
      } else {
        callback(null);
      }
      return () => {};
    }

    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const member = mapFirebaseUserToMember(fbUser);
        const token = await fbUser.getIdToken();
        localStorage.setItem("splitspace_token", token);
        localStorage.setItem("splitspace_user", JSON.stringify(member));
        callback(member);
      } else {
        localStorage.removeItem("splitspace_token");
        localStorage.removeItem("splitspace_user");
        callback(null);
      }
    });
  },
};
