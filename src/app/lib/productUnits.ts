export type ProductUnitType = "kg" | "meter" | "piece";

export type ProductUnitFields = {
  unit_type?: ProductUnitType | string;
  unit_label?: string;
  price_unit_label?: string;
};

export function isKgProduct(item: ProductUnitFields | null | undefined): boolean {
  return item?.unit_type === "kg";
}

export function isMeterProduct(item: ProductUnitFields | null | undefined): boolean {
  return item?.unit_type === "meter";
}

/** کیلو و متر هر دو مقدار اعشاری دارند */
export function isMeasuredProduct(item: ProductUnitFields | null | undefined): boolean {
  return isKgProduct(item) || isMeterProduct(item);
}

export function getUnitLabel(item: ProductUnitFields | null | undefined): string {
  if (item?.unit_label) return item.unit_label;
  if (isKgProduct(item)) return "کیلو";
  if (isMeterProduct(item)) return "متر";
  return "عدد";
}

export function getPriceUnitLabel(item: ProductUnitFields | null | undefined): string {
  if (item?.price_unit_label) return item.price_unit_label;
  if (isKgProduct(item)) return "هر کیلو";
  if (isMeterProduct(item)) return "هر متر";
  return "هر عدد";
}

export function formatProductQuantity(
  quantity: number,
  item: ProductUnitFields | null | undefined,
): string {
  if (isMeasuredProduct(item)) {
    const fixed = Number(quantity.toFixed(3));
    return new Intl.NumberFormat("fa-IR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(fixed);
  }
  return new Intl.NumberFormat("fa-IR").format(Math.floor(quantity));
}

export function normalizeQuantityValue(
  quantity: number,
  item: ProductUnitFields | null | undefined,
): number {
  if (isMeasuredProduct(item)) {
    const rounded = Math.round(quantity * 1000) / 1000;
    return rounded > 0 ? rounded : 0;
  }
  return Math.max(0, Math.floor(quantity));
}

export function getQuantityIncrement(item: ProductUnitFields | null | undefined): number {
  return isMeasuredProduct(item) ? 0.1 : 1;
}

export function getDefaultCartQuantity(item: ProductUnitFields | null | undefined): number {
  return 1;
}

export function getMinQuantity(item: ProductUnitFields | null | undefined): number {
  return isMeasuredProduct(item) ? 0.001 : 1;
}

/** پارس ورودی مقدار — برای کیلو و متر اعشاری، برای عدد صحیح */
export function parseQuantityInput(
  value: string,
  item: ProductUnitFields | null | undefined,
): number | null {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  let normalized = value
    .trim()
    .replace(/[۰-۹]/g, (c) => String(persianDigits.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(arabicDigits.indexOf(c)))
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");

  if (normalized === "" || normalized === ".") return null;

  if (isMeasuredProduct(item)) {
    const n = parseFloat(normalized);
    return Number.isNaN(n) ? null : n;
  }

  const n = parseInt(normalized.replace(/\./g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

export function formatSalePriceLabel(
  salePrice: number | string,
  item: ProductUnitFields | null | undefined,
  formatNumber: (n: number) => string,
): string {
  const price = formatNumber(Number(salePrice) || 0);
  const unit = getPriceUnitLabel(item);
  return `${price} (${unit})`;
}
