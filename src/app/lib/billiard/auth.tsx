"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch, getToken, setToken } from "./api";

export type BilliardSessionUser = {
  id: number;
  role: "admin" | "operator" | "player";
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string;
  phone?: string;
  photo_url?: string | null;
  profile_complete?: boolean;
  city?: string | null;
  club?: string | null;
};

type AuthCtx = {
  user: BilliardSessionUser | null;
  loading: boolean;
  loginWithToken: (token: string, user: BilliardSessionUser) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isStaff: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BilliardSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ user: BilliardSessionUser }>("/me");
      setUser(data.user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithToken = useCallback(
    (token: string, u: BilliardSessionUser) => {
      setToken(token);
      setUser(u);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithToken,
      logout,
      refresh,
      isStaff: !!user && (user.role === "admin" || user.role === "operator"),
    }),
    [user, loading, loginWithToken, logout, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
