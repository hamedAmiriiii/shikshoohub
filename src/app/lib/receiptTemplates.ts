import type { SaleReceiptData, SaleReceiptPrintSettings } from "@/app/lib/saleReceiptPrint";

export const RECEIPT_TEMPLATE_IDS = [
  "classic",
  "retail",
  "minimal",
  "bold",
  "formal-a5",
  "formal-a5-land",
] as const;

export type ReceiptTemplateId = (typeof RECEIPT_TEMPLATE_IDS)[number];

export type ReceiptTemplateMeta = {
  id: ReceiptTemplateId;
  title: string;
  hint: string;
};

export const RECEIPT_TEMPLATES: ReceiptTemplateMeta[] = [
  {
    id: "classic",
    title: "کلاسیک",
    hint: "مدل فعلی — فیش ساده سالن",
  },
  {
    id: "retail",
    title: "فروشگاهی",
    hint: "جدول کالا، کادر مبلغ پرداختی",
  },
  {
    id: "minimal",
    title: "مینیمال",
    hint: "خط‌چین و چیدمان خلوت",
  },
  {
    id: "bold",
    title: "پررنگ",
    hint: "نوار مشکی عنوان و مبلغ بزرگ",
  },
  {
    id: "formal-a5",
    title: "فاکتور رسمی a5 عمودی",
    hint: "همان فاکتور رسمی سیستم — سایز پیش‌فرض A5 عمودی",
  },
  {
    id: "formal-a5-land",
    title: "فاکتور رسمی a5 عرضی",
    hint: "همان فاکتور رسمی سیستم — سایز پیش‌فرض A5 عرضی",
  },
];

export function isFormalReceiptTemplate(value: unknown): value is "formal-a5" | "formal-a5-land" {
  return value === "formal-a5" || value === "formal-a5-land";
}

export function formalReceiptOrientation(value: unknown): "portrait" | "landscape" {
  return value === "formal-a5" ? "portrait" : "landscape";
}

export function normalizeReceiptTemplateId(value: unknown): ReceiptTemplateId {
  if (typeof value === "string" && (RECEIPT_TEMPLATE_IDS as readonly string[]).includes(value)) {
    return value as ReceiptTemplateId;
  }
  return "classic";
}

/** داده نمونه برای پیش‌نمایش انتخاب مدل */
export const SAMPLE_RECEIPT_FOR_PREVIEW: SaleReceiptData = {
  purchaseId: 13,
  createdAt: "2017-04-16T13:26:00.000Z",
  shopName: "فروشگاه نمونه",
  phone: "09121234567",
  customerName: "قبادی",
  cashierName: "مدیر",
  items: [
    { name: "موسلی", quantity: 1, unitPrice: 185000, lineTotal: 185000 },
    { name: "خیارشور", quantity: 2, unitPrice: 45000, lineTotal: 90000 },
    { name: "مایع لباسشویی", quantity: 1, unitPrice: 125500, lineTotal: 125500 },
  ],
  subtotal: 400500,
  discount: 9000,
  creditUsed: 0,
  backPrice: 0,
  finalTotal: 391500,
  payableNow: 391500,
  paymentType: "cash",
  settlementMode: "cash_all",
};

export function previewSettingsForTemplate(
  templateId: ReceiptTemplateId,
  base?: Partial<SaleReceiptPrintSettings>,
): SaleReceiptPrintSettings {
  return {
    paperPreset: "80",
    customPaperWidthMm: 80,
    fontSize: 11,
    titleFontSize: 14,
    paddingMm: 3,
    lineHeight: 1.35,
    shopTitle: base?.shopTitle || "فروشگاه نمونه",
    shopAddress: base?.shopAddress || "بلوار امام جنب دانشگاه",
    shopPhone: base?.shopPhone || "۰۲۸-۳۴۵۳۵۹۱۱",
    cashierLabel: base?.cashierLabel || "صندوق‌دار",
    footerText: base?.footerText ?? "با تشکر از خرید شما",
    templateId,
    showCustomerPhone: true,
    showPurchaseId: true,
    showDate: true,
    showPaymentMethod: true,
    showItemUnitPrice: true,
    compactItems: true,
    autoPrint: false,
    printHall: true,
    printKitchen: false,
    printExtra: false,
    hallTitle: "",
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
}
