"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";

export type AuthUser = { name: string; email: string };
type AuthSession = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (accessToken: string, user?: AuthUser) => void;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSession | null>(null);
const TOKEN_KEY = "access_token";
const USER_KEY = "homescope:auth-user";

function userFromToken(token: string): AuthUser | null {
  try {
    const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(segment.padEnd(Math.ceil(segment.length / 4) * 4, "="))) as { name?: string; email?: string; exp?: number };
    if (!payload.email || (payload.exp && payload.exp * 1000 <= Date.now())) return null;
    return { name: payload.name?.trim() || payload.email.split("@")[0], email: payload.email };
  } catch {
    return null;
  }
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const signIn = useCallback((accessToken: string, nextUser?: AuthUser) => {
    const resolvedUser = nextUser || userFromToken(accessToken);
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (resolvedUser) localStorage.setItem(USER_KEY, JSON.stringify(resolvedUser));
    setUser(resolvedUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const tokenUser = token ? userFromToken(token) : null;
    if (tokenUser) {
      try {
        const saved = JSON.parse(localStorage.getItem(USER_KEY) || "null") as AuthUser | null;
        setUser(saved?.email === tokenUser.email ? saved : tokenUser);
      } catch {
        setUser(tokenUser);
      }
      setReady(true);
      return;
    }

    if (!token) {
      clearSession();
      setReady(true);
      return;
    }

    fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session expired");
        const payload = await response.json();
        signIn(payload.data.access_token, payload.data.user);
      })
      .catch(clearSession)
      .finally(() => setReady(true));
  }, [clearSession, signIn]);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [ready, signIn, signOut, user]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error("useAuthSession must be used inside AuthSessionProvider");
  return session;
}
