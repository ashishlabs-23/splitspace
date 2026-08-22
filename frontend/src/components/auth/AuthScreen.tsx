"use client";
import React from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { Member } from "@/lib/api";

export function AuthScreen({
  joinToken,
  onLoggedIn,
}: {
  joinToken?: string;
  onLoggedIn?: (user: Member) => void;
}) {
  return <LandingPage joinToken={joinToken} onLoggedIn={onLoggedIn} />;
}
