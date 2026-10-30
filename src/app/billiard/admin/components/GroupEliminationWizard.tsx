"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, type ApiError } from "@/app/lib/billiard/api";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";
import {
  BILLIARD_TIME_OPTIONS,
  MatchScheduleFields,
  fromGregorianYmd,
  timeForUi,
  toGregorianYmd,
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
    mode: "player" as "player" | "source",
    slot1: emptySlot("player"),
    slot2: emptySlot("player"),
    tableId: "",
    date: "",
    time: "",
  });

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

  function setMode(mode: "player" | "source") {
    setMatchForm((f) => ({
      ...f,
      mode,
      slot1: { ...f.slot1, type: mode },
      slot2: { ...f.slot2, type: mode },
    }));
  }

  function renderSideSelect(key: "slot1" | "slot2", placeholder: string) {
    const s = matchForm[key];
    if (matchForm.mode === "player") {
      return (
        <select
          className="input input-sm min-w-0 flex-1"
          value={s.player_id}
          onChange={(e) => setMatchForm({ ...matchForm, [key]: { ...s, player_id: e.target.value } })}
        >
          <option value="">{placeholder}</option>
          {playersInGroup.map((r) => (
            <option key={r.id} value={r.player_id}>
              {r.player?.full_name}
            </option>
          ))}
        </select>
      );
    }
    return (
      <div className="flex min-w-0 flex-1 gap-1">
        <select
          className="input input-sm w-[72px] shrink-0"
          value={s.outcome}
          onChange={(e) =>
            setMatchForm({
              ...matchForm,
              [key]: { ...s, outcome: e.target.value as "winner" | "loser" },
            })
          }
        >
          <option value="winner">برنده</option>
          <option value="loser">بازنده</option>
        </select>
        <select
          className="input input-sm min-w-0 flex-1"
          value={s.match_no}
          onChange={(e) => setMatchForm({ ...matchForm, [key]: { ...s, match_no: e.target.value } })}
        >
          <option value="">بازی</option>
          {allMatchesForSource.map((m) => (
            <option key={m.id} value={m.match_no ?? m.id}>
              #{m.match_no ?? m.id}
            </option>
          ))}
        </select>
      </div>
    );
  }

  async function saveGroupMatch() {
    setBusy("group-match");
    setMsg("");
    try {
      const res = await apiFetch<{ match: any }>(`/admin/tournaments/${tournamentId}/group-matches`, {
        method: "POST",
        body: JSON.stringify({
          group_code: activeGroup,
          position: Number(matchForm.position),
          slot1: toApiSlot({ ...matchForm.slot1, type: matchForm.mode }),
          slot2: toApiSlot({ ...matchForm.slot2, type: matchForm.mode }),
        }),
      });
      const matchId = res.match?.id;
      if (matchId && (matchForm.tableId || matchForm.date || matchForm.time)) {
        await onSchedule(
          matchId,
          matchForm.tableId,
          matchForm.date || defaultScheduleDate,
          matchForm.time || defaultScheduleTime,
        );
      }
      setMatchForm((f) => ({
        ...f,
        position: String(Number(f.position) + 1),
        slot1: emptySlot(f.mode),
        slot2: emptySlot(f.mode),
      }));
      setMsg("بازی گروهی ذخیره شد.");
      await onReload();
    } catch (err) {
      setMsg((err as ApiError).message || "خطا");
    } finally {
      setBusy(null);
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
        className="flex w-full min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1.5"
      >
        <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-fuchsia-500/20 px-1.5 text-xs font-bold text-fuchsia-300">
          {no}
        </span>
        <span className="min-w-[100px] max-w-[160px] truncate text-xs text-slate-200" title={slotText(m, 1)}>
          {slotText(m, 1)}
        </span>
        <span className="text-[10px] text-slate-600">vs</span>
        <span className="min-w-[100px] max-w-[160px] truncate text-xs text-slate-200" title={slotText(m, 2)}>
          {slotText(m, 2)}
        </span>
        <div className="min-w-0 flex-1">
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
            className="shrink-0 text-[10px] text-rose-300 hover:underline"
            onClick={() => deleteGroupMatch(m.id)}
          >
            حذف
          </button>
        )}
      </div>
    );
  }

  async function buildKnockout() {
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
            بازیکن با بازیکن، یا مثلاً بازنده بازی ۳ با برنده بازی ۲. شماره‌ها از ۱ شروع می‌شوند و با حذف بازی دوباره پشت‌سرهم می‌شوند.
          </p>

          {/* ردیف ایجاد — تمام عرض، همه در یک ردیف */}
          <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] px-2 py-2">
            <input
              className="input input-sm w-12 shrink-0"
              title="ترتیب در گروه"
              value={matchForm.position}
              onChange={(e) => setMatchForm({ ...matchForm, position: e.target.value })}
            />

            <button
              type="button"
              role="switch"
              aria-checked={matchForm.mode === "source"}
              onClick={() => setMode(matchForm.mode === "player" ? "source" : "player")}
              className={`shrink-0 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition ${
                matchForm.mode === "source"
                  ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                  : "border-white/15 bg-white/5 text-slate-300"
              }`}
              title="سوییچ بازیکن / برنده-بازنده بازی"
            >
              {matchForm.mode === "player" ? "بازیکن" : "بازی"}
            </button>

            {renderSideSelect("slot1", "بازیکن ۱")}
            <span className="shrink-0 text-[10px] text-slate-600">vs</span>
            {renderSideSelect("slot2", "بازیکن ۲")}

            <select
              className="input input-sm w-[88px] shrink-0"
              value={matchForm.tableId}
              onChange={(e) => setMatchForm({ ...matchForm, tableId: e.target.value })}
            >
              <option value="">میز</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <div className="billiard-date-picker w-[118px] shrink-0">
              <DatePicker
                value={fromGregorianYmd(matchForm.date || null)}
                calendar={persian}
                locale={persian_fa}
                calendarPosition="bottom-right"
                format="YYYY/MM/DD"
                placeholder="تاریخ"
                editable={false}
                portal
                zIndex={80}
                containerStyle={{ width: "100%" }}
                inputClass="input input-sm"
                onChange={(d) => {
                  const obj = d && !Array.isArray(d) ? (d as DateObject) : null;
                  setMatchForm({ ...matchForm, date: toGregorianYmd(obj) });
                }}
              />
            </div>

            <select
              className="input input-sm w-[84px] shrink-0"
              value={timeForUi(matchForm.time) || matchForm.time}
              onChange={(e) => setMatchForm({ ...matchForm, time: e.target.value })}
            >
              <option value="">ساعت</option>
              {BILLIARD_TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <BilliardButton
              type="button"
              loading={busy === "group-match"}
              sx={{ minHeight: 34, py: "4px", px: 1.5, fontSize: 12 }}
              onClick={saveGroupMatch}
            >
              ثبت
            </BilliardButton>
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

      {/* ۴. جدول حذفی درختی */}
      <section className="card-soft space-y-4">
        <div>
          <h2 className="font-display text-xl text-slate-100">۴) جدول حذفی (دو طرفه)</h2>
          <p className="mt-1 text-sm text-slate-400">
            اندازه جدول را بسازید، بعد برای هر جایگاه دور اول بگویید برنده کدام بازی می‌نشیند؛ بقیه درخت تا فینال خودکار چیده می‌شود.
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
          <BilliardButton type="button" loading={busy === "bracket"} onClick={buildKnockout}>
            {knockoutMatches.length ? "بازسازی جدول حذفی" : "ساخت جدول حذفی"}
          </BilliardButton>
        </div>

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
      </section>
    </div>
  );
}
