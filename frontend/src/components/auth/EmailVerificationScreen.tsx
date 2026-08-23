"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, RefreshCw, LogOut, ArrowRight, ShieldCheck } from "lucide-react";
import { Member, api } from "@/lib/api";
import { getFriendlyAuthErrorMessage } from "@/lib/validation";

interface EmailVerificationScreenProps {
  user: Member;
  onVerified: (user: Member) => void;
  onLogout: () => void;
}

export function EmailVerificationScreen({
  user,
  onVerified,
  onLogout,
}: EmailVerificationScreenProps) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const handleCheckStatus = async () => {
    setChecking(true);
    setErr("");
    setMsg("");
    try {
      const refreshed = await api.reloadUser();
      if (refreshed && refreshed.emailVerified) {
        setMsg("Email verified successfully! Redirecting to your spaces…");
        setTimeout(() => {
          onVerified(refreshed);
        }, 800);
      } else {
        setErr("Email is not verified yet. Please check your inbox and click the verification link.");
      }
    } catch (e: any) {
      setErr(getFriendlyAuthErrorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setErr("");
    setMsg("");
    try {
      await api.resendVerificationEmail();
      setMsg(`A new verification link has been sent to ${user.email}.`);
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      setErr(getFriendlyAuthErrorMessage(e));
    } finally {
      setResending(false);
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
          maxWidth: 480,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.35)",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: "linear-gradient(135deg, #e0562e 0%, #f97316 100%)",
            color: "#ffffff",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
            boxShadow: "0 10px 28px rgba(224, 86, 46, 0.35)",
          }}
        >
          <Mail size={36} />
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
          Verify Your Email
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 20px", lineHeight: 1.5 }}>
          Welcome, <strong style={{ color: "#0f172a" }}>{user.name}</strong>! For security and account recovery, email verification is required before accessing protected spaces.
        </p>

        {/* Email Box */}
        <div
          style={{
            background: "#f1f5f9",
            borderRadius: 14,
            padding: "12px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#334155",
            wordBreak: "break-all",
          }}
        >
          <ShieldCheck size={18} color="#e0562e" />
          <span>{user.email}</span>
        </div>

        {/* Feedback Message */}
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </motion.div>
        )}

        {/* Error Message */}
        {err && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {err}
          </motion.div>
        )}

        {/* Primary Action: Check Verification Status */}
        <button
          type="button"
          onClick={handleCheckStatus}
          disabled={checking}
          style={{
            width: "100%",
            background: "#e0562e",
            color: "#ffffff",
            border: "none",
            borderRadius: 14,
            padding: "13px 20px",
            fontSize: 14.5,
            fontWeight: 700,
            cursor: checking ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(224, 86, 46, 0.35)",
            marginBottom: 12,
            transition: "all 0.2s",
            opacity: checking ? 0.7 : 1,
          }}
        >
          <RefreshCw size={17} className={checking ? "animate-spin" : ""} />
          {checking ? "Checking verification status…" : "I've Verified My Email"}
        </button>

        {/* Secondary Action: Resend Link */}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          style={{
            width: "100%",
            background: "#ffffff",
            color: "#334155",
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            padding: "11px 18px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: resending || cooldown > 0 ? "not-allowed" : "pointer",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: resending || cooldown > 0 ? 0.6 : 1,
          }}
        >
          <Mail size={15} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Verification Email"}
        </button>

        {/* Sign Out Option */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <LogOut size={14} />
            Use a different account or sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
