import { OUTBOX_STORE, idbDelete, idbGetAll, idbPut } from "./db";
import { generateClientId } from "./clientId";
import { notifyOutboxChanged } from "./events";

export type OutboxOperationType = "purchase" | "return";
export type OutboxStatus = "pending" | "syncing" | "failed";

export type OutboxMeta = {
  cart?: unknown[];
  total?: number;
  phone?: string;
};

export type OutboxItem = {
  id: string;
  clientId: string;
  type: OutboxOperationType;
  status: OutboxStatus;
  payload: Record<string, unknown>;
  meta: OutboxMeta;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  lastAttemptAt?: number;
  lastError?: string;
};

const MIGRATION_FLAG = "webino_outbox_migrated_v1";

function sortOutboxItems(items: OutboxItem[]): OutboxItem[] {
  return [...items].sort((a, b) => a.createdAt - b.createdAt);
}

export async function listOutboxItems(): Promise<OutboxItem[]> {
  await migratePendingPurchasesFromLocalStorage();
  const items = await idbGetAll<OutboxItem>(OUTBOX_STORE);
  return sortOutboxItems(items);
}

export async function listPendingOutboxItems(): Promise<OutboxItem[]> {
  const items = await listOutboxItems();
  return items.filter((item) => item.status === "pending" || item.status === "failed");
}

export async function getOutboxItem(id: string): Promise<OutboxItem | undefined> {
  const items = await listOutboxItems();
  return items.find((item) => item.id === id);
}

export async function enqueueOutboxItem(input: {
  type: OutboxOperationType;
  payload: Record<string, unknown>;
  clientId?: string;
  meta?: OutboxMeta;
}): Promise<OutboxItem> {
  await migratePendingPurchasesFromLocalStorage();

  const now = Date.now();
  const clientId = input.clientId ?? generateClientId();
  const payload = { ...input.payload, client_id: clientId };

  const item: OutboxItem = {
    id: `outbox_${now}_${Math.random().toString(36).slice(2, 9)}`,
    clientId,
    type: input.type,
    status: "pending",
    payload,
    meta: input.meta ?? {},
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
  };

  await idbPut(OUTBOX_STORE, item);
  notifyOutboxChanged();
  return item;
}

export async function updateOutboxItem(
  id: string,
  patch: Partial<Omit<OutboxItem, "id">>,
): Promise<void> {
  const items = await idbGetAll<OutboxItem>(OUTBOX_STORE);
  const current = items.find((item) => item.id === id);
  if (!current) return;

  const updated: OutboxItem = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  await idbPut(OUTBOX_STORE, updated);
  notifyOutboxChanged();
}

export async function removeOutboxItem(id: string): Promise<void> {
  await idbDelete(OUTBOX_STORE, id);
  notifyOutboxChanged();
}

export async function clearOutbox(): Promise<void> {
  const items = await idbGetAll<OutboxItem>(OUTBOX_STORE);
  await Promise.all(items.map((item) => idbDelete(OUTBOX_STORE, item.id)));
  notifyOutboxChanged();
}

/** مهاجرت از localStorage قدیمی */
export async function migratePendingPurchasesFromLocalStorage(): Promise<number> {
  if (typeof window === "undefined") return 0;
  if (localStorage.getItem(MIGRATION_FLAG) === "1") return 0;

  let migrated = 0;
  try {
    const raw = localStorage.getItem("pending_purchases");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const legacy of parsed) {
          const clientId = generateClientId();
          const payload =
            legacy?.data && typeof legacy.data === "object"
              ? { ...legacy.data, client_id: legacy.data.client_id ?? clientId }
              : { client_id: clientId };

          const item: OutboxItem = {
            id: String(legacy.id ?? `legacy_${Date.now()}_${migrated}`),
            clientId: String(payload.client_id ?? clientId),
            type: "purchase",
            status: "pending",
            payload,
            meta: {
              cart: legacy.cart,
              total: legacy.total,
              phone: legacy.phone,
            },
            createdAt: Number(legacy.timestamp) || Date.now(),
            updatedAt: Date.now(),
            retryCount: 0,
          };
          await idbPut(OUTBOX_STORE, item);
          migrated += 1;
        }
      }
      localStorage.removeItem("pending_purchases");
    }
  } catch (error) {
    console.error("Outbox migration failed:", error);
  }

  localStorage.setItem(MIGRATION_FLAG, "1");
  if (migrated > 0) notifyOutboxChanged();
  return migrated;
}

/** سازگاری با UI قدیمی */
export function outboxItemToLegacyPending(item: OutboxItem) {
  return {
    id: item.id,
    data: item.payload,
    timestamp: item.createdAt,
    cart: item.meta.cart,
    total: item.meta.total,
    phone: item.meta.phone,
    clientId: item.clientId,
    status: item.status,
    retryCount: item.retryCount,
    lastError: item.lastError,
  };
}
