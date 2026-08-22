"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { api, Space, Expense, Split, SplitMode } from "@/lib/api";
import { Overlay } from "@/components/ui/overlay";
import {
  X,
  Plus,
  AlertTriangle,
  ChevronDown,
  Check,
  Globe,
  Receipt,
  User,
  Tag,
  DollarSign,
  FileText,
} from "lucide-react";
import { EXPENSE_CATEGORIES, getCategoryMeta } from "@/lib/categories";
import {
  SUPPORTED_CURRENCIES,
  currencySymbol,
  estimateExchangeRate,
  formatMoney,
} from "@/lib/currencies";
import { Avatar } from "@/components/ui/Avatar";

function CategoryPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = getCategoryMeta(value);
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    const handleDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [open]);

  return (
    <div style={{ position: "relative", width: "100%" }} ref={containerRef}>
      <button
        type="button"
        style={{
          width: "100%",
          height: 48,
          minHeight: 48,
          maxHeight: 48,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "0 14px",
          cursor: "pointer",
          fontSize: 14,
          color: "#1e2029",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        className="hover:border-orange-400"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, overflow: "hidden" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#faece6",
              color: "#e0562e",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <CurrentIcon size={16} />
          </div>
          <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
            {current.label}
          </span>
        </div>
        <ChevronDown
          size={16}
          style={{
            color: "#6b7280",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            flexShrink: 0,
            marginLeft: 6,
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 14px 36px -8px rgba(13, 27, 66, 0.18)",
            zIndex: 60,
            maxHeight: 230,
            overflowY: "auto",
            padding: 6,
          }}
          role="listbox"
        >
          {EXPENSE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = cat.id === current.id;
            return (
              <button
                key={cat.id}
                type="button"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: isSelected ? "#faece6" : "transparent",
                  color: isSelected ? "#e0562e" : "#1e2029",
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                className="hover:bg-[#fcedea]"
                onClick={() => {
                  onChange(cat.id);
                  setOpen(false);
                }}
                role="option"
                aria-selected={isSelected}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: isSelected ? "#e0562e" : "#f1f5f9",
                    color: isSelected ? "#ffffff" : "#475569",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div>{cat.label}</div>
                </div>
                {isSelected && <Check size={14} style={{ color: "#e0562e" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ExpenseModal({
  space,
  initialExpense,
  onClose,
  onSaved,
}: {
  space: Space;
  initialExpense?: Expense | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(initialExpense);

  const [title, setTitle] = useState(initialExpense?.title ?? "");
  const [currency, setCurrency] = useState(initialExpense?.original_currency ?? space.currency);
  const [origAmount, setOrigAmount] = useState(
    initialExpense ? (initialExpense.original_amount ?? initialExpense.amount).toString() : ""
  );
  const [exchangeRate, setExchangeRate] = useState<string>(
    initialExpense?.exchange_rate ? initialExpense.exchange_rate.toString() : "1.0"
  );
  const [payer, setPayer] = useState(initialExpense?.paid_by.id ?? space.members[0]?.id ?? "");
  const [category, setCategory] = useState(initialExpense?.category ?? "food");
  const [note, setNote] = useState(initialExpense?.note ?? "");

  // Splits & Mode
  const initialSplits = initialExpense?.splits ?? [];
  const initialSelected = initialSplits.length
    ? initialSplits.map((s) => s.user_id)
    : space.members.map((m) => m.id);
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const [mode, setMode] = useState<SplitMode>(initialExpense?.split_mode ?? "equal");

  const [splitInputs, setSplitInputs] = useState<Record<string, string>>(() => {
    if (initialSplits.length) {
      return Object.fromEntries(
        initialSplits.map((s) => [
          s.user_id,
          s.split_value ? s.split_value.toString() : s.amount.toFixed(2),
        ])
      );
    }
    return {};
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);

  // FX Calculation
  const isForeign = currency.toUpperCase() !== space.currency.toUpperCase();
  const rawAmount = Math.max(0, Number(origAmount) || 0);
  const rateNum = Math.max(0.0001, Number(exchangeRate) || 1.0);
  const calculatedTotalInSpaceCurrency = isForeign ? +(rawAmount * rateNum).toFixed(2) : rawAmount;

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    if (newCurr.toUpperCase() === space.currency.toUpperCase()) {
      setExchangeRate("1.0");
    } else {
      const est = estimateExchangeRate(newCurr, space.currency);
      setExchangeRate(est.toString());
    }
  };

  const toggleMember = (mid: string) => {
    setSelected((prev) =>
      prev.includes(mid) ? (prev.length > 1 ? prev.filter((id) => id !== mid) : prev) : [...prev, mid]
    );
  };

  const addPreset = (val: number) => {
    const current = Number(origAmount) || 0;
    setOrigAmount((current + val).toString());
    setErr("");
  };

  const splitCalculations = useMemo(() => {
    const activeMemberIds = space.members.filter((m) => selected.includes(m.id)).map((m) => m.id);
    const count = activeMemberIds.length;
    if (count === 0 || calculatedTotalInSpaceCurrency <= 0) {
      return { isBalanced: true, sum: 0, target: 0, items: [] };
    }

    if (mode === "equal") {
      const cents = Math.round(calculatedTotalInSpaceCurrency * 100);
      const base = Math.floor(cents / count);
      const rem = cents - base * count;
      const items = activeMemberIds.map((id, idx) => ({
        user_id: id,
        amount: (base + (idx < rem ? 1 : 0)) / 100,
        split_value: null,
      }));
      return { isBalanced: true, sum: calculatedTotalInSpaceCurrency, target: calculatedTotalInSpaceCurrency, items };
    }

    if (mode === "exact") {
      let sum = 0;
      const items = activeMemberIds.map((id) => {
        const val = Number(splitInputs[id]) || 0;
        sum += val;
        return { user_id: id, amount: +val.toFixed(2), split_value: null };
      });
      const roundedSum = +sum.toFixed(2);
      return {
        isBalanced: Math.abs(roundedSum - calculatedTotalInSpaceCurrency) < 0.009,
        sum: roundedSum,
        target: calculatedTotalInSpaceCurrency,
        items,
      };
    }

    if (mode === "percentage") {
      let sumPct = 0;
      activeMemberIds.forEach((id) => {
        sumPct += Number(splitInputs[id]) || 0;
      });
      const roundedPct = +sumPct.toFixed(2);
      const items = activeMemberIds.map((id) => {
        const pct = Number(splitInputs[id]) || 0;
        return {
          user_id: id,
          amount: +((pct / 100) * calculatedTotalInSpaceCurrency).toFixed(2),
          split_value: pct,
        };
      });
      return {
        isBalanced: Math.abs(roundedPct - 100) < 0.01,
        sum: roundedPct,
        target: 100,
        items,
      };
    }

    if (mode === "shares") {
      let totalShares = 0;
      activeMemberIds.forEach((id) => {
        totalShares += Math.max(1, Number(splitInputs[id]) || 1);
      });
      const items = activeMemberIds.map((id) => {
        const shares = Math.max(1, Number(splitInputs[id]) || 1);
        return {
          user_id: id,
          amount: +((shares / totalShares) * calculatedTotalInSpaceCurrency).toFixed(2),
          split_value: shares,
        };
      });
      return { isBalanced: totalShares > 0, sum: totalShares, target: totalShares, items };
    }

    return { isBalanced: true, sum: 0, target: 0, items: [] };
  }, [mode, selected, space.members, calculatedTotalInSpaceCurrency, splitInputs]);

  async function save() {
    setErr("");
    if (!title.trim()) {
      setErr("Please enter a title or description for this expense.");
      titleInputRef.current?.focus();
      return;
    }
    if (calculatedTotalInSpaceCurrency <= 0) {
      setErr("Please enter a positive expense amount.");
      return;
    }
    if (!selected.length) {
      setErr("Please select at least one person to split this with.");
      return;
    }
    if (!splitCalculations.isBalanced) {
      if (mode === "exact") {
        setErr(`The custom amounts sum to ${formatMoney(splitCalculations.sum, space.currency)}, which doesn't equal ${formatMoney(calculatedTotalInSpaceCurrency, space.currency)}.`);
      } else if (mode === "percentage") {
        setErr(`Percentages must sum to 100% (currently ${splitCalculations.sum}%).`);
      }
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        amount: calculatedTotalInSpaceCurrency,
        currency: space.currency,
        original_amount: isForeign ? rawAmount : calculatedTotalInSpaceCurrency,
        original_currency: currency.toUpperCase(),
        exchange_rate: isForeign ? rateNum : 1.0,
        category,
        note: note.trim(),
        paid_by: payer,
        split_mode: mode,
        splits: splitCalculations.items,
      };

      if (isEditing && initialExpense) {
        await api.updateExpense(space.id, initialExpense.id, payload);
      } else {
        await api.createExpense(space.id, payload);
      }
      onSaved();
    } catch (ex: any) {
      setErr(ex.message || "Failed to save expense.");
      setSaving(false);
    }
  }

  const activePayerMember = space.members.find((m) => m.id === payer) || space.members[0];

  return (
    <Overlay onClose={onClose} label={isEditing ? "Edit Expense" : "Add Expense"}>
      <div
        className="modal"
        style={{
          width: 560,
          maxWidth: "94vw",
          minHeight: 680,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
          background: "#faf1eb",
          border: "1px solid rgba(241, 107, 45, 0.22)",
          borderRadius: 26,
          padding: "30px",
          boxShadow: "0 30px 80px rgba(13, 27, 66, 0.32)",
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
            paddingBottom: 18,
            borderBottom: "1px solid rgba(13, 27, 66, 0.08)",
          }}
        >
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
              {isEditing ? "Edit Expense" : "Add Expense"}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                margin: "3px 0 0",
                fontWeight: 400,
              }}
            >
              Log a shared cost with automatic split calculations.
            </p>
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
              transition: "all 0.15s",
            }}
            className="hover:text-black hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}
        >
          {/* Error Banner */}
          {err && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{err}</span>
            </div>
          )}

          {/* Title / Description */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              TITLE / DESCRIPTION
            </label>
            <input
              ref={titleInputRef}
              autoFocus
              placeholder="e.g. Dinner at Fisherman's Wharf, Villa booking..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErr("");
              }}
              style={{
                width: "100%",
                height: 48,
                boxSizing: "border-box",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "0 14px",
                fontSize: 14,
                color: "#1e2029",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              className="focus:border-[#e0562e] focus:ring-2 focus:ring-[#e0562e]/20"
            />
          </div>

          {/* Currency & Amount Row */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#6b7280",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  CURRENCY
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    style={{
                      width: "100%",
                      height: 48,
                      boxSizing: "border-box",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "0 28px 0 12px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1e2029",
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#6b7280",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#6b7280",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  AMOUNT ({currencySymbol(currency)})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={origAmount}
                  onChange={(e) => {
                    setOrigAmount(e.target.value);
                    setErr("");
                  }}
                  style={{
                    width: "100%",
                    height: 48,
                    boxSizing: "border-box",
                    background: "#ffffff",
                    border: "2px solid #e0562e",
                    borderRadius: 12,
                    padding: "0 16px",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#1e2029",
                    boxShadow: "0 2px 8px rgba(224, 86, 46, 0.1)",
                  }}
                />
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {[100, 500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addPreset(val)}
                  style={{
                    background: "#fcedea",
                    border: "1px solid #fbd8cd",
                    color: "#e0562e",
                    borderRadius: 12,
                    padding: "5px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  className="hover:bg-[#e0562e] hover:text-white"
                >
                  +{currencySymbol(currency)}{val}
                </button>
              ))}
            </div>
          </div>

          {/* Paid By & Category Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                PAID BY
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={payer}
                  onChange={(e) => setPayer(e.target.value)}
                  style={{
                    width: "100%",
                    height: 48,
                    boxSizing: "border-box",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "0 28px 0 14px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1e2029",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {space.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.id === space.members[0]?.id ? "(You)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                CATEGORY
              </label>
              <CategoryPicker value={category} onChange={setCategory} />
            </div>
          </div>

          {/* Split Mode Segmented Control */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                SPLIT MODE
              </label>
              {mode === "equal" && rawAmount > 0 && selected.length > 0 && (
                <span style={{ fontSize: 11, color: "#e0562e", fontWeight: 700 }}>
                  {formatMoney(calculatedTotalInSpaceCurrency / selected.length, space.currency)} / person
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                background: "rgba(245, 235, 227, 0.9)",
                border: "1px solid rgba(13, 27, 66, 0.08)",
                borderRadius: 14,
                padding: 4,
              }}
            >
              {[
                { id: "equal", label: "Equal" },
                { id: "exact", label: "Exact Amounts" },
                { id: "percentage", label: "Percentages" },
                { id: "shares", label: "Shares" },
              ].map((sm) => {
                const isActive = mode === sm.id;
                return (
                  <button
                    key={sm.id}
                    type="button"
                    onClick={() => setMode(sm.id as SplitMode)}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "none",
                      background: isActive ? "#e0562e" : "transparent",
                      color: isActive ? "#ffffff" : "#475569",
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: isActive ? "0 2px 8px rgba(224, 86, 46, 0.28)" : "none",
                    }}
                  >
                    {sm.label}
                  </button>
                );
              })}
            </div>

            {/* Member selector for non-equal splits */}
            {mode !== "equal" && (
              <div
                style={{
                  marginTop: 10,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {space.members.map((m) => {
                  const isChecked = selected.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        borderRadius: 8,
                        background: isChecked ? "#faf1eb" : "transparent",
                      }}
                    >
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMember(m.id)}
                          style={{ accentColor: "#e0562e" }}
                        />
                        <span>{m.name}</span>
                      </label>
                      {isChecked && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            value={splitInputs[m.id] ?? ""}
                            onChange={(e) => setSplitInputs({ ...splitInputs, [m.id]: e.target.value })}
                            style={{
                              width: 80,
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              textAlign: "right",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          />
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            {mode === "percentage" ? "%" : mode === "shares" ? "share(s)" : currencySymbol(currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              NOTES (OPTIONAL)
            </label>
            <input
              placeholder="Add receipt details, memo or tax info..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                color: "#1e2029",
              }}
              className="focus:border-[#e0562e] focus:ring-2 focus:ring-[#e0562e]/20"
            />
          </div>

          {/* ── Modal Footer ── */}
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
              style={{
                background: "#ffffff",
                border: "1px solid #d8cbbe",
                borderRadius: 12,
                padding: "11px 24px",
                fontSize: 14,
                fontWeight: 600,
                color: "#2d2f39",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              className="hover:bg-[#f1ebe5]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: "#e0562e",
                color: "#ffffff",
                border: "none",
                borderRadius: 12,
                padding: "11px 28px",
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(224, 86, 46, 0.35)",
                transition: "all 0.15s",
              }}
              className="hover:brightness-110 active:scale-95"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}
