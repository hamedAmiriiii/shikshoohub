import tokenCode from "@/app/coponent/tokenCode";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import { isProducedGoodItem } from "@/app/lib/catalogItems";
import type { CachedProduct } from "@/app/lib/productsCache";

export function menuProductNumericId(product: CachedProduct): number | null {
  if (isProducedGoodItem(product)) return null;
  const n = Number(product.product_id ?? product.id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function updateMenuProductFields(
  product: CachedProduct,
  patch: { quantity?: number; sale_price?: number },
): Promise<{ ok: true; product: CachedProduct } | { ok: false; message: string }> {
  const id = menuProductNumericId(product);
  if (!id) {
    return { ok: false, message: "این کالا از اینجا ویرایش نمی‌شود" };
  }

  const quantity =
    patch.quantity !== undefined ? patch.quantity : Number(product.quantity) || 0;
  const salePrice =
    patch.sale_price !== undefined
      ? patch.sale_price
      : Math.floor(Number(product.sale_price) || 0);

  const data = {
    name: product.name || "",
    barcode: product.barcode || "",
    purchase_price: String(Math.floor(Number(product.purchase_price) || 0)),
    sale_price: String(Math.floor(salePrice)),
    quantity: String(quantity),
  };

  const token = tokenCode();
  const res = await apiRequestError("Put", {}, data, `/api/product/${id}`, true, true, token);
  if (res?.hasError) {
    let message = "ویرایش نشد";
    try {
      const parsed = JSON.parse(res.errorText);
      if (typeof parsed?.message === "string" && parsed.message) message = parsed.message;
    } catch {
      if (typeof res.message === "string" && res.message) message = res.message;
    }
    return { ok: false, message };
  }

  return {
    ok: true,
    product: {
      ...product,
      quantity: patch.quantity !== undefined ? quantity : product.quantity,
      sale_price: patch.sale_price !== undefined ? salePrice : product.sale_price,
    },
  };
}
