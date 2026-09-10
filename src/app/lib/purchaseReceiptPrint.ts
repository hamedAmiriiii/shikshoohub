import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { dailyTicketFromRecord } from "@/app/lib/dailyTicketNumber";
import {
  getEnabledReceiptPrintStations,
  printReceiptStationsSequentially,
  type SaleReceiptData,
} from "@/app/lib/saleReceiptPrint";

export type PurchasesFilterMode = "today" | "week" | "month" | "range" | null;

export type PurchasesDateRange = Array<{
  year: number;
  month: { number: number };
  day: number;
}>;

export function getShopNameFromUser(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as Record<string, unknown>;
    const atelier = user.atelier as Record<string, unknown> | undefined;
    return (
      (user.atelier_name as string) ||
      (user.name as string) ||
      (user.shop_name as string) ||
      (atelier?.name as string) ||
      undefined
    );
  } catch {
    return undefined;
  }
}

export function buildPurchasesListApiUrl(
  filterMode: PurchasesFilterMode,
  dateRange: PurchasesDateRange = [],
): string {
  const base = "/api/purchased-products";

  if (filterMode === "range" && dateRange.length === 2) {
    const from_date = {
      year: dateRange[0].year,
      month: dateRange[0].month.number,
      day: dateRange[0].day,
    };
    const to_date = {
      year: dateRange[1].year,
      month: dateRange[1].month.number,
      day: dateRange[1].day,
    };
    return `${base}?filter=range&from_date=${encodeURIComponent(JSON.stringify(from_date))}&to_date=${encodeURIComponent(JSON.stringify(to_date))}`;
  }
  if (filterMode === "today") return `${base}?filter=today`;
  if (filterMode === "week") return `${base}?filter=week`;
  if (filterMode === "month") return `${base}?filter=month`;
  return base;
}

export function buildPurchasesBulkPrintQuery(
  filterMode: PurchasesFilterMode,
  dateRange: PurchasesDateRange = [],
): string {
  if (filterMode === "range" && dateRange.length === 2) {
    const from = `${dateRange[0].year}-${dateRange[0].month.number}-${dateRange[0].day}`;
    const to = `${dateRange[1].year}-${dateRange[1].month.number}-${dateRange[1].day}`;
    return `filter=range&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  }
  if (filterMode) return `filter=${filterMode}`;
  return "";
}

export function parsePurchasesBulkPrintQuery(searchParams: URLSearchParams): {
  filterMode: PurchasesFilterMode;
  dateRange: PurchasesDateRange;
} {
  const filter = searchParams.get("filter");
  if (filter === "range") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      const parsePart = (value: string) => {
        const [year, month, day] = value.split("-").map((part) => Number(part));
        return { year, month: { number: month }, day };
      };
      return { filterMode: "range", dateRange: [parsePart(from), parsePart(to)] };
    }
  }
  if (filter === "today" || filter === "week" || filter === "month") {
    return { filterMode: filter, dateRange: [] };
  }
  return { filterMode: null, dateRange: [] };
}

export function purchasesFilterLabel(
  filterMode: PurchasesFilterMode,
  dateRange: PurchasesDateRange = [],
): string {
  if (filterMode === "today") return "فروش امروز";
  if (filterMode === "week") return "فروش این هفته";
  if (filterMode === "month") return "فروش این ماه";
  if (filterMode === "range" && dateRange.length === 2) {
    const from = `${dateRange[0].year}/${dateRange[0].month.number}/${dateRange[0].day}`;
    const to = `${dateRange[1].year}/${dateRange[1].month.number}/${dateRange[1].day}`;
    return from === to ? `فروش ${from}` : `فروش ${from} تا ${to}`;
  }
  return "فروش";
}

export function purchaseToSaleReceipt(purchase: any, shopName?: string): SaleReceiptData {
  const products = Array.isArray(purchase?.purchased_products) ? purchase.purchased_products : [];
  const items = products.map((line: any) => {
    const quantity = Number(line.quantity) || 1;
    const unitPrice = Number(line.sale_price) || Number(line.product?.sale_price) || 0;
    return {
      id: line.id ?? line.product_id ?? line.produced_good_id,
      name:
        line.item_name ||
        line.product?.name ||
        line.produced_good?.name ||
        line.raw_material?.name ||
        "محصول",
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });

  const subtotal = Number(purchase?.total_amount) || items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = Number(purchase?.discount_amount) || 0;
  const creditUsed = Number(purchase?.credit_used) || 0;
  const finalTotal = Math.max(0, subtotal - discount - creditUsed);
  const cardAmount = Number(purchase?.card_amount) || 0;
  const cashAmount = Number(purchase?.cash_amount) || 0;

  let settlementMode: SaleReceiptData["settlementMode"];
  if (cardAmount > 0.001 && cashAmount > 0.001) settlementMode = "split";
  else if (cardAmount > 0.001) settlementMode = "card_all";
  else if (cashAmount > 0.001) settlementMode = "cash_all";

  const paymentType = purchase?.payment_type as SaleReceiptData["paymentType"];
  let payableNow = finalTotal;
  if (paymentType === "installment") {
    payableNow = Number(purchase?.installment_amount) || finalTotal;
  } else if (paymentType === "debt") {
    payableNow = Number(purchase?.payable_amount) ?? finalTotal;
  } else if (paymentType === "cheque") {
    payableNow = Number(purchase?.immediate_paid_amount) || cardAmount + cashAmount || finalTotal;
  } else if (settlementMode === "split" || settlementMode === "card_all" || settlementMode === "cash_all") {
    payableNow = cardAmount + cashAmount || finalTotal;
  }

  const rawCreated = purchase?.created_at || purchase?.createdAt;
  const createdAt = rawCreated
    ? String(rawCreated).includes("T")
      ? String(rawCreated)
      : String(rawCreated).replace(" ", "T")
    : new Date().toISOString();

  return {
    purchaseId: purchase?.id,
    createdAt,
    shopName: shopName || getShopNameFromUser(),
    phone: purchase?.phone || undefined,
    tableLabel: purchase?.table_label || undefined,
    items,
    subtotal,
    discount,
    creditUsed,
    backPrice: 0,
    finalTotal,
    payableNow,
    paymentType,
    settlementMode,
    cardAmount: cardAmount > 0 ? cardAmount : undefined,
    cashAmount: cashAmount > 0 ? cashAmount : undefined,
    installmentCount:
      paymentType === "installment" ? Number(purchase?.installment_count) || undefined : undefined,
    installmentAmount:
      paymentType === "installment" ? Number(purchase?.installment_amount) || undefined : undefined,
    chequeId: paymentType === "cheque" ? purchase?.cheque_id ?? purchase?.cheque?.id : undefined,
    chequeNumber: purchase?.cheque?.cheque_number || undefined,
    dailyTicketNumber: dailyTicketFromRecord(purchase) ?? undefined,
  };
}

export async function fetchAllPurchases(baseUrl: string): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const res = await FetchWithJwtClient("GET", `${baseUrl}${separator}page=${page}`, null, {});
    if (!res?.data || !Array.isArray(res.data)) break;
    all.push(...res.data);
    lastPage = Number(res.last_page) || 1;
    page += 1;
  } while (page <= lastPage);

  return all;
}

export function purchasesToSaleReceipts(purchases: any[], shopName?: string): SaleReceiptData[] {
  return purchases
    .slice()
    .reverse()
    .map((purchase) => purchaseToSaleReceipt(purchase, shopName));
}

export async function printAllSaleReceipts(
  receipts: SaleReceiptData[],
  settings: import("@/app/lib/saleReceiptPrint").SaleReceiptPrintSettings,
): Promise<void> {
  if (!receipts.length) return;

  const { canSilentPrint, silentPrintReceiptStations } = await import("@/app/lib/qzSilentPrint");
  if (canSilentPrint(settings)) {
    try {
      for (const receipt of receipts) {
        await silentPrintReceiptStations(receipt, settings);
      }
      return;
    } catch {
      // Fall back to browser print dialog for all tickets in the preview.
    }
  }

  await printReceiptStationsSequentially(getEnabledReceiptPrintStations(settings));
}
