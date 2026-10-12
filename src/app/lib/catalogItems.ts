export type CatalogIdentity = {
  id?: number | string | null;
  item_type?: string | null;
  produced_good_id?: number | string | null;
  product_id?: number | string | null;
  raw_material_id?: number | string | null;
  /** نسخهٔ سفارشی‌شده (مثلاً منوی سه‌بعدی با مواد برداشته‌شده) — خط جدا در سبد می‌سازد */
  variant?: string | null;
};

function sortedUniqueIds(ids: number[] | null | undefined): number[] {
  return Array.from(new Set((ids || []).map(Number).filter((n) => Number.isFinite(n) && n > 0))).sort(
    (a, b) => a - b,
  );
}

/** کلید خط سبد برای ترکیب سفارشی: مواد برداشته‌شده مرتب و یکتا */
export function removedIngredientsVariant(ids: number[] | null | undefined): string | null {
  const clean = sortedUniqueIds(ids);
  return clean.length ? `no:${clean.join("-")}` : null;
}

/** کلید خط سبد برای حذف + اضافه (منوی سه‌بعدی) */
export function customizationVariant(
  removedIds: number[] | null | undefined,
  extraIds: number[] | null | undefined,
): string | null {
  const no = sortedUniqueIds(removedIds);
  const extra = sortedUniqueIds(extraIds).filter((id) => !no.includes(id));
  const parts: string[] = [];
  if (no.length) parts.push(`no:${no.join("-")}`);
  if (extra.length) parts.push(`extra:${extra.join("-")}`);
  return parts.length ? parts.join("|") : null;
}

export function isProducedGoodItem(item: CatalogIdentity | null | undefined): boolean {
  if (!item) return false;
  if (String(item.item_type || "").toLowerCase() === "produced_good") return true;
  return item.produced_good_id != null && item.produced_good_id !== "";
}

export function isRawMaterialItem(item: CatalogIdentity | null | undefined): boolean {
  if (!item) return false;
  if (String(item.item_type || "").toLowerCase() === "raw_material") return true;
  return item.raw_material_id != null && item.raw_material_id !== "";
}

export function catalogItemKey(item: CatalogIdentity | null | undefined): string {
  if (!item) return "";
  if (isProducedGoodItem(item)) {
    const id = item.produced_good_id ?? item.id;
    return item.variant ? `produced_good:${id}#${item.variant}` : `produced_good:${id}`;
  }
  if (isRawMaterialItem(item)) {
    const id = item.raw_material_id ?? item.id;
    return `raw_material:${id}`;
  }
  const id = item.product_id ?? item.id;
  return `product:${id}`;
}

export function producedGoodNumericId(item: CatalogIdentity): number | null {
  const n = Number(item.produced_good_id ?? item.id);
  return Number.isFinite(n) ? n : null;
}

export function catalogProductHref(
  product: CatalogIdentity,
  shopPathFn?: (path: string) => string,
): string {
  const id = product.id;
  const qs = isProducedGoodItem(product) ? "?item_type=produced_good" : "";
  const path = `/product/${id}${qs}`;
  return shopPathFn ? shopPathFn(path) : path;
}

export function catalogCartApiLine(item: CatalogIdentity & {
  quantity: number;
  size?: string | null;
  color?: string | null;
  removed_ingredient_ids?: number[] | null;
  extra_ingredient_ids?: number[] | null;
}): Record<string, unknown> {
  const extra: Record<string, unknown> = {};
  if (item.size) extra.size = item.size;
  if (item.color) extra.color = item.color;
  if (isProducedGoodItem(item)) {
    if (item.removed_ingredient_ids && item.removed_ingredient_ids.length > 0) {
      extra.removed_ingredient_ids = item.removed_ingredient_ids;
    }
    if (item.extra_ingredient_ids && item.extra_ingredient_ids.length > 0) {
      extra.extra_ingredient_ids = item.extra_ingredient_ids;
    }
    return {
      produced_good_id: Number(item.produced_good_id ?? item.id),
      item_type: "produced_good",
      quantity: item.quantity,
      ...extra,
    };
  }
  if (isRawMaterialItem(item)) {
    return {
      raw_material_id: Number(item.raw_material_id ?? item.id),
      item_type: "raw_material",
      quantity: item.quantity,
      ...extra,
    };
  }
  return {
    product_id: Number(item.product_id ?? item.id),
    quantity: item.quantity,
    ...extra,
  };
}
