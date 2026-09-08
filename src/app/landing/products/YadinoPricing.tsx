"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { REGISTER_URL, SUPPORT_TEL } from "../catalog";
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
      return {
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
      } satisfies YadinoPlan;
    })
    .filter((row): row is YadinoPlan => Boolean(row && row.max_users && row.duration_days));
}

export default function YadinoPricing() {
  const [tiers, setTiers] = useState<YadinoTier[]>(() => groupYadinoTiers(fallbackYadinoPlans()));

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

  return (
    <section id="pricing" className="py-12 md:py-16 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">تعرفه یادینو</h2>
          <p className="text-slate-400 mt-2">
            کلاس آنلاین و اتاق جلسه — قیمت‌ها ۵٪ کمتر از تعرفه پایه
          </p>
        </div>
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
                  <div
                    key={`${plan.max_users}-${plan.duration_days}-${plan.id ?? plan.duration_label}`}
                    className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-400">{plan.duration_label}</span>
                    <span className="font-semibold text-white">{formatYadinoToman(plan.price_toman)}</span>
                  </div>
                ))}
              </div>
              <a
                href={REGISTER_URL}
                className="mt-5 block text-center py-2.5 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white text-sm font-semibold"
              >
                شروع رایگان
              </a>
              <a href={SUPPORT_TEL} className="mt-2 block text-center text-xs text-slate-500 hover:text-cyan-400">
                مشاوره خرید
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
