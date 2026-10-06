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
import { readShopFeatures, SHOP_FEATURES_CHANGED_EVENT } from "@/app/lib/shopFeatures";
import {
  announceTableEvent,
  bindAnnouncementAudioUnlock,
} from "@/app/lib/speakPersianAnnouncement";

export const TABLE_PAGERS_NEW_EVENT = "table-pagers-new";

type Ctx = {
  count: number;
  latestId: number | null;
  refresh: () => Promise<void>;
};

const CtxValue = createContext<Ctx | null>(null);

export function useTablePagersPending(): Ctx {
  return (
    useContext(CtxValue) ?? {
      count: 0,
      latestId: null,
      refresh: async () => {},
    }
  );
}

function pagerEnabled() {
  const features = readShopFeatures();
  return features.restaurant_cafe_enabled || features.room_services_enabled;
}

export default function TablePagersPendingProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [count, setCount] = useState(0);
  const [latestId, setLatestId] = useState<number | null>(null);
  const seenCount = useRef(0);
  const seenInitialized = useRef(false);
  const seenLatest = useRef<number | null>(null);

  const playSound = useCallback((label?: string | null) => {
    void announceTableEvent(label || "", "service");
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([180, 80, 180, 80, 240]);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return;
    if (!pagerEnabled()) return;
    const token = tokenCode();
    if (!token) return;
    try {
      const res = await FetchWithJwtClient("GET", "/api/table-pagers/pending-count", token);
      if (res?.hasError) return;
      const nextCount = Number(res?.count) || 0;
      const nextLatest = res?.latest_id == null ? null : Number(res.latest_id);
      const prevCount = seenCount.current;
      setCount(nextCount);
      setLatestId(Number.isFinite(nextLatest as number) ? nextLatest : null);
      const nextLabel = typeof res?.latest_label === "string" ? res.latest_label : "";
      const latestGrew =
        nextLatest != null &&
        Number.isFinite(nextLatest) &&
        (seenLatest.current == null || nextLatest > seenLatest.current);
      if (seenInitialized.current && nextCount > 0 && (nextCount > prevCount || latestGrew)) {
        playSound(nextLabel);
        window.dispatchEvent(
          new CustomEvent(TABLE_PAGERS_NEW_EVENT, {
            detail: { count: nextCount, latestId: nextLatest, prevCount, label: nextLabel },
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
      /* ignore */
    }
  }, [playSound]);

  useEffect(() => {
    const sync = () => setEnabled(pagerEnabled());
    sync();
    window.addEventListener(SHOP_FEATURES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SHOP_FEATURES_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => bindAnnouncementAudioUnlock(), []);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      setLatestId(null);
      seenInitialized.current = false;
      seenCount.current = 0;
      seenLatest.current = null;
      return;
    }
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  const value = useMemo(() => ({ count, latestId, refresh }), [count, latestId, refresh]);

  return <CtxValue.Provider value={value}>{children}</CtxValue.Provider>;
}
