import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";

export type BeneficiaryTotals = {
  purchased_total: number;
  unpaid_total: number;
  paid_total: number;
};

export type Beneficiary = {
  id: number;
  name?: string | null;
  phone?: string | null;
  purchased_total?: number;
  unpaid_total?: number;
  paid_total?: number;
};

export type BeneficiaryDoc = {
  id: number;
  title?: string | null;
  amount?: number | string | null;
  date?: string | null;
  created_at?: string | null;
  type?: string | null;
};

export type BeneficiaryDetail = Beneficiary & {
  invoices?: BeneficiaryDoc[];
  expenses?: BeneficiaryDoc[];
};

export type BeneficiaryLike = {
  beneficiary_id?: number | null;
  user_shiksho_id?: number | null;
  beneficiary?: {
    id?: number | null;
    name?: string | null;
    phone?: string | null;
  } | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function asId(value: unknown): number | null {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatBeneficiaryAmount(value: unknown): string {
  return new Intl.NumberFormat("fa-IR").format(Math.floor(asNumber(value)));
}

export function formatBeneficiaryLabel(item?: Beneficiary | null): string {
  if (!item) return "";
  const name = String(item.name || "").trim();
  const phone = String(item.phone || "").trim();
  if (name && phone) return `${name} — ${phone}`;
  return name || phone || `#${item.id}`;
}

export function parseBeneficiary(raw: unknown): Beneficiary | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const nested = asRecord(rec.user) ?? asRecord(rec.user_shiksho) ?? asRecord(rec.customer);
  const id = asId(rec.id) ?? asId(rec.user_shiksho_id) ?? asId(nested?.id);
  if (!id) return null;
  return {
    id,
    name: String(rec.name ?? nested?.name ?? rec.full_name ?? "").trim() || null,
    phone: String(rec.phone ?? nested?.phone ?? rec.mobile ?? "").trim() || null,
    purchased_total: asNumber(rec.purchased_total ?? rec.purchase_total),
    unpaid_total: asNumber(rec.unpaid_total ?? rec.debt_total ?? rec.debt),
    paid_total: asNumber(rec.paid_total),
  };
}

export function extractBeneficiaryList(res: unknown): Beneficiary[] {
  const rec = asRecord(res);
  const raw =
    (Array.isArray(res) ? res : null) ??
    (Array.isArray(rec?.data) ? rec!.data : null) ??
    (Array.isArray(rec?.beneficiaries) ? rec!.beneficiaries : null) ??
    [];
  return raw.map(parseBeneficiary).filter((item): item is Beneficiary => item != null);
}

export function extractBeneficiaryDetail(res: unknown): BeneficiaryDetail | null {
  const rec = asRecord(res);
  const candidate = rec?.data ?? rec?.beneficiary ?? rec;
  const parsed = parseBeneficiary(candidate);
  if (!parsed) return null;
  const body = asRecord(candidate) ?? rec;
  const invoicesRaw = Array.isArray(body?.invoices)
    ? body.invoices
    : Array.isArray(rec?.invoices)
      ? rec!.invoices
      : [];
  const expensesRaw = Array.isArray(body?.expenses)
    ? body.expenses
    : Array.isArray(rec?.expenses)
      ? rec!.expenses
      : [];
  return {
    ...parsed,
    invoices: invoicesRaw as BeneficiaryDoc[],
    expenses: expensesRaw as BeneficiaryDoc[],
  };
}

export function beneficiaryFromRecord(row?: BeneficiaryLike | null): Beneficiary | null {
  if (!row) return null;
  const nested = parseBeneficiary(row.beneficiary);
  const id = asId(row.beneficiary_id) ?? asId(row.user_shiksho_id) ?? nested?.id ?? null;
  if (!id) return null;
  return {
    id,
    name: nested?.name ?? null,
    phone: nested?.phone ?? null,
  };
}

export function beneficiaryPayload(id: number | "" | null | undefined): { beneficiary_id: number | null } {
  return { beneficiary_id: id === "" || id == null ? null : id };
}

function extractRegisteredId(res: unknown): number | null {
  const rec = asRecord(res);
  const data = asRecord(rec?.data);
  const user = asRecord(rec?.user) ?? asRecord(data?.user) ?? asRecord(rec?.customer) ?? asRecord(data?.customer);
  return (
    asId(rec?.id) ??
    asId(rec?.user_shiksho_id) ??
    asId(rec?.beneficiary_id) ??
    asId(data?.id) ??
    asId(data?.user_shiksho_id) ??
    asId(user?.id)
  );
}

export async function fetchBeneficiaries(query?: string, onlyWithDocs = false): Promise<Beneficiary[]> {
  const token = tokenCode();
  if (!token) return [];
  const params: Record<string, string | number | boolean> = {};
  if (query?.trim()) params.q = query.trim();
  if (onlyWithDocs) params.only_with_docs = 1;
  const res = await FetchWithJwtClient("GET", "/api/beneficiaries", token, params);
  if (!res || res.hasError) return [];
  return extractBeneficiaryList(res);
}

export async function fetchBeneficiary(id: number): Promise<BeneficiaryDetail | null> {
  const token = tokenCode();
  if (!token) return null;
  const res = await FetchWithJwtClient("GET", `/api/beneficiaries/${id}`, token);
  if (!res || res.hasError) return null;
  return extractBeneficiaryDetail(res);
}

export async function registerBeneficiaryCustomer(phone: string, name?: string): Promise<Beneficiary | null> {
  const token = tokenCode();
  if (!token) return null;
  const payload: Record<string, unknown> = { phone: phone.trim() };
  const trimmedName = name?.trim();
  if (trimmedName) payload.name = trimmedName;
  const res = await FetchWithJwtClient("POST", "/api/customers/register", payload);
  if (!res || res.hasError) {
    const error = new Error(
      typeof res?.message === "string"
        ? res.message
        : typeof res?.error === "string"
          ? res.error
          : "ثبت ذینفع ناموفق بود",
    );
    (error as Error & { response?: unknown }).response = res;
    throw error;
  }
  const id = extractRegisteredId(res);
  if (id) {
    const detail = await fetchBeneficiary(id);
    if (detail) return detail;
    return {
      id,
      name: trimmedName || null,
      phone: phone.trim(),
    };
  }
  const matches = await fetchBeneficiaries(phone.trim());
  return matches.find((item) => item.phone === phone.trim()) ?? matches[0] ?? null;
}

export function parseAsBeneficiary(raw: unknown): (BeneficiaryTotals & { id?: number }) | null {
  const rec = asRecord(raw);
  const nested = asRecord(rec?.as_beneficiary);
  if (!nested) return null;
  return {
    id: asId(nested.id) ?? undefined,
    purchased_total: asNumber(nested.purchased_total ?? nested.purchase_total),
    unpaid_total: asNumber(nested.unpaid_total ?? nested.debt_total),
    paid_total: asNumber(nested.paid_total),
  };
}
