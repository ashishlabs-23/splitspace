"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode } from "react";

interface TransitionProps {
  children: ReactNode;
  color?: string;
}

/** Smooth non-intrusive page transition without viewport curtain wipes */
export function CurtainTransition({ children }: TransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {children}
    </motion.div>
  );
}

/** Root-level AnimatePresence wrapper for page states */
export function PageCurtain({
  pageKey,
  children,
}: {
  pageKey: string;
  children: ReactNode;
  color?: string;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <CurtainTransition key={pageKey}>
        {children}
      </CurtainTransition>
    </AnimatePresence>
  );
}

/** Lighter in-page transition for swapping dashboard spaces */
export function SpaceContentCurtain({
  spaceKey,
  children,
}: {
  spaceKey: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={spaceKey}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

