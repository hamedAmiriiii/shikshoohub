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
      <h1 className="mb-6 font-display text-3xl">داشبورد</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="بازیکنان" value={data?.players} />
        <Card label="مسابقات زنده" value={data?.tournaments_live} />
        <Card label="ثبت‌نام باز" value={data?.tournaments_open} />
        <Card label="ثبت‌نام در انتظار" value={data?.pending_registrations} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value?: number }) {
  return (
    <div className="card-soft">
      <div className="text-xs text-felt-600">{label}</div>
      <div className="font-display text-3xl">{value ?? "—"}</div>
    </div>
  );
}
