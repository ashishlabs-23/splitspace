"use client";

import { getApp } from "firebase/app";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export interface FcmTokenResult {
  token: string | null;
  permission: NotificationPermission | "unsupported";
  error?: string;
}

/**
 * Checks whether Firebase Cloud Messaging is supported in the current environment
 */
export async function isFcmSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }
  if (!isFirebaseConfigured()) return false;

  try {
    const { isSupported } = await import("firebase/messaging");
    return await isSupported();
  } catch {
    return false;
  }
}

/**
 * Requests browser notification permission, initializes FCM, and registers the device token in Firestore
 */
export async function requestFcmToken(userId?: string): Promise<FcmTokenResult> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { token: null, permission: "unsupported", error: "Push notifications are not supported in this browser." };
  }

  const supported = await isFcmSupported();
  if (!supported) {
    return { token: null, permission: "unsupported", error: "FCM is not supported in this browser environment." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { token: null, permission, error: "Notification permission was not granted." };
    }

    const { getMessaging, getToken } = await import("firebase/messaging");
    const app = getApp();
    const messaging = getMessaging(app);

    // Register or get existing service worker registration
    let registration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" }).catch(() => undefined);
    }

    // Retrieve FCM token (using project messagingSenderId)
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
    });

    if (token && userId && db) {
      // Store token under users/{userId}/fcm_tokens/{tokenId} for targeted group notifications
      const tokenDocId = token.slice(-24).replace(/[^a-zA-Z0-9_-]/g, "_");
      await setDoc(
        doc(db, "users", userId, "fcm_tokens", tokenDocId),
        {
          token,
          user_id: userId,
          platform: navigator.platform || "unknown",
          user_agent: navigator.userAgent || "unknown",
          updated_at: new Date().toISOString(),
          last_active: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => console.warn("Failed to store FCM token in Firestore:", err));
    }

    return { token, permission: "granted" };
  } catch (err: any) {
    console.warn("FCM registration error:", err);
    return { token: null, permission: Notification.permission, error: err.message || "Failed to initialize FCM token." };
  }
}

/**
 * Listens for FCM push notifications when the SplitSpace tab is active in the foreground
 */
export async function listenToForegroundNotifications(
  onNotification: (payload: { title: string; body: string; data?: any }) => void
): Promise<(() => void) | null> {
  if (typeof window === "undefined") return null;
  const supported = await isFcmSupported();
  if (!supported) return null;

  try {
    const { getMessaging, onMessage } = await import("firebase/messaging");
    const app = getApp();
    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "SplitSpace Notification";
      const body = payload.notification?.body || "New activity detected in your space.";
      onNotification({ title, body, data: payload.data });
    });

    return unsubscribe;
  } catch (err) {
    console.warn("Foreground notification listener error:", err);
    return null;
  }
}

/**
 * Triggers a local browser test notification to immediately verify audio/visual push output
 */
export async function sendLocalTestNotification(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification("SplitSpace Push Alert", {
          body: "🔔 Push Notifications via Firebase Cloud Messaging are configured and active!",
          icon: "/icon.png",
          badge: "/icon.svg",
          tag: "splitspace-test",
        });
        return true;
      } else {
        new Notification("SplitSpace Push Alert", {
          body: "🔔 Push Notifications via Firebase Cloud Messaging are configured and active!",
          icon: "/icon.png",
        });
        return true;
      }
    } catch (err) {
      console.warn("Test notification failed:", err);
      return false;
    }
  }
  return false;
}
