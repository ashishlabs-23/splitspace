"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, ArrowRight } from "lucide-react";
import { Member, api } from "@/lib/api";
import { validateUsername, getFriendlyAuthErrorMessage } from "@/lib/validation";
import { firestoreDb } from "@/lib/firestore-db";
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";

interface UsernameSetupScreenProps {
  user: Member;
  onComplete: (user: Member) => void;
  onLogout: () => void;
}

export function UsernameSetupScreen({
  user,
  onComplete,
  onLogout,
}: UsernameSetupScreenProps) {
  const [username, setUsername] = useState(
    user.name && user.name.toLowerCase() !== "user" ? user.name : ""
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateUsername(username);
    if (!validation.valid) {
      setErr(validation.error || "Please enter a valid username (2-30 characters).");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      if (auth && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: validation.sanitized });
      }

      const updatedUser: Member = {
        ...user,
        name: validation.sanitized,
      };

      await firestoreDb.syncUser({
        id: updatedUser.id,
        email: updatedUser.email,
        name: validation.sanitized,
        avatar: updatedUser.avatar,
        emailVerified: updatedUser.emailVerified,
        authProvider: updatedUser.authProvider,
      });

      onComplete(updatedUser);
    } catch (e: any) {
      setErr(getFriendlyAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #0a1128 100%)",
        padding: "24px 16px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          padding: "36px 30px",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.35)",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            background: "linear-gradient(135deg, #e0562e 0%, #f97316 100%)",
            color: "#ffffff",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 18px",
            boxShadow: "0 8px 24px rgba(224, 86, 46, 0.35)",
          }}
        >
          <UserCheck size={28} />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
          Choose Your Username
        </h2>
        <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 22px", lineHeight: 1.5 }}>
          A username is compulsory to track your splits and settlements in group spaces.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Username <span style={{ color: "#e0562e" }}>*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1.5px solid #e5e7eb",
                borderRadius: 11,
                padding: "10px 13px",
                fontSize: 13.5,
                color: "#1e2029",
                outline: "none",
                boxSizing: "border-box",
              }}
              className="focus:border-orange-500"
            />
          </div>

          {err && (
            <div style={{ color: "#b91c1c", fontSize: 12, background: "#fef2f2", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: 10, marginBottom: 14 }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              background: "#e0562e",
              color: "#ffffff",
              border: "none",
              borderRadius: 11,
              padding: "11px",
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(224, 86, 46, 0.35)",
              marginBottom: 14,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Saving…" : "Save & Continue"} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
