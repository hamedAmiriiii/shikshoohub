import { catalogItemKey } from "@/app/lib/catalogItems";
import type { OutboxItem } from "./outbox";

type QtyItem = { quantity?: number | string | null };

/**
 * موجودی محلی را به اندازه اقلام سبد کم می‌کند (برای فروش آنلاین/آفلاین فوری).
 */
export function deductCartQuantitiesFromProducts<T extends QtyItem>(
  products: T[],
  cart: unknown[],
): T[] {
  if (!Array.isArray(products) || products.length === 0 || !Array.isArray(cart)) {
    return products;
  }

  const deductions = new Map<string, number>();
  for (const row of cart) {
    if (!row || typeof row !== "object") continue;
    const key = catalogItemKey(row as Parameters<typeof catalogItemKey>[0]);
    if (!key) continue;
    const qty = Number((row as { quantity?: unknown }).quantity) || 0;
    if (qty <= 0) continue;
    deductions.set(key, (deductions.get(key) || 0) + qty);
  }
  if (deductions.size === 0) return products;

  return products.map((product) => {
    const key = catalogItemKey(product as Parameters<typeof catalogItemKey>[0]);
    const take = deductions.get(key);
    if (!take) return product;
    const current = Number(product.quantity) || 0;
    return { ...product, quantity: Math.max(0, current - take) };
  });
}

/**
 * موجودی رزروشدهٔ خریدهای معلق outbox را از لیست محصولات کم می‌کند
 * تا بعد از رفرش از سرور، دوباره قابل فروش نشوند.
 */
export function applyOutboxStockHolds<T extends QtyItem>(
  products: T[],
  outboxItems: OutboxItem[],
): T[] {
  if (!Array.isArray(products) || products.length === 0) return products;
  if (!Array.isArray(outboxItems) || outboxItems.length === 0) return products;

  let next = products;
  for (const item of outboxItems) {
    if (item.type !== "purchase") continue;
    if (item.status !== "pending" && item.status !== "failed" && item.status !== "syncing") {
      continue;
    }
    const cart = item.meta?.cart;
    if (Array.isArray(cart) && cart.length > 0) {
      next = deductCartQuantitiesFromProducts(next, cart);
    }
  }
  return next;
}
