"use client";
import { Summary, Member, Space, SettlementRecord } from "@/lib/api";
import { ShieldCheck, ArrowRight, CheckCircle, Trash2, History } from "lucide-react";
import { formatMoney, convertAmount } from "@/lib/currencies";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { Avatar } from "@/components/ui/Avatar";

export function SettlementList({
  space,
  summary,
  currentUser,
  targetCurrency,
  onSettleUp,
  onDeleteSettlement,
}: {
  space: Space;
  summary: Summary | null;
  currentUser: Member | null;
  targetCurrency?: string;
  onSettleUp: (payerId: string, recipientId: string, amount: number) => void;
  onDeleteSettlement: (settlementId: string) => void;
}) {
  const settlements = summary?.settlements ?? [];
  const recorded = summary?.recorded_settlements ?? [];

  const effectiveTarget = targetCurrency || space.currency || "USD";
  const isConverted = effectiveTarget.toUpperCase() !== (space.currency || "USD").toUpperCase();

  return (
    <div className="mini-settlements">
      {/* ── Suggested simplified debt settlements ── */}
      {settlements.map((s, i) => {
        const isUserPayer = currentUser && s.from_member.email === currentUser.email;
        const isUserRecipient = currentUser && s.to_member.email === currentUser.email;

        const displayAmount = isConverted
          ? convertAmount(s.amount, space.currency, effectiveTarget)
          : s.amount;

        return (
          <ScrollReveal
            key={`${s.from_member.id}-${s.to_member.id}-${i}`}
            delay={i * 0.05}
            distance={12}
            duration={0.35}
            threshold={0.05}
          >
            <div className="settle-line" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="people-stack">
                  <Avatar m={s.from_member} size="sm" />
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>→</span>
                  <Avatar m={s.to_member} size="sm" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {s.from_member.name} <span style={{ fontWeight: 400, color: "var(--text3)" }}>pays</span> {s.to_member.name}
                  </div>
                  <small style={{ color: isUserPayer ? "var(--secondary)" : isUserRecipient ? "var(--teal)" : "var(--text3)", fontWeight: 500 }}>
                    {isUserPayer ? "You owe this" : isUserRecipient ? "Owed to you" : "Group debt"}
                  </small>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                  <b style={{ fontSize: 14 }}>{formatMoney(displayAmount, effectiveTarget)}</b>
                  {isConverted && (
                    <small style={{ fontSize: 10, color: "var(--text3)" }}>
                      orig. {formatMoney(s.amount, space.currency)}
                    </small>
                  )}
                </div>
                <button
                  type="button"
                  className="btn primary sm"
                  style={{ fontSize: 11, padding: "4px 10px", height: "auto" }}
                  onClick={() => onSettleUp(s.from_member.id, s.to_member.id, s.amount)}
                  title="Record that this payment was made"
                >
                  Settle
                </button>
              </div>
            </div>
          </ScrollReveal>
        );
      })}

      {!settlements.length && (
        <ScrollReveal delay={0} distance={12} duration={0.4}>
          <div className="settled">
            <ShieldCheck size={17} /> Everyone is completely settled up!
          </div>
        </ScrollReveal>
      )}

      {/* ── History of recorded direct payments ── */}
      {recorded.length > 0 && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <History size={12} /> Recorded Payments ({recorded.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recorded.map((r) => {
              const recConverted = effectiveTarget.toUpperCase() !== (r.currency || space.currency).toUpperCase();
              const recDisplay = recConverted
                ? convertAmount(r.amount, r.currency || space.currency, effectiveTarget)
                : r.amount;

              return (
                <div
                  key={r.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <strong>{r.from_member.name}</strong> paid <strong>{r.to_member.name}</strong>
                    <span style={{ marginLeft: 6, color: "var(--teal)", fontWeight: 600 }}>
                      {formatMoney(recDisplay, effectiveTarget)}
                      {recConverted && ` (${formatMoney(r.amount, r.currency || space.currency)})`}
                    </span>
                    {r.note && <small style={{ display: "block", color: "var(--text3)" }}>{r.note}</small>}
                  </div>

                <button
                  type="button"
                  onClick={() => onDeleteSettlement(r.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text3)",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  title="Remove recorded payment"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
