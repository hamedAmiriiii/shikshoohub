import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export type ChequeType = "issued" | "received";
export type ChequeStatus = "pending" | "cleared" | string;
export type ExpenseType = "جاری" | "سرمایه";

export type JalaliDatePayload = {
  year: number;
  month: number;
  day: number;
};

export type Cheque = {
  id: number;
  type?: ChequeType;
  cheque_number?: string;
  bank_name?: string;
  payee?: string;
  amount?: number | string;
  title?: string | null;
  expense_type?: ExpenseType | string | null;
  note?: string | null;
  status?: ChequeStatus;
  issue_date?: string | null;
  due_date?: string | null;
  clear_date?: string | null;
  issue_date_jalali?: string | null;
  due_date_jalali?: string | null;
  clear_date_jalali?: string | null;
  created_at?: string;
};

export const CHEQUE_TYPE_OPTIONS = [
  { value: "issued" as const, label: "صادره" },
  { value: "received" as const, label: "دریافتی" },
];

export const CHEQUE_STATUS_OPTIONS = [
  { value: "all", label: "همه" },
  { value: "pending", label: "در انتظار" },
  { value: "cleared", label: "وصول‌شده" },
];

export const EXPENSE_TYPE_OPTIONS = [
  { value: "جاری" as const, label: "جاری" },
  { value: "سرمایه" as const, label: "سرمایه" },
];

export const TIME_FILTER_OPTIONS = [
  { value: "all", label: "همه" },
  { value: "today", label: "امروز" },
  { value: "week", label: "هفته" },
  { value: "month", label: "ماه" },
  { value: "year", label: "سال" },
] as const;

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

export function dateObjectToPayload(d: DateObject | null | undefined): JalaliDatePayload | null {
  if (!d || Array.isArray(d)) return null;
  return {
    year: d.year,
    month: d.month.number,
    day: d.day,
  };
}

export function createJalaliDateObject(
  year: number,
  month: number,
  day = 1,
): DateObject {
  return new DateObject({
    year,
    month,
    day,
    calendar: persian,
    locale: persian_fa,
  });
}

export function todayJalaliDateObject(): DateObject {
  return new DateObject({ calendar: persian, locale: persian_fa });
}

/** تلاش برای ساخت DateObject از رشتهٔ جلالی مثل 1404/06/01 یا فیلدهای جدا */
export function parseJalaliDateString(value?: string | null): DateObject | null {
  if (!value) return null;
  const match = String(value).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) return null;
  return createJalaliDateObject(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  );
}

export function extractChequeList(res: unknown): Cheque[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as Cheque[];
  const obj = res as { data?: unknown; cheques?: unknown };
  if (Array.isArray(obj.data)) return obj.data as Cheque[];
  if (Array.isArray(obj.cheques)) return obj.cheques as Cheque[];
  return [];
}

export function buildChequesUrl(opts: {
  type: ChequeType | "all";
  status: string;
  filter: string;
  chequeNumber: string;
  upcoming: boolean;
  upcomingDays: number;
}): string {
  if (opts.upcoming) {
    const params = new URLSearchParams();
    params.set("days", String(opts.upcomingDays || 7));
    if (opts.type !== "all") params.set("type", opts.type);
    return `/api/cheques/upcoming?${params.toString()}`;
  }

  const params = new URLSearchParams();
  if (opts.type !== "all") params.set("type", opts.type);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.filter && opts.filter !== "all") params.set("filter", opts.filter);
  if (opts.chequeNumber.trim()) params.set("cheque_number", opts.chequeNumber.trim());

  const qs = params.toString();
  return qs ? `/api/cheques?${qs}` : "/api/cheques";
}

export function buildAvailableChequesForSaleUrl(): string {
  return "/api/cheques?available_for_sale=1&type=received&status=pending";
}

export function filterChequesMatchingAmount(cheques: Cheque[], amount: number): Cheque[] {
  if (amount <= 0) return [];
  return cheques.filter((c) => parseAmount(c.amount) === amount);
}

export function formatChequeOptionLabel(cheque: Cheque): string {
  const parts = [
    cheque.cheque_number ? `چک ${cheque.cheque_number}` : null,
    cheque.bank_name,
    cheque.payee,
    cheque.due_date_jalali ? `سررسید ${cheque.due_date_jalali}` : null,
    `${formatNumber(parseAmount(cheque.amount))} تومان`,
  ].filter(Boolean);
  return parts.join(" — ");
}

export function chequeTypeLabel(type?: string | null): string {
  if (type === "issued") return "صادره";
  if (type === "received") return "دریافتی";
  return type || "—";
}

export function chequeStatusLabel(status?: string | null): string {
  if (status === "pending") return "در انتظار";
  if (status === "cleared") return "وصول‌شده";
  return status || "—";
}

export function isChequePending(cheque: Cheque): boolean {
  return !cheque.status || cheque.status === "pending";
}

export function isChequeCleared(cheque: Cheque): boolean {
  return cheque.status === "cleared";
}
