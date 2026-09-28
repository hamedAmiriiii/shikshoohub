"use client";

import { useEffect } from "react";
import { recordSitePageViewAction } from "@/app/lib/sitePageViewActions";
import type { SitePageKey } from "@/app/lib/sitePageViews";
import { loggedInName } from "@/app/lib/visitorName";

/** یک بازدید برای هر باز شدن واقعی صفحه. رندر دوبارهٔ توسعه دوبار حساب نمی‌شود. */
export default function RecordSiteView({ page }: { page: SitePageKey }) {
  useEffect(() => {
    const key = `site-view:${page}`;
    const now = Date.now();
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Number.isFinite(last) && now - last < 2500) return;
    sessionStorage.setItem(key, String(now));
    void recordSitePageViewAction(page, loggedInName()).catch(() => {
      sessionStorage.removeItem(key);
    });
  }, [page]);

  return null;
}
