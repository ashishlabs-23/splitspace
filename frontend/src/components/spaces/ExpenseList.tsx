"use client";
import React, { useState } from "react";
import { Space, Expense } from "@/lib/api";
import { formatMoney, convertAmount } from "@/lib/currencies";
import { Plus, MoreVertical, Edit2, Trash2, Receipt, Calendar, Users, FileText, ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { Avatar } from "@/components/ui/Avatar";
import { getCategoryMeta } from "@/lib/categories";
import { ExpandCardTrigger, ExpandCardModal } from "@/components/smoothui/expand-card";

export function ExpenseList({
  space,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: {
  space: Space;
  onAddExpense: () => void;
  onEditExpense: (e: Expense) => void;
  onDeleteExpense: (e: Expense) => void;
}) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const selectedCategoryMeta = selectedExpense ? getCategoryMeta(selectedExpense.category) : null;
  const SelectedIcon = selectedCategoryMeta?.icon || Receipt;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Recent expenses</h2>
          <p>Itemized ledger for this space.</p>
        </div>
        <button className="add-btn" onClick={onAddExpense} aria-label="Add new expense">
          <Plus size={13} /> Add
        </button>
      </div>

      <div className="expense-list">
        {space.expenses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text3)" }}>
            <Receipt size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
            <strong style={{ display: "block", color: "var(--text)", fontSize: 13, marginBottom: 4 }}>
              No expenses recorded yet
            </strong>
            <p style={{ fontSize: 12, margin: 0 }}>Add your first group expense to start tracking splits.</p>
          </div>
        ) : (
          space.expenses.map((e, i) => {
            const cat = getCategoryMeta(e.category);
            const Icon = cat.icon;
            const isMenuOpen = openMenuId === e.id;

            return (
              <ScrollReveal
                key={e.id}
                delay={Math.min(i * 0.05, 0.3)}
                distance={14}
                duration={0.4}
                threshold={0.05}
              >
                {/* ── App Store-Style Morphing Trigger Tile ── */}
                <ExpandCardTrigger
                  layoutId={`expense-${e.id}`}
                  onClick={() => setSelectedExpense(e)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "#ffffff",
                    border: "1px solid rgba(13, 27, 66, 0.08)",
                    borderRadius: 14,
                    marginBottom: 10,
                    boxShadow: "0 2px 8px rgba(13, 27, 66, 0.03)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  className="hover:border-orange-300 hover:shadow-md"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "#faece6",
                        color: "#e0562e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong
                          style={{
                            fontSize: 14,
                            color: "#1e2029",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {e.title}
                        </strong>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background: "rgba(224, 86, 46, 0.08)",
                            color: "#e0562e",
                            padding: "2px 8px",
                            borderRadius: 6,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {cat.label}
                        </span>
                      </div>
                      <small style={{ color: "#6b7280", fontSize: 11.5, display: "block", marginTop: 2 }}>
                        Paid by {e.paid_by.name} · {new Date(e.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <strong style={{ fontSize: 15, fontWeight: 700, color: "#1e2029" }}>
                      {formatMoney(e.amount, e.currency || space.currency)}
                    </strong>

                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        className="icon-btn sm"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : e.id);
                        }}
                        aria-label="Expense options"
                        style={{ padding: 4, borderRadius: 6 }}
                      >
                        <MoreVertical size={15} />
                      </button>

                      {isMenuOpen && (
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 32,
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                            zIndex: 50,
                            padding: 6,
                            minWidth: 120,
                          }}
                          onClick={(evt) => evt.stopPropagation()}
                        >
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#1e2029",
                              background: "transparent",
                              borderRadius: 6,
                              cursor: "pointer",
                              border: "none",
                            }}
                            className="hover:bg-slate-100"
                            onClick={() => {
                              setOpenMenuId(null);
                              onEditExpense(e);
                            }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#b91c1c",
                              background: "transparent",
                              borderRadius: 6,
                              cursor: "pointer",
                              border: "none",
                            }}
                            className="hover:bg-red-50"
                            onClick={() => {
                              setOpenMenuId(null);
                              onDeleteExpense(e);
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </ExpandCardTrigger>
              </ScrollReveal>
            );
          })
        )}
      </div>

      {/* ── App Store-Style Centered Morphing Detail Modal ── */}
      {selectedExpense && (
        <ExpandCardModal
          layoutId={`expense-${selectedExpense.id}`}
          isOpen={Boolean(selectedExpense)}
          onClose={() => setSelectedExpense(null)}
          maxWidth={500}
        >
          <div>
            {/* Header with Category Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
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
                }}
              >
                <SelectedIcon size={24} />
              </div>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#e0562e",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {selectedCategoryMeta?.label}
                </span>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#1e2029",
                    margin: "2px 0 0",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {selectedExpense.title}
                </h3>
              </div>
            </div>

            {/* Total Amount Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(224, 86, 46, 0.18)",
                borderRadius: 18,
                padding: "18px 20px",
                marginBottom: 18,
                boxShadow: "0 2px 8px rgba(224, 86, 46, 0.05)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                Total Expense Amount
              </span>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1e2029", marginTop: 4 }}>
                {formatMoney(selectedExpense.amount, selectedExpense.currency || space.currency)}
              </div>
              {selectedExpense.original_currency &&
                selectedExpense.original_currency !== space.currency && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    Converted from {formatMoney(selectedExpense.original_amount ?? selectedExpense.amount, selectedExpense.original_currency)} @ {selectedExpense.exchange_rate} FX rate
                  </div>
                )}

              {/* Multi-Currency Equivalent Badges */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                {["USD", "EUR", "GBP", "INR", "AED"].filter(c => c !== (selectedExpense.currency || space.currency)).slice(0, 4).map(target => (
                  <span
                    key={target}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: "rgba(0, 0, 0, 0.04)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      color: "#4b5563",
                    }}
                  >
                    ≈ {formatMoney(convertAmount(selectedExpense.amount, selectedExpense.currency || space.currency, target), target)}
                  </span>
                ))}
              </div>
            </div>

            {/* Metadata (Payer & Date) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "12px 14px",
                }}
              >
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                  Paid By
                </span>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1e2029", marginTop: 2 }}>
                  {selectedExpense.paid_by.name}
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "12px 14px",
                }}
              >
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                  Date Logged
                </span>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1e2029", marginTop: 2 }}>
                  {new Date(selectedExpense.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Split Breakdown */}
            <div
              style={{
                background: "rgba(245, 235, 227, 0.75)",
                border: "1px solid rgba(13, 27, 66, 0.08)",
                borderRadius: 16,
                padding: "16px",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                  Split Breakdown ({selectedExpense.split_mode || "equal"})
                </span>
                <span style={{ fontSize: 11, color: "#e0562e", fontWeight: 700 }}>
                  {selectedExpense.splits?.length || space.members.length} member(s)
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                {(selectedExpense.splits && selectedExpense.splits.length > 0
                  ? selectedExpense.splits
                  : space.members.map((m) => ({
                      user_id: m.id,
                      amount: selectedExpense.amount / Math.max(space.members.length, 1),
                    }))
                ).map((sp) => {
                  const member = space.members.find((m) => m.id === sp.user_id);
                  return (
                    <div
                      key={sp.user_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: "8px 12px",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e2029" }}>
                        {member?.name || "Member"}
                      </span>
                      <strong style={{ fontSize: 13, color: "#e0562e" }}>
                        {formatMoney(sp.amount, space.currency)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes if any */}
            {selectedExpense.note && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "12px 14px",
                  marginBottom: 20,
                  fontSize: 13,
                  color: "#475569",
                }}
              >
                <strong style={{ display: "block", fontSize: 11, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>
                  Receipt Notes
                </strong>
                {selectedExpense.note}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  const exp = selectedExpense;
                  setSelectedExpense(null);
                  onEditExpense(exp);
                }}
                style={{
                  flex: 1,
                  background: "#e0562e",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 14px rgba(224, 86, 46, 0.3)",
                }}
                className="hover:brightness-110"
              >
                <Edit2 size={14} /> Edit Expense
              </button>

              <button
                type="button"
                onClick={() => {
                  const exp = selectedExpense;
                  setSelectedExpense(null);
                  onDeleteExpense(exp);
                }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #d8cbbe",
                  borderRadius: 12,
                  padding: "12px 18px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#b91c1c",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                className="hover:bg-red-50 hover:border-red-200"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </ExpandCardModal>
      )}
    </section>
  );
}
