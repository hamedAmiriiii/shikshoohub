export { catalogItemKey, isProducedGoodItem } from "@/app/lib/catalogItems";

export const PRODUCTS_CACHE_KEY = "products_cache";

export type CachedProduct = {
  id: number | string;
  item_type?: string;
  produced_good_id?: number | string | null;
  product_id?: number | string | null;
  name?: string;
  barcode?: string;
  sale_price?: number | string;
  purchase_price?: number | string;
  original_sale_price?: number | string;
  discount_percent?: number | string;
  has_discount?: boolean;
  quantity?: number;
  unit_type?: "kg" | "piece" | string;
  unit_label?: string;
  price_unit_label?: string;
  category_id?: number | string;
  category_name?: string;
  category_ids?: Array<number | string>;
  categories?: Array<{ id?: number | string; name?: string; image?: string | null; image_url?: string | null } | number | string>;
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

export function getCachedProductDiscount(product: CachedProduct): {
  salePrice: number;
  originalPrice: number;
  hasDiscount: boolean;
} {
  const salePrice = Number(product.sale_price) || 0;
  const originalPrice = Number(product.original_sale_price) || 0;
  const hasDiscount =
    Boolean(product.has_discount) || (originalPrice > 0 && originalPrice > salePrice);
  return { salePrice, originalPrice, hasDiscount };
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
