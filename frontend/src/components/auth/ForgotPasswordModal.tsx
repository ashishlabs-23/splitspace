"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Overlay } from "@/components/ui/overlay";
import { X, CheckCircle2, AlertTriangle, Mail } from "lucide-react";

export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSendReset() {
    if (!email.trim()) {
      setErr("Please enter your registered email address.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (ex: any) {
      setErr(ex.message || "Failed to send reset link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Overlay onClose={onClose} label="Reset Password">
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>Reset Password</h2>
            <p>Recover access to your SplitSpace account.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="form">
          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ color: "var(--teal)", display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <CheckCircle2 size={44} />
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, fontWeight: 600 }}>Reset Link Sent!</h3>
              <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
                We have sent instructions and a secure password reset link to <strong>{email}</strong>. Check your inbox and spam folder.
              </p>
              <button className="btn primary w-full" onClick={onClose}>
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
                Enter the email associated with your account, and we will send you a link to reset your password.
              </p>

              <label>
                Your Email Address
                <input
                  type="email"
                  autoFocus
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErr("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReset()}
                />
              </label>

              {err && (
                <div className="form-error">
                  <AlertTriangle size={15} />
                  <span>{err}</span>
                </div>
              )}

              <div className="modal-actions">
                <button className="btn ghost" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button
                  className="btn primary"
                  onClick={handleSendReset}
                  disabled={busy}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Mail size={16} />
                  {busy ? "Sending…" : "Send Reset Link"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Overlay>
  );
}
