/** ورودی مبلغ: جداکنندهٔ سه‌رقمی هنگام تایپ، عدد خام برای API */

export function parseAmountInput(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/٬/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\s/g, "")
    .replace(/[^\d.]/g, "");
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export function formatAmountNumber(n: number): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("fa-IR").format(Math.floor(n));
}

/** مقدار فیلد مبلغ هنگام تایپ — فقط رقم را نگه می‌دارد و سه‌رقمی جدا می‌کند */
export function formatAmountInput(value: string): string {
  const raw = String(value ?? "");
  if (!/[\d۰-۹٠-٩]/.test(raw)) return "";
  const num = parseAmountInput(raw);
  if (!Number.isFinite(num)) return "";
  return formatAmountNumber(num);
}
