"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { isOilApiError, oilMe } from "@/app/lib/oil/api";
import { getOilToken } from "@/app/lib/oil/auth";
import { useOilAuth } from "../OilAuth";
import {
  OIL_PAYMENTS_API_BASE,
  consumePaymentReturn,
  DEFAULT_PAYMENT_GATEWAYS,
  fetchPaymentStatus,
  fetchPaymentsCatalog,
  formatPlanDuration,
  formatToman,
  isPaymentsError,
  planPayableToman,
  startGatewayPayment,
  type PaymentGatewayId,
  type PaymentsCatalogItem,
} from "@/app/lib/atelierZarinpal";

export default function OilPlansPage() {
  const { setSession, refresh } = useOilAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PaymentsCatalogItem[]>([]);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [gateways, setGateways] = useState(DEFAULT_PAYMENT_GATEWAYS);
  const [gateway, setGateway] = useState<PaymentGatewayId>("zarinpal");

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
      if (res.gateways?.length) setGateways(res.gateways as typeof DEFAULT_PAYMENT_GATEWAYS);
      if (res.default_gateway === "sep" || res.default_gateway === "zarinpal") {
        setGateway(res.default_gateway);
      }
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
      const res = await startGatewayPayment({
        apiBase: OIL_PAYMENTS_API_BASE,
        token,
        type: "shop_plan",
        itemId: plan.id,
        gateway,
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
        پس از پرداخت موفق، اعتبار مغازه خودکار تمدید می‌شود.
      </p>

      <div className="oil-card" style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>انتخاب درگاه پرداخت</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {gateways.map((item) => (
            <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="radio"
                name="gateway"
                value={item.id}
                checked={gateway === item.id}
                onChange={() => setGateway(item.id)}
              />
              {item.name}
            </label>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="oil-empty">در حال بارگذاری پلن‌ها…</div>
      ) : plans.length === 0 ? (
        <div className="oil-empty">پلنی برای خرید وجود ندارد.</div>
      ) : (
        plans.map((plan) => {
          const duration = formatPlanDuration(plan);
          const list = plan.price_toman || 0;
          const payable = planPayableToman(plan);
          const hasDiscount =
            plan.discount_price_toman != null &&
            plan.discount_price_toman > 0 &&
            plan.discount_price_toman < list;
          return (
            <article key={plan.id} className="oil-card">
              <div className="oil-card-meta" style={{ marginTop: 0 }}>
                <span className="oil-km">{plan.name}</span>
                {duration ? <span>{duration}</span> : null}
              </div>
              {(payable > 0 || list > 0) && (
                <div style={{ margin: "8px 0 0" }}>
                  {hasDiscount ? (
                    <>
                      <p
                        className="oil-muted"
                        style={{ margin: 0, textDecoration: "line-through", fontSize: 14 }}
                      >
                        {formatToman(list)}
                      </p>
                      <p className="oil-km" style={{ margin: "2px 0 0", fontSize: 20 }}>
                        {formatToman(payable)}
                      </p>
                    </>
                  ) : (
                    <p className="oil-km" style={{ margin: 0, fontSize: 20 }}>
                      {formatToman(payable || list)}
                    </p>
                  )}
                </div>
              )}
              {plan.description ? (
                <p className="oil-muted" style={{ margin: "8px 0 0" }}>
                  {plan.description}
                </p>
              ) : null}
              {plan.unlimited_products ? (
                <p className="oil-km" style={{ margin: "6px 0 0", fontSize: 13 }}>
                  بدون سقف تعداد کالا
                </p>
              ) : null}
              <button
                type="button"
                className="oil-btn oil-btn-primary"
                style={{ marginTop: 12 }}
                disabled={buyingId === plan.id}
                onClick={() => void handleBuy(plan)}
              >
                {buyingId === plan.id
                  ? "در حال انتقال…"
                  : plan.unlimited_products
                    ? "خرید اشتراک طلایی"
                    : "پرداخت و تمدید"}
              </button>
            </article>
          );
        })
      )}
    </div>
  );
}
