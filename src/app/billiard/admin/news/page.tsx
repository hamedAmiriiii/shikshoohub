"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  body: string;
  cover_url?: string | null;
  is_published: boolean;
  published_at?: string | null;
};

const emptyForm = {
  title: "",
  body: "",
  is_published: true,
  cover_base64: "",
  cover_preview: "",
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const data = await apiFetch<{ data: NewsItem[] }>("/admin/news");
    setItems(data.data || []);
  }

  useEffect(() => {
    load().catch(() => setMsg("بارگذاری اخبار ناموفق بود."));
  }, []);

  function onFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("فقط فایل تصویر مجاز است.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setForm((f) => ({ ...f, cover_base64: value, cover_preview: value }));
      setRemoveCover(false);
    };
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setRemoveCover(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function startEdit(n: NewsItem) {
    setEditingId(n.id);
    setForm({
      title: n.title,
      body: n.body || "",
      is_published: !!n.is_published,
      cover_base64: "",
      cover_preview: n.cover_url || "",
    });
    setRemoveCover(false);
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        body: form.body.trim(),
        is_published: form.is_published,
      };
      if (form.cover_base64) payload.cover_base64 = form.cover_base64;
      if (editingId && removeCover) payload.remove_cover = true;

      if (editingId) {
        await apiFetch(`/admin/news/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMsg("خبر به‌روزرسانی شد.");
      } else {
        await apiFetch("/admin/news", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMsg("خبر منتشر شد.");
      }
      resetForm();
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در ذخیره خبر");
    } finally {
      setBusy(false);
    }
  }

  async function remove(n: NewsItem) {
    if (!window.confirm(`خبر «${n.title}» حذف شود؟`)) return;
    setDeletingId(n.id);
    setMsg("");
    try {
      await apiFetch(`/admin/news/${n.id}`, { method: "DELETE" });
      if (editingId === n.id) resetForm();
      setMsg("خبر حذف شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در حذف");
    } finally {
      setDeletingId(null);
    }
  }

  const preview = removeCover ? "" : form.cover_preview;

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-2xl tracking-tight text-slate-100 sm:text-3xl">اخبار</h1>
        <p className="mt-1 text-sm text-slate-400">تیتر، اصل خبر و عکس کوچک کنار خبر</p>
      </div>

      <form onSubmit={submit} className="card-soft overflow-hidden !p-0">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="text-sm font-medium text-slate-100">{editingId ? "ویرایش خبر" : "خبر جدید"}</div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <label className="label">تیتر</label>
            <input
              className="input text-base font-semibold"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="تیتر خبر"
            />
          </div>

          <div>
            <label className="label">اصل خبر</label>
            <textarea
              className="input min-h-[180px] text-base leading-7"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
              placeholder="متن اصلی خبر..."
            />
          </div>

          <div>
            <label className="label">عکس کاور</label>
            <div className="overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.03]">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="" className="aspect-[16/10] w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/55 to-transparent p-3">
                    <BilliardButton type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                      تعویض عکس
                    </BilliardButton>
                    <BilliardButton
                      type="button"
                      variant="danger"
                      onClick={() => {
                        setForm((f) => ({ ...f, cover_base64: "", cover_preview: "" }));
                        setRemoveCover(true);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                    >
                      حذف عکس
                    </BilliardButton>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 px-4 py-8 text-sm text-slate-400"
                  onClick={() => fileRef.current?.click()}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-l from-violet-600 to-fuchsia-600 text-xl text-white">
                    ＋
                  </span>
                  انتخاب تصویر از گالری
                  <span className="text-xs text-slate-500">JPG / PNG / WEBP تا ۵ مگابایت</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="h-4 w-4 accent-fuchsia-500"
            />
            منتشر شود
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <BilliardButton type="submit" loading={busy} fullWidth sx={{ flex: 1 }}>
              {editingId ? "ذخیره تغییرات" : "انتشار خبر"}
            </BilliardButton>
            {editingId && (
              <BilliardButton type="button" variant="secondary" disabled={busy} onClick={resetForm}>
                انصراف
              </BilliardButton>
            )}
          </div>
          {msg && <p className="text-sm text-cyan-300">{msg}</p>}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">لیست اخبار</h2>
        {items.map((n) => (
          <article key={n.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="flex flex-col sm:flex-row">
              <div
                className="aspect-[16/10] w-full shrink-0 bg-white/10 bg-cover bg-center sm:aspect-auto sm:h-auto sm:w-40"
                style={n.cover_url ? { backgroundImage: `url(${n.cover_url})` } : undefined}
              />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-100">{n.title}</h3>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[11px] ${
                        n.is_published
                          ? "bg-cyan-500/15 text-cyan-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {n.is_published ? "منتشر شده" : "پیش‌نویس"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">{n.body}</p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <BilliardButton type="button" variant="secondary" onClick={() => startEdit(n)}>
                    ویرایش
                  </BilliardButton>
                  <BilliardButton
                    type="button"
                    variant="danger"
                    loading={deletingId === n.id}
                    disabled={busy || (deletingId !== null && deletingId !== n.id)}
                    onClick={() => remove(n)}
                  >
                    حذف
                  </BilliardButton>
                </div>
              </div>
            </div>
          </article>
        ))}
        {!items.length && (
          <div className="card-soft px-4 py-10 text-center text-sm text-slate-500">هنوز خبری ثبت نشده است.</div>
        )}
      </div>
    </div>
  );
}
