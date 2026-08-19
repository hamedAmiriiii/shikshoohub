/** فیلدهای تخفیف محصول برای چاپ لیبل */
export type ProductLabelDiscountSource = {
  has_discount?: boolean;
  original_sale_price?: number | string | null;
  discount_percent?: number | string | null;
  sale_price?: number | string | null;
};

export function getProductDiscountPrintMeta(product: ProductLabelDiscountSource) {
  const sale = Number(product.sale_price) || 0;
  const original = Number(product.original_sale_price) || 0;
  const hasDiscount =
    Boolean(product.has_discount) || (original > 0 && sale > 0 && original > sale);

  let discountPercent =
    product.discount_percent != null && product.discount_percent !== ""
      ? String(product.discount_percent).replace(/%/g, "")
      : "";

  if (!discountPercent && hasDiscount && original > sale) {
    discountPercent = String(Math.round((1 - sale / original) * 100));
  }

  return {
    hasDiscount,
    originalPrice: hasDiscount && original > sale ? String(original) : "",
    discountPercent,
  };
}

export function appendProductLabelPrintParams(
  params: URLSearchParams,
  product: ProductLabelDiscountSource
) {
  const { hasDiscount, originalPrice, discountPercent } = getProductDiscountPrintMeta(product);
  if (hasDiscount) {
    params.set("hasDiscount", "1");
    if (originalPrice) params.set("originalPrice", originalPrice);
    if (discountPercent) params.set("discountPercent", discountPercent);
  }
  return params;
}

export function parseProductLabelDiscountFromSearchParams(searchParams: URLSearchParams) {
  const hasDiscount = searchParams.get("hasDiscount") === "1";
  const originalPrice = searchParams.get("originalPrice") || "";
  const discountPercent = searchParams.get("discountPercent") || "";
  return { hasDiscount, originalPrice, discountPercent };
}
