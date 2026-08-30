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

export const TABLE_ORDERS_NEW_EVENT = "table-orders-new";

export type TableOrdersPendingSnapshot = {
  count: number;
  withReceipt: number;
  latestId: number | null;
};

type Ctx = TableOrdersPendingSnapshot & {
  refresh: () => Promise<void>;
};

const TableOrdersPendingContext = createContext<Ctx | null>(null);

export function useTableOrdersPending(): Ctx {
  const ctx = useContext(TableOrdersPendingContext);
  return (
    ctx ?? {
      count: 0,
      withReceipt: 0,
      latestId: null,
      refresh: async () => {},
    }
  );
}

export default function TableOrdersPendingProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [count, setCount] = useState(0);
  const [withReceipt, setWithReceipt] = useState(0);
  const [latestId, setLatestId] = useState<number | null>(null);
  const seenLatest = useRef<number | null>(null);
  const seenCount = useRef(0);
  const seenInitialized = useRef(false);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  const playNewOrderSound = useCallback(() => {
    try {
      if (!soundRef.current) {
        soundRef.current = new Audio("/reserv/1.mp3");
      }
      soundRef.current.currentTime = 0;
      void soundRef.current.play().catch(() => {
        /* مرورگر ممکن است پخش خودکار را تا تعامل کاربر مسدود کند */
      });
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return;
    if (!readAdminPosSettings().restaurantCafeEnabled) return;
    const token = tokenCode();
    if (!token) return;
    try {
      const res = await FetchWithJwtClient("GET", "/api/table-orders/pending-count", token);
      if (res?.hasError) return;
      const nextCount = Number(res?.count) || 0;
      const nextReceipt = Number(res?.with_receipt) || 0;
      const nextLatest = res?.latest_id == null ? null : Number(res.latest_id);
      const prevCount = seenCount.current;
      setCount(nextCount);
      setWithReceipt(nextReceipt);
      setLatestId(Number.isFinite(nextLatest as number) ? nextLatest : null);
      if (seenInitialized.current && nextCount > prevCount) {
        playNewOrderSound();
        window.dispatchEvent(
          new CustomEvent(TABLE_ORDERS_NEW_EVENT, {
            detail: { count: nextCount, latestId: nextLatest, prevCount },
          }),
        );
      }
      seenInitialized.current = true;
      seenCount.current = nextCount;
      if (nextLatest != null && Number.isFinite(nextLatest)) {
        seenLatest.current = nextLatest;
      } else if (nextCount === 0) {
        seenLatest.current = null;
      }
    } catch {
      /* ignore poll errors */
    }
  }, [playNewOrderSound]);

  useEffect(() => {
    const sync = () => setEnabled(readAdminPosSettings().restaurantCafeEnabled);
    sync();
    window.addEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      setWithReceipt(0);
      setLatestId(null);
      seenInitialized.current = false;
      seenCount.current = 0;
      seenLatest.current = null;
      return;
    }
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  const value = useMemo(
    () => ({ count, withReceipt, latestId, refresh }),
    [count, latestId, refresh, withReceipt],
  );

  return (
    <TableOrdersPendingContext.Provider value={value}>{children}</TableOrdersPendingContext.Provider>
  );
}
