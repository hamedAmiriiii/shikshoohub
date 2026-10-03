import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const ENDPOINT = "/api/shop-backup/google-sheet";

export type ShopGoogleSheetStatus = {
  configured: boolean;
  oauthEnabled: boolean;
  googleConnected: boolean;
  googleEmail: string | null;
  serviceAccountEnabled: boolean;
  serviceAccountEmail: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastExportAt: string | null;
  lastExportError: string | null;
  tables: ShopGoogleSheetTable[];
  selectedTables: string[];
};

export type ShopGoogleSheetTable = { name: string; label: string; group: string };

/** همان پیش‌فرض بک‌اند: خرید، مشتریان، اعتبارات، چک‌ها و نسیه‌ها */
export const DEFAULT_GOOGLE_SHEET_TABLES = [
  "purchases",
  "purchased_products",
  "user_shiksho",
  "customers",
  "user_credit_grants",
  "cheques",
  "purchase_debt_payments",
];

export type ShopGoogleSheetExportResult = {
  message: string;
  tables: number;
  rows: number;
  spreadsheetUrl: string | null;
};

type Result<T> = ({ ok: true; message?: string } & T) | { ok: false; message: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function parseStatus(res: any): ShopGoogleSheetStatus {
  const root = res?.data && typeof res.data === "object" ? res.data : res ?? {};
  return {
    configured: Boolean(root.configured),
    oauthEnabled: Boolean(root.oauth_enabled),
    googleConnected: Boolean(root.google_connected),
    googleEmail: str(root.google_email),
    serviceAccountEnabled: Boolean(root.service_account_enabled ?? root.configured),
    serviceAccountEmail: str(root.service_account_email),
    spreadsheetId: str(root.spreadsheet_id),
    spreadsheetUrl: str(root.spreadsheet_url),
    lastExportAt: str(root.last_export_at),
    lastExportError: str(root.last_export_error),
    tables: Array.isArray(root.tables)
      ? root.tables
          .filter((t: any) => t && typeof t.name === "string")
          .map((t: any) => ({ name: t.name, label: str(t.label) || t.name, group: str(t.group) || "سایر" }))
      : [],
    selectedTables: Array.isArray(root.selected_tables)
      ? root.selected_tables.filter((t: unknown): t is string => typeof t === "string")
      : [],
  };
}

export async function saveShopGoogleSheetTables(
  tables: string[],
): Promise<Result<{ status: ShopGoogleSheetStatus; message: string }>> {
  const token = tokenCode();
  if (!token) return { ok: false, message: "لطفاً وارد شوید" };
  const res = await FetchWithJwtClient("PUT", `${ENDPOINT}/tables`, token, {}, {
    body: JSON.stringify({ tables }),
  });
  if (!res || res.hasError) {
    return { ok: false, message: getApiErrorMessage(res, "ذخیرهٔ جداول ناموفق بود") };
  }
  return { ok: true, status: parseStatus(res), message: str(res.message) || "جداول ارسالی ذخیره شد" };
}

export async function fetchShopGoogleSheetStatus(): Promise<Result<{ status: ShopGoogleSheetStatus }>> {
  const token = tokenCode();
  if (!token) return { ok: false, message: "لطفاً وارد شوید" };
  const res = await FetchWithJwtClient("GET", ENDPOINT, token);
  if (!res || res.hasError) {
    return { ok: false, message: getApiErrorMessage(res, "خطا در دریافت وضعیت گوگل شیت") };
  }
  return { ok: true, status: parseStatus(res) };
}

/** آدرس صفحهٔ ورود گوگل؛ بعد از ورود، گوگل به returnUrl برمی‌گرداند. */
export async function fetchShopGoogleOAuthUrl(returnUrl: string): Promise<Result<{ url: string }>> {
  const token = tokenCode();
  if (!token) return { ok: false, message: "لطفاً وارد شوید" };
  const res = await FetchWithJwtClient("POST", `${ENDPOINT}/oauth-url`, token, {}, {
    body: JSON.stringify({ return_url: returnUrl }),
  });
  const url = str(res?.url ?? res?.data?.url);
  if (!res || res.hasError || !url) {
    return { ok: false, message: getApiErrorMessage(res, "ورود با گوگل ممکن نشد") };
  }
  return { ok: true, url };
}

export async function connectShopGoogleSheet(
  spreadsheet: string,
): Promise<Result<{ status: ShopGoogleSheetStatus; message: string }>> {
  const token = tokenCode();
  if (!token) return { ok: false, message: "لطفاً وارد شوید" };
  const res = await FetchWithJwtClient("PUT", ENDPOINT, token, {}, {
    body: JSON.stringify({ spreadsheet }),
  });
  if (!res || res.hasError) {
    return { ok: false, message: getApiErrorMessage(res, "اتصال گوگل شیت ناموفق بود") };
  }
  return { ok: true, status: parseStatus(res), message: str(res.message) || "گوگل شیت متصل شد" };
}

export async function disconnectShopGoogleSheet(): Promise<Result<{ status: ShopGoogleSheetStatus }>> {
  const token = tokenCode();
  if (!token) return { ok: false, message: "لطفاً وارد شوید" };
  const res = await FetchWithJwtClient("DELETE", ENDPOINT, token);
  if (!res || res.hasError) {
    return { ok: false, message: getApiErrorMessage(res, "حذف اتصال گوگل شیت ناموفق بود") };
  }
  return { ok: true, status: parseStatus(res) };
}

export async function exportShopToGoogleSheet(): Promise<Result<{ result: ShopGoogleSheetExportResult }>> {
  const token = tokenCode();
  if (!token) return { ok: false, message: "لطفاً وارد شوید" };
  const res = await FetchWithJwtClient("POST", `${ENDPOINT}/export`, token, {}, { body: "{}" });
  if (!res || res.hasError) {
    return { ok: false, message: getApiErrorMessage(res, "ارسال به گوگل شیت ناموفق بود") };
  }
  return {
    ok: true,
    result: {
      message: str(res.message) || "داده‌ها به گوگل شیت ارسال شد",
      tables: Number(res.tables) || 0,
      rows: Number(res.rows) || 0,
      spreadsheetUrl: str(res.spreadsheet_url),
    },
  };
}
