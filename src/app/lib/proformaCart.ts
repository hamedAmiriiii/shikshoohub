import type { SaleReceiptData } from "@/app/lib/saleReceiptPrint";
import { saveSaleReceiptPrintData } from "@/app/lib/saleReceiptPrint";

export const PROFORMA_CART_LOAD_KEY = "admin_proforma_cart_load";

export type ProformaStoredItem = {
  name?: string;
  quantity?: number | string;
  sale_price?: number | string;
  purchase_price?: number | string;
  product_id?: number | string;
  produced_good_id?: number | string;
  raw_material_id?: number | string;
  size?: string;
  color?: string;
};

export type ProformaCartLoad = {
  id: number;
  phone?: string | null;
  discount_amount?: number | string;
  total_amount?: number | string;
  created_at?: string;
  items: ProformaStoredItem[];
};

export function writeProformaCartLoad(payload: ProformaCartLoad): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PROFORMA_CART_LOAD_KEY, JSON.stringify(payload));
}

export function consumeProformaCartLoad(): ProformaCartLoad | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PROFORMA_CART_LOAD_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PROFORMA_CART_LOAD_KEY);
  try {
    const parsed = JSON.parse(raw) as ProformaCartLoad;
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function proformaItemsToCart(items: ProformaStoredItem[]): any[] {
  return items
    .map((line) => {
      const quantity = Number(line.quantity);
      const salePrice = Number(line.sale_price) || 0;
      const row: Record<string, unknown> = {
        name: String(line.name || "کالا"),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        sale_price: salePrice,
        default_sale_price: salePrice,
        purchase_price: Number(line.purchase_price) || 0,
        unit_type: "piece",
      };
      if (line.size) row.size = line.size;
      if (line.color) row.color = line.color;
      const producedId = Number(line.produced_good_id);
      const rawId = Number(line.raw_material_id);
      const productId = Number(line.product_id);
      if (Number.isFinite(producedId) && producedId > 0) {
        return { ...row, id: producedId, produced_good_id: producedId, item_type: "produced_good" };
      }
      if (Number.isFinite(rawId) && rawId > 0) {
        return { ...row, id: rawId, raw_material_id: rawId, item_type: "raw_material" };
      }
      if (Number.isFinite(productId) && productId > 0) {
        return { ...row, id: productId, product_id: productId };
      }
      return null;
    })
    .filter((row): row is Record<string, unknown> => row != null);
}

export function proformaToSaleReceipt(
  row: ProformaCartLoad,
  shopName?: string,
): SaleReceiptData {
  const items = (row.items || []).map((line) => {
    const quantity = Number(line.quantity) || 0;
    const unitPrice = Number(line.sale_price) || 0;
    return {
      name: String(line.name || "کالا"),
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = Math.max(0, Number(row.discount_amount) || 0);
  const finalTotal = Math.max(0, subtotal - discount);
  return {
    createdAt: row.created_at || new Date().toISOString(),
    shopName,
    phone: row.phone || undefined,
    items,
    subtotal,
    discount,
    creditUsed: 0,
    backPrice: 0,
    finalTotal,
    payableNow: finalTotal,
    footerNote: row.id ? `پیش‌فاکتور ${row.id}` : "پیش‌فاکتور",
  };
}

export function printProformaReceipt(
  receipt: SaleReceiptData,
): { ok: true } | { ok: false; message: string } {
  saveSaleReceiptPrintData(receipt);
  const opened = window.open("/admin/print/sale?proforma=1", "_blank", "noopener,noreferrer");
  if (!opened) {
    return { ok: false, message: "پنجره چاپ باز نشد. اجازه باز شدن پنجره را بدهید." };
  }
  return { ok: true };
}
