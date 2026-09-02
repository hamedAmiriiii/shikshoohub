import { clearOilSession, getOilToken } from "./auth";
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
  OilSession,
  OilSmsPackage,
  OilSmsPackageOrder,
  OilSmsQuota,
  OilVisit,
  OilVisitItem,
} from "./types";
import { OIL_PRODUCT_KINDS } from "./types";

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

export async function oilCreateVisit(body: {
  serial?: string;
  letter?: string;
  middle?: string;
  province?: string;
  plate?: string;
  phone: string;
  km: number;
  next_km?: number;
  notes?: string;
  oil_product_id?: number;
  air_filter_product_id?: number;
  oil_filter_product_id?: number;
}) {
  return oilFetch<{
    message: string;
    visit: OilVisit;
    sms_sent: boolean;
    sms_error: string | null;
  }>("POST", "/api/oil/visits", { body });
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

export function oilListProducts(includeInactive = false) {
  return oilFetch<OilProductCatalogResponse>("GET", "/api/oil/products", {
    auth: true,
    params: includeInactive ? { include_inactive: 1 } : undefined,
  });
}

export function oilCreateProduct(body: { kind: OilProductKind; name: string }) {
  return oilFetch<{ data?: OilProduct; product?: OilProduct; message?: string }>(
    "POST",
    "/api/oil/products",
    { auth: true, body: { kind: body.kind, name: body.name.trim() } },
  );
}

export function oilPatchProduct(
  id: number,
  body: { name?: string; is_active?: boolean },
) {
  const payload: { name?: string; is_active?: boolean } = {};
  if (body.name !== undefined) payload.name = body.name.trim();
  if (body.is_active !== undefined) payload.is_active = body.is_active;
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

export function normalizeOilProductCatalog(
  res: OilProductCatalogResponse | null | undefined,
): OilProductKindGroup[] {
  const kinds = res?.kinds;
  const flat = Array.isArray(res?.data) ? res.data : [];
  return OIL_PRODUCT_KINDS.map((def) => {
    const found = kinds?.find((k) => k.kind === def.kind);
    const products = found
      ? found.products || []
      : flat.filter((p) => p.kind === def.kind);
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
    .filter((p) => p.is_active)
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
}

export function oilVisitItemProductId(item: OilVisitItem): number | "" {
  const rec = item as OilVisitItem & {
    air_filter_product_id?: number;
    oil_filter_product_id?: number;
    product_id?: number;
  };
  const id =
    rec.oil_product_id ??
    rec.air_filter_product_id ??
    rec.oil_filter_product_id ??
    rec.product_id ??
    rec.id;
  return typeof id === "number" && Number.isFinite(id) ? id : "";
}

export function idsFromOilVisitItems(items?: OilVisitItem[] | null) {
  const next = {
    oil_product_id: "" as number | "",
    air_filter_product_id: "" as number | "",
    oil_filter_product_id: "" as number | "",
  };
  for (const item of items || []) {
    const id = oilVisitItemProductId(item);
    if (id === "") continue;
    if (item.kind === "oil") next.oil_product_id = id;
    if (item.kind === "air_filter") next.air_filter_product_id = id;
    if (item.kind === "oil_filter") next.oil_filter_product_id = id;
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
        OIL_PRODUCT_KINDS.find((k) => k.kind === item.kind)?.kind_label ||
        item.kind ||
        "قلم";
      return `${label}: ${item.name}`;
    });
}

export function oilVisitSummary(visit: Pick<OilVisit, "items" | "notes">) {
  return formatOilVisitItems(visit.items) || visit.notes?.trim() || "";
}
