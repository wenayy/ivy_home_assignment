"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredSession, readStoredSession, storeSession } from "../lib/client-api";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const router = useRouter();

  useEffect(() => { setSession(readStoredSession()); }, []);

  const value = useMemo(() => ({
    session,
    async login(email, password, turnstileToken) {
      const response = await fetch("/api/ivy/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Turnstile-Token": turnstileToken,
        },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.detail || "Those credentials were not accepted.");
      const next = storeSession(body);
      setSession(next);
      router.replace("/listings");
    },
    async logout() {
      try {
        if (session?.access_token) {
          await fetch("/api/ivy/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
      } finally {
        clearStoredSession();
        setSession(null);
        router.replace("/login");
      }
    },
  }), [router, session]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
