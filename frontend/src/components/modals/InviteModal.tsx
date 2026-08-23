"use client";
import React, { useState, useEffect } from "react";
import { api, Space } from "@/lib/api";
import { Overlay } from "@/components/ui/overlay";
import {
  X,
  Users,
  Check,
  Copy,
  UserPlus,
  Sparkles,
  ShieldCheck,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export function InviteModal({
  space,
  onClose,
  onCopied,
}: {
  space: Space;
  onClose: () => void;
  onCopied?: () => void;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [urlErr, setUrlErr] = useState("");

  useEffect(() => {
    api.invite(space.id)
      .then((x) => {
        const fullUrl = x.url.startsWith("http")
          ? x.url
          : `${typeof window !== "undefined" ? window.location.origin : ""}${x.url}`;
        setUrl(fullUrl);
      })
      .catch(() => {
        setUrlErr("Could not generate invite link.");
      });
  }, [space.id]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share && url) {
      try {
        await navigator.share({
          title: `Join ${space.title} on SplitSpace`,
          text: `Join our shared expense space "${space.title}" on SplitSpace:`,
          url: url,
        });
      } catch {
        copy();
      }
    } else {
      copy();
    }
  }

  return (
    <Overlay onClose={onClose} label="Invite to space">
      <div
        className="modal"
        style={{
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#faf1eb",
          backgroundImage: "linear-gradient(160deg, #ffffff 0%, #faf1eb 60%, #f5e5da 100%)",
          border: "1.5px solid rgba(241, 107, 45, 0.22)",
          borderRadius: 24,
          padding: "clamp(16px, 4vw, 24px)",
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
            paddingBottom: 20,
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
              <UserPlus size={24} />
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
                Invite Group Members
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  margin: "4px 0 0",
                  fontWeight: 400,
                }}
              >
                Share access link with friends to collaborate on expenses in real-time.
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

        {/* ── Space Summary Banner ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
            border: "1px solid rgba(224, 86, 46, 0.18)",
            borderRadius: 18,
            padding: "16px 20px",
            marginTop: 20,
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(224, 86, 46, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{space.emoji || "✨"}</span>
            <div>
              <strong style={{ fontSize: 16, fontWeight: 700, color: "#1e2029", display: "block" }}>
                {space.title}
              </strong>
              <small style={{ fontSize: 12, color: "#6b7280", display: "block", marginTop: 2 }}>
                Currency: <strong style={{ color: "#e0562e" }}>{space.currency}</strong> · {space.members.length}{" "}
                {space.members.length === 1 ? "member" : "members"}
              </small>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: -6 }}>
            {space.members.slice(0, 4).map((m, idx) => (
              <div
                key={m.id}
                style={{
                  marginLeft: idx === 0 ? 0 : -8,
                  border: "2px solid #ffffff",
                  borderRadius: "50%",
                }}
              >
                <Avatar m={m} size="sm" />
              </div>
            ))}
            {space.members.length > 4 && (
              <span
                style={{
                  marginLeft: -8,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#faece6",
                  color: "#e0562e",
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  border: "2px solid #ffffff",
                }}
              >
                +{space.members.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* ── Shareable 1-Click Link Card ── */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            border: "1.5px solid #e0562e",
            borderRadius: 20,
            padding: "22px",
            boxShadow: "0 4px 16px rgba(224, 86, 46, 0.08)",
            marginBottom: 20,
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
                color: "#e0562e",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              SHAREABLE 1-CLICK INVITE LINK
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#059669",
                background: "#ecfdf5",
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              ● Valid for 7 days
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "6px 8px 6px 14px",
            }}
          >
            <input
              type="text"
              readOnly
              value={urlErr || url || "Generating invite link…"}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: 13,
                fontWeight: 500,
                color: "#1e2029",
                outline: "none",
                fontFamily: "monospace",
              }}
            />
            <button
              type="button"
              onClick={copy}
              disabled={!url}
              style={{
                background: copied ? "#059669" : "#e0562e",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
                boxShadow: copied
                  ? "0 4px 12px rgba(5, 150, 105, 0.3)"
                  : "0 4px 12px rgba(224, 86, 46, 0.3)",
              }}
              className="hover:brightness-110"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          <p style={{ fontSize: 12, color: "#6b7280", margin: "14px 0 0", lineHeight: 1.5 }}>
            Anyone with this link can join this space instantly. Existing equal expenses will automatically
            re-split to include newly joined friends.
          </p>
        </div>

        {/* ── Footer Actions ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 16,
            borderTop: "1px solid rgba(13, 27, 66, 0.08)",
          }}
        >
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={!url}
            style={{
              background: "#ffffff",
              border: "1px solid #d8cbbe",
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#1e2029",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
            className="hover:bg-orange-50 hover:border-orange-200"
          >
            <Share2 size={15} style={{ color: "#e0562e" }} /> Share via App / WhatsApp
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#e0562e",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              padding: "10px 24px",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(224, 86, 46, 0.3)",
            }}
            className="hover:brightness-110"
          >
            Done
          </button>
        </div>
      </div>
    </Overlay>
  );
}
