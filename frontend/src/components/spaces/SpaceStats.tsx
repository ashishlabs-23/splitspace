"use client";
import React, { useState } from "react";
import { Summary, Space } from "@/lib/api";
import { WalletCards, TrendingUp, Users, Receipt, Globe2, Sparkles, RefreshCw } from "lucide-react";
import { TiltCard, TiltCardLayer } from "@/components/smoothui/tilt-card";
import ScrollReveal from "@/components/ui/scroll-reveal";
import NumberTicker, { CurrencyTicker } from "@/components/ui/number-ticker";
import { convertAmount, formatMoney, estimateExchangeRate } from "@/lib/currencies";

export function SpaceStats({
  space,
  summary,
}: {
  space: Space;
  summary: Summary | null;
}) {
  const [targetCurrency, setTargetCurrency] = useState<string>(space.currency || "INR");
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

  const exchangeRate = estimateExchangeRate(space.currency, targetCurrency);

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
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
                Live exchange rate: 1 {space.currency} ≈ {exchangeRate} {targetCurrency}
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
                onClick={() => setTargetCurrency(c)}
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
              onClick={() => setTargetCurrency(space.currency)}
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
        <ScrollReveal delay={0} distance={20} duration={0.5}>
          <TiltCard className="stat" containerClassName="stat-tilt-container" maxTilt={8} scale={1.02} glare glareOpacity={0.14}>
            <TiltCardLayer depth={12} className="flex items-center gap-[13px] w-full">
              <div className="stat-icon teal">
                <WalletCards size={18} />
              </div>
              <div className="stat-body">
                <small>{isConverted ? `Total spent in ${targetCurrency}` : "Total spent"}</small>
                <strong>
                  <CurrencyTicker value={displayTotal} currency={targetCurrency} />
                </strong>
                <span className="stat-badge teal">
                  <TrendingUp size={9} />
                  {isConverted ? `Original: ${formatMoney(totalSpent, space.currency)}` : "Group Total"}
                </span>
              </div>
            </TiltCardLayer>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal delay={0.08} distance={20} duration={0.5}>
          <TiltCard className="stat" containerClassName="stat-tilt-container" maxTilt={8} scale={1.02} glare glareOpacity={0.14}>
            <TiltCardLayer depth={12} className="flex items-center gap-[13px] w-full">
              <div className="stat-icon violet">
                <TrendingUp size={18} />
              </div>
              <div className="stat-body">
                <small>{isConverted ? `Your balance in ${targetCurrency}` : "Your balance"}</small>
                <strong className={isPositive ? "good" : "bad"}>
                  {isPositive ? "+" : "−"}
                  <CurrencyTicker value={displayBalance} currency={targetCurrency} />
                </strong>
                <span className="stat-badge violet">
                  {isConverted
                    ? `Original: ${isPositive ? "+" : "−"}${formatMoney(Math.abs(yourBalance), space.currency)}`
                    : isPositive
                    ? "Owed to you"
                    : "You owe"}
                </span>
              </div>
            </TiltCardLayer>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal delay={0.16} distance={20} duration={0.5}>
          <TiltCard className="stat" containerClassName="stat-tilt-container" maxTilt={8} scale={1.02} glare glareOpacity={0.14}>
            <TiltCardLayer depth={12} className="flex items-center gap-[13px] w-full">
              <div className="stat-icon blue">
                <Users size={18} />
              </div>
              <div className="stat-body">
                <small>People</small>
                <strong>
                  <NumberTicker value={space.members.length} duration={0.8} />
                </strong>
                <span className="stat-badge blue">Active space</span>
              </div>
            </TiltCardLayer>
          </TiltCard>
        </ScrollReveal>

        <ScrollReveal delay={0.24} distance={20} duration={0.5}>
          <TiltCard className="stat" containerClassName="stat-tilt-container" maxTilt={8} scale={1.02} glare glareOpacity={0.14}>
            <TiltCardLayer depth={12} className="flex items-center gap-[13px] w-full">
              <div className="stat-icon gold">
                <Receipt size={18} />
              </div>
              <div className="stat-body">
                <small>Expenses</small>
                <strong>
                  <NumberTicker value={space.expenses.length} duration={0.8} />
                </strong>
                <span className="stat-badge gold">Transactions</span>
              </div>
            </TiltCardLayer>
          </TiltCard>
        </ScrollReveal>
      </section>
    </div>
  );
}
