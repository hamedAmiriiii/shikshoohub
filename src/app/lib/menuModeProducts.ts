import type { CachedProduct } from "@/app/lib/productsCache";

export const MENU_ALL_CATEGORY_ID = "__all__";
export const MENU_UNCATEGORIZED_ID = "__uncategorized__";

export type MenuCategory = {
  id: string;
  name: string;
  count: number;
};

export type ProductCategoryRef = {
  id: string;
  name: string;
};

export function getProductCategories(product: CachedProduct): ProductCategoryRef[] {
  const refs: ProductCategoryRef[] = [];
  const seen = new Set<string>();

  const push = (id: unknown, name?: unknown) => {
    if (id == null || id === "") return;
    const key = String(id);
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({
      id: key,
      name: typeof name === "string" && name.trim() ? name.trim() : `دسته ${key}`,
    });
  };

  if (Array.isArray(product.categories)) {
    for (const cat of product.categories) {
      if (cat && typeof cat === "object") {
        push((cat as { id?: unknown }).id, (cat as { name?: unknown }).name);
      } else {
        push(cat);
      }
    }
  }

  if (Array.isArray(product.category_ids)) {
    for (const id of product.category_ids) {
      push(id, product.category_name);
    }
  }

  if (product.category_id != null) {
    push(product.category_id, product.category_name);
  }

  return refs;
}

export function buildMenuCategories(products: CachedProduct[]): MenuCategory[] {
  const map = new Map<string, { name: string; count: number }>();
  let uncategorized = 0;

  for (const product of products) {
    const cats = getProductCategories(product);
    if (cats.length === 0) {
      uncategorized += 1;
      continue;
    }
    for (const cat of cats) {
      const prev = map.get(cat.id);
      map.set(cat.id, {
        name: cat.name,
        count: (prev?.count ?? 0) + 1,
      });
    }
  }

  const list: MenuCategory[] = [
    { id: MENU_ALL_CATEGORY_ID, name: "همه", count: products.length },
  ];

  if (uncategorized > 0) {
    list.push({
      id: MENU_UNCATEGORIZED_ID,
      name: "سایر",
      count: uncategorized,
    });
  }

  Array.from(map.entries())
    .sort((a, b) => a[1].name.localeCompare(b[1].name, "fa"))
    .forEach(([id, { name, count }]) => {
      list.push({ id, name, count });
    });

  return list;
}

export function filterProductsByMenuCategory(
  products: CachedProduct[],
  categoryId: string,
): CachedProduct[] {
  if (categoryId === MENU_ALL_CATEGORY_ID) return products;
  if (categoryId === MENU_UNCATEGORIZED_ID) {
    return products.filter((product) => getProductCategories(product).length === 0);
  }
  return products.filter((product) =>
    getProductCategories(product).some((cat) => cat.id === categoryId),
  );
}

export function getProductImageUrl(product: CachedProduct): string | null {
  const images = product.images;
  if (!images?.length) return null;

  const first = images[0];
  if (typeof first === "string") {
    if (first.startsWith("http") || first.startsWith("data:")) return first;
    if (first.startsWith("/storage/")) return `https://api.webinoplus.ir${first}`;
    return first;
  }

  if (first && typeof first === "object" && "image_url" in first) {
    const url = String((first as { image_url: string }).image_url || "");
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    if (url.startsWith("/storage/")) return `https://api.webinoplus.ir${url}`;
    return url;
  }

  return null;
}
