export const ADMIN_POS_SETTINGS_KEY = "admin_pos_settings";
export const ADMIN_POS_SETTINGS_CHANGED_EVENT = "admin-pos-settings-changed";

export type AdminPosSettings = {
  showProductListOnMainPage: boolean;
  /** چیدمان صفحه فروش: سبد چپ مثل منو، لیست عریض کالا سمت راست */
  typedSaleListMode: boolean;
  menuMode: boolean;
  /** در حالت منو، تصویر کالا روی کارت نشان داده شود */
  menuModeShowProductImages: boolean;
  installmentPaymentEnabled: boolean;
  debtPaymentEnabled: boolean;
  /** فروش با چک دریافتی ثبت‌شده */
  chequePaymentEnabled: boolean;
  /** نمایش «کالاهای تولیدی» در منوی مدیریت کالا */
  producedGoodsMenuEnabled: boolean;
  /** فروش محصولات با واحد کیلوگرم یا متر */
  kgSalesEnabled: boolean;
  /** میز، سفارش حضوری و پولینگ رسیدگی‌نشده */
  restaurantCafeEnabled: boolean;
  /** خدمات اتاق/میز جدا از کالا (هتل و مشابه) */
  roomServicesEnabled: boolean;
  /** پاپ‌آپ سفارش حضوری وقتی در حالت منو سفارش جدید می‌رسد */
  menuTableOrdersPopupEnabled: boolean;
  /** امکان تغییر قیمت فروش هنگام ثبت خرید */
  salePriceEditEnabled: boolean;
  /** امکان انتخاب/تغییر تاریخ فروش هنگام ثبت */
  saleDateEditEnabled: boolean;
  /** ظاهر کلاسیک فاکتور در صفحه فروش */
  classicPosMode: boolean;
  /** در ثبت مشتری، فیلد نام هم گرفته شود */
  askCustomerName: boolean;
  /** شماره فیش روزانه از ۱؛ هر روز از نو */
  showDailyTicketNumber: boolean;
  /** نمایش فیلد اولویت/ترتیب نمایش در ثبت و ویرایش کالا */
  productDisplayOrderEnabled: boolean;
  /** بعد از ثبت کالا، بارکد بعدی روی همین دستگاه پر شود */
  sequentialProductBarcodeEnabled: boolean;
  /** دکمه پیش‌فاکتور کنار ثبت فروش */
  proformaEnabled: boolean;
  /** ثبت کالا از ردیف فاکتور خرید */
  invoiceProductEntryEnabled: boolean;
};

const DEFAULT_SETTINGS: AdminPosSettings = {
  showProductListOnMainPage: false,
  typedSaleListMode: false,
  menuMode: false,
  menuModeShowProductImages: true,
  installmentPaymentEnabled: true,
  debtPaymentEnabled: false,
  chequePaymentEnabled: false,
  producedGoodsMenuEnabled: false,
  kgSalesEnabled: false,
  restaurantCafeEnabled: false,
  roomServicesEnabled: false,
  menuTableOrdersPopupEnabled: false,
  salePriceEditEnabled: false,
  saleDateEditEnabled: false,
  classicPosMode: false,
  askCustomerName: false,
  showDailyTicketNumber: false,
  productDisplayOrderEnabled: false,
  sequentialProductBarcodeEnabled: false,
  proformaEnabled: false,
  invoiceProductEntryEnabled: false,
};

const SEQUENTIAL_BARCODE_KEY = "admin_sequential_product_barcode";

export function nextSequentialBarcode(raw: string): string | null {
  const value = raw.trim();
  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) return null;
  const prefix = match[1];
  const digits = match[2];
  const next = (BigInt(digits) + 1n).toString();
  const padded = next.length < digits.length ? next.padStart(digits.length, "0") : next;
  const result = `${prefix}${padded}`;
  return result.length <= 255 ? result : null;
}

export function readLastSequentialBarcode(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(SEQUENTIAL_BARCODE_KEY) || "";
  } catch {
    return "";
  }
}

export function writeLastSequentialBarcode(barcode: string): void {
  if (typeof window === "undefined") return;
  const value = barcode.trim();
  if (!value) return;
  localStorage.setItem(SEQUENTIAL_BARCODE_KEY, value);
}

export function readAdminPosSettings(): AdminPosSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(ADMIN_POS_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeAdminPosSettings(partial: Partial<AdminPosSettings>): AdminPosSettings {
  const merged = { ...readAdminPosSettings(), ...partial };
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_POS_SETTINGS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(ADMIN_POS_SETTINGS_CHANGED_EVENT));
    void import("@/app/lib/offline/cache").then(({ savePosSettingsCache }) => {
      void savePosSettingsCache(merged);
    }).catch(() => {
      /* ignore */
    });
  }
  return merged;
}
