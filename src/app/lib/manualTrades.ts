import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
  gregorianApiDateFromDateObject,
  parseAccessEndToDateObject,
  toDateInputValue,
} from "@/app/lib/shopAccess";

export type ManualTradeType = "purchase" | "sale";

export type ManualTrade = {
  id: number;
  type?: ManualTradeType | string;
  title?: string | null;
  amount?: number | string;
  description?: string | null;
  date?: string | null;
  date_jalali?: string | null;
  shop_account_id?: number | null;
  shop_account?: { id?: number; name?: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const MANUAL_TRADE_TYPE_OPTIONS = [
  { value: "purchase" as const, label: "سند خرید" },
  { value: "sale" as const, label: "سند فروش" },
];

export function manualTradeTypeLabel(type?: string | null): string {
  if (type === "purchase") return "سند خرید";
  if (type === "sale") return "سند فروش";
  return "سند";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(Math.floor(n || 0));
}

export function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/٬/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\s/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export function formatInputWithSeparator(value: string): string {
  const digitsOnly = String(value ?? "").replace(/[^\d۰-۹٠-٩]/g, "");
  if (!digitsOnly) return "";
  return formatNumber(parseAmount(digitsOnly));
}

export function todayJalaliDateObject(): DateObject {
  return new DateObject({ calendar: persian, locale: persian_fa });
}

export function parseJalaliDateString(value?: string | null): DateObject | null {
  if (!value) return null;
  const match = String(value).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) return null;
  return new DateObject({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    calendar: persian,
    locale: persian_fa,
  });
}

export function parseTradeDateObject(trade: Pick<ManualTrade, "date" | "date_jalali" | "created_at">): DateObject | null {
  const jalali = parseJalaliDateString(trade.date_jalali);
  if (jalali) return jalali;

  const raw = trade.date || "";
  const iso = toDateInputValue(raw);
  if (iso) {
    const year = Number(iso.slice(0, 4));
    if (year >= 1700) return parseAccessEndToDateObject(iso);
    return parseJalaliDateString(iso.replace(/-/g, "/"));
  }

  const fromDateField = parseJalaliDateString(raw);
  if (fromDateField) return fromDateField;

  return parseAccessEndToDateObject(trade.created_at);
}

export function formatTradeDate(trade: Pick<ManualTrade, "date" | "date_jalali" | "created_at">): string {
  if (trade.date_jalali) return trade.date_jalali;
  const d = parseTradeDateObject(trade);
  if (d) {
    try {
      return new DateObject(d).convert(persian, persian_fa).format("YYYY/MM/DD");
    } catch {
      return d.format("YYYY/MM/DD");
    }
  }
  return trade.date || "—";
}

export function tradeDateToApi(value: DateObject | DateObject[] | null | undefined): string {
  if (!value || Array.isArray(value)) return "";
  return gregorianApiDateFromDateObject(new DateObject(value));
}

export function resolveShopAccountId(item: ManualTrade | null | undefined): number | "" {
  if (!item) return "";
  const direct = Number(item.shop_account_id);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const nested = Number(item.shop_account?.id);
  if (Number.isFinite(nested) && nested > 0) return nested;
  return "";
}

export function shopAccountName(item: ManualTrade | null | undefined): string {
  const name = item?.shop_account?.name;
  return typeof name === "string" && name.trim() ? name.trim() : "";
}

function asTrade(candidate: unknown): ManualTrade | null {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const id = (candidate as ManualTrade).id;
  const numericId = typeof id === "number" ? id : Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;
  return { ...(candidate as ManualTrade), id: numericId };
}

export function extractManualTradeList(res: unknown): ManualTrade[] {
  if (!res) return [];
  if (Array.isArray(res)) {
    return res.map(asTrade).filter((item): item is ManualTrade => item != null);
  }
  const obj = res as {
    data?: unknown;
    manual_trades?: unknown;
  };
  const nestedData =
    obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
      ? (obj.data as { data?: unknown; manual_trades?: unknown })
      : null;
  const candidates = [obj.data, obj.manual_trades, nestedData?.data, nestedData?.manual_trades];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map(asTrade).filter((item): item is ManualTrade => item != null);
    }
  }
  return [];
}

export function extractManualTrade(res: unknown): ManualTrade | null {
  if (!res || typeof res !== "object") return null;
  const obj = res as Record<string, unknown>;
  const candidates = [obj, obj.data, obj.manual_trade];
  for (const candidate of candidates) {
    const trade = asTrade(candidate);
    if (trade) return trade;
  }
  return null;
}

export function buildManualTradesUrl(type: ManualTradeType | "all"): string {
  const params = new URLSearchParams();
  if (type !== "all") params.set("type", type);
  params.set("per_page", "200");
  const query = params.toString();
  return query ? `/api/manual-trades?${query}` : "/api/manual-trades";
}
