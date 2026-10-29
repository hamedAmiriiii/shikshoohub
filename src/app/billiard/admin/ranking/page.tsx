"use client";

import { useEffect, useState } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";

export default function AdminRankingPage() {
  const [last, setLast] = useState(5);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [disciplineId, setDisciplineId] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<{ last_tournaments: number }>("/admin/ranking-settings"),
      apiFetch<{ data: any[] }>("/admin/disciplines"),
    ]).then(([s, d]) => {
      setLast(s.last_tournaments);
      setDisciplines(d.data || []);
      if (d.data?.[0]) setDisciplineId(String(d.data[0].id));
    });
  }, []);

  async function save() {
    setMsg("");
    try {
      await apiFetch("/admin/ranking-settings", {
        method: "PUT",
        body: JSON.stringify({
          last_tournaments: Number(last),
          recompute_discipline_id: disciplineId ? Number(disciplineId) : null,
        }),
      });
      setMsg("ذخیره و در صورت انتخاب رشته، رنکینگ محاسبه شد.");
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    }
  }

  async function recompute() {
    if (!disciplineId) return;
    try {
      await apiFetch("/admin/ranking/recompute", {
        method: "POST",
        body: JSON.stringify({ discipline_id: Number(disciplineId) }),
      });
      setMsg("رنکینگ به‌روز شد.");
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">تنظیمات رنکینگ</h1>
      <div className="card-soft max-w-lg space-y-3">
        <label className="label">تعداد تورنمنت‌های آخر برای محاسبه</label>
        <input className="input" type="number" min={1} max={50} value={last} onChange={(e) => setLast(Number(e.target.value))} />
        <label className="label">رشته</label>
        <select className="input" value={disciplineId} onChange={(e) => setDisciplineId(e.target.value)}>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="btn-primary" type="button" onClick={save}>
            ذخیره تنظیمات
          </button>
          <button className="btn-secondary" type="button" onClick={recompute}>
            محاسبه مجدد
          </button>
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </div>
  );
}
