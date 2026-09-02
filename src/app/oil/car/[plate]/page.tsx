"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { isOilApiError, oilGetCustomer, oilVisitSummary } from "@/app/lib/oil/api";
import { emptyPlateParts, formatKm } from "@/app/lib/oil/plate";
import type { OilVisit } from "@/app/lib/oil/types";
import IranPlate from "../../IranPlate";

export default function OilCarPage() {
  const params = useParams<{ plate: string }>();
  const plateParam = decodeURIComponent(String(params.plate || ""));
  const [customer, setCustomer] = useState<OilVisit | null>(null);
  const [visits, setVisits] = useState<OilVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!plateParam) return;
    setLoading(true);
    void oilGetCustomer(plateParam)
      .then((res) => {
        if (isOilApiError(res)) {
          toast.error(res.message);
          return;
        }
        setCustomer(res.customer);
        setVisits(res.visits || []);
      })
      .finally(() => setLoading(false));
  }, [plateParam]);

  if (loading) {
    return (
      <div className="oil-page">
        <div className="oil-empty">در حال بارگذاری…</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="oil-page">
        <div className="oil-empty">این پلاک پیدا نشد.</div>
      </div>
    );
  }

  return (
    <div className="oil-page">
      <IranPlate parts={customer.plate_parts || emptyPlateParts()} readOnly size="lg" />
      <div className="oil-card" style={{ marginTop: 16 }}>
        <div className="oil-card-meta">
          <span>موبایل</span>
          <span dir="ltr">{customer.phone}</span>
        </div>
        <div className="oil-card-meta">
          <span>آخرین کیلومتر</span>
          <span className="oil-km">{formatKm(customer.km)}</span>
        </div>
        <div className="oil-card-meta">
          <span>تعویض بعدی</span>
          <span className="oil-km">{formatKm(customer.next_km)}</span>
        </div>
        <div className="oil-card-meta">
          <span>تعداد مراجعه</span>
          <span>{customer.visit_count ?? visits.length}</span>
        </div>
        {oilVisitSummary(customer) ? (
          <p className="oil-visit-desc">{oilVisitSummary(customer)}</p>
        ) : null}
      </div>

      <h2 style={{ fontSize: 16, margin: "20px 0 8px" }}>سوابق</h2>
      <ul className="oil-history">
        {(visits.length ? visits : [customer]).map((visit) => (
          <li key={visit.id}>
            <div className="oil-card-meta">
              <span className="oil-km">{visit.created_at_jalali}</span>
              {!visit.sms_sent && (
                <span style={{ color: "#ffb4b4" }}>پیامک نرفت</span>
              )}
            </div>
            <div className="oil-card-meta">
              <span>کیلومتر {formatKm(visit.km)}</span>
              <span>بعدی {formatKm(visit.next_km)}</span>
            </div>
            {oilVisitSummary(visit) ? (
              <p className="oil-visit-desc">{oilVisitSummary(visit)}</p>
            ) : null}
            {visit.sms_error && (
              <p className="oil-muted" style={{ marginTop: 6 }}>
                {visit.sms_error}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
