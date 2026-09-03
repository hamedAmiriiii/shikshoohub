import type { OilProductCatalogResponse, OilReportsResponse } from "./types";
import { oilIdbGet, oilIdbPut } from "./idb";

function generateOilUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const QUEUE_KEY = "oil_outbox_visits_v1";
const CATALOG_KEY = "oil_catalog_cache_v1";
const CATALOG_IDB_ACTIVE = "catalog_active";
const CATALOG_IDB_INACTIVE = "catalog_inactive";
const REPORTS_IDB_KEY = "reports";
export const OIL_OUTBOX_CHANGED = "oil-outbox-changed";

export type OilVisitQueueBody = {
  client_id: string;
  occurred_at: string;
  serial?: string;
  letter?: string;
  middle?: string;
  province?: string;
  plate?: string;
  phone: string;
  km: number;
  next_km?: number;
  notes?: string;
  oil_product_id?: number;
  air_filter_product_id?: number;
  oil_filter_product_id?: number;
  gearbox_oil_product_id?: number;
  gear_oil_product_id?: number;
};

export type OilOutboxItem = {
  id: string;
  clientId: string;
  body: OilVisitQueueBody;
  createdAt: number;
  retryCount: number;
  lastError?: string;
};

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OIL_OUTBOX_CHANGED));
}

function readQueue(): OilOutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: OilOutboxItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  notify();
}

export function listOilOutbox(): OilOutboxItem[] {
  return readQueue().sort((a, b) => a.createdAt - b.createdAt);
}

export function oilOutboxCount(): number {
  return listOilOutbox().length;
}

export function formatOilOccurredAt(date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

export function freezeOilVisitBody(
  body: Omit<OilVisitQueueBody, "client_id" | "occurred_at"> & {
    client_id?: string;
    occurred_at?: string;
  },
): OilVisitQueueBody {
  const gearbox =
    body.gearbox_oil_product_id ?? body.gear_oil_product_id;
  const frozen: OilVisitQueueBody = {
    ...body,
    client_id: body.client_id || generateOilUuid(),
    occurred_at: body.occurred_at || formatOilOccurredAt(),
  };
  if (gearbox != null) frozen.gearbox_oil_product_id = gearbox;
  delete frozen.gear_oil_product_id;
  return frozen;
}

export function enqueueOilVisit(
  body: Omit<OilVisitQueueBody, "client_id" | "occurred_at"> & {
    client_id?: string;
    occurred_at?: string;
  },
): OilOutboxItem {
  const frozen = freezeOilVisitBody(body);
  const existing = readQueue().find((item) => item.clientId === frozen.client_id);
  if (existing) return existing;
  const item: OilOutboxItem = {
    id: `oil_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    clientId: frozen.client_id,
    body: frozen,
    createdAt: Date.now(),
    retryCount: 0,
  };
  writeQueue([...readQueue(), item]);
  return item;
}

export function removeOilOutboxItem(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function updateOilOutboxItem(id: string, patch: Partial<OilOutboxItem>) {
  writeQueue(
    readQueue().map((item) => (item.id === id ? { ...item, ...patch } : item)),
  );
}

function catalogIdbKey(includeInactive: boolean) {
  return includeInactive ? CATALOG_IDB_INACTIVE : CATALOG_IDB_ACTIVE;
}

function readOilCatalogCacheSync(includeInactive: boolean): OilProductCatalogResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(localStorage.getItem(CATALOG_KEY) || "{}") as Record<
      string,
      OilProductCatalogResponse
    >;
    return all[includeInactive ? "inactive" : "active"] || all.active || null;
  } catch {
    return null;
  }
}

export async function saveOilCatalogCache(
  res: OilProductCatalogResponse,
  includeInactive: boolean,
) {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(localStorage.getItem(CATALOG_KEY) || "{}") as Record<
      string,
      unknown
    >;
    all[includeInactive ? "inactive" : "active"] = res;
    localStorage.setItem(CATALOG_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  try {
    await oilIdbPut(catalogIdbKey(includeInactive), res);
  } catch {
    /* ignore */
  }
}

export async function readOilCatalogCache(
  includeInactive: boolean,
): Promise<OilProductCatalogResponse | null> {
  const fromIdb = await oilIdbGet<OilProductCatalogResponse>(catalogIdbKey(includeInactive));
  if (fromIdb) return fromIdb;
  if (!includeInactive) {
    const inactive = await oilIdbGet<OilProductCatalogResponse>(CATALOG_IDB_INACTIVE);
    if (inactive) return inactive;
  }
  const fromLs = readOilCatalogCacheSync(includeInactive);
  if (fromLs) {
    try {
      await oilIdbPut(catalogIdbKey(includeInactive), fromLs);
    } catch {
      /* ignore */
    }
  }
  return fromLs;
}

export function peekOilCatalogCache(includeInactive = false) {
  return readOilCatalogCacheSync(includeInactive);
}

export async function saveOilReportsCache(res: OilReportsResponse) {
  try {
    await oilIdbPut(REPORTS_IDB_KEY, res);
  } catch {
    /* ignore */
  }
}

export async function readOilReportsCache(): Promise<OilReportsResponse | null> {
  return oilIdbGet<OilReportsResponse>(REPORTS_IDB_KEY);
}

export function isOilNetworkError(res: { hasError?: boolean; statusCode?: number; message?: string } | null | undefined) {
  if (!res || !res.hasError) return false;
  if (res.statusCode === 0) return true;
  const msg = String(res.message || "");
  return /اتصال|network|failed to fetch|offline/i.test(msg);
}

export function isOilDuplicateVisit(res: unknown): boolean {
  if (!res || typeof res !== "object") return false;
  const obj = res as Record<string, unknown>;
  const nested =
    obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : obj;
  const already = nested.already_exists ?? obj.already_exists;
  const code = String(nested.code ?? obj.code ?? "");
  const status = Number(obj.statusCode ?? obj.status);
  if (already === true && (code === "duplicate_client_id" || status === 200)) return true;
  if (status === 200 && code === "duplicate_client_id") return true;
  return false;
}

export function isOilVisitCreated(res: unknown): boolean {
  if (!res || typeof res !== "object") return false;
  const obj = res as Record<string, unknown>;
  const nested =
    obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : obj;
  const already = nested.already_exists ?? obj.already_exists;
  const status = Number(obj.statusCode ?? obj.status);
  if (status === 201) return true;
  if (already === false) return true;
  if (status === 200 && already !== true && !isOilDuplicateVisit(res)) return true;
  return false;
}

export { generateOilUuid as generateOilClientId };
