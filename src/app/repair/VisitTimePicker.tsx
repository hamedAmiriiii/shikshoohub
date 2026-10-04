"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import ScheduleIcon from "@mui/icons-material/Schedule";

const DAYS_AHEAD = 14;

export const VISIT_SLOTS = [
  { start: 8, end: 11 },
  { start: 11, end: 14 },
  { start: 14, end: 17 },
  { start: 17, end: 20 },
  { start: 20, end: 22 },
];

export type VisitTime = { day: string | null; slot: number | null };

const weekdayFmt = new Intl.DateTimeFormat("fa-IR", { weekday: "long" });
const dayFmt = new Intl.DateTimeFormat("fa-IR", { day: "numeric" });
const monthFmt = new Intl.DateTimeFormat("fa-IR", { month: "long" });
const fullFmt = new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function faNum(n: number) {
  return n.toLocaleString("fa-IR");
}

export function slotLabel(index: number) {
  const slot = VISIT_SLOTS[index];
  return slot ? `${faNum(slot.start)} تا ${faNum(slot.end)}` : "";
}

/** متن ذخیره‌شده در preferred_time، مثل «شنبه ۱۲ مهر ۱۴۰۵، ساعت ۸ تا ۱۱» */
export function formatVisitTime(value: VisitTime): string {
  if (!value.day || value.slot === null) return "";
  return `${fullFmt.format(fromKey(value.day))}، ساعت ${slotLabel(value.slot)}`;
}

function isSlotPassed(day: string, slotIndex: number, now: Date) {
  return day === dayKey(now) && now.getHours() >= VISIT_SLOTS[slotIndex].start;
}

export default function VisitTimePicker({ value, onChange }: { value: VisitTime; onChange: (value: VisitTime) => void }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const days = useMemo(() => {
    const todayKey = dayKey(now);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const key = dayKey(date);
      const allPassed = VISIT_SLOTS.every((_, s) => isSlotPassed(key, s, now));
      return {
        key,
        label: i === 0 ? "امروز" : i === 1 ? "فردا" : weekdayFmt.format(date),
        weekday: weekdayFmt.format(date),
        day: dayFmt.format(date),
        month: monthFmt.format(date),
        disabled: key === todayKey && allPassed,
      };
    });
  }, [now]);

  useEffect(() => {
    if (value.day && value.slot !== null && isSlotPassed(value.day, value.slot, now)) {
      onChange({ day: value.day, slot: null });
    }
  }, [now, value.day, value.slot, onChange]);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <EventIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={700}>
          روز مراجعه
        </Typography>
      </Stack>
      <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, mx: -0.5, px: 0.5 }}>
        {days.map((d) => {
          const selected = value.day === d.key;
          return (
            <ButtonBase
              key={d.key}
              disabled={d.disabled}
              onClick={() => onChange({ day: d.key, slot: selected ? value.slot : null })}
              sx={{
                flexShrink: 0,
                width: 74,
                py: 1,
                borderRadius: 2.5,
                border: "1.5px solid",
                borderColor: selected ? "primary.main" : "divider",
                bgcolor: selected ? "primary.main" : "background.paper",
                color: selected ? "#fff" : "text.primary",
                flexDirection: "column",
                gap: 0.25,
                opacity: d.disabled ? 0.4 : 1,
                transition: "all .15s",
              }}
            >
              <Typography variant="caption" sx={{ color: "inherit", opacity: 0.85, fontWeight: 700 }}>
                {d.label}
              </Typography>
              <Typography sx={{ color: "inherit", fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>{d.day}</Typography>
              <Typography variant="caption" sx={{ color: "inherit", opacity: 0.85 }}>
                {d.month}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>

      {value.day && (
        <>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <ScheduleIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={700}>
              ساعت مراجعه — {weekdayFmt.format(fromKey(value.day))} {dayFmt.format(fromKey(value.day))} {monthFmt.format(fromKey(value.day))}
            </Typography>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 1 }}>
            {VISIT_SLOTS.map((_, index) => {
              const passed = isSlotPassed(value.day as string, index, now);
              const selected = value.slot === index;
              return (
                <Chip
                  key={index}
                  label={slotLabel(index)}
                  clickable={!passed}
                  disabled={passed}
                  color={selected ? "primary" : "default"}
                  variant={selected ? "filled" : "outlined"}
                  onClick={() => onChange({ day: value.day, slot: index })}
                  sx={{ height: 40, borderRadius: 2, fontWeight: 700 }}
                />
              );
            })}
          </Box>
        </>
      )}
    </Stack>
  );
}
