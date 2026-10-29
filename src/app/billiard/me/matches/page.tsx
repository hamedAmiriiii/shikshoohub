"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, statusLabel } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";

export default function MyMatchesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/billiard/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ data: any[] }>("/me/matches").then((d) => setMatches(d.data || [])).catch(() => {});
  }, [user]);

  if (loading || !user) return <p className="text-slate-400">در حال بارگذاری...</p>;

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-slate-100">برنامه بازی‌های من</h1>
      <p className="mb-6 text-sm text-slate-400">مسابقات و اسکورهای مربوط به شما</p>
      <div className="card-soft divide-y divide-white/10">
        {matches.map((m) => (
          <div key={m.id} className="flex flex-wrap justify-between gap-3 py-3.5 text-sm">
            <div>
              <div className="text-xs text-slate-500">
                {m.tournament?.name} · {m.round_label}
              </div>
              <div className="text-slate-100">
                {m.player1?.full_name} vs {m.player2?.full_name}
              </div>
              <div className="text-xs text-slate-500">
                {[m.scheduled_on, m.scheduled_at, m.table?.name].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div className="text-left">
              <div className="font-display text-cyan-300">
                {m.score1 ?? "-"} – {m.score2 ?? "-"}
              </div>
              <div className="text-xs text-slate-500">{statusLabel[m.status] || m.status}</div>
            </div>
          </div>
        ))}
        {!matches.length && <p className="py-6 text-center text-slate-500">بازی‌ای ثبت نشده است.</p>}
      </div>
    </div>
  );
}
