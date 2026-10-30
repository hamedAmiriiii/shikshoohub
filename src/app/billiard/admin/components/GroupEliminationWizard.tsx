"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";
import {
  BILLIARD_LS_DATE,
  BILLIARD_LS_TIME,
  BILLIARD_TIME_OPTIONS,
  MatchScheduleFields,
  fromGregorianYmd,
  timeForApi,
  timeForUi,
  toAsciiDigits,
  toGregorianYmd,
  writeScheduleDefault,
} from "@/app/billiard/admin/components/MatchScheduleFields";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

type SlotDraft = {
  type: "player" | "source";
  player_id: string;
  match_no: string;
  outcome: "winner" | "loser";
};

const emptySlot = (type: "player" | "source" = "player"): SlotDraft => ({
  type,
  player_id: "",
  match_no: "",
  outcome: "winner",
});

function toApiSlot(s: SlotDraft) {
  if (s.type === "source") {
    return { type: "source", match_no: Number(s.match_no), outcome: s.outcome };
  }
  return { type: "player", player_id: s.player_id ? Number(s.player_id) : null };
}

function slotText(m: any, side: 1 | 2) {
  const p = side === 1 ? m.player1 : m.player2;
  const src = side === 1 ? m.player1_source : m.player2_source;
  if (p?.full_name) return p.full_name;
  if (src?.label) return src.label;
  return "خالی";
}

type Props = {
  tournamentId: string;
  tournament: any;
  regs: any[];
  bracket: any[];
  tables: any[];
  defaultScheduleDate: string;
  defaultScheduleTime: string;
  onSchedule: (matchId: number, tableId: string, date: string, time: string) => Promise<void>;
  onResult: (matchId: number) => void;
  scores: Record<number, { s1: string; s2: string }>;
  setScores: (fn: any) => void;
  busy: string | null;
  setBusy: (v: string | null) => void;
  setMsg: (v: string) => void;
  onReload: () => Promise<void>;
  renderMatchCard: (m: any) => ReactNode;
};

export function GroupEliminationWizard({
  tournamentId,
  tournament,
  regs,
  bracket,
  tables,
  defaultScheduleDate,
  defaultScheduleTime,
  onSchedule,
  onResult,
  scores,
  setScores,
  busy,
  setBusy,
  setMsg,
  onReload,
  renderMatchCard,
}: Props) {
  const settled = useMemo(
    () => regs.filter((r) => r.status === "confirmed" && (r.payment_status === "paid" || r.payment_status === "waived")),
    [regs],
  );

  const [groupCount, setGroupCount] = useState(() => String(tournament?.group_count || 2));
  const [activeGroup, setActiveGroup] = useState("A");
  const [selectedInGroup, setSelectedInGroup] = useState<number[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [knockoutSize, setKnockoutSize] = useState("8");
  const [matchForm, setMatchForm] = useState({
    position: "1",
    slot1: emptySlot("player"),
    slot2: emptySlot("player"),
    tableId: "",
    date: "",
    time: "",
  });
  const [formNote, setFormNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const formDateValue = useMemo(() => fromGregorianYmd(matchForm.date || null), [matchForm.date]);

  useEffect(() => {
    setMatchForm((f) => ({
      ...f,
      date: f.date || defaultScheduleDate || "",
      time: f.time || defaultScheduleTime || "",
    }));
  }, [defaultScheduleDate, defaultScheduleTime]);

  useEffect(() => {
    if (tournament?.group_count) {
      setGroupCount(String(tournament.group_count));
    }
  }, [tournament?.group_count]);

  useEffect(() => {
    const ids = settled.filter((r) => (r.group_code || "") === activeGroup).map((r) => Number(r.player_id));
    setSelectedInGroup(ids);
  }, [settled, activeGroup]);

  const groupCodes = useMemo(
    () => Array.from({ length: Math.max(1, Number(groupCount) || 1) }, (_, i) => String.fromCharCode(65 + i)),
    [groupCount],
  );

  const groupMatches = useMemo(
    () => bracket.filter((m) => (m.phase || "") === "group"),
    [bracket],
  );
  const knockoutMatches = useMemo(
    () => bracket.filter((m) => (m.phase || "knockout") === "knockout"),
    [bracket],
  );
  const round1Knockout = useMemo(
    () =>
      knockoutMatches
        .filter((m) => Number(m.round) === 1)
        .slice()
        .sort((a, b) => a.position - b.position),
    [knockoutMatches],
  );

  const playersInGroup = useMemo(
    () => settled.filter((r) => (r.group_code || "") === activeGroup),
    [settled, activeGroup],
  );
  const unassigned = useMemo(
    () => settled.filter((r) => !r.group_code),
    [settled],
  );

  const filteredSettled = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    if (!q) return settled;
    return settled.filter((r) => {
      const name = String(r.player?.full_name || "").toLowerCase();
      const phone = String(r.player?.phone || "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [settled, playerSearch]);

  /** بالای لیست: قابل‌انتخاب · پایین: انتخاب‌شده یا عضو گروه دیگر (غیر فعال) */
  const { availablePlayers, lockedPlayers } = useMemo(() => {
    const available: typeof settled = [];
    const locked: typeof settled = [];
    for (const r of filteredSettled) {
      const pid = Number(r.player_id);
      const inOther = !!(r.group_code && r.group_code !== activeGroup);
      const selected = selectedInGroup.includes(pid);
      if (inOther || selected) locked.push(r);
      else available.push(r);
    }
    locked.sort((a, b) => {
      const aSel = selectedInGroup.includes(Number(a.player_id)) ? 0 : 1;
      const bSel = selectedInGroup.includes(Number(b.player_id)) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return String(a.player?.full_name || "").localeCompare(String(b.player?.full_name || ""), "fa");
    });
    available.sort((a, b) =>
      String(a.player?.full_name || "").localeCompare(String(b.player?.full_name || ""), "fa"),
    );
    return { availablePlayers: available, lockedPlayers: locked };
  }, [filteredSettled, activeGroup, selectedInGroup]);

  const allMatchesForSource = useMemo(
    () => [...bracket].sort((a, b) => (a.match_no || 0) - (b.match_no || 0)),
    [bracket],
  );

  async function saveGroupCount() {
    setBusy("groups");
    setMsg("");
    try {
      await apiFetch(`/admin/tournaments/${tournamentId}/groups`, {
        method: "PUT",
        body: JSON.stringify({ group_count: Number(groupCount) }),
      });
      setActiveGroup("A");
      setMsg(`تعداد گروه‌ها: ${groupCount}`);
      await onReload();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  function openGroupEditor(code: string) {
    setActiveGroup(code);
    setPlayerSearch("");
  }

  function toggleInGroup(pid: number) {
    setSelectedInGroup((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]));
  }

  function renderPlayerRow(r: any, locked: boolean) {
    const pid = Number(r.player_id);
    const inOther = !!(r.group_code && r.group_code !== activeGroup);
    const checked = selectedInGroup.includes(pid);
    return (
      <label
        key={r.id}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
          locked ? "opacity-40" : "cursor-pointer hover:bg-white/5"
        }`}
      >
        <input
          type="checkbox"
          className="h-4 w-4 accent-fuchsia-500"
          disabled={inOther}
          checked={checked || inOther}
          onChange={() => {
            if (!inOther) toggleInGroup(pid);
          }}
        />
        <span className="min-w-0 flex-1 text-slate-200">
          {r.player?.full_name}
          {r.player?.phone ? (
            <span className="mr-2 text-xs text-slate-500">{r.player.phone}</span>
          ) : null}
        </span>
        {inOther && <span className="shrink-0 text-[10px] text-slate-500">گروه {r.group_code}</span>}
        {!inOther && checked && locked && (
          <span className="shrink-0 text-[10px] text-slate-500">گروه {activeGroup}</span>
        )}
      </label>
    );
  }

  async function saveGroupPlayers() {
    setBusy("group-players");
    setMsg("");
    try {
      await apiFetch(`/admin/tournaments/${tournamentId}/group-players`, {
        method: "PUT",
        body: JSON.stringify({ group_code: activeGroup, player_ids: selectedInGroup }),
      });
      setMsg(`اعضای گروه ${activeGroup} ذخیره شد.`);
      await onReload();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  function setSlotType(key: "slot1" | "slot2", type: "player" | "source") {
    setMatchForm((f) => ({
      ...f,
      [key]: {
        ...f[key],
        type,
        player_id: type === "player" ? f[key].player_id : "",
        match_no: type === "source" ? f[key].match_no : "",
        outcome: f[key].outcome || "winner",
      },
    }));
  }

  /** هر طرف: نوع (بازیکن/بازی) + در حالت بازی: شماره بازی و برنده/بازنده */
  function renderSideSelect(key: "slot1" | "slot2", label: string) {
    const s = matchForm[key];
    return (
      <div className="grid min-w-0 grid-cols-[5.5rem_1fr] gap-1 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
        <select
          className="input input-sm"
          value={s.type}
          title={label}
          onChange={(e) => setSlotType(key, e.target.value as "player" | "source")}
        >
          <option value="player">بازیکن</option>
          <option value="source">بازی</option>
        </select>

        {s.type === "player" ? (
          <select
            className="input input-sm min-w-0 sm:col-span-2"
            value={s.player_id}
            onChange={(e) =>
              setMatchForm((f) => ({ ...f, [key]: { ...f[key], player_id: e.target.value } }))
            }
          >
            <option value="">{label}</option>
            {playersInGroup.map((r) => (
              <option key={r.id} value={r.player_id}>
                {r.player?.full_name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <select
              className="input input-sm min-w-0"
              value={s.match_no}
              title="شماره بازی"
              onChange={(e) =>
                setMatchForm((f) => ({ ...f, [key]: { ...f[key], match_no: e.target.value } }))
              }
            >
              <option value="">شماره بازی</option>
              {allMatchesForSource.map((m) => (
                <option key={m.id} value={m.match_no ?? m.id}>
                  بازی {m.match_no ?? m.id}
                  {m.group_code ? ` · گ${m.group_code}` : ""}
                </option>
              ))}
            </select>
            <select
              className="input input-sm col-span-2 sm:col-span-1"
              value={s.outcome}
              title="برنده یا بازنده"
              onChange={(e) =>
                setMatchForm((f) => ({
                  ...f,
                  [key]: { ...f[key], outcome: e.target.value as "winner" | "loser" },
                }))
              }
            >
              <option value="winner">برنده</option>
              <option value="loser">بازنده</option>
            </select>
          </>
        )}
      </div>
    );
  }

  function noteError(text: string) {
    setFormNote({ kind: "err", text });
    setMsg(text);
  }

  async function saveGroupMatch() {
    setFormNote(null);
    setMsg("");
    if (busy) {
      noteError("یک عملیات دیگر در حال انجام است. چند لحظه صبر کنید.");
      return;
    }
    const pos = Number(matchForm.position);
    if (!Number.isFinite(pos) || pos < 1) {
      noteError("ترتیب بازی را درست وارد کنید.");
      return;
    }
    for (const [key, label] of [
      ["slot1", "طرف ۱"],
      ["slot2", "طرف ۲"],
    ] as const) {
      const s = matchForm[key];
      if (s.type === "player" && !s.player_id) {
        noteError(`برای ${label} بازیکن را انتخاب کنید.`);
        return;
      }
      if (s.type === "source" && !s.match_no) {
        noteError(`برای ${label} شماره بازی و برنده/بازنده را مشخص کنید.`);
        return;
      }
    }
    setBusy("group-match");
    const date = toAsciiDigits(matchForm.date || defaultScheduleDate || "");
    const time = matchForm.time || defaultScheduleTime || "";
    const tableId = matchForm.tableId || "";
    try {
      const res = await apiFetch<{ match: any }>(`/admin/tournaments/${tournamentId}/group-matches`, {
        method: "POST",
        body: JSON.stringify({
          group_code: activeGroup,
          position: pos,
          slot1: toApiSlot(matchForm.slot1),
          slot2: toApiSlot(matchForm.slot2),
          table_id: tableId ? Number(tableId) : null,
          scheduled_on: date || null,
          scheduled_at: time ? timeForApi(time) : null,
        }),
      });
      if (date) writeScheduleDefault(BILLIARD_LS_DATE, date);
      if (time) writeScheduleDefault(BILLIARD_LS_TIME, time);
      const savedNo = res.match?.match_no;
      const savedPos = res.match?.position ?? pos + 1;
      setMatchForm((f) => ({
        ...f,
        position: String(Number(savedPos) + 1),
        slot1: emptySlot(f.slot1.type),
        slot2: emptySlot(f.slot2.type),
        tableId,
        date,
        time,
      }));
      const ok = savedNo ? `بازی ${savedNo} ثبت شد.` : "بازی گروهی ثبت شد.";
      setFormNote({ kind: "ok", text: ok });
      setMsg(ok);
    } catch (err) {
      noteError((err as ApiError).message || "خطا در ثبت بازی");
      return;
    } finally {
      setBusy(null);
    }
    try {
      await onReload();
    } catch (err) {
      noteError((err as ApiError).message || "بازی ثبت شد ولی لیست تازه نشد. صفحه را دوباره باز کنید.");
    }
  }

  async function deleteGroupMatch(matchId: number) {
    if (!confirm("این بازی حذف شود؟")) return;
    setBusy(`del-${matchId}`);
    try {
      await apiFetch(`/admin/matches/${matchId}`, { method: "DELETE" });
      await onReload();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  function renderGroupMatchRow(m: any) {
    const done = m.status === "finished" || m.status === "walkover";
    const no = m.match_no ?? m.id;
    const canResult = !!m.player1_id && !!m.player2_id && !done;
    return (
      <div
        key={m.id}
        className="grid w-full min-w-0 grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-fuchsia-500/20 px-1.5 text-xs font-bold text-fuchsia-300">
            {no}
          </span>
          <div className="min-w-0 text-xs text-slate-200">
            <div className="truncate" title={slotText(m, 1)}>
              {slotText(m, 1)}
            </div>
            <div className="text-[10px] text-slate-600">vs</div>
            <div className="truncate" title={slotText(m, 2)}>
              {slotText(m, 2)}
            </div>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden">
          <MatchScheduleFields
            tableId={m.table_id}
            scheduledOn={m.scheduled_on}
            scheduledAt={m.scheduled_at}
            tables={tables}
            defaultDate={defaultScheduleDate}
            defaultTime={defaultScheduleTime}
            disabled={done}
            onChange={({ tableId, date, time }) => onSchedule(m.id, tableId, date, time)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {canResult && (
            <>
              <input
                className="input input-sm w-12"
                placeholder="۱"
                value={scores[m.id]?.s1 ?? ""}
                onChange={(e) =>
                  setScores((prev: Record<number, { s1: string; s2: string }>) => ({
                    ...prev,
                    [m.id]: { s1: e.target.value, s2: prev[m.id]?.s2 || "" },
                  }))
                }
              />
              <input
                className="input input-sm w-12"
                placeholder="۲"
                value={scores[m.id]?.s2 ?? ""}
                onChange={(e) =>
                  setScores((prev: Record<number, { s1: string; s2: string }>) => ({
                    ...prev,
                    [m.id]: { s1: prev[m.id]?.s1 || "", s2: e.target.value },
                  }))
                }
              />
              <BilliardButton
                type="button"
                loading={busy === `result-${m.id}`}
                sx={{ minHeight: 34, py: "4px", px: 1.25, fontSize: 12 }}
                onClick={() => onResult(m.id)}
              >
                نتیجه
              </BilliardButton>
            </>
          )}
          {done && (
            <span className="text-xs font-display text-cyan-300">
              {m.score1} – {m.score2}
            </span>
          )}
          {!done && (
            <button
              type="button"
              className="text-[10px] text-rose-300 hover:underline"
              onClick={() => deleteGroupMatch(m.id)}
            >
              حذف
            </button>
          )}
        </div>
      </div>
    );
  }

  async function buildKnockout() {
    if (!groupMatches.length) {
      setMsg("اول بازی‌های گروهی را کامل کنید، بعد جدول حذفی را بسازید.");
      return;
    }
    if (
      knockoutMatches.length &&
      !confirm("جدول حذفی فعلی پاک و دوباره ساخته می‌شود. ادامه؟")
    ) {
      return;
    }
    setBusy("bracket");
    setMsg("");
    try {
      await apiFetch(`/admin/tournaments/${tournamentId}/bracket`, {
        method: "POST",
        body: JSON.stringify({
          bracket_size: Number(knockoutSize),
          phase: "after_groups",
        }),
      });
      setMsg("جدول حذفی ساخته شد — برای هر جایگاه دور اول، برنده کدام بازی را مشخص کنید.");
      await onReload();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  async function setKnockoutSource(matchId: number, slot: 1 | 2, matchNo: string) {
    setBusy(`ko-slot-${matchId}-${slot}`);
    try {
      if (!matchNo) {
        await apiFetch(`/admin/matches/${matchId}/slot`, {
          method: "PATCH",
          body: JSON.stringify({ slot, type: "empty" }),
        });
      } else {
        await apiFetch(`/admin/matches/${matchId}/slot`, {
          method: "PATCH",
          body: JSON.stringify({
            slot,
            type: "source",
            match_no: Number(matchNo),
            outcome: "winner",
          }),
        });
      }
      await onReload();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
    }
  }

  const leftHalf = round1Knockout.slice(0, Math.ceil(round1Knockout.length / 2));
  const rightHalf = round1Knockout.slice(Math.ceil(round1Knockout.length / 2));

  function renderKoSlotSelect(m: any, slot: 1 | 2) {
    const src = slot === 1 ? m.player1_source : m.player2_source;
    const current = src?.match_no ? String(src.match_no) : "";
    return (
      <select
        className="input input-sm"
        value={current}
        disabled={busy !== null}
        onChange={(e) => setKnockoutSource(m.id, slot, e.target.value)}
      >
        <option value="">جایگاه {slot} — انتخاب برنده بازی</option>
        {groupMatches.map((gm) => (
          <option key={gm.id} value={gm.match_no ?? gm.id}>
            برنده بازی {gm.match_no ?? gm.id}
          </option>
        ))}
        {allMatchesForSource
          .filter((x) => (x.phase || "") !== "group")
          .map((gm) => (
            <option key={`k-${gm.id}`} value={gm.match_no ?? gm.id}>
              برنده بازی {gm.match_no ?? gm.id}
            </option>
          ))}
      </select>
    );
  }

  function renderKoSide(matches: any[], title: string) {
    return (
      <div className="min-w-[260px] flex-1 space-y-2">
        <div className="text-xs text-slate-500">{title}</div>
        {matches.map((m) => (
          <div key={m.id} className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-fuchsia-500/20 px-1.5 font-bold text-fuchsia-300">
                {m.match_no ?? m.id}
              </span>
              <span className="text-slate-400">{m.round_label}</span>
            </div>
            {renderKoSlotSelect(m, 1)}
            <div className="text-center text-[10px] text-slate-600">vs</div>
            {renderKoSlotSelect(m, 2)}
            <div className="text-[11px] text-slate-500">
              {slotText(m, 1)} — {slotText(m, 2)}
            </div>
            <MatchScheduleFields
              tableId={m.table_id}
              scheduledOn={m.scheduled_on}
              scheduledAt={m.scheduled_at}
              tables={tables}
              defaultDate={defaultScheduleDate}
              defaultTime={defaultScheduleTime}
              onChange={({ tableId, date, time }) => onSchedule(m.id, tableId, date, time)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ۱. تعداد گروه */}
      <section className="card-soft space-y-3">
        <h2 className="font-display text-xl text-slate-100">۱) تعداد گروه‌ها</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label">چند گروه؟</label>
            <select className="input w-28" value={groupCount} onChange={(e) => setGroupCount(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <BilliardButton type="button" loading={busy === "groups"} onClick={saveGroupCount}>
            ذخیره تعداد گروه
          </BilliardButton>
        </div>
        <p className="text-xs text-slate-500">گروه‌ها: {groupCodes.join("، ")}</p>
      </section>

      {/* ۲. اعضای هر گروه */}
      <section className="card-soft space-y-3">
        <h2 className="font-display text-xl text-slate-100">۲) بازیکنان هر گروه</h2>
        <div className="flex flex-wrap gap-2">
          {groupCodes.map((c) => {
            const count = settled.filter((r) => (r.group_code || "") === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => openGroupEditor(c)}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  activeGroup === c
                    ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                گروه {c}
                <span className="mr-2 text-xs text-slate-500">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-2 text-sm text-slate-300">اعضای گروه {activeGroup}</div>
          <input
            className="input mb-3"
            placeholder="جستجوی نام یا موبایل..."
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
          />
          <div className="mb-3 max-h-64 space-y-1 overflow-y-auto">
            {availablePlayers.map((r) => renderPlayerRow(r, false))}
            {lockedPlayers.length > 0 && availablePlayers.length > 0 && (
              <div className="my-2 border-t border-white/10 pt-2 text-[10px] text-slate-600">
                انتخاب‌شده / گروه دیگر
              </div>
            )}
            {lockedPlayers.map((r) => renderPlayerRow(r, true))}
            {!settled.length && (
              <p className="text-sm text-slate-500">اول بازیکن به مسابقه اضافه کنید.</p>
            )}
            {!!settled.length && !filteredSettled.length && (
              <p className="text-sm text-slate-500">نتیجه‌ای برای «{playerSearch}» نیست.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BilliardButton type="button" loading={busy === "group-players"} onClick={saveGroupPlayers}>
              ذخیره اعضای گروه {activeGroup}
            </BilliardButton>
            <span className="text-xs text-slate-500">
              انتخاب‌شده: {selectedInGroup.length} · بدون گروه: {unassigned.length}
            </span>
          </div>
        </div>
      </section>

      {/* ۳. بازی‌های گروهی */}
      <section className="w-full space-y-3">
        <div className="card-soft space-y-2 !p-3 sm:!p-4">
          <h2 className="font-display text-xl text-slate-100">۳) بازی‌های گروه {activeGroup}</h2>
          <p className="text-sm text-slate-400">
            برای هر طرف: بازیکن یا بازی — اگر بازی، شماره بازی + برنده/بازنده را انتخاب کنید.
          </p>

          <div className="w-full min-w-0 space-y-2 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] p-2.5">
            <div className="grid w-full min-w-0 gap-2 lg:grid-cols-2">
              <div className="min-w-0 space-y-1">
                <div className="text-[10px] text-slate-500">طرف ۱</div>
                {renderSideSelect("slot1", "طرف ۱")}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="text-[10px] text-slate-500">طرف ۲</div>
                {renderSideSelect("slot2", "طرف ۲")}
              </div>
            </div>

            <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[4.5rem_1fr_7.5rem_6rem_auto]">
              <input
                className="input input-sm"
                title="ترتیب در گروه"
                placeholder="#"
                value={matchForm.position}
                onChange={(e) => setMatchForm((f) => ({ ...f, position: e.target.value }))}
              />
              <select
                className="input input-sm min-w-0"
                value={matchForm.tableId}
                onChange={(e) => setMatchForm((f) => ({ ...f, tableId: e.target.value }))}
              >
                <option value="">میز</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="billiard-date-picker min-w-[8.5rem]">
                <DatePicker
                  value={formDateValue}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  format="YYYY/MM/DD"
                  placeholder="تاریخ"
                  editable={false}
                  portal
                  zIndex={400}
                  containerStyle={{ width: "100%" }}
                  inputClass="input input-sm"
                  onChange={(d) => {
                    const ymd = toGregorianYmd(d as DateObject | DateObject[] | null);
                    setMatchForm((f) => ({ ...f, date: ymd }));
                    if (!ymd && d) setFormNote({ kind: "err", text: "تاریخ انتخاب نشد. دوباره انتخاب کنید." });
                  }}
                />
              </div>
              <select
                className="input input-sm min-w-0"
                value={timeForUi(matchForm.time) || matchForm.time}
                onChange={(e) => setMatchForm((f) => ({ ...f, time: e.target.value }))}
              >
                <option value="">ساعت</option>
                {BILLIARD_TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                <BilliardButton
                  type="button"
                  loading={busy === "group-match"}
                  disabled={busy !== null && busy !== "group-match"}
                  sx={{ minHeight: 34, py: "4px", px: 1.5, fontSize: 12, width: "100%" }}
                  onClick={() => {
                    void saveGroupMatch();
                  }}
                >
                  ثبت
                </BilliardButton>
              </div>
            </div>
            {formNote && (
              <p className={`text-sm ${formNote.kind === "err" ? "text-rose-300" : "text-cyan-300"}`}>
                {formNote.text}
              </p>
            )}
          </div>
        </div>

        <div className="w-full space-y-1.5">
          {groupMatches
            .filter((m) => (m.group_code || "") === activeGroup)
            .map(renderGroupMatchRow)}
          {!groupMatches.filter((m) => (m.group_code || "") === activeGroup).length && (
            <p className="px-1 text-sm text-slate-500">هنوز بازی‌ای در این گروه نیست.</p>
          )}
        </div>

        {groupMatches.filter((m) => (m.group_code || "") !== activeGroup).length > 0 && (
          <div className="w-full space-y-1.5 border-t border-white/10 pt-3">
            <div className="px-1 text-xs text-slate-500">سایر گروه‌ها</div>
            {groupMatches
              .filter((m) => (m.group_code || "") !== activeGroup)
              .map(renderGroupMatchRow)}
          </div>
        )}
      </section>

      {/* ۴. جدول حذفی — فقط بعد از بازی‌های گروهی و با دکمه ایجاد */}
      <section className="card-soft space-y-4">
        <div>
          <h2 className="font-display text-xl text-slate-100">۴) جدول حذفی (دو طرفه)</h2>
          <p className="mt-1 text-sm text-slate-400">
            اول همه بازی‌های گروهی را بسازید. با زدن «ایجاد جدول حذفی» شماره‌های حذفی بعد از بازی‌های گروهی اختصاص می‌یابد.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="label">اندازه جدول</label>
            <select className="input w-36" value={knockoutSize} onChange={(e) => setKnockoutSize(e.target.value)}>
              {[8, 16, 32, 64, 128].map((n) => (
                <option key={n} value={n}>
                  {n} نفره
                </option>
              ))}
            </select>
          </div>
          <BilliardButton
            type="button"
            loading={busy === "bracket"}
            disabled={!groupMatches.length || busy !== null}
            onClick={buildKnockout}
          >
            {knockoutMatches.length ? "بازسازی جدول حذفی" : "ایجاد جدول حذفی"}
          </BilliardButton>
          {!groupMatches.length && (
            <span className="text-xs text-amber-300/90">هنوز بازی گروهی ندارید.</span>
          )}
        </div>

        {!knockoutMatches.length ? (
          <p className="text-sm text-slate-500">
            جدول حذفی هنوز ساخته نشده — شماره‌ای برای حذفی رزرو نمی‌شود تا دکمه ایجاد را بزنید.
          </p>
        ) : (
          <>
            {round1Knockout.length > 0 && (
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-6">
                  {renderKoSide(leftHalf, "سمت راست جدول")}
                  <div className="flex w-16 shrink-0 items-center justify-center text-xs text-slate-600">فینال ←</div>
                  {renderKoSide(rightHalf, "سمت چپ جدول")}
                </div>
              </div>
            )}

            {knockoutMatches.filter((m) => Number(m.round) > 1).length > 0 && (
              <div className="space-y-3 border-t border-white/10 pt-3">
                <div className="text-sm text-slate-400">ادامه جدول — هر جایگاه برنده بازی قبلی است</div>
                {Array.from(
                  knockoutMatches
                    .filter((m) => Number(m.round) > 1)
                    .reduce((map, m) => {
                      const r = Number(m.round);
                      const arr = map.get(r) || [];
                      arr.push(m);
                      map.set(r, arr);
                      return map;
                    }, new Map<number, any[]>()),
                )
                  .sort((a, b) => a[0] - b[0])
                  .map(([round, matches]) => (
                    <div key={round} className="space-y-2">
                      <div className="text-[11px] text-slate-500">{matches[0]?.round_label || `دور ${round}`}</div>
                      {matches
                        .slice()
                        .sort((a, b) => a.position - b.position)
                        .map(renderMatchCard)}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
