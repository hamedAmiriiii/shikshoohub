export type FormalParty = {
  phone?: string | null;
  full_name?: string | null;
  legal_name?: string | null;
  brand_name?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
  economic_code?: string | null;
  national_id?: string | null;
  registration_number?: string | null;
  fixed_notes?: string | null;
};

export type FormalInvoiceLine = {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  discount: number;
  afterDiscount: number;
  tax: number;
  grand: number;
};

/** قیمت‌های برنامه تومان است؛ فاکتور رسمی باید ریال باشد. */
export const TOMAN_TO_RIAL = 10;

export function tomanToRial(toman: number): number {
  const n = Number(toman);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * TOMAN_TO_RIAL);
}

const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
];
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const HUNDREDS = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
];
const SCALES = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

function threeDigitsToWords(n: number): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  const parts: string[] = [];
  if (h) parts.push(HUNDREDS[h]);
  if (t === 1) {
    parts.push(TEENS[o]);
  } else {
    if (t) parts.push(TENS[t]);
    if (o) parts.push(ONES[o]);
  }
  return parts.join(" و ");
}

/** تبدیل عدد صحیح به حروف فارسی (برای جمع فاکتور) */
export function numberToPersianWords(value: number): string {
  const n = Math.floor(Math.abs(Number(value) || 0));
  if (n === 0) return "صفر";
  const chunks: string[] = [];
  let remaining = n;
  let scale = 0;
  while (remaining > 0 && scale < SCALES.length) {
    const part = remaining % 1000;
    if (part) {
      const words = threeDigitsToWords(part);
      chunks.unshift(SCALES[scale] ? `${words} ${SCALES[scale]}` : words);
    }
    remaining = Math.floor(remaining / 1000);
    scale += 1;
  }
  return chunks.join(" و ");
}

export function formatFaNumber(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(Math.round(n || 0));
}

/**
 * تاریخ فاکتور رسمی.
 * API فروش معمولاً created_at را از قبل شمسی می‌فرستد (مثلاً 1404-07-02 12:30:00)؛
 * نباید دوباره با Date + fa-IR تبدیل شود وگرنه تاریخ اشتباه می‌شود.
 */
export function formatFaDate(iso?: string | null): string {
  if (!iso) return "";
  const raw = String(iso).trim();
  if (!raw) return "";

  try {
    const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(raw);
    if (match && !raw.includes("T")) {
      const year = Number(match[1]);
      // بازهٔ رایج سال شمسی در دادهٔ فروشگاه
      if (year >= 1200 && year <= 1600) {
        return `${match[1]}/${match[2].padStart(2, "0")}/${match[3].padStart(2, "0")}`;
      }
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw.split(/\s+/)[0]?.replace(/-/g, "/") || raw;
    }

    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return raw.split(/\s+/)[0]?.replace(/-/g, "/") || raw;
  }
}

export function emptySeller(): FormalParty {
  return {
    legal_name: "",
    brand_name: "",
    province: "",
    city: "",
    address: "",
    postal_code: "",
    phone: "",
    economic_code: "",
    national_id: "",
    registration_number: "",
    fixed_notes: "",
  };
}

export function emptyBuyer(phone = ""): FormalParty {
  return {
    phone,
    full_name: "",
    province: "",
    city: "",
    address: "",
    postal_code: "",
    economic_code: "",
    national_id: "",
    registration_number: "",
  };
}

export function mapPurchaseLines(purchase: any): FormalInvoiceLine[] {
  const products = Array.isArray(purchase?.purchased_products)
    ? purchase.purchased_products
    : Array.isArray(purchase?.purchasedProducts)
      ? purchase.purchasedProducts
      : [];

  return products.map((line: any) => {
    const quantity = Number(line.quantity) || 0;
    const unitPriceToman = Number(line.sale_price) || Number(line.product?.sale_price) || 0;
    const unitPrice = tomanToRial(unitPriceToman);
    const lineTotal = unitPrice * quantity;
    const name =
      line.item_name ||
      line.display_name ||
      line.product?.name ||
      line.produced_good?.name ||
      line.raw_material?.name ||
      "کالا";
    const code =
      line.product?.barcode ||
      line.product?.code ||
      line.product_id ||
      line.produced_good_id ||
      line.raw_material_id ||
      "";
    return {
      code: String(code || ""),
      name: String(name),
      quantity,
      unit: "عدد",
      unitPrice,
      lineTotal,
      discount: 0,
      afterDiscount: lineTotal,
      tax: 0,
      grand: lineTotal,
    };
  });
}

export const FORMAL_INVOICE_PURCHASE_KEY = "formal_invoice_purchase_id";

export function openFormalInvoicePrint(
  purchaseId: number | string,
  orientation: "portrait" | "landscape" = "landscape",
  autoPrint = false,
): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams({
    id: String(purchaseId),
    orientation,
  });
  if (autoPrint) params.set("print", "1");
  window.open(`/admin/print/sale/formal?${params.toString()}`, "_blank", "noopener,noreferrer");
}
