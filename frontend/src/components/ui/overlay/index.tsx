"use client";

/**
 * Overlay Primitives
 * ==================
 * Three composable primitives for modals, sheets and command palettes:
 *
 *  1. useFocusTrap     — keeps keyboard focus inside a container
 *  2. useScrollLock    — prevents body/html scroll while active
 *  3. <OverlayBackdrop>— animated dimming backdrop via motion/react
 *  4. <Overlay>        — composes all three + Escape key handling
 *
 * Usage (replace any existing modal wrapper):
 *
 *   <Overlay onClose={close} label="Edit expense">
 *     <div role="dialog" aria-modal="true">
 *       ...modal content...
 *     </div>
 *   </Overlay>
 *
 * The backdrop click closes the overlay; focus is trapped inside;
 * body scroll is locked; Escape key fires onClose.
 */

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────────────────────
   1. useFocusTrap
   ─────────────────────────────────────────────────────────── */

/** All natively focusable elements */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), details > summary';

export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;
    /** remember who had focus before we opened */
    const previouslyFocused = document.activeElement as HTMLElement | null;

    /** focus first focusable child */
    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        e => !e.closest('[aria-hidden="true"]')
      );

    const first = focusables()[0];
    if (first) first.focus();

    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key !== "Tab") return;
      const all = focusables();
      if (!all.length) { e.preventDefault(); return; }

      const firstEl = all[0];
      const lastEl  = all[all.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap from first → last
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: wrap from last → first
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    el.addEventListener("keydown", handleKeyDown);

    return () => {
      el.removeEventListener("keydown", handleKeyDown);
      /** restore focus to whatever was focused before overlay opened */
      previouslyFocused?.focus?.();
    };
  }, [active, ref]);
}

/* ─────────────────────────────────────────────────────────────
   2. useScrollLock
   ─────────────────────────────────────────────────────────── */

/**
 * Locks body scroll while active.
 * Preserves the current scroll position and prevents layout shift
 * by compensating for the scrollbar width.
 */
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;

    const scrollY      = window.scrollY;
    const scrollbarW   = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow      = document.body.style.overflow;
    const originalPaddingRight  = document.body.style.paddingRight;
    const originalTop           = document.body.style.top;
    const originalPosition      = document.body.style.position;
    const originalWidth         = document.body.style.width;

    document.body.style.overflow     = "hidden";
    document.body.style.paddingRight = `${scrollbarW}px`;
    document.body.style.position     = "fixed";
    document.body.style.top          = `-${scrollY}px`;
    document.body.style.width        = "100%";

    return () => {
      document.body.style.overflow     = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.position     = originalPosition;
      document.body.style.top          = originalTop;
      document.body.style.width        = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

/* ─────────────────────────────────────────────────────────────
   3. OverlayBackdrop — animated dimming backdrop
   ─────────────────────────────────────────────────────────── */

interface OverlayBackdropProps {
  onClick?: () => void;
  /** Backdrop opacity at full darkness. Default: 0.72 */
  opacity?: number;
  /** Blur amount in px. Default: 6 */
  blur?: number;
}

export function OverlayBackdrop({
  onClick,
  opacity = 0.72,
  blur = 6,
}: OverlayBackdropProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
      onClick={onClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 79,                                       /* just below modal */
        background: `rgba(5, 9, 18, ${opacity})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        cursor: onClick ? "pointer" : "default",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   4. OverlayContent — animated modal/sheet container
   ─────────────────────────────────────────────────────────── */

interface OverlayContentProps {
  children: ReactNode;
  /** ARIA label for the dialog (shown to screen readers) */
  label: string;
  onClose: () => void;
  className?: string;
}

export function OverlayContent({
  children,
  label,
  onClose,
  className,
}: OverlayContentProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useFocusTrap(ref);

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
      transition={reduceMotion ? { duration: 0 } : {
        type: "spring",
        duration: 0.32,
        bounce: 0.16,
      }}
      style={{
        position: "relative",
        zIndex: 80,
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ pointerEvents: "auto", width: "100%", maxWidth: "100%", display: "flex", justifyContent: "center", boxSizing: "border-box" }}>
        {children}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. <Overlay> — the all-in-one composed primitive
   ─────────────────────────────────────────────────────────── */

export interface OverlayProps {
  /** Controls visibility — use with AnimatePresence for exit animations */
  open?: boolean;
  /** Called on Escape key or backdrop click */
  onClose: () => void;
  children: ReactNode;
  /** ARIA label for the dialog */
  label: string;
  /** If true, clicking the backdrop does NOT close the overlay */
  persistent?: boolean;
  /** Backdrop dimness. Default: 0.72 */
  backdropOpacity?: number;
  /** Backdrop blur in px. Default: 6 */
  backdropBlur?: number;
  className?: string;
}

/**
 * Full-featured overlay:
 *  - Scroll lock on body
 *  - Escape key → onClose
 *  - Backdrop click → onClose (unless persistent)
 *  - Focus trapped inside
 *  - Animated backdrop + content via motion/react
 *  - Portalled to document.body
 */
export function Overlay({
  open = true,
  onClose,
  children,
  label,
  persistent = false,
  backdropOpacity = 0.72,
  backdropBlur = 6,
  className,
}: OverlayProps) {
  /* Scroll lock */
  useScrollLock(open);

  /* Escape key */
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <OverlayBackdrop
            onClick={persistent ? undefined : onClose}
            opacity={backdropOpacity}
            blur={backdropBlur}
          />
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              pointerEvents: "none",   /* let backdrop handle clicks */
              boxSizing: "border-box",
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <OverlayContent
              label={label}
              onClose={onClose}
              className={className}
            >
              {children}
            </OverlayContent>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
