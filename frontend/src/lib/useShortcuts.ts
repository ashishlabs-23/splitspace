"use client";
import { useEffect } from "react";

export function useShortcuts({
  onNewExpense,
  onNewSpace,
  onInvite,
  onSettleUp,
  onExport,
  onToggleSidebar,
}: {
  onNewExpense?: () => void;
  onNewSpace?: () => void;
  onInvite?: () => void;
  onSettleUp?: () => void;
  onExport?: () => void;
  onToggleSidebar?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        onNewExpense?.();
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        onNewSpace?.();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        onSettleUp?.();
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        onInvite?.();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        onExport?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewExpense, onNewSpace, onInvite, onSettleUp, onExport, onToggleSidebar]);
}
