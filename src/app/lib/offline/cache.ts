import { KV_CACHE_STORE, idbGet, idbPut } from "./db";
import { PRODUCTS_CACHE_KEY, type CachedProduct } from "@/app/lib/productsCache";
import {
  ADMIN_POS_SETTINGS_KEY,
  readAdminPosSettings,
  type AdminPosSettings,
} from "@/app/lib/adminPosSettings";

const PRODUCTS_CACHE_IDB_KEY = "products";
const POS_SETTINGS_CACHE_IDB_KEY = "pos_settings";
const CUSTOMERS_CACHE_IDB_KEY = "customers_recent";

type KvRecord<T> = {
  key: string;
  value: T;
  updatedAt: number;
};

export type CachedCustomerCredit = {
  phone: string;
  credit: number;
  useCredit: number;
  updatedAt: number;
};

async function putKvCache<T>(key: string, value: T): Promise<void> {
  const record: KvRecord<T> = { key, value, updatedAt: Date.now() };
  await idbPut(KV_CACHE_STORE, record);
}

async function getKvCache<T>(key: string): Promise<T | null> {
  try {
    const record = await idbGet<KvRecord<T>>(KV_CACHE_STORE, key);
    return record?.value ?? null;
  } catch {
    return null;
  }
}

export async function saveProductsCache(products: CachedProduct[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
    localStorage.setItem("products_cache_timestamp", Date.now().toString());
    await putKvCache(PRODUCTS_CACHE_IDB_KEY, products);
  } catch (error) {
    console.error("saveProductsCache failed:", error);
  }
}

export async function readProductsCacheAsync(): Promise<CachedProduct[]> {
  if (typeof window === "undefined") return [];
  try {
    const fromIdb = await getKvCache<CachedProduct[]>(PRODUCTS_CACHE_IDB_KEY);
    if (fromIdb && fromIdb.length > 0) return fromIdb;
  } catch {
    /* fallback localStorage */
  }
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePosSettingsCache(settings?: AdminPosSettings): Promise<void> {
  const value = settings ?? readAdminPosSettings();
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_POS_SETTINGS_KEY, JSON.stringify(value));
    await putKvCache(POS_SETTINGS_CACHE_IDB_KEY, value);
  } catch (error) {
    console.error("savePosSettingsCache failed:", error);
  }
}

export async function readPosSettingsCacheAsync(): Promise<AdminPosSettings | null> {
  try {
    return await getKvCache<AdminPosSettings>(POS_SETTINGS_CACHE_IDB_KEY);
  } catch {
    return null;
  }
}

export async function upsertCustomerCreditCache(entry: {
  phone: string;
  credit: number;
  useCredit: number;
}): Promise<void> {
  const phone = entry.phone.trim();
  if (!phone) return;

  const existing = (await getKvCache<CachedCustomerCredit[]>(CUSTOMERS_CACHE_IDB_KEY)) ?? [];
  const filtered = existing.filter((c) => c.phone !== phone);
  const next: CachedCustomerCredit[] = [
    { phone, credit: entry.credit, useCredit: entry.useCredit, updatedAt: Date.now() },
    ...filtered,
  ].slice(0, 500);

  await putKvCache(CUSTOMERS_CACHE_IDB_KEY, next);
}

export async function findCustomerCreditInCache(phone: string): Promise<CachedCustomerCredit | null> {
  const normalized = phone.trim();
  if (!normalized) return null;
  const list = (await getKvCache<CachedCustomerCredit[]>(CUSTOMERS_CACHE_IDB_KEY)) ?? [];
  return list.find((c) => c.phone === normalized) ?? null;
}
