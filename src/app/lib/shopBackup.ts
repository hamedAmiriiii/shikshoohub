import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir").replace(/\/$/, "");
export const SHOP_BACKUP_MAX_BYTES = 200 * 1024 * 1024;
export const SHOP_BACKUP_CONFIRM = "RESTORE";

export type ShopBackupSummary = {
  tables: { key: string; count: number }[];
  filesCount: number;
  extra?: Record<string, string>;
};

const TABLE_LABELS: Record<string, string> = {
  products: "کالاها",
  categories: "دسته‌ها",
  invoices: "فاکتورها",
  invoice_items: "ردیف فاکتور",
  customers: "مشتریان",
  expenses: "هزینه‌ها",
  orders: "سفارش‌ها",
  purchases: "فروش‌ها",
  cheques: "چک‌ها",
  employees: "پرسنل",
  raw_materials: "مواد اولیه",
  produced_goods: "کالاهای تولیدی",
  shop_tables: "میزها",
  table_orders: "سفارش پای میز",
  installments: "اقساط",
  credits: "اعتبار",
  files: "فایل‌ها",
};

export function backupTableLabel(key: string): string {
  return TABLE_LABELS[key] || key.replace(/_/g, " ");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function parseShopBackupSummary(res: any): ShopBackupSummary {
  const root = asRecord(res?.data) ?? asRecord(res) ?? {};
  const tableSource =
    asRecord(root.tables) ??
    asRecord(root.table_counts) ??
    asRecord(root.counts) ??
    asRecord(root.rows) ??
    null;

  const tables: { key: string; count: number }[] = tableSource
    ? Object.entries(tableSource)
        .filter(([, value]) => typeof value === "number" || typeof value === "string")
        .map(([key, value]) => ({ key, count: toCount(value) }))
    : Array.isArray(root.tables)
      ? (root.tables as any[])
          .map((row) => ({
            key: String(row?.table ?? row?.name ?? row?.key ?? ""),
            count: toCount(row?.count ?? row?.rows ?? row?.total),
          }))
          .filter((row) => row.key)
      : [];

  const filesCount = toCount(
    root.files_count ?? root.file_count ?? root.files ?? root.images_count ?? root.images,
  );

  const extra: Record<string, string> = {};
  for (const key of ["shop_name", "shop_code", "generated_at", "created_at", "version"] as const) {
    const value = root[key];
    if (value != null && value !== "") extra[key] = String(value);
  }

  if (tables.length === 0) {
    const skip = new Set([
      "files_count",
      "file_count",
      "files",
      "images_count",
      "images",
      "shop_name",
      "shop_code",
      "generated_at",
      "created_at",
      "version",
      "message",
      "status",
      "success",
      "hasError",
      "statusCode",
    ]);
    for (const [key, value] of Object.entries(root)) {
      if (skip.has(key) || asRecord(value) || Array.isArray(value)) continue;
      if (typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value))) {
        tables.push({ key, count: toCount(value) });
      }
    }
  }

  return { tables, filesCount, extra };
}

export async function fetchShopBackupSummary(): Promise<
  { ok: true; summary: ShopBackupSummary } | { ok: false; message: string }
> {
  const token = tokenCode();
  if (!token) return { ok: false, message: "لطفاً وارد شوید" };
  const res = await FetchWithJwtClient("GET", "/api/shop-backup", token);
  if (!res || res.hasError) {
    return { ok: false, message: getApiErrorMessage(res, "خطا در دریافت خلاصه پشتیبان") };
  }
  return { ok: true, summary: parseShopBackupSummary(res) };
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf?.[1]) return decodeURIComponent(utf[1].trim());
  const plain = header.match(/filename="?([^";]+)"?/i);
  if (plain?.[1]) return plain[1].trim();
  return null;
}

export async function downloadShopBackup(): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = tokenCode();
  if (!token) return { ok: false, message: "لطفاً وارد شوید" };

  const response = await fetch(`${API_BASE}/api/shop-backup/download`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/zip, application/octet-stream, application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      return { ok: false, message: getApiErrorMessage(parsed, "دانلود پشتیبان ناموفق بود") };
    } catch {
      return { ok: false, message: text || "دانلود پشتیبان ناموفق بود" };
    }
  }

  const blob = await response.blob();
  const filename =
    filenameFromDisposition(response.headers.get("Content-Disposition")) ||
    `shop-backup-${new Date().toISOString().slice(0, 10)}.zip`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return { ok: true };
}

export async function restoreShopBackup(
  file: File,
  confirm: string = SHOP_BACKUP_CONFIRM,
): Promise<{ ok: true; message?: string } | { ok: false; message: string }> {
  const token = tokenCode();
  if (!token) return { ok: false, message: "لطفاً وارد شوید" };
  if (file.size > SHOP_BACKUP_MAX_BYTES) {
    return { ok: false, message: "حجم فایل بیشتر از ۲۰۰ مگابایت است" };
  }

  const body = new FormData();
  body.append("file", file);
  body.append("confirm", confirm);

  const response = await fetch(`${API_BASE}/api/shop-backup/restore`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body,
  });

  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      message: getApiErrorMessage(parsed || { message: text }, "بازگردانی ناموفق بود"),
    };
  }

  return {
    ok: true,
    message: typeof parsed?.message === "string" ? parsed.message : "بازگردانی انجام شد",
  };
}
