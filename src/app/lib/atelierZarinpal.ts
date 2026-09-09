import { notifyShopAccessIfExpired, mergeUserWithShopAccess, getShopAccessFromUser, isShopAccessExpiredInfo, clearShopAccessExpiredState } from "@/app/lib/shopAccess";

export const SHOP_PAYMENTS_API_BASE = "/api";
export const OIL_PAYMENTS_API_BASE = "/api/oil";

export type PaymentType = "sms_package" | "shop_plan";

export type PaymentsCatalogItem = {
  id: number;
  name: string;
  description?: string | null;
  price_toman: number;
  sms_count?: number;
  duration_days?: number;
  duration_months?: number;
  is_active?: boolean;
};

export type PaymentsCatalog = {
  sms_packages: PaymentsCatalogItem[];
  shop_plans: PaymentsCatalogItem[];
};

export type ZarinpalReturn = {
  ok: boolean;
  payment: string;
  authority: string;
  status: string;
};

type PaymentsError = {
  hasError: true;
  statusCode: number;
  message: string;
};

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir"
).replace(/\/$/, "");

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const obj = asRecord(value);
  if (Array.isArray(obj?.data)) return obj.data;
  return [];
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function joinApi(apiBase: string, path: string): string {
  let base = (apiBase || SHOP_PAYMENTS_API_BASE).replace(/\/$/, "");
  if (!/^https?:/i.test(base)) {
    base = `${API_ORIGIN}${base.startsWith("/") ? base : `/${base}`}`;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function priceToman(row: Record<string, unknown>): number {
  if (row.price_toman != null && row.price_toman !== "") return asNumber(row.price_toman);
  if (row.price_rial != null && row.price_rial !== "") return Math.round(asNumber(row.price_rial) / 10);
  const price = asNumber(row.price ?? row.amount);
  if (price >= 100000000) return Math.round(price / 10);
  return price;
}

export function parseCatalogItem(value: unknown): PaymentsCatalogItem | null {
  const row = asRecord(value);
  if (!row) return null;
  const id = asNumber(row.id);
  if (!id) return null;
  const durationDays = asNumber(row.duration_days ?? row.days);
  const durationMonths = asNumber(row.duration_months ?? row.months);
  const smsCount = asNumber(row.sms_count ?? row.message_count);
  return {
    id,
    name: String(row.name ?? row.title ?? "آیتم"),
    description: typeof row.description === "string" ? row.description : null,
    price_toman: priceToman(row),
    sms_count: smsCount > 0 ? smsCount : undefined,
    duration_days: durationDays > 0 ? durationDays : undefined,
    duration_months: durationMonths > 0 ? durationMonths : undefined,
    is_active: row.is_active !== false && row.active !== false,
  };
}

export function parsePaymentsCatalog(res: unknown): PaymentsCatalog {
  const obj = asRecord(res);
  const nested = asRecord(obj?.data) ?? obj ?? {};
  const smsRaw =
    nested.sms_packages ??
    nested.smsPackages ??
    nested.packages ??
    obj?.sms_packages ??
    obj?.smsPackages;
  const planRaw =
    nested.shop_plans ??
    nested.shopPlans ??
    nested.plans ??
    obj?.shop_plans ??
    obj?.shopPlans;
  return {
    sms_packages: asList(smsRaw)
      .map(parseCatalogItem)
      .filter((item): item is PaymentsCatalogItem => Boolean(item && item.is_active !== false)),
    shop_plans: asList(planRaw)
      .map(parseCatalogItem)
      .filter((item): item is PaymentsCatalogItem => Boolean(item && item.is_active !== false)),
  };
}

export function parseAdminShopPlans(res: unknown): PaymentsCatalogItem[] {
  const obj = asRecord(res);
  const nested = asRecord(obj?.data);
  const list = asList(obj?.shop_plans).length
    ? asList(obj?.shop_plans)
    : asList(nested?.shop_plans).length
      ? asList(nested?.shop_plans)
      : asList(res);
  return list
    .map(parseCatalogItem)
    .filter((item): item is PaymentsCatalogItem => Boolean(item));
}

export function formatToman(n: number): string {
  return `${new Intl.NumberFormat("fa-IR").format(Math.max(0, Math.round(n)))} تومان`;
}

export function formatPlanDuration(item: PaymentsCatalogItem): string {
  if (item.duration_months && item.duration_months > 0) {
    return `${new Intl.NumberFormat("fa-IR").format(item.duration_months)} ماه`;
  }
  if (item.duration_days && item.duration_days > 0) {
    return `${new Intl.NumberFormat("fa-IR").format(item.duration_days)} روز`;
  }
  return "";
}

function pickPaymentUrl(data: Record<string, unknown> | null): string {
  if (!data) return "";
  if (typeof data.payment_url === "string") return data.payment_url;
  if (typeof data.url === "string") return data.url;
  const nested = asRecord(data.data);
  if (typeof nested?.payment_url === "string") return nested.payment_url;
  if (typeof nested?.url === "string") return nested.url;
  return "";
}

function errorFrom(status: number, data: Record<string, unknown> | null, fallback: string): PaymentsError {
  const message =
    (typeof data?.message === "string" && data.message) ||
    (typeof data?.error === "string" && data.error) ||
    fallback;
  const err: PaymentsError = { hasError: true, statusCode: status, message };
  notifyShopAccessIfExpired({ ...data, statusCode: status, message });
  return err;
}

async function paymentsFetch(
  method: "GET" | "POST" | "PUT",
  path: string,
  opts: { apiBase?: string; token: string; body?: unknown },
): Promise<Record<string, unknown> | PaymentsError> {
  const { apiBase = SHOP_PAYMENTS_API_BASE, token, body } = opts;
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(joinApi(apiBase, path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let json: unknown = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { message: text };
      }
    }
    const data = asRecord(json);
    if (!response.ok) {
      return errorFrom(response.status, data, `خطای ${response.status}`);
    }
    return data ?? {};
  } catch (error) {
    return {
      hasError: true,
      statusCode: 0,
      message: error instanceof Error ? error.message : "خطا در اتصال به سرور",
    };
  }
}

export function isPaymentsError(res: unknown): res is PaymentsError {
  return Boolean(res && typeof res === "object" && (res as PaymentsError).hasError);
}

export async function fetchPaymentsCatalog(opts: {
  apiBase?: string;
  token: string;
}): Promise<PaymentsCatalog | PaymentsError> {
  const res = await paymentsFetch("GET", "/payments/catalog", opts);
  if (isPaymentsError(res)) return res;
  return parsePaymentsCatalog(res);
}

export async function startZarinpalPayment(opts: {
  apiBase?: string;
  token: string;
  type: PaymentType;
  itemId: number;
  returnUrl?: string;
}): Promise<{ redirected: true } | PaymentsError> {
  const returnUrl =
    opts.returnUrl ||
    (typeof window !== "undefined" ? window.location.href.split("#")[0] : "");
  const res = await paymentsFetch("POST", "/payments/start", {
    apiBase: opts.apiBase,
    token: opts.token,
    body: {
      type: opts.type,
      item_id: opts.itemId,
      return_url: returnUrl,
    },
  });
  let payload: Record<string, unknown> | PaymentsError = res;
  if (isPaymentsError(payload) && opts.type === "sms_package") {
    const fallback = await paymentsFetch("POST", `/sms-packages/${opts.itemId}/purchase`, {
      apiBase: opts.apiBase,
      token: opts.token,
    });
    if (!isPaymentsError(fallback)) payload = fallback;
  }
  if (isPaymentsError(payload)) return payload;
  const url = pickPaymentUrl(payload);
  if (!url) {
    return { hasError: true, statusCode: 0, message: "آدرس درگاه دریافت نشد" };
  }
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
  return { redirected: true };
}

export async function fetchPaymentStatus(opts: {
  apiBase?: string;
  token: string;
  authority: string;
}): Promise<Record<string, unknown> | PaymentsError> {
  return paymentsFetch("GET", `/payments/${encodeURIComponent(opts.authority)}`, opts);
}

export function readPaymentReturn(): ZarinpalReturn | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  const payment = q.get("payment");
  if (!payment) return null;
  return {
    ok: payment === "ok" || payment === "success",
    payment,
    authority: q.get("Authority") || q.get("authority") || "",
    status: q.get("Status") || q.get("status") || "",
  };
}

export function consumePaymentReturn(): ZarinpalReturn | null {
  const result = readPaymentReturn();
  if (!result || typeof window === "undefined") return result;
  const url = new URL(window.location.href);
  ["payment", "Authority", "authority", "Status", "status"].forEach((key) => {
    url.searchParams.delete(key);
  });
  const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "") + url.hash;
  window.history.replaceState({}, "", next);
  return result;
}

export function applyShopAccessFromPayment(payload: unknown): void {
  if (typeof window === "undefined") return;
  const data = asRecord(payload);
  if (!data) return;
  const nested = asRecord(data.data) ?? data;
  try {
    const raw = localStorage.getItem("user");
    const user = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const merged = mergeUserWithShopAccess(user, nested);
    localStorage.setItem("user", JSON.stringify(merged));
    if (!isShopAccessExpiredInfo(getShopAccessFromUser(merged))) {
      clearShopAccessExpiredState();
    }
  } catch {
    /* ignore */
  }
}

export function webinoApiOrigin(): string {
  return API_ORIGIN;
}
