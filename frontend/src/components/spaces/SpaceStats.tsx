"use client";
import React, { useState, useEffect } from "react";
import { Summary, Space } from "@/lib/api";
import { WalletCards, TrendingUp, Users, Receipt, Globe2, Sparkles, RefreshCw } from "lucide-react";
import { TiltCard, TiltCardLayer } from "@/components/smoothui/tilt-card";
import ScrollReveal from "@/components/ui/scroll-reveal";
import NumberTicker, { CurrencyTicker } from "@/components/ui/number-ticker";
import { convertAmount, formatMoney, estimateExchangeRate, fetchLiveExchangeRates } from "@/lib/currencies";

export function SpaceStats({
  space,
  summary,
  targetCurrency: controlledTargetCurrency,
  onCurrencyChange,
}: {
  space: Space;
  summary: Summary | null;
  targetCurrency?: string;
  onCurrencyChange?: (c: string) => void;
}) {
  const [localTargetCurrency, setLocalTargetCurrency] = useState<string>(space.currency || "INR");
  const [refreshingRates, setRefreshingRates] = useState(false);
  const targetCurrency = controlledTargetCurrency || localTargetCurrency || space.currency || "INR";

  useEffect(() => {
    fetchLiveExchangeRates(space.currency || "USD").catch(() => {});
  }, [space.currency]);

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    try {
      await fetchLiveExchangeRates(space.currency || "USD");
    } finally {
      setTimeout(() => setRefreshingRates(false), 400);
    }
  };

  const handleSetCurrency = (c: string) => {
    if (onCurrencyChange) {
      onCurrencyChange(c);
    } else {
      setLocalTargetCurrency(c);
    }
  };

  const isConverted = targetCurrency.toUpperCase() !== (space.currency || "INR").toUpperCase();

  const totalSpent = summary?.total_spent ?? 0;
  const yourBalance = summary?.your_balance ?? 0;
  const isPositive = yourBalance >= 0;

  const displayTotal = isConverted
    ? convertAmount(totalSpent, space.currency, targetCurrency)
    : totalSpent;

  const displayBalance = isConverted
    ? convertAmount(Math.abs(yourBalance), space.currency, targetCurrency)
    : Math.abs(yourBalance);

  const exchangeRate = estimateExchangeRate(targetCurrency, space.currency);

  return (
    <div style={{ position: "relative", zIndex: 10, width: "100%", marginBottom: 20 }}>
      {/* ── Multi-Currency Spend Conversion Lens Bar ── */}
      <div
        style={{
          position: "relative",
          zIndex: 15,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(16px)",
          border: "1.5px solid rgba(224, 86, 46, 0.22)",
          borderRadius: 16,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          boxShadow: "0 6px 20px rgba(13, 27, 66, 0.05)",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: isConverted ? "#faece6" : "rgba(13, 27, 66, 0.06)",
              color: isConverted ? "#e0562e" : "#1e2029",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Globe2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1e2029", display: "flex", alignItems: "center", gap: 6 }}>
              <span>Multi-Currency Spend Lens:</span>
              <span
                style={{
                  color: isConverted ? "#e0562e" : "#059669",
                  background: isConverted ? "rgba(224, 86, 46, 0.1)" : "#ecfdf5",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {isConverted ? `Viewing in ${targetCurrency}` : `Base Currency (${space.currency})`}
              </span>
            </div>
            {isConverted && (
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 6px #10b981" }} />
                <span>Live market FX: 1 {targetCurrency} ≈ {exchangeRate} {space.currency}</span>
                <button
                  type="button"
                  onClick={handleRefreshRates}
                  title="Refresh live exchange rates"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 2,
                    cursor: "pointer",
                    color: "#9ca3af",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  className="hover:text-orange-600"
                >
                  <RefreshCw size={11} className={refreshingRates ? "animate-spin text-orange-500" : ""} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Currency Switcher Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginRight: 2 }}>Convert to:</span>
          {["INR", "USD", "EUR", "GBP", "AED", "JPY", "CAD"].map((c) => {
            const isActive = targetCurrency.toUpperCase() === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleSetCurrency(c)}
                style={{
                  background: isActive ? "#e0562e" : "#f3f4f6",
                  color: isActive ? "#ffffff" : "#374151",
                  border: isActive ? "1px solid #e0562e" : "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "4px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: isActive ? "0 2px 8px rgba(224, 86, 46, 0.35)" : "none",
                }}
                className="hover:scale-105"
              >
                {c}
              </button>
            );
          })}

          {isConverted && (
            <button
              type="button"
              onClick={() => handleSetCurrency(space.currency)}
              style={{
                background: "transparent",
                border: "none",
                color: "#e0562e",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              className="hover:underline"
            >
              <RefreshCw size={11} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <section className="stats">
        <ScrollReveal delay={0} distance={20} duration={0.5} className="min-w-0 w-full h-full">
          <TiltCard className="stat" containerClassName="stat-tilt-container" maxTilt={8} scale={1.02} glare glareOpacity={0.14}>
            <TiltCardLayer depth={12} className="flex flex-col justify-between w-full h-full gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <div className="stat-icon teal">
                  <WalletCards size={18} />
                </div>
                <small className="stat-label truncate text-right">
                  {isConverted ? targetCurrency : "Total spent"}
                </small>
              </div>
              <div className="stat-body">
                <strong>
                  <CurrencyTicker value={displayTotal} currency={targetCurrency} />
                </strong>
                <span className="stat-badge teal">
                  <TrendingUp size={10} className="shrink-0" />
                  <span className="truncate">
                    {isConverted ? `Orig: ${formatMoney(totalSpent, space.currency)}` : "Group Total"}
                  </span>
                </span>
              </div>
            </TiltCardLayer>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal delay={0.08} distance={20} duration={0.5} className="min-w-0 w-full h-full">
          <TiltCard className="stat" containerClassName="stat-tilt-container" maxTilt={8} scale={1.02} glare glareOpacity={0.14}>
            <TiltCardLayer depth={12} className="flex flex-col justify-between w-full h-full gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <div className="stat-icon violet">
                  <TrendingUp size={18} />
                </div>
                <small className="stat-label truncate text-right">
                  {isConverted ? "Balance" : "Your balance"}
                </small>
              </div>
              <div className="stat-body">
                <strong className={isPositive ? "good" : "bad"}>
                  {isPositive ? "+" : "−"}
                  <CurrencyTicker value={displayBalance} currency={targetCurrency} />
                </strong>
                <span className="stat-badge violet">
                  <span className="truncate">
                    {isConverted
                      ? `Orig: ${isPositive ? "+" : "−"}${formatMoney(Math.abs(yourBalance), space.currency)}`
                      : isPositive
                      ? "Owed to you"
                      : "You owe"}
                  </span>
                </span>
              </div>
            </TiltCardLayer>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal delay={0.16} distance={20} duration={0.5} className="min-w-0 w-full h-full">
          <TiltCard className="stat" containerClassName="stat-tilt-container" maxTilt={8} scale={1.02} glare glareOpacity={0.14}>
            <TiltCardLayer depth={12} className="flex flex-col justify-between w-full h-full gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <div className="stat-icon blue">
                  <Users size={18} />
                </div>
                <small className="stat-label text-right">People</small>
              </div>
              <div className="stat-body">
                <strong>
                  <NumberTicker value={space.members.length} duration={0.8} />
                </strong>
                <span className="stat-badge blue">
                  <span className="truncate">Active space</span>
                </span>
              </div>
            </TiltCardLayer>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal delay={0.24} distance={20} duration={0.5} className="min-w-0 w-full h-full">
          <TiltCard className="stat" containerClassName="stat-tilt-container" maxTilt={8} scale={1.02} glare glareOpacity={0.14}>
            <TiltCardLayer depth={12} className="flex flex-col justify-between w-full h-full gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <div className="stat-icon gold">
                  <Receipt size={18} />
                </div>
                <small className="stat-label text-right">Expenses</small>
              </div>
              <div className="stat-body">
                <strong>
                  <NumberTicker value={space.expenses.length} duration={0.8} />
                </strong>
                <span className="stat-badge gold">
                  <span className="truncate">Transactions</span>
                </span>
              </div>
            </TiltCardLayer>
          </TiltCard>
        </ScrollReveal>
      </section>
    </div>
  );
}
