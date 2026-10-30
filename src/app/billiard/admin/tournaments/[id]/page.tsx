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
import {
  BILLIARD_LS_DATE,
  BILLIARD_LS_TIME,
  MatchScheduleFields,
  readScheduleDefault,
  timeForApi,
  writeScheduleDefault,
} from "@/app/billiard/admin/components/MatchScheduleFields";

type SlotDraft = {
  type: "player" | "source" | "empty";
  player_id: string;
  match_id: string;
  outcome: "winner" | "loser";
};

const emptySlot = (): SlotDraft => ({
  type: "player",
  player_id: "",
  match_id: "",
  outcome: "winner",
});

function slotLabel(m: any, side: 1 | 2): string {
  const p = side === 1 ? m.player1 : m.player2;
  const src = side === 1 ? m.player1_source : m.player2_source;
  if (p?.full_name) return p.full_name;
  if (src?.label) return src.label;
  return "خالی — انتخاب بازیکن";
}

function nextPowerOf2(n: number): number {
  let s = 2;
  while (s < Math.max(2, n)) s *= 2;
  return s;
}

export default function AdminTournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tournament, setTournament] = useState<any>(null);
  const [regs, setRegs] = useState<any[]>([]);
  const [bracket, setBracket] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [playerQuery, setPlayerQuery] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [waiveFee, setWaiveFee] = useState(true);
  const [tableName, setTableName] = useState("میز 1");
  const [msg, setMsg] = useState("");
  const [scores, setScores] = useState<Record<number, { s1: string; s2: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [bracketSize, setBracketSize] = useState("8");
  const [groupCount, setGroupCount] = useState("2");
  const [knockoutSize, setKnockoutSize] = useState("4");
  const [picking, setPicking] = useState<{ matchId: number; slot: 1 | 2 } | null>(null);
  const [defaultScheduleDate, setDefaultScheduleDate] = useState("");
  const [defaultScheduleTime, setDefaultScheduleTime] = useState("");
  const [groupForm, setGroupForm] = useState({
    group_code: "A",
    position: "1",
    slot1: emptySlot(),
    slot2: emptySlot(),
  });

  useEffect(() => {
    setDefaultScheduleDate(readScheduleDefault(BILLIARD_LS_DATE));
    setDefaultScheduleTime(readScheduleDefault(BILLIARD_LS_TIME));
  }, []);

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
    const [r, tb, matches] = await Promise.all([
      apiFetch<{ data: any[] }>(`/admin/registrations?tournament_id=${id}`),
      apiFetch<{ data: any[] }>(`/admin/tournaments/${id}/tables`),
      apiFetch<{ data: any[] }>(`/admin/tournaments/${id}/matches`).catch(() => ({ data: [] as any[] })),
    ]);
    setRegs(r.data || []);
    setTables(tb.data || []);
    setBracket(matches.data || []);
    const settled = (r.data || []).filter((x) => isRegistrationSettled(x)).length;
    setBracketSize(String(nextPowerOf2(settled || 8)));
    await loadPlayers(playerQuery);
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

  const settledRegs = useMemo(() => regs.filter((r) => isRegistrationSettled(r)), [regs]);

  const activePlayerIds = useMemo(
    () => new Set(settledRegs.map((r) => Number(r.player_id))),
    [settledRegs],
  );

  const availablePlayers = useMemo(
    () => players.filter((p) => !activePlayerIds.has(Number(p.id)) && p.is_active !== false),
    [players, activePlayerIds],
  );

  const selectedInList = useMemo(() => {
    const avail = new Set(availablePlayers.map((p) => Number(p.id)));
    return selectedPlayerIds.filter((id) => avail.has(id));
  }, [selectedPlayerIds, availablePlayers]);

  const placedPlayerIds = useMemo(() => {
    const s = new Set<number>();
    for (const m of bracket) {
      if (m.player1_id) s.add(Number(m.player1_id));
      if (m.player2_id) s.add(Number(m.player2_id));
    }
    return s;
  }, [bracket]);

  const pickablePlayers = useMemo(
    () =>
      settledRegs.filter((r) => {
        const pid = Number(r.player_id);
        if (!picking) return true;
        return !placedPlayerIds.has(pid) || true; // اجازه جابجایی با پاک کردن قبلی
      }),
    [settledRegs, picking, placedPlayerIds],
  );

  const groupMatches = useMemo(
    () => bracket.filter((m) => (m.phase || "knockout") === "group"),
    [bracket],
  );
  const knockoutMatches = useMemo(
    () => bracket.filter((m) => (m.phase || "knockout") === "knockout"),
    [bracket],
  );

  const knockoutByRound = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const m of knockoutMatches) {
      const arr = map.get(m.round) || [];
      arr.push(m);
      map.set(m.round, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [knockoutMatches]);

  const isGroupFormat = tournament?.format === "group_then_elimination";

  async function saveFormat(format: string) {
    setBusy("format");
    setMsg("");
    try {
      await apiFetch(`/admin/tournaments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ format }),
      });
      setMsg(format === "group_then_elimination" ? "فرمت: گروهی سپس حذفی" : "فرمت: حذفی");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function buildKnockout(size?: number, afterGroups = false) {
    setBusy("bracket");
    setMsg("");
    try {
      const res = await apiFetch<{ bracket: any[] }>(`/admin/tournaments/${id}/bracket`, {
        method: "POST",
        body: JSON.stringify({
          bracket_size: size || Number(bracketSize),
          phase: afterGroups ? "after_groups" : "knockout",
        }),
      });
      setBracket(res.bracket || []);
      setMsg("جدول حذفی خالی ساخته شد — روی جایگاه‌ها کلیک کنید و بازیکن بگذارید.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function assignSlot(matchId: number, slot: 1 | 2, playerId: number | null) {
    setBusy(`slot-${matchId}-${slot}`);
    try {
      await apiFetch(`/admin/matches/${matchId}/slot`, {
        method: "PATCH",
        body: JSON.stringify({ slot, player_id: playerId }),
      });
      setPicking(null);
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
    const resolvedDate = date || defaultScheduleDate || "";
    const resolvedTime = time || defaultScheduleTime || "";
    if (resolvedDate) {
      writeScheduleDefault(BILLIARD_LS_DATE, resolvedDate);
      setDefaultScheduleDate(resolvedDate);
    }
    if (resolvedTime) {
      writeScheduleDefault(BILLIARD_LS_TIME, resolvedTime);
      setDefaultScheduleTime(resolvedTime);
    }
    try {
      await apiFetch(`/admin/matches/${matchId}/schedule`, {
        method: "PATCH",
        body: JSON.stringify({
          table_id: tableId ? Number(tableId) : null,
          scheduled_on: resolvedDate || null,
          scheduled_at: resolvedTime ? timeForApi(resolvedTime) : null,
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

  function togglePlayerSelect(pid: number) {
    setSelectedPlayerIds((prev) =>
      prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid],
    );
  }

  function selectAllAvailable() {
    setSelectedPlayerIds(availablePlayers.map((p) => Number(p.id)));
  }

  function clearPlayerSelection() {
    setSelectedPlayerIds([]);
  }

  async function addPlayersBulk() {
    const ids = selectedInList;
    if (!ids.length) {
      setMsg("حداقل یک بازیکن را انتخاب کنید.");
      return;
    }
    setBusy("add-players");
    setMsg("");
    try {
      const res = await apiFetch<{
        message?: string;
        added_count?: number;
        skipped_count?: number;
        errors?: string[];
      }>(`/admin/tournaments/${id}/registrations/bulk`, {
        method: "POST",
        body: JSON.stringify({
          player_ids: ids,
          waive_fee: waiveFee,
        }),
      });
      setSelectedPlayerIds([]);
      const extra =
        res.errors && res.errors.length
          ? "\n" + res.errors.slice(0, 5).join("\n")
          : "";
      setMsg((res.message || "بازیکنان اضافه شدند.") + extra);
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا در افزودن بازیکنان");
    } finally {
      setBusy(null);
    }
  }

  function toApiSlot(s: SlotDraft) {
    if (s.type === "empty") return { type: "empty" };
    if (s.type === "source") {
      return {
        type: "source",
        match_id: Number(s.match_id),
        outcome: s.outcome,
      };
    }
    return {
      type: "player",
      player_id: s.player_id ? Number(s.player_id) : null,
    };
  }

  async function saveGroupMatch() {
    setBusy("group-match");
    setMsg("");
    try {
      const res = await apiFetch<{ bracket: any[] }>(`/admin/tournaments/${id}/group-matches`, {
        method: "POST",
        body: JSON.stringify({
          group_code: groupForm.group_code,
          position: Number(groupForm.position),
          slot1: toApiSlot(groupForm.slot1),
          slot2: toApiSlot(groupForm.slot2),
        }),
      });
      setBracket(res.bracket || []);
      setGroupForm((f) => ({
        ...f,
        position: String(Number(f.position) + 1),
        slot1: emptySlot(),
        slot2: emptySlot(),
      }));
      setMsg("بازی گروهی ذخیره شد.");
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function deleteMatch(matchId: number) {
    if (!confirm("این بازی حذف شود؟")) return;
    setBusy(`del-${matchId}`);
    try {
      const res = await apiFetch<{ bracket: any[] }>(`/admin/matches/${matchId}`, { method: "DELETE" });
      setBracket(res.bracket || []);
      await load();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  function renderSlotEditor(key: "slot1" | "slot2", label: string) {
    const s = groupForm[key];
    return (
      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="text-xs text-slate-400">{label}</div>
        <select
          className="input"
          value={s.type}
          onChange={(e) =>
            setGroupForm({
              ...groupForm,
              [key]: { ...s, type: e.target.value as SlotDraft["type"] },
            })
          }
        >
          <option value="player">بازیکن مشخص</option>
          <option value="source">برنده / بازنده یک بازی</option>
          <option value="empty">خالی (بعداً)</option>
        </select>
        {s.type === "player" && (
          <select
            className="input"
            value={s.player_id}
            onChange={(e) => setGroupForm({ ...groupForm, [key]: { ...s, player_id: e.target.value } })}
          >
            <option value="">انتخاب بازیکن</option>
            {settledRegs.map((r) => (
              <option key={r.id} value={r.player_id}>
                {r.player?.full_name}
              </option>
            ))}
          </select>
        )}
        {s.type === "source" && (
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              className="input"
              value={s.match_id}
              onChange={(e) => setGroupForm({ ...groupForm, [key]: { ...s, match_id: e.target.value } })}
            >
              <option value="">بازی مرجع</option>
              {bracket.map((m) => (
                <option key={m.id} value={m.id}>
                  بازی {m.match_no ?? m.id}
                  {m.round_label ? ` · ${m.round_label}` : ""}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={s.outcome}
              onChange={(e) =>
                setGroupForm({
                  ...groupForm,
                  [key]: { ...s, outcome: e.target.value as "winner" | "loser" },
                })
              }
            >
              <option value="winner">برنده</option>
              <option value="loser">بازنده</option>
            </select>
          </div>
        )}
      </div>
    );
  }

  function renderMatchCard(m: any) {
    const done = m.status === "finished" || m.status === "walkover";
    const no = m.match_no ?? m.id;
    const title = m.round_label || (m.group_code ? `گروه ${m.group_code}` : `بازی ${no}`);
    return (
      <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-fuchsia-500/20 px-1.5 text-xs font-bold text-fuchsia-300">
              {no}
            </span>
            <div className="min-w-0 truncate text-[13px] font-medium text-slate-100">{title}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[10px] text-slate-500">{statusLabel[m.status] || m.status}</span>
            {!done && (m.phase === "group" || !m.player1_id || !m.player2_id) && (
              <button
                type="button"
                className="text-[10px] text-rose-300 hover:underline"
                onClick={() => deleteMatch(m.id)}
              >
                حذف
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          {([1, 2] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              disabled={done}
              onClick={() => setPicking({ matchId: m.id, slot })}
              className={`rounded-lg border px-2 py-1.5 text-right text-xs transition ${
                picking?.matchId === m.id && picking.slot === slot
                  ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:border-white/25"
              } disabled:opacity-60`}
            >
              <span className="block truncate">{slotLabel(m, slot)}</span>
            </button>
          ))}
        </div>

        <MatchScheduleFields
          tableId={m.table_id}
          scheduledOn={m.scheduled_on}
          scheduledAt={m.scheduled_at}
          tables={tables}
          defaultDate={defaultScheduleDate}
          defaultTime={defaultScheduleTime}
          disabled={done}
          onChange={({ tableId, date, time }) => saveSchedule(m.id, tableId, date, time)}
        />

        {m.player1_id && m.player2_id && !done && (
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              className="input input-sm w-14"
              placeholder="۱"
              value={scores[m.id]?.s1 ?? ""}
              onChange={(e) =>
                setScores({ ...scores, [m.id]: { s1: e.target.value, s2: scores[m.id]?.s2 || "" } })
              }
            />
            <input
              className="input input-sm w-14"
              placeholder="۲"
              value={scores[m.id]?.s2 ?? ""}
              onChange={(e) =>
                setScores({ ...scores, [m.id]: { s1: scores[m.id]?.s1 || "", s2: e.target.value } })
              }
            />
            <BilliardButton
              type="button"
              loading={busy === `result-${m.id}`}
              sx={{ minHeight: 34, py: "4px", px: 1.25, fontSize: 12 }}
              onClick={() => saveResult(m.id)}
            >
              نتیجه
            </BilliardButton>
          </div>
        )}
        {done && (
          <div className="text-xs font-display text-cyan-300">
            {m.score1} – {m.score2}
          </div>
        )}
      </div>
    );
  }

  if (!tournament) return <p className="text-slate-400">در حال بارگذاری...</p>;

  const groupCodes = Array.from({ length: Math.max(1, Number(groupCount) || 1) }, (_, i) =>
    String.fromCharCode(65 + i),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-slate-100">{tournament.name}</h1>
        <p className="text-sm text-slate-400">
          {statusLabel[tournament.status]} ·{" "}
          {isGroupFormat ? "گروهی سپس حذفی" : "حذفی"}
        </p>
      </div>
      {msg && <p className="text-sm text-cyan-300 whitespace-pre-wrap">{msg}</p>}

      {picking && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="card-soft w-full max-w-md space-y-3">
            <h3 className="font-display text-xl text-slate-100">انتخاب بازیکن برای جایگاه {picking.slot}</h3>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {pickablePlayers.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-right text-sm text-slate-200 hover:bg-white/10"
                  onClick={() => assignSlot(picking.matchId, picking.slot, Number(r.player_id))}
                >
                  {r.player?.full_name}
                </button>
              ))}
              {!pickablePlayers.length && <p className="text-sm text-slate-500">بازیکن قطعی نیست.</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <BilliardButton
                type="button"
                variant="secondary"
                onClick={() => assignSlot(picking.matchId, picking.slot, null)}
              >
                خالی کردن جایگاه
              </BilliardButton>
              <BilliardButton type="button" variant="secondary" onClick={() => setPicking(null)}>
                انصراف
              </BilliardButton>
            </div>
          </div>
        </div>
      )}

      <section className="card-soft space-y-3">
        <h2 className="font-display text-xl text-slate-100">نوع مسابقه</h2>
        <p className="text-sm text-slate-400">
          قرعه‌کشی خودکار نداریم. جدول را خالی می‌سازید و بازیکنان را دستی روی جایگاه می‌نشانید.
        </p>
        <div className="flex flex-wrap gap-2">
          <BilliardButton
            type="button"
            variant={!isGroupFormat ? "primary" : "secondary"}
            loading={busy === "format"}
            onClick={() => saveFormat("single_elimination")}
          >
            حذفی
          </BilliardButton>
          <BilliardButton
            type="button"
            variant={isGroupFormat ? "primary" : "secondary"}
            loading={busy === "format"}
            onClick={() => saveFormat("group_then_elimination")}
          >
            گروهی سپس حذفی
          </BilliardButton>
          <BilliardButton
            type="button"
            variant="secondary"
            loading={busy === "status"}
            onClick={() => setStatus("registration_closed")}
          >
            بستن ثبت‌نام
          </BilliardButton>
        </div>
      </section>

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
            ثبت‌نام‌ها ({settledRegs.length} قطعی / {regs.length} کل)
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            یک یا چند بازیکن را تیک بزنید و دسته‌جمعی به مسابقه اضافه کنید.
          </p>
        </div>

        <div>
          <label className="label">جستجوی بازیکن {playersLoading ? "(در حال جستجو...)" : ""}</label>
          <input
            className="input"
            value={playerQuery}
            onChange={(e) => setPlayerQuery(e.target.value)}
            placeholder="نام، موبایل، شهر..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BilliardButton
            type="button"
            variant="secondary"
            disabled={!availablePlayers.length}
            onClick={selectAllAvailable}
          >
            انتخاب همهٔ لیست ({availablePlayers.length})
          </BilliardButton>
          <BilliardButton
            type="button"
            variant="ghost"
            disabled={!selectedInList.length}
            onClick={clearPlayerSelection}
          >
            پاک کردن انتخاب
          </BilliardButton>
          <span className="text-xs text-slate-500">{selectedInList.length} نفر انتخاب‌شده</span>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
          {availablePlayers.map((p) => {
            const pid = Number(p.id);
            const checked = selectedInList.includes(pid);
            return (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-fuchsia-500"
                  checked={checked}
                  onChange={() => togglePlayerSelect(pid)}
                />
                <span className="min-w-0 flex-1 text-slate-200">
                  {p.full_name}
                  <span className="mr-2 text-xs text-slate-500">
                    {p.phone}
                    {p.city ? ` · ${p.city}` : ""}
                  </span>
                </span>
              </label>
            );
          })}
          {!availablePlayers.length && (
            <p className="px-3 py-4 text-sm text-slate-500">
              بازیکن قابل‌افزودنی نیست — یا همه اضافه شده‌اند یا نتیجه‌ای برای جستجو نیست.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={waiveFee}
            onChange={(e) => setWaiveFee(e.target.checked)}
            className="h-4 w-4 accent-fuchsia-500"
          />
          بدون پرداخت / رایگان ثبت شود
        </label>

        <BilliardButton
          type="button"
          loading={busy === "add-players"}
          disabled={!selectedInList.length || (busy !== null && busy !== "add-players")}
          onClick={addPlayersBulk}
        >
          افزودن {selectedInList.length ? `${selectedInList.length} بازیکن` : "بازیکنان"} به مسابقه
        </BilliardButton>

        <div className="divide-y divide-white/10 border-t border-white/10 pt-3 text-sm">
          <div className="pb-2 text-xs text-slate-500">ثبت‌نام‌های فعلی مسابقه</div>
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

      {!isGroupFormat && (
        <section className="card-soft space-y-3">
          <h2 className="font-display text-xl text-slate-100">جدول حذفی</h2>
          <p className="text-sm text-slate-400">
            تعداد جایگاه را بزنید (توان ۲). دو طرف جدول ساخته می‌شود؛ روی هر جایگاه کلیک کنید و بازیکن بگذارید.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="label">تعداد جایگاه</label>
              <select className="input w-32" value={bracketSize} onChange={(e) => setBracketSize(e.target.value)}>
                {[2, 4, 8, 16, 32, 64].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <BilliardButton type="button" loading={busy === "bracket"} onClick={() => buildKnockout(Number(bracketSize))}>
              {knockoutMatches.length ? "بازسازی جدول خالی" : "ساخت جدول حذفی"}
            </BilliardButton>
          </div>
        </section>
      )}

      {isGroupFormat && (
        <section className="card-soft space-y-4">
          <div>
            <h2 className="font-display text-xl text-slate-100">مرحله گروهی</h2>
            <p className="mt-1 text-sm text-slate-400">
              تعداد گروه را مشخص کنید، بعد برای هر گروه بازی‌ها را تعریف کنید — بازیکن با بازیکن، یا برنده/بازنده یک جایگاه دیگر.
            </p>
          </div>
          <div>
            <label className="label">تعداد گروه</label>
            <select className="input max-w-[120px]" value={groupCount} onChange={(e) => setGroupCount(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">گروه‌ها: {groupCodes.join("، ")}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label">گروه</label>
              <select
                className="input"
                value={groupForm.group_code}
                onChange={(e) => setGroupForm({ ...groupForm, group_code: e.target.value })}
              >
                {groupCodes.map((c) => (
                  <option key={c} value={c}>
                    گروه {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">شماره بازی در گروه</label>
              <input
                className="input"
                value={groupForm.position}
                onChange={(e) => setGroupForm({ ...groupForm, position: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {renderSlotEditor("slot1", "طرف اول")}
            {renderSlotEditor("slot2", "طرف دوم")}
          </div>
          <BilliardButton type="button" loading={busy === "group-match"} onClick={saveGroupMatch}>
            افزودن بازی به گروه
          </BilliardButton>

          {groupMatches.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-300">بازی‌های گروهی</h3>
              {groupMatches.map(renderMatchCard)}
            </div>
          )}

          <div className="border-t border-white/10 pt-4 space-y-3">
            <h3 className="font-display text-lg text-slate-100">مرحله حذفی بعد از گروه</h3>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="label">تعداد جایگاه حذفی</label>
                <select
                  className="input w-32"
                  value={knockoutSize}
                  onChange={(e) => setKnockoutSize(e.target.value)}
                >
                  {[2, 4, 8, 16].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <BilliardButton
                type="button"
                loading={busy === "bracket"}
                onClick={() => buildKnockout(Number(knockoutSize), true)}
              >
                ساخت جدول حذفی
              </BilliardButton>
            </div>
          </div>
        </section>
      )}

      {knockoutMatches.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-slate-100">جدول حذفی / نتایج</h2>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {knockoutByRound.map(([round, matches]) => (
                <div key={round} className="w-64 shrink-0 space-y-2 sm:w-72">
                  <div className="text-[11px] text-slate-500">{matches[0]?.round_label || `دور ${round}`}</div>
                  {matches
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map(renderMatchCard)}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!knockoutMatches.length && !groupMatches.length && (
        <p className="text-sm text-slate-500">هنوز جدولی ساخته نشده.</p>
      )}
    </div>
  );
}
