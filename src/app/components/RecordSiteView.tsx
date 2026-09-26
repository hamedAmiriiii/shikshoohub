"use client";

import { useEffect } from "react";
import { recordSitePageViewAction } from "@/app/lib/sitePageViewActions";
import type { SitePageKey } from "@/app/lib/sitePageViews";

function loggedInName(): string {
  try {
    if (!localStorage.getItem("token")) return "";
    const user = JSON.parse(localStorage.getItem("user") || "{}") as {
      name?: string;
      last_name?: string;
      fullName?: string;
      full_name?: string;
      atelier_name?: string;
      shop_name?: string;
      atelier?: { name?: string };
    };
    const person = [user.name, user.last_name].filter(Boolean).join(" ").trim()
      || user.fullName
      || user.full_name
      || "";
    const shop = user.atelier_name || user.shop_name || user.atelier?.name || "";
    if (person && shop && person !== shop) return `${person} — ${shop}`;
    return person || shop;
  } catch {
    return "";
  }
}

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
