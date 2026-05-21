import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";

const STORAGE_KEY = "shop_today_dashboard_v1";

export interface TodayDashboardSnapshot {
  dateKey: string;
  totalSales: number;
  totalProfit: number;
  inventorySaleValue: number;
  updatedAt: number;
}

export function getLocalDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function readTodayDashboardCache(): TodayDashboardSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TodayDashboardSnapshot;
    if (
      !parsed ||
      typeof parsed.totalSales !== "number" ||
      typeof parsed.totalProfit !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeTodayDashboardCache(snapshot: TodayDashboardSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota errors */
  }
}

/** یک درخواست GET /api/reports — فقط بعد از ثبت خرید صدا زده شود */
export async function fetchAndCacheTodayDashboard(): Promise<TodayDashboardSnapshot | null> {
  const token = tokenCode() || "";
  try {
    const res = await apiRequestError("Get", {}, {}, "/api/reports", true, true, token);
    if (res?.hasError) return null;

    const today = (res.today ?? {}) as Record<string, unknown>;
    const inventory = (res.products_inventory ?? res.inventory ?? {}) as Record<
      string,
      unknown
    >;

    const snapshot: TodayDashboardSnapshot = {
      dateKey: getLocalDateKey(),
      totalSales: Math.floor(Number(today.total_sales) || 0),
      totalProfit: Math.floor(Number(today.total_profit) || 0),
      inventorySaleValue: Math.floor(
        Number(inventory.total_sale_value) || 0,
      ),
      updatedAt: Date.now(),
    };

    writeTodayDashboardCache(snapshot);
    return snapshot;
  } catch {
    return null;
  }
}
