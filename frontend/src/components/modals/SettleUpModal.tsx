"use client";
import React, { useState, useEffect } from "react";
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
  ExternalLink,
  Zap,
  Globe,
  Copy,
  Smartphone,
} from "lucide-react";
import {
  SUPPORTED_CURRENCIES,
  currencySymbol,
  estimateExchangeRate,
  formatMoney,
} from "@/lib/currencies";
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
  const [currency, setCurrency] = useState(space.currency);
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : "");
  const [exchangeRate, setExchangeRate] = useState<string>("1.0");
  const [note, setNote] = useState("Settled via UPI / Bank Transfer");
  const [paymentMethod, setPaymentMethod] = useState("⚡ UPI / GPay");
  const [upiId, setUpiId] = useState("");
  const [paypalUsername, setPaypalUsername] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const sym = currencySymbol(currency);
  const isForeign = currency.toUpperCase() !== space.currency.toUpperCase();
  const rawNumAmount = parseFloat(amount) || 0;
  const rateNum = Math.max(0.0001, parseFloat(exchangeRate) || 1.0);
  const calculatedSpaceAmount = isForeign ? +(rawNumAmount * rateNum).toFixed(2) : rawNumAmount;

  const payer = space.members.find((m) => m.id === fromId) || space.members[0];
  const recipient = space.members.find((m) => m.id === toId) || space.members[1] || space.members[0];

  // Derive suggested UPI ID or PayPal handle from recipient email if available
  useEffect(() => {
    if (recipient?.email) {
      const emailPrefix = recipient.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "");
      if (!upiId) {
        setUpiId(`${emailPrefix}@okaxis`);
      }
      if (!paypalUsername) {
        setPaypalUsername(emailPrefix);
      }
    }
  }, [recipient]);

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    if (newCurr.toUpperCase() === space.currency.toUpperCase()) {
      setExchangeRate("1.0");
    } else {
      const est = estimateExchangeRate(newCurr, space.currency);
      setExchangeRate(est.toString());
    }
  };

  const paymentPresets = [
    "⚡ UPI / GPay",
    "💵 Cash",
    "🏦 Bank Transfer",
    "🌐 PayPal",
    "📱 PhonePe / Paytm",
  ];

  // UPI deep link for direct payment on mobile devices
  const upiAmount = currency.toUpperCase() === "INR" ? rawNumAmount : calculatedSpaceAmount;
  const upiDeepLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(
        recipient?.name || "Recipient"
      )}&am=${encodeURIComponent(upiAmount.toFixed(2))}&cu=INR&tn=${encodeURIComponent(
        note.trim() || `SplitSpace: ${space.title}`
      )}`
    : "";

  // PayPal me link for international settlements
  const paypalLink = paypalUsername
    ? `https://paypal.me/${encodeURIComponent(paypalUsername.trim())}/${rawNumAmount ? rawNumAmount.toFixed(2) : ""}${currency.toUpperCase() !== "USD" ? currency.toUpperCase() : ""}`
    : "";

  const handleCopyUpiLink = () => {
    if (!upiDeepLink) return;
    navigator.clipboard.writeText(upiDeepLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  async function handleSettle() {
    if (!rawNumAmount || rawNumAmount <= 0) {
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
        amount: calculatedSpaceAmount,
        currency: space.currency,
        original_amount: isForeign ? rawNumAmount : calculatedSpaceAmount,
        original_currency: currency.toUpperCase(),
        exchange_rate: isForeign ? rateNum : 1.0,
        payment_method: paymentMethod,
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
          maxWidth: 580,
          width: "100%",
          margin: "0 auto",
          maxHeight: "92vh",
          overflowY: "auto",
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
              <ArrowRightLeft size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  fontSize: "clamp(17px, 4vw, 21px)",
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
                  fontSize: "clamp(11.5px, 2.8vw, 13px)",
                  color: "#6b7280",
                  margin: "2px 0 0",
                  lineHeight: 1.35,
                }}
              >
                1-click UPI / PayPal payment & multi-currency settlement.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
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

        {/* ── Direction Card (Payer -> Recipient) ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid rgba(224, 86, 46, 0.18)",
            borderRadius: 18,
            padding: "14px",
            marginTop: 16,
            marginBottom: 16,
            boxShadow: "0 2px 8px rgba(224, 86, 46, 0.05)",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10,
              alignItems: "center",
            }}
          >
            {/* Payer Select */}
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                Sender (Paid)
              </span>
              <div
                style={{
                  position: "relative",
                  background: "#faf1eb",
                  borderRadius: 10,
                  border: "1px solid #fbd8cd",
                  padding: "6px 10px",
                }}
              >
                <select
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    fontSize: 13.5,
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

            {/* Recipient Select */}
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                Recipient (Received)
              </span>
              <div
                style={{
                  position: "relative",
                  background: "#faf1eb",
                  borderRadius: 10,
                  border: "1px solid #fbd8cd",
                  padding: "6px 10px",
                }}
              >
                <select
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    fontSize: 13.5,
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
        </div>

        {/* ── Settlement Amount & Currency Input Card ── */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1.5px solid #e0562e",
            borderRadius: 18,
            padding: "16px",
            boxShadow: "0 4px 16px rgba(224, 86, 46, 0.08)",
            marginBottom: 16,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#e0562e",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              SETTLEMENT AMOUNT
            </span>

            {defaultAmount ? (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#059669",
                  background: "#ecfdf5",
                  padding: "2px 6px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
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
              gap: 10,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "6px 12px",
              boxSizing: "border-box",
            }}
          >
            {/* Currency Selector */}
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              style={{
                border: "none",
                background: "#faf1eb",
                borderRadius: 8,
                padding: "6px 8px",
                fontSize: 14,
                fontWeight: 700,
                color: "#e0562e",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>

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
                width: "100%",
                minWidth: 0,
                border: "none",
                background: "transparent",
                fontSize: 20,
                fontWeight: 700,
                color: "#1e2029",
                outline: "none",
              }}
            />
          </div>

          {/* Multi-Currency FX Conversion Note */}
          {isForeign && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                fontSize: 12,
                color: "#166534",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <div>
                Converts to: <strong>{formatMoney(calculatedSpaceAmount, space.currency)}</strong>
                <span style={{ color: "#6b7280", marginLeft: 6 }}>
                  (1 {currency} = {rateNum} {space.currency})
                </span>
              </div>
              <input
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                title="Custom exchange rate"
                style={{
                  width: 70,
                  fontSize: 11,
                  padding: "2px 4px",
                  borderRadius: 6,
                  border: "1px solid #86efac",
                  background: "#ffffff",
                  textAlign: "right",
                }}
              />
            </div>
          )}

          {/* Quick preset chips */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 6,
              marginTop: 10,
            }}
          >
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
                  padding: "6px 2px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#e0562e",
                  cursor: "pointer",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
                className="hover:bg-orange-500 hover:text-white hover:border-orange-500"
              >
                +{sym}{val}
              </button>
            ))}
          </div>

          {defaultAmount ? (
            <button
              type="button"
              onClick={() => {
                if (isForeign) {
                  // convert defaultAmount (in space currency) to selected currency
                  const converted = +(defaultAmount / rateNum).toFixed(2);
                  setAmount(converted.toString());
                } else {
                  setAmount(defaultAmount.toString());
                }
                setErr("");
              }}
              style={{
                width: "100%",
                marginTop: 8,
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 11.5,
                fontWeight: 700,
                color: "#059669",
                cursor: "pointer",
                textAlign: "center",
              }}
              className="hover:bg-emerald-600 hover:text-white"
            >
              Set Exact Balance ({formatMoney(defaultAmount, space.currency)})
            </button>
          ) : null}
        </div>

        {/* ── 1-Click In-App Direct Payment Card (UPI / PayPal) ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "14px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Zap size={16} className="text-amber-500" />
            <strong style={{ fontSize: 13, color: "#1e2029" }}>
              Direct 1-Click In-App Payment
            </strong>
          </div>

          {/* UPI Payment Block */}
          {(currency.toUpperCase() === "INR" || space.currency.toUpperCase() === "INR") && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                Recipient UPI ID / VPA:
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. rahul@okaxis or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  style={{
                    flex: 1,
                    background: "#faf1eb",
                    border: "1px solid #fbd8cd",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 12.5,
                    color: "#1e2029",
                    outline: "none",
                  }}
                />

                {upiDeepLink && (
                  <button
                    type="button"
                    onClick={handleCopyUpiLink}
                    style={{
                      background: "#faf1eb",
                      border: "1px solid #fbd8cd",
                      borderRadius: 10,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#e0562e",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                    }}
                    title="Copy UPI Deep Link URI"
                  >
                    <Copy size={13} />
                    {copiedLink ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>

              {upiId && rawNumAmount > 0 && (
                <div style={{ marginTop: 8 }}>
                  <a
                    href={upiDeepLink}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      width: "100%",
                      background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      color: "#ffffff",
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                      boxSizing: "border-box",
                    }}
                    className="hover:brightness-110 active:scale-98"
                  >
                    <Smartphone size={16} />
                    <span>Pay ₹{upiAmount.toFixed(2)} via UPI App (GPay / PhonePe / Paytm)</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* PayPal Payment Block */}
          <div style={{ marginTop: 8 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
              PayPal.me Handle (for international transfer):
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="PayPal username (e.g. rahul)"
                value={paypalUsername}
                onChange={(e) => setPaypalUsername(e.target.value)}
                style={{
                  flex: 1,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  color: "#1e2029",
                  outline: "none",
                }}
              />

              {paypalUsername && (
                <a
                  href={paypalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#0070ba",
                    color: "#ffffff",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                  className="hover:brightness-110"
                >
                  <Globe size={13} />
                  <span>Open PayPal.me</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
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
                onClick={() => {
                  setPaymentMethod(preset);
                  setNote(`Settled via ${preset}`);
                }}
                style={{
                  background: paymentMethod === preset ? "#e0562e" : "#ffffff",
                  color: paymentMethod === preset ? "#ffffff" : "#475569",
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
            {busy ? "Recording…" : "Record Settlement →"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
