import React from "react";
import { getProductDiscountPrintMeta } from "@/app/lib/productLabelPrint";

const formatNumberEnglish = (num: number | string) => {
  const numValue = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (isNaN(numValue)) return "";
  return new Intl.NumberFormat("en-US").format(numValue);
};

type LabelPriceBlockProps = {
  salePrice: number | string;
  originalSalePrice?: number | string;
  discountPercent?: number | string;
  hasDiscount?: boolean;
  fontSize?: number;
  className?: string;
  showPrice?: boolean;
  showDiscount?: boolean;
};

export default function LabelPriceBlock({
  salePrice,
  originalSalePrice,
  discountPercent,
  hasDiscount: hasDiscountProp,
  fontSize = 16,
  className = "price",
  showPrice = true,
  showDiscount = true,
}: LabelPriceBlockProps) {
  const meta = getProductDiscountPrintMeta({
    has_discount: hasDiscountProp,
    original_sale_price: originalSalePrice,
    discount_percent: discountPercent,
    sale_price: salePrice,
  });

  const showDiscountBits = showDiscount && meta.hasDiscount;
  if (!showPrice && !showDiscountBits) return null;

  if (!showDiscountBits) {
    return (
      <div className={className} style={{ fontWeight: "bold", fontSize, color: "#333" }}>
        {formatNumberEnglish(salePrice)}
      </div>
    );
  }

  const smallSize = Math.max(7, fontSize - 6);
  const pctSize = Math.max(7, fontSize - 7);

  return (
    <div className={`${className}-block`} style={{ lineHeight: 1.15, marginTop: 1 }}>
      {meta.originalPrice ? (
        <div
          className={`${className}-original`}
          style={{
            fontSize: smallSize,
            textDecoration: "line-through",
            color: "#666",
          }}
        >
          {formatNumberEnglish(meta.originalPrice)}
        </div>
      ) : null}
      {showPrice ? (
        <div
          className={`${className}-sale`}
          style={{ fontWeight: "bold", fontSize, color: "#000" }}
        >
          {formatNumberEnglish(salePrice)}
        </div>
      ) : null}
      {meta.discountPercent ? (
        <div
          className={`${className}-pct`}
          style={{ fontSize: pctSize, color: "#c62828", fontWeight: 700 }}
        >
          {meta.discountPercent}%
        </div>
      ) : null}
    </div>
  );
}
