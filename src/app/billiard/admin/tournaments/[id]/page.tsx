"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  apiFetch,
  isRegistrationSettled,
  paymentStatusLabel,
  statusLabel,
  type ApiError,
} from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";

export default function AdminTournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tournament, setTournament] = useState<any>(null);
  const [regs, setRegs] = useState<any[]>([]);
  const [bracket, setBracket] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [tableName, setTableName] = useState("میز 1");
  const [msg, setMsg] = useState("");
  const [scores, setScores] = useState<Record<number, { s1: string; s2: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const list = await apiFetch<{ data: any[] }>("/admin/tournaments");
    const t = (list.data || []).find((x) => String(x.id) === String(id));
    setTournament(t || null);
    if (!t) return;
    const [r, tb] = await Promise.all([
      apiFetch<{ data: any[] }>(`/admin/registrations?tournament_id=${id}`),
      apiFetch<{ data: any[] }>(`/admin/tournaments/${id}/tables`),
    ]);
    setRegs(r.data || []);
    setTables(tb.data || []);
    if (t.slug) {
      const pub = await apiFetch<any>(`/tournaments/${t.slug}`, { auth: false });
      setBracket(pub.bracket || []);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, [id]);

  async function draw() {
    setMsg("");
    setBusy("draw");
    try {
      const res = await apiFetch<{ bracket: any[] }>(`/admin/tournaments/${id}/draw`, {
        method: "POST",
        body: JSON.stringify({ shuffle: true }),
      });
      setBracket(res.bracket || []);
      setMsg("قرعه‌کشی انجام شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function addTable() {
    setBusy("table");
    try {
      await apiFetch(`/admin/tournaments/${id}/tables`, {
        method: "POST",
        body: JSON.stringify({ name: tableName }),
      });
      setTableName(`میز ${tables.length + 2}`);
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function saveSchedule(matchId: number, tableId: string, date: string, time: string) {
    try {
      await apiFetch(`/admin/matches/${matchId}/schedule`, {
        method: "PATCH",
        body: JSON.stringify({
          table_id: tableId ? Number(tableId) : null,
          scheduled_on: date || null,
          scheduled_at: time || null,
        }),
      });
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    }
  }

  async function saveResult(matchId: number) {
    const s = scores[matchId] || { s1: "0", s2: "0" };
    setBusy(`result-${matchId}`);
    try {
      await apiFetch(`/admin/matches/${matchId}/result`, {
        method: "POST",
        body: JSON.stringify({ score1: Number(s.s1), score2: Number(s.s2) }),
      });
      setMsg("نتیجه ثبت شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(status: string) {
    setBusy("status");
    try {
      await apiFetch(`/admin/tournaments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function confirmReg(regId: number) {
    setBusy(`confirm-${regId}`);
    try {
      await apiFetch(`/admin/registrations/${regId}/confirm`, { method: "POST" });
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  if (!tournament) return <p className="text-slate-400">در حال بارگذاری...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-slate-100">{tournament.name}</h1>
        <p className="text-sm text-slate-400">{statusLabel[tournament.status]}</p>
      </div>
      {msg && <p className="text-sm text-cyan-300">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <BilliardButton
          type="button"
          variant="secondary"
          loading={busy === "status"}
          disabled={busy !== null && busy !== "status"}
          onClick={() => setStatus("registration_closed")}
        >
          بستن ثبت‌نام
        </BilliardButton>
        <BilliardButton
          type="button"
          loading={busy === "draw"}
          disabled={busy !== null && busy !== "draw"}
          onClick={draw}
        >
          قرعه‌کشی + ساخت جدول
        </BilliardButton>
      </div>

      <section className="card-soft space-y-3">
        <h2 className="font-display text-xl text-slate-100">میزها</h2>
        <div className="flex flex-wrap gap-2">
          <input className="input max-w-xs" value={tableName} onChange={(e) => setTableName(e.target.value)} />
          <BilliardButton type="button" variant="secondary" loading={busy === "table"} onClick={addTable}>
            افزودن میز
          </BilliardButton>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {tables.map((t) => (
            <span key={t.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
              {t.name}
            </span>
          ))}
        </div>
      </section>

      <section className="card-soft">
        <h2 className="mb-3 font-display text-xl text-slate-100">
          ثبت‌نام‌ها ({regs.filter((r) => isRegistrationSettled(r)).length} قطعی / {regs.length} کل)
        </h2>
        <div className="divide-y divide-white/10 text-sm">
          {regs.map((r) => {
            const settled = isRegistrationSettled(r);
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-slate-200">
                  {r.player?.full_name} · {settled ? statusLabel[r.status] : "پیش‌نویس"} ·{" "}
                  <span className={settled ? "text-cyan-300" : "text-amber-300"}>
                    {paymentStatusLabel[r.payment_status] || r.payment_status}
                  </span>
                </span>
                {settled && r.status === "pending" && (
                  <BilliardButton
                    type="button"
                    variant="secondary"
                    loading={busy === `confirm-${r.id}`}
                    onClick={() => confirmReg(r.id)}
                  >
                    تأیید
                  </BilliardButton>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-slate-100">جدول / نتایج</h2>
        {bracket.map((m) => (
          <div key={m.id} className="card-soft space-y-2 text-sm">
            <div className="font-medium text-slate-100">
              {m.round_label}: {m.player1?.full_name || "TBD"} vs {m.player2?.full_name || "TBD"}
            </div>
            <div className="text-xs text-slate-500">{statusLabel[m.status]}</div>
            <div className="flex flex-wrap gap-2">
              <select
                className="input max-w-[140px]"
                defaultValue={m.table_id || ""}
                onChange={(e) =>
                  saveSchedule(m.id, e.target.value, m.scheduled_on || "", m.scheduled_at || "")
                }
              >
                <option value="">میز</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="input max-w-[160px]"
                defaultValue={m.scheduled_on || ""}
                onBlur={(e) =>
                  saveSchedule(m.id, m.table_id || "", e.target.value, m.scheduled_at || "")
                }
              />
              <input
                type="time"
                className="input max-w-[120px]"
                defaultValue={m.scheduled_at || ""}
                onBlur={(e) =>
                  saveSchedule(m.id, m.table_id || "", m.scheduled_on || "", e.target.value)
                }
              />
            </div>
            {m.player1_id && m.player2_id && m.status !== "finished" && m.status !== "walkover" && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="input w-20"
                  placeholder="امتیاز ۱"
                  value={scores[m.id]?.s1 ?? ""}
                  onChange={(e) =>
                    setScores({ ...scores, [m.id]: { s1: e.target.value, s2: scores[m.id]?.s2 || "" } })
                  }
                />
                <input
                  className="input w-20"
                  placeholder="امتیاز ۲"
                  value={scores[m.id]?.s2 ?? ""}
                  onChange={(e) =>
                    setScores({ ...scores, [m.id]: { s1: scores[m.id]?.s1 || "", s2: e.target.value } })
                  }
                />
                <BilliardButton
                  type="button"
                  loading={busy === `result-${m.id}`}
                  onClick={() => saveResult(m.id)}
                >
                  ثبت نتیجه
                </BilliardButton>
              </div>
            )}
            {(m.status === "finished" || m.status === "walkover") && (
              <div className="font-display text-cyan-300">
                {m.score1} – {m.score2}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
