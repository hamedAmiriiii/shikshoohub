import { getLastShopCode, shopPath } from "@/app/lib/shopStorefront";
import {
  getDebtInvoiceAmount,
  type PurchaseDebtInvoice,
  type PurchaseDebtProduct,
} from "@/app/lib/purchaseDebts";

export type ShopTable = {
  id: number;
  shop_id?: number;
  number: number;
  name?: string | null;
  label?: string | null;
  is_active?: boolean;
};

export type ShopTableInfo = {
  table: ShopTable | null;
  shopName?: string;
  shopCode?: string;
  label: string;
};

export type TableOrderProduct = PurchaseDebtProduct & {
  quantity?: number;
  sale_price?: number;
};

export type TableOrder = {
  id: number;
  purchase_id?: number;
  shop_table_id?: number;
  table_number?: number;
  table_label?: string;
  note?: string | null;
  payment_type?: string;
  is_debt_settled?: boolean;
  status?: string;
  total_amount?: number;
  payable_amount?: number;
  debt_amount?: number;
  amount?: number;
  created_at?: string;
  products?: TableOrderProduct[];
  items?: TableOrderProduct[];
  shop_table?: ShopTable;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function extractList<T>(res: unknown, keys: string[] = ["data", "tables", "items"]): T[] {
  if (Array.isArray(res)) return res as T[];
  const obj = asRecord(res);
  if (!obj || obj.hasError) return [];
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value as T[];
  }
  const nested = asRecord(obj.data);
  if (nested) {
    for (const key of keys) {
      const value = nested[key];
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}

export function normalizeShopTable(raw: unknown): ShopTable | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const nested = asRecord(obj.table) ?? obj;
  const id = toNumber(nested.id);
  const number = toNumber(nested.number ?? nested.table_number ?? nested.n);
  if (id == null || number == null) return null;
  const name =
    (typeof nested.name === "string" && nested.name) ||
    (typeof nested.label === "string" && nested.label) ||
    null;
  return {
    id,
    shop_id: toNumber(nested.shop_id) ?? undefined,
    number,
    name,
    label: typeof nested.label === "string" ? nested.label : name,
    is_active: nested.is_active === false ? false : true,
  };
}

export function shopTableDisplayName(table: Pick<ShopTable, "number" | "name" | "label">): string {
  const named = (table.name || table.label || "").trim();
  if (named) return named;
  return `میز ${table.number}`;
}

export function extractShopTables(res: unknown): ShopTable[] {
  return extractList(res, ["data", "tables", "items"])
    .map(normalizeShopTable)
    .filter((table): table is ShopTable => table != null)
    .sort((a, b) => a.number - b.number);
}

export function extractShopTableInfo(res: unknown, fallbackNumber: number): ShopTableInfo {
  const obj = asRecord(res);
  const table =
    normalizeShopTable(obj?.table) ||
    normalizeShopTable(obj?.data) ||
    normalizeShopTable(res);
  const shop = asRecord(obj?.shop) || asRecord(asRecord(obj?.data)?.shop);
  const shopName =
    (typeof shop?.name === "string" && shop.name) ||
    (typeof obj?.shop_name === "string" && obj.shop_name) ||
    undefined;
  const shopCode =
    (typeof shop?.code === "string" && shop.code) ||
    (typeof obj?.shop_code === "string" && obj.shop_code) ||
    undefined;
  return {
    table,
    shopName,
    shopCode,
    label: table ? shopTableDisplayName(table) : `میز ${fallbackNumber}`,
  };
}

export function extractTableOrders(res: unknown): TableOrder[] {
  return extractList<TableOrder>(res, ["data", "orders", "purchases", "items"]).map((item) => {
    const obj = asRecord(item) || {};
    const table = normalizeShopTable(obj.shop_table || obj.table);
    const id = toNumber(obj.id) ?? toNumber(obj.purchase_id) ?? 0;
    return {
      ...(item as TableOrder),
      id,
      purchase_id: toNumber(obj.purchase_id) ?? id,
      shop_table_id: toNumber(obj.shop_table_id) ?? table?.id,
      table_number: toNumber(obj.table_number) ?? table?.number,
      table_label:
        (typeof obj.table_label === "string" && obj.table_label) ||
        (table ? shopTableDisplayName(table) : undefined),
      shop_table: table ?? undefined,
    };
  });
}

export function getTableOrderProducts(order: TableOrder): TableOrderProduct[] {
  return order.products || order.items || [];
}

export function getTableOrderAmount(order: TableOrder): number {
  return getDebtInvoiceAmount(order as PurchaseDebtInvoice);
}

export function tableOrderToDebtInvoice(order: TableOrder): PurchaseDebtInvoice {
  return {
    id: order.purchase_id ?? order.id,
    purchase_id: order.purchase_id ?? order.id,
    payment_type: order.payment_type || "debt",
    total_amount: getTableOrderAmount(order),
    payable_amount: order.payable_amount,
    debt_amount: order.debt_amount ?? getTableOrderAmount(order),
    amount: order.amount,
    created_at: order.created_at,
    is_debt_settled: order.is_debt_settled === true,
    status: order.is_debt_settled ? "settled" : "pending",
    products: getTableOrderProducts(order),
    items: order.items,
  };
}

export function getAdminShopCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as Record<string, unknown>;
    const atelier = asRecord(user.atelier);
    const candidates = [
      user.shop_code,
      user.code,
      user.atelier_code,
      atelier?.code,
    ];
    for (const value of candidates) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  } catch {
    // ignore
  }
  return getLastShopCode();
}

export function tableReservPath(shopCode: string, tableNumber: number): string {
  return shopPath(shopCode, `/reserv/${tableNumber}`);
}

export function tableReservAbsoluteUrl(shopCode: string, tableNumber: number): string {
  const path = tableReservPath(shopCode, tableNumber);
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function tableQrImageUrl(url: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}
