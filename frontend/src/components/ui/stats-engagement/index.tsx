"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  Activity,
  PieChart,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Receipt,
  Wallet,
} from "lucide-react";
import { DrawnAreaChart, DrawnSparkline, type DataPoint } from "@/components/ui/drawn-graph";
import NumberTicker, { CurrencyTicker } from "@/components/ui/number-ticker";
import { TiltCard, TiltCardLayer } from "@/components/smoothui/tilt-card";
import { type Expense, type Space, type Summary, type Member } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface StatsEngagementPanelProps {
  space: Space;
  summary: Summary | null;
  className?: string;
}

export function StatsEngagementPanel({
  space,
  summary,
  className,
}: StatsEngagementPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"trajectory" | "members" | "health">("trajectory");

  // Format currency helper
  const money = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: space.currency,
      maximumFractionDigits: 0,
    }).format(n);

  // 1. Build cumulative spending trajectory data from expenses
  const { chartData, maxExpense, avgPerPerson, totalSpent } = useMemo(() => {
    const expenses = [...(space.expenses || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const total = summary?.total_spent ?? expenses.reduce((acc, e) => acc + e.amount, 0);
    const memberCount = Math.max(space.members.length, 1);
    const avg = Math.round(total / memberCount);

    let maxSingle = 0;
    expenses.forEach((e) => {
      if (e.amount > maxSingle) maxSingle = e.amount;
    });

    if (expenses.length === 0) {
      // Graceful sample curve for empty space preview
      const samplePoints: DataPoint[] = [
        { date: "Start", value: 0 },
        { date: "Active", value: 0 },
      ];
      return { chartData: samplePoints, maxExpense: 0, avgPerPerson: 0, totalSpent: 0 };
    }

    let runningSum = 0;
    const points: DataPoint[] = [
      { date: "Start", value: 0 },
      ...expenses.map((e, idx) => {
        runningSum += e.amount;
        const dateObj = new Date(e.created_at);
        const formattedDate = dateObj.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        });
        return {
          date: `${formattedDate} (${e.title})`,
          value: runningSum,
        };
      }),
    ];

    return {
      chartData: points,
      maxExpense: maxSingle,
      avgPerPerson: avg,
      totalSpent: total,
    };
  }, [space.expenses, space.members, space.currency, summary]);

  // 2. Member contribution breakdown
  const memberContributions = useMemo(() => {
    const memberMap = new Map<string, { member: Member; paid: number; share: number }>();

    space.members.forEach((m) => {
      memberMap.set(m.id, { member: m, paid: 0, share: 0 });
    });

    space.expenses.forEach((e) => {
      const payerEntry = memberMap.get(e.paid_by.id);
      if (payerEntry) {
        payerEntry.paid += e.amount;
      }
    });

    const total = Math.max(totalSpent, 1);
    return Array.from(memberMap.values()).map((entry) => ({
      ...entry,
      percentage: Math.round((entry.paid / total) * 100),
    }));
  }, [space.members, space.expenses, totalSpent]);

  // 3. Settlement health calculation
  const settlementStats = useMemo(() => {
    const remainingSettlements = summary?.settlements?.length ?? 0;
    const totalPeople = space.members.length;
    const totalTransactions = space.expenses.length;

    let score = 100;
    if (remainingSettlements > 0) {
      score = Math.max(25, 100 - remainingSettlements * 20);
    }
    return {
      score,
      remainingCount: remainingSettlements,
      isFullySettled: remainingSettlements === 0 && totalTransactions > 0,
    };
  }, [summary, space]);

  return (
    <div className={cn("stats-engagement-container my-6", className)}>
      {/* Header with live pulse badge & toggle */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--teal)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--teal)]" />
          </div>
          <h3 className="font-sans text-sm font-bold tracking-tight text-[var(--text)] flex items-center gap-1.5">
            Live Group Trends & Analytics
            <span className="rounded-full bg-[rgba(14,242,192,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[var(--teal)] border border-[rgba(14,242,192,0.2)]">
              Real-time
            </span>
          </h3>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text3)] hover:text-[var(--teal)] transition-colors"
        >
          {isExpanded ? "Hide details" : "Expand trends"}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-5 shadow-lg backdrop-blur-xl">
              {/* Top engagement metric highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                {/* Metric 1: Trajectory velocity */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] flex items-center gap-1">
                      <Flame size={12} className="text-[var(--gold)]" /> Spending Velocity
                    </div>
                    <div className="font-sans text-lg font-bold text-[var(--text)] mt-1">
                      <CurrencyTicker value={totalSpent} currency={space.currency} />
                    </div>
                    <div className="text-[10px] font-medium text-[var(--teal)] mt-0.5 flex items-center gap-0.5">
                      <ArrowUpRight size={11} /> {space.expenses.length} splits logged
                    </div>
                  </div>
                  <DrawnSparkline
                    data={chartData.map((d) => d.value)}
                    color="teal"
                    width={56}
                    height={26}
                  />
                </div>

                {/* Metric 2: Avg Burn per Person */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] flex items-center gap-1">
                      <Users size={12} className="text-[var(--violet)]" /> Avg Per Person
                    </div>
                    <div className="font-sans text-lg font-bold text-[var(--text)] mt-1">
                      <CurrencyTicker value={avgPerPerson} currency={space.currency} />
                    </div>
                    <div className="text-[10px] font-medium text-[var(--text3)] mt-0.5">
                      Across {space.members.length} member{space.members.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <DrawnSparkline
                    data={[avgPerPerson * 0.4, avgPerPerson * 0.7, avgPerPerson * 0.9, avgPerPerson]}
                    color="violet"
                    width={56}
                    height={26}
                  />
                </div>

                {/* Metric 3: Group Health Score */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)] flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[var(--teal)]" /> Settlement Health
                    </div>
                    <div className="font-sans text-lg font-bold text-[var(--text)] mt-1">
                      <NumberTicker value={settlementStats.score} suffix="%" />
                    </div>
                    <div className="text-[10px] font-medium text-[var(--teal)] mt-0.5">
                      {settlementStats.remainingCount === 0
                        ? "100% Settled up"
                        : `${settlementStats.remainingCount} pending payment${settlementStats.remainingCount === 1 ? "" : "s"}`}
                    </div>
                  </div>
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        className="stroke-[var(--border2)]"
                        strokeWidth="3"
                      />
                      <motion.circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="var(--teal)"
                        strokeWidth="3"
                        strokeDasharray="88"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 88 }}
                        animate={{
                          strokeDashoffset: 88 - (88 * settlementStats.score) / 100,
                        }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    <span className="absolute text-[9px] font-bold text-[var(--teal)]">
                      {settlementStats.score}%
                    </span>
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
                <button
                  onClick={() => setActiveTab("trajectory")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    activeTab === "trajectory"
                      ? "bg-[rgba(14,242,192,0.12)] text-[var(--teal)] border border-[rgba(14,242,192,0.25)]"
                      : "text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface2)]"
                  )}
                >
                  <TrendingUp size={13} /> Spending Trajectory
                </button>
                <button
                  onClick={() => setActiveTab("members")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    activeTab === "members"
                      ? "bg-[rgba(124,92,252,0.12)] text-[var(--violet)] border border-[rgba(124,92,252,0.25)]"
                      : "text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface2)]"
                  )}
                >
                  <PieChart size={13} /> Member Contribution
                </button>
              </div>

              {/* Tab 1: Drawn Area Chart of Cumulative Spending */}
              {activeTab === "trajectory" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center justify-between text-xs text-[var(--text3)] mb-2 px-1">
                    <span>Cumulative Total Over Time</span>
                    <span className="font-mono text-[11px]">Hover data points to inspect</span>
                  </div>
                  <DrawnAreaChart
                    data={chartData}
                    height={150}
                    color="teal"
                    currency={space.currency}
                    showGrid={true}
                    showDots={true}
                    showTooltip={true}
                    duration={1.2}
                  />
                </motion.div>
              )}

              {/* Tab 2: Member Contribution Bars */}
              {activeTab === "members" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  {memberContributions.map((m, idx) => (
                    <div key={m.member.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface3)] text-[10px] font-bold">
                            {m.member.name.charAt(0).toUpperCase()}
                          </span>
                          {m.member.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--text)]">
                            {money(m.paid)}
                          </span>
                          <span className="text-[11px] font-semibold text-[var(--text3)]">
                            ({m.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface2)]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--teal)] to-[var(--violet)]"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.max(m.percentage, 3)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StatsEngagementPanel;
