import Link from "next/link";
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
import type { OilPublicVisit } from "@/app/lib/oil/types";

type Props = { params: { code: string; phone: string } };

function VisitDetails({ visit }: { visit: OilPublicVisit }) {
  const itemLines = oilVisitItemLines(visit.items);
  const notes = visit.notes?.trim() || "";
  const showNotes = notes && notes !== itemLines.join(" — ");
  return (
    <>
      {visit.shop_name ? (
        <div className="oil-card-meta">
          <span>فروشگاه</span>
          <span>{visit.shop_name}</span>
        </div>
      ) : null}
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
      {showNotes ? <p className="oil-visit-desc">{notes}</p> : null}
    </>
  );
}

export default async function OilShopHistoryPage({ params }: Props) {
  const code = decodeURIComponent(params.code || "").trim();
  const phone = normalizeOilPublicPhone(params.phone);

  if (!code) {
    return (
      <div className="oil-page">
        <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>سوابق تعویض روغن</h1>
        <div className="oil-empty">فروشگاه یافت نشد.</div>
      </div>
    );
  }

  if (!phone) {
    return (
      <div className="oil-page">
        <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>سوابق تعویض روغن</h1>
        <div className="oil-empty">شماره موبایل معتبر نیست.</div>
        <Link
          href={`/oilservice/shop/${encodeURIComponent(code)}`}
          className="oil-btn oil-btn-ghost"
          style={{ marginTop: 12, textDecoration: "none" }}
        >
          بازگشت
        </Link>
      </div>
    );
  }

  const res = await oilPublicHistory(phone, code);
  if (isOilApiError(res)) {
    const notFound = res.statusCode === 404;
    const invalid = res.statusCode === 422;
    return (
      <div className="oil-page">
        <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>سوابق تعویض روغن</h1>
        <div className="oil-empty">
          {notFound
            ? "فروشگاه یافت نشد."
            : invalid
              ? "شماره موبایل معتبر نیست."
              : res.message}
        </div>
        <Link
          href={`/oilservice/shop/${encodeURIComponent(code)}`}
          className="oil-btn oil-btn-ghost"
          style={{ marginTop: 12, textDecoration: "none" }}
        >
          بازگشت
        </Link>
      </div>
    );
  }

  const { cars, shop } = normalizeOilPublicHistory(res, phone);
  const shopName = shop?.name || "تعویض روغن";

  return (
    <div className="oil-page">
      <h1 style={{ fontSize: 18, margin: "0 0 4px" }}>{shopName}</h1>
      <p className="oil-muted" style={{ marginTop: 0, marginBottom: 4 }}>
        سوابق تعویض روغن
      </p>
      <p className="oil-muted" dir="ltr" style={{ marginTop: 0 }}>
        {res.phone || phone}
      </p>
      <Link
        href={`/oilservice/shop/${encodeURIComponent(code)}`}
        className="oil-btn oil-btn-ghost"
        style={{ marginTop: 8, marginBottom: 8, textDecoration: "none" }}
      >
        شماره دیگر
      </Link>

      {cars.length === 0 ? (
        <div className="oil-empty">سابقه‌ای برای این شماره در این فروشگاه پیدا نشد.</div>
      ) : (
        cars.map((car) => {
          const parts =
            car.plate_parts ||
            parsePlate(car.plate_display) ||
            parsePlate(car.plate) ||
            emptyPlateParts();
          const plateOk = Boolean(parts.serial && parts.middle && parts.province);
          return (
            <section key={car.plate_display || car.plate} style={{ marginTop: 18 }}>
              {plateOk ? (
                <IranPlate parts={parts} readOnly size="lg" />
              ) : (
                <p style={{ fontWeight: 700, margin: "0 0 8px" }}>{car.plate_display}</p>
              )}
              <ul className="oil-history">
                {(car.visits || []).map((visit, index) => (
                  <li key={`${car.plate_display}-${visit.created_at_jalali || index}`}>
                    {visit.created_at_jalali ? (
                      <div className="oil-card-meta">
                        <span className="oil-km">{visit.created_at_jalali}</span>
                      </div>
                    ) : null}
                    <VisitDetails visit={visit} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
