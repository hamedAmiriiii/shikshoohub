const DB_NAME = "oil_offline";
const DB_VERSION = 1;
const KV_STORE = "kv";

type KvRecord<T> = {
  key: string;
  value: T;
  updatedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openOilDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(KV_STORE)) {
          db.createObjectStore(KV_STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB open failed"));
    });
  }
  return dbPromise;
}

export async function oilIdbPut<T>(key: string, value: T): Promise<void> {
  const db = await openOilDb();
  const record: KvRecord<T> = { key, value, updatedAt: Date.now() };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(KV_STORE, "readwrite");
    tx.objectStore(KV_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function oilIdbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openOilDb();
    const record = await new Promise<KvRecord<T> | undefined>((resolve, reject) => {
      const tx = db.transaction(KV_STORE, "readonly");
      const request = tx.objectStore(KV_STORE).get(key);
      request.onsuccess = () => resolve(request.result as KvRecord<T> | undefined);
      request.onerror = () => reject(request.error);
    });
    return record?.value ?? null;
  } catch {
    return null;
  }
}
