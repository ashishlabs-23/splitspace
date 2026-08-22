"use client";
import { useState, useEffect } from "react";
import { Member } from "./api";
import { firebaseAuthService } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial check from localStorage for instant render
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("splitspace_user");
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {}
      }
    }

    const unsubscribe = firebaseAuthService.onAuthChange((fbUser) => {
      setUser(fbUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, setUser };
}
