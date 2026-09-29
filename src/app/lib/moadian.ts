import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

export type MoadianStatus = "queued" | "sent" | "success" | "failed" | "discarded" | string;

export type MoadianMessage = { code: string; message: string };

export type MoadianDocument = {
  id: number;
  purchase_id: number | null;
  subject: number;
  subject_label: string;
  invoice_type: number;
  taxid: string;
  reference_taxid: string | null;
  issued_at: string | null;
  insr: boolean;
  tadis: number;
  tvam: number;
  todam: number;
  tbill: number;
  status: MoadianStatus;
  status_label: string;
  reference_number: string | null;
  errors: MoadianMessage[];
  warnings: MoadianMessage[];
  attempts: number;
  sent_at: string | null;
  triggered_by: string;
  can_retry: boolean;
  items?: MoadianDocumentItem[];
  payload?: Record<string, unknown>;
};

export type MoadianDocumentItem = {
  line_key: string;
  sstid: string;
  sstt: string | null;
  am: number;
  fee: number;
  dis: number;
  adis: number;
  vra: number;
  vam: number;
  odam: number;
  tsstam: number;
};

export type MoadianPage<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export type MoadianSummary = {
  enabled: boolean;
  environment: string;
  paused_reason: string | null;
  problems: string[];
  last_run_at: string | null;
  counts: { queued: number; sent: number; success: number; failed: number };
  products_missing_sstid: number;
};

export type MoadianSettings = {
  exists: boolean;
  enabled: boolean;
  environment: "sandbox" | "production" | string;
  connection_mode: "self_tsp" | "tsp" | string;
  memory_id: string | null;
  has_private_key: boolean;
  public_key: string | null;
  certificate: string | null;
  certificate_info: { subject: string | null; serial_number: string | null; valid_to: string | null; expired: boolean } | null;
  tsp_provider: string | null;
  price_includes_vat: boolean;
  default_invoice_type: number;
  auto_type1_with_buyer: boolean;
  default_vat_rate: number;
  default_sstid: string | null;
  default_sstt: string | null;
  unit_code_piece: string | null;
  unit_code_kg: string | null;
  unit_code_meter: string | null;
  late_threshold_days: number | null;
  start_purchase_id: number | null;
  started_at: string | null;
  paused_reason: string | null;
  last_verified_at: string | null;
  last_run_at: string | null;
  seller: { legal_name: string | null; economic_code: string | null; national_id: string | null; postal_code: string | null };
  problems: string[];
};

export type MoadianSettingsInput = Partial<
  Omit<MoadianSettings, "exists" | "has_private_key" | "public_key" | "certificate_info" | "seller" | "problems" | "start_purchase_id" | "started_at" | "paused_reason" | "last_verified_at" | "last_run_at">
> & { private_key?: string | null };

export type MoadianStuffId = {
  id: number;
  sstid: string;
  title: string;
  vat_rate: number;
  other_tax_rate: number;
  other_tax_subject: string | null;
  unit_code: string | null;
};

export type MoadianProductRow = {
  id: number;
  name: string;
  barcode: string | null;
  unit_type: string | null;
  sale_price: number;
  moadian_sstid: string | null;
};

const BASE = "/api/accounting/moadian";

function token(): string {
  return tokenCode() || "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function check(res: unknown, fallback: string): Record<string, unknown> {
  const obj = asRecord(res) ?? {};
  if (obj.hasError) throw new Error(getApiErrorMessage(res, fallback));
  return obj;
}

function page<T>(obj: Record<string, unknown>): MoadianPage<T> {
  return {
    data: Array.isArray(obj.data) ? (obj.data as T[]) : [],
    current_page: Number(obj.current_page) || 1,
    last_page: Number(obj.last_page) || 1,
    total: Number(obj.total) || 0,
  };
}

async function send(method: "POST" | "PUT" | "DELETE", url: string, body: unknown, fallback: string) {
  const res = await FetchWithJwtClient(method, url, token(), {}, body === undefined ? {} : { body: JSON.stringify(body) });
  return check(res, fallback);
}

export async function fetchMoadianSummary(): Promise<MoadianSummary> {
  const obj = check(await FetchWithJwtClient("GET", `${BASE}/summary`, token()), "خطا در دریافت وضعیت سامانه مؤدیان");
  return obj.data as MoadianSummary;
}

export async function fetchMoadianSettings(): Promise<MoadianSettings> {
  const obj = check(await FetchWithJwtClient("GET", `${BASE}/settings`, token()), "خطا در دریافت تنظیمات");
  return obj.data as MoadianSettings;
}

export async function saveMoadianSettings(body: MoadianSettingsInput): Promise<{ message: string; data: MoadianSettings }> {
  const obj = await send("PUT", `${BASE}/settings`, body, "خطا در ذخیره تنظیمات");
  return { message: String(obj.message ?? "ذخیره شد."), data: obj.data as MoadianSettings };
}

export async function generateMoadianKey(body: {
  common_name: string;
  serial_number: string;
  organization?: string;
  replace?: boolean;
}): Promise<{ message: string; public_key: string; csr: string }> {
  const obj = await send("POST", `${BASE}/generate-key`, body, "خطا در ساخت کلید");
  const data = asRecord(obj.data) ?? {};
  return { message: String(obj.message ?? ""), public_key: String(data.public_key ?? ""), csr: String(data.csr ?? "") };
}

export async function testMoadianConnection(): Promise<string> {
  const obj = await send("POST", `${BASE}/test-connection`, {}, "اتصال ناموفق بود");
  return String(obj.message ?? "اتصال برقرار است.");
}

export async function runMoadianNow(): Promise<string> {
  const obj = await send("POST", `${BASE}/run`, {}, "پردازش ناموفق بود");
  return String(obj.message ?? "پردازش انجام شد.");
}

export async function fetchMoadianDocuments(options: {
  page?: number;
  status?: string;
  subject?: string;
  search?: string;
}): Promise<MoadianPage<MoadianDocument>> {
  const params: Record<string, string | number> = { page: options.page ?? 1, per_page: 20 };
  if (options.status) params.status = options.status;
  if (options.subject) params.subject = options.subject;
  if (options.search) params.search = options.search;
  const obj = check(await FetchWithJwtClient("GET", `${BASE}/documents`, token(), params), "خطا در دریافت صورتحساب‌ها");
  return page<MoadianDocument>(obj);
}

export async function fetchMoadianDocument(id: number): Promise<MoadianDocument> {
  const obj = check(await FetchWithJwtClient("GET", `${BASE}/documents/${id}`, token()), "صورتحساب یافت نشد");
  return obj.data as MoadianDocument;
}

export async function retryMoadianDocument(id: number): Promise<string> {
  const obj = await send("POST", `${BASE}/documents/${id}/retry`, {}, "ارسال دوباره ناموفق بود");
  return String(obj.message ?? "");
}

export async function retryFailedMoadianDocuments(): Promise<string> {
  const obj = await send("POST", `${BASE}/documents/retry-failed`, {}, "ارسال دوباره ناموفق بود");
  return String(obj.message ?? "");
}

export async function fetchMoadianStuffIds(): Promise<MoadianStuffId[]> {
  const obj = check(await FetchWithJwtClient("GET", `${BASE}/stuff-ids`, token()), "خطا در دریافت شناسه‌ها");
  const rows = Array.isArray(obj.data) ? (obj.data as MoadianStuffId[]) : [];
  return rows.map((row) => ({
    ...row,
    vat_rate: Number(row.vat_rate) || 0,
    other_tax_rate: Number(row.other_tax_rate) || 0,
  }));
}

export async function saveMoadianStuffId(
  body: Omit<MoadianStuffId, "id">,
  id?: number,
): Promise<string> {
  const obj = id
    ? await send("PUT", `${BASE}/stuff-ids/${id}`, body, "خطا در ذخیره شناسه")
    : await send("POST", `${BASE}/stuff-ids`, body, "خطا در ذخیره شناسه");
  return String(obj.message ?? "ذخیره شد.");
}

export async function deleteMoadianStuffId(id: number): Promise<string> {
  const obj = await send("DELETE", `${BASE}/stuff-ids/${id}`, undefined, "خطا در حذف شناسه");
  return String(obj.message ?? "حذف شد.");
}

export async function fetchMoadianProducts(options: {
  page?: number;
  missing?: boolean;
  search?: string;
}): Promise<MoadianPage<MoadianProductRow>> {
  const params: Record<string, string | number> = { page: options.page ?? 1, per_page: 50 };
  if (options.missing) params.missing = 1;
  if (options.search) params.search = options.search;
  const obj = check(await FetchWithJwtClient("GET", `${BASE}/products`, token(), params), "خطا در دریافت کالاها");
  return page<MoadianProductRow>(obj);
}

export async function assignMoadianSstid(productIds: number[], sstid: string | null): Promise<string> {
  const obj = await send("POST", `${BASE}/products/assign`, { product_ids: productIds, sstid }, "خطا در ذخیره شناسه کالا");
  return String(obj.message ?? "ذخیره شد.");
}

export function moadianStatusColors(status: MoadianStatus): { bg: string; color: string } {
  switch (status) {
    case "success":
      return { bg: "var(--admin-accent)", color: "var(--admin-on-accent)" };
    case "failed":
      return { bg: "#d32f2f", color: "#fff" };
    case "sent":
      return { bg: "var(--admin-info-bg)", color: "var(--admin-info-icon)" };
    case "discarded":
      return { bg: "var(--admin-border)", color: "var(--admin-text-muted)" };
    default:
      return { bg: "var(--admin-surface-alt)", color: "var(--admin-text)" };
  }
}

/** مبالغ سامانه به ریال است */
export function formatRial(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "۰";
  return new Intl.NumberFormat("fa-IR").format(Math.trunc(n));
}
