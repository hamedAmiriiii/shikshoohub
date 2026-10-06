import tokenCode from "@/app/coponent/tokenCode";

export const MARKETING_API_BASE = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir"
).replace(/\/$/, "");

const MARKETER_TOKEN_KEY = "marketer_token";
const REF_STORAGE_KEY = "wb_marketer_ref";
const VISITOR_ID_KEY = "wb_visitor_id";
const REF_COOKIE = "wb_mref";
const DEFAULT_ATTRIBUTION_DAYS = 60;
const CLAIM_RETRY_MS = 2 * 60 * 1000;

export type MarketerProfile = {
  id: number;
  name: string | null;
  phone: string;
  code: string;
  referral_link: string;
  commission_percent: number;
  card_number: string | null;
  sheba: string | null;
  is_active: boolean;
  created_at: string | null;
  custom_commission_percent?: number | null;
  admin_note?: string | null;
  last_login_at?: string | null;
};

export type MarketerSummary = {
  visitors_count: number;
  registered_count: number;
  paid_shops_count: number;
  purchases_count: number;
  total_sales_toman: number;
  total_commission_toman: number;
  total_paid_toman: number;
  balance_toman: number;
};

export type MarketerPurchase = {
  id: number;
  purchased_at: string | null;
  description: string | null;
  purchase_amount_toman: number;
  percent: number;
  commission_toman: number;
};

export type MarketerReferralRow = {
  id: number;
  registered_at: string | null;
  first_visit_at: string | null;
  shop_name: string | null;
  shop_code: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  is_paid: boolean;
  purchases_count: number;
  total_sales_toman: number;
  total_commission_toman: number;
  last_purchase_at: string | null;
  purchases: MarketerPurchase[];
};

export type MarketerPayoutRow = {
  id: number;
  amount_toman: number;
  note: string | null;
  paid_at: string | null;
};

export type MarketerDashboard = {
  marketer: MarketerProfile;
  summary: MarketerSummary;
  referrals: MarketerReferralRow[];
  payouts: MarketerPayoutRow[];
  attribution_days?: number;
};

export type AdminMarketerRow = MarketerProfile & MarketerSummary;

export type MarketingSettings = {
  default_commission_percent: number;
  attribution_days: number;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

type StoredRef = {
  code: string;
  visitor_id: string;
  at: number;
  days: number;
  last_claim_at?: number;
};

export function toFaNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
}

export function formatToman(value: number | null | undefined): string {
  return `${toFaNumber(value)} تومان`;
}

export function formatFaDate(value: string | null | undefined, withTime = false): string {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  headers: Record<string, string>,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${MARKETING_API_BASE}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      const message =
        typeof json?.message === "string" && json.message ? json.message : `خطای ${res.status}`;
      return { ok: false, status: res.status, message };
    }
    return { ok: true, data: (json ?? {}) as T };
  } catch {
    return { ok: false, status: 0, message: "خطا در اتصال به سرور. اینترنت را بررسی کنید." };
  }
}

/* ---------- پنل بازاریاب ---------- */

export function getMarketerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(MARKETER_TOKEN_KEY);
}

export function setMarketerToken(token: string | null) {
  if (token) localStorage.setItem(MARKETER_TOKEN_KEY, token);
  else localStorage.removeItem(MARKETER_TOKEN_KEY);
}

function marketerHeaders(): Record<string, string> {
  const token = getMarketerToken();
  return token ? { "X-Marketer-Token": token } : {};
}

export const marketerApi = {
  sendCode: (phone: string) =>
    request<{ message: string; resend_after_seconds?: number }>("POST", "/api/marketing/auth/send-code", {}, { phone }),
  verify: (phone: string, code: string) =>
    request<{ token: string; marketer: MarketerProfile }>("POST", "/api/marketing/auth/verify", {}, { phone, code }),
  dashboard: () => request<MarketerDashboard>("GET", "/api/marketing/panel/dashboard", marketerHeaders()),
  updateProfile: (body: { name?: string; card_number?: string; sheba?: string }) =>
    request<{ marketer: MarketerProfile }>("PUT", "/api/marketing/panel/profile", marketerHeaders(), body),
  logout: () => request<{ message: string }>("POST", "/api/marketing/panel/logout", marketerHeaders()),
};

/* ---------- ادمین ---------- */

function adminHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? tokenCode() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const marketingAdminApi = {
  list: () =>
    request<{ data: AdminMarketerRow[]; totals: Record<string, number>; settings: MarketingSettings }>(
      "GET",
      "/api/admin/marketers",
      adminHeaders(),
    ),
  show: (id: number) => request<MarketerDashboard>("GET", `/api/admin/marketers/${id}`, adminHeaders()),
  create: (body: Record<string, unknown>) =>
    request<{ data: MarketerProfile }>("POST", "/api/admin/marketers", adminHeaders(), body),
  update: (id: number, body: Record<string, unknown>) =>
    request<{ data: MarketerProfile }>("PUT", `/api/admin/marketers/${id}`, adminHeaders(), body),
  saveSettings: (body: MarketingSettings) =>
    request<{ data: MarketingSettings }>("PUT", "/api/admin/marketers/settings", adminHeaders(), body),
  payout: (id: number, body: { amount_toman: number; note?: string }) =>
    request<{ summary: MarketerSummary }>("POST", `/api/admin/marketers/${id}/payouts`, adminHeaders(), body),
  deletePayout: (id: number, payoutId: number) =>
    request<{ summary: MarketerSummary }>("DELETE", `/api/admin/marketers/${id}/payouts/${payoutId}`, adminHeaders()),
};

/* ---------- ردیابی لینک بازاریاب ---------- */

function readStoredRef(): StoredRef | null {
  try {
    const raw = localStorage.getItem(REF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRef;
    if (!parsed?.code || !parsed.visitor_id || !parsed.at) return null;
    const days = parsed.days > 0 ? parsed.days : DEFAULT_ATTRIBUTION_DAYS;
    if (Date.now() - parsed.at > days * 86400000) {
      localStorage.removeItem(REF_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredRef(ref: StoredRef | null) {
  if (!ref) {
    localStorage.removeItem(REF_STORAGE_KEY);
    document.cookie = `${REF_COOKIE}=; path=/; max-age=0; samesite=lax`;
    return;
  }
  localStorage.setItem(REF_STORAGE_KEY, JSON.stringify(ref));
  document.cookie = `${REF_COOKIE}=${encodeURIComponent(ref.code)}; path=/; max-age=${ref.days * 86400}; samesite=lax`;
}

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

/**
 * اگر آدرس صفحه ?mref=CODE داشته باشد، معرف را ذخیره می‌کند.
 * اولین معرف تا پایان مهلت انتساب حفظ می‌شود (لینک بعدی جایگزینش نمی‌شود).
 */
export async function captureMarketerRef(): Promise<void> {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const code = (params.get("mref") || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{4,16}$/.test(code)) return;

  const visitorId = getVisitorId();
  const existing = readStoredRef();

  const res = await request<{ valid: boolean; attribution_days?: number }>(
    "POST",
    "/api/marketing/visit",
    {},
    { code, visitor_id: visitorId, path: window.location.pathname },
  );
  if (!res.ok || !res.data.valid) return;

  if (!existing) {
    writeStoredRef({
      code,
      visitor_id: visitorId,
      at: Date.now(),
      days: res.data.attribution_days || DEFAULT_ATTRIBUTION_DAYS,
    });
  }
}

/**
 * وقتی کاربرِ آمده با لینک بازاریاب، ثبت‌نام فروشگاه را تمام کرد و لاگین شد،
 * فروشگاهش را به نام بازاریاب ثبت می‌کند.
 */
export async function tryClaimMarketerRef(): Promise<void> {
  if (typeof window === "undefined") return;
  const ref = readStoredRef();
  if (!ref) return;
  const token = tokenCode();
  if (!token) return;
  if (ref.last_claim_at && Date.now() - ref.last_claim_at < CLAIM_RETRY_MS) return;

  writeStoredRef({ ...ref, last_claim_at: Date.now() });

  const res = await request<{ ok: boolean; final: boolean; message: string }>(
    "POST",
    "/api/marketing/claim",
    { Authorization: `Bearer ${token}` },
    { code: ref.code, visitor_id: ref.visitor_id },
  );
  if (res.ok && res.data.final) {
    writeStoredRef(null);
  }
}
