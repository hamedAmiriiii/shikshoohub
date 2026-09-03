"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CloudOff, CloudUpload, Wifi } from "lucide-react";
import { toast } from "react-toastify";
import { oilPostVisit, oilRefreshAuth } from "@/app/lib/oil/api";
import {
  OIL_OUTBOX_CHANGED,
  formatOilOccurredAt,
  isOilDuplicateVisit,
  isOilNetworkError,
  isOilVisitCreated,
  listOilOutbox,
  oilOutboxCount,
  removeOilOutboxItem,
  updateOilOutboxItem,
  freezeOilVisitBody,
} from "@/app/lib/oil/offline";
import { getOilToken } from "@/app/lib/oil/auth";

type OilOfflineValue = {
  online: boolean;
  pending: number;
  syncing: boolean;
  flush: () => Promise<void>;
};

const OilOfflineContext = createContext<OilOfflineValue | null>(null);

export function OilOfflineProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const flushing = useRef(false);

  const refresh = useCallback(() => {
    setPending(oilOutboxCount());
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (!getOilToken()) return;
    const items = listOilOutbox();
    if (items.length === 0) return;
    flushing.current = true;
    setSyncing(true);
    let sent = 0;
    try {
      for (const item of items) {
        const body = freezeOilVisitBody({
          ...item.body,
          client_id: item.clientId || item.body.client_id,
          occurred_at:
            item.body.occurred_at || formatOilOccurredAt(new Date(item.createdAt)),
        });
        if (
          body.client_id !== item.body.client_id ||
          body.occurred_at !== item.body.occurred_at ||
          item.body.gear_oil_product_id
        ) {
          updateOilOutboxItem(item.id, { body, clientId: body.client_id });
        }
        let res = await oilPostVisit(body);
        if (res.statusCode === 401) {
          const ok = await oilRefreshAuth();
          if (!ok) {
            updateOilOutboxItem(item.id, {
              retryCount: item.retryCount + 1,
              lastError: "ورود منقضی شده",
            });
            break;
          }
          res = await oilPostVisit(body);
          if (res.statusCode === 401) {
            updateOilOutboxItem(item.id, {
              retryCount: item.retryCount + 1,
              lastError: "ورود منقضی شده",
            });
            break;
          }
        }
        if (isOilVisitCreated(res) || isOilDuplicateVisit(res)) {
          removeOilOutboxItem(item.id);
          sent += 1;
          continue;
        }
        if (isOilNetworkError(res)) {
          updateOilOutboxItem(item.id, {
            retryCount: item.retryCount + 1,
            lastError: res.message,
          });
          break;
        }
        updateOilOutboxItem(item.id, {
          retryCount: item.retryCount + 1,
          lastError: res.message,
        });
      }
      if (sent > 0) {
        toast.success(
          sent === 1 ? "یک تعویض از صف ثبت شد." : `${sent} تعویض از صف ثبت شد.`,
        );
      }
    } finally {
      flushing.current = false;
      setSyncing(false);
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    refresh();
    const onStatus = () => {
      const next = navigator.onLine;
      setOnline(next);
      if (next) void flush();
    };
    const onChanged = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void flush();
    };
    window.addEventListener("online", onStatus);
    window.addEventListener("offline", onStatus);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(OIL_OUTBOX_CHANGED, onChanged);
    if (typeof navigator === "undefined" || navigator.onLine) void flush();
    return () => {
      window.removeEventListener("online", onStatus);
      window.removeEventListener("offline", onStatus);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(OIL_OUTBOX_CHANGED, onChanged);
    };
  }, [flush, refresh]);

  const value = useMemo(
    () => ({ online, pending, syncing, flush }),
    [online, pending, syncing, flush],
  );

  return <OilOfflineContext.Provider value={value}>{children}</OilOfflineContext.Provider>;
}

export function useOilOffline() {
  return useContext(OilOfflineContext);
}

export function OilOfflineIcon() {
  const ctx = useOilOffline();
  if (!ctx) return null;
  const { online, pending, syncing, flush } = ctx;
  if (online && pending === 0 && !syncing) return null;

  const title = !online
    ? pending > 0
      ? `آفلاین — ${pending} تعویض در صف`
      : "آفلاین"
    : syncing
      ? "در حال ارسال صف…"
      : `${pending} تعویض در صف`;

  return (
    <button
      type="button"
      className={`oil-offline-icon${!online ? " off" : ""}${pending > 0 ? " queued" : ""}`}
      aria-label={title}
      title={title}
      onClick={() => {
        if (online && pending > 0) void flush();
      }}
    >
      {!online ? <CloudOff size={16} /> : pending > 0 ? <CloudUpload size={16} /> : <Wifi size={16} />}
      {pending > 0 ? (
        <span>{pending > 9 ? "۹+" : new Intl.NumberFormat("fa-IR").format(pending)}</span>
      ) : null}
    </button>
  );
}
