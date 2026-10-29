"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, formatToman, statusLabel, type ApiError } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";

export default function RegisterClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const preselect = sp.get("tournament") || "";
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [slug, setSlug] = useState(preselect);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<{ data: any[] }>("/tournaments?status=registration_open", { auth: false })
      .then((d) => setTournaments(d.data || []))
      .catch(() => setTournaments([]));
  }, []);

  useEffect(() => {
    if (preselect) setSlug(preselect);
  }, [preselect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/billiard/login");
      return;
    }
    if (!user.profile_complete) {
      router.push("/billiard/me?edit=1");
      return;
    }
    if (!slug) {
      setMsg("مسابقه را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const reg = await apiFetch<{ registration: any }>(`/tournaments/${slug}/register`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const r = reg.registration;
      if (r.fee_toman > 0 && r.payment_status !== "paid" && r.payment_status !== "waived") {
        const site = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
        const pay = await apiFetch<{ payment_url: string }>(`/registrations/${r.id}/pay`, {
          method: "POST",
          body: JSON.stringify({ return_url: `${site}/billiard/me?paid=1` }),
        });
        window.location.href = pay.payment_url;
        return;
      }
      setMsg("ثبت‌نام با موفقیت انجام شد.");
      router.push("/billiard/me");
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در ثبت‌نام");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>در حال بارگذاری...</p>;

  return (
    <div className="card-soft mx-auto max-w-lg space-y-4">
      <h1 className="font-display text-2xl">ثبت‌نام مسابقات</h1>
      {!user && (
        <p className="text-sm text-felt-700">
          ابتدا{" "}
          <Link href="/billiard/login" className="underline">
            وارد شوید
          </Link>{" "}
          سپس ثبت‌نام و پرداخت را انجام دهید.
        </p>
      )}
      <form onSubmit={submit} className="space-y-3">
        <label className="label">انتخاب مسابقه</label>
        <select className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
          <option value="">انتخاب کنید</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name} — {formatToman(t.fee_toman || 0)} ({statusLabel[t.status] || t.status})
            </option>
          ))}
        </select>
        <button className="btn-primary w-full" disabled={busy || !user} type="submit">
          ادامه ثبت‌نام / پرداخت
        </button>
      </form>
      {msg && <p className="text-sm text-felt-800">{msg}</p>}
    </div>
  );
}
