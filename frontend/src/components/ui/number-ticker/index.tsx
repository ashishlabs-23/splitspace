"use client";

/**
 * NumberTicker
 * ─────────────
 * Animates a number from 0 to target when scrolled into view,
 * with motion/react imperative spring physics and live string transforms.
 */

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useRef } from "react";

export interface NumberTickerProps {
  /** Target numeric value */
  value: number;
  /** Custom format function — receives the live interpolated number */
  format?: (n: number) => string;
  /** Appended after the formatted value */
  suffix?: string;
  /** Prepended before the formatted value */
  prefix?: string;
  /** Spring duration in seconds. Default: 1.2 */
  duration?: number;
  /** Spring bounce 0–1. Default: 0.04 */
  bounce?: number;
  /** Decimal places when no format fn provided. Default: 0 */
  decimals?: number;
  /** Whether to trigger only when scrolled into view. Default: true */
  triggerOnView?: boolean;
  className?: string;
}

export default function NumberTicker({
  value,
  format,
  suffix = "",
  prefix = "",
  duration = 1.2,
  bounce = 0.04,
  decimals = 0,
  triggerOnView = true,
  className,
}: NumberTickerProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(spanRef, { once: true, amount: 0.2 });
  const motionVal = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const prevRef = useRef(0);
  const hasAnimated = useRef(false);

  /* Transform the live motion value → display string */
  const display = useTransform(motionVal, (latest) => {
    if (format) return prefix + format(latest) + suffix;
    return prefix + latest.toFixed(decimals) + suffix;
  });

  useEffect(() => {
    if (triggerOnView && !isInView) return;

    const from = hasAnimated.current ? prevRef.current : 0;
    prevRef.current = value;
    hasAnimated.current = true;

    if (reduceMotion) {
      motionVal.set(value);
      return;
    }

    const controls = animate(motionVal, value, {
      type: "spring",
      duration,
      bounce,
      from,
    });

    return () => controls.stop();
  }, [value, isInView, triggerOnView, duration, bounce, reduceMotion, motionVal]);

  return (
    <motion.span ref={spanRef} className={className}>
      {display}
    </motion.span>
  );
}

/**
 * CurrencyTicker — convenience wrapper pre-configured for currency display with scroll-in animation.
 */
export function CurrencyTicker({
  value,
  currency = "INR",
  className,
  duration = 1.2,
  bounce = 0.04,
  triggerOnView = true,
}: {
  value: number;
  currency?: string;
  className?: string;
  duration?: number;
  bounce?: number;
  triggerOnView?: boolean;
}) {
  return (
    <NumberTicker
      value={value}
      className={className}
      duration={duration}
      bounce={bounce}
      triggerOnView={triggerOnView}
      format={(n) =>
        new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(n)
      }
    />
  );
}
