"use client";
import React, { useState } from "react";
import { api, Space, Member } from "@/lib/api";
import { Overlay } from "@/components/ui/overlay";
import {
  X,
  Check,
  ArrowRight,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { currencySymbol, formatMoney } from "@/lib/currencies";
import { Avatar } from "@/components/ui/Avatar";

export function SettleUpModal({
  space,
  defaultPayerId,
  defaultRecipientId,
  defaultAmount,
  onClose,
  onSettled,
}: {
  space: Space;
  defaultPayerId?: string;
  defaultRecipientId?: string;
  defaultAmount?: number;
  onClose: () => void;
  onSettled: () => void;
}) {
  const [fromId, setFromId] = useState(defaultPayerId || space.members[0]?.id || "");
  const [toId, setToId] = useState(
    defaultRecipientId || space.members.find((m) => m.id !== fromId)?.id || space.members[0]?.id || ""
  );
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : "");
  const [note, setNote] = useState("Settled via UPI / Bank Transfer");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const sym = currencySymbol(space.currency);

  const payer = space.members.find((m) => m.id === fromId) || space.members[0];
  const recipient = space.members.find((m) => m.id === toId) || space.members[1] || space.members[0];

  const paymentPresets = [
    "⚡ UPI / GPay",
    "💵 Cash",
    "🏦 Bank Transfer",
    "📱 PhonePe / Paytm",
  ];

  async function handleSettle() {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setErr("Please enter a valid payment amount");
      return;
    }
    if (fromId === toId) {
      setErr("Payer and recipient must be different people");
      return;
    }

    setBusy(true);
    setErr("");
    try {
      await api.createSettlement(space.id, {
        from_member_id: fromId,
        to_member_id: toId,
        amount: numAmount,
        currency: space.currency,
        note: note.trim(),
      });
      onSettled();
    } catch (ex: any) {
      setErr(ex.message || "Could not record payment. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Overlay onClose={onClose} label="Record Payment">
      <div
        className="modal"
        style={{
          maxWidth: 620,
          width: "100%",
          background: "#faf1eb",
          border: "1px solid rgba(241, 107, 45, 0.18)",
          borderRadius: 28,
          padding: "32px",
          boxShadow: "0 30px 80px rgba(13, 27, 66, 0.35)",
          color: "#1e2029",
          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 20,
            borderBottom: "1px solid rgba(13, 27, 66, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "#e0562e",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 6px 18px rgba(224, 86, 46, 0.35)",
                flexShrink: 0,
              }}
            >
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#1e2029",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Record Settlement
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  margin: "4px 0 0",
                  fontWeight: 400,
                }}
              >
                Log a direct transfer between members to clear balances in this space.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
              transition: "color 0.15s, transform 0.15s",
            }}
            className="hover:text-black hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Direction Card (Payer -> Recipient) ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 12,
            alignItems: "center",
            background: "#ffffff",
            border: "1px solid rgba(224, 86, 46, 0.18)",
            borderRadius: 20,
            padding: "18px 20px",
            marginTop: 20,
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(224, 86, 46, 0.05)",
          }}
        >
          {/* Payer Select */}
          <div>
            <span
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Who Paid (Sender)
            </span>
            <div
              style={{
                position: "relative",
                background: "#faf1eb",
                borderRadius: 12,
                border: "1px solid #fbd8cd",
                padding: "8px 12px",
              }}
            >
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1e2029",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {space.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Arrow Indicator */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#faece6",
              color: "#e0562e",
              display: "grid",
              placeItems: "center",
              margin: "0 auto",
              marginTop: 18,
            }}
          >
            <ArrowRight size={18} />
          </div>

          {/* Recipient Select */}
          <div>
            <span
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Who Received (Recipient)
            </span>
            <div
              style={{
                position: "relative",
                background: "#faf1eb",
                borderRadius: 12,
                border: "1px solid #fbd8cd",
                padding: "8px 12px",
              }}
            >
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1e2029",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {space.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Settlement Amount Input Card ── */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            border: "1.5px solid #e0562e",
            borderRadius: 20,
            padding: "20px 22px",
            boxShadow: "0 4px 16px rgba(224, 86, 46, 0.08)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#e0562e",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              SETTLEMENT AMOUNT ({space.currency})
            </span>
            {defaultAmount ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#059669",
                  background: "#ecfdf5",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                Suggested: {formatMoney(defaultAmount, space.currency)}
              </span>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "10px 16px",
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#e0562e",
              }}
            >
              {sym}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErr("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSettle()}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: 22,
                fontWeight: 700,
                color: "#1e2029",
                outline: "none",
              }}
            />
          </div>

          {/* Quick preset chips */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[100, 500, 1000, 2000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  const current = parseFloat(amount) || 0;
                  setAmount((current + val).toString());
                  setErr("");
                }}
                style={{
                  background: "#faf1eb",
                  border: "1px solid #fbd8cd",
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#e0562e",
                  cursor: "pointer",
                }}
                className="hover:bg-orange-500 hover:text-white hover:border-orange-500"
              >
                +{sym}{val}
              </button>
            ))}
            {defaultAmount && (
              <button
                type="button"
                onClick={() => {
                  setAmount(defaultAmount.toString());
                  setErr("");
                }}
                style={{
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: 8,
                  padding: "5px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#059669",
                  cursor: "pointer",
                }}
                className="hover:bg-emerald-600 hover:text-white"
              >
                Exact Balance
              </button>
            )}
          </div>
        </div>

        {/* ── Payment Method / Memo Note ── */}
        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8,
            }}
          >
            Payment Method & Note
          </span>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {paymentPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNote(`Settled via ${preset}`)}
                style={{
                  background: note.includes(preset.split(" ")[1] || "") ? "#e0562e" : "#ffffff",
                  color: note.includes(preset.split(" ")[1] || "") ? "#ffffff" : "#475569",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: "100%",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "11px 14px",
              fontSize: 13,
              color: "#1e2029",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Error Banner */}
        {err && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#b91c1c",
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={16} />
            <span>{err}</span>
          </div>
        )}

        {/* ── Modal Footer Actions ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            paddingTop: 16,
            borderTop: "1px solid rgba(13, 27, 66, 0.08)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              background: "#ffffff",
              border: "1px solid #d8cbbe",
              borderRadius: 12,
              padding: "11px 20px",
              fontSize: 13,
              fontWeight: 600,
              color: "#2d2f39",
              cursor: "pointer",
            }}
            className="hover:bg-orange-50 hover:border-orange-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSettle}
            disabled={busy || !amount}
            style={{
              background: "#e0562e",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              padding: "11px 24px",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(224, 86, 46, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            className="hover:brightness-110"
          >
            {busy ? "Recording…" : "Record Payment →"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
