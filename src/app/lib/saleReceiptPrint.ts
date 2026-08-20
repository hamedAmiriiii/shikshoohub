export const SALE_RECEIPT_PRINT_DATA_KEY = "sale_receipt_print_data";
export const SALE_RECEIPT_PRINT_SETTINGS_KEY = "sale_receipt_print_settings";

export const RECEIPT_PAPER_PRESETS = [
  { id: "48", widthMm: 48, label: "48 میلی‌متر", hint: "حرارتی خیلی باریک" },
  { id: "57", widthMm: 57, label: "57 میلی‌متر", hint: "ESC/POS جیبی" },
  { id: "58", widthMm: 58, label: "58 میلی‌متر", hint: "حرارتی کوچک (رایج)" },
  { id: "76", widthMm: 76, label: "76 میلی‌متر", hint: "حرارتی میانی" },
  { id: "80", widthMm: 80, label: "80 میلی‌متر", hint: "حرارتی استاندارد (پیش‌فرض)" },
  { id: "110", widthMm: 110, label: "110 میلی‌متر", hint: "حرارتی عریض" },
  { id: "a4", widthMm: 210, label: "A4 (210mm)", hint: "پرینتر معمولی" },
  { id: "custom", widthMm: 0, label: "عرض سفارشی", hint: "عدد دلخواه" },
] as const;

export type ReceiptPaperPresetId = (typeof RECEIPT_PAPER_PRESETS)[number]["id"];

export type SaleReceiptItem = {
  id?: number | string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SaleReceiptData = {
  purchaseId?: number | string;
  createdAt: string;
  shopName?: string;
  phone?: string;
  tableLabel?: string;
  items: SaleReceiptItem[];
  subtotal: number;
  discount: number;
  creditUsed: number;
  backPrice: number;
  finalTotal: number;
  payableNow: number;
  paymentType?: "cash" | "installment" | "debt" | "online";
  settlementMode?: "split" | "card_all" | "cash_all";
  cardAmount?: number;
  cashAmount?: number;
  installmentCount?: number;
  installmentAmount?: number;
  footerNote?: string;
  customerNote?: string;
};

export type SaleReceiptPrintSettings = {
  paperPreset: ReceiptPaperPresetId;
  customPaperWidthMm: number;
  fontSize: number;
  titleFontSize: number;
  paddingMm: number;
  lineHeight: number;
  shopTitle: string;
  footerText: string;
  showCustomerPhone: boolean;
  showPurchaseId: boolean;
  showDate: boolean;
  showPaymentMethod: boolean;
  showItemUnitPrice: boolean;
  compactItems: boolean;
  autoPrint: boolean;
};

export const DEFAULT_SALE_RECEIPT_PRINT_SETTINGS: SaleReceiptPrintSettings = {
  paperPreset: "80",
  customPaperWidthMm: 80,
  fontSize: 12,
  titleFontSize: 14,
  paddingMm: 4,
  lineHeight: 1.5,
  shopTitle: "",
  footerText: "با تشکر از خرید شما",
  showCustomerPhone: true,
  showPurchaseId: true,
  showDate: true,
  showPaymentMethod: true,
  showItemUnitPrice: true,
  compactItems: false,
  autoPrint: false,
};

function normalizeSaleReceiptPrintSettings(
  raw: Partial<SaleReceiptPrintSettings> & { paperWidthMm?: number },
): SaleReceiptPrintSettings {
  const merged = { ...DEFAULT_SALE_RECEIPT_PRINT_SETTINGS, ...raw };

  if (!raw.paperPreset && raw.paperWidthMm != null) {
    const match = RECEIPT_PAPER_PRESETS.find((p) => p.widthMm === raw.paperWidthMm);
    merged.paperPreset = match?.id ?? "custom";
    merged.customPaperWidthMm = raw.paperWidthMm;
  }

  if (!RECEIPT_PAPER_PRESETS.some((p) => p.id === merged.paperPreset)) {
    merged.paperPreset = "80";
  }

  merged.customPaperWidthMm = Math.min(220, Math.max(40, merged.customPaperWidthMm || 80));
  merged.fontSize = Math.min(18, Math.max(8, merged.fontSize || 12));
  merged.titleFontSize = Math.min(22, Math.max(10, merged.titleFontSize || 14));
  merged.paddingMm = Math.min(12, Math.max(0, merged.paddingMm ?? 4));
  merged.lineHeight = Math.min(2.2, Math.max(1.1, merged.lineHeight ?? 1.5));

  return merged;
}

export function resolvePaperWidthMm(settings: SaleReceiptPrintSettings): number {
  if (settings.paperPreset === "custom") {
    return Math.min(220, Math.max(40, settings.customPaperWidthMm || 80));
  }
  const preset = RECEIPT_PAPER_PRESETS.find((p) => p.id === settings.paperPreset);
  return preset?.widthMm ?? 80;
}

export function readSaleReceiptPrintSettings(): SaleReceiptPrintSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SALE_RECEIPT_PRINT_SETTINGS };
  try {
    const raw = localStorage.getItem(SALE_RECEIPT_PRINT_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SALE_RECEIPT_PRINT_SETTINGS };
    return normalizeSaleReceiptPrintSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SALE_RECEIPT_PRINT_SETTINGS };
  }
}

export function writeSaleReceiptPrintSettings(
  partial: Partial<SaleReceiptPrintSettings>,
): SaleReceiptPrintSettings {
  const merged = normalizeSaleReceiptPrintSettings({
    ...readSaleReceiptPrintSettings(),
    ...partial,
  });
  if (typeof window !== "undefined") {
    localStorage.setItem(SALE_RECEIPT_PRINT_SETTINGS_KEY, JSON.stringify(merged));
  }
  return merged;
}

export function resetSaleReceiptPrintSettings(): SaleReceiptPrintSettings {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      SALE_RECEIPT_PRINT_SETTINGS_KEY,
      JSON.stringify(DEFAULT_SALE_RECEIPT_PRINT_SETTINGS),
    );
  }
  return { ...DEFAULT_SALE_RECEIPT_PRINT_SETTINGS };
}

export function saveSaleReceiptPrintData(data: SaleReceiptData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SALE_RECEIPT_PRINT_DATA_KEY, JSON.stringify(data));
}

export function readSaleReceiptPrintData(): SaleReceiptData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SALE_RECEIPT_PRINT_DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaleReceiptData;
  } catch {
    return null;
  }
}

export function clearSaleReceiptPrintData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SALE_RECEIPT_PRINT_DATA_KEY);
}

export function formatReceiptNumber(num: number): string {
  return new Intl.NumberFormat("fa-IR").format(num);
}

export function formatReceiptDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function openSaleReceiptPrintPage(
  basePath = "/admin/print/sale",
  data?: SaleReceiptData | null,
): void {
  if (typeof window === "undefined") return;
  if (data) {
    saveSaleReceiptPrintData(data);
  }
  window.open(basePath, "_blank", "noopener,noreferrer");
}

export function getPaymentTypeLabel(receipt: SaleReceiptData): string {
  if (receipt.paymentType === "installment") {
    return receipt.installmentCount
      ? `اقساطی (${receipt.installmentCount} قسط)`
      : "اقساطی";
  }
  if (receipt.paymentType === "debt") return "نسیه";
  if (receipt.paymentType === "online") return "آنلاین";
  if (receipt.settlementMode === "card_all") return "کارت";
  if (receipt.settlementMode === "cash_all") return "نقد";
  if (receipt.settlementMode === "split") return "ترکیبی (نقد + کارت)";
  return "نقد";
}

