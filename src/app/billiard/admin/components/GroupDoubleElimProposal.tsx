"use client";

import { useMemo, useState } from "react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { BilliardButton } from "@/app/billiard/components/BilliardButton";
import {
  BILLIARD_TIME_OPTIONS,
  fromGregorianYmd,
  timeForUi,
  toGregorianYmd,
} from "@/app/billiard/admin/components/MatchScheduleFields";
import {
  buildGroupDoubleElimination,
  deSlotText,
  type DeMatch,
} from "@/app/billiard/admin/lib/groupDoubleElimination";

type Player = { id: number; name: string };

type RowTime = { date: string; time: string };

export function GroupDoubleElimProposal({
  groupCode,
  players,
  defaultDate,
  defaultTime,
  busy,
  onClose,
  onConfirm,
}: {
  groupCode: string;
  players: Player[];
  defaultDate: string;
  defaultTime: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (matches: DeMatch[], rows: RowTime[]) => Promise<void>;
}) {
  const [order, setOrder] = useState(players);
  const names = useMemo(() => new Map(order.map((player) => [player.id, player.name])), [order]);
  const matches = useMemo(
    () => buildGroupDoubleElimination(order.map((player) => player.id)),
    [order],
  );
  const [rows, setRows] = useState<RowTime[]>(() =>
    matches.map(() => ({ date: defaultDate || "", time: defaultTime || "" })),
  );
  const [bulkDate, setBulkDate] = useState(defaultDate || "");
  const [bulkTime, setBulkTime] = useState(defaultTime || "");
  const [error, setError] = useState("");

  function movePlayer(index: number, direction: -1 | 1) {
    setOrder((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = prev.slice();
      const current = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = current;
      return next;
    });
  }

  function patchRow(index: number, patch: Partial<RowTime>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function applyBulk() {
    if (!bulkDate && !bulkTime) return;
    setRows((prev) =>
      prev.map((row) => ({
        date: bulkDate || row.date,
        time: bulkTime || row.time,
      })),
    );
  }

  async function confirm() {
    const missing = rows.findIndex((row) => !row.date || !row.time);
    if (missing >= 0) {
      setError(`تاریخ و ساعت ردیف ${missing + 1} را وارد کنید.`);
      return;
    }
    setError("");
    await onConfirm(matches, rows);
  }

  const winnerRows = matches
    .map((match, index) => ({ match, index }))
    .filter((row) => row.match.side === "winners");
  const loserRows = matches
    .map((match, index) => ({ match, index }))
    .filter((row) => row.match.side === "losers");

  return (
    <div className="space-y-3 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/[0.05] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-slate-100">پیشنهاد دوحذفی گروه {groupCode}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {order.length} بازیکن، {matches.length} بازی. استراحت به نفرهای آخر هر نیمه می‌رسد. شمارهٔ قطعی بعد از
            ثبت، ادامهٔ شماره‌های مسابقه است.
          </p>
        </div>
        <button type="button" className="text-xs text-slate-400 hover:underline" onClick={onClose}>
          انصراف
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {order.map((player, index) => (
          <span
            key={player.id}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-1.5 py-1 text-xs text-slate-200"
          >
            <span className="text-slate-500">{index + 1}</span>
            {player.name}
            <button
              type="button"
              className="px-0.5 text-slate-400 hover:text-cyan-200 disabled:opacity-30"
              disabled={index === 0}
              onClick={() => movePlayer(index, -1)}
              aria-label="بالا"
            >
              ↑
            </button>
            <button
              type="button"
              className="px-0.5 text-slate-400 hover:text-cyan-200 disabled:opacity-30"
              disabled={index === order.length - 1}
              onClick={() => movePlayer(index, 1)}
              aria-label="پایین"
            >
              ↓
            </button>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="billiard-date-picker min-w-[8.5rem]">
          <DatePicker
            value={fromGregorianYmd(bulkDate || null)}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            format="YYYY/MM/DD"
            placeholder="تاریخ همه"
            editable={false}
            portal
            zIndex={400}
            containerStyle={{ width: "100%" }}
            inputClass="input input-sm"
            onChange={(value) => setBulkDate(toGregorianYmd(value as DateObject | DateObject[] | null))}
          />
        </div>
        <select
          className="input input-sm w-28"
          value={timeForUi(bulkTime) || bulkTime}
          onChange={(event) => setBulkTime(event.target.value)}
        >
          <option value="">ساعت همه</option>
          {BILLIARD_TIME_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        <button type="button" className="text-xs text-cyan-200 hover:underline" onClick={applyBulk}>
          اعمال روی همه
        </button>
      </div>

      <MatchBlock title="جدول برندگان" rows={winnerRows} names={names} times={rows} onPatch={patchRow} />
      {loserRows.length > 0 && (
        <MatchBlock title="جدول بازنده‌ها" rows={loserRows} names={names} times={rows} onPatch={patchRow} />
      )}
      {matches.length === 1 && (
        <p className="text-xs text-slate-400">بازندهٔ همین بازی نفر دوم گروه است.</p>
      )}

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <BilliardButton type="button" loading={busy} disabled={busy} onClick={() => void confirm()}>
        ثبت بازی‌های پیشنهادی
      </BilliardButton>
    </div>
  );
}

function MatchBlock({
  title,
  rows,
  names,
  times,
  onPatch,
}: {
  title: string;
  rows: { match: DeMatch; index: number }[];
  names: Map<number, string>;
  times: RowTime[];
  onPatch: (index: number, patch: Partial<RowTime>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-slate-500">{title}</div>
      {rows.map(({ match, index }) => {
        const time = times[index] || { date: "", time: "" };
        return (
          <div
            key={index}
            className="grid grid-cols-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 sm:grid-cols-[auto_1fr_8.5rem_6.5rem]"
          >
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-fuchsia-500/20 px-1.5 text-xs font-bold text-fuchsia-200">
              {index + 1}
            </span>
            <div className="min-w-0 text-xs text-slate-200">
              <div className="truncate">{deSlotText(match.slot1, names)}</div>
              <div className="text-[10px] text-slate-600">vs</div>
              <div className="truncate">{deSlotText(match.slot2, names)}</div>
              {match.place === "first" && <div className="mt-0.5 text-[10px] text-amber-200">نفر اول گروه</div>}
              {match.place === "second" && <div className="mt-0.5 text-[10px] text-amber-200">نفر دوم گروه</div>}
            </div>
            <div className="billiard-date-picker min-w-0">
              <DatePicker
                value={fromGregorianYmd(time.date || null)}
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
                onChange={(value) =>
                  onPatch(index, { date: toGregorianYmd(value as DateObject | DateObject[] | null) })
                }
              />
            </div>
            <select
              className="input input-sm min-w-0"
              value={timeForUi(time.time) || time.time}
              onChange={(event) => onPatch(index, { time: event.target.value })}
            >
              <option value="">ساعت</option>
              {BILLIARD_TIME_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
