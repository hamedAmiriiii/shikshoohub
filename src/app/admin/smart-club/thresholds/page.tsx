"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Box, Button, CircularProgress, InputBase, MenuItem, Select, Typography } from "@mui/material";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  fetchSmartThresholds,
  recomputeSmartCustomer,
  updateSmartThresholds,
  type SmartThresholds,
} from "@/app/lib/smartCustomer";
import { formatAmountInput, parseAmountInput } from "@/app/lib/amountInput";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

type Unit = "day" | "count" | "toman" | "times" | "percent";

type Rule = { key: string; text: string; unit: Unit };

type Section = {
  id: string;
  title: string;
  hint: string;
  color: string;
  icon: ReactNode;
  rules: Rule[];
};

const UNIT_LABEL: Record<Unit, string> = {
  day: "روز",
  count: "بار",
  toman: "تومان",
  times: "برابر",
  percent: "٪",
};

/** ترتیب بخش‌ها همان ترتیبی است که بک‌اند گروه را انتخاب می‌کند */
const SEGMENT_SECTIONS: Section[] = [
  {
    id: "vip",
    title: "ویژه",
    hint: "بهترین مشتری‌ها: تازه خریده‌اند، زیاد می‌آیند و زیاد خرج می‌کنند.",
    color: "#f5c542",
    icon: <EmojiEventsOutlinedIcon />,
    rules: [
      { key: "vip_max_recency_days", text: "آخرین خریدش حداکثر", unit: "day" },
      { key: "vip_min_frequency", text: "حداقل تعداد خرید", unit: "count" },
      { key: "vip_min_monetary", text: "حداقل جمع خرید", unit: "toman" },
      { key: "near_vip_frequency_gap", text: "«نزدیک به ویژه» وقتی خریدش حداکثر این‌قدر کمتر باشد", unit: "count" },
    ],
  },
  {
    id: "at_risk",
    title: "نزدیک به رفتن",
    hint: "قبلاً مرتب می‌آمد ولی الان خیلی دیرتر از همیشه کرده.",
    color: "#f59e0b",
    icon: <WarningAmberOutlinedIcon />,
    rules: [
      { key: "at_risk_min_frequency", text: "حداقل تعداد خرید قبلی", unit: "count" },
      { key: "at_risk_recency_multiplier", text: "چند برابر فاصله معمول خریدش دیر کرده", unit: "times" },
      { key: "at_risk_min_recency_days", text: "و حداقل از آخرین خریدش گذشته", unit: "day" },
    ],
  },
  {
    id: "churned",
    title: "دیگه نمیاد",
    hint: "خیلی وقت است خرید نکرده و احتمالاً رفته.",
    color: "#f87171",
    icon: <PersonOffOutlinedIcon />,
    rules: [{ key: "churned_min_recency_days", text: "حداقل مدت بدون خرید", unit: "day" }],
  },
  {
    id: "inactive",
    title: "مدتی نخریده",
    hint: "مدتی است نیامده ولی هنوز به «دیگه نمیاد» نرسیده.",
    color: "#94a3b8",
    icon: <HourglassEmptyOutlinedIcon />,
    rules: [{ key: "inactive_min_recency_days", text: "حداقل مدت بدون خرید", unit: "day" }],
  },
  {
    id: "loyal",
    title: "همیشگی",
    hint: "مرتب و زیاد خرید می‌کند.",
    color: "#22d3ee",
    icon: <FavoriteOutlinedIcon />,
    rules: [
      { key: "loyal_max_recency_days", text: "آخرین خریدش حداکثر", unit: "day" },
      { key: "loyal_min_frequency", text: "حداقل تعداد خرید", unit: "count" },
    ],
  },
  {
    id: "growing",
    title: "رو به رشد",
    hint: "اخیراً زیاد خرید کرده (و در ۴۵ روز اخیر آمده).",
    color: "#4ade80",
    icon: <TrendingUpOutlinedIcon />,
    rules: [{ key: "growing_min_purchases_90d", text: "حداقل خرید در ۹۰ روز اخیر", unit: "count" }],
  },
  {
    id: "new",
    title: "تازه‌وارد",
    hint: "تازه با فروشگاه آشنا شده.",
    color: "#60a5fa",
    icon: <PersonAddAltOutlinedIcon />,
    rules: [
      { key: "new_max_days_since_first", text: "اولین خریدش حداکثر", unit: "day" },
      { key: "new_max_frequency", text: "حداکثر تعداد خرید", unit: "count" },
    ],
  },
];

const EXTRA_SECTIONS: Section[] = [
  {
    id: "value",
    title: "خرید زیاد / خرید کم",
    hint: "برچسب کنار گروه، بر اساس جمع خرید.",
    color: "#a3e635",
    icon: <PaidOutlinedIcon />,
    rules: [
      { key: "high_value_min_monetary", text: "«خرید زیاد» از جمع خرید", unit: "toman" },
      { key: "low_value_max_monetary", text: "«خرید کم» تا جمع خرید", unit: "toman" },
    ],
  },
  {
    id: "actions",
    title: "پیشنهاد اقدام",
    hint: "برای صفحه «پیشنهاد اقدام» و تخمین درآمد.",
    color: "#34d399",
    icon: <BoltOutlinedIcon />,
    rules: [
      { key: "action_cooldown_days", text: "فاصله بین دو پیشنهاد برای یک مشتری", unit: "day" },
      { key: "winback_credit_amount", text: "اعتبار پیشنهادی برای برگرداندن مشتری", unit: "toman" },
      { key: "winback_revenue_factor", text: "احتمال برگشت (برای تخمین درآمد)", unit: "percent" },
    ],
  },
];

const ALL_KEYS = [
  "metrics_window",
  ...[...SEGMENT_SECTIONS, ...EXTRA_SECTIONS].flatMap((s) => s.rules.map((r) => r.key)),
];

const WINDOW_OPTIONS = [
  { value: "all", label: "همه خریدها" },
  { value: "90", label: "۹۰ روز اخیر" },
  { value: "180", label: "۱۸۰ روز اخیر" },
  { value: "365", label: "یک سال اخیر" },
];

const cardSx = {
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  p: 1.25,
} as const;

function toInput(value: unknown, unit: Unit): string {
  if (value === undefined || value === null || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  if (unit === "toman") return formatAmountInput(String(Math.floor(n)));
  if (unit === "percent") return String(Math.round(n * 1000) / 10);
  return String(n);
}

function fromInput(raw: string, unit: Unit): number | "" {
  if (raw.trim() === "") return "";
  if (unit === "toman") return Math.floor(parseAmountInput(raw));
  const n = parseAmountInput(raw.replace(/[٫,]/g, "."));
  if (!Number.isFinite(n)) return "";
  if (unit === "percent") return Math.round(n * 10) / 1000;
  return n;
}

function RuleRow({
  rule,
  value,
  onChange,
}: {
  rule: Rule;
  value: string;
  onChange: (raw: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
      <Typography sx={{ flex: 1, fontSize: 12, color: "var(--admin-text)", lineHeight: 1.5 }}>
        {rule.text}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          width: rule.unit === "toman" ? 150 : 100,
          flexShrink: 0,
          px: 1,
          borderRadius: "8px",
          bgcolor: "var(--admin-surface-alt)",
          border: "1px solid transparent",
          "&:focus-within": { borderColor: "var(--admin-accent)" },
        }}
      >
        <InputBase
          value={value}
          onChange={(e) => onChange(rule.unit === "toman" ? formatAmountInput(e.target.value) : e.target.value)}
          inputMode={rule.unit === "times" || rule.unit === "percent" ? "decimal" : "numeric"}
          sx={{
            flex: 1,
            color: "var(--admin-text)",
            "& input": { textAlign: "center", fontSize: 13, fontWeight: 700, py: 0.5 },
          }}
        />
        <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}>
          {UNIT_LABEL[rule.unit]}
        </Typography>
      </Box>
    </Box>
  );
}

function SectionCard({
  section,
  values,
  onChange,
}: {
  section: Section;
  values: Record<string, string>;
  onChange: (key: string, raw: string) => void;
}) {
  return (
    <Box sx={{ ...cardSx, borderInlineStart: `3px solid ${section.color}` }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box sx={{ color: section.color, display: "flex", "& svg": { fontSize: 18 } }}>{section.icon}</Box>
        <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{section.title}</Typography>
      </Box>
      <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mt: 0.25, mb: 0.5 }}>
        {section.hint}
      </Typography>
      {section.rules.map((rule) => (
        <RuleRow
          key={rule.key}
          rule={rule}
          value={values[rule.key] ?? ""}
          onChange={(raw) => onChange(rule.key, raw)}
        />
      ))}
    </Box>
  );
}

export default function SmartClubThresholdsPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [metricsWindow, setMetricsWindow] = useState("all");
  const [values, setValues] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSmartThresholds();
      const t = (res.thresholds || {}) as SmartThresholds;
      setMetricsWindow(String(t.metrics_window ?? "all"));
      const next: Record<string, string> = {};
      for (const section of [...SEGMENT_SECTIONS, ...EXTRA_SECTIONS]) {
        for (const rule of section.rules) next[rule.key] = toInput(t[rule.key], rule.unit);
      }
      setValues(next);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت تنظیمات"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onChange = (key: string, raw: string) => setValues((prev) => ({ ...prev, [key]: raw }));

  const onSave = async () => {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { metrics_window: metricsWindow };
      for (const section of [...SEGMENT_SECTIONS, ...EXTRA_SECTIONS]) {
        for (const rule of section.rules) {
          const parsed = fromInput(values[rule.key] ?? "", rule.unit);
          if (parsed !== "") payload[rule.key] = parsed;
        }
      }
      await updateSmartThresholds(payload);
      try {
        await recomputeSmartCustomer();
        toast.success("ذخیره شد و گروه مشتری‌ها دوباره حساب شد");
      } catch {
        toast.warning("ذخیره شد؛ برای اعمال، در داشبورد «محاسبه دوباره» را بزن");
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ذخیره ناموفق"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 1.5, pb: 12, color: "var(--admin-text)" }}>
      <ToastContainer position="top-center" rtl />
      <Typography sx={{ fontWeight: 800, fontSize: 16 }}>تنظیم گروه‌بندی مشتری‌ها</Typography>
      <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mt: 0.25, mb: 1.5 }}>
        مشخص کن هر مشتری با چه شرایطی در کدام گروه قرار بگیرد. اگر مشتری شرایط چند گروه را داشت، اولین گروه
        به ترتیب همین صفحه حساب می‌شود.
      </Typography>

      {loading ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
            <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: "var(--admin-text-muted)" }} />
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>کدام خریدها حساب شود؟</Typography>
              <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                همه اعداد این صفحه فقط از خریدهای همین بازه حساب می‌شوند.
              </Typography>
            </Box>
            <Select
              size="small"
              value={metricsWindow}
              onChange={(e) => setMetricsWindow(String(e.target.value))}
              MenuProps={{ PaperProps: { sx: { "& .MuiMenuItem-root": { fontSize: 12 } } } }}
              sx={{
                minWidth: 140,
                fontSize: 12,
                color: "var(--admin-text)",
                bgcolor: "var(--admin-surface-alt)",
                borderRadius: "8px",
                "& fieldset": { borderColor: "transparent" },
              }}
            >
              {WINDOW_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            {SEGMENT_SECTIONS.map((section) => (
              <SectionCard key={section.id} section={section} values={values} onChange={onChange} />
            ))}
          </Box>

          <Typography sx={{ fontSize: 12, fontWeight: 800, mt: 2, mb: 0.75, color: "var(--admin-text-muted)" }}>
            سایر تنظیمات
          </Typography>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            {EXTRA_SECTIONS.map((section) => (
              <SectionCard key={section.id} section={section} values={values} onChange={onChange} />
            ))}
          </Box>

          <Box
            sx={{
              position: "sticky",
              bottom: 12,
              mt: 2,
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <Button
              variant="contained"
              disableElevation
              disabled={busy || ALL_KEYS.length === 0}
              onClick={() => void onSave()}
              startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ borderRadius: "10px", fontSize: 13, fontWeight: 700, px: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}
            >
              {busy ? "در حال ذخیره..." : "ذخیره و محاسبه دوباره"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
