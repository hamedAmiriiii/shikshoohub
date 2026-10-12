/**
 * باز کردن یک فروش / فاکتور / هزینه از صفحهٔ دیگر (مثل گردش مالی مشتری)
 * و برگشت به همان صفحه بعد از بستن.
 *
 * مثال: /admin/invoices?open=12&return=%2Fadmin%2Fpurchas%2Fcustomer%2F0939...
 */

export type LedgerDocumentType = "sale" | "invoice" | "expense";

const LIST_PATH: Record<LedgerDocumentType, string> = {
  sale: "/admin/purchas",
  invoice: "/admin/invoices",
  expense: "/admin/expenses",
};

/** فقط مسیرهای داخلی پنل ادمین مجازند (جلوگیری از open redirect) */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value.startsWith("/admin/") || value.startsWith("//") || value.includes("://")) return null;
  return value;
}

export function buildDocumentLink(type: LedgerDocumentType, id: number, returnTo: string): string {
  const safe = safeReturnPath(returnTo);
  const query = new URLSearchParams({ open: String(id) });
  if (safe) query.set("return", safe);
  return `${LIST_PATH[type]}?${query.toString()}`;
}

export function readDocumentOpenRequest(): { id: number | null; returnTo: string | null } {
  if (typeof window === "undefined") return { id: null, returnTo: null };
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("open"));
  return {
    id: Number.isFinite(id) && id > 0 ? id : null,
    returnTo: safeReturnPath(params.get("return")),
  };
}
