"use client";
import React, { useState, useRef, useEffect } from "react";
import { Space, Member, api } from "@/lib/api";
import {
  Plus,
  Trash2,
  LogOut,
  X,
  Settings,
  ChevronUp,
  ShieldCheck,
  Keyboard,
  Sparkles,
  Zap,
  Activity,
  Check,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export function SpaceSidebar({
  spaces,
  active,
  user,
  sidebarOpen,
  onCloseSidebar,
  onSelectSpace,
  onNewSpace,
  onDeleteSpace,
  onSignOut,
}: {
  spaces: Space[];
  active?: Space;
  user: Member | null;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  onSelectSpace: (id: string) => void;
  onNewSpace: () => void;
  onDeleteSpace: (s: Space) => void;
  onSignOut?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSignOutClick = async () => {
    setMenuOpen(false);
    if (onSignOut) {
      onSignOut();
    } else {
      try {
        await api.logout();
      } catch {}
      localStorage.removeItem("splitspace_token");
      location.reload();
    }
  };

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{ paddingBottom: 28 }}>
        {/* Brand header */}
        <div
          className="brand"
          style={{ cursor: "pointer" }}
          onClick={() => {
            if (typeof window !== "undefined") {
              window.history.pushState({ view: "landing" }, "");
              window.dispatchEvent(new PopStateEvent("popstate", { state: { view: "landing" } }));
            }
          }}
          title="Back to Landing Page"
        >
          <div className="brand-dot">S</div>
          <div>
            <div className="brand-name">SplitSpace</div>
            <div className="brand-sub">Group expenses, simplified</div>
          </div>
          <button
            className="icon-btn mobile-close"
            onClick={(e) => {
              e.stopPropagation();
              onCloseSidebar();
            }}
            aria-label="Close sidebar navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Space Button */}
        <button
          className="new-space-btn"
          onClick={() => {
            onNewSpace();
            onCloseSidebar();
          }}
          aria-label="Create a new space"
        >
          <Plus size={16} /> New space
        </button>

        {/* Spaces list */}
        <div className="nav-section" style={{ flex: 1, overflowY: "auto" }}>
          <div className="nav-label">Your spaces ({spaces.length})</div>
          <div className="space-list">
            {spaces.map((s) => (
              <div
                key={s.id}
                className={`space-row ${active?.id === s.id ? "active" : ""}`}
                onClick={() => {
                  onSelectSpace(s.id);
                  onCloseSidebar();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectSpace(s.id);
                    onCloseSidebar();
                  }
                }}
              >
                <span className="space-emoji">{s.emoji}</span>
                <span className="space-copy">
                  <strong>{s.title}</strong>
                  <small>
                    {s.members.length} {s.members.length === 1 ? "person" : "people"} ·{" "}
                    {s.expenses.length} {s.expenses.length === 1 ? "expense" : "expenses"}
                  </small>
                </span>
                <button
                  type="button"
                  className="space-delete-btn"
                  title="Delete or leave space"
                  aria-label={`Delete or leave ${s.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSpace(s);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── FUTURISTIC USER PROFILE & SETTINGS MENU TRIGGER ── */}
        <div className="sidebar-foot" ref={menuRef} style={{ position: "relative", paddingBottom: 18 }}>
          {/* Account Popover in Warm Hero Section Palette */}
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: 0,
                right: 0,
                background: "#faf1eb",
                backgroundImage: "linear-gradient(145deg, #ffffff 0%, #faf1eb 60%, #f5e5da 100%)",
                border: "1.5px solid rgba(241, 107, 45, 0.28)",
                borderRadius: 20,
                boxShadow: "0 20px 50px -10px rgba(13, 27, 66, 0.18), 0 0 0 1px rgba(241, 107, 45, 0.08)",
                padding: "16px",
                zIndex: 100,
                color: "#1e2029",
                animation: "menuFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Profile Card Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid rgba(241, 107, 45, 0.15)" }}>
                <div style={{ position: "relative" }}>
                  <Avatar m={user} size="md" />
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#10b981",
                      border: "2px solid #ffffff",
                    }}
                  />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <strong style={{ fontSize: 13.5, fontWeight: 700, color: "#1e2029", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.name || "Ashish N"}
                    </strong>
                    <ShieldCheck size={14} style={{ color: "#059669", flexShrink: 0 }} />
                  </div>
                  <small style={{ fontSize: 11, color: "#6b7280", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                    {user?.email || "Google Account"}
                  </small>
                </div>
              </div>

              {/* Quick Stats Pill */}
              <div
                style={{
                  margin: "10px 0",
                  padding: "8px 12px",
                  background: "rgba(255, 255, 255, 0.85)",
                  border: "1px solid rgba(241, 107, 45, 0.18)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  fontWeight: 600,
                }}
              >
                <span style={{ color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                  <Activity size={13} style={{ color: "#e0562e" }} /> Active Ledger
                </span>
                <span style={{ color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} /> Online
                </span>
              </div>

              {/* Menu Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
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
                    color: "#1e2029",
                    background: "#ffffff",
                    border: "1px solid rgba(13, 27, 66, 0.08)",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                  className="hover:bg-orange-50 hover:border-orange-300"
                >
                  <Settings size={15} style={{ color: "#e0562e" }} />
                  <span style={{ flex: 1 }}>Settings & Preferences</span>
                </button>
              </div>

              {/* Sign out Action */}
              <div style={{ borderTop: "1px solid rgba(241, 107, 45, 0.15)", paddingTop: 10 }}>
                <button
                  type="button"
                  onClick={handleSignOutClick}
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
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(241, 107, 45, 0.12)", fontSize: 10, color: "#9ca3af", textAlign: "center" }}>
                SplitSpace · Engineered by <strong style={{ color: "#475569" }}>Ashish N</strong>
              </div>
            </div>
          )}

          {/* Interactive Futuristic Profile Card Trigger */}
          <div
            onClick={() => setMenuOpen((v) => !v)}
            role="button"
            tabIndex={0}
            aria-label="User profile and account settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: menuOpen ? "#ffffff" : "rgba(255, 255, 255, 0.85)",
              borderRadius: 14,
              border: menuOpen ? "1.5px solid #f16b2d" : "1px solid rgba(241, 107, 45, 0.25)",
              boxShadow: menuOpen ? "0 8px 24px rgba(241, 107, 45, 0.22)" : "0 2px 8px rgba(13, 27, 66, 0.04)",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              userSelect: "none",
            }}
            className="hover:bg-white hover:border-orange-500 hover:shadow-md"
          >
            <div style={{ position: "relative" }}>
              <Avatar m={user} size="sm" />
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
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ display: "block", fontSize: 13, color: "#0d1b42", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700 }}>
                {user?.name || "Ashish N"}
              </strong>
              <small style={{ display: "block", fontSize: 10, color: "rgba(13, 27, 66, 0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email || "Signed in"}
              </small>
            </div>
            <ChevronUp
              size={15}
              style={{
                color: "#f16b2d",
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>
      </aside>

      {/* ── Futuristic Settings & Preferences Modal ── */}
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
              border: "1px solid rgba(241, 107, 45, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, rgba(241, 107, 45, 0.15), rgba(199, 63, 49, 0.15))", color: "#f16b2d", display: "grid", placeItems: "center" }}>
                  <Settings size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, color: "#0d1b42", fontWeight: 700 }}>System & Account Hub</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(13, 27, 66, 0.6)" }}>Authenticated profile and workspace shortcuts</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="icon-btn sm"
                style={{ borderRadius: 8 }}
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
                  <Avatar m={user} size="md" />
                  <div>
                    <strong style={{ display: "block", fontSize: 14, color: "#0f172a", fontWeight: 700 }}>{user?.name || "Ashish N"}</strong>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{user?.email}</span>
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
                onClick={handleSignOutClick}
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
                className="btn primary sm"
                style={{ padding: "9px 20px" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
