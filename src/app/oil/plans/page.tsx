"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { isOilApiError, oilMe } from "@/app/lib/oil/api";
import { getOilToken } from "@/app/lib/oil/auth";
import { useOilAuth } from "../OilAuth";
import {
  OIL_PAYMENTS_API_BASE,
  consumePaymentReturn,
  fetchPaymentStatus,
  fetchPaymentsCatalog,
  formatPlanDuration,
  formatToman,
  isPaymentsError,
  startZarinpalPayment,
  type PaymentsCatalogItem,
} from "@/app/lib/atelierZarinpal";

export default function OilPlansPage() {
  const { setSession, refresh } = useOilAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PaymentsCatalogItem[]>([]);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const loadPlans = useCallback(async () => {
    const token = getOilToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchPaymentsCatalog({ apiBase: OIL_PAYMENTS_API_BASE, token });
      if (isPaymentsError(res)) {
        toast.error(res.message);
        return;
      }
      setPlans(res.shop_plans);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const result = consumePaymentReturn();
    if (result) {
      if (result.ok) {
        toast.success("پرداخت موفق بود. اعتبار مغازه تمدید شد.");
        const token = getOilToken();
        if (token && result.authority) {
          void fetchPaymentStatus({
            apiBase: OIL_PAYMENTS_API_BASE,
            token,
            authority: result.authority,
          });
        }
        void oilMe().then((res) => {
          if (!isOilApiError(res)) setSession(res);
        });
        void refresh();
      } else {
        toast.error("پرداخت انجام نشد یا لغو شد.");
      }
    }
    void loadPlans();
  }, [loadPlans, refresh, setSession]);

  const handleBuy = async (plan: PaymentsCatalogItem) => {
    const token = getOilToken();
    if (!token) return;
    setBuyingId(plan.id);
    try {
      const res = await startZarinpalPayment({
        apiBase: OIL_PAYMENTS_API_BASE,
        token,
        type: "shop_plan",
        itemId: plan.id,
        returnUrl: typeof window !== "undefined" ? window.location.href.split("#")[0] : "",
      });
      if (isPaymentsError(res)) {
        toast.error(res.message);
      }
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="oil-page">
      <p className="oil-muted" style={{ marginTop: 0 }}>
        پس از پرداخت موفق در زرین‌پال، اعتبار مغازه خودکار تمدید می‌شود.
      </p>

      {loading ? (
        <div className="oil-empty">در حال بارگذاری پلن‌ها…</div>
      ) : plans.length === 0 ? (
        <div className="oil-empty">پلنی برای خرید وجود ندارد.</div>
      ) : (
        plans.map((plan) => {
          const duration = formatPlanDuration(plan);
          return (
            <article key={plan.id} className="oil-card">
              <div className="oil-card-meta" style={{ marginTop: 0 }}>
                <span className="oil-km">{plan.name}</span>
                {duration ? <span>{duration}</span> : null}
              </div>
              {plan.price_toman > 0 && (
                <p className="oil-km" style={{ margin: "8px 0 0", fontSize: 20 }}>
                  {formatToman(plan.price_toman)}
                </p>
              )}
              {plan.description ? (
                <p className="oil-muted" style={{ margin: "8px 0 0" }}>
                  {plan.description}
                </p>
              ) : null}
              <button
                type="button"
                className="oil-btn oil-btn-primary"
                style={{ marginTop: 12 }}
                disabled={buyingId === plan.id}
                onClick={() => void handleBuy(plan)}
              >
                {buyingId === plan.id ? "در حال انتقال…" : "پرداخت و تمدید"}
              </button>
            </article>
          );
        })
      )}
    </div>
  );
}
