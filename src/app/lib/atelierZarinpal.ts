import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { apiBaseUrl } from "@/app/lib/apiBase";

export const OIL_PAYMENTS_API_BASE = "/api/oil";

export type PaymentsCatalogItem = {
  id: number;
  name: string;
  sms_count: number;
  price_toman: number;
  price_rial?: number;
  description?: string | null;
};

type PaymentsError = {
  hasError: true;
  message?: string;
  errorText?: string;
  statusCode?: number;
};

type PaymentsCatalogOk = {
  hasError?: false;
  sms_packages: PaymentsCatalogItem[];
};

function apiOrigin(): string {
  return apiBaseUrl();
}

export function formatToman(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(Math.round(n || 0));
}

export function isPaymentsError(value: unknown): value is PaymentsError {
  return Boolean(value && typeof value === "object" && (value as PaymentsError).hasError);
}

export function parseCatalogItem(raw: unknown): PaymentsCatalogItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    name: String(row.name ?? ""),
    sms_count: Number(row.sms_count ?? 0),
    price_toman: Number(row.price_toman ?? row.price ?? 0),
    price_rial: row.price_rial != null ? Number(row.price_rial) : undefined,
    description: row.description != null ? String(row.description) : null,
  };
}

export async function fetchPaymentsCatalog(opts: {
  token: string;
  apiBase?: string;
}): Promise<PaymentsCatalogOk | PaymentsError> {
  const base = (opts.apiBase || "/api").replace(/\/$/, "");
  const path =
    base === OIL_PAYMENTS_API_BASE || base.endsWith("/oil")
      ? "/api/oil/sms-packages"
      : "/api/sms-packages";

  try {
    const res = await FetchWithJwtClient("GET", path, opts.token);
    if (res?.hasError) {
      return {
        hasError: true,
        message: res.message || res.errorText || "خطا در دریافت بسته‌ها",
        errorText: res.errorText,
        statusCode: res.statusCode,
      };
    }
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.sms_packages)
          ? res.sms_packages
          : [];
    return {
      sms_packages: list
        .map(parseCatalogItem)
        .filter((item: PaymentsCatalogItem | null): item is PaymentsCatalogItem => Boolean(item)),
    };
  } catch (e) {
    return {
      hasError: true,
      message: e instanceof Error ? e.message : "خطا در دریافت بسته‌ها",
    };
  }
}

export async function startZarinpalPayment(opts: {
  token: string;
  type: string;
  itemId: number;
  returnUrl: string;
  apiBase?: string;
}): Promise<{ ok: true; url?: string } | PaymentsError> {
  const base = (opts.apiBase || "/api").replace(/\/$/, "");
  const path =
    base === OIL_PAYMENTS_API_BASE || base.endsWith("/oil")
      ? `/api/oil/sms-packages/${opts.itemId}/purchase`
      : `/api/sms-packages/${opts.itemId}/purchase`;

  try {
    const res = await FetchWithJwtClient(
      "POST",
      path,
      opts.token,
      {},
      {
        body: JSON.stringify({
          return_url: opts.returnUrl,
          type: opts.type,
        }),
      }
    );

    if (res?.hasError) {
      return {
        hasError: true,
        message: res.message || res.errorText || "خطا در اتصال به درگاه",
        errorText: res.errorText,
        statusCode: res.statusCode,
      };
    }

    const url =
      res?.payment_url ||
      res?.url ||
      res?.data?.payment_url ||
      res?.data?.url ||
      null;

    if (typeof url === "string" && url.startsWith("http") && typeof window !== "undefined") {
      window.location.href = url;
      return { ok: true, url };
    }

    // Desktop / offline: no gateway redirect — treat as soft failure with clear message
    return {
      hasError: true,
      message:
        "در نسخه دسکتاپ پرداخت آنلاین زرین‌پال در دسترس نیست. برای شارژ پیامک از پنل وب استفاده کنید یا وقتی آنلاین هستید از نسخه ابری.",
    };
  } catch (e) {
    return {
      hasError: true,
      message: e instanceof Error ? e.message : "خطا در اتصال به درگاه",
    };
  }
}

/** Read payment callback query/hash once, then strip from URL. */
export function consumePaymentReturn(): { ok: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const status =
      url.searchParams.get("payment") ||
      url.searchParams.get("Status") ||
      url.searchParams.get("status");
    if (!status) return null;

    const ok =
      status === "OK" ||
      status === "ok" ||
      status === "success" ||
      status === "1";

    url.searchParams.delete("payment");
    url.searchParams.delete("Status");
    url.searchParams.delete("status");
    url.searchParams.delete("Authority");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    return { ok };
  } catch {
    return null;
  }
}

void apiOrigin;
