"use client";
import React from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Zap,
  Mail,
  ShieldCheck,
  Globe2,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 24,
      stiffness: 260,
    },
  },
};

export function FeatureBento({
  onCardClick,
}: {
  onCardClick?: () => void;
}) {
  return (
    <section style={{ marginTop: 40, marginBottom: 40 }}>
      {/* ── Section Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(224, 86, 46, 0.1)",
            border: "1px solid rgba(224, 86, 46, 0.2)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 700,
            color: "#e0562e",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          <Sparkles size={12} />
          <span>Platform Capabilities</span>
        </div>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 700,
            color: "#1e2029",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Feature Bento
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
          Engineered with staggered reveals and micro-interactions in Motion for React.
        </p>
      </div>

      {/* ── Bento Grid ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 16,
        }}
      >
        {/* ── BENTO CARD 1: Dynamic Debt Simplification (Span 7) ── */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={onCardClick}
          style={{
            gridColumn: "span 7",
            background: "linear-gradient(145deg, #ffffff 0%, #faf1eb 100%)",
            border: "1px solid rgba(224, 86, 46, 0.18)",
            borderRadius: 24,
            padding: "26px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(13, 27, 66, 0.05)",
            position: "relative",
            overflow: "hidden",
            cursor: onCardClick ? "pointer" : "default",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(224, 86, 46, 0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "#faece6",
                  color: "#e0562e",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <TrendingUp size={20} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#e0562e",
                  background: "rgba(224, 86, 46, 0.08)",
                  padding: "4px 10px",
                  borderRadius: 12,
                }}
              >
                AUTO-BALANCING
              </span>
            </div>

            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#1e2029",
                margin: "0 0 6px",
                letterSpacing: "-0.01em",
              }}
            >
              Dynamic Bill Splitting
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                lineHeight: 1.5,
                margin: 0,
                maxWidth: "90%",
              }}
            >
              When a new member joins your space, SplitSpace instantly and dynamically redistributes all equal expenses across the entire group.
            </p>
          </div>

          {/* Interactive Micro Graphic */}
          <div
            style={{
              marginTop: 20,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#1e2029",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ₹
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e2029" }}>
                ₹15,000 Bill
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#e0562e", fontWeight: 700 }}>
              <span>Auto-split: ₹3,750 / person</span>
              <CheckCircle2 size={15} />
            </div>
          </div>
        </motion.div>

        {/* ── BENTO CARD 2: 1-Click Gmail & PDF Statements (Span 5) ── */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={onCardClick}
          style={{
            gridColumn: "span 5",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: "26px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(13, 27, 66, 0.04)",
            cursor: onCardClick ? "pointer" : "default",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "#e6f7f5",
                  color: "#14b8a6",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Mail size={20} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#14b8a6",
                  background: "rgba(20, 184, 166, 0.08)",
                  padding: "4px 10px",
                  borderRadius: 12,
                }}
              >
                DISPATCH
              </span>
            </div>

            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#1e2029",
                margin: "0 0 6px",
                letterSpacing: "-0.01em",
              }}
            >
              1-Click Gmail & PDF
            </h3>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
              Launch pre-filled web statements or generate corporate audited PDF reports with reference IDs and settlement matrices.
            </p>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#14b8a6",
            }}
          >
            <ShieldCheck size={16} />
            <span>Audited PDF & Web Dispatch Ready</span>
          </div>
        </motion.div>

        {/* ── BENTO CARD 3: Multi-Currency Engine (Span 4) ── */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={onCardClick}
          style={{
            gridColumn: "span 4",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(13, 27, 66, 0.04)",
            cursor: onCardClick ? "pointer" : "default",
          }}
        >
          <div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "#f0f4ff",
                color: "#3b82f6",
                display: "grid",
                placeItems: "center",
                marginBottom: 14,
              }}
            >
              <Globe2 size={19} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
              Global Multi-Currency
            </h3>
            <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
              Log costs in USD, EUR, GBP, or JPY and convert automatically into your group base currency.
            </p>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {["USD $", "EUR €", "GBP £", "INR ₹"].map((c) => (
              <span
                key={c}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "3px 8px",
                  borderRadius: 8,
                  color: "#475569",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── BENTO CARD 4: Smart Group Invitations (Span 4) ── */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={onCardClick}
          style={{
            gridColumn: "span 4",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(13, 27, 66, 0.04)",
            cursor: onCardClick ? "pointer" : "default",
          }}
        >
          <div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "#faf5ff",
                color: "#a855f7",
                display: "grid",
                placeItems: "center",
                marginBottom: 14,
              }}
            >
              <Sparkles size={19} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
              Instant Space Invites
            </h3>
            <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
              Generate secure 1-click invite tokens to onboard friends and roomies to your space in seconds.
            </p>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {["1-Click Token", "QR Access", "Instant Sync"].map((k) => (
              <span
                key={k}
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  background: "#f1f5f9",
                  padding: "3px 7px",
                  borderRadius: 6,
                  color: "#334155",
                }}
              >
                {k}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ── BENTO CARD 5: Exact Decimal Precision Math (Span 4) ── */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={onCardClick}
          style={{
            gridColumn: "span 4",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(13, 27, 66, 0.04)",
            cursor: onCardClick ? "pointer" : "default",
          }}
        >
          <div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "#ecfdf5",
                color: "#10b981",
                display: "grid",
                placeItems: "center",
                marginBottom: 14,
              }}
            >
              <Zap size={19} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e2029", margin: "0 0 6px" }}>
              Zero-Cent Rounding Loss
            </h3>
            <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
              Integer cents distribution guarantees group expense balances always reconcile to the exact cent.
            </p>
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 11.5,
              fontWeight: 700,
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>Exact Decimal Balance 100% Guaranteed</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
