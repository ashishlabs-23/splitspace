"use client";
import React, { useState, useEffect } from "react";
import { api, Space, ActivityItem } from "@/lib/api";
import { Overlay } from "@/components/ui/overlay";
import {
  X,
  History,
  Receipt,
  ArrowRightLeft,
  UserPlus,
  UserMinus,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";
import { formatMoney } from "@/lib/currencies";

function timeAgo(dateString: string): string {
  try {
    const now = Date.now();
    const past = new Date(dateString).getTime();
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

export function ActivityModal({
  space,
  onClose,
}: {
  space: Space;
  onClose: () => void;
}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "expenses" | "settlements" | "members">("all");

  useEffect(() => {
    // Initial fetch
    api.activities(space.id)
      .then((data) => {
        setActivities(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Could not load initial activities:", err);
        setLoading(false);
      });

    // Real-time subscription
    const unsubscribe = api.subscribeToActivity(space.id, (data) => {
      setActivities(data);
    });

    return () => {
      unsubscribe();
    };
  }, [space.id]);

  const filteredActivities = activities.filter((act) => {
    if (filter === "expenses" && !act.type.startsWith("expense")) return false;
    if (filter === "settlements" && !act.type.startsWith("settlement")) return false;
    if (filter === "members" && !act.type.startsWith("member")) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchActor = act.actor_name?.toLowerCase().includes(q);
      const matchDetails = act.details?.toLowerCase().includes(q);
      if (!matchActor && !matchDetails) return false;
    }
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "expense_created":
        return <Receipt size={16} className="text-orange-500" />;
      case "expense_updated":
        return <Edit2 size={16} className="text-amber-500" />;
      case "expense_deleted":
        return <Trash2 size={16} className="text-red-500" />;
      case "settlement_created":
        return <ArrowRightLeft size={16} className="text-emerald-500" />;
      case "settlement_deleted":
        return <Trash2 size={16} className="text-rose-500" />;
      case "member_joined":
        return <UserPlus size={16} className="text-blue-500" />;
      case "member_left":
        return <UserMinus size={16} className="text-gray-500" />;
      default:
        return <Sparkles size={16} className="text-orange-500" />;
    }
  };

  return (
    <Overlay onClose={onClose} label="Space Activity Log">
      <div
        className="modal"
        style={{
          maxWidth: 620,
          width: "100%",
          margin: "0 auto",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          background: "#faf1eb",
          backgroundImage: "linear-gradient(160deg, #ffffff 0%, #faf1eb 60%, #f5e5da 100%)",
          border: "1.5px solid rgba(241, 107, 45, 0.22)",
          borderRadius: 24,
          padding: "clamp(16px, 4vw, 24px)",
          boxShadow: "0 30px 80px rgba(13, 27, 66, 0.28)",
          color: "#1e2029",
          boxSizing: "border-box",
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 16,
            borderBottom: "1px solid rgba(13, 27, 66, 0.08)",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#e0562e",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 4px 14px rgba(224, 86, 46, 0.30)",
                flexShrink: 0,
              }}
            >
              <History size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "clamp(17px, 4vw, 21px)",
                  fontWeight: 700,
                  color: "#1e2029",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Space Activity Log
              </h2>
              <p
                style={{
                  fontSize: 12.5,
                  color: "#6b7280",
                  margin: "2px 0 0",
                }}
              >
                Itemized changelog and live audit trail for {space.emoji} {space.title}.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close activity log"
            style={{
              background: "rgba(13, 27, 66, 0.06)",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: 6,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
            className="hover:text-black hover:bg-black/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div
          style={{
            padding: "14px 0",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "8px 12px",
            }}
          >
            <Search size={15} style={{ color: "#9ca3af" }} />
            <input
              type="text"
              placeholder="Filter activity by person, bill title, or memo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: 13,
                color: "#1e2029",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer", padding: 2 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Activity" },
              { id: "expenses", label: "Expenses" },
              { id: "settlements", label: "Settlements" },
              { id: "members", label: "Members" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as any)}
                style={{
                  background: filter === f.id ? "#e0562e" : "#ffffff",
                  color: filter === f.id ? "#ffffff" : "#4b5563",
                  border: "1px solid",
                  borderColor: filter === f.id ? "#e0562e" : "#e5e7eb",
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Activity Items Feed ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingRight: 4,
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
              <Clock size={28} className="animate-spin" style={{ margin: "0 auto 10px", opacity: 0.5 }} />
              <p style={{ fontSize: 13 }}>Loading activity trail…</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 16px",
                background: "#ffffff",
                border: "1px dashed #e5e7eb",
                borderRadius: 16,
                color: "#6b7280",
              }}
            >
              <History size={32} style={{ margin: "0 auto 12px", opacity: 0.35, color: "#e0562e" }} />
              <strong style={{ display: "block", color: "#1e2029", fontSize: 14, marginBottom: 4 }}>
                {search ? "No matching activity records" : "No activity recorded yet"}
              </strong>
              <p style={{ fontSize: 12.5, margin: 0, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                {search
                  ? "Try clearing your search query to see other space events."
                  : "All changes made in this space (expenses added, edited, settlements recorded) will appear here live."}
              </p>
            </div>
          ) : (
            filteredActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  background: "#ffffff",
                  border: "1px solid rgba(13, 27, 66, 0.07)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  boxShadow: "0 2px 6px rgba(13, 27, 66, 0.02)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#faf1eb",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {getIcon(act.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ fontSize: 13, color: "#1e2029", fontWeight: 700 }}>
                      {act.actor_name || "Someone"}
                    </strong>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Clock size={11} />
                      {timeAgo(act.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 12.5,
                      color: "#4b5563",
                      margin: "3px 0 0",
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}
                  >
                    {act.details}
                  </p>

                  {act.amount !== undefined && act.amount > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#e0562e",
                          background: "#faece6",
                          padding: "2px 8px",
                          borderRadius: 6,
                          display: "inline-block",
                        }}
                      >
                        {formatMoney(act.amount, act.currency || space.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: 14,
            borderTop: "1px solid rgba(13, 27, 66, 0.08)",
            marginTop: 12,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#ffffff",
              border: "1px solid #d8cbbe",
              borderRadius: 12,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 600,
              color: "#2d2f39",
              cursor: "pointer",
            }}
            className="hover:bg-orange-50 hover:border-orange-200"
          >
            Close
          </button>
        </div>
      </div>
    </Overlay>
  );
}
