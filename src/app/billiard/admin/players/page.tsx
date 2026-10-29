"use client";

import { useEffect, useState } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";
import { PlayersExcelImport } from "@/app/billiard/admin/components/PlayersExcelImport";

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
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);

  async function load() {
    setSearching(true);
    try {
      const data = await apiFetch<{ data: any[] }>(`/admin/players?q=${encodeURIComponent(q)}`);
      setItems(data.data || []);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setCreating(true);
    try {
      await apiFetch("/admin/players", { method: "POST", body: JSON.stringify(form) });
      setForm({ first_name: "", last_name: "", phone: "", city: "", club: "" });
      setMsg("بازیکن ساخته شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-slate-100">بازیکنان</h1>

      <form onSubmit={create} className="card-soft grid gap-3 md:grid-cols-2">
        <input className="input" placeholder="نام" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
        <input className="input" placeholder="نام خانوادگی" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
        <input className="input" placeholder="موبایل" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input className="input" placeholder="شهر" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className="input" placeholder="باشگاه" value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} />
        <BilliardButton type="submit" loading={creating}>
          ایجاد بازیکن
        </BilliardButton>
      </form>
      {msg && <p className="text-sm text-cyan-300">{msg}</p>}

      <PlayersExcelImport onImported={() => load()} />

      <div className="flex flex-wrap gap-2">
        <input className="input max-w-md" value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو" />
        <BilliardButton type="button" variant="secondary" loading={searching} onClick={() => load()}>
          جستجو
        </BilliardButton>
      </div>
      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right text-slate-500">
              <th className="py-2 font-medium">نام</th>
              <th className="font-medium">موبایل</th>
              <th className="font-medium">شهر</th>
              <th className="font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-white/5 text-slate-200">
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
