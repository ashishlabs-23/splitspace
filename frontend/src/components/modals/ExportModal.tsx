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
          margin: "0 auto",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#faf1eb",
          backgroundImage: "linear-gradient(160deg, #ffffff 0%, #faf1eb 60%, #f5e5da 100%)",
          border: "1.5px solid rgba(241, 107, 45, 0.22)",
          borderRadius: 24,
          padding: "clamp(16px, 4vw, 28px)",
          boxShadow: "0 30px 80px rgba(13, 27, 66, 0.28)",
          color: "#1e2029",
          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 16,
            borderBottom: "1px solid rgba(13, 27, 66, 0.08)",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#e0562e",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 4px 14px rgba(224, 86, 46, 0.30)",
                flexShrink: 0,
              }}
            >
              <FileText size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  fontSize: "clamp(17px, 4vw, 21px)",
                  fontWeight: 700,
                  color: "#1e2029",
                  margin: 0,
                  letterSpacing: "-0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Share & Export Statement
              </h2>
              <p
                style={{
                  fontSize: "clamp(11.5px, 2.8vw, 13px)",
                  color: "#6b7280",
                  margin: "2px 0 0",
                  fontWeight: 400,
                  lineHeight: 1.35,
                }}
              >
                Official breakdown via Gmail, copyable text, or executive PDF.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "rgba(13, 27, 66, 0.06)",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: 6,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
            className="hover:text-black hover:bg-black/10 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Two Hero Action Cards (Responsive Grid) ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 12,
            marginTop: 16,
            marginBottom: 16,
          }}
        >
          {/* Card 1: Open in Gmail Web */}
          <div
            onClick={() => handleGmailWeb(null)}
            style={{
              background: "rgba(255, 255, 255, 0.92)",
              border: "1.5px solid #e0562e",
              borderRadius: 18,
              padding: "16px 16px 14px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 16px rgba(224, 86, 46, 0.08)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#fcedea",
                  color: "#e0562e",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Mail size={15} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#e0562e",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "rgba(224, 86, 46, 0.08)",
                  padding: "2px 7px",
                  borderRadius: 6,
                }}
              >
                INSTANT WEB
              </span>
            </div>

            <strong
              style={{
                fontSize: 15.5,
                fontWeight: 700,
                color: "#1e2029",
                marginBottom: 4,
                letterSpacing: "-0.01em",
              }}
            >
              Open in Gmail Web
            </strong>

            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                lineHeight: 1.45,
                margin: 0,
                flex: 1,
              }}
            >
              Pre-composed group ledger ready for instant sharing with members.
            </p>

            <div
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: "1px solid rgba(224, 86, 46, 0.15)",
                fontSize: 12.5,
                fontWeight: 700,
                color: "#e0562e",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ArrowUpRight size={14} /> Launch Gmail
            </div>
          </div>

          {/* Card 2: Corporate PDF Statement */}
          <div
            onClick={() => {
              printSpacePdfStatement(space, summary, user);
              onClose();
            }}
            style={{
              background: "rgba(255, 255, 255, 0.92)",
              border: "1.5px solid #14b8a6",
              borderRadius: 18,
              padding: "16px 16px 14px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 16px rgba(20, 184, 166, 0.08)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#e6f7f5",
                  color: "#14b8a6",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Printer size={15} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#14b8a6",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "rgba(20, 184, 166, 0.08)",
                  padding: "2px 7px",
                  borderRadius: 6,
                }}
              >
                EXECUTIVE PDF
              </span>
            </div>

            <strong
              style={{
                fontSize: 15.5,
                fontWeight: 700,
                color: "#1e2029",
                marginBottom: 4,
                letterSpacing: "-0.01em",
              }}
            >
              Corporate PDF Statement
            </strong>

            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                lineHeight: 1.45,
                margin: 0,
                flex: 1,
              }}
            >
              Audited statement with reference ID, member summary & printable layout.
            </p>

            <div
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: "1px solid rgba(20, 184, 166, 0.15)",
                fontSize: 12.5,
                fontWeight: 700,
                color: "#14b8a6",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Printer size={14} /> Print / Save PDF
            </div>
          </div>
        </div>

        {/* ── Member Dispatch Container ── */}
        <div
          style={{
            background: "rgba(245, 235, 227, 0.75)",
            border: "1px solid rgba(13, 27, 66, 0.08)",
            borderRadius: 18,
            padding: "clamp(12px, 3vw, 18px)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              DISPATCH TO SPECIFIC MEMBER
            </span>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: "#e8dbce",
                border: "1px solid #d8cbbe",
                borderRadius: 10,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#2d2f39",
                display: "flex",
                alignItems: "center",
                gap: 5,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              className="hover:bg-[#dfd0c1] active:scale-95"
            >
              {copied ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
              <span>{copied ? "Copied!" : "Copy Full Text"}</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto", paddingRight: 2 }}>
            {space.members.map((m) => (
              <div
                key={m.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                  <Avatar m={m} size="sm" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 13.5,
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
                        fontSize: 11,
                        color: "#6b7280",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.email}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleGmailWeb(m)}
                    style={{
                      border: "1px solid #e0562e",
                      background: "#faece6",
                      color: "#e0562e",
                      borderRadius: 9,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    className="hover:bg-[#e0562e] hover:text-white active:scale-95"
                    title={`Email ${m.name} via Gmail`}
                  >
                    <Mail size={12} /> Gmail
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNativeMail(m)}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: "#f1f5f9",
                      color: "#334155",
                      borderRadius: 9,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    className="hover:bg-[#334155] hover:text-white active:scale-95"
                    title={`Email ${m.name} via Default Mail App`}
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
            paddingTop: 14,
            borderTop: "1px solid rgba(13, 27, 66, 0.08)",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
            Space: <strong style={{ color: "#1e2029" }}>{space.title}</strong> · {space.members.length} members
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#e8dbce",
              border: "1px solid #d8cbbe",
              borderRadius: 12,
              padding: "9px 26px",
              fontSize: 14,
              fontWeight: 700,
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
