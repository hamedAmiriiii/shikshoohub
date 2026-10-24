const faQty = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function purchaseLines(purchase: any): any[] {
  return Array.isArray(purchase?.purchased_products) ? purchase.purchased_products : [];
}

export function lineDisplayName(line: any): string {
  return (
    line?.item_name ||
    line?.display_name ||
    line?.product?.name ||
    line?.produced_good?.name ||
    line?.producedGood?.name ||
    line?.raw_material?.name ||
    line?.rawMaterial?.name ||
    "کالا"
  );
}

export function lineBarcode(line: any): string {
  const raw =
    line?.barcode ??
    line?.product?.barcode ??
    line?.produced_good?.barcode ??
    line?.producedGood?.barcode ??
    line?.raw_material?.barcode ??
    line?.rawMaterial?.barcode ??
    "";
  const value = String(raw ?? "").trim();
  return value;
}

/** نام + بارکد برای نمایش در لیست فروش */
export function lineDisplayWithBarcode(line: any): string {
  const name = lineDisplayName(line);
  const barcode = lineBarcode(line);
  return barcode ? `${name} (${barcode})` : name;
}

export function lineRemainingQuantity(line: any): number {
  return Number(line?.quantity) || 0;
}

export function lineReturnedQuantity(line: any): number {
  return Number(line?.returned_quantity) || 0;
}

export function lineOriginalQuantity(line: any): number {
  const original = Number(line?.original_quantity);
  if (original > 0) return original;
  return lineRemainingQuantity(line) + lineReturnedQuantity(line);
}

export function isLineFullyReturned(line: any): boolean {
  if (line?.is_fully_returned) return true;
  return lineRemainingQuantity(line) <= 0.0001 && lineReturnedQuantity(line) > 0.0001;
}

export function isLineReturnable(line: any): boolean {
  return lineRemainingQuantity(line) > 0.0001 && !line?.from_return_history;
}

export function purchaseTotalQuantity(purchase: any): number {
  return purchaseLines(purchase).reduce((sum, line) => {
    const remaining = lineRemainingQuantity(line);
    const returned = lineReturnedQuantity(line);
    // در هیستوری مجموع فروش اصلی را نشان بده (باقی‌مانده + برگشتی)
    return sum + (remaining > 0 || returned > 0 ? lineOriginalQuantity(line) : remaining);
  }, 0);
}

export function purchaseDistinctLineCount(purchase: any): number {
  return purchaseLines(purchase).length;
}

/** مجموع تعداد — برای ستون جدول */
export function formatPurchaseItemsTotal(purchase: any): string {
  const total = purchaseTotalQuantity(purchase);
  return total > 0 ? faQty(total) : "—";
}

function formatLineBreakdown(line: any): string {
  const name = lineDisplayWithBarcode(line);
  const remaining = lineRemainingQuantity(line);
  const returned = lineReturnedQuantity(line);
  if (isLineFullyReturned(line) || (remaining <= 0 && returned > 0)) {
    return `${name} ×${faQty(returned || lineOriginalQuantity(line))} (برگشت)`;
  }
  if (returned > 0) {
    return `${name} ×${faQty(remaining)} (برگشت ${faQty(returned)})`;
  }
  return `${name} ×${faQty(remaining)}`;
}

/** جزئیات هر قلم — مثلاً «کباب (123) ×۳، نوشابه (456) ×۲» */
export function formatPurchaseItemsBreakdown(purchase: any): string {
  const lines = purchaseLines(purchase);
  if (!lines.length) return "—";
  return lines.map(formatLineBreakdown).join("، ");
}

/** فقط بارکدهای اقلام فاکتور */
export function formatPurchaseBarcodes(purchase: any): string {
  const codes = purchaseLines(purchase)
    .map(lineBarcode)
    .filter((code) => code !== "");
  if (!codes.length) return "";
  return [...new Set(codes)].join("، ");
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
