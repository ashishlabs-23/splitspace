"use client";
import { useState } from "react";
import { api, Space, Member } from "@/lib/api";
import { Overlay } from "@/components/ui/overlay";
import { X, UserPlus, AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export function MembersModal({
  space,
  currentUser,
  onClose,
  onChanged,
}: {
  space: Space;
  currentUser?: Member | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [added, setAdded] = useState(0);

  async function add() {
    if (!name.trim() || !email.trim()) {
      return setErr("Enter both a name and email address.");
    }
    setSaving(true);
    setErr("");
    try {
      await api.addMember(space.id, { name: name.trim(), email: email.trim() });
      setName("");
      setEmail("");
      setAdded((n) => n + 1);
      onChanged();
    } catch (ex: any) {
      setErr(ex.message || "Could not add this person.");
    } finally {
      setSaving(false);
    }
  }

  const memberCount = space.members.length + added;

  return (
    <Overlay onClose={onClose} label="Space Members">
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>People</h2>
            <p>{memberCount} {memberCount === 1 ? "person" : "people"} in this space.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="member-modal-list">
          {space.members.map((m) => {
            let displayName = m.name;
            if (
              currentUser?.email &&
              m.email?.toLowerCase() === currentUser.email.toLowerCase() &&
              currentUser.name
            ) {
              displayName = currentUser.name;
            }
            return (
              <div className="member-modal-row" key={m.id}>
                <Avatar m={{ ...m, name: displayName }} />
                <div className="member-info">
                  <strong>{displayName}</strong>
                  <small>{m.email}</small>
                </div>
                <span className={`role-badge ${m.role}`}>{m.role}</span>
              </div>
            );
          })}
        </div>

        <div className="divider" />
        <h3 className="subhead">Add someone</h3>

        <div className="form" style={{ paddingTop: 0 }}>
          <div className="two">
            <label>
              Name
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErr("");
                }}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErr("");
                }}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
            </label>
          </div>

          {err && (
            <div className="form-error">
              <AlertTriangle size={15} />
              <span>{err}</span>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn ghost" onClick={onClose}>
              Done
            </button>
            <button className="btn primary" onClick={add} disabled={saving}>
              {saving ? "Adding…" : "Add person"}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
