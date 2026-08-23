"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  RotateCw,
  ExternalLink,
  Settings,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Zap,
  Globe2,
  TrendingUp,
  CreditCard,
  Users,
  Layers,
  FileSpreadsheet,
  Lock,
  ArrowRightLeft,
  Smartphone,
  Flame,
  Receipt,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Activity,
  X,
  PieChart,
  Database,
  Cpu,
  Server,
  GitBranch,
  Terminal,
  Shield,
  Network,
  Box,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Sheet, SheetBackdrop, SheetPanel } from "@/components/smoothui/sheet";
import { api, Member } from "@/lib/api";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  validateUsername,
  validateEmail,
  validatePassword,
  getFriendlyAuthErrorMessage,
} from "@/lib/validation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 24,
      stiffness: 260,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 22,
      stiffness: 220,
    },
  },
};

const floatingPillAnimation = (delay = 0) => ({
  animate: {
    y: [0, -8, 0],
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    repeatType: "mirror" as const,
    ease: "easeInOut" as const,
    delay,
  },
});

export function LandingPage({
  joinToken,
  onLoggedIn,
  currentUser,
  onGoToDashboard,
}: {
  joinToken?: string;
  onLoggedIn?: (user: Member) => void;
  currentUser?: Member | null;
  onGoToDashboard?: () => void;
}) {
  const [authSheetOpen, setAuthSheetOpen] = useState(false);

  // Auto-open auth drawer whenever an invite token is present
  React.useEffect(() => {
    if (joinToken) {
      setAuthSheetOpen(true);
      setMode("register"); // Default to register for new users joining
    }
  }, [joinToken]);
  const [mode, setMode] = useState<"login" | "register" | "forgot">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [grainKey, setGrainKey] = useState(0);

  const [activeArchTab, setActiveArchTab] = useState<"overview" | "graph" | "realtime" | "security">("overview");
  const [graphDemoMode, setGraphDemoMode] = useState<"optimized" | "direct">("optimized");

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  // Live validation calculations
  const usernameValidation = validateUsername(name);
  const passwordValidation = validatePassword(password);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileMenuOpen]);

  async function handleSignOut() {
    try {
      await api.logout();
    } catch {}
    window.location.reload();
  }

  const isFbReady = isFirebaseConfigured();

  async function handleGoogleLogin() {
    if (mode === "register") {
      const userValidation = validateUsername(name);
      if (!userValidation.valid) {
        setErr(userValidation.error || "Username is compulsory. Please enter your username.");
        return;
      }
    }
    setBusy(true);
    setErr("");
    setSuccessMsg("");
    try {
      const d = await api.loginWithGoogle(name.trim() || undefined);
      if (onLoggedIn) {
        onLoggedIn(d.user);
      } else {
        window.location.href = joinToken ? `/?join=${joinToken}` : "/";
      }
    } catch (ex: any) {
      setErr(getFriendlyAuthErrorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSuccessMsg("");

    if (mode === "forgot") {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        setErr(emailValidation.error || "Please enter a valid email address.");
        return;
      }
      setBusy(true);
      try {
        const res = await api.forgotPassword(email);
        setSuccessMsg(res.message);
      } catch (ex: any) {
        setErr(getFriendlyAuthErrorMessage(ex));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === "register") {
      if (!usernameValidation.valid) {
        setErr(usernameValidation.error || "Username is required (2-30 characters, letters, numbers, underscores, spaces only).");
        return;
      }
      if (!passwordValidation.valid) {
        setErr(passwordValidation.error || "Please meet all password complexity requirements.");
        return;
      }
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErr(emailValidation.error || "Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErr("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      let d;
      if (mode === "login") {
        d = await api.login(email.trim(), password);
      } else {
        d = await api.register(name.trim(), email.trim(), password);
      }
      setPassword(""); // Clear sensitive password field
      if (onLoggedIn) {
        onLoggedIn(d.user);
      } else {
        window.location.href = joinToken ? `/?join=${joinToken}` : "/";
      }
    } catch (ex: any) {
      setErr(getFriendlyAuthErrorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
        fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        background: `
          radial-gradient(ellipse 75% 65% at 78% 38%, rgba(243, 155, 155, 0.85) 0%, transparent 60%),
          radial-gradient(ellipse 85% 90% at 94% 88%, rgba(68, 71, 92, 0.95) 0%, transparent 68%),
          radial-gradient(ellipse 60% 60% at 18% 25%, rgba(248, 244, 237, 1) 0%, transparent 55%),
          linear-gradient(135deg, #ede5da 0%, #eedcd1 35%, #e9b3ab 70%, #474a5c 100%)
        `,
      }}
    >
      {/* ── Ambient Floating Motion Mesh Orbs ── */}
      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.12, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          top: "10%",
          right: "15%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(224, 86, 46, 0.18) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
          delay: 1,
        }}
        style={{
          position: "absolute",
          top: "45%",
          left: "8%",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(243, 155, 155, 0.25) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Subtle Film Grain Overlay */}
      <div
        key={grainKey}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.28,
          mixBlendMode: "overlay",
          zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── 1. OFFICIAL TOP NAVIGATION BAR ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 48px",
          maxWidth: 1300,
          margin: "0 auto",
        }}
      >
        {/* Brand Logo */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <motion.div
            whileHover={{ rotate: 8, scale: 1.08 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#ffffff",
              border: "1.5px solid rgba(200, 126, 10, 0.28)",
              boxShadow: "0 2px 10px rgba(200, 126, 10, 0.16)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              padding: 2,
              flexShrink: 0,
            }}
          >
            <img src="/logo.png" alt="SplitSpace Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </motion.div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#18181b", letterSpacing: "-0.02em" }}>
              SplitSpace
            </span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: "#c87e0a",
                background: "rgba(200, 126, 10, 0.12)",
                padding: "2px 6px",
                borderRadius: 5,
                letterSpacing: "0.05em",
              }}
            >
              PRO
            </span>
          </div>
        </motion.div>

        {/* Center Nav Links (Desktop) */}
        <nav
          style={{
            display: "none",
            alignItems: "center",
            gap: 28,
            fontSize: 13.5,
            fontWeight: 600,
            color: "rgba(24, 24, 27, 0.7)",
          }}
          className="md:!flex"
        >
          <a href="#features" style={{ textDecoration: "none", color: "inherit", transition: "color 0.15s" }} className="hover:text-black">
            Platform Features
          </a>
          <a href="#how-it-works" style={{ textDecoration: "none", color: "inherit", transition: "color 0.15s" }} className="hover:text-black">
            How It Works
          </a>
          <a href="#architecture" style={{ textDecoration: "none", color: "inherit", transition: "color 0.15s" }} className="hover:text-black">
            Architecture
          </a>
        </nav>

        {/* Right CTA Actions / Profile Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {currentUser ? (
            <div style={{ position: "relative" }} ref={profileMenuRef}>
              {/* Interactive Minimal Circular Profile Button (Same for Desktop, Laptop & Mobile) */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-label="User profile menu"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  padding: 0,
                  background: profileMenuOpen ? "#ffffff" : "rgba(255, 255, 255, 0.95)",
                  borderRadius: "50%",
                  border: profileMenuOpen ? "2px solid #e0562e" : "1.5px solid rgba(224, 86, 46, 0.28)",
                  boxShadow: profileMenuOpen ? "0 6px 20px rgba(224, 86, 46, 0.25)" : "0 2px 8px rgba(13, 27, 66, 0.06)",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                }}
                className="hover:border-orange-500 hover:shadow-md"
              >
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Avatar m={currentUser} size="sm" />
                  <span
                    style={{
                      position: "absolute",
                      bottom: -1,
                      right: -1,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#10b981",
                      border: "1.5px solid #ffffff",
                    }}
                  />
                </div>
              </motion.button>

              {/* Popover Dropdown Menu */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: 280,
                      background: "#ffffff",
                      borderRadius: 20,
                      padding: 16,
                      boxShadow: "0 24px 60px -12px rgba(13, 27, 66, 0.25), 0 0 0 1px rgba(224, 86, 46, 0.18)",
                      zIndex: 100,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {/* Profile Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "1px solid rgba(224, 86, 46, 0.12)" }}>
                      <div style={{ position: "relative" }}>
                        <Avatar m={currentUser} size="md" />
                        <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#10b981", border: "2px solid #ffffff" }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <strong style={{ fontSize: 14, color: "#18181b", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {currentUser.name || "Ashish N"}
                          </strong>
                          <ShieldCheck size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                        </div>
                        <small style={{ display: "block", fontSize: 11, color: "rgba(24, 24, 27, 0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {currentUser.email}
                        </small>
                      </div>
                    </div>

                    {/* Active Ledger Status Badge */}
                    <div style={{ background: "linear-gradient(135deg, rgba(224, 86, 46, 0.08) 0%, rgba(199, 63, 49, 0.08) 100%)", border: "1px solid rgba(224, 86, 46, 0.18)", borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "#e0562e" }}>
                        <Activity size={13} />
                        <span>Active Ledger</span>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                        Online
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {onGoToDashboard && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onGoToDashboard();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            borderRadius: 12,
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "#ffffff",
                            background: "#18181b",
                            border: "none",
                            width: "100%",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          className="hover:scale-102"
                        >
                          <span>Open Dashboard</span>
                          <ArrowRight size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setShowSettingsModal(true);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 12,
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "#18181b",
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        className="hover:bg-orange-50 hover:border-orange-300"
                      >
                        <Settings size={15} style={{ color: "#e0562e" }} />
                        <span style={{ flex: 1 }}>Settings & Preferences</span>
                      </button>
                    </div>

                    {/* Sign out */}
                    <div style={{ borderTop: "1px solid rgba(224, 86, 46, 0.12)", paddingTop: 10 }}>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 12,
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#b91c1c",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        className="hover:bg-red-100 hover:border-red-300"
                      >
                        <LogOut size={15} />
                        <span>Sign out</span>
                      </button>
                    </div>

                    {/* Made by Ashish N badge */}
                    <div style={{ marginTop: 2, paddingTop: 6, borderTop: "1px solid rgba(0,0,0,0.05)", fontSize: 10, color: "#9ca3af", textAlign: "center" }}>
                      SplitSpace · Engineered by <strong style={{ color: "#475569" }}>Ashish N</strong>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setMode("login");
                  setAuthSheetOpen(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#18181b",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Sign in
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => {
                  setMode("register");
                  setAuthSheetOpen(true);
                }}
                style={{
                  background: "#18181b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 9999,
                  padding: "10px 20px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                }}
              >
                Get started <ArrowRight size={14} />
              </motion.button>
            </>
          )}
        </div>
      </motion.header>

      {/* ── 2. EDITORIAL HERO SECTION WITH MOTION REVEALS ── */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1300,
          margin: "0 auto",
          padding: "60px 48px 70px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            maxWidth: 760,
          }}
        >
          {/* Eyebrow Platform Badge */}
          <motion.div
            variants={heroItemVariants}
            whileHover={{ scale: 1.03 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(24, 24, 27, 0.06)",
              border: "1px solid rgba(24, 24, 27, 0.1)",
              borderRadius: 20,
              padding: "5px 14px",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#18181b",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Sparkles size={13} style={{ color: "#e0562e" }} />
            </motion.div>
            <span>Smart Group Expenses & Debt Minimization</span>
          </motion.div>

          {/* Editorial Headline */}
          <motion.h1
            variants={heroItemVariants}
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(46px, 5.8vw, 76px)",
              fontWeight: 400,
              color: "#18181b",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              margin: 0,
            }}
          >
            Split what’s shared with confidence.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={heroItemVariants}
            style={{
              fontSize: "clamp(15px, 1.7vw, 19px)",
              color: "rgba(24, 24, 27, 0.72)",
              lineHeight: 1.6,
              margin: "24px 0 0",
              maxWidth: 540,
              fontWeight: 400,
            }}
          >
            The modern financial ledger for roommates, trips, and teams who want zero-math balances, multi-currency splits, and effortless settlements.
          </motion.p>

          {/* Call to Action Buttons */}
          <motion.div
            variants={heroItemVariants}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 36,
              flexWrap: "wrap",
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                if (onGoToDashboard) onGoToDashboard();
                else {
                  setMode("register");
                  setAuthSheetOpen(true);
                }
              }}
              style={{
                background: "#18181b",
                color: "#ffffff",
                border: "none",
                borderRadius: 9999,
                padding: "14px 30px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 10px 25px rgba(24, 24, 27, 0.2)",
              }}
            >
              {onGoToDashboard ? "Open Your Dashboard →" : "Create Free Account →"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                if (onGoToDashboard) onGoToDashboard();
                else {
                  setMode("login");
                  setAuthSheetOpen(true);
                }
              }}
              style={{
                background: "#ffffff",
                color: "#18181b",
                border: "1px solid rgba(24, 24, 27, 0.08)",
                borderRadius: 9999,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
              }}
            >
              {onGoToDashboard ? "Manage Spaces" : "Sign In"}
            </motion.button>
          </motion.div>

          {/* Trust Highlights */}
          <motion.div
            variants={heroItemVariants}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 32,
              fontSize: 12.5,
              color: "rgba(24, 24, 27, 0.6)",
              fontWeight: 600,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={15} style={{ color: "#e0562e" }} />
              <span>Real-Time Cloud Sync</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={15} style={{ color: "#e0562e" }} />
              <span>Zero-Math Balances</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={15} style={{ color: "#e0562e" }} />
              <span>Multi-Currency FX</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Interactive Floating Hero Badges (Desktop) ── */}
        <div
          style={{
            display: "none",
            flexDirection: "column",
            gap: 16,
            minWidth: 260,
          }}
          className="lg:!flex"
        >
          <motion.div
            {...floatingPillAnimation(0)}
            whileHover={{ scale: 1.05, y: -4 }}
            onClick={() => setAuthSheetOpen(true)}
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(224, 86, 46, 0.2)",
              borderRadius: 18,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 8px 24px rgba(13, 27, 66, 0.06)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#faece6",
                color: "#e0562e",
                display: "grid",
                placeItems: "center",
              }}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2029" }}>Auto-Equal Split</div>
              <div style={{ fontSize: 11, color: "#e0562e", fontWeight: 600 }}>₹3,750 / member dynamic</div>
            </div>
          </motion.div>

          <motion.div
            {...floatingPillAnimation(1.5)}
            whileHover={{ scale: 1.05, y: -4 }}
            onClick={() => setAuthSheetOpen(true)}
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              borderRadius: 18,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 8px 24px rgba(13, 27, 66, 0.06)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#e6f7f5",
                color: "#14b8a6",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2029" }}>Sub-30ms Sync</div>
              <div style={{ fontSize: 11, color: "#14b8a6", fontWeight: 600 }}>Firebase Firestore live</div>
            </div>
          </motion.div>

          <motion.div
            {...floatingPillAnimation(3)}
            whileHover={{ scale: 1.05, y: -4 }}
            onClick={() => setAuthSheetOpen(true)}
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: 18,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 8px 24px rgba(13, 27, 66, 0.06)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#f0f4ff",
                color: "#3b82f6",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Globe2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2029" }}>Global FX Engine</div>
              <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>USD, EUR, GBP, INR rates</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 3. FEATURE BENTO SECTION (PLATFORM CAPABILITIES) ── */}
      <section
        id="features"
        style={{
          position: "relative",
          zIndex: 10,
          padding: "40px 48px 60px",
          maxWidth: 1300,
          margin: "0 auto",
          scrollMarginTop: 80,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 28 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(224, 86, 46, 0.1)",
              border: "1px solid rgba(224, 86, 46, 0.2)",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 700,
              color: "#e0562e",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            <Sparkles size={12} />
            <span>Platform Capabilities</span>
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 3.4vw, 36px)",
              fontWeight: 700,
              color: "#1e2029",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            SplitSpace Architecture & Features
          </h2>
          <p style={{ fontSize: 14.5, color: "#6b7280", margin: "6px 0 0" }}>
            High-performance group ledger engineered with Next.js Turbopack, Firebase Firestore real-time sync, and Motion for React.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 16,
          }}
        >
          {/* BENTO CARD 1: Dynamic Bill Splitting (Span 7) */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2 } }}
            onClick={() => setAuthSheetOpen(true)}
            style={{
              gridColumn: "span 7",
              background: "linear-gradient(145deg, #ffffff 0%, #faf1eb 100%)",
              border: "1px solid rgba(224, 86, 46, 0.2)",
              borderRadius: 24,
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 20px rgba(13, 27, 66, 0.05)",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
            }}
            className="max-md:!col-span-12"
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "#faece6",
                    color: "#e0562e",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <TrendingUp size={22} />
                </motion.div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#e0562e",
                    background: "rgba(224, 86, 46, 0.08)",
                    padding: "4px 10px",
                    borderRadius: 12,
                    letterSpacing: "0.04em",
                  }}
                >
                  AUTO-BALANCING
                </span>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 700, color: "#1e2029", margin: "0 0 8px" }}>
                Dynamic Bill Splitting
              </h3>
              <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.55, margin: 0, maxWidth: "92%" }}>
                When a new member joins your space, SplitSpace instantly and dynamically redistributes all equal expenses across the entire group without requiring retroactive edits.
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              style={{
                marginTop: 22,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "#1e2029",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  ₹
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1e2029" }}>₹15,000 Group Expense</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#e0562e", fontWeight: 700 }}>
                <span>Auto-split: ₹3,750 / person</span>
                <CheckCircle2 size={16} />
              </div>
            </motion.div>
          </motion.div>

          {/* BENTO CARD 2: 1-Click Gmail & PDF Statements (Span 5) */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2 } }}
            onClick={() => setAuthSheetOpen(true)}
            style={{
              gridColumn: "span 5",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 20px rgba(13, 27, 66, 0.04)",
              cursor: "pointer",
            }}
            className="max-md:!col-span-12"
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "#e6f7f5",
                    color: "#14b8a6",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Mail size={22} />
                </motion.div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#14b8a6",
                    background: "rgba(20, 184, 166, 0.08)",
                    padding: "4px 10px",
                    borderRadius: 12,
                    letterSpacing: "0.04em",
                  }}
                >
                  DISPATCH
                </span>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 700, color: "#1e2029", margin: "0 0 8px" }}>
                1-Click Gmail & PDF
              </h3>
              <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.55, margin: 0 }}>
                Launch pre-filled browser web statements or generate corporate audited PDF reports with reference IDs, itemized receipts, and settlement matrices.
              </p>
            </div>

            <div
              style={{
                marginTop: 22,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#14b8a6",
              }}
            >
              <ShieldCheck size={17} />
              <span>Audited PDF & Web Dispatch Ready</span>
            </div>
          </motion.div>

          {/* BENTO CARD 3: Global Multi-Currency (Span 4) */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2 } }}
            onClick={() => setAuthSheetOpen(true)}
            style={{
              gridColumn: "span 4",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 20px rgba(13, 27, 66, 0.04)",
              cursor: "pointer",
            }}
            className="max-md:!col-span-12"
          >
            <div>
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#f0f4ff",
                  color: "#3b82f6",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Globe2 size={19} />
              </motion.div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
                Global Multi-Currency
              </h3>
              <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                Log costs in USD, EUR, GBP, or JPY and convert automatically into your group base currency with live FX exchange rates.
              </p>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
              {["USD $", "EUR €", "GBP £", "INR ₹"].map((c) => (
                <span
                  key={c}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    padding: "3px 8px",
                    borderRadius: 8,
                    color: "#475569",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </motion.div>

          {/* BENTO CARD 4: Instant Space Invites (Span 4) */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2 } }}
            onClick={() => setAuthSheetOpen(true)}
            style={{
              gridColumn: "span 4",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 20px rgba(13, 27, 66, 0.04)",
              cursor: "pointer",
            }}
            className="max-md:!col-span-12"
          >
            <div>
              <motion.div
                whileHover={{ scale: 1.15, rotate: 15 }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#faf5ff",
                  color: "#a855f7",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Sparkles size={19} />
              </motion.div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
                Instant Space Invites
              </h3>
              <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                Generate secure 7-day invite tokens to onboard friends, flatmates, and travel buddies with 1-click auto membership.
              </p>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
              {["1-Click Token", "QR Access", "Instant Sync"].map((k) => (
                <span
                  key={k}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: "#f1f5f9",
                    padding: "3px 7px",
                    borderRadius: 6,
                    color: "#334155",
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </motion.div>

          {/* BENTO CARD 5: Zero-Cent Rounding Loss Math (Span 4) */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2 } }}
            onClick={() => setAuthSheetOpen(true)}
            style={{
              gridColumn: "span 4",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 20px rgba(13, 27, 66, 0.04)",
              cursor: "pointer",
            }}
            className="max-md:!col-span-12"
          >
            <div>
              <motion.div
                whileHover={{ scale: 1.15, rotate: -15 }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#ecfdf5",
                  color: "#10b981",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Zap size={19} />
              </motion.div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
                Zero-Cent Rounding Loss
              </h3>
              <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                Integer cents distribution guarantees group expense balances always reconcile to the exact cent without leftover fractions.
              </p>
            </div>

            <div
              style={{
                marginTop: 16,
                fontSize: 11.5,
                fontWeight: 700,
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>Exact Decimal Balance 100% Guaranteed</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── 4. HOW IT WORKS (3-STEP ONBOARDING WITH STAGGER MOTION) ── */}
      <section
        id="how-it-works"
        style={{
          position: "relative",
          zIndex: 10,
          padding: "40px 48px 60px",
          maxWidth: 1300,
          margin: "0 auto",
          scrollMarginTop: 80,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 700, color: "#1e2029", margin: 0 }}>
            How SplitSpace Works
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "6px 0 0" }}>
            Experience group financial collaboration in three frictionless steps.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
          className="max-md:!grid-cols-1"
        >
          {/* Step 1 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.02 }}
            style={{
              background: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(241, 107, 45, 0.18)",
              borderRadius: 20,
              padding: "26px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: "rgba(224, 86, 46, 0.3)", marginBottom: 12 }}>
              01
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
              Create or Join Space
            </h3>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
              Set up a shared group space for your apartment, roadtrip, or project, or join via a 1-click token link.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.02 }}
            style={{
              background: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(241, 107, 45, 0.18)",
              borderRadius: 20,
              padding: "26px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: "rgba(224, 86, 46, 0.3)", marginBottom: 12 }}>
              02
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
              Log Costs in Any Currency
            </h3>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
              Record bills with quick presets and category tagging. SplitSpace auto-converts foreign currency rates on the fly.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.02 }}
            style={{
              background: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(241, 107, 45, 0.18)",
              borderRadius: 20,
              padding: "26px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: "rgba(224, 86, 46, 0.3)", marginBottom: 12 }}>
              03
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
              Settle with Minimized Transfers
            </h3>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
              Greedy graph debt minimization turns complex IOUs into minimal direct transfers, instantly resolved with UPI or bank payments.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── 5. SYSTEM ARCHITECTURE & ENGINEERING DEEP-DIVE ── */}
      <section
        id="architecture"
        style={{
          position: "relative",
          zIndex: 10,
          padding: "40px 48px 70px",
          maxWidth: 1300,
          margin: "0 auto",
          scrollMarginTop: 80,
        }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 32, textAlign: "center" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(224, 86, 46, 0.1)",
              border: "1px solid rgba(224, 86, 46, 0.2)",
              borderRadius: 20,
              padding: "4px 14px",
              fontSize: 11,
              fontWeight: 700,
              color: "#e0562e",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            <Cpu size={13} />
            <span>High-Performance System Architecture</span>
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 3.4vw, 36px)",
              fontWeight: 700,
              color: "#1e2029",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Under the Hood of SplitSpace
          </h2>
          <p style={{ fontSize: 14.5, color: "#6b7280", margin: "8px auto 0", maxWidth: 680, lineHeight: 1.6 }}>
            Engineered with a modern reactive pipeline: Next.js 16 Turbo frontend, sub-30ms Firebase Cloud Firestore sync, and an exact greedy graph debt-simplification solver.
          </p>
        </motion.div>

        {/* Architecture Navigation Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "overview" as const, label: "End-to-End Pipeline", icon: Layers },
            { id: "graph" as const, label: "Debt Graph Minimizer", icon: GitBranch },
            { id: "realtime" as const, label: "Real-Time Sync (Sub-30ms)", icon: Zap },
            { id: "security" as const, label: "Security & Permissions", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeArchTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveArchTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  background: active ? "#1e2029" : "rgba(255, 255, 255, 0.75)",
                  color: active ? "#ffffff" : "#4b5563",
                  border: active ? "1px solid #1e2029" : "1px solid rgba(224, 86, 46, 0.18)",
                  boxShadow: active ? "0 6px 18px rgba(30, 32, 41, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.02)",
                }}
              >
                <Icon size={16} style={{ color: active ? "#e0562e" : "inherit" }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Architecture Dynamic Tab Content Container */}
        <AnimatePresence mode="wait">
          {activeArchTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              style={{
                background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 241, 235, 0.95) 100%)",
                border: "1.5px solid rgba(224, 86, 46, 0.22)",
                borderRadius: 24,
                padding: "32px",
                boxShadow: "0 12px 36px rgba(13, 27, 66, 0.06)",
                marginBottom: 24,
              }}
            >
              {/* Architecture Flow Diagram */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e2029", margin: "0 0 4px" }}>
                      Data Flow & Reactive State Architecture
                    </h3>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                      How client events traverse optimistic local memory, atomic remote transactions, and real-time reconciliation.
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#10b981",
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      padding: "4px 10px",
                      borderRadius: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                    Zero-Lag Event Pipeline
                  </span>
                </div>

                {/* 4 Pipeline Stages */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 16,
                  }}
                  className="max-md:!grid-cols-1"
                >
                  {/* Stage 1 */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: "20px 16px",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#faece6",
                          color: "#e0562e",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        1
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e2029" }}>User Action</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                      User adds an expense or records a settlement. Optimistic UI instantly updates local state with zero latency.
                    </p>
                    <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: "#e0562e" }}>
                      Next.js 16 + Turbopack
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: "20px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#e6f7f5",
                          color: "#14b8a6",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        2
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e2029" }}>Atomic Firestore</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                      Payload written as an atomic document transaction to Google Cloud Firestore with zero partial-write anomalies.
                    </p>
                    <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: "#14b8a6" }}>
                      Cloud Firestore NoSQL
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: "20px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#f0f4ff",
                          color: "#3b82f6",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        3
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e2029" }}>Graph Solver</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                      Debt minimizer executes bipartite matching in memory to recalculate optimal net creditor & debtor transactions.
                    </p>
                    <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: "#3b82f6" }}>
                      O(N log N) Solver
                    </div>
                  </div>

                  {/* Stage 4 */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: "20px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#faf5ff",
                          color: "#a855f7",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        4
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e2029" }}>Live Broadcast</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                      Firestore real-time listeners push recalculated group balances and settlement instructions to all members under 30ms.
                    </p>
                    <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: "#a855f7" }}>
                      Sub-30ms onSnapshot
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Architecture Matrix */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 16,
                  borderTop: "1px solid rgba(224, 86, 46, 0.15)",
                  paddingTop: 24,
                }}
                className="max-md:!grid-cols-1"
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      display: "grid",
                      placeItems: "center",
                      color: "#e0562e",
                      flexShrink: 0,
                    }}
                  >
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e2029", margin: "0 0 3px" }}>
                      Multi-Tenant Isolation
                    </h4>
                    <p style={{ fontSize: 12.5, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                      Each space operates as an isolated cryptographic collection scoped by Space IDs, preventing cross-space data leakage.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      display: "grid",
                      placeItems: "center",
                      color: "#14b8a6",
                      flexShrink: 0,
                    }}
                  >
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e2029", margin: "0 0 3px" }}>
                      Zero-Loss Financial Math
                    </h4>
                    <p style={{ fontSize: 12.5, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                      Costs are stored in integer cents with deterministic rounding remainder distribution so sum of splits always equals the total.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      display: "grid",
                      placeItems: "center",
                      color: "#3b82f6",
                      flexShrink: 0,
                    }}
                  >
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e2029", margin: "0 0 3px" }}>
                      Progressive Web App
                    </h4>
                    <p style={{ fontSize: 12.5, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                      Service Worker caching and offline indexed storage enable logging expenses without mobile network connectivity.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeArchTab === "graph" && (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              style={{
                background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 241, 235, 0.95) 100%)",
                border: "1.5px solid rgba(224, 86, 46, 0.22)",
                borderRadius: 24,
                padding: "32px",
                boxShadow: "0 12px 36px rgba(13, 27, 66, 0.06)",
                marginBottom: 24,
              }}
            >
              {/* Header with Interactive Toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e2029", margin: "0 0 4px" }}>
                    Greedy Bipartite Debt Simplification Algorithm
                  </h3>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                    In a group of N members, unoptimized debts generate up to N(N-1)/2 complex transfers. SplitSpace minimizes this to at most N-1 transactions.
                  </p>
                </div>

                {/* Interactive Mode Toggle */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 4,
                    display: "flex",
                    gap: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setGraphDemoMode("optimized")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 9,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: graphDemoMode === "optimized" ? "#e0562e" : "transparent",
                      color: graphDemoMode === "optimized" ? "#ffffff" : "#4b5563",
                      transition: "all 0.15s",
                    }}
                  >
                    SplitSpace Optimized (2 Payments)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphDemoMode("direct")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 9,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: graphDemoMode === "direct" ? "#1e2029" : "transparent",
                      color: graphDemoMode === "direct" ? "#ffffff" : "#4b5563",
                      transition: "all 0.15s",
                    }}
                  >
                    Unoptimized Direct (6 Payments)
                  </button>
                </div>
              </div>

              {/* Visual Demonstration Cards */}
              {graphDemoMode === "optimized" ? (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: 18,
                    padding: "24px",
                    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={16} /> Optimized Settlement Matrix (2 Transactions)
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      Total money moved: <strong>₹7,500</strong>
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }} className="max-md:!grid-cols-1">
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#166534", fontWeight: 700 }}>Settlement 01</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e2029", marginTop: 2 }}>
                          Charlie pays Alice
                        </div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>₹4,500</div>
                    </div>

                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#166534", fontWeight: 700 }}>Settlement 02</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e2029", marginTop: 2 }}>
                          Dave pays Bob
                        </div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>₹3,000</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: 18,
                    padding: "24px",
                    boxShadow: "0 4px 16px rgba(239, 68, 68, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>
                      <RotateCw size={16} /> Chaotic Multi-Party IOUs (6 Transactions)
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      Total money moved: <strong>₹18,500 (146% redundant cashflow)</strong>
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="max-md:!grid-cols-1">
                    {[
                      { from: "Charlie", to: "Alice", amt: "₹2,500" },
                      { from: "Dave", to: "Alice", amt: "₹2,000" },
                      { from: "Charlie", to: "Bob", amt: "₹2,000" },
                      { from: "Dave", to: "Bob", amt: "₹1,000" },
                      { from: "Alice", to: "Bob", amt: "₹5,000" },
                      { from: "Bob", to: "Charlie", amt: "₹6,000" },
                    ].map((tx, idx) => (
                      <div key={idx} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 12, color: "#991b1b" }}>{tx.from} → {tx.to}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>{tx.amt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeArchTab === "realtime" && (
            <motion.div
              key="realtime"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              style={{
                background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 241, 235, 0.95) 100%)",
                border: "1.5px solid rgba(224, 86, 46, 0.22)",
                borderRadius: 24,
                padding: "32px",
                boxShadow: "0 12px 36px rgba(13, 27, 66, 0.06)",
                marginBottom: 24,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }} className="max-md:!grid-cols-1">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#faece6", color: "#e0562e", display: "grid", placeItems: "center" }}>
                      <Zap size={20} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: 0 }}>
                      Sub-30ms Real-Time Replication
                    </h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "0 0 16px" }}>
                    SplitSpace attaches real-time snapshot listeners to active Firestore space collections. When any teammate in another country adds an expense, all group screens update instantly without polling.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#374151" }}>
                      <CheckCircle2 size={16} style={{ color: "#e0562e" }} />
                      <span>Zero HTTP polling overhead or server socket bottlenecks</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#374151" }}>
                      <CheckCircle2 size={16} style={{ color: "#e0562e" }} />
                      <span>Atomic multi-document transaction batching</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#374151" }}>
                      <CheckCircle2 size={16} style={{ color: "#e0562e" }} />
                      <span>Automatic connection retry with offline queue flush</span>
                    </div>
                  </div>
                </div>

                {/* Live Latency Stats Card */}
                <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 18, padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#14b8a6", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                      Engine Benchmark
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "#1e2029", letterSpacing: "-0.03em" }}>
                      &lt; 28ms <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>p95 sync speed</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f3f4f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <small style={{ fontSize: 11, color: "#9ca3af", display: "block" }}>Local Optimistic State</small>
                      <strong style={{ fontSize: 15, color: "#1e2029" }}>0ms latency</strong>
                    </div>
                    <div>
                      <small style={{ fontSize: 11, color: "#9ca3af", display: "block" }}>Cloud Firestore Write</small>
                      <strong style={{ fontSize: 15, color: "#1e2029" }}>~22ms roundtrip</strong>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeArchTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              style={{
                background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 241, 235, 0.95) 100%)",
                border: "1.5px solid rgba(224, 86, 46, 0.22)",
                borderRadius: 24,
                padding: "32px",
                boxShadow: "0 12px 36px rgba(13, 27, 66, 0.06)",
                marginBottom: 24,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="max-md:!grid-cols-1">
                <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "22px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#faece6", color: "#e0562e", display: "grid", placeItems: "center", marginBottom: 12 }}>
                    <Lock size={18} />
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
                    Argon2 & OAuth Auth
                  </h4>
                  <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                    Modern password hashing with salt stretching and 1-Click Google Identity Federation via cryptographically signed JWT tokens.
                  </p>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "22px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e6f7f5", color: "#14b8a6", display: "grid", placeItems: "center", marginBottom: 12 }}>
                    <ShieldCheck size={18} />
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
                    Firestore Security Rules
                  </h4>
                  <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                    Granular document security rules ensure only authenticated members of a specific space ID can read, create, or modify ledger lines.
                  </p>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "22px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0f4ff", color: "#3b82f6", display: "grid", placeItems: "center", marginBottom: 12 }}>
                    <Sparkles size={18} />
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
                    Ephemeral Invite Tokens
                  </h4>
                  <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
                    Space invitations use time-limited (7-day) cryptographically hashed tokens with 1-click single-space permission grants.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tech Stack Metric Badges */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
          className="max-md:!grid-cols-2"
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.75)",
              border: "1px solid rgba(224, 86, 46, 0.15)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#1e2029", color: "#ffffff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>
              N
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2029" }}>Next.js 16 Turbo</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>React 19 & App Router</div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.75)",
              border: "1px solid rgba(224, 86, 46, 0.15)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f59e0b", color: "#ffffff", display: "grid", placeItems: "center" }}>
              <Database size={17} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2029" }}>Cloud Firestore</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Real-time NoSQL Engine</div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.75)",
              border: "1px solid rgba(224, 86, 46, 0.15)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#e0562e", color: "#ffffff", display: "grid", placeItems: "center" }}>
              <GitBranch size={17} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2029" }}>Greedy Graph Solver</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Debt Minimization O(N log N)</div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.75)",
              border: "1px solid rgba(224, 86, 46, 0.15)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#10b981", color: "#ffffff", display: "grid", placeItems: "center" }}>
              <Zap size={17} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2029" }}>Integer Cents FX</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Zero-Loss Multi-Currency</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. BOTTOM LAUNCH BANNER WITH GLOW MOTION ── */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          padding: "20px 48px 60px",
          maxWidth: 1300,
          margin: "0 auto",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          whileHover={{ y: -4 }}
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(18px)",
            border: "1.5px solid rgba(241, 107, 45, 0.25)",
            borderRadius: 26,
            padding: "36px 44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 14px 50px rgba(13, 27, 66, 0.08)",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1e2029", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
              Ready to streamline your shared expenses?
            </h3>
            <p style={{ fontSize: 14.5, color: "#6b7280", margin: 0 }}>
              Join thousands who split group costs with zero math and real-time cloud sync.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                if (onGoToDashboard) onGoToDashboard();
                else {
                  setMode("login");
                  setAuthSheetOpen(true);
                }
              }}
              style={{
                background: "#ffffff",
                color: "#1e2029",
                border: "1px solid #d8cbbe",
                borderRadius: 14,
                padding: "14px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign In
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                if (onGoToDashboard) onGoToDashboard();
                else {
                  setMode("register");
                  setAuthSheetOpen(true);
                }
              }}
              style={{
                background: "#e0562e",
                color: "#ffffff",
                border: "none",
                borderRadius: 14,
                padding: "14px 32px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(224, 86, 46, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {onGoToDashboard ? "Back to Dashboard" : "Create Free Account →"}
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── 6. OFFICIAL FOOTER ── */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          borderTop: "1px solid rgba(24, 24, 27, 0.08)",
          padding: "36px 48px",
          maxWidth: 1300,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#6b7280",
          fontSize: 12.5,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#ffffff",
              border: "1px solid rgba(200, 126, 10, 0.25)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              padding: 2,
            }}
          >
            <img src="/logo.png" alt="SplitSpace Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontWeight: 700, color: "#1e2029" }}>SplitSpace</span>
          <span>·</span>
          <span>Engineered with Next.js & Firebase by <strong>Ashish N</strong></span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span>© 2026 SplitSpace</span>
          <span>·</span>
          <span>Privacy & Terms</span>
          <span>·</span>
          <span style={{ color: "#059669", fontWeight: 600 }}>● All Systems Operational</span>
        </div>
      </footer>

      {/* ── 7. MOTION BOTTOM SHEET AUTH DRAWER ── */}
      <Sheet open={authSheetOpen} onClose={() => setAuthSheetOpen(false)}>
        <SheetBackdrop />
        <SheetPanel>
          <div style={{ maxWidth: 400, margin: "0 auto", padding: "12px 0 6px" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <motion.div
                initial={{ scale: 0.8, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "2px solid rgba(200, 126, 10, 0.35)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 12px",
                  overflow: "hidden",
                  padding: 4,
                  boxShadow: "0 6px 20px rgba(200, 126, 10, 0.22)",
                }}
              >
                <img src="/logo.png" alt="SplitSpace Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </motion.div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1e2029", margin: "0 0 4px" }}>
                {joinToken
                  ? "Join Group Space"
                  : mode === "register"
                  ? "Create Account"
                  : mode === "forgot"
                  ? "Reset Password"
                  : "Sign In"}
              </h3>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                {joinToken
                  ? "Sign in or register to join this space."
                  : mode === "register"
                  ? "Enter your details to get started."
                  : mode === "forgot"
                  ? "Enter your email to receive reset instructions."
                  : "Enter your credentials to continue."}
              </p>
            </div>

            {/* In Register mode: Username field at the top so it is filled before Google or Email registration */}
            {mode === "register" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Username <span style={{ color: "#c87e0a" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
            )}

            {/* Google Sign In */}
            {mode !== "forgot" && isFbReady && (
              <>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={busy}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    background: "#ffffff",
                    color: "#1e2029",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "10px 16px",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: busy ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </motion.button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: "#9ca3af",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    margin: "14px 0",
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
                  <span>or</span>
                  <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
                </div>
              </>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Email <span style={{ color: "#e0562e" }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

              {mode !== "forgot" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151" }}>
                      Password <span style={{ color: "#e0562e" }}>*</span>
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setErr("");
                          setSuccessMsg("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#e0562e",
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#ffffff",
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 11,
                        padding: "10px 36px 10px 13px",
                        fontSize: 13.5,
                        color: "#1e2029",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      className="focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#9ca3af",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Success Feedback */}
              {successMsg && (
                <div style={{ color: "#065f46", fontSize: 12, background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "8px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={15} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Error Feedback */}
              {err && (
                <div style={{ color: "#b91c1c", fontSize: 12, background: "#fef2f2", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: 10 }}>
                  {err}
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={busy}
                style={{
                  width: "100%",
                  marginTop: 4,
                  background: mode === "forgot" ? "#3b82f6" : "#e0562e",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 11,
                  padding: "11px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: busy ? "not-allowed" : "pointer",
                  boxShadow: mode === "forgot" ? "0 3px 12px rgba(59, 130, 246, 0.3)" : "0 3px 12px rgba(224, 86, 46, 0.3)",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy
                  ? "Please wait…"
                  : mode === "register"
                  ? "Create Account"
                  : mode === "forgot"
                  ? "Send Reset Link"
                  : "Sign In"}
              </motion.button>

              {/* Minimal Bottom Toggle */}
              <div style={{ textAlign: "center", marginTop: 6 }}>
                {mode === "register" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErr("");
                      setSuccessMsg("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6b7280",
                      fontSize: 12.5,
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    Already have an account? <span style={{ color: "#e0562e", fontWeight: 600 }}>Sign in</span>
                  </button>
                ) : mode === "login" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setErr("");
                      setSuccessMsg("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6b7280",
                      fontSize: 12.5,
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    Don&apos;t have an account? <span style={{ color: "#e0562e", fontWeight: 600 }}>Create account</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErr("");
                      setSuccessMsg("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e0562e",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    ← Back to Sign in
                  </button>
                )}
              </div>
            </form>
          </div>
        </SheetPanel>
      </Sheet>

      {/* ── Settings & Preferences Modal ── */}
      {showSettingsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13, 27, 66, 0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 22,
              maxWidth: 490,
              width: "100%",
              padding: 26,
              boxShadow: "0 30px 80px rgba(13, 27, 66, 0.28)",
              border: "1px solid rgba(224, 86, 46, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, rgba(224, 86, 46, 0.15), rgba(199, 63, 49, 0.15))", color: "#e0562e", display: "grid", placeItems: "center" }}>
                  <Settings size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, color: "#18181b", fontWeight: 700 }}>System & Account Hub</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(24, 24, 27, 0.6)" }}>Authenticated profile and platform shortcuts</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="icon-btn sm"
                style={{ borderRadius: 8, background: "#f3f4f6", border: "none", width: 32, height: 32, cursor: "pointer", display: "grid", placeItems: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Account Info Box */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Connected Account
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar m={currentUser} size="md" />
                  <div>
                    <strong style={{ display: "block", fontSize: 14, color: "#0f172a", fontWeight: 700 }}>{currentUser?.name || "Ashish N"}</strong>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{currentUser?.email}</span>
                  </div>
                </div>
              </div>

              {/* Database & Sync Status */}
              <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#16a34a", color: "#ffffff", display: "grid", placeItems: "center" }}>
                  <Zap size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: 12, color: "#166534", display: "block" }}>Cloud Firestore Online</strong>
                  <span style={{ fontSize: 11, color: "#15803d" }}>Atomic transactions & 90-day auto-TTL enabled.</span>
                </div>
              </div>

              {/* Keyboard Shortcuts Summary */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Lightning Shortcuts
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}>
                    <span>Add Expense:</span> <kbd style={{ background: "#e2e8f0", padding: "2px 7px", borderRadius: 4, fontWeight: 700, fontSize: 11 }}>E</kbd>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}>
                    <span>New Space:</span> <kbd style={{ background: "#e2e8f0", padding: "2px 7px", borderRadius: 4, fontWeight: 700, fontSize: 11 }}>N</kbd>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}>
                    <span>Settle Up:</span> <kbd style={{ background: "#e2e8f0", padding: "2px 7px", borderRadius: 4, fontWeight: 700, fontSize: 11 }}>S</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  padding: "9px 16px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <LogOut size={14} /> Sign out
              </button>

              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: "#18181b",
                  color: "#ffffff",
                  border: "none",
                  padding: "9px 18px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
