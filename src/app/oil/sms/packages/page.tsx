"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { isOilApiError, oilGetSmsQuota, oilListSmsPackageOrders } from "@/app/lib/oil/api";
import { getOilToken } from "@/app/lib/oil/auth";
import { useOilAuth } from "../../OilAuth";
import OilSmsQuotaCard from "../../OilSmsQuotaCard";
import {
  OIL_PAYMENTS_API_BASE,
  consumePaymentReturn,
  DEFAULT_PAYMENT_GATEWAYS,
  fetchPaymentsCatalog,
  formatToman,
  isPaymentsError,
  parseCatalogItem,
  startGatewayPayment,
  type PaymentGatewayId,
  type PaymentsCatalogItem,
} from "@/app/lib/atelierZarinpal";
import type { OilSmsPackageOrder } from "@/app/lib/oil/types";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function formatOrderDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function OilSmsPackagesPage() {
  const { updateSms } = useOilAuth();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PaymentsCatalogItem[]>([]);
  const [orders, setOrders] = useState<OilSmsPackageOrder[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [quotaKey, setQuotaKey] = useState(0);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [gateways, setGateways] = useState(DEFAULT_PAYMENT_GATEWAYS);
  const [gateway, setGateway] = useState<PaymentGatewayId>("zarinpal");

  const loadPackages = useCallback(async () => {
    const token = getOilToken();
    if (!token) return;
    const catalog = await fetchPaymentsCatalog({ apiBase: OIL_PAYMENTS_API_BASE, token });
    if (!isPaymentsError(catalog) && catalog.sms_packages.length > 0) {
      setPackages(catalog.sms_packages);
      if (catalog.gateways?.length) setGateways(catalog.gateways as typeof DEFAULT_PAYMENT_GATEWAYS);
      if (catalog.default_gateway === "sep" || catalog.default_gateway === "zarinpal") {
        setGateway(catalog.default_gateway);
      }
      return;
    }
    const { oilListSmsPackages } = await import("@/app/lib/oil/api");
    const res = await oilListSmsPackages();
    if (isOilApiError(res)) {
      toast.error(res.message);
      return;
    }
    setPackages(
      (res.data || [])
        .map((pkg) =>
          parseCatalogItem({
            id: pkg.id,
            name: pkg.name,
            sms_count: pkg.sms_count,
            price_toman: pkg.price_toman,
            price_rial: pkg.price_rial,
          }),
        )
        .filter((item): item is PaymentsCatalogItem => Boolean(item)),
    );
  }, []);

  const loadOrders = useCallback(async (nextPage: number, replace: boolean) => {
    const res = await oilListSmsPackageOrders(nextPage, 30);
    if (isOilApiError(res)) {
      toast.error(res.message);
      return;
    }
    setPage(res.current_page);
    setLastPage(res.last_page);
    setOrders((prev) => (replace ? res.data : [...prev, ...res.data]));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadPackages(), loadOrders(1, true)]);
    } finally {
      setLoading(false);
    }
  }, [loadOrders, loadPackages]);

  useEffect(() => {
    const result = consumePaymentReturn();
    if (result) {
      if (result.ok) {
        toast.success("پرداخت موفق بود. اعتبار پیامک شارژ شد.");
        setQuotaKey((n) => n + 1);
        void oilGetSmsQuota().then((res) => {
          if (!isOilApiError(res)) updateSms(res);
        });
      } else {
        toast.error("پرداخت انجام نشد یا لغو شد.");
      }
    }
    void loadData();
  }, [loadData, updateSms]);

  const handlePurchase = async (pkg: PaymentsCatalogItem) => {
    const token = getOilToken();
    if (!token) return;
    setBuyingId(pkg.id);
    try {
      const res = await startGatewayPayment({
        apiBase: OIL_PAYMENTS_API_BASE,
        token,
        type: "sms_package",
        itemId: pkg.id,
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
      <OilSmsQuotaCard showBuy={false} refreshKey={quotaKey} />

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
        <div className="oil-empty">در حال بارگذاری بسته‌ها…</div>
      ) : packages.length === 0 ? (
        <div className="oil-empty">بسته فعالی برای خرید وجود ندارد.</div>
      ) : (
        packages.map((pkg) => (
          <article key={pkg.id} className="oil-card">
            <div className="oil-card-meta" style={{ marginTop: 0 }}>
              <span className="oil-km">{pkg.name}</span>
              {pkg.sms_count ? <span>{formatNumber(pkg.sms_count)} پیامک</span> : null}
            </div>
            {pkg.price_toman > 0 && (
              <p className="oil-km" style={{ margin: "8px 0 0", fontSize: 20 }}>
                {formatToman(pkg.price_toman)}
              </p>
            )}
            <button
              type="button"
              className="oil-btn oil-btn-primary"
              style={{ marginTop: 12 }}
              disabled={buyingId === pkg.id}
              onClick={() => void handlePurchase(pkg)}
            >
              {buyingId === pkg.id ? "در حال انتقال…" : "پرداخت آنلاین"}
            </button>
          </article>
        ))
      )}

      <h2 style={{ fontSize: 16, margin: "24px 0 8px" }}>تاریخچه خریدها</h2>
      {orders.length === 0 ? (
        <p className="oil-muted">هنوز خریدی ثبت نشده است.</p>
      ) : (
        orders.map((order) => (
          <article key={order.id} className="oil-card">
            <div className="oil-card-meta" style={{ marginTop: 0 }}>
              <span className="oil-km">
                {order.package_name} — {formatNumber(order.sms_count)} پیامک
              </span>
              <span>{order.status_label || order.status}</span>
            </div>
            <div className="oil-card-meta">
              <span>{formatNumber(order.price_toman)} تومان</span>
              <span>{formatOrderDate(order.created_at)}</span>
            </div>
            {order.admin_note && (
              <p className="oil-muted" style={{ margin: "8px 0 0" }}>
                {order.admin_note}
              </p>
            )}
          </article>
        ))
      )}

      {page < lastPage && (
        <button
          type="button"
          className="oil-btn oil-btn-ghost"
          style={{ marginTop: 12 }}
          onClick={() => void loadOrders(page + 1, false)}
        >
          بارگذاری بیشتر
        </button>
      )}
    </div>
  );
}
