"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { apiFetch, formatToman, statusLabel, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";
import {
  BILLIARD_TIME_OPTIONS,
  fromGregorianYmd,
  splitIsoDateTime,
  timeForApi,
  toGregorianYmd,
} from "@/app/billiard/admin/components/MatchScheduleFields";

type TournamentForm = {
  name: string;
  discipline_id: string;
  fee_toman: string;
  capacity: string;
  status: string;
  venue: string;
  format: string;
  description: string;
  results_clerk_phone: string;
  starts_on: string;
  registration_deadline_date: string;
  registration_deadline_time: string;
  poster_base64: string;
  poster_preview: string;
};

const emptyForm = (): TournamentForm => ({
  name: "",
  discipline_id: "",
  fee_toman: "0",
  capacity: "16",
  status: "registration_open",
  venue: "",
  format: "single_elimination",
  description: "",
  results_clerk_phone: "",
  starts_on: "",
  registration_deadline_date: "",
  registration_deadline_time: "",
  poster_base64: "",
  poster_preview: "",
});

function JalaliDateField({
  label,
  valueYmd,
  onChange,
  placeholder = "انتخاب تاریخ",
}: {
  label: string;
  valueYmd: string;
  onChange: (ymd: string) => void;
  placeholder?: string;
}) {
  const value = useMemo(() => fromGregorianYmd(valueYmd || null), [valueYmd]);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="billiard-date-picker">
        <DatePicker
          value={value}
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-right"
          format="YYYY/MM/DD"
          placeholder={placeholder}
          editable={false}
          portal
          zIndex={80}
          containerStyle={{ width: "100%" }}
          inputClass="input"
          onChange={(d) => {
            const obj = d && !Array.isArray(d) ? (d as DateObject) : null;
            onChange(toGregorianYmd(obj));
          }}
        />
      </div>
    </div>
  );
}

export default function AdminTournamentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [form, setForm] = useState<TournamentForm>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [removePoster, setRemovePoster] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const deadlineTimeOptions = useMemo(() => {
    const list = [...BILLIARD_TIME_OPTIONS];
    if (form.registration_deadline_time && !list.includes(form.registration_deadline_time)) {
      list.unshift(form.registration_deadline_time);
    }
    return list;
  }, [form.registration_deadline_time]);

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

  function onFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("فقط فایل تصویر مجاز است.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg("حجم پوستر حداکثر ۵ مگابایت باشد.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setForm((f) => ({ ...f, poster_base64: value, poster_preview: value }));
      setRemovePoster(false);
    };
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setRemovePoster(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function startEdit(t: any) {
    const deadline = splitIsoDateTime(t.registration_deadline);
    setEditingId(t.id);
    setForm({
      name: t.name || "",
      discipline_id: String(t.discipline_id || ""),
      fee_toman: String(t.fee_toman ?? 0),
      capacity: String(t.capacity ?? 16),
      status: t.status || "registration_open",
      venue: t.venue || "",
      format: t.format || "single_elimination",
      description: t.description || "",
      results_clerk_phone: t.results_clerk_phone || "",
      starts_on: t.starts_on || "",
      registration_deadline_date: deadline.date,
      registration_deadline_time: deadline.time,
      poster_base64: "",
      poster_preview: t.poster_url || "",
    });
    setRemovePoster(false);
    setMsg("");
    if (fileRef.current) fileRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      let registrationDeadline: string | null = null;
      if (form.registration_deadline_date) {
        const t = timeForApi(form.registration_deadline_time || "23:59");
        registrationDeadline = `${form.registration_deadline_date} ${t}:00`;
      }

      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        discipline_id: Number(form.discipline_id),
        fee_toman: Number(form.fee_toman) || 0,
        capacity: form.capacity ? Number(form.capacity) : null,
        status: form.status,
        venue: form.venue.trim() || null,
        format: form.format,
        description: form.description.trim() || null,
        results_clerk_phone: form.results_clerk_phone.trim() || null,
        starts_on: form.starts_on || null,
        registration_deadline: registrationDeadline,
      };
      if (form.poster_base64) payload.poster_base64 = form.poster_base64;
      if (editingId && removePoster) payload.remove_poster = true;

      if (editingId) {
        await apiFetch(`/admin/tournaments/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMsg("مسابقه به‌روز شد.");
      } else {
        await apiFetch("/admin/tournaments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMsg("مسابقه ساخته شد.");
      }
      resetForm();
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(t: any) {
    const next = !t.is_published;
    if (
      !next &&
      !confirm("بازیکنان، گروه‌بندی و ساعت بازی‌ها از دید عموم برداشته شود؟ توضیحات و ثبت‌نام می‌ماند.")
    ) {
      return;
    }
    setPublishingId(t.id);
    setMsg("");
    try {
      const res = await apiFetch<{ message?: string }>(`/admin/tournaments/${t.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ published: next }),
      });
      setMsg(res.message || (next ? "منتشر شد." : "از دید عموم برداشته شد."));
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در انتشار");
    } finally {
      setPublishingId(null);
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

      <form onSubmit={submit} className="card-soft grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="font-display text-lg text-slate-100">
            {editingId ? "ویرایش مسابقه" : "ایجاد مسابقه"}
          </h2>
        </div>
        <input
          className="input"
          placeholder="نام مسابقه"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          className="input"
          value={form.discipline_id}
          onChange={(e) => setForm({ ...form, discipline_id: e.target.value })}
          required
        >
          <option value="">انتخاب رشته</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="محل"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
        />
        <input
          className="input"
          placeholder="ظرفیت"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
        <input
          className="input"
          placeholder="مبلغ تومان"
          value={form.fee_toman}
          onChange={(e) => setForm({ ...form, fee_toman: e.target.value })}
        />
        <select
          className="input"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="pre_registration">پیش‌ثبت‌نام</option>
          <option value="registration_open">ثبت‌نام فعال</option>
          <option value="registration_closed">ثبت‌نام بسته</option>
          <option value="drawn">جدول آماده‌شده</option>
          <option value="live">در حال برگزاری</option>
          <option value="finished">پایان‌یافته</option>
          <option value="cancelled">لغو شده</option>
        </select>
        <select
          className="input"
          value={form.format}
          onChange={(e) => setForm({ ...form, format: e.target.value })}
        >
          <option value="single_elimination">حذفی</option>
          <option value="group_then_elimination">گروهی سپس حذفی</option>
        </select>
        <div className="md:col-span-2">
          <label className="label">موبایل مسئول ثبت نتایج</label>
          <input
            className="input"
            inputMode="tel"
            placeholder="09xxxxxxxxx"
            value={form.results_clerk_phone}
            onChange={(e) => setForm({ ...form, results_clerk_phone: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">
            این شماره بعد از ورود فقط صفحهٔ ثبت نتیجهٔ همین مسابقه را می‌بیند.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="label">توضیحات (قبل از انتشار برای عموم دیده می‌شود)</label>
          <textarea
            className="input min-h-28"
            placeholder="معرفی مسابقه، محل، شرایط ثبت‌نام..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <JalaliDateField
          label="تاریخ شروع"
          valueYmd={form.starts_on}
          onChange={(ymd) => setForm({ ...form, starts_on: ymd })}
          placeholder="تاریخ شروع مسابقه"
        />

        <div className="space-y-2">
          <JalaliDateField
            label="مهلت ثبت‌نام"
            valueYmd={form.registration_deadline_date}
            onChange={(ymd) => setForm({ ...form, registration_deadline_date: ymd })}
            placeholder="آخرین مهلت ثبت‌نام"
          />
          <select
            className="input"
            value={form.registration_deadline_time}
            onChange={(e) => setForm({ ...form, registration_deadline_time: e.target.value })}
            disabled={!form.registration_deadline_date}
          >
            <option value="">ساعت مهلت (اختیاری — پیش‌فرض ۲۳:۵۹)</option>
            {deadlineTimeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="label">پوستر مسابقه (نمایش در کارت‌ها)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-slate-200"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          {form.poster_preview && !removePoster && (
            <div className="overflow-hidden rounded-xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.poster_preview} alt="پیش‌نمایش پوستر" className="h-40 w-full object-cover" />
            </div>
          )}
          {editingId && form.poster_preview && (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 accent-fuchsia-500"
                checked={removePoster}
                onChange={(e) => {
                  setRemovePoster(e.target.checked);
                  if (e.target.checked) {
                    setForm((f) => ({ ...f, poster_base64: "" }));
                    if (fileRef.current) fileRef.current.value = "";
                  }
                }}
              />
              حذف پوستر فعلی
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-2 md:col-span-2">
          <BilliardButton type="submit" loading={busy}>
            {editingId ? "ذخیره تغییرات" : "ایجاد مسابقه"}
          </BilliardButton>
          {editingId && (
            <BilliardButton type="button" variant="secondary" onClick={resetForm}>
              انصراف از ویرایش
            </BilliardButton>
          )}
        </div>
      </form>

      {msg && <p className="text-sm text-cyan-300 whitespace-pre-wrap">{msg}</p>}

      <div className="card-soft divide-y divide-white/10">
        {items.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#121826]"
                style={
                  t.poster_url
                    ? {
                        backgroundImage: `url(${t.poster_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              />
              <div className="min-w-0">
                <div className="font-medium text-slate-100">{t.name}</div>
                <div className="text-xs text-slate-500">
                  {t.discipline?.name} · {statusLabel[t.status]} · {formatToman(t.fee_toman || 0)}
                  {" · "}
                  {t.is_published ? "منتشر شده" : "فقط توضیحات و ثبت‌نام"}
                  {t.results_clerk_phone ? ` · مسئول نتایج ${t.results_clerk_phone}` : ""}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <BilliardButton
                type="button"
                variant={t.is_published ? "secondary" : "primary"}
                loading={publishingId === t.id}
                onClick={() => togglePublish(t)}
              >
                {t.is_published ? "لغو انتشار" : "انتشار"}
              </BilliardButton>
              <BilliardButton type="button" variant="secondary" onClick={() => startEdit(t)}>
                ویرایش
              </BilliardButton>
              <BilliardButton href={`/billiard/admin/tournaments/${t.id}`} variant="secondary">
                مدیریت جدول / نتیجه
              </BilliardButton>
            </div>
          </div>
        ))}
        {!items.length && <p className="py-4 text-sm text-slate-500">هنوز مسابقه‌ای نیست.</p>}
      </div>
    </div>
  );
}
