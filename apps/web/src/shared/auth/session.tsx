"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/shared/api";

export type AuthUser = { name: string; email: string };
type AuthSession = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (accessToken: string, user?: AuthUser) => void;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  refreshSession: () => Promise<boolean>;
  authenticatedFetch: typeof fetch;
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

  const getAccessToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  const clearAiSession = useCallback(() => {
    for (let index = sessionStorage.length - 1; index >= 0; index--) {
      const key = sessionStorage.key(index);
      if (key?.startsWith("homescope-ai:")) sessionStorage.removeItem(key);
    }
    window.dispatchEvent(new Event("homescope:logout"));
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearAiSession();
    setUser(null);
  }, [clearAiSession]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Session expired");
      const payload = await response.json();
      signIn(payload.data.access_token, payload.data.user);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [clearSession, signIn]);

  const authenticatedFetch = useCallback<typeof fetch>(async (input, init) => {
    const retryInput = input instanceof Request ? input.clone() : input;
    const send = (token: string | null, target: RequestInfo | URL) => {
      const headers = new Headers(init?.headers || (target instanceof Request ? target.headers : undefined));
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(target, { ...init, headers });
    };
    let response = await send(getAccessToken(), input);
    if (response.status !== 401) return response;
    if (!await refreshSession()) return response;
    response = await send(getAccessToken(), retryInput);
    return response;
  }, [getAccessToken, refreshSession]);

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

    refreshSession()
      .finally(() => setReady(true));
  }, [clearSession, refreshSession]);

  const value = useMemo(() => ({ user, ready, signIn, signOut, getAccessToken, refreshSession, authenticatedFetch }), [authenticatedFetch, getAccessToken, ready, refreshSession, signIn, signOut, user]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error("useAuthSession must be used inside AuthSessionProvider");
  return session;
}
