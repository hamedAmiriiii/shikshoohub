import { readAdminPosSettings, writeAdminPosSettings } from "@/app/lib/adminPosSettings";

export const ROUND_SALE_PRICE_TO_THOUSAND_KEY = "round_sale_price_to_thousand";

export function readRoundSalePriceToThousand(): boolean {
  return readAdminPosSettings().roundSalePriceToThousand !== false;
}

export function parseRoundSalePriceSetting(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  const text = String(value).trim().toLowerCase();
  return text === "1" || text === "true" || text === "yes" || text === "on";
}

/** مقدار را از پاسخ `/api/settings` (نقشهٔ key → value) روی همین مرورگر می‌نشاند. */
export function persistSalePriceRoundingFromSettings(payload: unknown): void {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return;
  const record = payload as Record<string, unknown>;
  if (!(ROUND_SALE_PRICE_TO_THOUSAND_KEY in record)) return;
  const enabled = parseRoundSalePriceSetting(record[ROUND_SALE_PRICE_TO_THOUSAND_KEY]);
  if (enabled !== readRoundSalePriceToThousand()) {
    writeAdminPosSettings({ roundSalePriceToThousand: enabled });
  }
}

export function roundToTen(amount: number): number {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n / 10) * 10;
}

export function roundToThousand(amount: number): number {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n / 1000) * 1000;
}

/** رند قیمت فروش طبق تنظیم فروشگاه: هزار تومان یا فقط یکان صفر. */
export function roundSalePrice(amount: number, toThousand = readRoundSalePriceToThousand()): number {
  return toThousand ? roundToThousand(amount) : roundToTen(amount);
}
