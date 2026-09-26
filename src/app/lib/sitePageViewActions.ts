"use server";

import { headers } from "next/headers";
import {
  cleanVisitorIp,
  cleanVisitorName,
  isSitePageKey,
  readSitePageStats,
  recordSitePageView,
  type SitePageStat,
} from "./sitePageViews";

const recent = new Map<string, number>();

function requestIp(): string {
  const h = headers();
  const raw =
    h.get("x-forwarded-for")?.split(",")[0] ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "";
  return cleanVisitorIp(raw);
}

export async function recordSitePageViewAction(page: string, visitorName?: string): Promise<{ ok: boolean }> {
  if (!isSitePageKey(page)) return { ok: false };

  const ip = requestIp();
  const stamp = `${ip || "unknown"}:${page}`;
  const now = Date.now();
  const last = recent.get(stamp) || 0;
  if (now - last < 2000) return { ok: true };
  recent.set(stamp, now);
  if (recent.size > 4000) {
    for (const [key, at] of recent) {
      if (now - at > 60_000) recent.delete(key);
    }
  }

  await recordSitePageView(page, { ip, name: cleanVisitorName(visitorName) });
  return { ok: true };
}

export async function readSitePageStatsAction(): Promise<SitePageStat[]> {
  return readSitePageStats();
}
