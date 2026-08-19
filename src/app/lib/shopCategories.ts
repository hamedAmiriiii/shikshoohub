const API_BASE = "https://api.webinoplus.ir";

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
