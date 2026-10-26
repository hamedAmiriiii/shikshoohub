"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import EventNoteIcon from "@mui/icons-material/EventNote";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { jalaliYmd } from "@/app/lib/accounting";
import { todayJalaliDateObject } from "@/app/lib/cheques";
import { adminPageSx } from "@/app/admin/theme/adminTheme";

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text-muted)",
    fontWeight: 700,
    fontSize: "12px",
    padding: "10px 12px",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--admin-border)",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: "13px",
    padding: "10px 12px",
    verticalAlign: "middle",
    borderBottom: "1px solid var(--admin-border)",
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": {
    backgroundColor: "var(--admin-surface-alt)",
  },
  "&:last-child td": {
    borderBottom: "none",
  },
  "&:hover": {
    backgroundColor: "var(--admin-menu-hover)",
  },
}));

type FilterMode = "today" | "week" | "month" | "custom";

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
  party?: string | null;
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
  { value: "custom", label: "تاریخ دلخواه" },
];

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num || 0));

const datePickerBoxSx = {
  minWidth: 128,
  "& .rmdp-wrapper": { width: "100%" },
  "& .rmdp-input": {
    width: "100%",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "var(--admin-surface)",
    border: "1px solid var(--admin-border)",
    color: "var(--admin-text)",
    fontSize: "12.5px",
    padding: "4px 10px",
    boxSizing: "border-box",
  },
  "& .rmdp-input:focus": {
    borderColor: "var(--admin-accent)",
    outline: "none",
  },
} as const;

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
  const [customFrom, setCustomFrom] = useState<DateObject | null>(() => todayJalaliDateObject());
  const [customTo, setCustomTo] = useState<DateObject | null>(() => todayJalaliDateObject());
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [directionTab, setDirectionTab] = useState<"all" | "in" | "out">("all");

  const load = useCallback(async () => {
    if (filter === "custom" && !appliedFrom && !appliedTo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = tokenCode();
      const params = new URLSearchParams({ filter });
      if (filter === "custom") {
        if (appliedFrom) params.set("from_date", appliedFrom);
        if (appliedTo) params.set("to_date", appliedTo || appliedFrom);
      }
      const res = await apiRequestError(
        "Get",
        {},
        {},
        `/api/financial-day-activity?${params.toString()}`,
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
  }, [filter, appliedFrom, appliedTo]);

  useEffect(() => {
    load();
  }, [load]);

  const selectPreset = (value: FilterMode) => {
    setFilter(value);
    if (value !== "custom") {
      setAppliedFrom("");
      setAppliedTo("");
    } else if (!appliedFrom && !appliedTo) {
      const today = jalaliYmd(todayJalaliDateObject());
      setCustomFrom(todayJalaliDateObject());
      setCustomTo(todayJalaliDateObject());
      setAppliedFrom(today);
      setAppliedTo(today);
    }
  };

  const applyCustomRange = () => {
    const from = jalaliYmd(customFrom);
    const to = jalaliYmd(customTo) || from;
    if (!from && !to) {
      toast.error("حداقل یک تاریخ انتخاب کنید");
      return;
    }
    setFilter("custom");
    setAppliedFrom(from || to);
    setAppliedTo(to || from);
  };

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

          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
            {FILTERS.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                clickable
                onClick={() => selectPreset(item.value)}
                sx={{
                  fontWeight: 700,
                  bgcolor: filter === item.value ? "var(--admin-accent)" : "var(--admin-surface)",
                  color: filter === item.value ? "var(--admin-on-accent, #fff)" : "var(--admin-text)",
                  border: "1px solid var(--admin-border)",
                }}
              />
            ))}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                flexWrap: "wrap",
                p: 0.6,
                borderRadius: 2,
                border: filter === "custom" ? "1px solid var(--admin-accent)" : "1px solid var(--admin-border)",
                bgcolor: "var(--admin-surface-alt)",
              }}
            >
              <Typography sx={{ fontSize: 11.5, color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}>
                از
              </Typography>
              <Box sx={datePickerBoxSx}>
                <DatePicker
                  value={customFrom}
                  onChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    setCustomFrom(next || null);
                    setFilter("custom");
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  format="YYYY/MM/DD"
                  editable={false}
                  inputClass="rmdp-input"
                  placeholder="تاریخ شروع"
                />
              </Box>
              <Typography sx={{ fontSize: 11.5, color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}>
                تا
              </Typography>
              <Box sx={datePickerBoxSx}>
                <DatePicker
                  value={customTo}
                  onChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    setCustomTo(next || null);
                    setFilter("custom");
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  format="YYYY/MM/DD"
                  editable={false}
                  inputClass="rmdp-input"
                  placeholder="تاریخ پایان"
                />
              </Box>
              <Button
                size="small"
                variant="contained"
                onClick={applyCustomRange}
                sx={{
                  minWidth: 0,
                  px: 1.25,
                  py: 0.45,
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 1.5,
                  bgcolor: "var(--admin-accent)",
                  color: "var(--admin-on-accent, #fff)",
                  "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                }}
              >
                اعمال
              </Button>
            </Box>
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
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  bgcolor: "var(--admin-surface)",
                  borderRadius: 2.5,
                  border: "1px solid var(--admin-border)",
                  overflowX: "auto",
                }}
              >
                <Table size="small" aria-label="اتفاقات مالی">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell align="right">شرح</StyledTableCell>
                      <StyledTableCell align="right">طرف حساب</StyledTableCell>
                      <StyledTableCell align="center">نوع</StyledTableCell>
                      <StyledTableCell align="center">روش</StyledTableCell>
                      <StyledTableCell align="right">جزئیات</StyledTableCell>
                      <StyledTableCell align="center">زمان</StyledTableCell>
                      <StyledTableCell align="left">مبلغ</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((event) => {
                      const isIn = event.direction === "in";
                      return (
                        <StyledTableRow key={event.id}>
                          <StyledTableCell align="right" sx={{ minWidth: 160 }}>
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
                              <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--admin-text)" }}>
                                {event.title}
                              </Typography>
                            )}
                          </StyledTableCell>
                          <StyledTableCell
                            align="right"
                            sx={{
                              fontWeight: event.party ? 600 : 400,
                              color: event.party ? "var(--admin-text)" : "var(--admin-text-muted)",
                              whiteSpace: "nowrap",
                              maxWidth: 160,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {event.party || "—"}
                          </StyledTableCell>
                          <StyledTableCell align="center">
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: isIn ? "var(--admin-accent)" : "var(--admin-error, #f87171)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isIn ? "دریافتی" : "پرداختی"}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                            {event.method_label || event.method || "—"}
                          </StyledTableCell>
                          <StyledTableCell align="right" sx={{ color: "var(--admin-text-muted)", maxWidth: 220 }}>
                            {event.subtitle || "—"}
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}>
                            {event.at_jalali || "—"}
                          </StyledTableCell>
                          <StyledTableCell
                            align="left"
                            sx={{
                              fontWeight: 800,
                              fontVariantNumeric: "tabular-nums",
                              whiteSpace: "nowrap",
                              color: isIn ? "var(--admin-accent)" : "var(--admin-error, #f87171)",
                            }}
                          >
                            {formatNumber(event.amount)}
                          </StyledTableCell>
                        </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
