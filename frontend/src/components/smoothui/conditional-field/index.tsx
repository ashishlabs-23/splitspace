"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  type HTMLMotionProps,
  type TargetAndTransition,
} from "motion/react";
import { resize } from "motion";
import { cn } from "@/lib/utils";

export interface AnimatedHeightProps
  extends Omit<HTMLMotionProps<"div">, "children" | "animate"> {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  contentClassName?: string;
}

/**
 * AnimatedHeight container that measures its inner content with Motion's `resize()` util
 * and animates the container height smoothly whenever contents change or mount/unmount.
 */
export function AnimatedHeight({
  children,
  className,
  contentClassName,
  duration = 0.35,
  style,
  ...props
}: AnimatedHeightProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const isInitial = useRef(true);

  useEffect(() => {
    if (!contentRef.current) return;

    // Use Motion's resize() utility to observe DOM size changes
    const cleanup = resize(contentRef.current, () => {
      if (!contentRef.current) return;
      const measured = contentRef.current.offsetHeight;

      if (isInitial.current) {
        isInitial.current = false;
        setHeight(measured);
      } else {
        setHeight(measured);
      }
    });

    return () => cleanup?.();
  }, []);

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial={false}
      animate={{ height }}
      transition={{
        duration,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        willChange: "height",
        ...style,
      }}
      {...props}
    >
      <div ref={contentRef} className={cn("w-full", contentClassName)}>
        {children}
      </div>
    </motion.div>
  );
}

export interface ConditionalFieldProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
  /** Y offset in px for slide effect. Default: -8 */
  yOffset?: number;
  /** Initial opacity. Default: 0 */
  initialOpacity?: number;
}

/**
 * ConditionalField — A field that animates in and out with fade, slide, and blur effects.
 */
export function ConditionalField({
  isVisible,
  children,
  className,
  yOffset = -8,
  initialOpacity = 0,
}: ConditionalFieldProps) {
  return (
    <AnimatePresence initial={false} mode="sync">
      {isVisible && (
        <motion.div
          key="conditional-field"
          initial={{
            opacity: initialOpacity,
            y: yOffset,
            filter: "blur(4px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
          }}
          exit={{
            opacity: 0,
            y: yOffset,
            filter: "blur(4px)",
          }}
          transition={{
            opacity: { duration: 0.26, ease: "easeOut" },
            y: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
            filter: { duration: 0.24 },
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnimatedHeight;
