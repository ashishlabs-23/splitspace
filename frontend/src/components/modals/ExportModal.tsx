"use client";
import React, { useState } from "react";
import { Space, Summary, Member } from "@/lib/api";
import { Overlay } from "@/components/ui/overlay";
import {
  X,
  Mail,
  Printer,
  Copy,
  Check,
  FileText,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  printSpacePdfStatement,
  openGmailWeb,
  sendStatementEmail,
  generateMemberEmailStatement,
} from "@/lib/export";
import { Avatar } from "@/components/ui/Avatar";

export function ExportModal({
  space,
  summary,
  user,
  onClose,
}: {
  space: Space;
  summary: Summary | null;
  user?: Member | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const creatorName = user?.name || "Ashish N";

  const handleCopy = () => {
    const { subject, body } = generateMemberEmailStatement(space, summary, null, creatorName);
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGmailWeb = (recipient?: Member | null) => {
    openGmailWeb(space, summary, recipient, creatorName);
  };

  const handleNativeMail = (recipient?: Member | null) => {
    sendStatementEmail(space, summary, recipient, creatorName);
  };

  return (
    <Overlay onClose={onClose} label="Share & Export Statement">
      <div
        className="modal"
        style={{
          maxWidth: 680,
          width: "100%",
          background: "#faf1eb",
          border: "1px solid rgba(241, 107, 45, 0.18)",
          borderRadius: 28,
          padding: "32px",
          boxShadow: "0 30px 80px rgba(13, 27, 66, 0.35)",
          color: "#1e2029",
          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 22,
            borderBottom: "1px solid rgba(13, 27, 66, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "#e0562e",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 6px 18px rgba(224, 86, 46, 0.35)",
                flexShrink: 0,
              }}
            >
              <FileText size={24} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#1e2029",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Share & Export Statement
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  margin: "4px 0 0",
                  fontWeight: 400,
                }}
              >
                Send official breakdown directly to members via Gmail or print executive PDF.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
              transition: "color 0.15s, transform 0.15s",
            }}
            className="hover:text-black hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Two Hero Action Cards (Side by Side) ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 22,
            marginBottom: 22,
          }}
        >
          {/* Card 1: Open in Gmail Web */}
          <div
            onClick={() => handleGmailWeb(null)}
            style={{
              background: "rgba(255, 255, 255, 0.88)",
              border: "1.5px solid #e0562e",
              borderRadius: 20,
              padding: "22px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 16px rgba(224, 86, 46, 0.08)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="hover:shadow-xl hover:-translate-y-1"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#fcedea",
                  color: "#e0562e",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Mail size={16} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#e0562e",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                INSTANT WEB
              </span>
            </div>

            <strong
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1e2029",
                marginBottom: 6,
                letterSpacing: "-0.01em",
              }}
            >
              Open in Gmail Web
            </strong>

            <p
              style={{
                fontSize: 12.5,
                color: "#6b7280",
                lineHeight: 1.5,
                margin: 0,
                flex: 1,
              }}
            >
              Opens browser with pre-composed group ledger. Ready for instant sharing with members.
            </p>

            <div
              style={{
                marginTop: 18,
                paddingTop: 12,
                borderTop: "1px solid rgba(224, 86, 46, 0.15)",
                fontSize: 13,
                fontWeight: 600,
                color: "#e0562e",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ArrowUpRight size={15} /> Launch Gmail Composer
            </div>
          </div>

          {/* Card 2: Corporate PDF Statement */}
          <div
            onClick={() => {
              printSpacePdfStatement(space, summary, user);
              onClose();
            }}
            style={{
              background: "rgba(255, 255, 255, 0.88)",
              border: "1.5px solid #14b8a6",
              borderRadius: 20,
              padding: "22px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 16px rgba(20, 184, 166, 0.08)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="hover:shadow-xl hover:-translate-y-1"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#e6f7f5",
                  color: "#14b8a6",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Printer size={18} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#14b8a6",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                EXECUTIVE
              </span>
            </div>

            <strong
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1e2029",
                marginBottom: 6,
                letterSpacing: "-0.01em",
              }}
            >
              Corporate PDF Statement
            </strong>

            <p
              style={{
                fontSize: 12.5,
                color: "#6b7280",
                lineHeight: 1.5,
                margin: 0,
                flex: 1,
              }}
            >
              Formal audited statement with verified reference ID, signature & printable layout.
            </p>

            <div
              style={{
                marginTop: 18,
                paddingTop: 12,
                borderTop: "1px solid rgba(20, 184, 166, 0.15)",
                fontSize: 13,
                fontWeight: 600,
                color: "#14b8a6",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Printer size={15} /> Print / Save as PDF
            </div>
          </div>
        </div>

        {/* ── Member Dispatch Container ── */}
        <div
          style={{
            background: "rgba(245, 235, 227, 0.65)",
            border: "1px solid rgba(13, 27, 66, 0.08)",
            borderRadius: 20,
            padding: "20px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              DIRECT DISPATCH TO SPECIFIC MEMBER
            </span>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: "#e8dbce",
                border: "1px solid #d8cbbe",
                borderRadius: 12,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                color: "#2d2f39",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              className="hover:bg-[#dfd0c1]"
            >
              {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 220, overflowY: "auto" }}>
            {space.members.map((m) => (
              <div
                key={m.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  <Avatar m={m} size="md" />
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#1e2029",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.name}
                    </strong>
                    <span
                      style={{
                        display: "block",
                        fontSize: 13,
                        color: "#6b7280",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.email}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleGmailWeb(m)}
                    style={{
                      border: "1.5px solid #e0562e",
                      background: "#faece6",
                      color: "#e0562e",
                      borderRadius: 12,
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    className="hover:bg-[#e0562e] hover:text-white"
                  >
                    <Mail size={13} /> Gmail
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNativeMail(m)}
                    style={{
                      border: "1.5px solid #94a3b8",
                      background: "#edf2f7",
                      color: "#334155",
                      borderRadius: 12,
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    className="hover:bg-[#334155] hover:text-white hover:border-[#334155]"
                  >
                    App
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 18,
            borderTop: "1px solid rgba(13, 27, 66, 0.08)",
          }}
        >
          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
            Engineered & Designed by <strong>{creatorName}</strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#e8dbce",
              border: "1px solid #d8cbbe",
              borderRadius: 14,
              padding: "12px 32px",
              fontSize: 15,
              fontWeight: 600,
              color: "#2d2f39",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            className="hover:bg-[#dfd0c1] active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </Overlay>
  );
}
