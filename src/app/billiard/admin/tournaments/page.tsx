"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, formatToman, statusLabel, type ApiError } from "@/app/lib/billiard/api";

export default function AdminTournamentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    discipline_id: "",
    fee_toman: "0",
    capacity: "16",
    status: "registration_open",
    venue: "",
  });
  const [newDiscipline, setNewDiscipline] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const [t, d] = await Promise.all([
      apiFetch<{ data: any[] }>("/admin/tournaments"),
      apiFetch<{ data: any[] }>("/admin/disciplines"),
    ]);
    setItems(t.data || []);
    setDisciplines(d.data || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function addDiscipline() {
    if (!newDiscipline.trim()) return;
    try {
      await apiFetch("/admin/disciplines", {
        method: "POST",
        body: JSON.stringify({ name: newDiscipline }),
      });
      setNewDiscipline("");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await apiFetch("/admin/tournaments", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          discipline_id: Number(form.discipline_id),
          fee_toman: Number(form.fee_toman),
          capacity: Number(form.capacity),
          status: form.status,
          venue: form.venue,
        }),
      });
      setMsg("مسابقه ساخته شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">مسابقات</h1>
      <div className="card-soft flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="رشته جدید (مثلاً اسنوکر)" value={newDiscipline} onChange={(e) => setNewDiscipline(e.target.value)} />
        <button type="button" className="btn-secondary" onClick={addDiscipline}>
          افزودن رشته
        </button>
      </div>
      <form onSubmit={create} className="card-soft grid gap-3 md:grid-cols-2">
        <input className="input" placeholder="نام مسابقه" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className="input" value={form.discipline_id} onChange={(e) => setForm({ ...form, discipline_id: e.target.value })} required>
          <option value="">رشته</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input className="input" placeholder="محل" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
        <input className="input" placeholder="ظرفیت" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <input className="input" placeholder="مبلغ تومان" value={form.fee_toman} onChange={(e) => setForm({ ...form, fee_toman: e.target.value })} />
        <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="pre_registration">پیش‌ثبت‌نام</option>
          <option value="registration_open">ثبت‌نام فعال</option>
          <option value="registration_closed">ثبت‌نام بسته</option>
        </select>
        <button className="btn-primary md:col-span-2" type="submit">
          ایجاد مسابقه
        </button>
      </form>
      {msg && <p className="text-sm">{msg}</p>}
      <div className="card-soft divide-y divide-felt-900/5">
        {items.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-felt-600">
                {t.discipline?.name} · {statusLabel[t.status]} · {formatToman(t.fee_toman || 0)}
              </div>
            </div>
            <Link href={`/billiard/admin/tournaments/${t.id}`} className="btn-secondary">
              مدیریت / قرعه / نتیجه
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
