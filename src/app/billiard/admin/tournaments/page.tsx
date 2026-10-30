"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, formatToman, statusLabel, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

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
    format: "single_elimination",
  });
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const [t, d] = await Promise.all([
      apiFetch<{ data: any[] }>("/admin/tournaments"),
      apiFetch<{ data: any[] }>("/admin/disciplines"),
    ]);
    setItems(t.data || []);
    setDisciplines((d.data || []).filter((x: any) => x.is_active !== false));
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setCreating(true);
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
          format: form.format,
        }),
      });
      setMsg("مسابقه ساخته شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl text-slate-100">مسابقات</h1>
        <BilliardButton href="/billiard/admin/disciplines" variant="secondary">
          مدیریت رشته‌ها
        </BilliardButton>
      </div>
      {!disciplines.length && (
        <p className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2.5 text-sm text-fuchsia-200">
          هنوز رشته‌ای تعریف نشده. اول از{" "}
          <Link href="/billiard/admin/disciplines" className="underline">
            بخش رشته‌ها
          </Link>{" "}
          اسنوکر و پاکت را اضافه کنید.
        </p>
      )}
      <form onSubmit={create} className="card-soft grid gap-3 md:grid-cols-2">
        <input className="input" placeholder="نام مسابقه" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className="input" value={form.discipline_id} onChange={(e) => setForm({ ...form, discipline_id: e.target.value })} required>
          <option value="">انتخاب رشته</option>
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
        <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
          <option value="single_elimination">حذفی</option>
          <option value="group_then_elimination">گروهی سپس حذفی</option>
        </select>
        <BilliardButton type="submit" loading={creating} sx={{ gridColumn: { md: "span 2" } }}>
          ایجاد مسابقه
        </BilliardButton>
      </form>
      {msg && <p className="text-sm text-cyan-300">{msg}</p>}
      <div className="card-soft divide-y divide-white/10">
        {items.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <div className="font-medium text-slate-100">{t.name}</div>
              <div className="text-xs text-slate-500">
                {t.discipline?.name} · {statusLabel[t.status]} · {formatToman(t.fee_toman || 0)}
              </div>
            </div>
            <BilliardButton href={`/billiard/admin/tournaments/${t.id}`} variant="secondary">
              مدیریت جدول / نتیجه
            </BilliardButton>
          </div>
        ))}
      </div>
    </div>
  );
}
