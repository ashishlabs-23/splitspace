"use client";
import React, { useState } from "react";
import { Member } from "@/lib/api";

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function Avatar({
  m,
  size = "sm",
  className = "",
}: {
  m?: Member | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
    xl: "w-14 h-14 text-lg",
  };

  const hasImage = m?.avatar && typeof m.avatar === "string" && (m.avatar.startsWith("http") || m.avatar.startsWith("/"));

  if (hasImage && !imgFailed) {
    return (
      <div className={`relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200 shadow-sm ${sizeClasses[size]} ${className}`}>
        <img
          src={m.avatar!}
          alt={m.name || "User avatar"}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  const name = m?.name || "User";
  const initials = getInitials(name, m?.email);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 font-bold bg-slate-800 text-white shadow-sm border border-slate-700 ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}
