"use client";
import { Space } from "@/lib/api";
import { Plus, Users, Download, ArrowRightLeft, Trash2, Bell } from "lucide-react";

export function SpaceHeader({
  active,
  greeting,
  onAddExpense,
  onInvite,
  onSettleUp,
  onExport,
  onDeleteSpace,
  onOpenActivity,
  activityCount,
}: {
  active?: Space;
  greeting: string;
  onAddExpense: () => void;
  onInvite: () => void;
  onSettleUp: () => void;
  onExport: () => void;
  onDeleteSpace: () => void;
  onOpenActivity?: () => void;
  activityCount?: number;
}) {
  return (
    <header className="topbar">
      <div>
        {active && (
          <div className="eyebrow">
            {active.emoji} {active.title}
            {active.period ? ` · ${active.period}` : ""}
          </div>
        )}
        <h1>
          {greeting} <span className="wave">✦</span>
        </h1>
        <p>Here's what's happening with your group.</p>
      </div>

      <div className="top-actions">
        <button
          className="btn ghost"
          onClick={onOpenActivity}
          disabled={!active}
          title="Space activity & changelog"
          aria-label="View space activity"
          style={{ position: "relative" }}
        >
          <Bell size={14} /> Activity
          {activityCount !== undefined && activityCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#e0562e",
                color: "#ffffff",
                fontSize: 9.5,
                fontWeight: 700,
                borderRadius: "50%",
                minWidth: 16,
                height: 16,
                padding: "0 2px",
                display: "grid",
                placeItems: "center",
              }}
            >
              {activityCount > 9 ? "9+" : activityCount}
            </span>
          )}
        </button>

        <button
          className="btn ghost"
          onClick={onExport}
          disabled={!active}
          title="Export CSV / Print PDF"
          aria-label="Export CSV or PDF summary"
        >
          <Download size={14} /> Export
        </button>

        <button
          className="btn ghost"
          onClick={onSettleUp}
          disabled={!active}
          title="Record a direct payment"
          aria-label="Record a direct payment"
        >
          <ArrowRightLeft size={14} /> Settle up
        </button>

        <button
          className="btn ghost"
          onClick={onInvite}
          disabled={!active}
          title="Invite members to this space"
          aria-label="Invite members"
        >
          <Users size={14} /> Invite
        </button>

        <button
          className="btn primary"
          onClick={onAddExpense}
          disabled={!active}
          aria-label="Add new expense"
        >
          <Plus size={15} /> Add expense
        </button>
      </div>
    </header>
  );
}
