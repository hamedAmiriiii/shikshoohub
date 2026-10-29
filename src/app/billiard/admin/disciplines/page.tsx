"use client";

import { useEffect, useState } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

type Discipline = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

export default function AdminDisciplinesPage() {
  const [items, setItems] = useState<Discipline[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [seedBusy, setSeedBusy] = useState(false);
  const [toggleId, setToggleId] = useState<number | null>(null);

  async function load() {
    const data = await apiFetch<{ data: Discipline[] }>("/admin/disciplines");
    setItems(data.data || []);
  }

  useEffect(() => {
    load().catch(() => setMsg("بارگذاری رشته‌ها ناموفق بود."));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      await apiFetch("/admin/disciplines", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
      setMsg("رشته اضافه شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در ثبت رشته");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(d: Discipline) {
    setToggleId(d.id);
    setMsg("");
    try {
      await apiFetch(`/admin/disciplines/${d.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !d.is_active }),
      });
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setToggleId(null);
    }
  }

  async function seedDefaults() {
    setSeedBusy(true);
    setMsg("");
    const defaults = [
      { name: "اسنوکر", slug: "snooker", sort_order: 1 },
      { name: "پاکت", slug: "pocket", sort_order: 2 },
    ];
    try {
      for (const row of defaults) {
        const exists = items.some((i) => i.slug === row.slug || i.name === row.name);
        if (exists) continue;
        await apiFetch("/admin/disciplines", {
          method: "POST",
          body: JSON.stringify(row),
        });
      }
      setMsg("اسنوکر و پاکت اضافه شدند (اگر از قبل نبودند).");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در افزودن پیش‌فرض");
    } finally {
      setSeedBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-100">رشته‌ها</h1>
          <p className="mt-1 text-sm text-slate-400">تعریف رشته‌های بیلیارد برای مسابقات و رنکینگ</p>
        </div>
        <BilliardButton type="button" variant="secondary" loading={seedBusy} onClick={seedDefaults}>
          افزودن اسنوکر و پاکت
        </BilliardButton>
      </div>

      <form onSubmit={create} className="card-soft flex flex-wrap gap-2">
        <input
          className="input max-w-sm"
          placeholder="نام رشته جدید"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <BilliardButton type="submit" loading={busy}>
          افزودن رشته
        </BilliardButton>
      </form>

      {msg && <p className="text-sm text-cyan-300">{msg}</p>}

      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right text-slate-500">
              <th className="py-2 font-medium">نام</th>
              <th className="font-medium">اسلاگ</th>
              <th className="font-medium">ترتیب</th>
              <th className="font-medium">وضعیت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-b border-white/5 text-slate-200">
                <td className="py-2.5 font-medium">{d.name}</td>
                <td className="text-slate-500">{d.slug}</td>
                <td>{d.sort_order}</td>
                <td>{d.is_active ? "فعال" : "غیرفعال"}</td>
                <td>
                  <BilliardButton
                    type="button"
                    variant="secondary"
                    loading={toggleId === d.id}
                    onClick={() => toggleActive(d)}
                  >
                    {d.is_active ? "غیرفعال کردن" : "فعال کردن"}
                  </BilliardButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <p className="py-6 text-center text-slate-500">
            هنوز رشته‌ای نیست. دکمه «افزودن اسنوکر و پاکت» را بزنید.
          </p>
        )}
      </div>
    </div>
  );
}
