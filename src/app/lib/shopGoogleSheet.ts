import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const ENDPOINT = "/api/shop-backup/google-sheet";

export type ShopGoogleSheetStatus = {
  configured: boolean;
  serviceAccountEmail: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastExportAt: string | null;
  lastExportError: string | null;
};

export type ShopGoogleSheetExportResult = {
  message: string;
  tables: number;
  rows: number;
  spreadsheetUrl: string | null;
};

type Result<T> = ({ ok: true } & T) | { ok: false; message: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function parseStatus(res: any): ShopGoogleSheetStatus {
  const root = res?.data && typeof res.data === "object" ? res.data : res ?? {};
  return {
    configured: Boolean(root.configured),
    serviceAccountEmail: str(root.service_account_email),
    spreadsheetId: str(root.spreadsheet_id),
    spreadsheetUrl: str(root.spreadsheet_url),
    lastExportAt: str(root.last_export_at),
    lastExportError: str(root.last_export_error),
  };
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
