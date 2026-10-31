"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, statusLabel } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";
import {
  formatMatchWhen,
  indexMatches,
  matchSideText,
  type MatchLike,
} from "@/app/lib/billiard/matchDisplay";

export default function MyMatchesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<Map<number, MatchLike>>(() => new Map());

  useEffect(() => {
    if (!loading && !user) router.push("/billiard/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch<{ data: any[] }>("/me/matches")
      .then(async (d) => {
        const rows = d.data || [];
        if (cancelled) return;
        setMatches(rows);
        const map = indexMatches(rows);
        const slugs = [...new Set(rows.map((m) => m.tournament?.slug).filter(Boolean))] as string[];
        await Promise.all(
          slugs.map(async (slug) => {
            try {
              const t = await apiFetch<{ bracket?: MatchLike[] }>(`/tournaments/${slug}`, { auth: false });
              for (const row of t.bracket || []) {
                if (row?.id) map.set(row.id, row);
              }
            } catch {
              /* برچسب ذخیره‌شده روی خود بازی کافی است */
            }
          }),
        );
        if (!cancelled) setCatalog(new Map(map));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
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
                {matchSideText(m, 1, catalog)} <span className="text-slate-500">vs</span>{" "}
                {matchSideText(m, 2, catalog)}
              </div>
              <div className="text-xs text-slate-500">{formatMatchWhen(m)}</div>
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
