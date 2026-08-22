"use client";

/**
 * ScrollReveal -- Sticky-reveal wrapper using motion/react.
 *
 * Each child fades + slides up as it enters the viewport.
 * Respects `prefers-reduced-motion` automatically (motion/react handles this).
 */

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode, type CSSProperties } from "react";

export interface ScrollRevealProps {
  children: ReactNode;
  /** Delay before animation starts (seconds). Default: 0 */
  delay?: number;
  /** Distance the element travels upward on reveal (px). Default: 28 */
  distance?: number;
  /** Animation duration (seconds). Default: 0.55 */
  duration?: number;
  /** Spring bounce 0-1. Default: 0.15 */
  bounce?: number;
  /** Only animate once. Default: true */
  once?: boolean;
  /** How much of element must be visible to trigger (0-1). Default: 0.15 */
  threshold?: number;
  className?: string;
  style?: CSSProperties;
}

export default function ScrollReveal({
  children,
  delay = 0,
  distance = 28,
  duration = 0.55,
  bounce = 0.15,
  once = true,
  threshold = 0.15,
  className,
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount: threshold });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: distance }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      transition={{
        type: "spring",
        duration,
        bounce,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollRevealList -- wraps each child in a staggered ScrollReveal.
 *
 * Usage:
 *   <ScrollRevealList stagger={0.07}>
 *     {items.map(item => <Card key={item.id} {...item} />)}
 *   </ScrollRevealList>
 */
export function ScrollRevealList({
  children,
  stagger = 0.08,
  distance = 24,
  duration = 0.5,
  threshold = 0.1,
  className,
  itemClassName,
}: {
  children: ReactNode[];
  stagger?: number;
  distance?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <ScrollReveal
          key={i}
          delay={i * stagger}
          distance={distance}
          duration={duration}
          threshold={threshold}
          className={itemClassName}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
