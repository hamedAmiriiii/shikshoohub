"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { SUPPORT_TEL } from "../catalog";
import {
  fallbackYadinoPlans,
  formatYadinoToman,
  groupYadinoTiers,
  type YadinoPlan,
  type YadinoTier,
} from "../yadinoPlans";

const API_ORIGIN = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir").replace(/\/$/, "");

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parsePlans(payload: unknown): YadinoPlan[] {
  const obj = asRecord(payload);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(obj?.data)
      ? obj.data
      : [];
  return list
    .map((row) => {
      const item = asRecord(row);
      if (!item) return null;
      const features = Array.isArray(item.features)
        ? item.features.map(String)
        : typeof item.description === "string"
          ? item.description.split("، ").filter(Boolean)
          : [];
      const priceToman =
        Number(item.price_toman) ||
        (Number(item.price_rial) ? Math.round(Number(item.price_rial) / 10) : 0);
      const plan: YadinoPlan = {
        id: Number(item.id) || undefined,
        product: String(item.product ?? item.product_slug ?? "class"),
        name: String(item.name ?? "پلن"),
        max_users: Number(item.max_users) || 0,
        max_videos: Number(item.max_videos) || 4,
        duration_days: Number(item.duration_days) || 0,
        duration_label: String(item.duration_label ?? ""),
        price_toman: priceToman,
        features,
        description: typeof item.description === "string" ? item.description : null,
        is_active: item.is_active !== false,
        sort_order: Number(item.sort_order) || 0,
      };
      return plan;
    })
    .filter((row): row is YadinoPlan => row != null && row.max_users > 0 && row.duration_days > 0);
}

function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  return digits;
}

export default function YadinoPricing() {
  const [tiers, setTiers] = useState<YadinoTier[]>(() => groupYadinoTiers(fallbackYadinoPlans()));
  const [selected, setSelected] = useState<YadinoPlan | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const payment = q.get("payment");
    if (payment === "ok") setNotice("پرداخت موفق بود. به‌زودی با شما تماس می‌گیریم.");
    if (payment === "failed") setNotice(q.get("message") || "پرداخت انجام نشد یا لغو شد.");
    if (payment) {
      q.delete("payment");
      q.delete("oid");
      q.delete("authority");
      q.delete("message");
      const next = `${window.location.pathname}${q.toString() ? `?${q}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_ORIGIN}/api/product-plans?product=class`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const json = await res.json();
        const parsed = parsePlans(json);
        if (!cancelled && parsed.length) {
          setTiers(groupYadinoTiers(parsed));
        }
      } catch {
        /* fallback static */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openBuy = (plan: YadinoPlan) => {
    if (!plan.id) {
      setError("این پلن هنوز روی سرور ثبت نشده. فایل SQL را اجرا کنید.");
      setSelected(plan);
      return;
    }
    setError("");
    setSelected(plan);
  };

  const submitBuy = async () => {
    if (!selected?.id) {
      setError("پلن برای خرید آماده نیست.");
      return;
    }
    const mobile = normalizePhone(phone);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("ایمیل معتبر وارد کنید.");
      return;
    }
    if (!/^09\d{9}$/.test(mobile)) {
      setError("شماره موبایل را مثل 09123456789 وارد کنید.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_ORIGIN}/api/product-plans/purchase`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selected.id,
          email: email.trim(),
          phone: mobile,
          return_url: window.location.href.split("#")[0].split("?")[0],
        }),
      });
      const json = asRecord(await res.json().catch(() => ({})));
      if (!res.ok) {
        setError(typeof json?.message === "string" ? json.message : "خطا در اتصال به درگاه");
        return;
      }
      const url =
        (typeof json?.payment_url === "string" && json.payment_url) ||
        (typeof asRecord(json?.order)?.payment_url === "string" && String(asRecord(json?.order)?.payment_url));
      if (!url) {
        setError("آدرس درگاه دریافت نشد.");
        return;
      }
      window.location.href = url;
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="pricing" className="py-12 md:py-16 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">تعرفه یادینو</h2>
          <p className="text-slate-400 mt-2">فقط پلن شش‌ماهه و یک‌ساله — قابل خرید آنلاین</p>
        </div>
        {notice ? (
          <div className="mb-6 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 text-center">
            {notice}
          </div>
        ) : null}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <article
              key={tier.max_users}
              className={`rounded-2xl border p-5 bg-white/[0.03] flex flex-col ${
                tier.max_users === 50
                  ? "border-fuchsia-400/50 shadow-lg shadow-fuchsia-900/20"
                  : "border-white/10"
              }`}
            >
              {tier.max_users === 50 ? (
                <div className="self-start mb-3 text-[11px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-200">
                  پیشنهادی
                </div>
              ) : null}
              <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 space-y-2">
                {tier.plans.map((plan) => (
                  <button
                    key={`${plan.max_users}-${plan.duration_days}-${plan.id ?? plan.duration_label}`}
                    type="button"
                    onClick={() => openBuy(plan)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl bg-black/20 hover:bg-fuchsia-500/15 border border-white/5 hover:border-fuchsia-400/40 px-3 py-2.5 text-sm transition"
                  >
                    <span className="text-slate-300">{plan.duration_label}</span>
                    <span className="font-semibold text-white">{formatYadinoToman(plan.price_toman)}</span>
                  </button>
                ))}
              </div>
              <a href={SUPPORT_TEL} className="mt-3 block text-center text-xs text-slate-500 hover:text-cyan-400">
                مشاوره خرید
              </a>
            </article>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121826] p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-white">خرید {selected.name}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selected.duration_label} — {formatYadinoToman(selected.price_toman)}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400" aria-label="بستن">
                <X size={18} />
              </button>
            </div>
            <label className="block text-sm text-slate-300 mb-3">
              ایمیل
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-fuchsia-400"
                placeholder="you@email.com"
                dir="ltr"
              />
            </label>
            <label className="block text-sm text-slate-300 mb-4">
              شماره موبایل
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-white outline-none focus:border-fuchsia-400"
                placeholder="09123456789"
                dir="ltr"
              />
            </label>
            {error ? <p className="text-sm text-rose-300 mb-3">{error}</p> : null}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitBuy()}
              className="w-full py-3 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white font-semibold disabled:opacity-60"
            >
              {submitting ? "در حال اتصال…" : "پرداخت با زرین‌پال"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
