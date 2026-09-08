"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import {
  ADMIN_POS_SETTINGS_CHANGED_EVENT,
  readAdminPosSettings,
} from "@/app/lib/adminPosSettings";

export const SERVICE_REQUESTS_NEW_EVENT = "table-service-requests-new";

type Ctx = {
  count: number;
  latestId: number | null;
  refresh: () => Promise<void>;
};

const CtxValue = createContext<Ctx | null>(null);

export function useServiceRequestsPending(): Ctx {
  return (
    useContext(CtxValue) ?? {
      count: 0,
      latestId: null,
      refresh: async () => {},
    }
  );
}

export default function ServiceRequestsPendingProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [count, setCount] = useState(0);
  const [latestId, setLatestId] = useState<number | null>(null);
  const seenCount = useRef(0);
  const seenInitialized = useRef(false);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    try {
      if (!soundRef.current) soundRef.current = new Audio("/reserv/1.mp3");
      soundRef.current.currentTime = 0;
      void soundRef.current.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return;
    if (!readAdminPosSettings().roomServicesEnabled) return;
    const token = tokenCode();
    if (!token) return;
    try {
      const res = await FetchWithJwtClient("GET", "/api/table-service-requests/pending-count", token);
      if (res?.hasError) return;
      const nextCount = Number(res?.count) || 0;
      const nextLatest = res?.latest_id == null ? null : Number(res.latest_id);
      const prevCount = seenCount.current;
      setCount(nextCount);
      setLatestId(Number.isFinite(nextLatest as number) ? nextLatest : null);
      if (seenInitialized.current && nextCount > prevCount) {
        playSound();
        window.dispatchEvent(
          new CustomEvent(SERVICE_REQUESTS_NEW_EVENT, {
            detail: { count: nextCount, latestId: nextLatest, prevCount },
          }),
        );
      }
      seenInitialized.current = true;
      seenCount.current = nextCount;
    } catch {
      /* ignore */
    }
  }, [playSound]);

  useEffect(() => {
    const sync = () => setEnabled(readAdminPosSettings().roomServicesEnabled);
    sync();
    window.addEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      setLatestId(null);
      seenInitialized.current = false;
      seenCount.current = 0;
      return;
    }
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  const value = useMemo(() => ({ count, latestId, refresh }), [count, latestId, refresh]);

  return <CtxValue.Provider value={value}>{children}</CtxValue.Provider>;
}
