"use server";

import { isApiCallKey } from "./apiCallKeys";
import { readApiCallStats, recordApiCall, type ApiCallStat } from "./apiCallCounts";
import { requestIp } from "./requestIp";
import { cleanVisitorName } from "./sitePageViews";

const recent = new Map<string, number>();

export async function recordApiCallAction(
  key: string,
  ok: boolean,
  status: number,
  visitorName?: string,
): Promise<{ ok: boolean }> {
  if (!isApiCallKey(key)) return { ok: false };

  const ip = requestIp();
  const stamp = `${ip}:${key}:${ok ? 1 : 0}`;
  const now = Date.now();
  if (now - (recent.get(stamp) || 0) < 1500) return { ok: true };
  recent.set(stamp, now);
  if (recent.size > 4000) {
    for (const [item, at] of recent) {
      if (now - at > 60_000) recent.delete(item);
    }
  }

  await recordApiCall(key, {
    ok: Boolean(ok),
    status: Number.isFinite(Number(status)) ? Math.max(0, Math.floor(Number(status))) : 0,
    ip,
    name: cleanVisitorName(visitorName),
  });
  return { ok: true };
}

export async function readApiCallStatsAction(): Promise<ApiCallStat[]> {
  return readApiCallStats();
}
