export type CatalogIdentity = {
  id?: number | string | null;
  item_type?: string | null;
  produced_good_id?: number | string | null;
  product_id?: number | string | null;
};

export function isProducedGoodItem(item: CatalogIdentity | null | undefined): boolean {
  if (!item) return false;
  if (String(item.item_type || "").toLowerCase() === "produced_good") return true;
  return item.produced_good_id != null && item.produced_good_id !== "";
}

export function catalogItemKey(item: CatalogIdentity | null | undefined): string {
  if (!item) return "";
  if (isProducedGoodItem(item)) {
    const id = item.produced_good_id ?? item.id;
    return `produced_good:${id}`;
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
}): Record<string, unknown> {
  const extra: Record<string, unknown> = {};
  if (item.size) extra.size = item.size;
  if (item.color) extra.color = item.color;
  if (isProducedGoodItem(item)) {
    return {
      produced_good_id: Number(item.produced_good_id ?? item.id),
      item_type: "produced_good",
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
