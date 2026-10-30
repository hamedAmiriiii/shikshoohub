"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, formatToman, statusLabel, type ApiError } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

function deadlinePassed(t: any): boolean {
  if (t.registration_deadline_passed === true) return true;
  if (!t.registration_deadline) return false;
  const d = new Date(t.registration_deadline);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

function canRegister(t: any): boolean {
  if (t.accepts_registration === true) return true;
  if (t.accepts_registration === false) return false;
  const openStatus = t.status === "registration_open" || t.status === "pre_registration";
  return openStatus && !deadlinePassed(t);
}

function formatDeadline(value?: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function RegisterClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const preselect = sp.get("tournament") || "";
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiFetch<{ data: any[] }>("/tournaments?for_register=1&per_page=50", { auth: false })
      .then((d) => setTournaments(d.data || []))
      .catch(() => setTournaments([]));
  }, []);

  const sorted = useMemo(() => {
    return [...tournaments].sort((a, b) => {
      const aOpen = canRegister(a) ? 0 : 1;
      const bOpen = canRegister(b) ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return String(b.starts_on || "").localeCompare(String(a.starts_on || ""));
    });
  }, [tournaments]);

  async function registerFor(slug: string) {
    if (!user) {
      router.push(`/billiard/login?next=${encodeURIComponent(`/billiard/register?tournament=${slug}`)}`);
      return;
    }
    if (!user.profile_complete) {
      router.push("/billiard/me?edit=1");
      return;
    }
    setBusySlug(slug);
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
      setBusySlug(null);
    }
  }

  if (loading) return <p className="text-slate-400">در حال بارگذاری...</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <p className="text-sm text-cyan-400">ثبت‌نام آنلاین</p>
        <h1 className="mt-1 font-display text-3xl text-slate-100">ثبت‌نام مسابقات</h1>
        <p className="mt-2 text-sm text-slate-400">مسابقه فعال را انتخاب کنید و ثبت‌نام را ادامه دهید.</p>
      </div>

      {!user && (
        <p className="mb-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
          برای ثبت‌نام ابتدا{" "}
          <Link href="/billiard/login" className="text-cyan-400 hover:text-cyan-300">
            وارد شوید
          </Link>
          .
        </p>
      )}

      {msg && <p className="mb-4 text-sm text-cyan-300 whitespace-pre-wrap">{msg}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((t) => {
          const open = canRegister(t);
          const expired = deadlinePassed(t) || t.status === "registration_closed";
          const highlighted = preselect && preselect === t.slug;

          return (
            <article
              key={t.id}
              className={`overflow-hidden rounded-2xl border backdrop-blur transition ${
                open
                  ? "border-white/10 bg-white/[0.04] hover:border-cyan-400/35"
                  : "border-white/5 bg-white/[0.02] opacity-70"
              } ${highlighted ? "ring-2 ring-cyan-400/40" : ""}`}
            >
              <div
                className="relative h-32 overflow-hidden bg-[#121826]"
                style={
                  t.poster_url
                    ? {
                        backgroundImage: `url(${t.poster_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {
                        backgroundImage:
                          "radial-gradient(circle at 20% 20%, rgba(34,211,238,.22), transparent 45%), radial-gradient(circle at 80% 80%, rgba(192,38,211,.18), transparent 40%), linear-gradient(135deg, #121826, #0b0f1a)",
                      }
                }
              >
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0b0f1a] to-transparent" />
                <span
                  className={`absolute bottom-3 right-3 rounded-lg border px-2 py-1 text-[11px] backdrop-blur ${
                    open
                      ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-300"
                      : "border-white/10 bg-black/40 text-slate-400"
                  }`}
                >
                  {open ? "ثبت‌نام فعال" : expired ? "مهلت تمام شده" : statusLabel[t.status] || t.status}
                </span>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <div className="text-xs text-slate-500">{t.discipline?.name || "—"}</div>
                  <h2 className="mt-0.5 font-display text-lg text-slate-100">{t.name}</h2>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                  {t.starts_on && <span>شروع: {t.starts_on}</span>}
                  {t.venue && <span>{t.venue}</span>}
                  {typeof t.fee_toman === "number" && <span>{formatToman(t.fee_toman)}</span>}
                  {t.registration_deadline && (
                    <span className={expired ? "text-amber-300/90" : ""}>
                      مهلت: {formatDeadline(t.registration_deadline)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {open ? (
                    <BilliardButton
                      type="button"
                      loading={busySlug === t.slug}
                      disabled={busySlug !== null && busySlug !== t.slug}
                      onClick={() => registerFor(t.slug)}
                    >
                      ثبت‌نام در مسابقه
                    </BilliardButton>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-500"
                    >
                      {expired ? "ثبت‌نام بسته است" : "غیرفعال"}
                    </button>
                  )}
                  <BilliardButton href={`/billiard/tournaments/${t.slug}`} variant="secondary">
                    جزئیات
                  </BilliardButton>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!sorted.length && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-500">
          فعلاً مسابقه‌ای برای نمایش نیست.
        </p>
      )}
    </div>
  );
}
