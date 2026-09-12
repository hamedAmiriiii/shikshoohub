const API_BASE = "https://api.webinoo-plus.ir";

export const CATEGORY_DISPLAY_COLORS = [
  "#87CEEB",
  "#FFB6C1",
  "#FFA07A",
  "#DDA0DD",
  "#98FB98",
  "#667eea",
];

export type ShopCategory = {
  id: number;
  name: string;
  parent_id: number | null;
  description?: string;
  order?: number;
  is_active?: boolean;
  image?: string | null;
  image_url?: string | null;
  banner_url?: string | null;
  background_color?: string | null;
  children?: ShopCategory[];
};

export function parseCategoriesFromApi(res: unknown): ShopCategory[] {
  if (!res || typeof res !== "object") return [];

  const data = res as Record<string, unknown>;
  if (data.hasError) return [];

  if (Array.isArray(res)) return res as ShopCategory[];

  const listKeys = ["categories", "tree", "items", "data"];
  for (const key of listKeys) {
    const value = data[key];
    if (Array.isArray(value)) return value as ShopCategory[];
  }

  return [];
}

export function getActiveRootCategories(categories: ShopCategory[]): ShopCategory[] {
  return categories
    .filter((cat) => cat.parent_id === null && cat.is_active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** شناسهٔ همه دسته‌های فعال (درخت کامل). */
export function getActiveCategoryIdSet(categories: ShopCategory[]): Set<number> {
  const ids = new Set<number>();
  const walk = (cats: ShopCategory[]) => {
    for (const cat of cats) {
      if (cat.is_active !== false && cat.id != null) {
        ids.add(Number(cat.id));
      }
      if (cat.children?.length) {
        walk(cat.children);
      }
    }
  };
  walk(categories);
  return ids;
}

type MenuCatalogItem = {
  category_id?: number | null;
  categories?: Array<{ id?: number | null; is_active?: boolean | null }> | null;
};

/**
 * آیا کالا در منوی عمومی (میز/اتاق) قابل نمایش است؟
 * اگر فقط به دسته‌های غیرفعال وصل باشد → خیر.
 * بدون دسته → بله (در «همه» می‌ماند).
 */
export function isCatalogItemVisibleForActiveCategories(
  item: MenuCatalogItem,
  activeCategoryIds: Set<number>,
): boolean {
  const linkedIds = new Set<number>();
  if (Array.isArray(item.categories)) {
    for (const cat of item.categories) {
      if (cat?.id == null) continue;
      const id = Number(cat.id);
      if (!Number.isFinite(id)) continue;
      if (cat.is_active === false) continue;
      linkedIds.add(id);
    }
  }
  if (item.category_id != null) {
    const id = Number(item.category_id);
    if (Number.isFinite(id)) linkedIds.add(id);
  }

  if (linkedIds.size === 0) {
    // یا دسته‌ای ندارد، یا همهٔ دسته‌هایش صراحتاً is_active=false بوده‌اند
    if (Array.isArray(item.categories) && item.categories.length > 0) {
      return false;
    }
    return true;
  }

  if (activeCategoryIds.size === 0) {
    // درخت دسته هنوز نیامده؛ فقط روی is_active خود دسته تکیه می‌کنیم
    return linkedIds.size > 0;
  }

  for (const id of linkedIds) {
    if (activeCategoryIds.has(id)) return true;
  }
  return false;
}

type CategoryImageSource = {
  image?: string | null;
  image_url?: string | null;
  banner_url?: string | null;
};

export function resolveCategoryImageUrl(
  category: CategoryImageSource,
): string | null {
  const raw = category.image_url || category.banner_url || category.image;
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http") || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("/storage/")) return `${API_BASE}${trimmed}`;
  if (trimmed.startsWith("/")) return `${API_BASE}${trimmed}`;
  return `${API_BASE}/storage/${trimmed}`;
}

export function getCategoryImageUrl(category: ShopCategory): string {
  return resolveCategoryImageUrl(category) || "/pic/noImageShop.jpg";
}

export function getCategoryBackgroundColor(
  category: ShopCategory,
  index: number,
): string {
  if (category.background_color) return category.background_color;
  return CATEGORY_DISPLAY_COLORS[index % CATEGORY_DISPLAY_COLORS.length];
}

export function getHomepageCategorySections(categories: ShopCategory[]): {
  banners: ShopCategory[];
  cards: ShopCategory[];
} {
  const roots = getActiveRootCategories(categories);
  const banners = roots.slice(0, 2);

  let cards = roots.slice(2, 6);
  if (cards.length < 4) {
    const children = roots
      .flatMap((cat) => cat.children ?? [])
      .filter((cat) => cat.is_active !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const usedIds = new Set([...banners, ...cards].map((cat) => cat.id));
    const extra = children.filter((cat) => !usedIds.has(cat.id));
    cards = [...cards, ...extra].slice(0, 4);
  }

  return { banners, cards };
}
