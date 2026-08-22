"use client";
import { useState, useRef, useEffect } from "react";
import { Expense } from "@/lib/api";
import { MoreHorizontal, Pencil, Trash2, AlertTriangle, Globe } from "lucide-react";
import { getCategoryMeta } from "@/lib/categories";
import { formatMoney, currencySymbol } from "@/lib/currencies";

const timeAgo = (iso: string) => {
  const d = Math.max(0, Date.now() - new Date(iso).getTime());
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
};

export function ExpenseRow({
  e,
  c,
  isOpen,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDelete,
}: {
  e: Expense;
  c: string;
  isOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onEdit: (e: Expense) => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cat = getCategoryMeta(e.category);
  const CatIcon = cat.icon;

  const isForeign = e.original_currency && e.original_currency.toUpperCase() !== c.toUpperCase();

  useEffect(() => {
    if (!isOpen) {
      setConfirming(false);
      return;
    }
    const handler = (ev: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
        onCloseMenu();
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onCloseMenu]);

  return (
    <div
      className={`expense-row ${isOpen ? "menu-open" : ""}`}
      style={{ position: "relative", zIndex: isOpen ? 60 : "auto" }}
    >
      <div className={`category-badge ${cat.colorClass}`} title={cat.label}>
        <CatIcon size={18} />
      </div>

      <div className="expense-main" style={{ cursor: "pointer" }} onClick={() => onEdit(e)}>
        <div className="expense-title-row">
          <strong>{e.title}</strong>
          <span className="category-tag">
            <CatIcon size={10} /> {cat.label}
          </span>
          {e.split_mode && e.split_mode !== "equal" && (
            <span
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 4,
                background: "rgba(99, 102, 241, 0.12)",
                color: "var(--violet)",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {e.split_mode}
            </span>
          )}
        </div>
        <small>
          {e.note ? `${e.note} · ` : ""}Paid by {e.paid_by.name} · {timeAgo(e.created_at)}
        </small>
      </div>

      <div className="expense-right">
        <div style={{ textAlign: "right" }}>
          <strong>{formatMoney(e.amount, c)}</strong>
          {isForeign && (
            <small style={{ display: "block", fontSize: 10, color: "var(--text3)" }}>
              {currencySymbol(e.original_currency!)}{e.original_amount} ({e.original_currency})
            </small>
          )}
        </div>

        <button
          type="button"
          className="icon-btn sm"
          onClick={(ev) => {
            ev.stopPropagation();
            onToggleMenu();
            setConfirming(false);
          }}
          aria-label="Expense options"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      {isOpen && (
        <div className="expense-menu" ref={menuRef}>
          {confirming ? (
            <div className="expense-menu-confirm">
              <span>
                <AlertTriangle size={12} /> Delete this expense?
              </span>
              <div className="expense-menu-actions">
                <button className="menu-btn-cancel" onClick={() => setConfirming(false)}>
                  Keep
                </button>
                <button
                  className="menu-btn-delete"
                  onClick={() => {
                    onCloseMenu();
                    setConfirming(false);
                    onDelete();
                  }}
                >
                  Yes, delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onCloseMenu();
                  onEdit(e);
                }}
              >
                <Pencil size={13} /> Edit expense
              </button>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setConfirming(true);
                }}
                className="danger"
              >
                <Trash2 size={13} /> Delete expense
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
