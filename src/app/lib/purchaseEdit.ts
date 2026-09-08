import { catalogItemKey, isProducedGoodItem, isRawMaterialItem } from "@/app/lib/catalogItems";

export function canReplacePurchase(purchase: any): { ok: boolean; reason: string } {
  if (!purchase?.id) {
    return { ok: false, reason: "فاکتور نامعتبر است" };
  }
  if (purchase.cart_id) {
    return { ok: false, reason: "سفارش اینترنتی از این مسیر ویرایش نمی‌شود" };
  }
  const lines = Array.isArray(purchase.purchased_products) ? purchase.purchased_products : [];
  if (lines.length === 0) {
    return { ok: false, reason: "اقلام باقی‌مانده‌ای برای ویرایش نیست" };
  }
  if (purchase.payment_type === "installment") {
    const installments = Array.isArray(purchase.installments) ? purchase.installments : [];
    const extraPaid = installments.filter(
      (row: any) => row?.is_paid && Number(row.installment_number) > 1,
    ).length;
    if (extraPaid > 0) {
      return { ok: false, reason: "قسط پرداخت‌شده دارد؛ از برگشت استفاده کنید" };
    }
  }
  if (purchase.payment_type === "cheque" && purchase.is_cheque_settled) {
    return { ok: false, reason: "چک وصول‌شده قابل جایگزینی نیست" };
  }
  if (purchase.payment_type === "debt" && purchase.is_debt_settled) {
    return { ok: false, reason: "بدهی تسویه‌شده قابل جایگزینی نیست" };
  }
  return { ok: true, reason: "" };
}

export function purchaseHasReturns(purchase: any): boolean {
  const count = Number(purchase?.item_returns_count ?? 0);
  if (count > 0) return true;
  return Array.isArray(purchase?.item_returns) && purchase.item_returns.length > 0;
}

export function purchasedLineToCartItem(line: any, catalog: any[] = []): any {
  const qty = Number(line?.quantity) || 0;
  const producedId = line?.produced_good_id ?? line?.producedGood?.id;
  const rawId = line?.raw_material_id ?? line?.rawMaterial?.id;
  const productId = line?.product_id ?? line?.product?.id;
  const nested = line?.producedGood || line?.produced_good || line?.rawMaterial || line?.raw_material || line?.product || {};
  const identity = producedId
    ? { item_type: "produced_good", produced_good_id: producedId, id: producedId }
    : rawId
      ? { item_type: "raw_material", raw_material_id: rawId, id: rawId }
      : { product_id: productId, id: productId };
  const key = catalogItemKey(identity);
  const fromCatalog = catalog.find((item) => catalogItemKey(item) === key) || {};
  const salePrice = Number(line?.sale_price ?? fromCatalog.sale_price ?? nested.sale_price ?? 0);
  const purchasePrice = Number(line?.purchase_price ?? fromCatalog.purchase_price ?? nested.purchase_price ?? 0);

  if (producedId) {
    return {
      ...fromCatalog,
      ...nested,
      id: Number(producedId),
      produced_good_id: Number(producedId),
      item_type: "produced_good",
      name: line?.item_name || line?.display_name || nested.name || fromCatalog.name,
      quantity: qty,
      sale_price: salePrice,
      default_sale_price: salePrice,
      purchase_price: purchasePrice,
      unit_type: fromCatalog.unit_type || nested.unit_type || "kg",
    };
  }
  if (rawId) {
    return {
      ...fromCatalog,
      ...nested,
      id: Number(rawId),
      raw_material_id: Number(rawId),
      item_type: "raw_material",
      name: line?.item_name || line?.display_name || nested.name || fromCatalog.name,
      quantity: qty,
      sale_price: salePrice,
      default_sale_price: salePrice,
      purchase_price: purchasePrice,
      unit_type: fromCatalog.unit_type || nested.unit_type || "kg",
    };
  }
  return {
    ...fromCatalog,
    ...nested,
    id: Number(productId),
    product_id: Number(productId),
    name: line?.item_name || line?.display_name || nested.name || fromCatalog.name,
    barcode: nested.barcode || fromCatalog.barcode,
    quantity: qty,
    sale_price: salePrice,
    default_sale_price: salePrice,
    purchase_price: purchasePrice,
    unit_type: fromCatalog.unit_type || nested.unit_type || "piece",
    size: line?.size ?? null,
    color: line?.color ?? null,
  };
}

export function purchaseEditStockBonus(lines: any[]): Record<string, number> {
  const bonus: Record<string, number> = {};
  for (const line of lines || []) {
    const item = purchasedLineToCartItem(line, []);
    const key = catalogItemKey(item);
    if (!key) continue;
    bonus[key] = (bonus[key] || 0) + Number(item.quantity || 0);
  }
  return bonus;
}

export function purchaseEditHref(purchaseId: number | string): string {
  return `/admin?editPurchase=${purchaseId}`;
}

export function isProducedOrRaw(item: any): boolean {
  return isProducedGoodItem(item) || isRawMaterialItem(item);
}
