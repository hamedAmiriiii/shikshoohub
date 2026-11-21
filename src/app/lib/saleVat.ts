export const SALE_VAT_ENABLED_KEY = "sale_vat_enabled";
export const SALE_VAT_RATE_KEY = "sale_vat_rate";
export const SALE_VAT_DEFAULT_RATE = 10;

export function asSaleVatEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true" || value === "yes" || value === "on";
}

export function parseSaleVatRate(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return SALE_VAT_DEFAULT_RATE;
  return Math.round(n * 100) / 100;
}
