"use client";
import { useState } from "react";
import { api, Space, Member } from "@/lib/api";
import { Overlay } from "@/components/ui/overlay";
import { X, AlertTriangle } from "lucide-react";

export function DeleteSpaceModal({
  space,
  user,
  onClose,
  onDeleted,
}: {
  space: Space;
  user: Member | null;
  onClose: () => void;
  onDeleted: (deletedSpaceId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const me = space.members.find(
    (m) =>
      (user?.id && m.id === user.id) ||
      (user?.email && m.email?.toLowerCase() === user.email?.toLowerCase())
  );
  const isOwner = me?.role === "owner" || me?.role === "admin" || space.members.length <= 1;

  async function handleDelete() {
    setBusy(true);
    setErr("");
    try {
      if (isOwner) {
        await api.deleteSpace(space.id);
      } else {
        await api.leaveSpace(space.id);
      }
      onDeleted(space.id);
    } catch (ex: any) {
      setErr(ex.message || "Failed to remove space. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Overlay
      onClose={onClose}
      label={isOwner ? "Delete Space" : "Leave Space"}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{isOwner ? "Delete space" : "Leave space"}</h2>
            <p>Action for {space.emoji} {space.title}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="form" style={{ paddingTop: 4 }}>
          <div className="delete-warning-card">
            <AlertTriangle size={20} />
            <div>
              <strong>{isOwner ? "Permanent Deletion Warning" : "Leave Space"}</strong>
              <p>
                {isOwner
                  ? `Are you sure you want to delete "${space.title}"? This will permanently delete all ${space.expenses.length} ${space.expenses.length === 1 ? "expense" : "expenses"}, split records, balances, invitations, and member history. This action cannot be undone.`
                  : `Are you sure you want to leave "${space.title}"? You will be removed from this space and won't have access to its expenses or settlements.`}
              </p>
            </div>
          </div>

          {err && <div className="form-error">{err}</div>}

          <div className="modal-actions" style={{ marginTop: 8 }}>
            <button className="btn ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              className="btn danger"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? "Removing…" : isOwner ? "Yes, delete space" : "Yes, leave space"}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
