"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Droplets, Mail, Package, Plus, TrendingUp, Users } from "lucide-react";
import { formatKm } from "@/app/lib/oil/plate";
import { isOilApiError, oilGetReports, normalizeOilReports } from "@/app/lib/oil/api";
import { useOilAuth } from "./OilAuth";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

export default function OilHomePage() {
  const { session } = useOilAuth();
  const accessOk = session?.shop_access?.shop_access_active !== false;
  const intervalKm = session?.shop?.oil_interval_km || 5000;
  const userName = session?.user?.name || "";
  const shopName = session?.shop?.name || "تعویض روغن";
  const [today, setToday] = useState<ReturnType<typeof normalizeOilReports>["today"] | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      const res = await oilGetReports();
      if (cancelled) return;
      if (isOilApiError(res)) return;
      setToday(normalizeOilReports(res).today);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <div className="oil-page oil-page-dash">
      {!accessOk && (
        <div className="oil-banner warn">
          دوره دسترسی مغازه تمام شده؛ ثبت تعویض جدید ممکن نیست.
        </div>
      )}

      <div className="oil-dash-hello">
        <p className="oil-muted" style={{ margin: 0 }}>
          {userName ? `سلام ${userName}` : "سلام"}
        </p>
        <h2>{shopName}</h2>
      </div>

      <div className="oil-dash-grid">
        <Link href="/oil/reports" className="oil-dash-tile">
          <span className="oil-dash-icon">
            <TrendingUp size={18} />
          </span>
          <span className="oil-dash-label">فروش امروز</span>
          <span className="oil-dash-value">{today ? formatNumber(today.sales) : "…"}</span>
        </Link>
        <Link href="/oil/reports" className="oil-dash-tile oil-dash-tile-ok">
          <span className="oil-dash-icon">
            <TrendingUp size={18} />
          </span>
          <span className="oil-dash-label">سود امروز</span>
          <span className="oil-dash-value">{today ? formatNumber(today.profit) : "…"}</span>
        </Link>
        {/* <div className="oil-dash-tile oil-dash-tile-wide">
          <span className="oil-dash-icon">
            <Droplets size={18} />
          </span>
          <span className="oil-dash-label">فاصله تعویض پیشنهادی</span>
          <span className="oil-dash-value">{formatKm(intervalKm)} کیلومتر</span>
        </div> */}
      </div>

      {accessOk ? (
        <Link href="/oil/new" className="oil-btn oil-btn-primary oil-dash-cta">
          <Plus size={20} />
          ثبت تعویض جدید
        </Link>
      ) : (
        <button type="button" className="oil-btn oil-btn-primary oil-dash-cta" disabled>
          ثبت تعویض جدید
        </button>
      )}

      <div className="oil-dash-shortcuts">
        <Link href="/oil/customers" className="oil-dash-shortcut">
          <Users size={18} />
          مشتریان
        </Link>
        <Link href="/oil/products" className="oil-dash-shortcut">
          <Package size={18} />
          محصولات
        </Link>
        <Link href="/oil/reports" className="oil-dash-shortcut">
          <TrendingUp size={18} />
          گزارش
        </Link>
        <Link href="/oil/sms" className="oil-dash-shortcut">
          <Mail size={18} />
          پیامک‌ها
        </Link>
      </div>
    </div>
  );
}
