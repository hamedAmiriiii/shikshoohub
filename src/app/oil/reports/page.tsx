"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  isOilApiError,
  oilGetReports,
  normalizeOilReports,
} from "@/app/lib/oil/api";
import type { OilReportPeriod } from "@/app/lib/oil/types";
import { useOilAuth } from "../OilAuth";

const formatMoney = (n: number) =>
  `${new Intl.NumberFormat("fa-IR").format(n)} تومان`;

const PERIODS: { key: "today" | "week" | "month"; label: string }[] = [
  { key: "today", label: "امروز" },
  { key: "week", label: "این هفته" },
  { key: "month", label: "این ماه" },
];

function ReportCard({ title, period }: { title: string; period: OilReportPeriod }) {
  return (
    <div className="oil-report-card">
      <h3>{title}</h3>
      <div className="oil-report-row">
        <span>فروش</span>
        <strong>{formatMoney(period.sales)}</strong>
      </div>
      <div className="oil-report-row oil-report-profit">
        <span>سود</span>
        <strong>{formatMoney(period.profit)}</strong>
      </div>
    </div>
  );
}

export default function OilReportsPage() {
  const { session } = useOilAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState(() => normalizeOilReports(null));

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const res = await oilGetReports();
      if (cancelled) return;
      if (isOilApiError(res)) {
        toast.error(res.message);
        setReports(normalizeOilReports(null));
      } else {
        setReports(normalizeOilReports(res));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <div className="oil-page">
      <p className="oil-muted" style={{ marginTop: 0, marginBottom: 12 }}>
        فروش و سود تعویض‌هایی که قیمت فروش محصول صفر نبوده و فاکتور نقدی ساخته شده.
      </p>
      {loading ? (
        <p className="oil-muted">در حال بارگذاری گزارش…</p>
      ) : (
        PERIODS.map((item) => (
          <ReportCard key={item.key} title={item.label} period={reports[item.key]} />
        ))
      )}
    </div>
  );
}
