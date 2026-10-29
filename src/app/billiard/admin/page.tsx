"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/billiard/api";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    apiFetch("/admin/dashboard").then(setData).catch(() => setData(null));
  }, []);

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-slate-100">داشبورد</h1>
      <p className="mb-6 text-sm text-slate-400">خلاصه وضعیت سامانه</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="بازیکنان" value={data?.players} accent="from-cyan-500 to-blue-500" />
        <Card label="مسابقات زنده" value={data?.tournaments_live} accent="from-violet-500 to-fuchsia-500" />
        <Card label="ثبت‌نام باز" value={data?.tournaments_open} accent="from-fuchsia-500 to-pink-500" />
        <Card label="ثبت‌نام در انتظار" value={data?.pending_registrations} accent="from-emerald-500 to-teal-500" />
      </div>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value?: number; accent: string }) {
  return (
    <div className="card-soft relative overflow-hidden">
      <div className={`absolute -left-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-xl`} />
      <div className="relative">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-1 font-display text-3xl text-slate-100">{value ?? "—"}</div>
      </div>
    </div>
  );
}
