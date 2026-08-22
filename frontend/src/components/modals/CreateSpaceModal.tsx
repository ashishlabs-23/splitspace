"use client";
import { useState } from "react";
import { api, Space } from "@/lib/api";
import { Overlay } from "@/components/ui/overlay";
import { X } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";

export function CreateSpaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (s: Space) => void;
}) {
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [emoji, setEmoji] = useState("🌴");
  const [currency, setCurrency] = useState("INR");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function create() {
    if (!title.trim()) return;
    setSaving(true);
    setErr("");
    try {
      const sp = await api.createSpace({
        title: title.trim(),
        period: period.trim(),
        emoji,
        currency,
      });
      onCreated(sp);
    } catch (ex: any) {
      setErr(ex.message || "Could not create space. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose} label="Create a new space">
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>Create a new space</h2>
            <p>A trip, party, home, project — anything you share.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="form">
          <label>
            What are you tracking?
            <input
              autoFocus
              placeholder="e.g. Goa Trip, Flatmates, Euro Tour"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </label>

          <div className="emoji-picker">
            {["🌴", "✈️", "🏠", "🎉", "🍱", "🚗", "🏕️", "🎓", "🏖️", "🎸", "⛷️", "🚢"].map((x) => (
              <button
                key={x}
                type="button"
                className={emoji === x ? "active" : ""}
                onClick={() => setEmoji(x)}
              >
                {x}
              </button>
            ))}
          </div>

          <div className="two">
            <label>
              Dates (optional)
              <input
                placeholder="e.g. 18–20 Aug"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </label>
            <label>
              Base Currency
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="helper">You can invite friends and track multiple currencies once created.</div>
          {err && <div className="form-error">{err}</div>}

          <div className="modal-actions">
            <button className="btn ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={create}
              disabled={saving || !title.trim()}
            >
              {saving ? "Creating…" : "Create space →"}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
