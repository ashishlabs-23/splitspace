"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface DataPoint {
  date: string;
  label?: string;
  value: number;
}

export interface DrawnGraphProps {
  data: number[] | DataPoint[];
  width?: number | string;
  height?: number;
  color?: "teal" | "violet" | "gold" | "blue" | "emerald";
  showArea?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animateOnView?: boolean;
  duration?: number;
  currency?: string;
  className?: string;
}

const colorMap = {
  teal: {
    stroke: "var(--primary, #f16b2d)",
    gradientStart: "rgba(241, 107, 45, 0.40)",
    gradientEnd: "rgba(241, 107, 45, 0.0)",
    glow: "rgba(241, 107, 45, 0.45)",
  },
  violet: {
    stroke: "var(--secondary, #c73f31)",
    gradientStart: "rgba(199, 63, 49, 0.40)",
    gradientEnd: "rgba(199, 63, 49, 0.0)",
    glow: "rgba(199, 63, 49, 0.45)",
  },
  gold: {
    stroke: "#f16b2d",
    gradientStart: "rgba(241, 107, 45, 0.40)",
    gradientEnd: "rgba(241, 107, 45, 0.0)",
    glow: "rgba(241, 107, 45, 0.45)",
  },
  blue: {
    stroke: "#0d1b42",
    gradientStart: "rgba(13, 27, 66, 0.30)",
    gradientEnd: "rgba(13, 27, 66, 0.0)",
    glow: "rgba(13, 27, 66, 0.35)",
  },
  emerald: {
    stroke: "#f16b2d",
    gradientStart: "rgba(241, 107, 45, 0.40)",
    gradientEnd: "rgba(241, 107, 45, 0.0)",
    glow: "rgba(241, 107, 45, 0.45)",
  },
};

/**
 * Generates a smooth cubic bezier SVG path from coordinate points.
 */
function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return path;
}

/**
 * DrawnAreaChart — An SVG graph that animates its drawn stroke line and area gradient
 * when scrolled into view, with interactive tooltip inspection.
 */
export function DrawnAreaChart({
  data,
  height = 140,
  color = "teal",
  showArea = true,
  showDots = true,
  showGrid = true,
  showTooltip = true,
  animateOnView = true,
  duration = 1.4,
  currency = "INR",
  className,
}: DrawnGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.25 });
  const shouldReduceMotion = useReducedMotion();
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const normalizedData: DataPoint[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, idx) => {
      if (typeof d === "number") {
        return { value: d, date: `Point ${idx + 1}` };
      }
      return d;
    });
  }, [data]);

  const { points, linePath, areaPath, minVal, maxVal } = useMemo(() => {
    if (normalizedData.length === 0) {
      return { points: [], linePath: "", areaPath: "", minVal: 0, maxVal: 0 };
    }

    const values = normalizedData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const paddingY = 16;
    const svgHeight = height;
    const svgWidth = 500; // Normalized virtual SVG viewBox width

    const pts = normalizedData.map((d, i) => {
      const x = (i / Math.max(normalizedData.length - 1, 1)) * (svgWidth - 24) + 12;
      const normalizedY = (d.value - min) / range;
      const y = svgHeight - paddingY - normalizedY * (svgHeight - paddingY * 2);
      return { x, y, ...d };
    });

    const lPath = getSmoothPath(pts);
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    const aPath = `${lPath} L ${lastX},${svgHeight} L ${firstX},${svgHeight} Z`;

    return { points: pts, linePath: lPath, areaPath: aPath, minVal: min, maxVal: max };
  }, [normalizedData, height]);

  const activeColor = colorMap[color] || colorMap.teal;
  const isDrawn = !animateOnView || isInView || shouldReduceMotion;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const closestIdx = Math.round(relativeX * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, closestIdx)));
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full select-none", className)}
      style={{ height }}
    >
      <svg
        viewBox={`0 0 500 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
        onPointerMove={showTooltip ? handlePointerMove : undefined}
        onPointerLeave={showTooltip ? handlePointerLeave : undefined}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={activeColor.gradientStart} />
            <stop offset="100%" stopColor={activeColor.gradientEnd} />
          </linearGradient>
          <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={activeColor.glow} />
          </filter>
        </defs>

        {/* Optional Subtle Horizontal Gridlines */}
        {showGrid && (
          <g className="opacity-20 stroke-current text-[var(--border2)]" strokeDasharray="3 3">
            <line x1="0" y1={height * 0.25} x2="500" y2={height * 0.25} strokeWidth="0.8" />
            <line x1="0" y1={height * 0.5} x2="500" y2={height * 0.5} strokeWidth="0.8" />
            <line x1="0" y1={height * 0.75} x2="500" y2={height * 0.75} strokeWidth="0.8" />
          </g>
        )}

        {/* Animated Area Gradient Fill */}
        {showArea && areaPath && (
          <motion.path
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isDrawn ? 1 : 0 }}
            transition={{ duration: duration * 0.8, delay: 0.2, ease: "easeOut" }}
          />
        )}

        {/* Drawn SVG Stroke Curve */}
        {linePath && (
          <motion.path
            d={linePath}
            fill="none"
            stroke={activeColor.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${gradientId})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: isDrawn ? 1 : 0,
              opacity: isDrawn ? 1 : 0,
            }}
            transition={{
              pathLength: { duration, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.3 },
            }}
          />
        )}

        {/* Data points */}
        {showDots &&
          points.map((pt, i) => (
            <motion.circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === i ? 5 : 3}
              fill="var(--surface)"
              stroke={activeColor.stroke}
              strokeWidth={hoverIndex === i ? "3" : "2"}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isDrawn ? 1 : 0,
                opacity: isDrawn ? 1 : 0,
              }}
              transition={{
                delay: (i / points.length) * 0.5 + 0.3,
                duration: 0.4,
              }}
            />
          ))}

        {/* Active Inspection Crosshair */}
        {hoverIndex !== null && points[hoverIndex] && (
          <g>
            <line
              x1={points[hoverIndex].x}
              y1="0"
              x2={points[hoverIndex].x}
              y2={height}
              stroke={activeColor.stroke}
              strokeWidth="1"
              strokeDasharray="2 2"
              className="opacity-70"
            />
            <circle
              cx={points[hoverIndex].x}
              cy={points[hoverIndex].y}
              r="6"
              fill={activeColor.stroke}
              className="animate-pulse"
            />
          </g>
        )}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoverIndex !== null && points[hoverIndex] && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 shadow-lg backdrop-blur-md"
          style={{
            left: `${(points[hoverIndex].x / 500) * 100}%`,
            top: `${(points[hoverIndex].y / height) * 100}%`,
            marginTop: "-8px",
          }}
        >
          <div className="text-[10px] font-semibold text-[var(--text3)]">
            {points[hoverIndex].date}
          </div>
          <div className="font-mono text-xs font-bold text-[var(--text)]">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency,
              maximumFractionDigits: 0,
            }).format(points[hoverIndex].value)}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * DrawnSparkline — A mini inline animated sparkline for stat cards and metric badges.
 */
export function DrawnSparkline({
  data,
  width = 64,
  height = 24,
  color = "teal",
  className,
}: {
  data: number[];
  width?: number | string;
  height?: number;
  color?: "teal" | "violet" | "gold" | "blue" | "emerald";
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const shouldReduceMotion = useReducedMotion();
  const gradientId = useId();

  const { linePath, areaPath } = useMemo(() => {
    if (!data || data.length < 2) return { linePath: "", areaPath: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 100;
    const h = height;

    const pts = data.map((val, i) => {
      const x = (i / (data.length - 1)) * (w - 8) + 4;
      const y = h - 3 - ((val - min) / range) * (h - 6);
      return { x, y };
    });

    const lPath = getSmoothPath(pts);
    const aPath = `${lPath} L ${pts[pts.length - 1].x},${h} L ${pts[0].x},${h} Z`;
    return { linePath: lPath, areaPath: aPath };
  }, [data, height]);

  const activeColor = colorMap[color] || colorMap.teal;
  const isDrawn = isInView || shouldReduceMotion;

  return (
    <div
      ref={containerRef}
      className={cn("inline-flex items-center overflow-visible", className)}
      style={{ width, height }}
    >
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={activeColor.gradientStart} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {areaPath && (
          <motion.path
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isDrawn ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          />
        )}

        {linePath && (
          <motion.path
            d={linePath}
            fill="none"
            stroke={activeColor.stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: isDrawn ? 1 : 0,
              opacity: isDrawn ? 1 : 0,
            }}
            transition={{
              pathLength: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.25 },
            }}
          />
        )}
      </svg>
    </div>
  );
}

export default DrawnAreaChart;
