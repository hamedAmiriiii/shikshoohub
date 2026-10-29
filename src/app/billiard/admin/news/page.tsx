"use client";

import { useEffect, useState } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";

export default function AdminNewsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", body: "" });
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await apiFetch<{ data: any[] }>("/admin/news");
    setItems(data.data || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/admin/news", { method: "POST", body: JSON.stringify(form) });
      setForm({ title: "", body: "" });
      setMsg("خبر منتشر شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">اخبار</h1>
      <form onSubmit={create} className="card-soft space-y-3">
        <input className="input" placeholder="عنوان" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="input min-h-[120px]" placeholder="متن" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
        <button className="btn-primary" type="submit">
          انتشار
        </button>
      </form>
      {msg && <p className="text-sm">{msg}</p>}
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="card-soft">
            <div className="font-medium">{n.title}</div>
            <p className="mt-1 text-sm text-felt-700 line-clamp-3">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
