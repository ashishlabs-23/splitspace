"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import { cn } from "@/lib/utils";

export interface TiltCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  /** Class name applied to the interactive 3D tilted card surface */
  className?: string;
  /** Class name applied to the outer perspective wrapper */
  containerClassName?: string;
  /** Inline style applied to the outer perspective wrapper */
  containerStyle?: React.CSSProperties;
  /** Maximum tilt angle in degrees. Default: 12 */
  maxTilt?: number;
  /** Scale factor on hover. Default: 1.02 */
  scale?: number;
  /** 3D Perspective in px. Default: 1000 */
  perspective?: number;
  /** Enable dynamic specular glare / sheen. Default: true */
  glare?: boolean;
  /** Peak opacity of the glare sheen (0 to 1). Default: 0.25 */
  glareOpacity?: number;
  /** Spring stiffness. Default: 320 */
  stiffness?: number;
  /** Spring damping. Default: 25 */
  damping?: number;
  /** Spring mass. Default: 0.5 */
  mass?: number;
  /** Invert tilt direction. Default: false (leans toward pointer) */
  reverse?: boolean;
  /** Disable tilt effect entirely. Default: false */
  disabled?: boolean;
}

export interface TiltCardLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  /** 3D elevation in pixels along the Z-axis. Default: 24 */
  depth?: number;
}

/**
 * TiltCardLayer lifts child elements along the Z-axis in 3D space.
 * Uses compositor-only `translateZ` for multi-plane parallax depth.
 */
export function TiltCardLayer({
  children,
  className,
  depth = 24,
  style,
  ...props
}: TiltCardLayerProps) {
  return (
    <div
      className={cn("tilt-card-layer", className)}
      style={{
        transformStyle: "preserve-3d",
        transform: `translateZ(${depth}px)`,
        willChange: "transform",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * TiltCard — A luxury card that smoothly leans toward the pointer in 3D.
 *
 * Performance guarantees:
 * - Purely compositor-driven (`transform` & `opacity` on GPU layers).
 * - Zero reflow / layout thrashing.
 * - Smooth spring physics with graceful fallback for reduced motion.
 */
export function TiltCard({
  children,
  className,
  containerClassName,
  containerStyle,
  maxTilt = 12,
  scale = 1.02,
  perspective = 1000,
  glare = true,
  glareOpacity = 0.25,
  stiffness = 320,
  damping = 25,
  mass = 0.5,
  reverse = false,
  disabled = false,
  style,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Normalized pointer coordinates: [-0.5, 0.5] from card center
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const hoverScaleTarget = useMotionValue(1);
  const glareOpacityTarget = useMotionValue(0);

  // Hardware-accelerated spring animations
  const springConfig = { stiffness, damping, mass };
  const springX = useSpring(targetX, springConfig);
  const springY = useSpring(targetY, springConfig);
  const springScale = useSpring(hoverScaleTarget, springConfig);
  const springGlareOpacity = useSpring(glareOpacityTarget, {
    stiffness: stiffness * 1.2,
    damping: damping * 1.1,
    mass: mass * 0.8,
  });

  // Detect hover & fine pointer support
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsHoverDevice(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHoverDevice(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const isEffectActive = !disabled && !shouldReduceMotion && isHoverDevice;

  // 3D rotation mapping: card leans towards pointer
  // Pointer Top (targetY < 0) -> rotateX > 0
  // Pointer Right (targetX > 0) -> rotateY > 0
  const dir = reverse ? -1 : 1;
  const rotateX = useTransform(springY, [-0.5, 0.5], [maxTilt * dir, -maxTilt * dir]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxTilt * dir, maxTilt * dir]);

  // Dynamic glare coordinates
  const glareX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isEffectActive || !cardRef.current) {
        onPointerMove?.(e);
        return;
      }

      const rect = cardRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;

        targetX.set(Math.max(-0.5, Math.min(0.5, px)));
        targetY.set(Math.max(-0.5, Math.min(0.5, py)));
      }

      onPointerMove?.(e);
    },
    [isEffectActive, targetX, targetY, onPointerMove]
  );

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isEffectActive) {
        setIsHovered(true);
        hoverScaleTarget.set(scale);
        if (glare) glareOpacityTarget.set(glareOpacity);
      }
      onPointerEnter?.(e);
    },
    [isEffectActive, scale, glare, glareOpacity, hoverScaleTarget, glareOpacityTarget, onPointerEnter]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isEffectActive) {
        setIsHovered(false);
        targetX.set(0);
        targetY.set(0);
        hoverScaleTarget.set(1);
        glareOpacityTarget.set(0);
      }
      onPointerLeave?.(e);
    },
    [isEffectActive, targetX, targetY, hoverScaleTarget, glareOpacityTarget, onPointerLeave]
  );

  return (
    <div
      style={{
        perspective: `${perspective}px`,
        transformStyle: "preserve-3d",
        ...containerStyle,
      }}
      className={cn("tilt-card-wrapper", containerClassName)}
    >
      <motion.div
        ref={cardRef}
        className={cn("tilt-card-surface relative overflow-hidden", className)}
        style={{
          transformStyle: "preserve-3d",
          rotateX: isEffectActive ? rotateX : 0,
          rotateY: isEffectActive ? rotateY : 0,
          scale: isEffectActive ? springScale : 1,
          transform: "translate3d(0, 0, 0)",
          willChange: isHovered ? "transform" : "auto",
          ...style,
        }}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        {children}

        {/* Dynamic Specular Glare / Sheen Overlay (Compositor transforms only) */}
        {glare && isEffectActive && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 select-none rounded-[inherit]"
            style={{
              opacity: springGlareOpacity,
              background: `radial-gradient(circle at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 30%, transparent 65%)`,
              left: glareX,
              top: glareY,
              width: "160%",
              height: "160%",
              transform: "translate3d(-50%, -50%, 0)",
              mixBlendMode: "overlay",
              willChange: "transform, opacity",
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

export default TiltCard;
