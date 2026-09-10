import type { SettlementMode } from "@/app/admin/multiCartState";
import { formatAmountInput } from "@/app/lib/amountInput";
import { catalogItemKey, isProducedGoodItem, isRawMaterialItem } from "@/app/lib/catalogItems";
import type { PaymentType } from "@/app/lib/paymentTypes";

const PURCHASE_EDIT_STASH_KEY = "webinoo_purchase_edit_stash";
const PURCHASE_EDIT_STASH_MAX_AGE_MS = 30 * 60 * 1000;

function moneyField(n: number): string {
  return formatAmountInput(String(Math.max(0, Math.floor(n || 0))));
}

export type PurchaseEditApplyState = {
  cart: any[];
  total: number;
  phone: string;
  discounttype: number;
  discountDisplay: string;
  paymentType: PaymentType;
  installmentCount: number;
  useCreditAmount: number;
  selectedChequeId: number | null;
  settlementMode: SettlementMode;
  cardAmountInput: string;
  cashAmountInput: string;
  editingPurchaseId: number;
  editStockBonus: Record<string, number>;
  editHasReturns: boolean;
  editReuseCredit: boolean;
};

export type PurchaseEditPayload =
  | { ok: true; state: PurchaseEditApplyState }
  | { ok: false; reason: string };

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

export function stashPurchaseForEdit(purchase: any): void {
  if (typeof window === "undefined" || purchase?.id == null) return;
  try {
    sessionStorage.setItem(
      PURCHASE_EDIT_STASH_KEY,
      JSON.stringify({
        id: Number(purchase.id),
        savedAt: Date.now(),
        purchase,
      }),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function consumeStashedPurchaseForEdit(id: number | string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PURCHASE_EDIT_STASH_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PURCHASE_EDIT_STASH_KEY);
    const parsed = JSON.parse(raw) as { id: number; savedAt: number; purchase: any };
    if (Number(parsed.id) !== Number(id)) return null;
    if (Date.now() - Number(parsed.savedAt) > PURCHASE_EDIT_STASH_MAX_AGE_MS) return null;
    if (!parsed.purchase || !Array.isArray(parsed.purchase.purchased_products)) return null;
    return parsed.purchase;
  } catch {
    return null;
  }
}

export function buildPurchaseEditPayload(purchase: any, catalog: any[] = []): PurchaseEditPayload {
  const gate = canReplacePurchase(purchase);
  if (!gate.ok) {
    return { ok: false, reason: gate.reason };
  }

  const lines = Array.isArray(purchase.purchased_products) ? purchase.purchased_products : [];
  const cartItems = lines.map((line: any) => purchasedLineToCartItem(line, catalog));
  const totalAmt = cartItems.reduce(
    (sum: number, item: any) => sum + Number(item.sale_price) * Number(item.quantity),
    0,
  );
  const discount = Number(purchase.discount_amount) || 0;
  const card = Number(purchase.card_amount) || 0;
  const cash = Number(purchase.cash_amount) || 0;

  return {
    ok: true,
    state: {
      cart: cartItems,
      total: totalAmt,
      phone: typeof purchase.phone === "string" ? purchase.phone : "",
      discounttype: discount,
      discountDisplay: discount > 0 ? formatAmountInput(String(Math.floor(discount))) : "",
      paymentType: (purchase.payment_type || "cash") as PaymentType,
      installmentCount: Number(purchase.installment_count) || 2,
      useCreditAmount: Number(purchase.credit_used) > 0 ? Number(purchase.credit_used) : 0,
      selectedChequeId: purchase.cheque_id || purchase.cheque?.id || null,
      settlementMode: (card > 0 && cash > 0 ? "split" : cash > 0 ? "cash_all" : "card_all") as SettlementMode,
      cardAmountInput: moneyField(card),
      cashAmountInput: moneyField(cash),
      editingPurchaseId: Number(purchase.id),
      editStockBonus: purchaseEditStockBonus(lines),
      editHasReturns: purchaseHasReturns(purchase),
      editReuseCredit: Number(purchase.credit_used) > 0,
    },
  };
}

export function navigateToPurchaseEdit(
  router: { push: (href: string) => void },
  purchase: any,
): void {
  if (purchase?.id == null) return;
  stashPurchaseForEdit(purchase);
  router.push(purchaseEditHref(purchase.id));
}

export function isProducedOrRaw(item: any): boolean {
  return isProducedGoodItem(item) || isRawMaterialItem(item);
}
