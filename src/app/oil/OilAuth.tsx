"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { oilMe, isOilApiError } from "@/app/lib/oil/api";
import {
  clearOilSession,
  getOilSession,
  getOilToken,
  saveOilSession,
} from "@/app/lib/oil/auth";
import type { OilSession, OilSmsQuota } from "@/app/lib/oil/types";

type OilAuthValue = {
  ready: boolean;
  session: OilSession | null;
  setSession: (session: OilSession, token?: string) => void;
  updateSms: (sms: OilSmsQuota) => void;
  logoutLocal: () => void;
  refresh: () => Promise<void>;
};

const OilAuthContext = createContext<OilAuthValue | null>(null);

function isPublicOilPath(pathname: string | null) {
  return pathname === "/oil/login";
}

export function OilAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState<OilSession | null>(null);

  const setSession = useCallback((next: OilSession, token?: string) => {
    saveOilSession(next, token);
    setSessionState({
      project_type: "oil",
      user: next.user,
      shop: next.shop,
      shop_access: next.shop_access,
      sms: next.sms,
    });
  }, []);

  const updateSms = useCallback((sms: OilSmsQuota) => {
    setSessionState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, sms };
      saveOilSession(next);
      return next;
    });
  }, []);

  const logoutLocal = useCallback(() => {
    clearOilSession();
    setSessionState(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = getOilToken();
    if (!token) {
      setSessionState(null);
      return;
    }
    const res = await oilMe();
    if (isOilApiError(res)) {
      if (res.statusCode === 401) {
        clearOilSession();
        setSessionState(null);
      }
      return;
    }
    saveOilSession(res, token);
    setSessionState(res);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = getOilSession();
    if (cached) setSessionState(cached);
    const token = getOilToken();
    if (!token) {
      setReady(true);
      return;
    }
    void refresh().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    if (!ready) return;
    if (isPublicOilPath(pathname)) {
      if (getOilToken()) {
        let next = "/oil";
        if (typeof window !== "undefined") {
          const q = new URLSearchParams(window.location.search).get("next");
          if (q && q.startsWith("/oil")) next = q;
        }
        router.replace(next);
      }
      return;
    }
    if (!getOilToken()) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/oil/login${next}`);
    }
  }, [pathname, ready, router]);

  const value = useMemo(
    () => ({ ready, session, setSession, updateSms, logoutLocal, refresh }),
    [ready, session, setSession, updateSms, logoutLocal, refresh],
  );

  return (
    <OilAuthContext.Provider value={value}>{children}</OilAuthContext.Provider>
  );
}

export function useOilAuth() {
  const ctx = useContext(OilAuthContext);
  if (!ctx) throw new Error("useOilAuth must be used within OilAuthProvider");
  return ctx;
}
