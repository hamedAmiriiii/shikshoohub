"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  isOilApiError,
  oilCreateVisit,
  oilLookup,
  oilListProducts,
  partsPayload,
  suggestedNextKm,
  normalizeOilProductCatalog,
  activeOilProducts,
  idsFromOilVisitItems,
  oilVisitItemProductId,
} from "@/app/lib/oil/api";
import {
  compactPlate,
  emptyPlateParts,
  formatKm,
  isPlateComplete,
  toEnglishDigits,
} from "@/app/lib/oil/plate";
import type {
  OilPlateParts,
  OilProduct,
  OilProductKind,
  OilProductKindGroup,
  OilVisitItem,
} from "@/app/lib/oil/types";
import { useOilAuth } from "../OilAuth";
import IranPlate from "../IranPlate";

function parsePhone(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, 11);
}

function parseKm(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, 7);
}

function isValidPhone(value: string) {
  return value.length === 11 && value.startsWith("09");
}

function focusEnd(el: HTMLInputElement | null) {
  if (!el) return;
  el.focus();
  const n = el.value.length;
  try {
    el.setSelectionRange(n, n);
  } catch {
    /* ignore */
  }
}

function productOptionLabel(product: OilProduct) {
  const sale = Number(product.sale_price);
  if (Number.isFinite(sale) && sale > 0) {
    return `${product.name} — ${new Intl.NumberFormat("fa-IR").format(sale)}`;
  }
  return product.name;
}

function productSaleAmount(product?: OilProduct) {
  if (!product) return 0;
  const sale = Number(product.sale_price);
  return Number.isFinite(sale) && sale > 0 ? sale : 0;
}

function findProduct(list: OilProduct[], id: number | "") {
  if (id === "") return undefined;
  return list.find((product) => product.id === id);
}

function comboOptions(
  groups: OilProductKindGroup[],
  kind: OilProductKind,
  extraItems: OilVisitItem[],
): OilProduct[] {
  const list = activeOilProducts(groups, kind);
  const extra = extraItems.find((item) => item.kind === kind);
  const extraId = extra ? oilVisitItemProductId(extra) : "";
  if (extraId !== "" && !list.some((p) => p.id === extraId)) {
    const group = groups.find((g) => g.kind === kind);
    const known = group?.products.find((p) => p.id === extraId);
    list.push(
      known || {
        id: extraId,
        kind,
        kind_label: extra?.kind_label || kind,
        name: extra?.name || `محصول ${extraId}`,
        is_active: false,
      },
    );
  }
  return list;
}

export default function OilNewVisitPage() {
  const router = useRouter();
  const { session } = useOilAuth();
  const [parts, setParts] = useState<OilPlateParts>(emptyPlateParts());
  const [phone, setPhone] = useState("");
  const [km, setKm] = useState("");
  const [nextKm, setNextKm] = useState("");
  const [nextKmDirty, setNextKmDirty] = useState(false);
  const [catalog, setCatalog] = useState<OilProductKindGroup[]>([]);
  const [oilProductId, setOilProductId] = useState<number | "">("");
  const [airFilterProductId, setAirFilterProductId] = useState<number | "">("");
  const [oilFilterProductId, setOilFilterProductId] = useState<number | "">("");
  const [lastItems, setLastItems] = useState<OilVisitItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [smsWarn, setSmsWarn] = useState<string | null>(null);
  const lookupKeyRef = useRef("");
  const phoneRef = useRef<HTMLInputElement>(null);
  const kmRef = useRef<HTMLInputElement>(null);

  const interval = session?.shop?.oil_interval_km ?? 5000;
  const kmNum = Number(km);
  const accessOk = session?.shop_access?.shop_access_active !== false;
  const plateOk = isPlateComplete(parts);
  const phoneOk = phone.length === 11 && phone.startsWith("09");
  const kmOk = Number.isFinite(kmNum) && kmNum > 0;

  const oilOptions = useMemo(
    () => comboOptions(catalog, "oil", lastItems),
    [catalog, lastItems],
  );
  const airFilterOptions = useMemo(
    () => comboOptions(catalog, "air_filter", lastItems),
    [catalog, lastItems],
  );
  const oilFilterOptions = useMemo(
    () => comboOptions(catalog, "oil_filter", lastItems),
    [catalog, lastItems],
  );

  const saleTotal = useMemo(() => {
    return (
      productSaleAmount(findProduct(oilOptions, oilProductId)) +
      productSaleAmount(findProduct(airFilterOptions, airFilterProductId)) +
      productSaleAmount(findProduct(oilFilterOptions, oilFilterProductId))
    );
  }, [
    airFilterOptions,
    airFilterProductId,
    oilFilterOptions,
    oilFilterProductId,
    oilOptions,
    oilProductId,
  ]);

  const saleTotalLabel = new Intl.NumberFormat("fa-IR").format(saleTotal);

  useEffect(() => {
    void oilListProducts(false).then((res) => {
      if (isOilApiError(res)) return;
      setCatalog(normalizeOilProductCatalog(res));
    });
  }, []);

  useEffect(() => {
    if (nextKmDirty) return;
    if (!kmOk) {
      setNextKm("");
      return;
    }
    setNextKm(String(suggestedNextKm(kmNum, interval)));
  }, [interval, kmNum, kmOk, nextKmDirty]);

  useEffect(() => {
    if (!plateOk) return;
    const key = compactPlate(parts);
    if (lookupKeyRef.current === key) return;
    lookupKeyRef.current = key;
    void oilLookup({ plate: key }).then((res) => {
      if (isOilApiError(res)) return;
      if (!res.found) {
        setOilProductId("");
        setAirFilterProductId("");
        setOilFilterProductId("");
        setLastItems([]);
        return;
      }
      setPhone((current) => {
        if (current) return current;
        const filled = parsePhone(res.visit.phone);
        if (isValidPhone(filled)) {
          requestAnimationFrame(() => focusEnd(kmRef.current));
        }
        return filled || current;
      });
      setKm((current) => current || String(res.visit.km));
      const items = res.visit.items?.length ? res.visit.items : res.items || [];
      const ids = idsFromOilVisitItems(items);
      setLastItems(items);
      setOilProductId(ids.oil_product_id);
      setAirFilterProductId(ids.air_filter_product_id);
      setOilFilterProductId(ids.oil_filter_product_id);
    });
  }, [parts, plateOk]);

  const handleSubmit = async () => {
    if (!accessOk) {
      toast.error("دوره دسترسی مغازه تمام شده است");
      return;
    }
    if (!plateOk) {
      toast.error("پلاک کامل نیست");
      return;
    }
    if (!phoneOk) {
      toast.error("شماره موبایل صاحب ماشین لازم است");
      return;
    }
    if (!kmOk) {
      toast.error("کیلومتر را وارد کنید");
      return;
    }
    setSaving(true);
    setSmsWarn(null);
    try {
      const body: {
        serial: string;
        letter: string;
        middle: string;
        province: string;
        phone: string;
        km: number;
        next_km?: number;
        oil_product_id?: number;
        air_filter_product_id?: number;
        oil_filter_product_id?: number;
      } = {
        ...partsPayload(parts),
        phone,
        km: kmNum,
      };
      if (nextKmDirty) {
        const n = Number(nextKm);
        if (Number.isFinite(n) && n > kmNum) body.next_km = n;
      }
      if (oilProductId !== "") body.oil_product_id = oilProductId;
      if (airFilterProductId !== "") body.air_filter_product_id = airFilterProductId;
      if (oilFilterProductId !== "") body.oil_filter_product_id = oilFilterProductId;
      const res = await oilCreateVisit(body);
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      if (!res.sms_sent) {
        setSmsWarn(res.message || "ثبت شد ولی پیامک ارسال نشد.");
        toast.warn(res.message);
        return;
      }
      toast.success(res.message || "ثبت شد");
      router.replace(`/oil/car/${encodeURIComponent(res.visit.plate)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="oil-page">
      {!accessOk && (
        <div className="oil-banner warn">
          دوره دسترسی تمام شده؛ نمی‌توانید تعویض جدید ثبت کنید.
        </div>
      )}
      {smsWarn && <div className="oil-banner warn">{smsWarn}</div>}

      <p className="oil-muted" style={{ marginBottom: 10 }}>
        پلاک را وارد کنید.       </p>

      <IranPlate
        parts={parts}
        onChange={setParts}
        onComplete={() => {
          requestAnimationFrame(() => focusEnd(phoneRef.current));
        }}
        size="lg"
      />

      <div className="oil-field" style={{ marginTop: 16 }}>
        <label>موبایل صاحب ماشین</label>
        <input
          ref={phoneRef}
          dir="ltr"
          inputMode="numeric"
          placeholder="09121234567"
          value={phone}
          onChange={(e) => {
            const next = parsePhone(e.target.value);
            setPhone(next);
            if (isValidPhone(next)) {
              requestAnimationFrame(() => focusEnd(kmRef.current));
            }
          }}
        />
      </div>
      <div className="oil-field">
        <label>کیلومتر فعلی</label>
        <input
          ref={kmRef}
          dir="ltr"
          inputMode="numeric"
          placeholder="12500"
          value={km}
          onChange={(e) => {
            setKm(parseKm(e.target.value));
            setNextKmDirty(false);
          }}
        />
      </div>
      <div className="oil-field">
        <label>تعویض بعدی (اختیاری)</label>
        <input
          dir="ltr"
          inputMode="numeric"
          placeholder={kmOk ? String(suggestedNextKm(kmNum, interval)) : "18000"}
          value={nextKm}
          onChange={(e) => {
            setNextKm(parseKm(e.target.value));
            setNextKmDirty(true);
          }}
        />
        <p className="oil-muted" style={{ marginTop: 6 }}>
          اگر خالی بماند، فاصله  ({formatKm(interval)} کیلومتر) استفاده می‌شود.
        </p>
      </div>
      <div className="oil-field">
        <label>روغن (اختیاری)</label>
        <select
          value={oilProductId}
          onChange={(e) =>
            setOilProductId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">بدون محصول</option>
          {oilOptions.map((product) => (
            <option key={product.id} value={product.id}>
              {productOptionLabel(product)}
            </option>
          ))}
        </select>
      </div>
      <div className="oil-field">
        <label>فیلتر هوا (اختیاری)</label>
        <select
          value={airFilterProductId}
          onChange={(e) =>
            setAirFilterProductId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">بدون محصول</option>
          {airFilterOptions.map((product) => (
            <option key={product.id} value={product.id}>
              {productOptionLabel(product)}
            </option>
          ))}
        </select>
      </div>
      <div className="oil-field">
        <label>فیلتر روغن (اختیاری)</label>
        <select
          value={oilFilterProductId}
          onChange={(e) =>
            setOilFilterProductId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">بدون محصول</option>
          {oilFilterOptions.map((product) => (
            <option key={product.id} value={product.id}>
              {productOptionLabel(product)}
            </option>
          ))}
        </select>
      </div>

      <p className="oil-muted" style={{ marginTop: 4 }}>
        قیمت از محصول خوانده می‌شود. اگر فروش صفر باشد فاکتور ساخته نمی‌شود.
      </p>
      <button
        type="button"
        className={`oil-btn oil-btn-primary${saleTotal > 0 && !saving ? " oil-btn-stack" : ""}`}
        disabled={saving || !accessOk}
        onClick={handleSubmit}
      >
        {saving ? (
          "در حال ثبت…"
        ) : saleTotal > 0 ? (
          <>
            <span>ثبت تعویض و پیامک</span>
            <span className="oil-btn-amount">{saleTotalLabel} تومان</span>
          </>
        ) : (
          "ثبت تعویض و پیامک"
        )}
      </button>
    </div>
  );
}
