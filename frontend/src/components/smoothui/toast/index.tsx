"use client";

/**
 * Toast Stack
 * -----------
 * A full stacking toast notification system built on motion/react.
 *
 * Based on the SmoothUI BasicToast registry component, extended with:
 *  - Global context (useToast hook — no prop drilling)
 *  - Multiple toasts stacked vertically, newest on top
 *  - Collapsed "stack" view when > 1 toast (iOS notification style)
 *  - Auto-dismiss with configurable duration
 *  - Hover-to-expand stacked toasts
 *  - 4 types: success | error | warning | info
 *
 * Setup:
 *   Wrap your app (or layout.tsx) with <ToastProvider />, then call
 *   useToast() anywhere inside.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success("Expense added!");
 *   toast.error("Something went wrong.");
 *   toast.info("Link copied to clipboard.");
 *   toast.warning("No members selected.");
 */

import {
  AlertCircle,
  CheckCircle,
  Info,
  X,
  XCircle,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  toast: {
    success: (message: string, description?: string) => void;
    error:   (message: string, description?: string) => void;
    info:    (message: string, description?: string) => void;
    warning: (message: string, description?: string) => void;
    dismiss: (id: string) => void;
  };
}

/* ─────────────────────────────────────────────────────────────
   Style maps
───────────────────────────────────────────────────────────── */
const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="h-[18px] w-[18px] shrink-0 text-emerald-400" />,
  error:   <XCircle     className="h-[18px] w-[18px] shrink-0 text-red-400"     />,
  info:    <Info        className="h-[18px] w-[18px] shrink-0 text-sky-400"      />,
  warning: <AlertCircle className="h-[18px] w-[18px] shrink-0 text-amber-400"   />,
};

const ACCENT: Record<ToastType, string> = {
  success: "#f16b2d",   // Sunset Tangerine
  error:   "#c73f31",   // Crimson Rust
  info:    "#0d1b42",   // Midnight Navy
  warning: "#f16b2d",   // Sunset Tangerine
};

/* ─────────────────────────────────────────────────────────────
   Context
───────────────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ─────────────────────────────────────────────────────────────
   Single Toast Item
───────────────────────────────────────────────────────────── */
function ToastCard({
  item,
  index,
  total,
  expanded,
  onDismiss,
}: {
  item: ToastItem;
  index: number;     // 0 = newest (top)
  total: number;
  expanded: boolean;
  onDismiss: (id: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  /* stacking offsets: each card behind peeks slightly */
  const scale  = expanded ? 1 : 1 - index * 0.04;
  const yOffset = expanded ? index * 72 : index * 10;
  const opacity = expanded ? 1 : index === 0 ? 1 : index === 1 ? 0.85 : 0.65;
  const zIndex  = total - index;

  return (
    <motion.div
      layout
      key={item.id}
      initial={shouldReduceMotion
        ? { opacity: 0 }
        : { opacity: 0, x: 60, scale: 0.9 }}
      animate={{
        opacity,
        x: 0,
        scale,
        y: yOffset,
        zIndex,
        transition: {
          type: "spring",
          duration: 0.38,
          bounce: 0.18,
        },
      }}
      exit={shouldReduceMotion
        ? { opacity: 0, transition: { duration: 0.15 } }
        : { opacity: 0, x: 72, scale: 0.85, transition: { duration: 0.2 } }}
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 340,
        transformOrigin: "bottom right",
        borderLeft: `3px solid ${ACCENT[item.type]}`,
        background: "rgba(15,23,42,0.96)",
        backdropFilter: "blur(12px)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 14px",
        cursor: index === 0 || expanded ? "default" : "pointer",
        pointerEvents: expanded || index === 0 ? "auto" : "none",
        userSelect: "none",
      }}
    >
      {ICONS[item.type]}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 13.5,
          fontWeight: 500,
          color: "#f1f5f9",
          lineHeight: 1.4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {item.message}
        </p>
        {item.description && (
          <p style={{
            margin: "2px 0 0",
            fontSize: 12,
            color: "#94a3b8",
            lineHeight: 1.4,
          }}>
            {item.description}
          </p>
        )}
      </div>
      {(index === 0 || expanded) && (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(item.id)}
          style={{
            background: "none",
            border: "none",
            padding: "2px 4px",
            cursor: "pointer",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            borderRadius: 6,
            transition: "color 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#64748b")}
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Toast Stack Renderer (portalled to body)
───────────────────────────────────────────────────────────── */
function ToastRenderer({ toasts, dismiss }: {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  /* collapse stack when toasts clear */
  const prevCount = useRef(toasts.length);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (toasts.length === 0) setExpanded(false);
    prevCount.current = toasts.length;
  }, [toasts.length]);

  /* Auto-dismiss per toast */
  useEffect(() => {
    const timers = toasts.map(t =>
      setTimeout(() => dismiss(t.id), t.duration)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts.map(t => t.id).join(",")]);

  if (!mounted) return null;

  /* stack height so container is tall enough */
  const stackHeight = expanded
    ? toasts.length * 72 + 16
    : Math.min(toasts.length, 3) * 10 + 64;

  const content = (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 10000,
        width: 340,
        height: stackHeight,
        transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}
      onMouseEnter={() => toasts.length > 1 && setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <AnimatePresence initial={false}>
        {/* Render newest last so it visually sits on top */}
        {[...toasts].reverse().map((item, reversedIdx) => {
          const index = toasts.length - 1 - reversedIdx; // 0 = newest
          return (
            <ToastCard
              key={item.id}
              item={item}
              index={index}
              total={toasts.length}
              expanded={expanded}
              onDismiss={dismiss}
            />
          );
        })}
      </AnimatePresence>

      {/* Badge showing hidden count when collapsed */}
      {!expanded && toasts.length > 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            background: "#6366f1",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: "999px",
            padding: "2px 7px",
            zIndex: 20001,
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(99,102,241,0.5)",
          }}
        >
          +{toasts.length - 1}
        </motion.div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}

/* ─────────────────────────────────────────────────────────────
   Provider — wrap your app once
───────────────────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((
    type: ToastType,
    message: string,
    description?: string,
    duration = 4000,
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [{ id, type, message, description, duration }, ...prev].slice(0, 5));
  }, []);

  const toast = {
    success: (m: string, d?: string) => push("success", m, d),
    error:   (m: string, d?: string) => push("error",   m, d, 6000),
    info:    (m: string, d?: string) => push("info",    m, d),
    warning: (m: string, d?: string) => push("warning", m, d, 5000),
    dismiss,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastRenderer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}
