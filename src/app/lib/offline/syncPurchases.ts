import tokenCode from "@/app/coponent/tokenCode";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import {
  listPendingOutboxItems,
  removeOutboxItem,
  updateOutboxItem,
  type OutboxItem,
} from "./outbox";
import { generateClientId } from "./clientId";

/**
 * قرارداد backend برای جلوگیری از خرید تکراری:
 * - POST /api/purchased-products باید فیلد client_id (UUID) بپذیرد
 * - unique per shop: (shop_id, client_id)
 * - اگر client_id تکراری بود: 200/409 با already_exists: true برگردانید (نه ثبت دوباره)
 */
export function attachClientIdToPayload(
  payload: Record<string, unknown>,
  clientId?: string,
): { payload: Record<string, unknown>; clientId: string } {
  const id = clientId ?? generateClientId();
  return {
    clientId: id,
    payload: { ...payload, client_id: id },
  };
}

function extractErrorText(res: unknown): string {
  if (!res || typeof res !== "object") return "";
  const obj = res as Record<string, unknown>;
  return String(obj.errorText ?? obj.message ?? obj.error ?? "");
}

export function isDuplicatePurchaseResponse(res: unknown): boolean {
  if (!res || typeof res !== "object") return false;
  const obj = res as Record<string, unknown>;

  if (obj.already_exists === true || obj.duplicate === true) return true;
  if (obj.code === "duplicate_client_id" || obj.code === "DUPLICATE_CLIENT_ID") return true;

  const status = Number(obj.status ?? obj.statusCode);
  if (status === 409) return true;

  const text = extractErrorText(res).toLowerCase();
  return (
    text.includes("duplicate") ||
    text.includes("client_id") ||
    text.includes("تکرار") ||
    text.includes("قبلا") ||
    text.includes("already")
  );
}

export function isInventoryErrorResponse(res: unknown): boolean {
  const text = extractErrorText(res);
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error && String(parsed.error).includes("موجودی")) return true;
  } catch {
    /* ignore */
  }
  return text.includes("موجودی");
}

export type SyncPurchasesResult = {
  successful: string[];
  failed: OutboxItem[];
  duplicate: string[];
};

export async function syncOutboxItem(item: OutboxItem): Promise<"success" | "duplicate" | "failed"> {
  if (item.type !== "purchase") {
    await updateOutboxItem(item.id, {
      status: "failed",
      lastError: "نوع عملیات هنوز پشتیبانی نمی‌شود",
      lastAttemptAt: Date.now(),
    });
    return "failed";
  }

  await updateOutboxItem(item.id, { status: "syncing", lastAttemptAt: Date.now() });

  const token = tokenCode() || "";
  const payload = {
    ...item.payload,
    client_id: item.clientId,
  };

  try {
    const res = await apiRequestError(
      "Post",
      {},
      payload,
      "/api/purchased-products",
      true,
      true,
      token,
    );

    if (!res?.hasError) {
      await removeOutboxItem(item.id);
      return "success";
    }

    if (isDuplicatePurchaseResponse(res)) {
      await removeOutboxItem(item.id);
      return "duplicate";
    }

    if (isInventoryErrorResponse(res)) {
      await updateOutboxItem(item.id, {
        status: "failed",
        retryCount: item.retryCount + 1,
        lastError: extractErrorText(res) || "خطای موجودی",
        lastAttemptAt: Date.now(),
      });
      return "failed";
    }

    await updateOutboxItem(item.id, {
      status: "failed",
      retryCount: item.retryCount + 1,
      lastError: extractErrorText(res) || "خطا در ثبت خرید",
      lastAttemptAt: Date.now(),
    });
    return "failed";
  } catch (error) {
    await updateOutboxItem(item.id, {
      status: "pending",
      retryCount: item.retryCount + 1,
      lastError: error instanceof Error ? error.message : "خطا در اتصال",
      lastAttemptAt: Date.now(),
    });
    return "failed";
  }
}

export async function syncAllPendingPurchases(options?: {
  minIntervalMs?: number;
  delayBetweenMs?: number;
}): Promise<SyncPurchasesResult> {
  const minIntervalMs = options?.minIntervalMs ?? 5000;
  const delayBetweenMs = options?.delayBetweenMs ?? 200;

  const pending = await listPendingOutboxItems();
  const purchases = pending.filter((item) => item.type === "purchase");

  const result: SyncPurchasesResult = {
    successful: [],
    failed: [],
    duplicate: [],
  };

  if (purchases.length === 0) return result;

  for (let i = 0; i < purchases.length; i++) {
    const item = purchases[i];
    const outcome = await syncOutboxItem(item);

    if (outcome === "success") {
      result.successful.push(item.id);
    } else if (outcome === "duplicate") {
      result.duplicate.push(item.id);
    } else {
      const refreshed = (await listPendingOutboxItems()).find((p) => p.id === item.id);
      if (refreshed) result.failed.push(refreshed);
    }

    if (i < purchases.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }

  void minIntervalMs; // reserved for future throttle hook
  return result;
}
