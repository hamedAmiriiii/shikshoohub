"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { toast } from "react-toastify";
import { isOilApiError, oilListCustomers, oilVisitSummary } from "@/app/lib/oil/api";
import { getOilToken } from "@/app/lib/oil/auth";
import { emptyPlateParts, formatKm, parsePlate } from "@/app/lib/oil/plate";
import type { OilVisit } from "@/app/lib/oil/types";
import { useOilAuth } from "../OilAuth";
import IranPlate from "../IranPlate";

export default function OilCustomersPage() {
  const { session, ready } = useOilAuth();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<OilVisit[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const accessOk = session?.shop_access?.shop_access_active !== false;

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (!ready || !getOilToken()) return;
      setLoading(true);
      try {
        const res = await oilListCustomers(debounced || undefined, nextPage, 30);
        if (isOilApiError(res)) {
          toast.error(res.message);
          return;
        }
        setPage(res.current_page);
        setLastPage(res.last_page);
        setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      } finally {
        setLoading(false);
      }
    },
    [debounced, ready],
  );

  useEffect(() => {
    void load(1, true);
  }, [load]);

  const emptyText = useMemo(() => {
    if (loading && items.length === 0) return "در حال بارگذاری…";
    if (debounced) return "مشتری با این پلاک یا موبایل پیدا نشد.";
    return "هنوز تعویضی ثبت نشده. از دکمه ایجاد شروع کنید.";
  }, [debounced, items.length, loading]);

  return (
    <div className="oil-page" style={{ paddingBottom: 88 }}>
      {!accessOk && (
        <div className="oil-banner warn">
          دوره دسترسی مغازه تمام شده؛ ثبت تعویض جدید ممکن نیست.
        </div>
      )}

      <div style={{ position: "relative" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: 12,
            top: 14,
            color: "#9aa3ad",
            pointerEvents: "none",
          }}
        />
        <input
          className="oil-search"
          placeholder="جستجو پلاک یا موبایل"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {items.length === 0 ? (
        <div className="oil-empty">{emptyText}</div>
      ) : (
        items.map((visit) => {
          const summary = oilVisitSummary(visit);
          return (
          <Link
            key={`${visit.plate}-${visit.id}`}
            href={`/oil/car/${encodeURIComponent(visit.plate)}`}
            className="oil-card"
          >
            <IranPlate
              parts={visit.plate_parts || parsePlate(visit.plate) || emptyPlateParts()}
              readOnly
              size="sm"
            />
            <div className="oil-card-meta">
              <span dir="ltr">{visit.phone}</span>
              <span>{visit.created_at_jalali}</span>
            </div>
            <div className="oil-card-meta">
              <span>
                کیلومتر <span className="oil-km">{formatKm(visit.km)}</span>
              </span>
              <span>
                بعدی <span className="oil-km">{formatKm(visit.next_km)}</span>
              </span>
            </div>
            {summary ? <p className="oil-visit-desc">{summary}</p> : null}
            <div className="oil-card-meta">
              <span>{visit.visit_count ?? 1} مراجعه</span>
              {!visit.sms_sent && <span style={{ color: "#ffb4b4" }}>پیامک نرفت</span>}
            </div>
          </Link>
          );
        })
      )}

      {page < lastPage && (
        <button
          type="button"
          className="oil-btn oil-btn-ghost"
          style={{ marginTop: 16 }}
          disabled={loading}
          onClick={() => void load(page + 1, false)}
        >
          بارگذاری بیشتر
        </button>
      )}

      {accessOk && (
        <Link href="/oil/new" className="oil-fab">
          <Plus size={20} />
          ایجاد
        </Link>
      )}
    </div>
  );
}
