"use client";
import { useState, useEffect } from "react";
import { Member } from "./api";
import { firebaseAuthService } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<Member | null>(() => firebaseAuthService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthChange((fbUser) => {
      setUser(fbUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, setUser };
}
