export type InstallmentCreditRow = {
  id?: number;
  phone: string;
  name: string;
  credit: number;
  installment_credit: number;
  created_at?: string;
  updated_at?: string;
  created_at_jalali?: string;
  updated_at_jalali?: string;
  raw: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  const obj = asRecord(value);
  if (!obj) return "";
  return (
    asText(obj.phone) ||
    asText(obj.mobile) ||
    asText(obj.username) ||
    asText(obj.name) ||
    asText(obj.fullName) ||
    asText(obj.full_name) ||
    asText(obj.number)
  );
}

function asAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(
      value
        .replace(/,/g, "")
        .replace(/٬/g, "")
        .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))),
    );
    return Number.isFinite(n) ? n : 0;
  }
  const obj = asRecord(value);
  if (!obj) return 0;
  return asAmount(obj.amount ?? obj.value ?? obj.credit ?? obj.installment_credit);
}

export function formatCreditMoney(num: number | string | null | undefined): string {
  const n = asAmount(num);
  return new Intl.NumberFormat("fa-IR").format(Math.round(n || 0));
}

export function formatCreditDate(value?: string | null): string {
  if (!value) return "—";
  const jalali = /^\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(value) && Number(value.slice(0, 4)) < 1700;
  if (jalali) return value.replace(/-/g, "/");
  try {
    const date = new Date(String(value).replace(" ", "T"));
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return value;
  }
}

export function creditDisplayName(row: Pick<InstallmentCreditRow, "phone" | "name">): string {
  if (row.name && row.phone) return `${row.name} (${row.phone})`;
  return row.name || row.phone || "این کاربر";
}

export function toCreditRow(item: unknown): InstallmentCreditRow {
  if (item && typeof item === "object" && "raw" in item) {
    const row = item as InstallmentCreditRow;
    if (row.raw) return normalizeInstallmentCredit(row.raw);
  }
  return normalizeInstallmentCredit(item);
}

export function normalizeInstallmentCredit(raw: unknown): InstallmentCreditRow {
  const item = asRecord(raw) ?? {};
  const user = asRecord(item.user) ?? asRecord(item.customer);
  const phone =
    asText(item.phone) ||
    asText(user?.phone) ||
    asText(item.mobile) ||
    asText(user?.mobile) ||
    asText(item.username);
  const name =
    asText(item.name) ||
    asText(user?.name) ||
    asText(user?.fullName) ||
    asText(user?.full_name) ||
    asText(item.full_name);
  return {
    id: item.id != null && Number.isFinite(Number(item.id)) ? Number(item.id) : undefined,
    phone,
    name,
    credit: asAmount(item.credit ?? item.user_credit ?? item.current_credit ?? user?.credit),
    installment_credit: asAmount(
      item.installment_credit ?? item.installmentCredit ?? user?.installment_credit,
    ),
    created_at: typeof item.created_at === "string" ? item.created_at : undefined,
    updated_at: typeof item.updated_at === "string" ? item.updated_at : undefined,
    created_at_jalali:
      typeof item.created_at_jalali === "string" ? item.created_at_jalali : undefined,
    updated_at_jalali:
      typeof item.updated_at_jalali === "string" ? item.updated_at_jalali : undefined,
    raw: item,
  };
}
