import { dailyTicketFromRecord } from "@/app/lib/dailyTicketNumber";
import { openFormalInvoicePrint } from "@/app/lib/formalInvoice";
import {
  formalReceiptOrientation,
  isFormalReceiptTemplate,
  normalizeReceiptTemplateId,
  type ReceiptTemplateId,
} from "@/app/lib/receiptTemplates";

export const SALE_RECEIPT_PRINT_DATA_KEY = "sale_receipt_print_data";
export const SALE_RECEIPT_PRINT_SETTINGS_KEY = "sale_receipt_print_settings";
export const LIST_RECEIPT_PRINT_SETTINGS_KEY = "list_receipt_print_settings";
/** کلید تنظیمات مشترک فاکتور در جدول settings بک‌اند */
export const RECEIPT_PRINT_DB_SETTINGS_KEY = "receipt_print_settings";

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
  note?: string;
};

export type ReceiptPrintStation = "hall" | "kitchen" | "extra";

export type SaleReceiptData = {
  purchaseId?: number | string;
  createdAt: string;
  shopName?: string;
  phone?: string;
  customerName?: string;
  cashierName?: string;
  tableLabel?: string;
  items: SaleReceiptItem[];
  subtotal: number;
  discount: number;
  creditUsed: number;
  backPrice: number;
  finalTotal: number;
  payableNow: number;
  paymentType?: "cash" | "installment" | "debt" | "cheque" | "mixed" | "online";
  settlementMode?: "split" | "card_all" | "cash_all";
  cardAmount?: number;
  cashAmount?: number;
  installmentCount?: number;
  installmentAmount?: number;
  chequeId?: number;
  chequeNumber?: string;
  footerNote?: string;
  customerNote?: string;
  dailyTicketNumber?: number;
};

export type StationTicketLayout = {
  paperPreset: ReceiptPaperPresetId;
  customPaperWidthMm: number;
  fontSize: number;
  titleFontSize: number;
  paddingMm: number;
  lineHeight: number;
};

export type SaleReceiptPrintSettings = {
  paperPreset: ReceiptPaperPresetId;
  customPaperWidthMm: number;
  fontSize: number;
  titleFontSize: number;
  paddingMm: number;
  lineHeight: number;
  /** مدل فاکتور — پیش‌فرض classic = همان طرح فعلی */
  templateId: ReceiptTemplateId;
  shopTitle: string;
  shopAddress: string;
  shopPhone: string;
  /** برچسب صندوق‌دار روی فاکتور (مثلاً «صندوق‌دار») */
  cashierLabel: string;
  footerText: string;
  showCustomerPhone: boolean;
  showPurchaseId: boolean;
  showDate: boolean;
  showPaymentMethod: boolean;
  showItemUnitPrice: boolean;
  compactItems: boolean;
  autoPrint: boolean;
  printHall: boolean;
  printKitchen: boolean;
  printExtra: boolean;
  kitchenTitle: string;
  extraTitle: string;
  /** یک پرینتر فیزیکی — گفتگوی چاپ مرورگر/ویندوز، بدون QZ */
  singlePrinterNoQz: boolean;
  silentPrint: boolean;
  hallPrinter: string;
  kitchenPrinter: string;
  extraPrinter: string;
  hallLayout?: StationTicketLayout;
  kitchenLayout?: StationTicketLayout;
  extraLayout?: StationTicketLayout;
  qzCertificate: string;
  qzPrivateKey: string;
};

/** فیلدهای مشترک فروشگاه که در دیتابیس یکجا ذخیره می‌شوند (بدون پرینتر/QZ دستگاه) */
export type ReceiptPrintSharedConfig = {
  templateId: ReceiptTemplateId;
  shopTitle: string;
  shopAddress: string;
  shopPhone: string;
  cashierLabel: string;
  footerText: string;
  showCustomerPhone: boolean;
  showPurchaseId: boolean;
  showDate: boolean;
  showPaymentMethod: boolean;
  showItemUnitPrice: boolean;
  compactItems: boolean;
  kitchenTitle: string;
  extraTitle: string;
};

export const DEFAULT_SALE_RECEIPT_PRINT_SETTINGS: SaleReceiptPrintSettings = {
  paperPreset: "80",
  customPaperWidthMm: 80,
  fontSize: 13,
  titleFontSize: 16,
  paddingMm: 4,
  lineHeight: 1.5,
  templateId: "classic",
  shopTitle: "",
  shopAddress: "",
  shopPhone: "",
  cashierLabel: "صندوق‌دار",
  footerText: "با تشکر از خرید شما",
  showCustomerPhone: true,
  showPurchaseId: true,
  showDate: true,
  showPaymentMethod: true,
  showItemUnitPrice: true,
  compactItems: false,
  autoPrint: false,
  printHall: true,
  printKitchen: true,
  printExtra: false,
  kitchenTitle: "آشپزخانه",
  extraTitle: "بار",
  singlePrinterNoQz: false,
  silentPrint: true,
  hallPrinter: "",
  kitchenPrinter: "",
  extraPrinter: "",
  qzCertificate: "",
  qzPrivateKey: "",
};

/** چاپ مجدد از لیست فروش/سفارش — پیش‌فرض فقط سالن، بدون آشپزخانه/بار */
export const DEFAULT_LIST_RECEIPT_PRINT_SETTINGS: SaleReceiptPrintSettings = {
  ...DEFAULT_SALE_RECEIPT_PRINT_SETTINGS,
  printHall: true,
  printKitchen: false,
  printExtra: false,
  autoPrint: false,
  hallPrinter: "",
  kitchenPrinter: "",
  extraPrinter: "",
};

function inheritQzCredentials(settings: SaleReceiptPrintSettings): SaleReceiptPrintSettings {
  if (settings.qzCertificate?.trim() && settings.qzPrivateKey?.trim()) return settings;
  const pos = readSaleReceiptPrintSettings();
  if (!pos.qzCertificate?.trim() || !pos.qzPrivateKey?.trim()) return settings;
  return {
    ...settings,
    qzCertificate: settings.qzCertificate || pos.qzCertificate,
    qzPrivateKey: settings.qzPrivateKey || pos.qzPrivateKey,
  };
}

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
  merged.templateId = normalizeReceiptTemplateId(merged.templateId);
  merged.shopTitle = String(merged.shopTitle || "").slice(0, 80);
  merged.shopAddress = String(merged.shopAddress || "").slice(0, 200);
  merged.shopPhone = String(merged.shopPhone || "").slice(0, 40);
  merged.cashierLabel = String(merged.cashierLabel || "صندوق‌دار").slice(0, 40);
  merged.footerText = String(merged.footerText ?? "با تشکر از خرید شما").slice(0, 200);
  merged.printHall = merged.printHall !== false;
  merged.printKitchen = Boolean(merged.printKitchen);
  merged.printExtra = Boolean(merged.printExtra);
  merged.kitchenTitle = String(merged.kitchenTitle || "آشپزخانه").slice(0, 40);
  merged.extraTitle = String(merged.extraTitle || "بار").slice(0, 40);
  merged.singlePrinterNoQz = Boolean(merged.singlePrinterNoQz);
  merged.silentPrint = merged.silentPrint !== false;
  merged.hallPrinter = String(merged.hallPrinter || "").slice(0, 120);
  merged.kitchenPrinter = String(merged.kitchenPrinter || "").slice(0, 120);
  merged.extraPrinter = String(merged.extraPrinter || "").slice(0, 120);
  merged.hallLayout = raw.hallLayout ? normalizeStationLayout(raw.hallLayout) : undefined;
  merged.kitchenLayout = raw.kitchenLayout ? normalizeStationLayout(raw.kitchenLayout) : undefined;
  merged.extraLayout = raw.extraLayout ? normalizeStationLayout(raw.extraLayout) : undefined;
  merged.qzCertificate = String(merged.qzCertificate || "").slice(0, 32000);
  merged.qzPrivateKey = String(merged.qzPrivateKey || "").slice(0, 32000);

  return merged;
}

export function extractReceiptPrintSharedConfig(
  settings: SaleReceiptPrintSettings,
): ReceiptPrintSharedConfig {
  return {
    templateId: normalizeReceiptTemplateId(settings.templateId),
    shopTitle: settings.shopTitle || "",
    shopAddress: settings.shopAddress || "",
    shopPhone: settings.shopPhone || "",
    cashierLabel: settings.cashierLabel || "صندوق‌دار",
    footerText: settings.footerText ?? "با تشکر از خرید شما",
    showCustomerPhone: settings.showCustomerPhone !== false,
    showPurchaseId: settings.showPurchaseId !== false,
    showDate: settings.showDate !== false,
    showPaymentMethod: settings.showPaymentMethod !== false,
    showItemUnitPrice: settings.showItemUnitPrice !== false,
    compactItems: Boolean(settings.compactItems),
    kitchenTitle: settings.kitchenTitle || "آشپزخانه",
    extraTitle: settings.extraTitle || "بار",
  };
}

export function applyReceiptPrintSharedConfig(
  settings: SaleReceiptPrintSettings,
  shared: Partial<ReceiptPrintSharedConfig> | null | undefined,
): SaleReceiptPrintSettings {
  if (!shared) return settings;
  return normalizeSaleReceiptPrintSettings({
    ...settings,
    ...shared,
    templateId: normalizeReceiptTemplateId(shared.templateId ?? settings.templateId),
  });
}

export function parseReceiptPrintSharedConfig(raw: unknown): ReceiptPrintSharedConfig | null {
  if (raw == null) return null;
  let value = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === " " || trimmed === "{}") return null;
    try {
      value = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  return extractReceiptPrintSharedConfig(
    normalizeSaleReceiptPrintSettings({
      ...DEFAULT_SALE_RECEIPT_PRINT_SETTINGS,
      templateId: normalizeReceiptTemplateId(obj.templateId),
      shopTitle: String(obj.shopTitle ?? ""),
      shopAddress: String(obj.shopAddress ?? ""),
      shopPhone: String(obj.shopPhone ?? ""),
      cashierLabel: String(obj.cashierLabel ?? "صندوق‌دار"),
      footerText: String(obj.footerText ?? "با تشکر از خرید شما"),
      showCustomerPhone: obj.showCustomerPhone !== false,
      showPurchaseId: obj.showPurchaseId !== false,
      showDate: obj.showDate !== false,
      showPaymentMethod: obj.showPaymentMethod !== false,
      showItemUnitPrice: obj.showItemUnitPrice !== false,
      compactItems: Boolean(obj.compactItems),
      kitchenTitle: String(obj.kitchenTitle ?? "آشپزخانه"),
      extraTitle: String(obj.extraTitle ?? "بار"),
    }),
  );
}

function defaultStationLayout(): StationTicketLayout {
  return {
    paperPreset: DEFAULT_SALE_RECEIPT_PRINT_SETTINGS.paperPreset,
    customPaperWidthMm: DEFAULT_SALE_RECEIPT_PRINT_SETTINGS.customPaperWidthMm,
    fontSize: DEFAULT_SALE_RECEIPT_PRINT_SETTINGS.fontSize,
    titleFontSize: DEFAULT_SALE_RECEIPT_PRINT_SETTINGS.titleFontSize,
    paddingMm: DEFAULT_SALE_RECEIPT_PRINT_SETTINGS.paddingMm,
    lineHeight: DEFAULT_SALE_RECEIPT_PRINT_SETTINGS.lineHeight,
  };
}

function normalizeStationLayout(raw: Partial<StationTicketLayout> | undefined): StationTicketLayout {
  const merged = { ...defaultStationLayout(), ...raw };
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

function globalLayoutFromSettings(settings: Pick<
  SaleReceiptPrintSettings,
  "paperPreset" | "customPaperWidthMm" | "fontSize" | "titleFontSize" | "paddingMm" | "lineHeight"
>): StationTicketLayout {
  return normalizeStationLayout({
    paperPreset: settings.paperPreset,
    customPaperWidthMm: settings.customPaperWidthMm,
    fontSize: settings.fontSize,
    titleFontSize: settings.titleFontSize,
    paddingMm: settings.paddingMm,
    lineHeight: settings.lineHeight,
  });
}

export function stationLayoutSettingKey(
  station: ReceiptPrintStation,
): "hallLayout" | "kitchenLayout" | "extraLayout" {
  if (station === "hall") return "hallLayout";
  if (station === "kitchen") return "kitchenLayout";
  return "extraLayout";
}

export function getStationLayout(
  settings: SaleReceiptPrintSettings,
  station: ReceiptPrintStation,
): StationTicketLayout {
  const stored = settings[stationLayoutSettingKey(station)];
  if (stored) return normalizeStationLayout(stored);
  return globalLayoutFromSettings(settings);
}

export function applyStationLayout(
  settings: SaleReceiptPrintSettings,
  station: ReceiptPrintStation,
): SaleReceiptPrintSettings {
  return { ...settings, ...getStationLayout(settings, station) };
}

export function resolveStationPaperWidthMm(
  settings: SaleReceiptPrintSettings,
  station: ReceiptPrintStation,
): number {
  return resolvePaperWidthMm(applyStationLayout(settings, station));
}

export function getStationPrinterName(
  settings: SaleReceiptPrintSettings,
  station: ReceiptPrintStation,
): string {
  if (station === "hall") return settings.hallPrinter?.trim() || "";
  if (station === "kitchen") return settings.kitchenPrinter?.trim() || "";
  return settings.extraPrinter?.trim() || "";
}

export function stationPrinterSettingKey(
  station: ReceiptPrintStation,
): "hallPrinter" | "kitchenPrinter" | "extraPrinter" {
  if (station === "hall") return "hallPrinter";
  if (station === "kitchen") return "kitchenPrinter";
  return "extraPrinter";
}

export function getEnabledReceiptPrintStations(
  settings: SaleReceiptPrintSettings,
): ReceiptPrintStation[] {
  const stations: ReceiptPrintStation[] = [];
  if (settings.printHall !== false) stations.push("hall");
  if (settings.printKitchen) stations.push("kitchen");
  if (settings.printExtra) stations.push("extra");
  return stations.length ? stations : ["hall"];
}

export function printReceiptStationsSequentially(
  stations: ReceiptPrintStation[],
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const list = stations.length ? stations : (["hall"] as ReceiptPrintStation[]);

  const printOne = (station: ReceiptPrintStation) =>
    new Promise<void>((resolve) => {
      document.body.dataset.printStation = station;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.removeEventListener("afterprint", finish);
        resolve();
      };
      window.addEventListener("afterprint", finish);
      window.setTimeout(() => {
        window.print();
      }, 80);
      window.setTimeout(finish, 120000);
    });

  return (async () => {
    for (const station of list) {
      await printOne(station);
      await new Promise((r) => setTimeout(r, 350));
    }
    delete document.body.dataset.printStation;
  })();
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

export function readListReceiptPrintSettings(): SaleReceiptPrintSettings {
  if (typeof window === "undefined") return { ...DEFAULT_LIST_RECEIPT_PRINT_SETTINGS };
  try {
    const raw = localStorage.getItem(LIST_RECEIPT_PRINT_SETTINGS_KEY);
    if (!raw) return inheritQzCredentials({ ...DEFAULT_LIST_RECEIPT_PRINT_SETTINGS });
    const normalized = normalizeSaleReceiptPrintSettings(JSON.parse(raw));
    normalized.printKitchen = false;
    normalized.printExtra = false;
    normalized.printHall = normalized.printHall !== false;
    return inheritQzCredentials(normalized);
  } catch {
    return inheritQzCredentials({ ...DEFAULT_LIST_RECEIPT_PRINT_SETTINGS });
  }
}

export function writeListReceiptPrintSettings(
  partial: Partial<SaleReceiptPrintSettings>,
): SaleReceiptPrintSettings {
  const merged = normalizeSaleReceiptPrintSettings({
    ...readListReceiptPrintSettings(),
    ...partial,
    printKitchen: false,
    printExtra: false,
  });
  if (typeof window !== "undefined") {
    localStorage.setItem(LIST_RECEIPT_PRINT_SETTINGS_KEY, JSON.stringify(merged));
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

export function formatReceiptDateOnly(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatReceiptTimeOnly(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", { timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** فاکتور رسمی A5 همان صفحه و API فعلی را باز می‌کند. */
export function tryOpenFormalSaleReceipt(
  data: SaleReceiptData | null | undefined,
  settings: SaleReceiptPrintSettings,
): "opened" | "missing-id" | "skip" {
  if (!isFormalReceiptTemplate(settings.templateId)) return "skip";
  if (data?.purchaseId == null || data.purchaseId === "") return "missing-id";
  openFormalInvoicePrint(data.purchaseId, formalReceiptOrientation(settings.templateId), true);
  return "opened";
}

export function openSaleReceiptPrintPage(
  basePath = "/admin/print/sale",
  data?: SaleReceiptData | null,
): void {
  void dispatchSaleReceiptPrint(basePath, data);
}

/**
 * Print a sale receipt. When QZ printers are assigned, never opens a browser tab
 * or print dialog — failures stay silent (caller may toast).
 */
async function dispatchReceiptPrintWithSettings(
  basePath: string,
  settings: SaleReceiptPrintSettings,
  data?: SaleReceiptData | null,
): Promise<"silent" | "dialog" | "failed"> {
  if (typeof window === "undefined") return "dialog";
  let receipt = data ?? readSaleReceiptPrintData();
  if (receipt && receipt.dailyTicketNumber == null) {
    const stored = dailyTicketFromRecord(receipt);
    if (stored != null) receipt = { ...receipt, dailyTicketNumber: stored };
  }
  if (receipt) {
    saveSaleReceiptPrintData(receipt);
  }

  const formalRoute = tryOpenFormalSaleReceipt(receipt, settings);
  if (formalRoute === "opened") return "dialog";
  if (formalRoute === "missing-id") return "failed";

  if (receipt && settings.silentPrint !== false && !settings.singlePrinterNoQz) {
    try {
      const { canSilentPrint, silentPrintReceiptStations } = await import(
        "@/app/lib/qzSilentPrint"
      );
      if (canSilentPrint(settings)) {
        await silentPrintReceiptStations(receipt, settings);
        return "silent";
      }
    } catch (error) {
      console.warn(error);
      // Do NOT open /admin/print/sale — user wants fully silent order printing.
      return "failed";
    }
  }

  // No QZ printers configured (or تک‌پرینتر بدون QZ): open preview page only when not in auto/direct mode.
  if (basePath.includes("direct=1") && !settings.singlePrinterNoQz) {
    return "failed";
  }
  window.open(basePath, "_blank", "noopener,noreferrer");
  return "dialog";
}

/** Fully silent print for POS / table orders. Never redirects — unless تک‌پرینتر بدون QZ. */
export async function silentPrintSaleReceiptOrFail(
  data: SaleReceiptData,
  settings?: SaleReceiptPrintSettings,
  options?: { skipFormal?: boolean },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const resolved = settings ?? readSaleReceiptPrintSettings();
  saveSaleReceiptPrintData(data);

  if (!options?.skipFormal) {
    const formalRoute = tryOpenFormalSaleReceipt(data, resolved);
    if (formalRoute === "opened") return { ok: true };
    if (formalRoute === "missing-id") {
      return { ok: false, message: "شناسه فروش برای چاپ فاکتور رسمی پیدا نشد." };
    }
  }

  if (resolved.singlePrinterNoQz) {
    openSaleReceiptPrintPage("/admin/print/sale", data);
    return { ok: true };
  }

  try {
    const { canSilentPrint, silentPrintReceiptStations } = await import(
      "@/app/lib/qzSilentPrint"
    );
    if (!canSilentPrint(resolved)) {
      return {
        ok: false,
        message: "برای چاپ بی‌صدا، پرینتر سالن/آشپزخانه را در تنظیمات چاپ انتخاب کنید.",
      };
    }
    await silentPrintReceiptStations(data, resolved);
    return { ok: true };
  } catch (error) {
    const { qzErrorMessage } = await import("@/app/lib/qzSilentPrint");
    return { ok: false, message: qzErrorMessage(error) };
  }
}

export async function dispatchSaleReceiptPrint(
  basePath = "/admin/print/sale",
  data?: SaleReceiptData | null,
): Promise<"silent" | "dialog" | "failed"> {
  return dispatchReceiptPrintWithSettings(basePath, readSaleReceiptPrintSettings(), data);
}

export async function dispatchListReceiptPrint(
  basePath = "/admin/print/sale?list=1",
  data?: SaleReceiptData | null,
): Promise<"silent" | "dialog" | "failed"> {
  return dispatchReceiptPrintWithSettings(basePath, readListReceiptPrintSettings(), data);
}

export function openListReceiptPrintPage(
  basePath = "/admin/print/sale?list=1",
  data?: SaleReceiptData | null,
): void {
  void dispatchListReceiptPrint(basePath, data);
}

export function getPaymentTypeLabel(receipt: SaleReceiptData): string {
  if (receipt.paymentType === "installment") {
    return receipt.installmentCount
      ? `اقساطی (${receipt.installmentCount} قسط)`
      : "اقساطی";
  }
  if (receipt.paymentType === "debt") return "نسیه";
  if (receipt.paymentType === "cheque") {
    const parts = [receipt.chequeNumber ? `چکی (${receipt.chequeNumber})` : "چکی"];
    if (receipt.cashAmount) parts.push("نقد");
    if (receipt.cardAmount) parts.push("کارت");
    return parts.join(" + ");
  }
  if (receipt.paymentType === "mixed") {
    const parts: string[] = [];
    if (receipt.cashAmount) parts.push("نقد");
    if (receipt.cardAmount) parts.push("کارت");
    if (receipt.chequeId || receipt.chequeNumber) {
      parts.push(receipt.chequeNumber ? `چک (${receipt.chequeNumber})` : "چک");
    }
    const paid =
      (Number(receipt.cashAmount) || 0) +
      (Number(receipt.cardAmount) || 0);
    if (receipt.finalTotal > paid) parts.push("نسیه");
    return parts.length ? `ترکیبی (${parts.join(" + ")})` : "ترکیبی";
  }
  if (receipt.paymentType === "online") return "آنلاین";
  if (receipt.settlementMode === "card_all") return "کارت";
  if (receipt.settlementMode === "cash_all") return "نقد";
  if (receipt.settlementMode === "split") return "ترکیبی (نقد + کارت)";
  return "نقد";
}

