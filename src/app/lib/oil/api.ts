import { clearOilSession, getOilToken } from "./auth";
import type {
  OilApiError,
  OilCustomerListResponse,
  OilLookupResponse,
  OilPlateParts,
  OilReminderListResponse,
  OilReminderRun,
  OilSession,
  OilSmsPackage,
  OilSmsPackageOrder,
  OilSmsQuota,
  OilVisit,
} from "./types";

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
  method: "GET" | "POST" | "PATCH",
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

export async function oilCreateVisit(body: {
  serial?: string;
  letter?: string;
  middle?: string;
  province?: string;
  plate?: string;
  phone: string;
  km: number;
  next_km?: number;
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
