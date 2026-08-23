"use client";
import React, { useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";

interface SheetContextValue {
  open: boolean;
  onClose: () => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheet() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet compound components must be rendered within <Sheet>");
  }
  return context;
}

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, children }: SheetProps) {
  // Lock body scroll and handle Escape key on all platforms
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <SheetContext.Provider value={{ open, onClose }}>
      <AnimatePresence>
        {open && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              width: "100%",
              height: "100%",
              margin: 0,
              padding: 0,
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              outline: "none",
            }}
          >
            {children}
          </div>
        )}
      </AnimatePresence>
    </SheetContext.Provider>
  );
}

export function SheetBackdrop({
  className = "",
  style,
  onClick,
}: {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const { onClose } = useSheet();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onClick={() => {
        if (onClick) onClick();
        else onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(33, 23, 10, 0.48)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 1,
        ...style,
      }}
      className={className}
    />
  );
}

export function SheetPanel({
  children,
  className = "",
  style,
  onDismiss,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onDismiss?: () => void;
}) {
  const { onClose } = useSheet();

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // 50px drag down or fast downward flick triggers dismissal
    if (info.offset.y > 50 || info.velocity.y > 300) {
      if (onDismiss) onDismiss();
      else onClose();
    }
  };

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0.9 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{
        type: "spring",
        damping: 28,
        stiffness: 320,
        mass: 0.8,
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.5 }}
      onDragEnd={handleDragEnd}
      style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 540,
        maxHeight: "92vh",
        margin: "0 auto",
        background: "#ffffff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        border: "1.5px solid rgba(200, 126, 10, 0.25)",
        borderBottom: "none",
        boxShadow: "0 -20px 60px rgba(33, 23, 10, 0.25)",
        padding: "14px 24px 32px",
        boxSizing: "border-box",
        fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        ...style,
      }}
      className={className}
    >
      {/* ── Drag & Flick Pill Handle ── */}
      <div
        style={{
          width: 44,
          height: 5,
          borderRadius: 3,
          background: "rgba(33, 23, 10, 0.18)",
          margin: "0 auto 16px",
          cursor: "grab",
          touchAction: "none",
        }}
      />
      {children}
    </motion.div>
  );
}
