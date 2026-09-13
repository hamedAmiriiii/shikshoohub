import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import {
  RECEIPT_PRINT_DB_SETTINGS_KEY,
  applyReceiptPrintSharedConfig,
  extractReceiptPrintSharedConfig,
  parseReceiptPrintSharedConfig,
  readListReceiptPrintSettings,
  readSaleReceiptPrintSettings,
  writeListReceiptPrintSettings,
  writeSaleReceiptPrintSettings,
  type ReceiptPrintSharedConfig,
  type SaleReceiptPrintSettings,
} from "@/app/lib/saleReceiptPrint";

function unwrapSettingValue(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") return raw;
  if (typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if ("value" in obj) return obj.value;
  if (obj.data && typeof obj.data === "object" && "value" in (obj.data as object)) {
    return (obj.data as { value: unknown }).value;
  }
  return raw;
}

/** خواندن تنظیمات مشترک فاکتور از دیتابیس فروشگاه */
export async function fetchReceiptPrintSharedConfig(
  token?: string | null,
): Promise<ReceiptPrintSharedConfig | null> {
  const auth = token || tokenCode();
  if (!auth) return null;
  try {
    const res = await FetchWithJwtClient("GET", `/api/settings/${RECEIPT_PRINT_DB_SETTINGS_KEY}`, auth);
    if (res?.hasError) return null;
    return parseReceiptPrintSharedConfig(unwrapSettingValue(res));
  } catch {
    return null;
  }
}

/** ذخیره یکجای فیلدهای مشترک فاکتور در دیتابیس */
export async function saveReceiptPrintSharedConfig(
  shared: ReceiptPrintSharedConfig,
  token?: string | null,
): Promise<boolean> {
  const auth = token || tokenCode();
  if (!auth) return false;
  try {
    const res = await FetchWithJwtClient(
      "PUT",
      `/api/settings/${RECEIPT_PRINT_DB_SETTINGS_KEY}`,
      auth,
      {},
      { body: JSON.stringify({ value: JSON.stringify(shared) }) },
    );
    return !res?.hasError;
  } catch {
    return false;
  }
}

/**
 * اگر در دیتابیس چیزی نبود و لوکال مقدار دارد، یک‌بار از لوکال seed می‌کند.
 * سپس فیلدهای مشترک را روی تنظیمات فروش و لیست اعمال می‌کند.
 */
export async function hydrateReceiptPrintSettingsFromDb(
  token?: string | null,
): Promise<SaleReceiptPrintSettings> {
  const localSale = readSaleReceiptPrintSettings();
  let shared = await fetchReceiptPrintSharedConfig(token);

  if (!shared) {
    shared = extractReceiptPrintSharedConfig(localSale);
    const hasCustom =
      Boolean(shared.shopTitle?.trim()) ||
      Boolean(shared.shopAddress?.trim()) ||
      Boolean(shared.shopPhone?.trim()) ||
      shared.templateId !== "classic" ||
      Boolean(shared.footerText && shared.footerText !== "با تشکر از خرید شما");
    if (hasCustom) {
      await saveReceiptPrintSharedConfig(shared, token);
    }
  }

  const nextSale = writeSaleReceiptPrintSettings(applyReceiptPrintSharedConfig(localSale, shared));
  const localList = readListReceiptPrintSettings();
  writeListReceiptPrintSettings(applyReceiptPrintSharedConfig(localList, shared));
  return nextSale;
}

/** بعد از تغییر تنظیمات محلی، بخش مشترک را در دیتابیس هم به‌روز می‌کند */
export async function persistSharedReceiptSettings(
  settings: SaleReceiptPrintSettings,
  token?: string | null,
): Promise<void> {
  const shared = extractReceiptPrintSharedConfig(settings);
  writeSaleReceiptPrintSettings(applyReceiptPrintSharedConfig(readSaleReceiptPrintSettings(), shared));
  writeListReceiptPrintSettings(applyReceiptPrintSharedConfig(readListReceiptPrintSettings(), shared));
  await saveReceiptPrintSharedConfig(shared, token);
}
