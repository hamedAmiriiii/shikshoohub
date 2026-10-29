"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, statusLabel, type ApiError } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";

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
    }
  }

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo_base64: String(reader.result || "") }));
    reader.readAsDataURL(file);
  }

  if (loading || !user) return <p>در حال بارگذاری...</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">پروفایل من</h1>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => setEdit((v) => !v)}>
            {edit ? "بستن ویرایش" : "ویرایش پروفایل"}
          </button>
          <Link href="/billiard/me/matches" className="btn-secondary">
            بازی‌های من
          </Link>
        </div>
      </div>
      {msg && <p className="text-sm text-felt-700">{msg}</p>}
      {!user.profile_complete && (
        <p className="rounded-lg bg-cue-500/15 px-3 py-2 text-sm">
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
          <button className="btn-primary" type="submit">
            ذخیره
          </button>
        </form>
      ) : (
        <div className="card-soft flex items-center gap-4">
          <div
            className="h-20 w-20 rounded-2xl bg-felt-200 bg-cover bg-center"
            style={user.photo_url ? { backgroundImage: `url(${user.photo_url})` } : undefined}
          />
          <div>
            <div className="font-display text-xl">{user.full_name}</div>
            <div className="text-sm text-felt-600">{user.phone}</div>
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl">ثبت‌نام‌های من</h2>
        <div className="card-soft divide-y divide-felt-900/5">
          {regs.map((r) => (
            <div key={r.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
              <div>
                <Link href={`/billiard/tournaments/${r.tournament?.slug}`} className="font-medium hover:underline">
                  {r.tournament?.name}
                </Link>
                <div className="text-xs text-felt-500">
                  {statusLabel[r.status]} · پرداخت: {statusLabel[r.payment_status] || r.payment_status}
                </div>
              </div>
            </div>
          ))}
          {!regs.length && <p className="py-4 text-sm text-felt-600">ثبت‌نامی ندارید.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">بازی‌های نزدیک</h2>
        <div className="card-soft divide-y divide-felt-900/5">
          {matches.slice(0, 10).map((m) => (
            <div key={m.id} className="py-3 text-sm">
              <div className="text-xs text-felt-500">
                {m.tournament?.name} · {m.round_label}
              </div>
              <div>
                {m.player1?.full_name} vs {m.player2?.full_name}
              </div>
              <div className="text-xs text-felt-500">
                {[m.scheduled_on, m.scheduled_at, m.table?.name].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
          {!matches.length && <p className="py-4 text-sm text-felt-600">بازی‌ای نیست.</p>}
        </div>
      </section>
    </div>
  );
}
