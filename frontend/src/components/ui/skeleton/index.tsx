"use client";

import { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/* ── Base shimmer block ─────────────────────────────────────── */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn("skeleton-shimmer", className)}
      style={style}
      aria-hidden="true"
    />
  );
}

/* ── Expense row skeleton ───────────────────────────────────── */
export function ExpenseRowSkeleton() {
  return (
    <div className="expense-row" style={{ alignItems: "center", gap: 12 }}>
      {/* category badge */}
      <Skeleton style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Skeleton style={{ width: "45%", height: 14, borderRadius: 4 }} />
        <Skeleton style={{ width: "30%", height: 11, borderRadius: 4 }} />
      </div>
      <Skeleton style={{ width: 70, height: 18, borderRadius: 4, flexShrink: 0 }} />
    </div>
  );
}

/* ── Expense list skeleton ──────────────────────────────────── */
export function ExpenseListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="expense-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <ExpenseRowSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Stat card skeleton ─────────────────────────────────────── */
export function StatSkeleton() {
  return (
    <div className="stat" style={{ padding: "16px 18px" }}>
      <Skeleton style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <Skeleton style={{ width: "50%", height: 11, borderRadius: 4 }} />
        <Skeleton style={{ width: "80%", height: 20, borderRadius: 4 }} />
      </div>
    </div>
  );
}

/* ── Stats grid skeleton ────────────────────────────────────── */
export function StatsGridSkeleton() {
  return (
    <div className="stats" style={{ marginTop: 24, marginBottom: 28 }}>
      <StatSkeleton />
      <StatSkeleton />
      <StatSkeleton />
      <StatSkeleton />
    </div>
  );
}

/* ── Settlement skeleton ────────────────────────────────────── */
export function SettlementSkeleton() {
  return (
    <div className="settle-line" style={{ alignItems: "center", padding: "12px 0" }}>
      <div className="people-stack" style={{ display: "flex", gap: 6 }}>
        <Skeleton style={{ width: 28, height: 28, borderRadius: "50%" }} />
        <Skeleton style={{ width: 28, height: 28, borderRadius: "50%" }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <Skeleton style={{ width: "60%", height: 12, borderRadius: 4 }} />
        <Skeleton style={{ width: "40%", height: 10, borderRadius: 4 }} />
      </div>
      <Skeleton style={{ width: 60, height: 15, borderRadius: 4 }} />
    </div>
  );
}

/* ── Sidebar skeleton ───────────────────────────────────────── */
export function SidebarSkeleton() {
  return (
    <aside className="sidebar" style={{ pointerEvents: "none" }}>
      {/* Brand */}
      <div className="brand">
        <Skeleton style={{ width: 38, height: 38, borderRadius: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
          <Skeleton style={{ width: "70%", height: 14, borderRadius: 4 }} />
          <Skeleton style={{ width: "90%", height: 10, borderRadius: 4 }} />
        </div>
      </div>

      {/* New space button */}
      <Skeleton style={{ width: "100%", height: 42, borderRadius: 12, marginBottom: 16 }} />

      {/* Space items list */}
      <div className="nav-section">
        <Skeleton style={{ width: "40%", height: 10, borderRadius: 4, marginBottom: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="space-row active">
            <Skeleton style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
              <Skeleton style={{ width: "65%", height: 13, borderRadius: 4 }} />
              <Skeleton style={{ width: "45%", height: 10, borderRadius: 4 }} />
            </div>
          </div>
          <div className="space-row">
            <Skeleton style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
              <Skeleton style={{ width: "55%", height: 13, borderRadius: 4 }} />
              <Skeleton style={{ width: "35%", height: 10, borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="sidebar-foot">
        <div className="account">
          <Skeleton style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <Skeleton style={{ width: "60%", height: 12, borderRadius: 4 }} />
            <Skeleton style={{ width: "85%", height: 9, borderRadius: 4 }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ── Full Dashboard skeleton ────────────────────────────────── */
export function DashboardSkeleton() {
  return (
    <div className="app" style={{ minHeight: "100vh" }}>
      <SidebarSkeleton />
      <main className="main">
        {/* Topbar */}
        <div className="topbar" style={{ marginBottom: 28 }}>
          <div>
            <Skeleton style={{ width: 100, height: 10, borderRadius: 4, marginBottom: 8 }} />
            <Skeleton style={{ width: 220, height: 26, borderRadius: 6, marginBottom: 6 }} />
            <Skeleton style={{ width: 180, height: 13, borderRadius: 4 }} />
          </div>
          <div className="top-actions" style={{ display: "flex", gap: 8 }}>
            <Skeleton style={{ width: 90, height: 38, borderRadius: 10 }} />
            <Skeleton style={{ width: 90, height: 38, borderRadius: 10 }} />
            <Skeleton style={{ width: 38, height: 38, borderRadius: 10 }} />
          </div>
        </div>

        {/* Hero banner skeleton */}
        <div
          className="hero"
          style={{
            minHeight: 180,
            padding: "36px 36px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Skeleton style={{ width: 120, height: 12, borderRadius: 4 }} />
          <Skeleton style={{ width: 280, height: 32, borderRadius: 6 }} />
          <Skeleton style={{ width: "50%", height: 14, borderRadius: 4 }} />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Skeleton style={{ width: 130, height: 40, borderRadius: 10 }} />
            <Skeleton style={{ width: 110, height: 40, borderRadius: 10 }} />
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGridSkeleton />

        {/* 2 Column Layout */}
        <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
          {/* Left Column: Expenses */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <Skeleton style={{ width: 140, height: 18, borderRadius: 4 }} />
                <Skeleton style={{ width: 100, height: 11, borderRadius: 4 }} />
              </div>
              <Skeleton style={{ width: 100, height: 34, borderRadius: 8 }} />
            </div>
            <ExpenseListSkeleton count={4} />
          </div>

          {/* Right Column: Settle up & Members */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <Skeleton style={{ width: 130, height: 16, borderRadius: 4, marginBottom: 14 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SettlementSkeleton />
                <SettlementSkeleton />
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <Skeleton style={{ width: 110, height: 16, borderRadius: 4, marginBottom: 14 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Skeleton style={{ width: 30, height: 30, borderRadius: 10 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <Skeleton style={{ width: "50%", height: 12, borderRadius: 4 }} />
                    <Skeleton style={{ width: "35%", height: 9, borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Skeleton style={{ width: 30, height: 30, borderRadius: 10 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <Skeleton style={{ width: "45%", height: 12, borderRadius: 4 }} />
                    <Skeleton style={{ width: "30%", height: 9, borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

