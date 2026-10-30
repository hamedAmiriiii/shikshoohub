"use client";

import { useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";
import persian_fa from "react-date-object/locales/persian_fa";

export const BILLIARD_LS_DATE = "billiard_match_default_date";
export const BILLIARD_LS_TIME = "billiard_match_default_time";

/** ساعت ۹ تا ۲۳ با ربع‌ساعت + ۲۴:۰۰ */
export const BILLIARD_TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 9; h <= 23; h++) {
    for (const m of [0, 15, 30, 45]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  out.push("24:00");
  return out;
})();

export function readScheduleDefault(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

export function writeScheduleDefault(key: string, value: string) {
  if (typeof window === "undefined" || !value) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/** برای API: ۲۴:۰۰ → ۰۰:۰۰ */
export function timeForApi(time: string): string {
  if (time === "24:00") return "00:00";
  return time;
}

export function timeForUi(time?: string | null): string {
  if (!time) return "";
  const t = time.slice(0, 5);
  if (t === "00:00") return "24:00";
  return t;
}

export function toGregorianYmd(d: DateObject | null): string {
  if (!d) return "";
  return d.convert(gregorian).format("YYYY-MM-DD");
}

export function fromGregorianYmd(ymd?: string | null): DateObject | null {
  if (!ymd) return null;
  try {
    return new DateObject({
      date: ymd,
      format: "YYYY-MM-DD",
      calendar: gregorian,
    }).convert(persian);
  } catch {
    return null;
  }
}

/** جدا کردن تاریخ/ساعت از ISO یا Y-m-d H:i بدون شیفت timezone */
export function splitIsoDateTime(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
  if (!m) return { date: "", time: "" };
  return { date: m[1], time: m[2] ? timeForUi(m[2]) : "" };
}

type Props = {
  tableId?: number | string | null;
  scheduledOn?: string | null;
  scheduledAt?: string | null;
  tables: { id: number; name: string }[];
  defaultDate: string;
  defaultTime: string;
  disabled?: boolean;
  onChange: (next: { tableId: string; date: string; time: string }) => void;
};

export function MatchScheduleFields({
  tableId,
  scheduledOn,
  scheduledAt,
  tables,
  defaultDate,
  defaultTime,
  disabled,
  onChange,
}: Props) {
  const dateValue = scheduledOn || defaultDate || "";
  const timeValue = timeForUi(scheduledAt) || defaultTime || "";
  const pickerValue = useMemo(() => fromGregorianYmd(dateValue || null), [dateValue]);

  const timeOptions = useMemo(() => {
    const list = [...BILLIARD_TIME_OPTIONS];
    if (timeValue && !list.includes(timeValue)) list.unshift(timeValue);
    return list;
  }, [timeValue]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        className="input input-sm max-w-[100px]"
        disabled={disabled}
        value={tableId ? String(tableId) : ""}
        onChange={(e) =>
          onChange({
            tableId: e.target.value,
            date: dateValue,
            time: timeValue,
          })
        }
      >
        <option value="">میز</option>
        {tables.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <div className="billiard-date-picker min-w-[118px] max-w-[140px] flex-1">
        <DatePicker
          value={pickerValue}
          disabled={disabled}
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
            const ymd = toGregorianYmd(obj);
            onChange({
              tableId: tableId ? String(tableId) : "",
              date: ymd,
              time: timeValue,
            });
          }}
        />
      </div>

      <select
        className="input input-sm max-w-[96px]"
        disabled={disabled}
        value={timeValue}
        onChange={(e) =>
          onChange({
            tableId: tableId ? String(tableId) : "",
            date: dateValue,
            time: e.target.value,
          })
        }
      >
        <option value="">ساعت</option>
        {timeOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
