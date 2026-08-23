"use client";
import { Space } from "@/lib/api";
import { Plus, Users, Download, ArrowRightLeft, Trash2 } from "lucide-react";

export function SpaceHeader({
  active,
  greeting,
  onAddExpense,
  onInvite,
  onSettleUp,
  onExport,
  onDeleteSpace,
}: {
  active?: Space;
  greeting: string;
  onAddExpense: () => void;
  onInvite: () => void;
  onSettleUp: () => void;
  onExport: () => void;
  onDeleteSpace: () => void;
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
