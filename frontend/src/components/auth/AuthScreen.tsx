"use client";
import React, { useState } from "react";
import { api, Member } from "@/lib/api";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { Mail, Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";

export function AuthScreen({
  joinToken,
  onLoggedIn,
  onTryDemo,
  onViewLanding,
}: {
  joinToken?: string;
  onLoggedIn: (user: Member) => void;
  onTryDemo?: () => void;
  onViewLanding?: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">(joinToken ? "register" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  async function handleGoogleLogin() {
    setBusy(true);
    setErr("");
    try {
      const res = await api.loginWithGoogle(name.trim() || undefined);
      onLoggedIn(res.user);
    } catch (ex: any) {
      console.error("Google sign in failed:", ex);
      setErr(ex.message || "Could not sign in with Google. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setErr("Please enter both email and password.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setErr("Please enter your name or username.");
      return;
    }

    setBusy(true);
    setErr("");
    try {
      if (mode === "login") {
        const res = await api.login(email.trim(), password, name.trim() || undefined);
        onLoggedIn(res.user);
      } else {
        const res = await api.register(name.trim(), email.trim(), password);
        onLoggedIn(res.user);
      }
    } catch (ex: any) {
      console.error("Authentication failed:", ex);
      setErr(ex.message || "Authentication failed. Please verify your details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-ambient-glow auth-glow-1" />
      <div className="auth-ambient-glow auth-glow-2" />

      <div className="auth-container">
        <div className="auth-card-pro">
          {/* Header Row */}
          <div className="auth-header-row">
            <div className="auth-brand-badge">
              <div className="brand-logo-glow">
                <img
                  src="/logo.png"
                  alt="SplitSpace Logo"
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="brand-title">SplitSpace</span>
                <span className="brand-badge-pro">PRO</span>
              </div>
            </div>
            <div className="auth-secure-pill">
              <ShieldCheck size={13} />
              <span>Zero Leak Privacy</span>
            </div>
          </div>

          {/* Title & Invite Banner */}
          <div className="auth-title-section">
            {joinToken ? (
              <>
                <h2>You're invited to a Space! 🌴</h2>
                <p>Sign in or create a quick account below to access this shared group space.</p>
              </>
            ) : (
              <>
                <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
                <p>
                  {mode === "login"
                    ? "Manage shared group expenses and settle debts seamlessly."
                    : "Zero ads, instant calculations, and smart debt minimization."}
                </p>
              </>
            )}
          </div>

          {/* Social Login Block */}
          <div className="auth-social-block">
            <button
              type="button"
              className="google-btn-pro"
              onClick={handleGoogleLogin}
              disabled={busy}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.039l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="auth-divider-line">
            <span>or email</span>
          </div>

          {/* Mode Switch Tabs */}
          <div className="auth-segmented-tabs">
            <button
              type="button"
              className={`segmented-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setErr("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`segmented-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => {
                setMode("register");
                setErr("");
              }}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-inputs-stack">
            {mode === "register" && (
              <div className="input-group-pro">
                <label>Your Name</label>
                <div className="input-with-icon">
                  <User size={16} className="field-icon" />
                  <input
                    type="text"
                    placeholder="e.g. Alex Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus={mode === "register"}
                  />
                </div>
              </div>
            )}

            <div className="input-group-pro">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus={mode === "login"}
                />
              </div>
            </div>

            <div className="input-group-pro">
              <div className="label-with-action">
                <label>Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {err && (
              <div className="auth-error-banner">
                <AlertTriangle size={15} style={{ marginRight: 6, flexShrink: 0 }} />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={busy}
            >
              {busy ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div className="btn-spinner" />
                  <span>Processing…</span>
                </div>
              ) : mode === "login" ? (
                "Sign In to Space"
              ) : (
                "Create Free Account"
              )}
            </button>
          </form>

          {/* Quick Demo Access Option */}
          {onTryDemo && (
            <div className="demo-access-card">
              <div className="demo-info">
                <Sparkles size={14} style={{ color: "#e0562e" }} />
                <span>Want to test first?</span>
              </div>
              <button
                type="button"
                className="demo-pill-btn"
                onClick={onTryDemo}
              >
                Try Demo Space →
              </button>
            </div>
          )}

          {/* Link to Marketing Landing Page */}
          {onViewLanding && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                type="button"
                onClick={onViewLanding}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e0562e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
              >
                <span>Curious about features? Explore Landing Page</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
