import IranPlate from "@/app/oil/IranPlate";
import {
  isOilApiError,
  oilPublicHistory,
  oilVisitItemLines,
  normalizeOilPublicHistory,
} from "@/app/lib/oil/api";
import {
  emptyPlateParts,
  formatKm,
  normalizeOilPublicPhone,
  parsePlate,
} from "@/app/lib/oil/plate";
import type { OilVisit } from "@/app/lib/oil/types";

type Props = { params: { phone: string } };

function visitPlateParts(visit: OilVisit) {
  return visit.plate_parts || parsePlate(visit.plate) || emptyPlateParts();
}

function VisitDetails({ visit }: { visit: OilVisit }) {
  const itemLines = oilVisitItemLines(visit.items);
  const notes = visit.notes?.trim() || "";
  const showNotes = notes && notes !== itemLines.join(" — ");
  return (
    <>
      <div className="oil-card-meta">
        <span>کیلومتر</span>
        <span className="oil-km">{formatKm(visit.km)}</span>
      </div>
      {visit.next_km ? (
        <div className="oil-card-meta">
          <span>تعویض بعدی</span>
          <span className="oil-km">{formatKm(visit.next_km)}</span>
        </div>
      ) : null}
      {itemLines.length > 0 ? (
        <div className="oil-visit-desc">
          {itemLines.map((line) => (
            <p key={line} style={{ margin: "0 0 4px" }}>
              {line}
            </p>
          ))}
        </div>
      ) : null}
      {showNotes ? (
        <p className="oil-visit-desc">{notes}</p>
      ) : null}
    </>
  );
}

export default async function OilPublicHistoryPage({ params }: Props) {
  const phone = normalizeOilPublicPhone(params.phone);

  if (phone.length < 10) {
    return (
      <div className="oil-page">
        <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>سوابق تعویض روغن</h1>
        <div className="oil-empty">شماره موبایل معتبر نیست.</div>
      </div>
    );
  }

  const res = await oilPublicHistory(phone);
  if (isOilApiError(res)) {
    return (
      <div className="oil-page">
        <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>سوابق تعویض روغن</h1>
        <div className="oil-empty">
          {res.statusCode === 404 ? "سابقه‌ای برای این شماره پیدا نشد." : res.message}
        </div>
      </div>
    );
  }

  const { shopName, visits } = normalizeOilPublicHistory(res, phone);
  const plates = Array.from(new Set(visits.map((v) => v.plate).filter(Boolean)));
  const singlePlate = plates.length === 1 ? visitPlateParts(visits[0]) : null;

  return (
    <div className="oil-page">
      <h1 style={{ fontSize: 18, margin: "0 0 4px" }}>سوابق تعویض روغن</h1>
      {shopName ? (
        <p className="oil-muted" style={{ margin: "0 0 4px" }}>
          {shopName}
        </p>
      ) : null}
      <p className="oil-muted" dir="ltr" style={{ marginTop: 6 }}>
        {phone}
      </p>

      {visits.length === 0 ? (
        <div className="oil-empty">سابقه‌ای برای این شماره پیدا نشد.</div>
      ) : (
        <>
          {singlePlate ? (
            <IranPlate parts={singlePlate} readOnly size="lg" />
          ) : null}

          <ul className="oil-history">
            {visits.map((visit) => (
              <li key={visit.id || `${visit.plate}-${visit.created_at}`}>
                {!singlePlate ? (
                  <div style={{ marginBottom: 10 }}>
                    <IranPlate parts={visitPlateParts(visit)} readOnly size="sm" />
                  </div>
                ) : null}
                {visit.created_at_jalali ? (
                  <div className="oil-card-meta">
                    <span className="oil-km">{visit.created_at_jalali}</span>
                  </div>
                ) : null}
                <VisitDetails visit={visit} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
