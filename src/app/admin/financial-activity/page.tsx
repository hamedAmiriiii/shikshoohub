"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import SouthWestIcon from "@mui/icons-material/SouthWest";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";

type FilterMode = "today" | "week" | "month";

type Bucket = { count: number; amount: number };

type SummarySide = {
  total: Bucket;
  cash?: Bucket;
  card?: Bucket;
  mixed?: Bucket;
  debt_settle?: Bucket;
  cheque?: Bucket;
  installment?: Bucket;
  expense?: Bucket;
  invoice?: Bucket;
  other?: Bucket;
};

type DayEvent = {
  id: string;
  direction: "in" | "out";
  kind: string;
  method: string;
  method_label: string;
  title: string;
  subtitle?: string | null;
  amount: number;
  cash_amount?: number;
  card_amount?: number;
  at?: string | null;
  at_jalali?: string | null;
  href?: string | null;
};

type Report = {
  meta: {
    filter: FilterMode;
    from_jalali?: string;
    to_jalali?: string;
    events_count?: number;
  };
  summary: {
    inflow: SummarySide;
    outflow: SummarySide;
    net: number;
  };
  events: DayEvent[];
};

const FILTERS: Array<{ value: FilterMode; label: string }> = [
  { value: "today", label: "روزانه" },
  { value: "week", label: "هفتگی" },
  { value: "month", label: "ماهانه" },
];

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num || 0));

function bucket(side: SummarySide | undefined, key: keyof SummarySide): Bucket {
  const value = side?.[key];
  if (value && typeof value === "object" && "count" in value) {
    return { count: Number(value.count) || 0, amount: Number(value.amount) || 0 };
  }
  return { count: 0, amount: 0 };
}

function StatCard({
  label,
  count,
  amount,
  color,
}: {
  label: string;
  count: number;
  amount: number;
  color?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: 2,
        bgcolor: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        minHeight: 78,
      }}
    >
      <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.4 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 800, color: color || "var(--admin-text)" }}>
        {formatNumber(amount)}
      </Typography>
      <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mt: 0.25 }}>
        {formatNumber(count)} مورد
      </Typography>
    </Paper>
  );
}

export default function FinancialActivityPage() {
  const [filter, setFilter] = useState<FilterMode>("today");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [directionTab, setDirectionTab] = useState<"all" | "in" | "out">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = tokenCode();
      const res = await apiRequestError(
        "Get",
        {},
        {},
        `/api/financial-day-activity?filter=${filter}`,
        true,
        true,
        token
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت اتفاقات مالی"));
        setReport(null);
        return;
      }
      setReport(res as Report);
    } catch {
      toast.error("خطا در دریافت اتفاقات مالی");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const events = useMemo(() => {
    const list = report?.events ?? [];
    if (directionTab === "all") return list;
    return list.filter((item) => item.direction === directionTab);
  }, [report, directionTab]);

  const inflow = report?.summary?.inflow;
  const outflow = report?.summary?.outflow;
  const net = Number(report?.summary?.net) || 0;

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.25, md: 2 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.25, md: 2 } }}>
        <ToastContainer autoClose={3000} position="bottom-right" rtl />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1.5,
            flexWrap: "wrap",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EventNoteIcon sx={{ color: "var(--admin-accent)", fontSize: 28 }} />
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: "var(--admin-text)" }}>
                اتفاقات مالی
              </Typography>
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                دریافتی و پرداختی: نقد، کارت، ترکیبی، تسویه نسیه و چک
                {report?.meta?.from_jalali
                  ? ` · ${report.meta.from_jalali}${
                      report.meta.to_jalali && report.meta.to_jalali !== report.meta.from_jalali
                        ? ` تا ${report.meta.to_jalali}`
                        : ""
                    }`
                  : ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {FILTERS.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                clickable
                onClick={() => setFilter(item.value)}
                sx={{
                  fontWeight: 700,
                  bgcolor: filter === item.value ? "var(--admin-accent)" : "var(--admin-surface)",
                  color: filter === item.value ? "var(--admin-on-accent, #fff)" : "var(--admin-text)",
                  border: "1px solid var(--admin-border)",
                }}
              />
            ))}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
                gap: 1,
                mb: 1.25,
              }}
            >
              <StatCard
                label="جمع دریافتی"
                count={bucket(inflow, "total").count}
                amount={bucket(inflow, "total").amount}
                color="var(--admin-accent)"
              />
              <StatCard
                label="جمع پرداختی"
                count={bucket(outflow, "total").count}
                amount={bucket(outflow, "total").amount}
                color="var(--admin-error, #f87171)"
              />
              <Paper
                elevation={0}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  gridColumn: { xs: "1 / -1", md: "span 2" },
                }}
              >
                <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.4 }}>
                  خالص دوره
                </Typography>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: net >= 0 ? "var(--admin-accent)" : "var(--admin-error, #f87171)",
                  }}
                >
                  {formatNumber(net)} تومان
                </Typography>
              </Paper>
            </Box>

            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", mb: 0.75 }}>
              دریافتی‌ها
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" },
                gap: 1,
                mb: 1.5,
              }}
            >
              <StatCard label="نقد" count={bucket(inflow, "cash").count} amount={bucket(inflow, "cash").amount} />
              <StatCard label="کارت" count={bucket(inflow, "card").count} amount={bucket(inflow, "card").amount} />
              <StatCard
                label="ترکیبی"
                count={bucket(inflow, "mixed").count}
                amount={bucket(inflow, "mixed").amount}
              />
              <StatCard
                label="تسویه نسیه"
                count={bucket(inflow, "debt_settle").count}
                amount={bucket(inflow, "debt_settle").amount}
                color="var(--admin-accent)"
              />
              <StatCard
                label="وصول چک"
                count={bucket(inflow, "cheque").count}
                amount={bucket(inflow, "cheque").amount}
              />
            </Box>

            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", mb: 0.75 }}>
              پرداختی‌ها
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
                gap: 1,
                mb: 1.5,
              }}
            >
              <StatCard
                label="هزینه"
                count={bucket(outflow, "expense").count}
                amount={bucket(outflow, "expense").amount}
              />
              <StatCard
                label="فاکتور خرید"
                count={bucket(outflow, "invoice").count}
                amount={bucket(outflow, "invoice").amount}
              />
              <StatCard
                label="نقد/حساب"
                count={bucket(outflow, "cash").count}
                amount={bucket(outflow, "cash").amount}
              />
              <StatCard
                label="چک (وصول/ظهرنویسی)"
                count={bucket(outflow, "cheque").count}
                amount={bucket(outflow, "cheque").amount}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 0.75, mb: 1, flexWrap: "wrap" }}>
              {(
                [
                  { value: "all", label: "همه" },
                  { value: "in", label: "فقط دریافتی" },
                  { value: "out", label: "فقط پرداختی" },
                ] as const
              ).map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  size="small"
                  clickable
                  onClick={() => setDirectionTab(item.value)}
                  sx={{
                    fontWeight: 600,
                    bgcolor:
                      directionTab === item.value
                        ? "rgba(120, 181, 104, 0.2)"
                        : "var(--admin-surface)",
                    color: "var(--admin-text)",
                    border: "1px solid var(--admin-border)",
                  }}
                />
              ))}
            </Box>

            {events.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: "center",
                  bgcolor: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 2,
                }}
              >
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
                  در این بازه اتفاقی ثبت نشده است
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85 }}>
                {events.map((event) => {
                  const isIn = event.direction === "in";
                  return (
                    <Paper
                      key={event.id}
                      elevation={0}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: "var(--admin-surface)",
                        border: "1px solid var(--admin-border)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1, minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              mt: 0.2,
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              bgcolor: isIn
                                ? "rgba(120, 181, 104, 0.18)"
                                : "rgba(248, 113, 113, 0.15)",
                              color: isIn ? "var(--admin-accent)" : "var(--admin-error, #f87171)",
                              flexShrink: 0,
                            }}
                          >
                            {isIn ? (
                              <SouthWestIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <NorthEastIcon sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            {event.href ? (
                              <Link
                                href={event.href}
                                style={{
                                  color: "var(--admin-text)",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  textDecoration: "none",
                                }}
                              >
                                {event.title}
                              </Link>
                            ) : (
                              <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 13 }}>
                                {event.title}
                              </Typography>
                            )}
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.35 }}>
                              <Chip
                                size="small"
                                label={isIn ? "دریافتی" : "پرداختی"}
                                sx={{
                                  height: 22,
                                  fontSize: 10,
                                  bgcolor: isIn
                                    ? "rgba(120, 181, 104, 0.15)"
                                    : "rgba(248, 113, 113, 0.12)",
                                  color: "var(--admin-text)",
                                }}
                              />
                              <Chip
                                size="small"
                                label={event.method_label || event.method}
                                sx={{
                                  height: 22,
                                  fontSize: 10,
                                  bgcolor: "var(--admin-surface-alt)",
                                  color: "var(--admin-text)",
                                }}
                              />
                            </Box>
                            {event.subtitle ? (
                              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.35 }}>
                                {event.subtitle}
                              </Typography>
                            ) : null}
                            {event.at_jalali ? (
                              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.2 }}>
                                {event.at_jalali}
                              </Typography>
                            ) : null}
                          </Box>
                        </Box>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: isIn ? "var(--admin-accent)" : "var(--admin-error, #f87171)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatNumber(event.amount)}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
