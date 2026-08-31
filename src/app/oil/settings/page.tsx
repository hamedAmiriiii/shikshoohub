"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { isOilApiError, oilLogout, oilPatchShop } from "@/app/lib/oil/api";
import { formatKm, toEnglishDigits } from "@/app/lib/oil/plate";
import { useOilAuth } from "../OilAuth";
import OilSmsQuotaCard from "../OilSmsQuotaCard";

export default function OilSettingsPage() {
  const router = useRouter();
  const { session, setSession, logoutLocal } = useOilAuth();
  const [shopName, setShopName] = useState(session?.shop?.name || "");
  const [intervalKm, setIntervalKm] = useState(
    String(session?.shop?.oil_interval_km || 5000),
  );
  const [saving, setSaving] = useState(false);

  const days = session?.shop_access?.shop_access_days_remaining;
  const active = session?.shop_access?.shop_access_active !== false;

  useEffect(() => {
    if (!session) return;
    setShopName(session.shop.name);
    setIntervalKm(String(session.shop.oil_interval_km || 5000));
  }, [session]);

  const handleSave = async () => {
    const km = Number(toEnglishDigits(intervalKm).replace(/\D/g, ""));
    const body: { shop_name?: string; oil_interval_km?: number } = {};
    if (shopName.trim() && shopName.trim() !== session?.shop?.name) {
      body.shop_name = shopName.trim();
    }
    if (Number.isFinite(km) && km !== session?.shop?.oil_interval_km) {
      body.oil_interval_km = km;
    }
    if (!body.shop_name && body.oil_interval_km == null) {
      toast.info("تغییری برای ذخیره نیست");
      return;
    }
    setSaving(true);
    try {
      const res = await oilPatchShop(body);
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      setSession(res);
      toast.success("تنظیمات ذخیره شد");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await oilLogout();
    logoutLocal();
    router.replace("/oil/login");
  };

  return (
    <div className="oil-page">
      <div className={`oil-banner ${active ? "ok" : "warn"}`}>
        {active
          ? `دسترسی فعال است${days != null ? ` — ${days} روز مانده` : ""}`
          : "دوره دسترسی مغازه تمام شده است."}
      </div>

      <OilSmsQuotaCard />

      <div className="oil-field">
        <label>نام مغازه</label>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
      </div>
      <div className="oil-field">
        <label>فاصله تعویض بعدی (کیلومتر)</label>
        <input
          dir="ltr"
          inputMode="numeric"
          value={intervalKm}
          onChange={(e) =>
            setIntervalKm(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 5))
          }
        />
        <p className="oil-muted" style={{ marginTop: 6 }}>
          الان {formatKm(Number(intervalKm) || 0)} کیلومتر بعد از هر تعویض پیشنهاد می‌شود.
        </p>
      </div>

      <button
        type="button"
        className="oil-btn oil-btn-primary"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? "در حال ذخیره…" : "ذخیره"}
      </button>

      <button
        type="button"
        className="oil-btn oil-btn-danger"
        style={{ marginTop: 16 }}
        onClick={handleLogout}
      >
        خروج
      </button>
    </div>
  );
}
