"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import TodayIcon from "@mui/icons-material/Today";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: "600",
    fontSize: "13px",
    padding: "12px 10px",
    whiteSpace: "nowrap",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: "13px",
    padding: "10px 8px",
    verticalAlign: "middle",
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": {
    backgroundColor: "var(--admin-surface-alt)",
  },
  "&:hover": {
    backgroundColor: "var(--admin-menu-hover)",
  },
}));

interface SalesSnapshot {
  total_sales: number;
  card_amount: number;
  cash_amount: number;
  installments_collected: number;
  total_collected: number;
  credit_used_total: number;
}

interface DailySalesApiResponse {
  date: string;
  date_jalali?: string;
  total_sales: number;
  cash_amount: number;
  card_amount: number;
  installments_collected: number;
  total_collected: number;
  credit_used_total: number;
}

interface DepositsSnapshot {
  deposit_account_1: number;
  deposit_account_2: number;
  deposit_cash: number;
}

const PERSIAN_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

interface MonthFilter {
  year: number;
  month: number;
  month_name: string;
  is_current_month: boolean;
}

interface DailyReconciliationResponse {
  filter: MonthFilter;
  days_in_month: number;
  from_date_jalali: string;
  to_date_jalali: string;
  daily: DailyReconciliationRow[];
}

export interface DailyReconciliationRow {
  date: string;
  date_jalali?: string;
  day_of_month?: number;
  sales: SalesSnapshot;
  deposits?: DepositsSnapshot | null;
  daily_discrepancy?: number | null;
  cumulative_discrepancy?: number | null;
  editable: boolean;
  is_closed: boolean;
  notes?: string | null;
}

interface DepositDraft {
  deposit_account_1: string;
  deposit_account_2: string;
  deposit_cash: string;
  notes: string;
}

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num));

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function parseAmount(value: string): number {
  const normalized = value
    .replace(/[۰-۹]/g, (c) => String(PERSIAN_DIGITS.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(ARABIC_DIGITS.indexOf(c)))
    .replace(/[,٬\s]/g, "")
    .replace(/\D/g, "");
  if (normalized === "") return 0;
  const n = parseInt(normalized, 10);
  return Number.isNaN(n) ? 0 : n;
}

function formatAmountInput(value: string): string {
  const normalized = value
    .replace(/[۰-۹]/g, (c) => String(PERSIAN_DIGITS.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(ARABIC_DIGITS.indexOf(c)))
    .replace(/[,٬\s]/g, "")
    .replace(/\D/g, "");
  if (normalized === "") return "";
  const n = parseInt(normalized, 10);
  if (Number.isNaN(n)) return "";
  return new Intl.NumberFormat("fa-IR").format(n);
}

function draftsFromRow(row: DailyReconciliationRow): DepositDraft {
  const d = row.deposits;
  return {
    deposit_account_1:
      d?.deposit_account_1 != null && d.deposit_account_1 > 0
        ? formatAmountInput(String(d.deposit_account_1))
        : "",
    deposit_account_2:
      d?.deposit_account_2 != null && d.deposit_account_2 > 0
        ? formatAmountInput(String(d.deposit_account_2))
        : "",
    deposit_cash:
      d?.deposit_cash != null && d.deposit_cash > 0
        ? formatAmountInput(String(d.deposit_cash))
        : "",
    notes: row.notes?.trim() || "",
  };
}

function getApiErrorMessage(res: unknown, fallback: string): string {
  if (!res || typeof res !== "object") return fallback;
  const r = res as Record<string, unknown>;
  if (typeof r.message === "string") return r.message;
  if (typeof r.error === "string") return r.error;
  if (typeof r.errorText === "string") {
    try {
      const parsed = JSON.parse(r.errorText);
      if (typeof parsed.message === "string") return parsed.message;
      if (Array.isArray(parsed.message) && parsed.message[0]?.title) {
        return parsed.message[0].title;
      }
    } catch {
      if (r.errorText && r.errorText !== "fetch failed") return r.errorText;
    }
  }
  return fallback;
}

function getTodayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function filterRowsUpToToday(
  list: DailyReconciliationRow[],
  isCurrentMonth: boolean
): DailyReconciliationRow[] {
  if (!isCurrentMonth) return list;
  const today = getTodayIsoDate();
  return list.filter((row) => row.date <= today);
}

function parseDailySalesResponse(res: unknown): DailySalesApiResponse | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  if (r.hasError) return null;

  const pick = (obj: Record<string, unknown>): DailySalesApiResponse | null => {
    if (typeof obj.date !== "string") return null;
    return {
      date: obj.date,
      date_jalali: typeof obj.date_jalali === "string" ? obj.date_jalali : undefined,
      total_sales: Math.floor(Number(obj.total_sales) || 0),
      cash_amount: Math.floor(Number(obj.cash_amount) || 0),
      card_amount: Math.floor(Number(obj.card_amount) || 0),
      installments_collected: Math.floor(Number(obj.installments_collected) || 0),
      total_collected: Math.floor(Number(obj.total_collected) || 0),
      credit_used_total: Math.floor(Number(obj.credit_used_total) || 0),
    };
  };

  const direct = pick(r);
  if (direct) return direct;

  if (r.data && typeof r.data === "object") {
    return pick(r.data as Record<string, unknown>);
  }

  return null;
}

function salesField(
  source: Record<string, unknown>,
  nested: Record<string, unknown>,
  key: keyof SalesSnapshot
): number {
  const raw = nested[key] ?? source[key];
  return Math.floor(Number(raw) || 0);
}

function salesSnapshotFromRecord(source: Record<string, unknown>): SalesSnapshot {
  const nested =
    source.sales && typeof source.sales === "object"
      ? (source.sales as Record<string, unknown>)
      : {};
  return {
    total_sales: salesField(source, nested, "total_sales"),
    cash_amount: salesField(source, nested, "cash_amount"),
    card_amount: salesField(source, nested, "card_amount"),
    installments_collected: salesField(source, nested, "installments_collected"),
    total_collected: salesField(source, nested, "total_collected"),
    credit_used_total: salesField(source, nested, "credit_used_total"),
  };
}

function salesSnapshotFromDailySales(data: DailySalesApiResponse): SalesSnapshot {
  return salesSnapshotFromRecord(data as unknown as Record<string, unknown>);
}

function depositsSnapshotFromRecord(
  source: Record<string, unknown>
): DepositsSnapshot | null {
  const nested = source.deposits;
  const d =
    nested && typeof nested === "object"
      ? (nested as Record<string, unknown>)
      : source.deposit_account_1 != null ||
          source.deposit_account_2 != null ||
          source.deposit_cash != null
        ? source
        : null;
  if (!d) return null;
  return {
    deposit_account_1: Math.floor(Number(d.deposit_account_1) || 0),
    deposit_account_2: Math.floor(Number(d.deposit_account_2) || 0),
    deposit_cash: Math.floor(Number(d.deposit_cash) || 0),
  };
}

function normalizeDailyRow(raw: unknown): DailyReconciliationRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.date !== "string") return null;

  return {
    date: r.date,
    date_jalali: typeof r.date_jalali === "string" ? r.date_jalali : undefined,
    day_of_month:
      typeof r.day_of_month === "number"
        ? r.day_of_month
        : Number.isFinite(Number(r.day_of_month))
          ? Number(r.day_of_month)
          : undefined,
    sales: salesSnapshotFromRecord(r),
    deposits: depositsSnapshotFromRecord(r),
    daily_discrepancy:
      r.daily_discrepancy != null && r.daily_discrepancy !== ""
        ? Math.floor(Number(r.daily_discrepancy) || 0)
        : null,
    cumulative_discrepancy:
      r.cumulative_discrepancy != null && r.cumulative_discrepancy !== ""
        ? Math.floor(Number(r.cumulative_discrepancy) || 0)
        : null,
    editable: Boolean(r.editable),
    is_closed: Boolean(r.is_closed),
    notes: typeof r.notes === "string" ? r.notes : null,
  };
}

function shiftPersianMonth(year: number, month: number, delta: number): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return { year: y, month: m };
}

function buildReconciliationUrl(year?: number, month?: number): string {
  if (year != null && month != null) {
    return `/api/daily-reconciliations?year=${year}&month=${month}`;
  }
  return "/api/daily-reconciliations";
}

function parseReconciliationResponse(res: unknown): DailyReconciliationResponse | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  if (r.hasError) return null;

  const pick = (obj: Record<string, unknown>): DailyReconciliationResponse | null => {
    if (!Array.isArray(obj.daily) || !obj.filter) return null;
    const daily = obj.daily
      .map((item) => normalizeDailyRow(item))
      .filter((row): row is DailyReconciliationRow => row != null);
    const filter = obj.filter as MonthFilter;
    return {
      filter,
      days_in_month: Math.floor(Number(obj.days_in_month) || daily.length),
      from_date_jalali: String(obj.from_date_jalali ?? ""),
      to_date_jalali: String(obj.to_date_jalali ?? ""),
      daily,
    };
  };

  const direct = pick(r);
  if (direct) return direct;

  if (r.data && typeof r.data === "object") {
    return pick(r.data as Record<string, unknown>);
  }

  return null;
}

function depositTotal(draft: DepositDraft): number {
  return (
    parseAmount(draft.deposit_account_1) +
    parseAmount(draft.deposit_account_2) +
    parseAmount(draft.deposit_cash)
  );
}

const amountFieldSx = {
  minWidth: 100,
  maxWidth: 130,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: "12px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": {
    color: "var(--admin-text)",
    textAlign: "left",
    direction: "ltr",
    py: 0.75,
    px: 1,
  },
};

const amountFieldSxFull = {
  ...amountFieldSx,
  minWidth: "100%",
  maxWidth: "100%",
  width: "100%",
};

function rowDateLabel(
  row: DailyReconciliationRow,
  monthFilter: MonthFilter | null
): string {
  return (
    row.date_jalali ||
    (row.day_of_month != null && monthFilter
      ? `${monthFilter.month_name} ${row.day_of_month}`
      : row.date)
  );
}

function rowDisplayDiscrepancy(
  row: DailyReconciliationRow,
  draft: DepositDraft | undefined
): number | null | undefined {
  if (row.is_closed || !row.editable) return row.daily_discrepancy;
  if (row.editable && draft) {
    return depositTotal(draft) - (row.sales?.total_collected ?? 0);
  }
  return row.daily_discrepancy;
}

function RowStatusChip({ row }: { row: DailyReconciliationRow }) {
  if (row.is_closed) {
    return <Chip label="ثبت شده" size="small" color="success" variant="outlined" />;
  }
  if (row.editable) {
    return (
      <Chip
        label="قابل ویرایش"
        size="small"
        sx={{ borderColor: "var(--admin-accent)", color: "var(--admin-accent)" }}
        variant="outlined"
      />
    );
  }
  return (
    <Chip label="فقط نمایش" size="small" variant="outlined" sx={{ color: "var(--admin-text-muted)" }} />
  );
}

function MobileStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Box>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.25 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: accent ? "var(--admin-accent)" : "var(--admin-text)",
          fontWeight: accent ? 700 : 500,
          fontSize: 13,
        }}
      >
        {formatNumber(value)}
      </Typography>
    </Box>
  );
}

function DiscrepancyCell({ value }: { value: number | null | undefined }) {
  if (value == null) {
    return (
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>
        —
      </Typography>
    );
  }
  const color =
    value > 0 ? "#4ade80" : value < 0 ? "#f87171" : "var(--admin-text-muted)";
  return (
    <Typography sx={{ color, fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap" }}>
      {formatNumber(value)}
    </Typography>
  );
}

export default function DailyReconciliationPage() {
  const [rows, setRows] = useState<DailyReconciliationRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DepositDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [refreshingSalesDate, setRefreshingSalesDate] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<MonthFilter | null>(null);
  const [rangeInfo, setRangeInfo] = useState<{
    from: string;
    to: string;
    days: number;
  } | null>(null);

  const fetchGrid = useCallback(async (year?: number, month?: number) => {
    setLoading(true);
    const token = tokenCode();
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        buildReconciliationUrl(year, month),
        true,
        true,
        token
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت گرید تطبیق روزانه"));
        setRows([]);
        setDrafts({});
        setMonthFilter(null);
        setRangeInfo(null);
        return;
      }
      const payload = parseReconciliationResponse(res);
      if (!payload) {
        toast.error("ساختار پاسخ سرور نامعتبر است");
        setRows([]);
        setDrafts({});
        return;
      }
      setMonthFilter(payload.filter);
      setRangeInfo({
        from: payload.from_date_jalali,
        to: payload.to_date_jalali,
        days: payload.days_in_month,
      });
      const list = payload.daily;
      setRows(list);
      const nextDrafts: Record<string, DepositDraft> = {};
      list.forEach((row) => {
        nextDrafts[row.date] = draftsFromRow(row);
      });
      setDrafts(nextDrafts);
    } catch {
      toast.error("خطا در دریافت گرید تطبیق روزانه");
      setRows([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  const goPrevMonth = () => {
    if (!monthFilter) return;
    const { year, month } = shiftPersianMonth(monthFilter.year, monthFilter.month, -1);
    fetchGrid(year, month);
  };

  const goNextMonth = () => {
    if (!monthFilter) return;
    const { year, month } = shiftPersianMonth(monthFilter.year, monthFilter.month, 1);
    fetchGrid(year, month);
  };

  const goCurrentMonth = () => fetchGrid();

  const handleYearMonthSelect = (year: number, month: number) => {
    fetchGrid(year, month);
  };

  const visibleRows = useMemo(
    () => filterRowsUpToToday(rows, monthFilter?.is_current_month ?? false),
    [rows, monthFilter?.is_current_month]
  );

  const latestCumulative = useMemo(() => {
    if (!visibleRows.length) return null;
    const withCumulative = visibleRows.filter((r) => r.cumulative_discrepancy != null);
    if (!withCumulative.length) return null;
    const last = withCumulative[withCumulative.length - 1];
    return last.cumulative_discrepancy ?? null;
  }, [visibleRows]);

  const yearOptions = useMemo(() => {
    const base = monthFilter?.year ?? 1404;
    return Array.from({ length: 11 }, (_, i) => base - 5 + i);
  }, [monthFilter?.year]);

  const updateDraft = (date: string, patch: Partial<DepositDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [date]: { ...prev[date], ...patch },
    }));
  };

  const handleRefreshSales = async (row: DailyReconciliationRow) => {
    setRefreshingSalesDate(row.date);
    const token = tokenCode();
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        `/api/dashboard/daily-sales?date=${encodeURIComponent(row.date)}`,
        true,
        true,
        token
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت فروش روزانه"));
        return;
      }
      const salesData = parseDailySalesResponse(res);
      if (!salesData) {
        toast.error("ساختار پاسخ فروش روزانه نامعتبر است");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.date === row.date
            ? {
                ...r,
                date_jalali: salesData.date_jalali ?? r.date_jalali,
                sales: salesSnapshotFromDailySales(salesData),
              }
            : r
        )
      );
      toast.success(`فروش ${salesData.date_jalali || row.date} به‌روز شد`);
    } catch {
      toast.error("خطا در دریافت فروش روزانه");
    } finally {
      setRefreshingSalesDate(null);
    }
  };

  const handleSave = async (row: DailyReconciliationRow) => {
    const draft = drafts[row.date];
    if (!draft) return;

    setSavingDate(row.date);
    const token = tokenCode();
    const sales = row.sales;
    const body = {
      date: row.date,
      total_sales: sales?.total_sales ?? 0,
      cash_amount: sales?.cash_amount ?? 0,
      card_amount: sales?.card_amount ?? 0,
      installments_collected: sales?.installments_collected ?? 0,
      total_collected: sales?.total_collected ?? 0,
      credit_used_total: sales?.credit_used_total ?? 0,
      deposit_account_1: parseAmount(draft.deposit_account_1),
      deposit_account_2: parseAmount(draft.deposit_account_2),
      deposit_cash: parseAmount(draft.deposit_cash),
      ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
    };

    try {
      const res = await apiRequestError(
        "Post",
        {},
        body,
        "/api/daily-reconciliations",
        true,
        true,
        token
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ثبت تطبیق روزانه"));
        return;
      }
      toast.success(`تطبیق ${row.date_jalali || row.date} ثبت شد و اسناد واریز به‌روز شد`);
      if (monthFilter) {
        await fetchGrid(monthFilter.year, monthFilter.month);
      } else {
        await fetchGrid();
      }
    } catch {
      toast.error("خطا در ثبت تطبیق روزانه");
    } finally {
      setSavingDate(null);
    }
  };

  const renderAmountCell = (
    row: DailyReconciliationRow,
    field: keyof Omit<DepositDraft, "notes">,
    fullWidth = false
  ) => {
    const draft = drafts[row.date];
    if (!row.editable) {
      const val = row.deposits?.[field] ?? 0;
      return (
        <Typography sx={{ color: "var(--admin-text)", fontSize: "13px" }}>
          {val > 0 ? formatNumber(val) : "—"}
        </Typography>
      );
    }
    if (!draft) return null;
    return (
      <TextField
        size="small"
        value={draft[field]}
        onChange={(e) => {
          updateDraft(row.date, { [field]: formatAmountInput(e.target.value) });
        }}
        placeholder="۰"
        sx={fullWidth ? amountFieldSxFull : amountFieldSx}
      />
    );
  };

  const reversedVisibleRows = useMemo(
    () => [...visibleRows].reverse(),
    [visibleRows]
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        paddingTop: { xs: "12px", md: "24px" },
        paddingBottom: { xs: "100px", md: "40px" },
        direction: "rtl",
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <AccountBalanceWalletIcon sx={{ color: "var(--admin-accent)", fontSize: 32 }} />
            <Box>
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>
                تطبیق روزانه فروش و واریز
              </Typography>
             
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Paper
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.5,
                backgroundColor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                borderRadius: 2,
              }}
            >
              <IconButton
                size="small"
                onClick={goPrevMonth}
                disabled={loading || !monthFilter}
                aria-label="ماه قبل"
                sx={{ color: "var(--admin-text)" }}
              >
                <ChevronRightIcon />
              </IconButton>
              <FormControl size="small" sx={{ minWidth: 72 }}>
                <Select
                  value={monthFilter?.month ?? ""}
                  displayEmpty
                  disabled={!monthFilter || loading}
                  onChange={(e) => {
                    if (!monthFilter) return;
                    handleYearMonthSelect(monthFilter.year, Number(e.target.value));
                  }}
                  sx={{
                    color: "var(--admin-text)",
                    fontSize: 13,
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                >
                  {PERSIAN_MONTH_NAMES.map((name, idx) => (
                    <MenuItem key={name} value={idx + 1}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={monthFilter?.year ?? ""}
                  displayEmpty
                  disabled={!monthFilter || loading}
                  onChange={(e) => {
                    if (!monthFilter) return;
                    handleYearMonthSelect(Number(e.target.value), monthFilter.month);
                  }}
                  sx={{
                    color: "var(--admin-text)",
                    fontSize: 13,
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                >
                  {yearOptions.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                onClick={goNextMonth}
                disabled={loading || !monthFilter || monthFilter.is_current_month}
                aria-label="ماه بعد"
                sx={{ color: "var(--admin-text)" }}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Paper>
            {!monthFilter?.is_current_month && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<TodayIcon />}
                onClick={goCurrentMonth}
                disabled={loading}
                sx={{
                  color: "var(--admin-accent)",
                  borderColor: "var(--admin-accent)",
                }}
              >
                ماه جاری
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() =>
                monthFilter ? fetchGrid(monthFilter.year, monthFilter.month) : fetchGrid()
              }
              disabled={loading}
              sx={{
                color: "var(--admin-text)",
                borderColor: "var(--admin-border)",
                "&:hover": { borderColor: "var(--admin-accent)" },
              }}
            >
              بروزرسانی
            </Button>
          </Box>
        </Box>

        <Card
          sx={{
            mb: 2,
            backgroundColor: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, lineHeight: 1.7 }}>
              {monthFilter && (
                <>
                  <Box component="span" sx={{ color: "var(--admin-text)", fontWeight: 700 }}>
                    {monthFilter.month_name} {monthFilter.year}
                  </Box>
                  {rangeInfo && (
                    <>
                      {" "}
                      — از {rangeInfo.from} تا{" "}
                      {monthFilter.is_current_month ? "امروز" : rangeInfo.to} (
                      {visibleRows.length} روز)
                    </>
                  )}
                  {monthFilter.is_current_month && (
                    <Chip label="ماه جاری" size="small" sx={{ ml: 1, height: 22, fontSize: 11 }} color="primary" variant="outlined" />
                  )}
                  <br />
                </>
              )}
            
              {latestCumulative != null && (
                <>
                  {" "}
                  — آخرین اختلاف تجمعی در این ماه:{" "}
                  <Box component="span" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                    {formatNumber(latestCumulative)} تومان
                  </Box>
                </>
              )}
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : visibleRows.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              backgroundColor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              borderRadius: 2,
            }}
          >
            <Typography sx={{ color: "var(--admin-text-muted)" }}>رکوردی یافت نشد</Typography>
          </Paper>
        ) : (
          <>
          <TableContainer
            component={Paper}
            sx={{
              display: { xs: "none", md: "block" },
              backgroundColor: "var(--admin-surface)",
              borderRadius: 2,
              border: "1px solid var(--admin-border)",
              overflowX: "auto",
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell align="right">تاریخ</StyledTableCell>
                  <StyledTableCell align="right">فروش</StyledTableCell>
                  <StyledTableCell align="right">نقد </StyledTableCell>
                  <StyledTableCell align="right">کارت</StyledTableCell>
                  <StyledTableCell align="right">اقساط</StyledTableCell>
                  <StyledTableCell align="right">جمع وصول</StyledTableCell>
                  <StyledTableCell align="right">اعتبار مشتری مصرف‌شده آن روز</StyledTableCell>
                  <StyledTableCell align="center">بروزرسانی </StyledTableCell>
                  <StyledTableCell
                    align="right"
                    sx={{ borderRight: "2px solid var(--admin-accent)", bgcolor: "rgba(120,181,104,0.08)" }}
                  >
                    حساب ۱
                  </StyledTableCell>
                  <StyledTableCell align="right" sx={{ bgcolor: "rgba(120,181,104,0.08)" }}>
                    حساب ۲
                  </StyledTableCell>
                  <StyledTableCell align="right" sx={{ bgcolor: "rgba(120,181,104,0.08)" }}>
                    نقدی
                  </StyledTableCell>
                  <StyledTableCell align="right">اختلاف روز</StyledTableCell>
                  <StyledTableCell align="right">تجمعی</StyledTableCell>
                  <StyledTableCell align="right">یادداشت</StyledTableCell>
                  <StyledTableCell align="center">وضعیت</StyledTableCell>
                  <StyledTableCell align="center">ثبت</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reversedVisibleRows.map((row) => {
                  const draft = drafts[row.date];
                  const displayDisc = rowDisplayDiscrepancy(row, draft);

                  return (
                    <StyledTableRow key={row.date}>
                      <StyledTableCell align="right">
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                          {rowDateLabel(row, monthFilter)}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {formatNumber(row.sales?.total_sales ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {formatNumber(row.sales?.cash_amount ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {formatNumber(row.sales?.card_amount ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {formatNumber(row.sales?.installments_collected ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Typography sx={{ fontWeight: 700, color: "var(--admin-accent)" }}>
                          {formatNumber(row.sales?.total_collected ?? 0)}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {formatNumber(row.sales?.credit_used_total ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={refreshingSalesDate === row.date}
                          startIcon={
                            refreshingSalesDate === row.date ? (
                              <CircularProgress size={14} />
                            ) : (
                              <SyncIcon fontSize="small" />
                            )
                          }
                          onClick={() => handleRefreshSales(row)}
                          sx={{
                            fontSize: 11,
                            minWidth: 88,
                            color: "var(--admin-text)",
                            borderColor: "var(--admin-border)",
                            "&:hover": { borderColor: "var(--admin-accent)" },
                          }}
                        >
                          بروزرسانی
                        </Button>
                      </StyledTableCell>
                      <StyledTableCell
                        align="right"
                        sx={{ borderRight: "2px solid var(--admin-accent-border)" }}
                      >
                        {renderAmountCell(row, "deposit_account_1")}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {renderAmountCell(row, "deposit_account_2")}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {renderAmountCell(row, "deposit_cash")}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <DiscrepancyCell value={displayDisc ?? null} />
                        {row.editable && !row.is_closed && draft && (
                          <Typography sx={{ fontSize: 10, color: "var(--admin-text-muted)", mt: 0.25 }}>
                            پیش‌نمایش
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <DiscrepancyCell value={row.cumulative_discrepancy} />
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.editable && draft ? (
                          <TextField
                            size="small"
                            placeholder="اختیاری"
                            value={draft.notes}
                            onChange={(e) => updateDraft(row.date, { notes: e.target.value })}
                            sx={{
                              minWidth: 100,
                              maxWidth: 160,
                              "& .MuiOutlinedInput-root": {
                                backgroundColor: "var(--admin-surface-alt)",
                                fontSize: "12px",
                                "& fieldset": { borderColor: "var(--admin-border)" },
                              },
                              "& .MuiInputBase-input": {
                                color: "var(--admin-text)",
                                py: 0.75,
                              },
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{
                              color: "var(--admin-text-muted)",
                              fontSize: "12px",
                              maxWidth: 140,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.notes?.trim() || "—"}
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {row.is_closed ? (
                          <Chip label="ثبت شده" size="small" color="success" variant="outlined" />
                        ) : row.editable ? (
                          <Chip label="قابل ویرایش" size="small" sx={{ borderColor: "var(--admin-accent)", color: "var(--admin-accent)" }} variant="outlined" />
                        ) : (
                          <Chip label="فقط نمایش" size="small" variant="outlined" sx={{ color: "var(--admin-text-muted)" }} />
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {row.editable ? (
                          <Button
                            size="small"
                            variant="contained"
                            disabled={savingDate === row.date}
                            startIcon={
                              savingDate === row.date ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <SaveIcon fontSize="small" />
                              )
                            }
                            onClick={() => handleSave(row)}
                            sx={{
                              backgroundColor: "var(--admin-accent)",
                              fontSize: 11,
                              minWidth: 72,
                              "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
                            }}
                          >
                            ثبت
                          </Button>
                        ) : (
                          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>—</Typography>
                        )}
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 2 }}>
            {reversedVisibleRows.map((row) => {
              const draft = drafts[row.date];
              const displayDisc = rowDisplayDiscrepancy(row, draft);
              const sales = row.sales;

              return (
                <Card
                  key={row.date}
                  sx={{
                    backgroundColor: "var(--admin-surface)",
                    borderRadius: "16px",
                    border: "1px solid var(--admin-border)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "rgba(120, 181, 104, 0.4)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 16 }}>
                        {rowDateLabel(row, monthFilter)}
                      </Typography>
                      <RowStatusChip row={row} />
                    </Box>

                    <Divider sx={{ borderColor: "var(--admin-divider)", mb: 1.5 }} />

                    <Typography
                      sx={{
                        color: "var(--admin-text-muted)",
                        fontSize: 12,
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      فروش و وصول
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.25,
                        mb: 1.5,
                      }}
                    >
                      <MobileStat label="فروش" value={sales?.total_sales ?? 0} />
                      <MobileStat label="نقد" value={sales?.cash_amount ?? 0} />
                      <MobileStat label="کارت" value={sales?.card_amount ?? 0} />
                      <MobileStat label="اقساط" value={sales?.installments_collected ?? 0} />
                      <MobileStat label="جمع وصول" value={sales?.total_collected ?? 0} accent />
                      <MobileStat
                        label="اعتبار مشتری مصرف‌شده آن روز"
                        value={sales?.credit_used_total ?? 0}
                      />
                    </Box>

                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      disabled={refreshingSalesDate === row.date}
                      startIcon={
                        refreshingSalesDate === row.date ? (
                          <CircularProgress size={14} />
                        ) : (
                          <SyncIcon fontSize="small" />
                        )
                      }
                      onClick={() => handleRefreshSales(row)}
                      sx={{
                        mb: 1.5,
                        color: "var(--admin-text)",
                        borderColor: "var(--admin-border)",
                        "&:hover": { borderColor: "var(--admin-accent)" },
                      }}
                    >
                      بروزرسانی فروش
                    </Button>

                    <Divider sx={{ borderColor: "var(--admin-divider)", mb: 1.5 }} />

                    <Typography
                      sx={{
                        color: "var(--admin-accent)",
                        fontSize: 12,
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      واریز
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 1.5 }}>
                      <Box>
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.5 }}>
                          حساب ۱
                        </Typography>
                        {renderAmountCell(row, "deposit_account_1", true)}
                      </Box>
                      <Box>
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.5 }}>
                          حساب ۲
                        </Typography>
                        {renderAmountCell(row, "deposit_account_2", true)}
                      </Box>
                      <Box>
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.5 }}>
                          نقدی
                        </Typography>
                        {renderAmountCell(row, "deposit_cash", true)}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.25,
                        mb: 1.5,
                      }}
                    >
                      <Box>
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.5 }}>
                          اختلاف روز
                          {row.editable && !row.is_closed && draft ? " (پیش‌نمایش)" : ""}
                        </Typography>
                        <DiscrepancyCell value={displayDisc ?? null} />
                      </Box>
                      <Box>
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.5 }}>
                          تجمعی
                        </Typography>
                        <DiscrepancyCell value={row.cumulative_discrepancy} />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.5 }}>
                        یادداشت
                      </Typography>
                      {row.editable && draft ? (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="اختیاری"
                          value={draft.notes}
                          onChange={(e) => updateDraft(row.date, { notes: e.target.value })}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "var(--admin-surface-alt)",
                              fontSize: "12px",
                              "& fieldset": { borderColor: "var(--admin-border)" },
                            },
                            "& .MuiInputBase-input": { color: "var(--admin-text)" },
                          }}
                        />
                      ) : (
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                          {row.notes?.trim() || "—"}
                        </Typography>
                      )}
                    </Box>

                    {row.editable ? (
                      <Button
                        fullWidth
                        size="medium"
                        variant="contained"
                        disabled={savingDate === row.date}
                        startIcon={
                          savingDate === row.date ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        onClick={() => handleSave(row)}
                        sx={{
                          backgroundColor: "var(--admin-accent)",
                          "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
                        }}
                      >
                        ثبت تطبیق
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
          </>
        )}

        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
