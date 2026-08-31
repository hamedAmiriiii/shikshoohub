"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus } from "lucide-react";
import { toast } from "react-toastify";
import {
  isOilApiError,
  oilCreateVisit,
  oilLookup,
  partsPayload,
  suggestedNextKm,
} from "@/app/lib/oil/api";
import { compressPlatePhoto, recognizeIranianPlate } from "@/app/lib/oil/ocr";
import {
  compactPlate,
  emptyPlateParts,
  formatKm,
  isPlateComplete,
  toEnglishDigits,
} from "@/app/lib/oil/plate";
import type { OilPlateParts } from "@/app/lib/oil/types";
import { useOilAuth } from "../OilAuth";
import IranPlate from "../IranPlate";

function parsePhone(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, 11);
}

function parseKm(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, 7);
}

export default function OilNewVisitPage() {
  const router = useRouter();
  const { session } = useOilAuth();
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const [parts, setParts] = useState<OilPlateParts>(emptyPlateParts());
  const [phone, setPhone] = useState("");
  const [km, setKm] = useState("");
  const [nextKm, setNextKm] = useState("");
  const [nextKmDirty, setNextKmDirty] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [smsWarn, setSmsWarn] = useState<string | null>(null);
  const lookupKeyRef = useRef("");

  const interval = session?.shop?.oil_interval_km ?? 5000;
  const kmNum = Number(km);
  const accessOk = session?.shop_access?.shop_access_active !== false;
  const plateOk = isPlateComplete(parts);
  const phoneOk = phone.length === 11 && phone.startsWith("09");
  const kmOk = Number.isFinite(kmNum) && kmNum > 0;

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
      if (isOilApiError(res) || !res.found) return;
      setPhone((current) => current || res.visit.phone);
      setKm((current) => current || String(res.visit.km));
    });
  }, [parts, plateOk]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setSmsWarn(null);
    if (preview) URL.revokeObjectURL(preview);
    setOcrBusy(true);
    setOcrStatus("آماده‌سازی عکس…");
    try {
      const compact = await compressPlatePhoto(file);
      setPreview(URL.createObjectURL(compact));
      const found = await recognizeIranianPlate(compact, (status) => setOcrStatus(status));
      if (found) {
        setParts(found);
        toast.success("پلاک خوانده شد");
      } else {
        toast.info("پلاک کامل تشخیص داده نشد؛ دستی وارد کنید");
      }
    } catch {
      toast.error("تشخیص پلاک ناموفق بود؛ فرم دستی باز است");
    } finally {
      setOcrBusy(false);
      setOcrStatus("");
    }
  };

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
      } = {
        ...partsPayload(parts),
        phone,
        km: kmNum,
      };
      if (nextKmDirty) {
        const n = Number(nextKm);
        if (Number.isFinite(n) && n > kmNum) body.next_km = n;
      }
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
      {ocrBusy && <div className="oil-banner warn">{ocrStatus || "در حال تشخیص پلاک…"}</div>}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {preview && (
        <div className="oil-preview">
          <img src={preview} alt="عکس پلاک" />
        </div>
      )}

      <div className="oil-camera-row">
        <button
          type="button"
          className="oil-btn oil-btn-primary"
          disabled={ocrBusy}
          onClick={() => cameraRef.current?.click()}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Camera size={18} />
            عکس پلاک
          </span>
        </button>
        <button
          type="button"
          className="oil-btn oil-btn-ghost"
          disabled={ocrBusy}
          onClick={() => galleryRef.current?.click()}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ImagePlus size={18} />
            گالری
          </span>
        </button>
      </div>

      <p className="oil-muted" style={{ marginBottom: 10 }}>
        تشخیص پلاک روی خود گوشی انجام می‌شود. اگر خوانده نشد پلاک را دستی وارد کنید. موبایل همیشه لازم است.
      </p>

      <IranPlate parts={parts} onChange={setParts} size="lg" />

      <div className="oil-field" style={{ marginTop: 16 }}>
        <label>موبایل صاحب ماشین</label>
        <input
          dir="ltr"
          inputMode="numeric"
          placeholder="09121234567"
          value={phone}
          onChange={(e) => setPhone(parsePhone(e.target.value))}
        />
      </div>
      <div className="oil-field">
        <label>کیلومتر فعلی</label>
        <input
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
          اگر خالی بماند، فاصله مغازه ({formatKm(interval)} کیلومتر) استفاده می‌شود.
        </p>
      </div>

      <button
        type="button"
        className="oil-btn oil-btn-primary"
        disabled={saving || !accessOk}
        onClick={handleSubmit}
      >
        {saving ? "در حال ثبت…" : "ثبت تعویض و پیامک"}
      </button>
    </div>
  );
}
