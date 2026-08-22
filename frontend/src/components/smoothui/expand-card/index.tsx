"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

export interface ExpandCardTriggerProps {
  layoutId: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ExpandCardTrigger({
  layoutId,
  onClick,
  children,
  className = "",
  style,
}: ExpandCardTriggerProps) {
  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      style={{ cursor: "pointer", ...style }}
      className={className}
      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.99 }}
    >
      {children}
    </motion.div>
  );
}

export interface ExpandCardModalProps {
  layoutId: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number | string;
}

export function ExpandCardModal({
  layoutId,
  isOpen,
  onClose,
  children,
  maxWidth = 520,
}: ExpandCardModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9990,
            display: "grid",
            placeItems: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(13, 27, 66, 0.5)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Morphing Expanded Detail Panel */}
          <motion.div
            layoutId={layoutId}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 300,
              mass: 0.85,
            }}
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              maxWidth,
              background: "#faf1eb",
              borderRadius: 26,
              border: "1px solid rgba(241, 107, 45, 0.25)",
              boxShadow: "0 30px 90px rgba(13, 27, 66, 0.35)",
              padding: "28px",
              boxSizing: "border-box",
              color: "#1e2029",
              fontFamily: "'Space Grotesk', -apple-system, sans-serif",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close expanded card"
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(13, 27, 66, 0.08)",
                border: "none",
                color: "#1e2029",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                transition: "all 0.15s",
                zIndex: 10,
              }}
              className="hover:bg-black hover:text-white"
            >
              <X size={16} />
            </button>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
