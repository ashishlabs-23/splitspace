"use client";
import { Receipt, Plus } from "lucide-react";

export function EmptyExpense({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Receipt size={24} />
      </div>
      <h3>No expenses yet</h3>
      <p>Add the first one — it only takes a few seconds.</p>
      <button className="btn primary" onClick={onAdd}>
        <Plus size={15} /> Add expense
      </button>
    </div>
  );
}
