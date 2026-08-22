"use client";
import { useState, useEffect, useCallback } from "react";
import {
  api,
  Space,
  Expense,
  Summary,
  Member,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useShortcuts } from "@/lib/useShortcuts";
import { formatMoney } from "@/lib/currencies";
import { LandingPage } from "@/components/landing/LandingPage";
import { SpaceHeader } from "@/components/spaces/SpaceHeader";
import { SpaceSidebar } from "@/components/spaces/SpaceSidebar";
import { ExpenseList } from "@/components/spaces/ExpenseList";
import { SettlementList } from "@/components/spaces/SettlementList";
import { MemberList } from "@/components/spaces/MemberList";
import { SpaceStats } from "@/components/spaces/SpaceStats";
import { ExpenseModal } from "@/components/modals/ExpenseModal";
import { SettleUpModal } from "@/components/modals/SettleUpModal";
import { ExportModal } from "@/components/modals/ExportModal";
import { CreateSpaceModal } from "@/components/modals/CreateSpaceModal";
import { InviteModal } from "@/components/modals/InviteModal";
import { MembersModal } from "@/components/modals/MembersModal";
import { DeleteSpaceModal } from "@/components/modals/DeleteSpaceModal";
import { useToast } from "@/components/smoothui/toast";
import { TiltCard, TiltCardLayer } from "@/components/ui/tilt-card";
import { Sheet, SheetBackdrop, SheetPanel } from "@/components/smoothui/sheet";
import {
  Menu,
  Plus,
  Receipt,
  Sparkles,
  ArrowRight,
  WifiOff,
  Users,
  LogOut,
} from "lucide-react";

export default function Home() {
  const { user, loading: authLoading, setUser } = useAuth();
  const { toast } = useToast();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebar, setSidebar] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Modals state
  const [modal, setModal] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [settlePrefill, setSettlePrefill] = useState<{
    payerId?: string;
    recipientId?: string;
    amount?: number;
  }>({});

  const [joinToken, setJoinToken] = useState<string>("");
  const [signOutSheetOpen, setSignOutSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"dashboard" | "landing">("dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("join");
      if (token) setJoinToken(token);
    }
  }, []);

  const active = spaces.find((s) => s.id === activeId);

  // Refresh space & summary
  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const sps = await api.spaces();
      setSpaces(sps);
      if (sps.length > 0) {
        const currId = activeId && sps.some((s) => s.id === activeId) ? activeId : sps[0].id;
        setActiveId(currId);
        const sum = await api.summary(currId);
        setSummary(sum);
      } else {
        setActiveId("");
        setSummary(null);
      }
    } catch (err: any) {
      console.warn("Failed to load spaces:", err);
    } finally {
      setLoading(false);
    }
  }, [user, activeId]);

  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  // When activeId changes, refresh summary
  useEffect(() => {
    if (activeId && user) {
      api.summary(activeId).then(setSummary).catch(console.warn);
    }
  }, [activeId, user]);

  // Handle joining via invite link
  useEffect(() => {
    if (joinToken && user) {
      api.join(joinToken)
        .then((res) => {
          toast.success("Joined space successfully!");
          setActiveId(res.space_id);
          setJoinToken("");
          refresh();
        })
        .catch((err) => {
          toast.error(err.message || "Failed to join space");
          setJoinToken("");
        });
    }
  }, [joinToken, user, refresh, toast]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Keyboard shortcuts
  useShortcuts({
    onNewExpense: () => {
      setEditingExpense(null);
      setModal("expense");
    },
    onNewSpace: () => setModal("create"),
    onInvite: () => setModal("invite"),
    onSettleUp: () => setModal("settleUp"),
    onExport: () => setModal("export"),
    onToggleSidebar: () => setSidebar((v) => !v),
  });

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  if (authLoading) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: "center", color: "#0f766e" }}>
          <div className="btn-spinner" style={{ width: 32, height: 32, margin: "0 auto 16px", borderColor: "#0f766e", borderTopColor: "transparent" }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Loading SplitSpace…</div>
        </div>
      </div>
    );
  }

  // Browser History & Back/Forward Navigation Sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize state if needed
    if (!window.history.state) {
      window.history.replaceState({ view: user ? "dashboard" : "landing" }, "");
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        setViewMode(e.state.view);
      } else {
        setViewMode((curr) => (curr === "dashboard" ? "landing" : "dashboard"));
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [user]);

  const goToDashboard = useCallback(() => {
    setViewMode("dashboard");
    if (typeof window !== "undefined" && window.history.state?.view !== "dashboard") {
      window.history.pushState({ view: "dashboard" }, "");
    }
  }, []);

  const goToLanding = useCallback(() => {
    setViewMode("landing");
    if (typeof window !== "undefined" && window.history.state?.view !== "landing") {
      window.history.pushState({ view: "landing" }, "");
    }
  }, []);

  // Not signed in or viewing landing page
  if (!authLoading && (!user || viewMode === "landing")) {
    return (
      <LandingPage
        joinToken={joinToken}
        currentUser={user}
        onLoggedIn={(u: Member) => {
          setUser(u);
          goToDashboard();
          refresh();
        }}
        onGoToDashboard={user ? goToDashboard : undefined}
      />
    );
  }

  return (
    <div className="app">
      {isOffline && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#b45309",
            color: "#fff",
            padding: "6px 12px",
            fontSize: 12,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <WifiOff size={14} /> You are currently offline. Local cache active.
        </div>
      )}

      {/* ── Sidebar ── */}
      <SpaceSidebar
        spaces={spaces}
        active={active}
        user={user}
        sidebarOpen={sidebar}
        onCloseSidebar={() => setSidebar(false)}
        onSelectSpace={(id) => setActiveId(id)}
        onNewSpace={() => setModal("create")}
        onDeleteSpace={(s) => {
          setSpaceToDelete(s);
          setModal("deleteSpace");
        }}
        onSignOut={() => setSignOutSheetOpen(true)}
      />

      {/* ── Mobile Top Bar ── */}
      <div className="mobile-top">
        <button className="icon-btn" onClick={() => setSidebar(true)} aria-label="Open navigation sidebar">
          <Menu size={20} />
        </button>
        <div
          className="mobile-brand"
          style={{ cursor: "pointer" }}
          onClick={goToLanding}
          role="button"
          tabIndex={0}
        >
          SplitSpace
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Main Content Container (Centered across all screens) ── */}
      <main className="main">
        <div className="main-inner">
          <SpaceHeader
            active={active}
            greeting={getGreeting()}
            onAddExpense={() => {
              setEditingExpense(null);
              setModal("expense");
            }}
            onInvite={() => setModal("invite")}
            onSettleUp={() => {
              setSettlePrefill({});
              setModal("settleUp");
            }}
            onExport={() => setModal("export")}
            onDeleteSpace={() => {
              if (active) {
                setSpaceToDelete(active);
                setModal("deleteSpace");
              }
            }}
          />

          {/* No spaces state */}
          {!active && !loading && (
            <div className="no-spaces">
              <div className="ns-icon">💸</div>
              <h2>No spaces found</h2>
              <p>Create your first shared group space to start splitting expenses effortlessly.</p>
              <button
                className="btn primary"
                style={{ marginTop: 12 }}
                onClick={() => setModal("create")}
              >
                <Plus size={15} /> Create a space
              </button>
            </div>
          )}

          {active && (
            <>
              {/* ── Hero Banner ── */}
              <section className="hero">
                <div className="hero-main">
                  <div className="hero-kicker">{active.period || "Shared group space"}</div>
                  <div className="hero-title">{active.title}</div>
                  <p>
                    Add expenses in any currency — SplitSpace handles exact decimal math and
                    actionable settlement transfers.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="btn primary"
                      onClick={() => {
                        setEditingExpense(null);
                        setModal("expense");
                      }}
                    >
                      <Receipt size={15} /> Add expense
                    </button>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => setModal("members")}
                    >
                      See people <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="hero-art">
                  <div className="orbit one" />
                  <div className="orbit two" />
                  <TiltCard
                    className="hero-card"
                    containerClassName="hero-card-container"
                    maxTilt={14}
                    scale={1.04}
                    glare
                    glareOpacity={0.25}
                  >
                    <TiltCardLayer depth={20} className="flex flex-col">
                      <Sparkles size={18} />
                      <strong>{summary?.settlements.length ?? 0}</strong>
                      <small>
                        {(summary?.settlements.length ?? 0) !== 1 ? "settlements" : "settlement"}{" "}
                        left
                      </small>
                    </TiltCardLayer>
                  </TiltCard>
                </div>
              </section>

              {/* ── Stats Grid ── */}
              <SpaceStats space={active} summary={summary} />

              {/* ── Content Grid ── */}
              <div className="grid">
                <ExpenseList
                  space={active}
                  onAddExpense={() => {
                    setEditingExpense(null);
                    setModal("expense");
                  }}
                  onEditExpense={(e) => {
                    setEditingExpense(e);
                    setModal("expense");
                  }}
                  onDeleteExpense={async (e) => {
                    if (confirm(`Delete "${e.title}"?`)) {
                      try {
                        await api.deleteExpense(active.id, e.id);
                        toast.info("Expense deleted");
                        refresh();
                      } catch (err: any) {
                        toast.error(err.message || "Failed to delete expense");
                      }
                    }
                  }}
                />

                {/* Right Column: Settlements & People */}
                <aside className="right-col">
                  <div className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>Settlements & Balance</h2>
                        <p>Simplified payments.</p>
                      </div>
                      <button
                        className="btn ghost sm"
                        style={{ fontSize: 11, padding: "3px 8px" }}
                        onClick={() => {
                          setSettlePrefill({});
                          setModal("settleUp");
                        }}
                      >
                        + Settle up
                      </button>
                    </div>

                    <SettlementList
                      space={active}
                      summary={summary}
                      currentUser={user}
                      onSettleUp={(payerId, recipientId, amount) => {
                        setSettlePrefill({ payerId, recipientId, amount });
                        setModal("settleUp");
                      }}
                      onDeleteSettlement={async (id) => {
                        if (confirm("Delete this recorded payment?")) {
                          try {
                            await api.deleteSettlement(active.id, id);
                            toast.info("Payment deleted");
                            refresh();
                          } catch (err: any) {
                            toast.error(err.message || "Failed to delete payment");
                          }
                        }
                      }}
                    />
                  </div>

                  <MemberList
                    space={active}
                    onAddPerson={() => setModal("invite")}
                  />
                </aside>
              </div>
            </>
          )}

          {/* Contribution Tag Footer */}
          <footer className="app-footer-credit">
            <div className="credit-text">
              <span>✦ SplitSpace</span>
              <span className="dot-sep">·</span>
              <span>Engineered & Designed with precision by <strong>Ashish N</strong></span>
            </div>
          </footer>
        </div>
      </main>

      {/* ── Modals ── */}
      {modal === "expense" && active && (
        <ExpenseModal
          space={active}
          initialExpense={editingExpense}
          onClose={() => {
            setModal(null);
            setEditingExpense(null);
          }}
          onSaved={() => {
            const wasEdit = Boolean(editingExpense);
            setModal(null);
            setEditingExpense(null);
            toast.success(
              wasEdit ? "Expense updated!" : "Expense added!",
              `Logged to ${active.title}`
            );
            refresh();
          }}
        />
      )}

      {modal === "settleUp" && active && (
        <SettleUpModal
          space={active}
          defaultPayerId={settlePrefill.payerId}
          defaultRecipientId={settlePrefill.recipientId}
          defaultAmount={settlePrefill.amount}
          onClose={() => {
            setModal(null);
            setSettlePrefill({});
          }}
          onSettled={() => {
            setModal(null);
            setSettlePrefill({});
            toast.success("Payment recorded!", "Settlement ledger updated");
            refresh();
          }}
        />
      )}

      {modal === "export" && active && (
        <ExportModal
          space={active}
          summary={summary}
          user={user}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "create" && (
        <CreateSpaceModal
          onClose={() => setModal(null)}
          onCreated={(s) => {
            setSpaces((v) => [s, ...v]);
            setActiveId(s.id);
            setModal(null);
            toast.success("Space created!", s.title);
          }}
        />
      )}

      {modal === "invite" && active && (
        <InviteModal
          space={active}
          onClose={() => setModal(null)}
          onCopied={() => toast.info("Invite link copied!", "Valid for 7 days.")}
        />
      )}

      {modal === "members" && active && (
        <MembersModal
          space={active}
          onClose={() => setModal(null)}
          onChanged={() => {
            toast.success("Members updated");
            refresh();
          }}
        />
      )}

      {modal === "deleteSpace" && spaceToDelete && (
        <DeleteSpaceModal
          space={spaceToDelete}
          user={user}
          onClose={() => {
            setModal(null);
            setSpaceToDelete(null);
          }}
          onDeleted={(deletedSpaceId) => {
            setSpaces((v) => v.filter((x) => x.id !== deletedSpaceId));
            if (activeId === deletedSpaceId) {
              const remaining = spaces.filter((x) => x.id !== deletedSpaceId);
              setActiveId(remaining[0]?.id || "");
            }
            setModal(null);
            setSpaceToDelete(null);
            toast.info("Space removed");
            refresh();
          }}
        />
      )}

      {/* ── Sign Out Motion Bottom Sheet ── */}
      <Sheet open={signOutSheetOpen} onClose={() => setSignOutSheetOpen(false)}>
        <SheetBackdrop />
        <SheetPanel>
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#faece6",
                color: "#e0562e",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <LogOut size={24} />
            </div>

            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#1e2029",
                margin: "0 0 6px",
                letterSpacing: "-0.01em",
              }}
            >
              Sign out of SplitSpace?
            </h3>

            <p
              style={{
                fontSize: 13.5,
                color: "#6b7280",
                lineHeight: 1.5,
                margin: "0 auto 24px",
                maxWidth: 400,
              }}
            >
              Are you sure you want to end your active session as <strong>{user?.name || "Ashish N"}</strong>? You will need to sign back in with your credentials to access this workspace.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setSignOutSheetOpen(false)}
                style={{
                  flex: 1,
                  background: "#ffffff",
                  border: "1px solid #d8cbbe",
                  borderRadius: 14,
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#2d2f39",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                className="hover:bg-[#f1ebe5]"
              >
                Stay Logged In
              </button>

              <button
                type="button"
                onClick={async () => {
                  setSignOutSheetOpen(false);
                  try {
                    await api.logout();
                  } catch {}
                  localStorage.removeItem("splitspace_token");
                  location.reload();
                }}
                style={{
                  flex: 1,
                  background: "#e0562e",
                  border: "none",
                  borderRadius: 14,
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(224, 86, 46, 0.35)",
                  transition: "all 0.15s",
                }}
                className="hover:brightness-110"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </SheetPanel>
      </Sheet>
    </div>
  );
}
