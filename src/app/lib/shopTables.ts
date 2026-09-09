import { getLastShopCode, shopPath } from "@/app/lib/shopStorefront";
import {
  getDebtInvoiceAmount,
  type PurchaseDebtInvoice,
  type PurchaseDebtProduct,
} from "@/app/lib/purchaseDebts";
import type { SaleReceiptData } from "@/app/lib/saleReceiptPrint";
import { dailyTicketFromRecord } from "@/app/lib/dailyTicketNumber";

export type ShopPlaceKind = "table" | "room";

export type ShopTable = {
  id: number;
  shop_id?: number;
  number: number;
  kind?: ShopPlaceKind;
  name?: string | null;
  label?: string | null;
  is_active?: boolean;
};

export type TablePaymentMethod = {
  key: "online" | "card_to_card" | "pos" | string;
  label: string;
  card_number?: string;
  card_holder?: string;
  bank_name?: string;
};

export const DEFAULT_TABLE_PAYMENT_METHODS: TablePaymentMethod[] = [
  { key: "online", label: "آنلاین" },
  { key: "card_to_card", label: "کارت به کارت" },
  { key: "pos", label: "کارتخوان فروشگاه" },
];

export type ShopTableInfo = {
  table: ShopTable | null;
  shopName?: string;
  shopCode?: string;
  label: string;
  kind?: ShopPlaceKind;
  allowMenu?: boolean;
  allowServices?: boolean;
  paymentMethods?: TablePaymentMethod[];
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
  payment_method?: string;
  payment_method_label?: string;
  has_receipt?: boolean;
  receipt_url?: string | null;
  phone?: string | null;
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
  purchase?: { daily_ticket_number?: number; dailyTicketNumber?: number };
  daily_ticket_number?: number;
  dailyTicketNumber?: number;
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
    kind: normalizePlaceKind(nested.kind),
    name,
    label: typeof nested.label === "string" ? nested.label : name,
    is_active: nested.is_active === false ? false : true,
  };
}

export function normalizePlaceKind(value: unknown): ShopPlaceKind {
  const raw = String(value || "").trim().toLowerCase();
  return raw === "room" || raw === "اتاق" ? "room" : "table";
}

export function shopPlaceNoun(kind?: ShopPlaceKind | null): string {
  return kind === "room" ? "اتاق" : "میز";
}

export function shopTableDisplayName(
  table: Pick<ShopTable, "number" | "name" | "label" | "kind">,
): string {
  const named = (table.name || table.label || "").trim();
  if (named) return named;
  return `${shopPlaceNoun(table.kind)} ${table.number}`;
}

export function extractShopTables(res: unknown): ShopTable[] {
  return extractList(res, ["data", "tables", "items"])
    .map(normalizeShopTable)
    .filter((table): table is ShopTable => table != null)
    .sort((a, b) => a.number - b.number);
}

export function extractPaymentMethods(res: unknown): TablePaymentMethod[] {
  const obj = asRecord(res);
  const nested = asRecord(obj?.data);
  const shop = asRecord(obj?.shop);
  const raw = obj?.payment_methods ?? nested?.payment_methods ?? shop?.payment_methods;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = asRecord(item);
      if (!row || typeof row.key !== "string" || !row.key) return null;
      return {
        key: row.key,
        label: typeof row.label === "string" && row.label ? row.label : row.key,
        card_number: typeof row.card_number === "string" ? row.card_number : undefined,
        card_holder: typeof row.card_holder === "string" ? row.card_holder : undefined,
        bank_name: typeof row.bank_name === "string" ? row.bank_name : undefined,
      };
    })
    .filter((item) => item != null);
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
  const objKind = normalizePlaceKind(obj?.kind ?? table?.kind);
  const allowMenu = obj?.allow_menu;
  const allowServices = obj?.allow_services;
  return {
    table,
    shopName,
    shopCode,
    kind: objKind,
    allowMenu: allowMenu === false ? false : allowMenu === true ? true : undefined,
    allowServices: allowServices === false ? false : allowServices === true ? true : undefined,
    label: table ? shopTableDisplayName(table) : `${shopPlaceNoun(objKind)} ${fallbackNumber}`,
    paymentMethods: extractPaymentMethods(res),
  };
}

export function extractTableOrders(res: unknown): TableOrder[] {
  return extractList<TableOrder>(res, ["table_orders", "data", "orders", "purchases", "items"]).map((item) => {
    const obj = asRecord(item) || {};
    const table = normalizeShopTable(obj.shop_table || obj.table);
    const id = toNumber(obj.id) ?? toNumber(obj.purchase_id) ?? 0;
    return {
      ...(item as TableOrder),
      id,
      purchase_id: toNumber(obj.purchase_id) ?? undefined,
      shop_table_id: toNumber(obj.shop_table_id) ?? table?.id,
      table_number: toNumber(obj.table_number) ?? table?.number,
      table_label:
        (typeof obj.table_label === "string" && obj.table_label) ||
        (table ? shopTableDisplayName(table) : undefined),
      has_receipt: Boolean(obj.has_receipt ?? obj.receipt_url ?? obj.receipt_path),
      receipt_url: typeof obj.receipt_url === "string" ? obj.receipt_url : null,
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

export function tablePaymentMethodLabel(order: Pick<TableOrder, "payment_method" | "payment_method_label">): string {
  if (order.payment_method_label) return order.payment_method_label;
  const found = DEFAULT_TABLE_PAYMENT_METHODS.find((item) => item.key === order.payment_method);
  return found?.label || order.payment_method || "";
}

export function tableOrderToSaleReceipt(order: TableOrder, shopName?: string): SaleReceiptData {
  const products = getTableOrderProducts(order);
  const items = products.map((product) => {
    const quantity = Number(product.quantity) || 1;
    const unitPrice = Number(product.sale_price) || Number(product.unit_price) || 0;
    const lineTotal = Number(product.line_total) || unitPrice * quantity;
    const itemNote = String(
      (product as { note?: string | null }).note ||
        (product as { notes?: string | null }).notes ||
        "",
    ).trim();
    return {
      id: product.id ?? product.product_id,
      name: product.product_name || product.name || "محصول",
      quantity,
      unitPrice,
      lineTotal,
      note: itemNote || undefined,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0) || getTableOrderAmount(order);
  const method = order.payment_method;
  const tableLabel = order.table_label || (order.table_number != null ? `میز ${order.table_number}` : "");
  const payLabel = tablePaymentMethodLabel(order);
  const created = order.created_at ? String(order.created_at).replace(" ", "T") : new Date().toISOString();

  return {
    purchaseId: order.purchase_id ?? order.id,
    createdAt: created,
    shopName,
    phone: order.phone || undefined,
    tableLabel: tableLabel || undefined,
    items,
    subtotal,
    discount: 0,
    creditUsed: 0,
    backPrice: 0,
    finalTotal: subtotal,
    payableNow: subtotal,
    paymentType: method === "online" ? "online" : "cash",
    settlementMode: method === "card_to_card" || method === "pos" ? "card_all" : undefined,
    cardAmount: method === "card_to_card" || method === "pos" ? subtotal : undefined,
    footerNote: payLabel || undefined,
    customerNote: order.note?.trim() || undefined,
    dailyTicketNumber: dailyTicketFromRecord(order) ?? undefined,
  };
}

export function tableOrderToDebtInvoice(order: TableOrder): PurchaseDebtInvoice {
  return {
    id: order.id,
    purchase_id: order.purchase_id,
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

export function tableReservPath(
  shopCode: string,
  tableNumber: number,
  kind: ShopPlaceKind = "table",
): string {
  return shopPath(shopCode, kind === "room" ? `/room/${tableNumber}` : `/reserv/${tableNumber}`);
}

export function tableReservAbsoluteUrl(
  shopCode: string,
  tableNumber: number,
  kind: ShopPlaceKind = "table",
): string {
  const path = tableReservPath(shopCode, tableNumber, kind);
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function getAdminRestaurantName(): string {
  if (typeof window === "undefined") return "";
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as Record<string, unknown>;
    const atelier = asRecord(user.atelier);
    const candidates = [
      user.atelier_name,
      user.shop_name,
      atelier?.name,
      atelier?.atelier_name,
      atelier?.shop_name,
    ];
    for (const value of candidates) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  } catch {
    // ignore
  }
  return "";
}

export type TableQrPosterTheme = "luxury" | "simple";

const TABLE_QR_POSTER_THEME_KEY = "table_qr_poster_theme";

export function readTableQrPosterTheme(): TableQrPosterTheme {
  if (typeof window === "undefined") return "luxury";
  return localStorage.getItem(TABLE_QR_POSTER_THEME_KEY) === "simple" ? "simple" : "luxury";
}

export function writeTableQrPosterTheme(theme: TableQrPosterTheme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TABLE_QR_POSTER_THEME_KEY, theme);
}

export function tableQrImageUrl(url: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&format=svg&data=${encodeURIComponent(url)}`;
}

const GOLD = "#d4af37";
const GOLD_LIGHT = "#f0d77a";
const GOLD_DARK = "#8a6d1f";
const INK = "#14110c";
const BG = "#161616";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgDataUrl(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function parseQrSvg(svgText: string): { content: string; size: number } {
  const viewBox = svgText.match(/viewBox=["']([^"']+)["']/i);
  let size = 29;
  if (viewBox) {
    const parts = viewBox[1].trim().split(/[\s,]+/).map(Number);
    if (Number.isFinite(parts[2]) && parts[2] > 0) size = parts[2];
  } else {
    const wh = svgText.match(/\bwidth=["'](\d+(?:\.\d+)?)["']/i);
    if (wh) size = Number(wh[1]) || size;
  }
  const content = svgText.replace(/^[\s\S]*?<svg[^>]*>/i, "").replace(/<\/svg>[\s\S]*$/i, "");
  return { content, size };
}

async function fetchQrSvgMarkup(link: string, size = 512): Promise<string> {
  const qrUrl = tableQrImageUrl(link, size);
  const res = await fetch(qrUrl);
  if (!res.ok) throw new Error("qr fetch failed");
  const text = await res.text();
  if (!/<svg/i.test(text)) throw new Error("qr svg invalid");
  return text;
}

function composeSimpleQrSvg(qr: { content: string; size: number }): string {
  const card = 340;
  const scale = card / qr.size;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${card} ${card}" width="${card}" height="${card}">
  <rect width="${card}" height="${card}" fill="#ffffff"/>
  <g transform="scale(${scale})">${qr.content}</g>
</svg>`;
}

function composeLuxuryQrSvg(
  qr: { content: string; size: number },
  tableTitle: string,
  restaurantName: string,
): string {
  const cardW = 340;
  const cardH = 340;
  const shop = restaurantName.trim() || "رستوران";
  const table = tableTitle.trim() || "میز";
  const gid = `g${Math.abs(hashCode(`${shop}|${table}|${qr.size}`)).toString(36)}`;
  const plaqueW = cardW - 48;
  const plaqueH = 40;
  const plaqueX = 24;
  const plaqueY = 18;
  const qrBox = 208;
  const qrX = (cardW - qrBox) / 2;
  const qrY = plaqueY + plaqueH + 10;
  const inner = 10;
  const qrFit = qrBox - inner * 2;
  const qrScale = qrFit / qr.size;
  const footerY = qrY + qrBox + 22;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cardW} ${cardH}" width="${cardW}" height="${cardH}">
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GOLD_LIGHT}"/>
      <stop offset="0.45" stop-color="${GOLD}"/>
      <stop offset="1" stop-color="${GOLD_DARK}"/>
    </linearGradient>
    <style type="text/css"><![CDATA[
      .qr-fa { font-family: Vazirmatn, IRANSans, Tahoma, sans-serif; }
      .qr-fancy { font-family: Lalezar, Vazirmatn, Tahoma, sans-serif; }
    ]]></style>
  </defs>
  <rect width="${cardW}" height="${cardH}" rx="22" fill="${BG}"/>
  <rect x="7" y="7" width="${cardW - 14}" height="${cardH - 14}" rx="16" fill="none" stroke="${GOLD}" stroke-width="1.6"/>
  <rect x="${plaqueX}" y="${plaqueY}" width="${plaqueW}" height="${plaqueH}" rx="8" fill="url(#${gid})"/>
  <text class="qr-fa" x="${plaqueX + 14}" y="${plaqueY + plaqueH / 2 + 4}" fill="${INK}" font-size="12" font-weight="600">${escapeXml(table)}</text>
  <text class="qr-fa" x="${plaqueX + plaqueW - 14}" y="${plaqueY + plaqueH / 2 + 4}" fill="${INK}" font-size="13" font-weight="700" text-anchor="end">${escapeXml(shop)}</text>
  <path d="M${qrX - 10} ${qrY + 12} C${qrX - 28} ${qrY + 40}, ${qrX - 16} ${qrY + 100}, ${qrX - 26} ${qrY + 162}" fill="none" stroke="rgba(212,175,55,0.32)" stroke-width="1"/>
  <path d="M${qrX + qrBox + 10} ${qrY + 12} C${qrX + qrBox + 28} ${qrY + 40}, ${qrX + qrBox + 16} ${qrY + 100}, ${qrX + qrBox + 26} ${qrY + 162}" fill="none" stroke="rgba(212,175,55,0.32)" stroke-width="1"/>
  <rect x="${qrX}" y="${qrY}" width="${qrBox}" height="${qrBox}" rx="10" fill="#ffffff" stroke="${GOLD}" stroke-width="1.25"/>
  <g transform="translate(${qrX + inner} ${qrY + inner}) scale(${qrScale})">${qr.content}</g>
  <text class="qr-fancy" x="${cardW / 2}" y="${footerY}" fill="${GOLD_LIGHT}" font-size="13" text-anchor="middle">اسکن کنید و سفارش ثبت کنید</text>
  <line x1="${cardW / 2 - 52}" y1="${footerY + 14}" x2="${cardW / 2 - 8}" y2="${footerY + 14}" stroke="${GOLD_DARK}" stroke-width="1"/>
  <line x1="${cardW / 2 + 8}" y1="${footerY + 14}" x2="${cardW / 2 + 52}" y2="${footerY + 14}" stroke="${GOLD_DARK}" stroke-width="1"/>
  <polygon points="${cardW / 2},${footerY + 10} ${cardW / 2 + 5},${footerY + 14} ${cardW / 2},${footerY + 18} ${cardW / 2 - 5},${footerY + 14}" fill="${GOLD}"/>
</svg>`;
}

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export async function composeTableQrPoster(
  link: string,
  tableTitle: string,
  restaurantName = "",
  qrSize = 220,
  theme: TableQrPosterTheme = "luxury",
): Promise<string> {
  const qr = parseQrSvg(await fetchQrSvgMarkup(link, Math.max(qrSize, 400)));
  const markup =
    theme === "simple" ? composeSimpleQrSvg(qr) : composeLuxuryQrSvg(qr, tableTitle, restaurantName);
  return svgDataUrl(markup);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.rel = "noopener";
  a.download = filename;
  if (dataUrl.startsWith("data:image/svg+xml")) {
    const comma = dataUrl.indexOf(",");
    const meta = dataUrl.slice(0, comma);
    const body = dataUrl.slice(comma + 1);
    const svg = meta.includes(";base64") ? atob(body) : decodeURIComponent(body);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  }
  a.href = dataUrl;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
