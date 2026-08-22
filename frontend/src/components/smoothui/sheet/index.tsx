"use client";
import React, { useEffect, useRef, createContext, useContext } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  // Handle native ESC press
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <SheetContext.Provider value={{ open, onClose }}>
      <AnimatePresence>
        {open && (
          <dialog
            ref={dialogRef}
            onCancel={handleCancel}
            style={{
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100vh",
              maxWidth: "100vw",
              maxHeight: "100vh",
              margin: 0,
              padding: 0,
              border: "none",
              background: "transparent",
              overflow: "hidden",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              outline: "none",
            }}
          >
            {children}
          </dialog>
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
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => {
        if (onClick) onClick();
        else onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13, 27, 66, 0.45)",
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
    // 50px-100px drag down or fast downward flick triggers dismissal
    if (info.offset.y > 60 || info.velocity.y > 350) {
      if (onDismiss) onDismiss();
      else onClose();
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{
        type: "spring",
        damping: 26,
        stiffness: 300,
        mass: 0.8,
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.6 }}
      onDragEnd={handleDragEnd}
      style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 540,
        margin: "0 auto",
        background: "#faf1eb",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        border: "1px solid rgba(241, 107, 45, 0.25)",
        borderBottom: "none",
        boxShadow: "0 -20px 60px rgba(13, 27, 66, 0.28)",
        padding: "16px 28px 36px",
        boxSizing: "border-box",
        fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        touchAction: "none",
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
          background: "rgba(13, 27, 66, 0.18)",
          margin: "0 auto 20px",
          cursor: "grab",
        }}
      />
      {children}
    </motion.div>
  );
}
