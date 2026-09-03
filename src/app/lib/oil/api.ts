import { clearOilSession, getOilSession, getOilToken, saveOilSession } from "./auth";
import type {
  OilApiError,
  OilCustomerListResponse,
  OilLookupResponse,
  OilPublicHistoryResponse,
  OilPlateParts,
  OilProduct,
  OilProductCatalogResponse,
  OilProductKind,
  OilProductKindGroup,
  OilReminderListResponse,
  OilReminderRun,
  OilReportsResponse,
  OilReportPeriod,
  OilSession,
  OilSmsPackage,
  OilSmsPackageOrder,
  OilSmsQuota,
  OilVisit,
  OilVisitItem,
  OilPublicVisitItem,
} from "./types";
import { OIL_PRODUCT_KINDS } from "./types";
import {
  enqueueOilVisit,
  freezeOilVisitBody,
  isOilDuplicateVisit,
  isOilNetworkError,
  isOilVisitCreated,
  peekOilCatalogCache,
  readOilCatalogCache,
  readOilReportsCache,
  saveOilCatalogCache,
  saveOilReportsCache,
  type OilVisitQueueBody,
} from "./offline";

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir"
).replace(/\/$/, "");

export function isOilApiError(res: unknown): res is OilApiError {
  return Boolean(res && typeof res === "object" && (res as OilApiError).hasError);
}

function parseError(status: number, text: string): OilApiError {
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    return {
      hasError: true,
      statusCode: status,
      message: typeof j.message === "string" ? j.message : `خطای ${status}`,
      retry_after_seconds:
        typeof j.retry_after_seconds === "number"
          ? j.retry_after_seconds
          : undefined,
      already_exists: j.already_exists === true,
      code: typeof j.code === "string" ? j.code : undefined,
    };
  } catch {
    return {
      hasError: true,
      statusCode: status,
      message: text || `خطای ${status}`,
    };
  }
}

type OilFetchOptions = {
  auth?: boolean;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  redirectOn401?: boolean;
};

async function oilFetch<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: OilFetchOptions = {},
): Promise<T | OilApiError> {
  const { auth = true, body, params, redirectOn401 = true } = options;
  const url = new URL(path.startsWith("http") ? path : `${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getOilToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    let json: unknown = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { message: text };
      }
    }

    if (!response.ok) {
      if (response.status === 401 && auth && redirectOn401) {
        clearOilSession();
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/oil/login")
        ) {
          const next = encodeURIComponent(
            window.location.pathname + window.location.search,
          );
          window.location.replace(`/oil/login?next=${next}`);
        }
      }
      return parseError(response.status, text);
    }

    return json as T;
  } catch {
    return {
      hasError: true,
      statusCode: 0,
      message: "خطا در اتصال به سرور",
    };
  }
}

export async function oilSendRegisterCode(phone: string) {
  return oilFetch<{ message?: string }>(
    "POST",
    "/api/oil/register/send-code",
    { auth: false, body: { phone } },
  );
}

export async function oilRegister(body: {
  name: string;
  last_name: string;
  phone: string;
  password: string;
  shop_name: string;
  address?: string;
  verification_code: string;
  oil_interval_km?: number;
}) {
  return oilFetch<OilSession>("POST", "/api/oil/register", {
    auth: false,
    body,
  });
}

export async function oilLogin(username: string, password: string) {
  return oilFetch<OilSession>("POST", "/api/oil/login", {
    auth: false,
    body: { username, password },
  });
}

export async function oilLogout() {
  return oilFetch<{ message?: string }>("POST", "/api/oil/logout");
}

export async function oilMe() {
  return oilFetch<OilSession>("GET", "/api/oil/me", { redirectOn401: false });
}

export async function oilPatchShop(body: {
  shop_name?: string;
  oil_interval_km?: number;
}) {
  return oilFetch<OilSession>("PATCH", "/api/oil/shop", { body });
}

export async function oilListCustomers(q?: string, page = 1, perPage = 30) {
  return oilFetch<OilCustomerListResponse>("GET", "/api/oil/customers", {
    params: { q, page, per_page: perPage },
  });
}

export async function oilGetCustomer(plate: string) {
  return oilFetch<{ customer: OilVisit; visits: OilVisit[] }>(
    "GET",
    `/api/oil/customers/${encodeURIComponent(plate)}`,
  );
}

export async function oilLookup(query: { plate?: string; phone?: string }) {
  return oilFetch<OilLookupResponse>("GET", "/api/oil/visits/lookup", {
    params: query,
  });
}

export function oilPublicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_OIL_PUBLIC_BASE_URL ||
    process.env.OIL_PUBLIC_BASE_URL ||
    "https://webinoo-plus.ir"
  ).replace(/\/$/, "");
}

export function oilPublicHistoryUrl(phone: string) {
  return `${oilPublicBaseUrl()}/oilservice/${phone}`;
}

export function oilPublicHistory(phone: string) {
  return oilFetch<OilPublicHistoryResponse>(
    "GET",
    `/api/oil/public/history/${encodeURIComponent(phone)}`,
    { auth: false, redirectOn401: false },
  );
}

export function normalizeOilPublicHistory(
  res: OilPublicHistoryResponse,
  phone: string,
) {
  return {
    phone: res.phone || phone,
    cars: Array.isArray(res.cars) ? res.cars : [],
  };
}

export async function oilRefreshAuth() {
  const current = getOilToken();
  if (!current) return false;

  const refreshed = await oilFetch<OilSession & { token?: string }>(
    "POST",
    "/api/oil/refresh",
    { auth: true, redirectOn401: false },
  );
  if (!isOilApiError(refreshed)) {
    const token = refreshed.token;
    if (token && refreshed.user) {
      saveOilSession(refreshed, token);
      return true;
    }
    if (token) {
      const prev = getOilSession();
      if (prev) {
        saveOilSession(prev, token);
        return true;
      }
    }
    if (refreshed.user) {
      saveOilSession(refreshed, current);
      return true;
    }
  }

  const me = await oilMe();
  if (isOilApiError(me)) return false;
  saveOilSession(me, current);
  return true;
}

export type OilVisitPostResult = {
  statusCode: number;
  already_exists?: boolean;
  code?: string;
  message?: string;
  visit?: OilVisit;
  sms_sent?: boolean;
  sms_error?: string | null;
  hasError?: true;
};

export async function oilPostVisit(
  body: OilVisitQueueBody,
  options: { redirectOn401?: boolean } = {},
): Promise<OilVisitPostResult> {
  const { redirectOn401 = false } = options;
  const url = `${BASE_URL}/api/oil/visits`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const token = getOilToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let json: Record<string, unknown> = {};
    if (text) {
      try {
        json = JSON.parse(text) as Record<string, unknown>;
      } catch {
        json = { message: text };
      }
    }
    const nested =
      json.data && typeof json.data === "object"
        ? (json.data as Record<string, unknown>)
        : json;

    if (response.status === 401) {
      if (redirectOn401) {
        clearOilSession();
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/oil/login")
        ) {
          const next = encodeURIComponent(
            window.location.pathname + window.location.search,
          );
          window.location.replace(`/oil/login?next=${next}`);
        }
      }
      return {
        hasError: true,
        statusCode: 401,
        message: typeof json.message === "string" ? json.message : "ورود منقضی شده",
      };
    }

    if (!response.ok && response.status !== 200 && response.status !== 201) {
      return {
        hasError: true,
        statusCode: response.status,
        message: typeof json.message === "string" ? json.message : `خطای ${response.status}`,
        already_exists: nested.already_exists === true,
        code: typeof nested.code === "string" ? nested.code : undefined,
      };
    }

    return {
      statusCode: response.status,
      already_exists: nested.already_exists === true,
      code: typeof nested.code === "string" ? nested.code : undefined,
      message: typeof nested.message === "string" ? nested.message : undefined,
      visit: (nested.visit as OilVisit | undefined) || (json.visit as OilVisit | undefined),
      sms_sent: Boolean(nested.sms_sent ?? json.sms_sent),
      sms_error: (nested.sms_error ?? json.sms_error) as string | null | undefined,
    };
  } catch {
    return {
      hasError: true,
      statusCode: 0,
      message: "خطا در اتصال به سرور",
    };
  }
}

export async function oilCreateVisit(
  body: Omit<OilVisitQueueBody, "client_id" | "occurred_at"> & {
    client_id?: string;
    occurred_at?: string;
  },
) {
  return oilPostVisit(freezeOilVisitBody(body));
}

export type OilSubmitVisitResult =
  | { queued: true; client_id: string }
  | { queued: false; duplicate: boolean; res: OilVisitPostResult };

export async function oilSubmitVisit(
  body: Omit<OilVisitQueueBody, "client_id" | "occurred_at"> & {
    client_id?: string;
    occurred_at?: string;
  },
): Promise<OilSubmitVisitResult> {
  const payload = freezeOilVisitBody(body);
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (offline) {
    enqueueOilVisit(payload);
    return { queued: true, client_id: payload.client_id };
  }

  let res = await oilPostVisit(payload);
  if (res.statusCode === 401) {
    const ok = await oilRefreshAuth();
    if (ok) res = await oilPostVisit(payload);
  }

  if (isOilVisitCreated(res) || isOilDuplicateVisit(res)) {
    return { queued: false, duplicate: isOilDuplicateVisit(res), res };
  }
  if (res.statusCode === 401) {
    enqueueOilVisit(payload);
    return { queued: true, client_id: payload.client_id };
  }
  if (res.hasError && isOilNetworkError(res)) {
    enqueueOilVisit(payload);
    return { queued: true, client_id: payload.client_id };
  }
  return { queued: false, duplicate: false, res };
}

export async function oilReadCachedReports() {
  return readOilReportsCache();
}

export async function oilGetReports() {
  const res = await oilFetch<OilReportsResponse>("GET", "/api/oil/reports", { auth: true });
  if (!isOilApiError(res)) {
    await saveOilReportsCache(res);
    return res;
  }
  if (isOilNetworkError(res) || (typeof navigator !== "undefined" && navigator.onLine === false)) {
    const cached = await readOilReportsCache();
    if (cached) return cached;
  }
  return res;
}

function asReportPeriod(value: unknown): OilReportPeriod {
  const src = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const n = (v: unknown) => {
    const num = Number(v);
    return Number.isFinite(num) ? num : 0;
  };
  return {
    sales: n(src.sales),
    cost: n(src.cost),
    profit: n(src.profit),
  };
}

export function normalizeOilReports(res: OilReportsResponse | null | undefined) {
  const src =
    res?.data && (res.data.today || res.data.week || res.data.month) ? res.data : res;
  return {
    today: asReportPeriod(src?.today),
    week: asReportPeriod(src?.week),
    month: asReportPeriod(src?.month),
  };
}

export async function oilRunReminders() {
  return oilFetch<OilReminderRun>("POST", "/api/oil/reminders/run");
}

export async function oilListReminders(q?: string, page = 1, perPage = 30) {
  return oilFetch<OilReminderListResponse>("GET", "/api/oil/reminders", {
    params: { q, page, per_page: perPage },
  });
}

export async function oilGetSmsQuota() {
  return oilFetch<OilSmsQuota>("GET", "/api/oil/sms-quota");
}

export async function oilListSmsPackages() {
  return oilFetch<{ data: OilSmsPackage[]; chars_per_sms: number }>(
    "GET",
    "/api/oil/sms-packages",
  );
}

export async function oilListSmsPackageOrders(
  page = 1,
  perPage = 30,
  status?: string,
) {
  return oilFetch<{
    data: OilSmsPackageOrder[];
    current_page: number;
    last_page: number;
  }>("GET", "/api/oil/sms-package-orders", {
    params: { page, per_page: perPage, status },
  });
}

export async function oilPurchaseSmsPackage(packageId: number) {
  return oilFetch<{ message: string; order: OilSmsPackageOrder }>(
    "POST",
    `/api/oil/sms-packages/${packageId}/purchase`,
  );
}

export function suggestedNextKm(
  km: number,
  interval: number | null | undefined,
): number {
  const step = Number(interval);
  const safe = Number.isFinite(step) && step > 0 ? step : 5000;
  return km + safe;
}

export function partsPayload(parts: OilPlateParts) {
  return {
    serial: parts.serial,
    letter: parts.letter,
    middle: parts.middle,
    province: parts.province,
  };
}

export async function oilListProducts(includeInactive = false) {
  const res = await oilFetch<OilProductCatalogResponse>("GET", "/api/oil/products", {
    auth: true,
    params: includeInactive ? { include_inactive: 1 } : undefined,
  });
  if (!isOilApiError(res)) {
    await saveOilCatalogCache(res, includeInactive);
    return res;
  }
  const cached = await readOilCatalogCache(includeInactive);
  if (cached) return cached;
  return res;
}

export function oilPeekCachedCatalog(includeInactive = false) {
  return peekOilCatalogCache(includeInactive);
}

export async function oilReadCachedCatalog(includeInactive = false) {
  return readOilCatalogCache(includeInactive);
}

export function oilCreateProduct(body: {
  kind: OilProductKind;
  name: string;
  purchase_price?: number;
  sale_price?: number;
}) {
  const payload: {
    kind: OilProductKind;
    name: string;
    purchase_price?: number;
    sale_price?: number;
  } = { kind: body.kind, name: body.name.trim() };
  payload.purchase_price = body.purchase_price ?? 0;
  payload.sale_price = body.sale_price ?? 0;
  return oilFetch<{ data?: OilProduct; product?: OilProduct; message?: string }>(
    "POST",
    "/api/oil/products",
    { auth: true, body: payload },
  );
}

export function oilPatchProduct(
  id: number,
  body: {
    name?: string;
    is_active?: boolean;
    purchase_price?: number;
    sale_price?: number;
  },
) {
  const payload: {
    name?: string;
    is_active?: boolean;
    purchase_price?: number;
    sale_price?: number;
  } = {};
  if (body.name !== undefined) payload.name = body.name.trim();
  if (body.is_active !== undefined) payload.is_active = body.is_active;
  if (body.purchase_price !== undefined) payload.purchase_price = body.purchase_price;
  if (body.sale_price !== undefined) payload.sale_price = body.sale_price;
  return oilFetch<{ data?: OilProduct; message?: string }>(
    "PATCH",
    `/api/oil/products/${id}`,
    { auth: true, body: payload },
  );
}

export function oilDeleteProduct(id: number) {
  return oilFetch<{ message?: string; data?: OilProduct }>(
    "DELETE",
    `/api/oil/products/${id}`,
    { auth: true },
  );
}

export function canonicalOilProductKind(kind: string | undefined | null): OilProductKind | null {
  if (!kind) return null;
  if (kind === "gear_oil" || kind === "gearbox_oil") return "gearbox_oil";
  if (OIL_PRODUCT_KINDS.some((item) => item.kind === kind)) return kind as OilProductKind;
  return null;
}

export function normalizeOilProductCatalog(
  res: OilProductCatalogResponse | null | undefined,
): OilProductKindGroup[] {
  const kinds = res?.kinds;
  const flat = Array.isArray(res?.data) ? res.data : [];
  return OIL_PRODUCT_KINDS.map((def) => {
    const found = kinds?.find((k) => canonicalOilProductKind(k.kind) === def.kind);
    const raw = found
      ? found.products || []
      : flat.filter((p) => canonicalOilProductKind(p.kind) === def.kind);
    const products = raw.map((product) => ({
      ...product,
      kind: canonicalOilProductKind(product.kind) || def.kind,
    }));
    return {
      kind: def.kind,
      kind_label: found?.kind_label || def.kind_label,
      products: [...products].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id,
      ),
    };
  });
}

export function activeOilProducts(
  groups: OilProductKindGroup[],
  kind: OilProductKind,
): OilProduct[] {
  const group = groups.find((g) => g.kind === kind);
  return (group?.products || [])
    .filter((p) => p.is_active !== false)
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
}

export function oilVisitItemProductId(item: OilVisitItem): number | "" {
  const rec = item as OilVisitItem & {
    air_filter_product_id?: number;
    oil_filter_product_id?: number;
    gearbox_oil_product_id?: number;
    gear_oil_product_id?: number;
    product_id?: number;
  };
  const id =
    rec.oil_product_id ??
    rec.air_filter_product_id ??
    rec.oil_filter_product_id ??
    rec.gearbox_oil_product_id ??
    rec.gear_oil_product_id ??
    rec.product_id ??
    rec.id;
  return typeof id === "number" && Number.isFinite(id) ? id : "";
}

export function idsFromOilVisitItems(items?: OilVisitItem[] | null) {
  const next = {
    oil_product_id: "" as number | "",
    air_filter_product_id: "" as number | "",
    oil_filter_product_id: "" as number | "",
    gearbox_oil_product_id: "" as number | "",
  };
  for (const item of items || []) {
    const id = oilVisitItemProductId(item);
    if (id === "") continue;
    const kind = canonicalOilProductKind(item.kind);
    if (kind === "oil") next.oil_product_id = id;
    if (kind === "gearbox_oil") next.gearbox_oil_product_id = id;
    if (kind === "air_filter") next.air_filter_product_id = id;
    if (kind === "oil_filter") next.oil_filter_product_id = id;
  }
  return next;
}

export function formatOilVisitItems(
  items?: Array<Pick<OilVisitItem, "name"> & { kind?: string; kind_label?: string }> | null,
) {
  return oilVisitItemLines(items).join(" — ");
}

export function oilVisitItemLines(
  items?: Array<{ name?: string; kind?: string; kind_label?: string }> | OilPublicVisitItem[] | null,
) {
  if (!items?.length) return [];
  return items
    .filter((item) => item.name)
    .map((item) => {
        const label =
        item.kind_label ||
        OIL_PRODUCT_KINDS.find((k) => k.kind === canonicalOilProductKind(item.kind))?.kind_label ||
        item.kind ||
        "قلم";
      return `${label}: ${item.name}`;
    });
}

export function oilVisitSummary(visit: Pick<OilVisit, "items" | "notes">) {
  return formatOilVisitItems(visit.items) || visit.notes?.trim() || "";
}
