"use server";

import {
  cleanVisitorName,
  isSitePageKey,
  readSitePageStats,
  recordSitePageView,
  type SitePageStat,
} from "./sitePageViews";
import { requestIp } from "./requestIp";

const recent = new Map<string, number>();

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
