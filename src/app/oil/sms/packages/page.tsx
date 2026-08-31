"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  isOilApiError,
  oilListSmsPackageOrders,
  oilListSmsPackages,
  oilPurchaseSmsPackage,
} from "@/app/lib/oil/api";
import type { OilSmsPackage, OilSmsPackageOrder } from "@/app/lib/oil/types";
import OilSmsQuotaCard from "../OilSmsQuotaCard";

const CARD_NUMBER = "5041721059095506";
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
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<OilSmsPackage[]>([]);
  const [orders, setOrders] = useState<OilSmsPackageOrder[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selected, setSelected] = useState<OilSmsPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const loadPackages = useCallback(async () => {
    const res = await oilListSmsPackages();
    if (isOilApiError(res)) {
      toast.error(res.message);
      return;
    }
    setPackages(res.data || []);
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
    void loadData();
  }, [loadData]);

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    try {
      const res = await oilPurchaseSmsPackage(selected.id);
      if (isOilApiError(res)) {
        toast.error(res.message);
        return;
      }
      toast.success(
        res.message ||
          "درخواست خرید ثبت شد. پس از تأیید ادمین، اعتبار پیامک شما شارژ می‌شود.",
      );
      setSelected(null);
      await loadOrders(1, true);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="oil-page">
      <OilSmsQuotaCard showBuy={false} />

      {loading ? (
        <div className="oil-empty">در حال بارگذاری بسته‌ها…</div>
      ) : packages.length === 0 ? (
        <div className="oil-empty">بسته فعالی برای خرید وجود ندارد.</div>
      ) : (
        packages.map((pkg) => (
          <article key={pkg.id} className="oil-card">
            <div className="oil-card-meta" style={{ marginTop: 0 }}>
              <span className="oil-km">{pkg.name}</span>
              <span>{formatNumber(pkg.sms_count)} پیامک</span>
            </div>
            {pkg.price_toman > 0 && (
              <p className="oil-km" style={{ margin: "8px 0 0", fontSize: 20 }}>
                {formatNumber(pkg.price_toman)} تومان
              </p>
            )}
            <button
              type="button"
              className="oil-btn oil-btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => setSelected(pkg)}
            >
              ثبت درخواست خرید
            </button>
          </article>
        ))
      )}

      <h2 style={{ fontSize: 16, margin: "24px 0 8px" }}>تاریخچه درخواست‌ها</h2>
      {orders.length === 0 ? (
        <p className="oil-muted">هنوز درخواستی ثبت نشده است.</p>
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

      {selected && (
        <div
          className="oil-modal-backdrop"
          onClick={() => !purchasing && setSelected(null)}
        >
          <div className="oil-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px" }}>ثبت درخواست خرید</h3>
            <p className="oil-km" style={{ margin: "0 0 8px" }}>
              {selected.name}
            </p>
            <p style={{ margin: "0 0 12px" }}>
              {formatNumber(selected.sms_count)} پیامک —{" "}
              {formatNumber(selected.price_toman)} تومان
            </p>
            <p className="oil-muted" style={{ margin: "0 0 16px", lineHeight: 1.8 }}>
              لطفا مبلغ بسته را به شماره کارت{" "}
              <span dir="ltr" className="oil-km">
                {CARD_NUMBER}
              </span>{" "}
              واریز کنید سپس ثبت درخواست کنید. موجودی تا تأیید ادمین عوض نمی‌شود.
            </p>
            <button
              type="button"
              className="oil-btn oil-btn-primary"
              disabled={purchasing}
              onClick={handlePurchase}
            >
              {purchasing ? "در حال ثبت…" : "ثبت درخواست"}
            </button>
            <button
              type="button"
              className="oil-btn oil-btn-ghost"
              style={{ marginTop: 8 }}
              disabled={purchasing}
              onClick={() => setSelected(null)}
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
