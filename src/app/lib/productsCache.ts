export const PRODUCTS_CACHE_KEY = "products_cache";

/** تعداد کالاهای کش‌شده در localStorage (همان لیست بارکد/فروش) */
export function readProductsCountFromCache(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
