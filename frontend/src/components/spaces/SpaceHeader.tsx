"use client";
import { Space } from "@/lib/api";
import { Plus, Users, Download, ArrowRightLeft, Trash2, Sparkles } from "lucide-react";

export function SpaceHeader({
  active,
  greeting,
  onAddExpense,
  onInvite,
  onSettleUp,
  onExport,
  onDeleteSpace,
  onViewLandingPage,
}: {
  active?: Space;
  greeting: string;
  onAddExpense: () => void;
  onInvite: () => void;
  onSettleUp: () => void;
  onExport: () => void;
  onDeleteSpace: () => void;
  onViewLandingPage?: () => void;
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
        {onViewLandingPage && (
          <button
            className="btn ghost desktop-only"
            onClick={onViewLandingPage}
            title="View Product Landing Page"
            style={{ color: "#e0562e" }}
          >
            <Sparkles size={14} /> Landing Page
          </button>
        )}
        <button
          className="btn ghost desktop-only"
          onClick={onExport}
          disabled={!active}
          title="Export CSV / Print PDF"
        >
          <Download size={14} /> Export
        </button>

        <button
          className="btn ghost desktop-only"
          onClick={onSettleUp}
          disabled={!active}
          title="Record a direct payment"
        >
          <ArrowRightLeft size={14} /> Settle up
        </button>

        <button
          className="btn ghost desktop-only"
          onClick={onInvite}
          disabled={!active}
        >
          <Users size={14} /> Invite
        </button>

        <button
          className="btn primary"
          onClick={onAddExpense}
          disabled={!active}
        >
          <Plus size={15} /> Add expense
        </button>
      </div>
    </header>
  );
}
