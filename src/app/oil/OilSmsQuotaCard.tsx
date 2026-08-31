"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { isOilApiError, oilGetSmsQuota } from "@/app/lib/oil/api";
import { useOilAuth } from "./OilAuth";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

export default function OilSmsQuotaCard({
  refreshKey = 0,
  showBuy = true,
}: {
  refreshKey?: number;
  showBuy?: boolean;
}) {
  const { session, updateSms } = useOilAuth();
  const balance = session?.sms?.balance;
  const low = typeof balance === "number" && balance <= 10;

  useEffect(() => {
    let cancelled = false;
    void oilGetSmsQuota().then((res) => {
      if (cancelled || isOilApiError(res)) return;
      updateSms(res);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, session?.shop?.id, updateSms]);

  return (
    <div className={`oil-card oil-quota-card${low ? " low" : ""}`} style={{ marginTop: 0 }}>
      <div className="oil-card-meta" style={{ marginTop: 0, alignItems: "center" }}>
        <span>اعتبار پیامک</span>
        <span className="oil-km" style={{ fontSize: 20 }}>
          {typeof balance === "number" ? `${formatNumber(balance)} پیامک` : "…"}
        </span>
      </div>
      <p className="oil-muted" style={{ margin: "8px 0 0" }}>
        هر ۷۰ کاراکتر یک پیامک است. خرید تا تأیید ادمین به موجودی اضافه نمی‌شود.
      </p>
      {showBuy && (
        <Link
          href="/oil/sms/packages"
          className="oil-btn oil-btn-primary"
          style={{ marginTop: 12, textDecoration: "none" }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ShoppingBag size={18} />
            خرید بسته پیامک
          </span>
        </Link>
      )}
    </div>
  );
}
