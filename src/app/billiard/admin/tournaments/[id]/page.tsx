"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [players, setPlayers] = useState<any[]>([]);
  const [playerQuery, setPlayerQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [waiveFee, setWaiveFee] = useState(true);
  const [tableName, setTableName] = useState("میز 1");
  const [msg, setMsg] = useState("");
  const [scores, setScores] = useState<Record<number, { s1: string; s2: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [playersLoading, setPlayersLoading] = useState(false);

  async function loadPlayers(q = "") {
    setPlayersLoading(true);
    try {
      const qs = new URLSearchParams({ per_page: "200" });
      if (q.trim()) qs.set("q", q.trim());
      const p = await apiFetch<{ data: any[] }>(`/admin/players?${qs}`);
      setPlayers(p.data || []);
    } finally {
      setPlayersLoading(false);
    }
  }

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
    await loadPlayers(playerQuery);
    if (t.slug) {
      const pub = await apiFetch<any>(`/tournaments/${t.slug}`, { auth: false });
      setBracket(pub.bracket || []);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      loadPlayers(playerQuery).catch(() => {});
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerQuery]);

  const activePlayerIds = useMemo(
    () => new Set(regs.filter((r) => isRegistrationSettled(r)).map((r) => Number(r.player_id))),
    [regs],
  );

  const availablePlayers = useMemo(
    () => players.filter((p) => !activePlayerIds.has(Number(p.id))),
    [players, activePlayerIds],
  );

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

  async function addPlayer() {
    if (!selectedPlayerId) {
      setMsg("بازیکن را انتخاب کنید.");
      return;
    }
    setBusy("add-player");
    setMsg("");
    try {
      await apiFetch(`/admin/tournaments/${id}/registrations`, {
        method: "POST",
        body: JSON.stringify({
          player_id: Number(selectedPlayerId),
          waive_fee: waiveFee,
        }),
      });
      setSelectedPlayerId("");
      setMsg("بازیکن به مسابقه اضافه شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در افزودن بازیکن");
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
      {msg && <p className="text-sm text-cyan-300 whitespace-pre-wrap">{msg}</p>}

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

      <section className="card-soft space-y-4">
        <div>
          <h2 className="font-display text-xl text-slate-100">
            ثبت‌نام‌ها ({regs.filter((r) => isRegistrationSettled(r)).length} قطعی / {regs.length} کل)
          </h2>
          <p className="mt-1 text-sm text-slate-400">بازیکن را از لیست انتخاب کنید و به مسابقه اضافه کنید.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="label">جستجوی بازیکن</label>
            <input
              className="input"
              value={playerQuery}
              onChange={(e) => {
                setPlayerQuery(e.target.value);
                setSelectedPlayerId("");
              }}
              placeholder="نام، موبایل، شهر..."
            />
          </div>
          <div>
            <label className="label">انتخاب از لیست {playersLoading ? "(در حال جستجو...)" : ""}</label>
            <select
              className="input"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              <option value="">انتخاب بازیکن</option>
              {availablePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — {p.phone}
                  {p.city ? ` · ${p.city}` : ""}
                </option>
              ))}
            </select>
          </div>
          <BilliardButton
            type="button"
            loading={busy === "add-player"}
            disabled={!selectedPlayerId || (busy !== null && busy !== "add-player")}
            onClick={addPlayer}
          >
            افزودن به مسابقه
          </BilliardButton>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={waiveFee}
            onChange={(e) => setWaiveFee(e.target.checked)}
            className="h-4 w-4 accent-fuchsia-500"
          />
          بدون پرداخت / رایگان ثبت شود (پیشنهادی برای افزودن دستی ادمین)
        </label>

        {!availablePlayers.length && (
          <p className="text-sm text-slate-500">
            بازیکن قابل‌افزودنی نیست — یا همه اضافه شده‌اند یا لیست بازیکن خالی است.
          </p>
        )}

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
          {!regs.length && <p className="py-3 text-slate-500">هنوز ثبت‌نامی نیست.</p>}
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
