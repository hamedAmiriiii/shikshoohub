"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  fetchProductSignals,
  fetchSmartOverview,
  recomputeSmartCustomer,
  toFaNum,
  type ProductSignalResult,
  type SmartDashboardCard,
  type SmartOverview,
} from "@/app/lib/smartCustomer";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const CARD_THEME: Record<string, { color: string; bg: string; icon: ReactNode }> = {
  vip: { color: "#f5c542", bg: "rgba(245,197,66,0.12)", icon: <EmojiEventsOutlinedIcon /> },
  ready_repurchase: { color: "#2dd4bf", bg: "rgba(45,212,191,0.12)", icon: <ShoppingCartOutlinedIcon /> },
  at_risk: { color: "#f59e0b", bg: "rgba(245,158,11,0.14)", icon: <WarningAmberOutlinedIcon /> },
  loyal: { color: "#22d3ee", bg: "rgba(34,211,238,0.12)", icon: <FavoriteOutlinedIcon /> },
  near_vip: { color: "#c084fc", bg: "rgba(192,132,252,0.12)", icon: <WorkspacePremiumOutlinedIcon /> },
  growing: { color: "#4ade80", bg: "rgba(74,222,128,0.12)", icon: <TrendingUpOutlinedIcon /> },
  new: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", icon: <PersonAddAltOutlinedIcon /> },
  churned: { color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: <PersonOffOutlinedIcon /> },
  inactive: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: <HourglassEmptyOutlinedIcon /> },
  other: { color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: <CategoryOutlinedIcon /> },
  actions: { color: "#34d399", bg: "rgba(52,211,153,0.12)", icon: <BoltOutlinedIcon /> },
  campaigns: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: <CampaignOutlinedIcon /> },
  customers: { color: "#2dd4bf", bg: "rgba(45,212,191,0.12)", icon: <PeopleAltOutlinedIcon /> },
  thresholds: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: <TuneOutlinedIcon /> },
  bad: { color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: <ThumbDownAltOutlinedIcon /> },
  good: { color: "#4ade80", bg: "rgba(74,222,128,0.12)", icon: <ThumbUpAltOutlinedIcon /> },
};

const DONUT_COLORS: Record<string, string> = {
  vip: "#f5c542",
  loyal: "#22d3ee",
  at_risk: "#f59e0b",
  growing: "#4ade80",
  new: "#60a5fa",
  churned: "#f87171",
  inactive: "#94a3b8",
  other: "#475569",
};

const panelSx = {
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  p: 1,
} as const;

function rfmGrade(score: number) {
  if (score >= 4.5) return { label: "عالی", color: "#4ade80" };
  if (score >= 3.5) return { label: "خوب", color: "#22d3ee" };
  if (score >= 2.5) return { label: "متوسط", color: "#f59e0b" };
  if (score > 0) return { label: "ضعیف", color: "#f87171" };
  return { label: "—", color: "var(--admin-text-muted)" };
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 120;
  const h = 20;
  const values = points.length ? points : [0, 0];
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const d = values
    .map((p, i) => {
      const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * w;
      const y = h - 3 - ((p - min) / span) * (h - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({
  card,
  onClick,
  unit = "مشتری",
  dense = false,
}: {
  card: SmartDashboardCard & { key: string };
  onClick?: () => void;
  unit?: string;
  dense?: boolean;
}) {
  const theme = CARD_THEME[card.key] || CARD_THEME.other;
  const trend = card.trend_pct;
  const up = (trend ?? 0) >= 0;
  const hasCount = typeof card.count === "number";
  const hasSpark = !dense && (card.sparkline || []).length > 0;
  const content = (
    <Box
      sx={{
        ...panelSx,
        height: "100%",
        px: 1.1,
        py: dense ? 0.85 : 1,
        background: `linear-gradient(180deg, ${theme.bg} 0%, var(--admin-surface) 70%)`,
        borderColor: `${theme.color}33`,
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        cursor: card.href || onClick ? "pointer" : "default",
        "&:hover": card.href || onClick ? { borderColor: `${theme.color}88` } : {},
      }}
      onClick={onClick}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0.5, mb: 0.35 }}>
        <Typography sx={{ fontWeight: 700, fontSize: dense ? 12 : 13, lineHeight: 1.2 }}>{card.title}</Typography>
        <Box sx={{ color: theme.color, display: "flex", "& svg": { fontSize: dense ? 16 : 18 } }}>{theme.icon}</Box>
      </Box>
      {hasCount ? (
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.6, flexWrap: "wrap" }}>
          <Typography sx={{ fontWeight: 800, fontSize: dense ? 18 : 22, lineHeight: 1.15 }}>
            {toFaNum(card.count ?? 0)}
          </Typography>
          {unit ? (
            <Typography sx={{ fontSize: 11, color: "var(--admin-text-secondary)" }}>{unit}</Typography>
          ) : null}
          {trend != null ? (
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: up ? "#4ade80" : "#f87171" }}>
              {up ? "↑" : "↓"} {toFaNum(Math.abs(trend))}٪
            </Typography>
          ) : null}
        </Box>
      ) : null}
      {hasSpark ? (
        <Box sx={{ mt: 0.5 }}>
          <Sparkline points={card.sparkline || []} color={theme.color} />
        </Box>
      ) : null}
    </Box>
  );

  if (card.href && !onClick) {
    return (
      <Box component={Link} href={card.href} sx={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}>
        {content}
      </Box>
    );
  }
  return content;
}

function Donut({
  slices,
}: {
  slices: { key: string; label: string; count: number; percent: number }[];
}) {
  const size = 108;
  const r = 36;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const visible = slices.filter((s) => s.percent > 0);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--admin-border)" strokeWidth="12" />
      {visible.map((s) => {
        const len = (s.percent / 100) * circ;
        const el = (
          <circle
            key={s.key}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={DONUT_COLORS[s.key] || "#64748b"}
            strokeWidth="12"
            strokeDasharray={`${len} ${Math.max(circ - len, 0)}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

function ScoreRing({ value }: { value: number }) {
  const size = 72;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / 5));
  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--admin-border)" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1, color: "#2dd4bf" }}>
            {toFaNum(value)}
          </Typography>
          <Typography sx={{ fontSize: 9, color: "var(--admin-text)", opacity: 0.65, lineHeight: 1.2 }}>از ۵</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function SmartClubDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<SmartOverview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [signal, setSignal] = useState<ProductSignalResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSmartOverview();
      setData(res);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت باشگاه هوشمند"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRecompute = async () => {
    setBusy(true);
    try {
      const res = await recomputeSmartCustomer();
      toast.success((res as { message?: string }).message || "محاسبه انجام شد");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "محاسبه ناموفق بود"));
    } finally {
      setBusy(false);
    }
  };

  const openSignals = async (type: "bad" | "good") => {
    setModalOpen(true);
    setModalLoading(true);
    setSignal(null);
    try {
      const res = await fetchProductSignals(type);
      setSignal(res);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت لیست کالا"));
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const rfm = data?.rfm;
  const featured = data?.featured || [];
  const extra = (data?.extra_cards || []).filter((card) => (card.count || 0) > 0);
  const distribution = data?.distribution || [];
  const ops = data?.ops || [];

  const rfmRows = useMemo(
    () =>
      rfm
        ? [
            { key: "R", title: "تازگی خرید", hint: "چقدر زود دوباره میان", value: rfm.R },
            { key: "F", title: "تعداد خرید", hint: "چند بار میان فروشگاه", value: rfm.F },
            { key: "M", title: "مبلغ خرید", hint: "چقدر خرج می‌کنن", value: rfm.M },
          ]
        : [],
    [rfm],
  );

  return (
    <Box sx={{ ...adminPageSx, p: 1, pb: 10 }}>
      <ToastContainer position="top-center" rtl />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 1, flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>نمای کلی</Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 11 }}>
            نگاه کلی به مشتری‌های فروشگاه
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flexWrap: "wrap" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.4,
              borderRadius: "8px",
              border: "1px solid var(--admin-border)",
              bgcolor: "var(--admin-surface)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <CalendarMonthOutlinedIcon sx={{ fontSize: 15, color: "var(--admin-text-muted)" }} />
            {data?.window_label || "کل دوره"}
          </Box>
          <Button
            size="small"
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => void onRecompute()}
            disabled={busy}
            sx={{ ...adminButtonStartIconSx, py: 0.4, fontSize: 12 }}
          >
            {busy ? "محاسبه..." : "محاسبه دوباره"}
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !data?.ready ? (
        <Box sx={panelSx}>
          <Typography>{data?.message || "جداول باشگاه هوشمند هنوز آماده نیست. فایل SQL را اجرا کنید."}</Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 0.85,
              mb: 0.85,
            }}
          >
            {featured.map((card) => (
              <StatCard key={card.key} card={card} />
            ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr 0.95fr" },
              gap: 0.85,
              mb: 0.85,
            }}
          >
            <Box sx={{ ...panelSx, px: 1.25, py: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.35 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>وضعیت خرید مشتری‌ها</Typography>
                <Tooltip
                  title="میانگین همه مشتری‌ها از ۵ نمره. هرچی بالاتر یعنی مشتری‌ها تازه‌تر میان، بیشتر می‌خرن و مبلغ خریدشان بیشتر است."
                  arrow
                >
                  <InfoOutlinedIcon sx={{ fontSize: 15, color: "var(--admin-text)", opacity: 0.55, cursor: "help" }} />
                </Tooltip>
              </Box>
              <Typography sx={{ fontSize: 11, color: "var(--admin-text)", opacity: 0.7, mb: 0.85, lineHeight: 1.5 }}>
                نمره از ۵ است؛ بالاتر یعنی بهتر.
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", gap: 1.25, flex: 1, minWidth: 0 }}>
                  {rfmRows.map((row) => {
                    const grade = rfmGrade(row.value);
                    return (
                      <Box key={row.key} sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: "var(--admin-text)", fontSize: 11, fontWeight: 700 }}>
                          {row.title}
                        </Typography>
                        <Typography sx={{ color: "var(--admin-text)", opacity: 0.65, fontSize: 10, mb: 0.15 }}>
                          {row.hint}
                        </Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, color: "var(--admin-text)" }}>
                          {toFaNum(row.value)}
                          <Typography component="span" sx={{ color: "var(--admin-text)", opacity: 0.55, fontSize: 11 }}>
                            /۵
                          </Typography>
                        </Typography>
                        <Typography sx={{ color: grade.color, fontSize: 10, fontWeight: 700 }}>{grade.label}</Typography>
                      </Box>
                    );
                  })}
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <ScoreRing value={rfm?.overall || 0} />
                  <Typography sx={{ fontSize: 10, color: "var(--admin-text)", opacity: 0.7, mt: 0.25 }}>
                    میانگین
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ ...panelSx, px: 1.25, py: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>گروه مشتریان</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Donut slices={distribution} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35, minWidth: 0, flex: 1 }}>
                  {distribution.map((s) => (
                    <Box key={s.key} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: DONUT_COLORS[s.key] || "#64748b", flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 11, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.label}
                      </Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-secondary)" }}>
                        ٪{toFaNum(s.percent)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                ...panelSx,
                px: 1.25,
                py: 1,
                background: "linear-gradient(135deg, rgba(45,212,191,0.08) 0%, var(--admin-surface) 70%)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{data.ai_suggestion?.title || "پیشنهاد هوشمند"}</Typography>
                <AutoAwesomeOutlinedIcon sx={{ color: "#22d3ee", fontSize: 18 }} />
              </Box>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, lineHeight: 1.6, mb: 0.75, flex: 1 }}>
                {data.ai_suggestion?.body}
              </Typography>
              <Button
                component={Link}
                href={data.ai_suggestion?.href || "/admin/smart-club/actions"}
                size="small"
                variant="contained"
                endIcon={<ChevronLeftIcon />}
                sx={{
                  ...adminButtonStartIconSx,
                  alignSelf: "flex-start",
                  py: 0.35,
                  fontSize: 12,
                  bgcolor: "#0f766e",
                  "&:hover": { bgcolor: "#0d9488" },
                }}
              >
                مشاهده پیشنهادها
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" },
              gap: 0.75,
            }}
          >
            {extra.map((card) => (
              <StatCard key={card.key} card={card} dense />
            ))}
            {ops.map((item) => (
              <StatCard
                key={item.key}
                dense
                unit={
                  item.key === "campaigns"
                    ? "کمپین"
                    : item.key === "actions"
                      ? "پیشنهاد"
                      : item.key === "thresholds"
                        ? ""
                        : "مشتری"
                }
                card={{
                  key: item.key,
                  title: item.title,
                  count: item.count,
                  href: item.href,
                }}
              />
            ))}
            <StatCard dense card={{ key: "bad", title: "کالاهای بد" }} onClick={() => void openSignals("bad")} />
            <StatCard dense card={{ key: "good", title: "کالاهای خوب" }} onClick={() => void openSignals("good")} />
          </Box>

          {data.last_computed_at ? (
            <Typography sx={{ fontSize: 10, color: "var(--admin-text-secondary)", mt: 0.75 }}>
              آخرین محاسبه: {data.last_computed_at}
            </Typography>
          ) : null}
        </>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography fontWeight={800}>{signal?.title || "نتیجه"}</Typography>
          <IconButton onClick={() => setModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {modalLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !signal ? null : (
            <>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {signal.description}
              </Typography>
              <Typography fontWeight={700} mb={1}>
                {toFaNum(signal.customer_count)} مشتری
              </Typography>
              <Typography fontWeight={700} mt={2} mb={1}>
                کالاهای مشترک (بیشترین)
              </Typography>
              {signal.common_products.length === 0 ? (
                <Typography color="text.secondary" mb={2}>
                  کالایی پیدا نشد. اول «محاسبه دوباره» را بزنید.
                </Typography>
              ) : (
                <Box sx={{ overflowX: "auto", mb: 2, border: "1px solid var(--admin-border)", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>کالا</TableCell>
                        <TableCell>تعداد مشتری</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {signal.common_products.map((p) => (
                        <TableRow key={p.product_id}>
                          <TableCell>{p.product_name}</TableCell>
                          <TableCell>{toFaNum(p.customer_count)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Typography fontWeight={700} mb={1}>
                جزئیات مشتریان
              </Typography>
              <Box sx={{ overflowX: "auto", border: "1px solid var(--admin-border)", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>مشتری</TableCell>
                      <TableCell>خریدها</TableCell>
                      <TableCell>میانگین فاصله</TableCell>
                      <TableCell>روز از آخرین</TableCell>
                      <TableCell>آستانه ۲۰٪+</TableCell>
                      <TableCell>آخرین کالا</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {signal.customers.map((c) => (
                      <TableRow key={c.phone}>
                        <TableCell>
                          <Typography fontWeight={600}>{c.name || "—"}</Typography>
                          <Typography variant="caption">{c.phone}</Typography>
                        </TableCell>
                        <TableCell>{toFaNum(c.frequency)}</TableCell>
                        <TableCell>{toFaNum(c.avg_days_between)} روز</TableCell>
                        <TableCell>{toFaNum(c.recency_days)}</TableCell>
                        <TableCell>{toFaNum(c.overdue_threshold_days)}</TableCell>
                        <TableCell>{c.last_product_name || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
