"use client";

import { matchApiCallKey } from "./apiCallKeys";
import { recordApiCallAction } from "./apiCallCountActions";
import { loggedInName } from "./visitorName";

/** فقط APIهای فهرست‌شده در apiCallKeys شمرده می‌شوند؛ خطای شمارش هرگز درخواست اصلی را خراب نمی‌کند. */
export function trackApiCall(method: string, url: string, result: unknown): void {
  if (typeof window === "undefined") return;
  const key = matchApiCallKey(method, url);
  if (!key) return;
  const row = result && typeof result === "object" ? (result as Record<string, unknown>) : null;
  const failed = !row || row.hasError === true;
  const status = failed ? Number(row?.statusCode) || 0 : 200;
  try {
    void recordApiCallAction(key, !failed, status, loggedInName()).catch(() => undefined);
  } catch {
    /* ignore */
  }
}
