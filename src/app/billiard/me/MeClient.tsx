"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  apiFetch,
  isRegistrationSettled,
  paymentStatusLabel,
  statusLabel,
  type ApiError,
} from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

export default function MeClient() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [edit, setEdit] = useState(sp.get("edit") === "1");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    city: "",
    club: "",
    national_id: "",
    photo_base64: "",
  });
  const [regs, setRegs] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [msg, setMsg] = useState(sp.get("paid") === "1" ? "پرداخت با موفقیت انجام شد." : "");
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/billiard/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      city: user.city || "",
      club: user.club || "",
      national_id: "",
      photo_base64: "",
    });
    apiFetch<{ data: any[] }>("/me/registrations").then((d) => setRegs(d.data || [])).catch(() => {});
    apiFetch<{ data: any[] }>("/me/matches").then((d) => setMatches(d.data || [])).catch(() => {});
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setSaving(true);
    try {
      const body: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        city: form.city,
        club: form.club,
      };
      if (form.national_id) body.national_id = form.national_id;
      if (form.photo_base64) body.photo_base64 = form.photo_base64;
      await apiFetch("/me", { method: "PATCH", body: JSON.stringify(body) });
      await refresh();
      setEdit(false);
      setMsg("پروفایل ذخیره شد.");
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setSaving(false);
    }
  }

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo_base64: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  async function resumePay(registrationId: number) {
    setPayingId(registrationId);
    setMsg("");
    try {
      const site = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
      const pay = await apiFetch<{ payment_url: string }>(`/registrations/${registrationId}/pay`, {
        method: "POST",
        body: JSON.stringify({ return_url: `${site}/billiard/me?paid=1` }),
      });
      window.location.href = pay.payment_url;
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در پرداخت");
      setPayingId(null);
    }
  }

  if (loading || !user) return <p className="text-slate-400">در حال بارگذاری...</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-slate-100">پروفایل من</h1>
        <div className="flex flex-wrap gap-2">
          <BilliardButton type="button" variant="secondary" onClick={() => setEdit((v) => !v)}>
            {edit ? "بستن ویرایش" : "ویرایش پروفایل"}
          </BilliardButton>
          <BilliardButton href="/billiard/me/matches" variant="secondary">
            بازی‌های من
          </BilliardButton>
        </div>
      </div>
      {msg && <p className="text-sm text-cyan-300">{msg}</p>}
      {!user.profile_complete && (
        <p className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2.5 text-sm text-fuchsia-200">
          برای ثبت‌نام در مسابقه، نام، نام خانوادگی و عکس چهره الزامی است.
        </p>
      )}

      {edit ? (
        <form onSubmit={save} className="card-soft grid max-w-xl gap-3">
          <div>
            <label className="label">نام</label>
            <input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">نام خانوادگی</label>
            <input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">شهر</label>
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label">باشگاه</label>
            <input className="input" value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} />
          </div>
          <div>
            <label className="label">کد ملی</label>
            <input className="input" value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
          </div>
          <div>
            <label className="label">عکس چهره</label>
            <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          </div>
          <BilliardButton type="submit" loading={saving}>
            ذخیره
          </BilliardButton>
        </form>
      ) : (
        <div className="card-soft flex items-center gap-4">
          <div
            className="h-20 w-20 rounded-2xl border border-white/10 bg-white/10 bg-cover bg-center"
            style={user.photo_url ? { backgroundImage: `url(${user.photo_url})` } : undefined}
          />
          <div>
            <div className="font-display text-xl text-slate-100">{user.full_name}</div>
            <div className="text-sm text-slate-500">{user.phone}</div>
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl text-slate-100">ثبت‌نام‌های من</h2>
        <div className="card-soft divide-y divide-white/10">
          {regs.map((r) => {
            const settled = isRegistrationSettled(r);
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link
                    href={`/billiard/tournaments/${r.tournament?.slug}`}
                    className="font-medium text-slate-100 hover:text-cyan-300 transition"
                  >
                    {r.tournament?.name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {settled
                      ? `${statusLabel[r.status] || r.status} · ${paymentStatusLabel[r.payment_status] || r.payment_status}`
                      : `هنوز در مسابقه ثبت نشده · ${paymentStatusLabel[r.payment_status] || r.payment_status}`}
                  </div>
                </div>
                {!settled && r.fee_toman > 0 && r.status !== "rejected" && r.status !== "cancelled" && (
                  <BilliardButton
                    type="button"
                    loading={payingId === r.id}
                    disabled={payingId !== null && payingId !== r.id}
                    onClick={() => resumePay(r.id)}
                  >
                    ادامه پرداخت
                  </BilliardButton>
                )}
              </div>
            );
          })}
          {!regs.length && <p className="py-4 text-sm text-slate-500">ثبت‌نامی ندارید.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-slate-100">بازی‌های نزدیک</h2>
        <div className="card-soft divide-y divide-white/10">
          {matches.slice(0, 10).map((m) => (
            <div key={m.id} className="py-3 text-sm text-slate-200">
              <div className="text-xs text-slate-500">
                {m.tournament?.name} · {m.round_label}
              </div>
              <div>
                {m.player1?.full_name} vs {m.player2?.full_name}
              </div>
              <div className="text-xs text-slate-500">
                {[m.scheduled_on, m.scheduled_at, m.table?.name].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
          {!matches.length && <p className="py-4 text-sm text-slate-500">بازی‌ای نیست.</p>}
        </div>
      </section>
    </div>
  );
}
