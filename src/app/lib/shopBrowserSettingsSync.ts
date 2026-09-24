import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import {
  readAdminPosSettings,
  writeAdminPosSettings,
  type AdminPosSettings,
} from "@/app/lib/adminPosSettings";
import {
  readListReceiptPrintSettings,
  readSaleReceiptPrintSettings,
  writeListReceiptPrintSettings,
  writeSaleReceiptPrintSettings,
  type SaleReceiptPrintSettings,
} from "@/app/lib/saleReceiptPrint";

export const SHOP_BROWSER_SETTINGS_KEY = "shop_browser_settings";

export type ShopBrowserSettingsBundle = {
  pos: AdminPosSettings;
  saleReceipt: SaleReceiptPrintSettings;
  listReceipt: SaleReceiptPrintSettings;
};

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

export function readLocalShopBrowserSettings(): ShopBrowserSettingsBundle {
  return {
    pos: readAdminPosSettings(),
    saleReceipt: readSaleReceiptPrintSettings(),
    listReceipt: readListReceiptPrintSettings(),
  };
}

export function applyShopBrowserSettings(bundle: ShopBrowserSettingsBundle): ShopBrowserSettingsBundle {
  const pos = writeAdminPosSettings(bundle.pos);
  const saleReceipt = writeSaleReceiptPrintSettings(bundle.saleReceipt);
  const listReceipt = writeListReceiptPrintSettings(bundle.listReceipt);
  return { pos, saleReceipt, listReceipt };
}

export async function saveShopBrowserSettingsToServer(): Promise<{ ok: true } | { ok: false; message: string }> {
  const auth = tokenCode();
  if (!auth) return { ok: false, message: "لطفاً وارد شوید" };
  const bundle = readLocalShopBrowserSettings();
  try {
    const res = await FetchWithJwtClient(
      "PUT",
      `/api/settings/${SHOP_BROWSER_SETTINGS_KEY}`,
      auth,
      {},
      { body: JSON.stringify({ value: JSON.stringify(bundle) }) },
    );
    if (!res || res.hasError) {
      return { ok: false, message: "ذخیره تنظیمات در وبینو انجام نشد" };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "ذخیره تنظیمات در وبینو انجام نشد" };
  }
}

export async function restoreShopBrowserSettingsFromServer(): Promise<
  { ok: true; bundle: ShopBrowserSettingsBundle } | { ok: false; message: string }
> {
  const auth = tokenCode();
  if (!auth) return { ok: false, message: "لطفاً وارد شوید" };
  try {
    const res = await FetchWithJwtClient("GET", `/api/settings/${SHOP_BROWSER_SETTINGS_KEY}`, auth);
    if (!res || res.hasError) {
      return { ok: false, message: "بازیابی تنظیمات از وبینو انجام نشد" };
    }
    const raw = unwrapSettingValue(res);
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) {
      return { ok: false, message: "هنوز تنظیماتی در وبینو ذخیره نشده است" };
    }
    const parsed = JSON.parse(text) as Partial<ShopBrowserSettingsBundle>;
    if (!parsed || typeof parsed !== "object" || !parsed.pos) {
      return { ok: false, message: "تنظیمات ذخیره‌شده قابل خواندن نیست" };
    }
    const bundle = applyShopBrowserSettings({
      pos: parsed.pos,
      saleReceipt: parsed.saleReceipt || readSaleReceiptPrintSettings(),
      listReceipt: parsed.listReceipt || readListReceiptPrintSettings(),
    });
    return { ok: true, bundle };
  } catch {
    return { ok: false, message: "بازیابی تنظیمات از وبینو انجام نشد" };
  }
}
