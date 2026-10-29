"use client";

import { useEffect, useState } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";

export default function AdminPlayersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    club: "",
  });
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await apiFetch<{ data: any[] }>(`/admin/players?q=${encodeURIComponent(q)}`);
    setItems(data.data || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await apiFetch("/admin/players", { method: "POST", body: JSON.stringify(form) });
      setForm({ first_name: "", last_name: "", phone: "", city: "", club: "" });
      setMsg("بازیکن ساخته شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">بازیکنان</h1>
      <form onSubmit={create} className="card-soft grid gap-3 md:grid-cols-2">
        <input className="input" placeholder="نام" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
        <input className="input" placeholder="نام خانوادگی" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
        <input className="input" placeholder="موبایل" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input className="input" placeholder="شهر" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className="input" placeholder="باشگاه" value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} />
        <button className="btn-primary" type="submit">
          ایجاد بازیکن
        </button>
      </form>
      {msg && <p className="text-sm">{msg}</p>}
      <div className="flex gap-2">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو" />
        <button className="btn-secondary" type="button" onClick={() => load()}>
          جستجو
        </button>
      </div>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-right text-felt-600">
              <th className="py-2">نام</th>
              <th>موبایل</th>
              <th>شهر</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-felt-900/5">
                <td className="py-2">{p.full_name}</td>
                <td>{p.phone}</td>
                <td>{p.city}</td>
                <td>{p.is_active ? "فعال" : "غیرفعال"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
