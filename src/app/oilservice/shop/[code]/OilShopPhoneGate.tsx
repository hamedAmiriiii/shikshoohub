"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toEnglishDigits } from "@/app/lib/oil/plate";

type Props = {
  shopCode: string;
  shopName: string;
};

function parsePhone(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, 11);
}

function isValidPhone(value: string) {
  return value.length === 11 && value.startsWith("09");
}

export default function OilShopPhoneGate({ shopCode, shopName }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError("شماره موبایل معتبر وارد کنید (مثلاً ۰۹۱۲۱۲۳۴۵۶۷).");
      return;
    }
    setError(null);
    router.push(`/oilservice/shop/${encodeURIComponent(shopCode)}/${phone}`);
  };

  return (
    <div className="oil-page">
      <h1 style={{ fontSize: 20, margin: "0 0 6px" }}>{shopName}</h1>
      <p className="oil-muted" style={{ marginTop: 0, marginBottom: 18 }}>
        برای دیدن سوابق تعویض روغن، شماره موبایلی که موقع تعویض ثبت شده را وارد کنید.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="oil-field">
          <label>شماره موبایل</label>
          <input
            autoFocus
            dir="ltr"
            inputMode="numeric"
            placeholder="09121234567"
            value={phone}
            onChange={(e) => {
              setPhone(parsePhone(e.target.value));
              setError(null);
            }}
          />
        </div>
        {error ? (
          <div className="oil-banner warn" style={{ marginBottom: 12 }}>
            {error}
          </div>
        ) : null}
        <button type="submit" className="oil-btn oil-btn-primary">
          مشاهده سوابق
        </button>
      </form>
    </div>
  );
}
