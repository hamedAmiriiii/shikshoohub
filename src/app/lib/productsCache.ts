export const PRODUCTS_CACHE_KEY = "products_cache";

export type CachedProduct = {
  id: number | string;
  name?: string;
  barcode?: string;
  sale_price?: number | string;
  original_sale_price?: number | string;
  has_discount?: boolean;
  quantity?: number;
  category_id?: number | string;
  category_name?: string;
  category_ids?: Array<number | string>;
  categories?: Array<{ id?: number | string; name?: string } | number | string>;
  images?: Array<string | { image_url?: string }>;
};

function parseProductsCache(raw: string | null): CachedProduct[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** لیست کالاهای کش‌شده در localStorage (همان لیست بارکد/فروش) */
export function readProductsFromCache(): CachedProduct[] {
  if (typeof window === "undefined") return [];
  return parseProductsCache(localStorage.getItem(PRODUCTS_CACHE_KEY));
}

/** تعداد کالاهای کش‌شده در localStorage (همان لیست بارکد/فروش) */
export function readProductsCountFromCache(): number {
  return readProductsFromCache().length;
}
