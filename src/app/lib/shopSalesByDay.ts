import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";

const STORAGE_KEY = "shop_sales_by_day_v1";
const DEFAULT_DAYS = 10;

export interface SalesByDayItem {
  date: string;
  date_jalali: string;
  total_sales: number;
  gross_sales: number;
  total_returns: number;
  card_amount: number;
  cash_amount: number;
  purchases_count: number;
}

export interface SalesByDaySnapshot {
  days: number;
  from_date_jalali: string;
  to_date_jalali: string;
  period_total_sales: number;
  daily: SalesByDayItem[];
  updatedAt: number;
}

export function readSalesByDayCache(): SalesByDaySnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SalesByDaySnapshot;
    if (!parsed?.daily || !Array.isArray(parsed.daily)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSalesByDayCache(snapshot: SalesByDaySnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

/** GET /api/dashboard/sales-by-day — فقط همراه به‌روزرسانی داشبورد بعد از خرید */
export async function fetchAndCacheSalesByDay(
  days: number = DEFAULT_DAYS,
): Promise<SalesByDaySnapshot | null> {
  const token = tokenCode() || "";
  try {
    const res = await apiRequestError(
      "Get",
      {},
      {},
      `/api/dashboard/sales-by-day?days=${days}`,
      true,
      true,
      token,
    );
    if (res?.hasError || !Array.isArray(res?.daily)) return null;

    const snapshot: SalesByDaySnapshot = {
      days: Number(res.days) || days,
      from_date_jalali: String(res.from_date_jalali ?? ""),
      to_date_jalali: String(res.to_date_jalali ?? ""),
      period_total_sales: Math.floor(Number(res.period_total_sales) || 0),
      daily: res.daily.map((row: Record<string, unknown>) => ({
        date: String(row.date ?? ""),
        date_jalali: String(row.date_jalali ?? ""),
        total_sales: Math.floor(Number(row.total_sales) || 0),
        gross_sales: Math.floor(Number(row.gross_sales) || 0),
        total_returns: Math.floor(Number(row.total_returns) || 0),
        card_amount: Math.floor(Number(row.card_amount) || 0),
        cash_amount: Math.floor(Number(row.cash_amount) || 0),
        purchases_count: Math.floor(Number(row.purchases_count) || 0),
      })),
      updatedAt: Date.now(),
    };

    writeSalesByDayCache(snapshot);
    return snapshot;
  } catch {
    return null;
  }
}
