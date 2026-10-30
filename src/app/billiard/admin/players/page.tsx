"use client";

import { useEffect, useState } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";
import { PlayersExcelImport } from "@/app/billiard/admin/components/PlayersExcelImport";

type PlayerForm = {
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  club: string;
};

const emptyForm = (): PlayerForm => ({
  first_name: "",
  last_name: "",
  phone: "",
  city: "",
  club: "",
});

export default function AdminPlayersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<PlayerForm>(emptyForm());
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<PlayerForm>(emptyForm());
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setSearching(true);
    try {
      const data = await apiFetch<{ data: any[] }>(
        `/admin/players?q=${encodeURIComponent(q)}&per_page=200`,
      );
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
      setForm(emptyForm());
      setMsg("بازیکن ساخته شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(p: any) {
    setEditing(p);
    setEditForm({
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      phone: p.phone || "",
      city: p.city || "",
      club: p.club || "",
    });
    setMsg("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusyId(`edit-${editing.id}`);
    setMsg("");
    try {
      await apiFetch(`/admin/players/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setEditing(null);
      setMsg("بازیکن به‌روز شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در ویرایش");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(p: any) {
    const next = !p.is_active;
    const label = next ? "فعال" : "غیرفعال";
    if (!confirm(`بازیکن «${p.full_name}» ${label} شود؟`)) return;
    setBusyId(`active-${p.id}`);
    setMsg("");
    try {
      await apiFetch(`/admin/players/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: next }),
      });
      setMsg(`بازیکن ${label} شد.`);
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusyId(null);
    }
  }

  async function removePlayer(p: any) {
    if (!confirm(`بازیکن «${p.full_name}» برای همیشه حذف شود؟\nاگر سابقه مسابقه داشته باشد باید غیرفعال کنید.`)) {
      return;
    }
    setBusyId(`del-${p.id}`);
    setMsg("");
    try {
      await apiFetch(`/admin/players/${p.id}`, { method: "DELETE" });
      setMsg("بازیکن حذف شد.");
      if (editing?.id === p.id) setEditing(null);
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در حذف");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-slate-100">بازیکنان</h1>

      <form onSubmit={create} className="card-soft grid gap-3 md:grid-cols-2">
        <input
          className="input"
          placeholder="نام"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="نام خانوادگی"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="موبایل"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className="input"
          placeholder="شهر"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <input
          className="input"
          placeholder="باشگاه"
          value={form.club}
          onChange={(e) => setForm({ ...form, club: e.target.value })}
        />
        <BilliardButton type="submit" loading={creating}>
          ایجاد بازیکن
        </BilliardButton>
      </form>
      {msg && <p className="text-sm text-cyan-300 whitespace-pre-wrap">{msg}</p>}

      <PlayersExcelImport onImported={() => load()} />

      <div className="flex flex-wrap gap-2">
        <input
          className="input max-w-md"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
          placeholder="جستجو"
        />
        <BilliardButton type="button" variant="secondary" loading={searching} onClick={() => load()}>
          جستجو
        </BilliardButton>
      </div>

      {editing && (
        <form onSubmit={saveEdit} className="card-soft space-y-3 border border-cyan-500/30">
          <h2 className="font-display text-lg text-slate-100">ویرایش: {editing.full_name}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="نام"
              value={editForm.first_name}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="نام خانوادگی"
              value={editForm.last_name}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="موبایل"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="شهر"
              value={editForm.city}
              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
            />
            <input
              className="input"
              placeholder="باشگاه"
              value={editForm.club}
              onChange={(e) => setEditForm({ ...editForm, club: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <BilliardButton type="submit" loading={busyId === `edit-${editing.id}`}>
              ذخیره تغییرات
            </BilliardButton>
            <BilliardButton type="button" variant="secondary" onClick={() => setEditing(null)}>
              انصراف
            </BilliardButton>
          </div>
        </form>
      )}

      <div className="card-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right text-slate-500">
              <th className="py-2 font-medium">نام</th>
              <th className="font-medium">موبایل</th>
              <th className="font-medium">شهر</th>
              <th className="font-medium">وضعیت</th>
              <th className="font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const rowBusy = busyId === `active-${p.id}` || busyId === `del-${p.id}`;
              return (
                <tr
                  key={p.id}
                  className={`border-b border-white/5 text-slate-200 ${
                    p.is_active ? "" : "opacity-60"
                  }`}
                >
                  <td className="py-2">{p.full_name}</td>
                  <td>{p.phone}</td>
                  <td>{p.city || "—"}</td>
                  <td>
                    <span className={p.is_active ? "text-cyan-300" : "text-amber-300"}>
                      {p.is_active ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5 py-1">
                      <BilliardButton
                        type="button"
                        variant="secondary"
                        sx={{ minHeight: 32, py: "4px", px: 1.25, fontSize: 12 }}
                        disabled={rowBusy}
                        onClick={() => openEdit(p)}
                      >
                        ویرایش
                      </BilliardButton>
                      <BilliardButton
                        type="button"
                        variant="secondary"
                        sx={{ minHeight: 32, py: "4px", px: 1.25, fontSize: 12 }}
                        loading={busyId === `active-${p.id}`}
                        onClick={() => toggleActive(p)}
                      >
                        {p.is_active ? "غیرفعال" : "فعال‌سازی"}
                      </BilliardButton>
                      <BilliardButton
                        type="button"
                        variant="danger"
                        sx={{ minHeight: 32, py: "4px", px: 1.25, fontSize: 12 }}
                        loading={busyId === `del-${p.id}`}
                        onClick={() => removePlayer(p)}
                      >
                        حذف
                      </BilliardButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!items.length && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  بازیکنی یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
