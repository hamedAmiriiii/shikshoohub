"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, statusLabel, type ApiError } from "@/app/lib/billiard/api";
import { useAuth } from "@/app/lib/billiard/auth";
import { billiardHref } from "@/app/lib/billiardHosts";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";
import { formatMatchWhen, indexMatches, matchSideText, type MatchLike } from "@/app/lib/billiard/matchDisplay";

type DeskMatch = MatchLike & {
  id: number;
  match_no?: number;
  round_label?: string | null;
  player1_id?: number | null;
  player2_id?: number | null;
  score1?: number | null;
  score2?: number | null;
  status?: string;
};

export default function ResultsDeskPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<{ id: number; name: string }[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [matches, setMatches] = useState<DeskMatch[]>([]);
  const [scores, setScores] = useState<Record<number, { s1: string; s2: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace(billiardHref("/login"));
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ data: { id: number; name: string }[] }>("/results-clerk/tournaments")
      .then((d) => {
        const rows = d.data || [];
        setTournaments(rows);
        setActiveId((cur) => cur ?? rows[0]?.id ?? null);
      })
      .catch((err) => setMsg((err as ApiError).message || "خطا"));
  }, [user]);

  useEffect(() => {
    if (!activeId) return;
    setMsg("");
    apiFetch<{ data: DeskMatch[] }>(`/results-clerk/tournaments/${activeId}/matches`)
      .then((d) => {
        const rows = d.data || [];
        setMatches(rows);
        const next: Record<number, { s1: string; s2: string }> = {};
        for (const m of rows) {
          if (m.status === "finished" || m.status === "walkover") {
            next[m.id] = { s1: m.score1 != null ? String(m.score1) : "", s2: m.score2 != null ? String(m.score2) : "" };
          }
        }
        setScores(next);
      })
      .catch((err) => setMsg((err as ApiError).message || "خطا"));
  }, [activeId]);

  const catalog = useMemo(() => indexMatches(matches), [matches]);
  const active = tournaments.find((t) => t.id === activeId);

  async function save(m: DeskMatch) {
    const s1 = Number(scores[m.id]?.s1);
    const s2 = Number(scores[m.id]?.s2);
    if (!Number.isInteger(s1) || !Number.isInteger(s2)) {
      setMsg("امتیاز هر دو طرف را وارد کنید.");
      return;
    }
    setBusy(`save-${m.id}`);
    setMsg("");
    try {
      await apiFetch(`/results-clerk/matches/${m.id}/result`, {
        method: "POST",
        body: JSON.stringify({ score1: s1, score2: s2 }),
      });
      setMsg("نتیجه ثبت شد.");
      const d = await apiFetch<{ data: DeskMatch[] }>(`/results-clerk/tournaments/${activeId}/matches`);
      setMatches(d.data || []);
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function clear(m: DeskMatch) {
    if (!window.confirm("نتیجه این بازی حذف شود؟")) return;
    setBusy(`clear-${m.id}`);
    setMsg("");
    try {
      await apiFetch(`/results-clerk/matches/${m.id}/result`, { method: "DELETE" });
      setMsg("نتیجه حذف شد.");
      const d = await apiFetch<{ data: DeskMatch[] }>(`/results-clerk/tournaments/${activeId}/matches`);
      setMatches(d.data || []);
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  if (loading || !user) return <p className="text-slate-400">در حال بررسی دسترسی...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl text-slate-100">ثبت نتایج</h1>
        <p className="mt-1 text-sm text-slate-400">فقط مسابقه‌ای که این شماره برایش مسئول شده است.</p>
      </div>

      {tournaments.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {tournaments.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className={`rounded-xl border px-3 py-2 text-sm ${
                t.id === activeId
                  ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {active && <h2 className="text-lg text-slate-100">{active.name}</h2>}
      {!tournaments.length && <p className="text-sm text-slate-500">این شماره مسئول ثبت نتیجهٔ هیچ مسابقه‌ای نیست.</p>}

      <div className="space-y-2">
        {matches.map((m) => {
          const ready = !!m.player1_id && !!m.player2_id;
          const done = m.status === "finished" || m.status === "walkover";
          return (
            <div key={m.id} className="card-soft space-y-2 !p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{m.round_label || `بازی ${m.match_no ?? m.id}`}</span>
                <span>{formatMatchWhen(m) || "زمان ثبت نشده"}</span>
              </div>
              <div className="text-sm text-slate-100">
                {matchSideText(m, 1, catalog)} <span className="text-slate-500">vs</span> {matchSideText(m, 2, catalog)}
              </div>
              {ready ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="input input-sm w-16"
                    inputMode="numeric"
                    value={scores[m.id]?.s1 ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [m.id]: { s1: e.target.value, s2: prev[m.id]?.s2 || "" } }))
                    }
                  />
                  <input
                    className="input input-sm w-16"
                    inputMode="numeric"
                    value={scores[m.id]?.s2 ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [m.id]: { s1: prev[m.id]?.s1 || "", s2: e.target.value } }))
                    }
                  />
                  <BilliardButton
                    type="button"
                    loading={busy === `save-${m.id}`}
                    sx={{ minHeight: 34, py: "4px", px: 1.25, fontSize: 12 }}
                    onClick={() => save(m)}
                  >
                    {done ? "اصلاح نتیجه" : "ثبت نتیجه"}
                  </BilliardButton>
                  {done && (
                    <button type="button" className="text-xs text-rose-300 hover:underline" onClick={() => clear(m)}>
                      حذف نتیجه
                    </button>
                  )}
                  <span className="text-xs text-slate-500">{statusLabel[m.status || ""] || ""}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">طرف‌های این بازی هنوز مشخص نیستند.</p>
              )}
            </div>
          );
        })}
      </div>
      {msg && <p className="text-sm text-cyan-300">{msg}</p>}
    </div>
  );
}
