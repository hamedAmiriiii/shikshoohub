const faQty = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function purchaseLines(purchase: any): any[] {
  return Array.isArray(purchase?.purchased_products) ? purchase.purchased_products : [];
}

export function lineDisplayName(line: any): string {
  return (
    line?.item_name ||
    line?.product?.name ||
    line?.produced_good?.name ||
    line?.producedGood?.name ||
    line?.raw_material?.name ||
    line?.rawMaterial?.name ||
    "کالا"
  );
}

export function purchaseTotalQuantity(purchase: any): number {
  return purchaseLines(purchase).reduce((sum, line) => sum + (Number(line?.quantity) || 0), 0);
}

export function purchaseDistinctLineCount(purchase: any): number {
  return purchaseLines(purchase).length;
}

/** مجموع تعداد — برای ستون جدول */
export function formatPurchaseItemsTotal(purchase: any): string {
  const total = purchaseTotalQuantity(purchase);
  return total > 0 ? faQty(total) : "—";
}

/** جزئیات هر قلم — مثلاً «کباب ×۳، نوشابه ×۲» */
export function formatPurchaseItemsBreakdown(purchase: any): string {
  const lines = purchaseLines(purchase);
  if (!lines.length) return "—";
  return lines
    .map((line) => `${lineDisplayName(line)} ×${faQty(Number(line.quantity) || 0)}`)
    .join("، ");
}

/** متن کارت موبایل */
export function formatPurchaseItemsSummary(purchase: any): string {
  const lines = purchaseLines(purchase);
  if (!lines.length) return "—";
  const total = purchaseTotalQuantity(purchase);
  const breakdown = formatPurchaseItemsBreakdown(purchase);
  if (lines.length === 1) return breakdown;
  return `${faQty(total)} قلم · ${breakdown}`;
}
