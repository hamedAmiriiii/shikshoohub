/** قیمت فروش سبد بعد از درصد سود، رند به نزدیک‌ترین هزار تومان. */
export function roundCartPrice(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const toThousand = Math.round(amount / 1000) * 1000;
  if (toThousand > 0) return toThousand;
  return Math.round(amount);
}

export function parseProfitPercent(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(500, value);
}

/**
 * درصد روی قیمت پایه. اگر رند هزارتومانی اثر درصد را پاک کند، به صد تومان رند می‌شود
 * تا روی قیمت‌های کوچک هم سود دیده شود.
 */
export function salePriceWithProfit(base: number, percent: number): number {
  const origin = Number(base) || 0;
  if (!(percent > 0) || origin <= 0) return origin;
  const raw = origin * (1 + percent / 100);
  const rounded = roundCartPrice(raw);
  const originRounded = roundCartPrice(origin);
  if (rounded !== originRounded) return rounded;
  const toHundred = Math.round(raw / 100) * 100;
  return toHundred > 0 ? toHundred : Math.round(raw);
}

export function applyProfitToCartLines<T extends { sale_price?: number; profit_base_price?: number }>(
  cart: T[],
  percent: number,
): T[] {
  return cart.map((item) => {
    const base = cartLineBasePrice(item);
    return {
      ...item,
      profit_base_price: base,
      sale_price: salePriceWithProfit(base, percent),
    };
  });
}

export function cartLineBasePrice(item: { sale_price?: number; profit_base_price?: number }): number {
  const stored = Number(item.profit_base_price);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return Number(item.sale_price) || 0;
}
