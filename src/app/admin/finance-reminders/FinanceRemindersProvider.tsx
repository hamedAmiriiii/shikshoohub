"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { todayJalaliYmd } from "@/app/lib/accounting";
import { useShopPermissionGate } from "@/app/lib/shopPermissions";

export type FinanceReminderItem = {
  id: number;
  kind: string;
  direction: "receivable" | "payable" | string;
  amount: number;
  due_date?: string | null;
  due_date_jalali?: string | null;
  party?: string | null;
  title?: string | null;
  reference?: string | null;
  source_type?: string | null;
  source_id?: number | null;
  invoice_id?: number | null;
  expense_id?: number | null;
  purchase_id?: number | null;
  overdue?: boolean;
  direction_label?: string;
  kind_label?: string;
  note?: string | null;
};

export type FinanceReminderBucket = {
  count: number;
  total: number;
  items: FinanceReminderItem[];
};

export type FinanceRemindersPayload = {
  day: string;
  days: number;
  fetched_at?: string;
  atelier_id?: number;
  cheques: FinanceReminderBucket;
  credit_receivable: FinanceReminderBucket;
  credit_payable: FinanceReminderBucket;
  total_count: number;
  summary?: Record<string, number>;
};

type Ctx = {
  data: FinanceRemindersPayload | null;
  loading: boolean;
  totalCount: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  refresh: (force?: boolean) => Promise<void>;
};

const EMPTY_BUCKET: FinanceReminderBucket = { count: 0, total: 0, items: [] };

const FinanceRemindersContext = createContext<Ctx | null>(null);

function readAtelierId(): number | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw) as Record<string, unknown>;
    const direct = Number(user.atelier_id);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const atelier = user.atelier as { id?: number } | undefined;
    const nested = Number(atelier?.id);
    if (Number.isFinite(nested) && nested > 0) return nested;
  } catch {
    /* ignore */
  }
  return null;
}

function cacheKey(atelierId: number, day: string): string {
  return `finance-reminders-v1-${atelierId}-${day}`;
}

function readCache(atelierId: number, day: string): FinanceRemindersPayload | null {
  try {
    const raw = localStorage.getItem(cacheKey(atelierId, day));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FinanceRemindersPayload;
    if (!parsed || parsed.day !== day) return null;
    return {
      ...parsed,
      cheques: parsed.cheques ?? EMPTY_BUCKET,
      credit_receivable: parsed.credit_receivable ?? EMPTY_BUCKET,
      credit_payable: parsed.credit_payable ?? EMPTY_BUCKET,
      total_count: Number(parsed.total_count) || 0,
    };
  } catch {
    return null;
  }
}

function writeCache(atelierId: number, day: string, payload: FinanceRemindersPayload) {
  try {
    localStorage.setItem(cacheKey(atelierId, day), JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function useFinanceReminders(): Ctx {
  return (
    useContext(FinanceRemindersContext) ?? {
      data: null,
      loading: false,
      totalCount: 0,
      open: false,
      setOpen: () => {},
      refresh: async () => {},
    }
  );
}

export default function FinanceRemindersProvider({ children }: { children: ReactNode }) {
  const { can, ready: permissionsReady } = useShopPermissionGate();
  const allowed = permissionsReady && (can("cheques") || can("debts") || can("expenses") || can("invoices"));
  const [data, setData] = useState<FinanceRemindersPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(
    async (force = false) => {
      if (!navigator.onLine) return;
      if (!allowed) return;
      const token = tokenCode();
      if (!token) return;
      const atelierId = readAtelierId();
      if (!atelierId) return;
      const day = todayJalaliYmd();
      if (!force) {
        const cached = readCache(atelierId, day);
        if (cached) {
          setData(cached);
          return;
        }
      }
      setLoading(true);
      try {
        const res = await FetchWithJwtClient(
          "GET",
          "/api/financial-report/reminders?days=5",
          token,
        );
        if (res?.hasError) return;
        const payload: FinanceRemindersPayload = {
          day: typeof res?.day === "string" ? res.day : day,
          days: Number(res?.days) || 5,
          fetched_at: typeof res?.fetched_at === "string" ? res.fetched_at : undefined,
          atelier_id: Number(res?.atelier_id) || atelierId,
          cheques: {
            count: Number(res?.cheques?.count) || 0,
            total: Number(res?.cheques?.total) || 0,
            items: Array.isArray(res?.cheques?.items) ? res.cheques.items : [],
          },
          credit_receivable: {
            count: Number(res?.credit_receivable?.count) || 0,
            total: Number(res?.credit_receivable?.total) || 0,
            items: Array.isArray(res?.credit_receivable?.items)
              ? res.credit_receivable.items
              : [],
          },
          credit_payable: {
            count: Number(res?.credit_payable?.count) || 0,
            total: Number(res?.credit_payable?.total) || 0,
            items: Array.isArray(res?.credit_payable?.items) ? res.credit_payable.items : [],
          },
          total_count: Number(res?.total_count) || 0,
          summary: res?.summary,
        };
        writeCache(atelierId, payload.day, payload);
        setData(payload);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    [allowed],
  );

  useEffect(() => {
    if (!allowed) {
      setData(null);
      return;
    }
    void refresh(false);
  }, [allowed, refresh]);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return (
      (data.cheques?.count || 0) +
      (data.credit_receivable?.count || 0) +
      (data.credit_payable?.count || 0)
    );
  }, [data]);

  const value = useMemo(
    () => ({ data, loading, totalCount, open, setOpen, refresh }),
    [data, loading, open, refresh, totalCount],
  );

  return (
    <FinanceRemindersContext.Provider value={value}>{children}</FinanceRemindersContext.Provider>
  );
}
