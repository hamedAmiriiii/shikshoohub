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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import TodayIcon from "@mui/icons-material/Today";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text-muted)",
    fontWeight: 700,
    fontSize: "12px",
    padding: "10px 8px",
    whiteSpace: "nowrap",
    lineHeight: 1.3,
    borderBottom: "1px solid var(--admin-border)",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: "12px",
    padding: "10px 8px",
    verticalAlign: "middle",
    lineHeight: 1.35,
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

interface SalesSnapshot {
  total_sales: number;
  card_amount: number;
  cash_amount: number;
  installments_collected: number;
  debts_collected: number;
  discount_given: number;
  total_collected: number;
  credit_used_total: number;
  uncollected_debts: number;
}

interface DepositsSnapshot {
  deposit_account_1: number;
  deposit_account_2: number;
  deposit_cash: number;
  account_deposits: AccountDeposit[];
}

interface AccountDeposit {
  shop_account_id: number;
  amount: number;
}

interface ShopAccount {
  id: number;
  name: string;
  balance: number;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

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
  shop_accounts: ShopAccount[];
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
  /** مبلغ واریز به هر حساب — کلید = shop_account_id */
  accounts: Record<string, string>;
  deposit_cash: string;
  notes: string;
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

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num));

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const WEEKDAY_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

function toFaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

function parseJalaliParts(
  row: DailyReconciliationRow,
  monthFilter: MonthFilter | null
): { year: number; month: number; day: number } | null {
  const raw = String(row.date_jalali || "").trim().replace(/\//g, "-");
  const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  }
  if (row.day_of_month != null && monthFilter) {
    return {
      year: monthFilter.year,
      month: monthFilter.month,
      day: row.day_of_month,
    };
  }
  return null;
}

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

function emptyAccountDraftMap(accounts: ShopAccount[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const account of accounts) {
    map[String(account.id)] = "";
  }
  return map;
}

function amountFromAccountDeposits(
  deposits: AccountDeposit[] | undefined,
  accountId: number
): number {
  if (!deposits?.length) return 0;
  const hit = deposits.find((item) => Number(item.shop_account_id) === accountId);
  return Math.floor(Number(hit?.amount) || 0);
}

function draftsFromRow(row: DailyReconciliationRow, accounts: ShopAccount[]): DepositDraft {
  const d = row.deposits;
  const accountDrafts = emptyAccountDraftMap(accounts);

  if (d?.account_deposits?.length) {
    for (const item of d.account_deposits) {
      const key = String(item.shop_account_id);
      if (!(key in accountDrafts)) continue;
      const amount = Math.floor(Number(item.amount) || 0);
      accountDrafts[key] = amount > 0 ? formatAmountInput(String(amount)) : "";
    }
  } else if (accounts.length > 0) {
    // سازگاری با داده قدیمی deposit_account_1 / deposit_account_2
    const a1 = Math.floor(Number(d?.deposit_account_1) || 0);
    const a2 = Math.floor(Number(d?.deposit_account_2) || 0);
    if (accounts[0] && a1 > 0) {
      accountDrafts[String(accounts[0].id)] = formatAmountInput(String(a1));
    }
    if (accounts[1] && a2 > 0) {
      accountDrafts[String(accounts[1].id)] = formatAmountInput(String(a2));
    }
  }

  return {
    accounts: accountDrafts,
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
    debts_collected: salesField(source, nested, "debts_collected"),
    discount_given: salesField(source, nested, "discount_given"),
    total_collected: salesField(source, nested, "total_collected"),
    credit_used_total: salesField(source, nested, "credit_used_total"),
    uncollected_debts: salesField(source, nested, "uncollected_debts"),
  };
}

function parseAccountDeposits(raw: unknown): AccountDeposit[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const shopAccountId = Number(row.shop_account_id ?? row.account_id);
      if (!Number.isFinite(shopAccountId) || shopAccountId <= 0) return null;
      return {
        shop_account_id: shopAccountId,
        amount: Math.floor(Number(row.amount) || 0),
      };
    })
    .filter((item): item is AccountDeposit => item != null);
}

function parseShopAccounts(raw: unknown): ShopAccount[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      if (!Number.isFinite(id) || id <= 0) return null;
      if (row.is_active === false) return null;
      // تنخواه در تطبیق روزانه نیست — واریز روزانه فقط به حساب اصلی
      if (row.type === "petty_cash") return null;
      return {
        id,
        name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : `حساب ${id}`,
        balance: Math.floor(Number(row.balance) || 0),
        is_default: Boolean(row.is_default),
        is_active: row.is_active !== false,
        sort_order:
          row.sort_order != null && Number.isFinite(Number(row.sort_order))
            ? Number(row.sort_order)
            : undefined,
      };
    })
    .filter((item): item is ShopAccount => item != null)
    .sort((a, b) => (a.sort_order ?? a.id) - (b.sort_order ?? b.id));
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
          source.deposit_cash != null ||
          source.account_deposits != null
        ? source
        : null;
  if (!d) return null;
  const accountDeposits = parseAccountDeposits(
    d.account_deposits ?? source.account_deposits
  );
  return {
    deposit_account_1: Math.floor(Number(d.deposit_account_1) || 0),
    deposit_account_2: Math.floor(Number(d.deposit_account_2) || 0),
    deposit_cash: Math.floor(Number(d.deposit_cash) || 0),
    account_deposits: accountDeposits,
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
      shop_accounts: parseShopAccounts(obj.shop_accounts),
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
  const accountsSum = Object.values(draft.accounts || {}).reduce(
    (sum, value) => sum + parseAmount(value),
    0
  );
  return accountsSum + parseAmount(draft.deposit_cash);
}

function calculateDailyDiscrepancy(
  sales: SalesSnapshot | undefined,
  depositsTotal: number
): number {
  const totalCollected = sales?.total_collected ?? 0;
  return depositsTotal - totalCollected;
}

function hasDepositDraftInput(draft: DepositDraft): boolean {
  if (draft.deposit_cash.trim() !== "") return true;
  return Object.values(draft.accounts || {}).some((value) => value.trim() !== "");
}

/** اختلاف روز = جمع وصول − مجموع واریزها */
function previewDailyDiscrepancy(
  draft: DepositDraft,
  sales: SalesSnapshot | undefined
): number {
  if (!hasDepositDraftInput(draft)) return 0;
  
  return calculateDailyDiscrepancy(sales, depositTotal(draft));
}

const amountFieldSx = {
  minWidth: 72,
  maxWidth: 84,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: "11px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": {
    color: "var(--admin-text)",
    textAlign: "left",
    direction: "ltr",
    py: 0.35,
    px: 0.5,
    fontSize: "11px",
  },
};

const amountFieldSxFull = {
  ...amountFieldSx,
  minWidth: "100%",
  maxWidth: "100%",
  width: "100%",
  "& .MuiOutlinedInput-root": {
    ...amountFieldSx["& .MuiOutlinedInput-root"],
    borderRadius: 1.5,
    fontSize: "13px",
  },
  "& .MuiInputBase-input": {
    ...amountFieldSx["& .MuiInputBase-input"],
    textAlign: "right",
    direction: "rtl",
    py: 0.85,
    px: 1,
    fontSize: "13px",
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
};

function rowDateLabel(
  row: DailyReconciliationRow,
  monthFilter: MonthFilter | null,
  opts?: { withWeekday?: boolean }
): string {
  const parts = parseJalaliParts(row, monthFilter);
  if (parts && parts.month >= 1 && parts.month <= 12) {
    const monthName = PERSIAN_MONTH_NAMES[parts.month - 1] || monthFilter?.month_name || "";
    const dateText = `${toFaDigits(parts.day)} ${monthName} ${toFaDigits(parts.year)}`;
    if (opts?.withWeekday && row.date) {
      const g = new Date(`${row.date}T12:00:00`);
      if (!Number.isNaN(g.getTime())) {
        return `${WEEKDAY_FA[g.getDay()]} ${dateText}`;
      }
    }
    return dateText;
  }
  return row.date_jalali ? toFaDigits(row.date_jalali.replace(/-/g, "/")) : row.date;
}

function rowDisplayDiscrepancy(
  row: DailyReconciliationRow,
  draft: DepositDraft | undefined
): number | null | undefined {
  if (row.is_closed || !row.editable) return row.daily_discrepancy;
  if (row.editable && draft) {
    return previewDailyDiscrepancy(draft, row.sales);
  }
  return row.daily_discrepancy;
}

function depositsTotalForTone(
  row: DailyReconciliationRow,
  draft: DepositDraft | undefined,
  accounts: ShopAccount[]
): number {
  if (row.editable && draft && hasDepositDraftInput(draft)) {
    return depositTotal(draft);
  }
  const deposits = row.deposits;
  if (deposits?.account_deposits?.length) {
    return (
      deposits.account_deposits.reduce((sum, item) => sum + Math.floor(Number(item.amount) || 0), 0) +
      Math.floor(Number(deposits.deposit_cash) || 0)
    );
  }
  if (accounts.length > 0) {
    return (
      Math.floor(Number(deposits?.deposit_account_1) || 0) +
      Math.floor(Number(deposits?.deposit_account_2) || 0) +
      Math.floor(Number(deposits?.deposit_cash) || 0)
    );
  }
  return Math.floor(Number(deposits?.deposit_cash) || 0);
}

function depositAmountForAccount(
  row: DailyReconciliationRow,
  account: ShopAccount,
  accountIndex: number
): number {
  const deposits = row.deposits;
  if (!deposits) return 0;
  if (deposits.account_deposits?.length) {
    return amountFromAccountDeposits(deposits.account_deposits, account.id);
  }
  if (accountIndex === 0) return Math.floor(Number(deposits.deposit_account_1) || 0);
  if (accountIndex === 1) return Math.floor(Number(deposits.deposit_account_2) || 0);
  return 0;
}

function buildCumulativePreviewByDate(
  rows: DailyReconciliationRow[],
  drafts: Record<string, DepositDraft>
): Record<string, number> {
  const map: Record<string, number> = {};
  let running = 0;
  let hasRunning = false;

  for (const row of rows) {
    const draft = drafts[row.date];
    let daily: number | null | undefined;

    if (row.is_closed || !row.editable) {
      daily = row.daily_discrepancy;
    } else if (row.editable && draft) {
      if (!hasDepositDraftInput(draft)) {
        if (hasRunning) {
          map[row.date] = running;
        } else if (row.cumulative_discrepancy != null) {
          running = row.cumulative_discrepancy;
          hasRunning = true;
          map[row.date] = running;
        }
        continue;
      }
      daily = previewDailyDiscrepancy(draft, row.sales);
    } else {
      daily = row.daily_discrepancy;
    }

    if (daily != null) {
      running = hasRunning ? running + daily : daily;
      hasRunning = true;
      map[row.date] = running;
    } else if (row.cumulative_discrepancy != null) {
      running = row.cumulative_discrepancy;
      hasRunning = true;
      map[row.date] = running;
    }
  }

  return map;
}

function RowStatusChip({ row }: { row: DailyReconciliationRow }) {
  if (row.is_closed) {
    return (
      <Chip
        label="ثبت‌شده"
        size="small"
        sx={{
          height: 24,
          fontSize: 11,
          fontWeight: 700,
          bgcolor: "rgba(120, 181, 104, 0.16)",
          color: "var(--admin-accent)",
          border: "none",
        }}
      />
    );
  }
  if (row.editable) {
    return (
      <Chip
        label="باز"
        size="small"
        sx={{
          height: 24,
          fontSize: 11,
          fontWeight: 700,
          bgcolor: "rgba(255, 193, 7, 0.14)",
          color: "var(--admin-warning, #fbbf24)",
          border: "none",
        }}
      />
    );
  }
  return (
    <Chip
      label="بسته"
      size="small"
      sx={{
        height: 24,
        fontSize: 11,
        bgcolor: "var(--admin-surface-alt)",
        color: "var(--admin-text-muted)",
        border: "none",
      }}
    />
  );
}

function MobileStat({
  label,
  value,
  accent,
  boxed,
}: {
  label: string;
  value: number;
  accent?: boolean;
  boxed?: boolean;
}) {
  return (
    <Box
      sx={
        boxed
          ? {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              px: 1.1,
              py: 0.85,
              borderRadius: 1.5,
              bgcolor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              minWidth: 0,
            }
          : undefined
      }
    >
      <Typography
        sx={{
          color: "var(--admin-text-muted)",
          fontSize: boxed ? 12 : 11,
          mb: boxed ? 0 : 0.25,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: accent ? "var(--admin-accent)" : "var(--admin-text)",
          fontWeight: accent || boxed ? 700 : 500,
          fontSize: boxed ? 13 : 13,
          textAlign: "left",
          direction: "ltr",
          fontVariantNumeric: "tabular-nums",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
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
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "10px" }}>
        —
      </Typography>
    );
  }
  const color =
    value > 0 ? "#4ade80" : value < 0 ? "#f87171" : "var(--admin-text-muted)";
  return (
    <Typography sx={{ color, fontWeight: 600, fontSize: "11px", whiteSpace: "nowrap" }}>
      {formatNumber(value)}
    </Typography>
  );
}

export default function DailyReconciliationPage() {
  const [rows, setRows] = useState<DailyReconciliationRow[]>([]);
  const [shopAccounts, setShopAccounts] = useState<ShopAccount[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DepositDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [depositModalRow, setDepositModalRow] = useState<DailyReconciliationRow | null>(null);
  const [modalSalesLoading, setModalSalesLoading] = useState(false);
  const [monthFilter, setMonthFilter] = useState<MonthFilter | null>(null);
  const [rangeInfo, setRangeInfo] = useState<{
    from: string;
    to: string;
    days: number;
  } | null>(null);

  const applyDraftsForAccounts = useCallback(
    (list: DailyReconciliationRow[], accounts: ShopAccount[]) => {
      const nextDrafts: Record<string, DepositDraft> = {};
      list.forEach((row) => {
        nextDrafts[row.date] = draftsFromRow(row, accounts);
      });
      setDrafts(nextDrafts);
    },
    []
  );

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
        console.log("[daily-reconciliation] GET error", {
          url: buildReconciliationUrl(year, month),
          res,
        });
        toast.error(getApiErrorMessage(res, "خطا در دریافت گرید تطبیق روزانه"));
        setRows([]);
        setDrafts({});
        setShopAccounts([]);
        setMonthFilter(null);
        setRangeInfo(null);
        return;
      }
      console.log("[daily-reconciliation] GET /api/daily-reconciliations raw", res);
      const payload = parseReconciliationResponse(res);
      if (!payload) {
        console.log("[daily-reconciliation] parse failed — payload null");
        toast.error("ساختار پاسخ سرور نامعتبر است");
        setRows([]);
        setDrafts({});
        return;
      }
      console.log("[daily-reconciliation] parsed", {
        filter: payload.filter,
        shop_accounts: payload.shop_accounts,
        daily_count: payload.daily.length,
        sample_day: payload.daily[0] ?? null,
        sample_deposits: payload.daily[0]?.deposits ?? null,
      });
      setMonthFilter(payload.filter);
      setRangeInfo({
        from: payload.from_date_jalali,
        to: payload.to_date_jalali,
        days: payload.days_in_month,
      });
      const accounts =
        payload.shop_accounts.length > 0
          ? payload.shop_accounts
          : [
              { id: 1, name: "حساب ۱", balance: 0, is_default: true },
              { id: 2, name: "حساب ۲", balance: 0, is_default: true },
            ];
      setShopAccounts(accounts);
      const list = payload.daily;
      setRows(list);
      applyDraftsForAccounts(list, accounts);
    } catch {
      toast.error("خطا در دریافت گرید تطبیق روزانه");
      setRows([]);
      setDrafts({});
      setShopAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [applyDraftsForAccounts]);

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

  const cumulativePreviewByDate = useMemo(
    () => buildCumulativePreviewByDate(visibleRows, drafts),
    [visibleRows, drafts]
  );

  const latestCumulative = useMemo(() => {
    if (!visibleRows.length) return null;
    const last = visibleRows[visibleRows.length - 1];
    if (cumulativePreviewByDate[last.date] != null) {
      return cumulativePreviewByDate[last.date];
    }
    return last.cumulative_discrepancy ?? null;
  }, [visibleRows, cumulativePreviewByDate]);

  const yearOptions = useMemo(() => {
    const base = monthFilter?.year ?? 1404;
    return Array.from({ length: 11 }, (_, i) => base - 5 + i);
  }, [monthFilter?.year]);

  const updateDraft = (date: string, patch: Partial<DepositDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [date]: {
        accounts: emptyAccountDraftMap(shopAccounts),
        deposit_cash: "",
        notes: "",
        ...prev[date],
        ...patch,
        accounts: {
          ...(prev[date]?.accounts || emptyAccountDraftMap(shopAccounts)),
          ...(patch.accounts || {}),
        },
      },
    }));
  };

  const updateAccountDraft = (date: string, accountId: number, value: string) => {
    setDrafts((prev) => {
      const current = prev[date] || {
        accounts: emptyAccountDraftMap(shopAccounts),
        deposit_cash: "",
        notes: "",
      };
      return {
        ...prev,
        [date]: {
          ...current,
          accounts: {
            ...current.accounts,
            [String(accountId)]: formatAmountInput(value),
          },
        },
      };
    });
  };

  const openDepositModal = async (row: DailyReconciliationRow) => {
    setDepositModalRow(row);
    if (!drafts[row.date]) {
      setDrafts((prev) => ({ ...prev, [row.date]: draftsFromRow(row, shopAccounts) }));
    }
    // جزئیات فروش را فقط هنگام باز شدن مودال می‌گیریم (گرید سبک می‌ماند)
    setModalSalesLoading(true);
    const token = tokenCode();
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        `/api/daily-reconciliations/${encodeURIComponent(row.date)}`,
        true,
        true,
        token
      );
      if (res?.hasError) {
        return;
      }
      const salesRaw = (res as { sales?: Record<string, unknown> })?.sales;
      if (salesRaw && typeof salesRaw === "object") {
        const sales: SalesSnapshot = {
          total_sales: Math.floor(Number(salesRaw.total_sales) || 0),
          card_amount: Math.floor(Number(salesRaw.card_amount) || 0),
          cash_amount: Math.floor(Number(salesRaw.cash_amount) || 0),
          installments_collected: Math.floor(Number(salesRaw.installments_collected) || 0),
          debts_collected: Math.floor(Number(salesRaw.debts_collected) || 0),
          discount_given: Math.floor(Number(salesRaw.discount_given) || 0),
          total_collected: Math.floor(Number(salesRaw.total_collected) || 0),
          credit_used_total: Math.floor(Number(salesRaw.credit_used_total) || 0),
          uncollected_debts: Math.floor(Number(salesRaw.uncollected_debts) || 0),
        };
        setRows((prev) =>
          prev.map((r) => (r.date === row.date ? { ...r, sales } : r))
        );
        setDepositModalRow((prev) => (prev && prev.date === row.date ? { ...prev, sales } : prev));
      }
    } catch {
      // گرید با دادهٔ موجود مودال را نشان می‌دهد
    } finally {
      setModalSalesLoading(false);
    }
  };

  const closeDepositModal = () => {
    if (savingDate) return;
    setDepositModalRow(null);
  };

  const handleSave = async (row: DailyReconciliationRow) => {
    const draft = drafts[row.date];
    if (!draft) return;

    setSavingDate(row.date);
    const token = tokenCode();
    const sales = row.sales;
    const accountDeposits = shopAccounts.map((account) => ({
      shop_account_id: account.id,
      amount: parseAmount(draft.accounts[String(account.id)] || ""),
    }));
    const body = {
      date: row.date,
      total_sales: sales?.total_sales ?? 0,
      cash_amount: sales?.cash_amount ?? 0,
      card_amount: sales?.card_amount ?? 0,
      installments_collected: sales?.installments_collected ?? 0,
      discount_given: sales?.discount_given ?? 0,
      total_collected: sales?.total_collected ?? 0,
      credit_used_total: sales?.credit_used_total ?? 0,
      deposit_cash: parseAmount(draft.deposit_cash),
      account_deposits: accountDeposits,
      deposit_account_1: accountDeposits[0]?.amount ?? 0,
      deposit_account_2: accountDeposits[1]?.amount ?? 0,
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
      toast.success(`واریز ${rowDateLabel(row, monthFilter)} ثبت شد`);
      setDepositModalRow(null);
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

  const reversedVisibleRows = useMemo(
    () => [...visibleRows].reverse(),
    [visibleRows]
  );

  const modalDraft = depositModalRow ? drafts[depositModalRow.date] : null;
  const modalPreviewDisc = depositModalRow && modalDraft
    ? previewDailyDiscrepancy(modalDraft, depositModalRow.sales)
    : null;

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.25, md: 2 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.25, md: 2 } }}>
        <Box
          sx={{
            mb: 1.5,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, minWidth: 0 }}>
            <AccountBalanceIcon sx={{ color: "var(--admin-accent)", fontSize: 28 }} />
            <Box>
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 800, fontSize: { xs: 17, md: 20 } }}>
                تطبیق روزانه
              </Typography>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.2 }}>
                {monthFilter
                  ? `${monthFilter.month_name} ${toFaDigits(monthFilter.year)} · ${toFaDigits(visibleRows.length)} روز`
                  : "واریز حساب‌ها را با وصول روز یکی کنید"}
                {latestCumulative != null
                  ? ` · تجمعی ${formatNumber(latestCumulative)} تومان`
                  : ""}
              </Typography>
            </Box>
          </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                flexWrap: "wrap",
                flexShrink: 0,
              }}
            >
              <Paper
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  backgroundColor: "var(--admin-surface-alt)",
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
                    renderValue={(v) => (v === "" || v == null ? "" : toFaDigits(Number(v)))}
                    sx={{
                      color: "var(--admin-text)",
                      fontSize: 13,
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    }}
                  >
                    {yearOptions.map((y) => (
                      <MenuItem key={y} value={y}>
                        {toFaDigits(y)}
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
                    ...adminButtonStartIconSx,
                    color: "var(--admin-accent)",
                    borderColor: "var(--admin-accent)",
                  }}
                >
                  ماه جاری
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() =>
                  monthFilter ? fetchGrid(monthFilter.year, monthFilter.month) : fetchGrid()
                }
                disabled={loading}
                sx={{
                  ...adminButtonStartIconSx,
                  color: "var(--admin-text)",
                  borderColor: "var(--admin-border)",
                  "&:hover": { borderColor: "var(--admin-accent)" },
                }}
              >
                بروزرسانی
              </Button>
            </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : visibleRows.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: "center",
              backgroundColor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              borderRadius: 2.5,
            }}
          >
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
              برای این ماه رکوردی نیست
            </Typography>
          </Paper>
        ) : (
          <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              display: { xs: "none", md: "block" },
              backgroundColor: "var(--admin-surface)",
              borderRadius: 2.5,
              border: "1px solid var(--admin-border)",
              overflow: "hidden",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="right" sx={{ px: 2 }}>تاریخ</StyledTableCell>
                  <StyledTableCell align="center">جمع واریز</StyledTableCell>
                  <StyledTableCell align="center">اختلاف روز</StyledTableCell>
                  <StyledTableCell align="center">تجمعی</StyledTableCell>
                  <StyledTableCell align="center">وضعیت</StyledTableCell>
                  <StyledTableCell align="center" sx={{ px: 2 }}>عملیات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reversedVisibleRows.map((row) => {
                  const draft = drafts[row.date];
                  const displayDisc = rowDisplayDiscrepancy(row, draft);
                  const depositsTotal = depositsTotalForTone(row, draft, shopAccounts);
                  return (
                    <StyledTableRow key={row.date}>
                      <StyledTableCell align="right" sx={{ px: 2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--admin-text)" }}>
                          {rowDateLabel(row, monthFilter, { withWeekday: true })}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography
                          sx={{
                            fontSize: 13,
                            color: depositsTotal > 0 ? "var(--admin-accent)" : "var(--admin-text-muted)",
                            fontWeight: 700,
                          }}
                        >
                          {depositsTotal > 0 ? formatNumber(depositsTotal) : "—"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <DiscrepancyCell value={displayDisc ?? null} />
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <DiscrepancyCell
                          value={
                            cumulativePreviewByDate[row.date] != null
                              ? cumulativePreviewByDate[row.date]
                              : row.cumulative_discrepancy
                          }
                        />
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <RowStatusChip row={row} />
                      </StyledTableCell>
                      <StyledTableCell align="center" sx={{ px: 2 }}>
                        {row.editable ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                            onClick={() => openDepositModal(row)}
                            sx={{
                              ...adminButtonStartIconSx,
                              bgcolor: "var(--admin-accent)",
                              color: "var(--admin-on-accent)",
                              fontSize: 12,
                              fontWeight: 700,
                              borderRadius: 1.5,
                              px: 1.25,
                              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                            }}
                          >
                            ثبت واریز
                          </Button>
                        ) : row.is_closed ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openDepositModal(row)}
                            sx={{
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 1.5,
                              color: "var(--admin-text)",
                              borderColor: "var(--admin-border)",
                            }}
                          >
                            جزئیات
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

          <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 1.25 }}>
            {reversedVisibleRows.map((row) => {
              const draft = drafts[row.date];
              const displayDisc = rowDisplayDiscrepancy(row, draft);
              const depositsTotal = depositsTotalForTone(row, draft, shopAccounts);
              return (
                <Card
                  key={row.date}
                  elevation={0}
                  sx={{
                    bgcolor: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: 2.5,
                  }}
                >
                  <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 1.25 }}>
                      <Typography sx={{ fontWeight: 800, color: "var(--admin-text)", fontSize: 14 }}>
                        {rowDateLabel(row, monthFilter, { withWeekday: true })}
                      </Typography>
                      <RowStatusChip row={row} />
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 1,
                        mb: 1.35,
                        p: 1.1,
                        borderRadius: 1.75,
                        bgcolor: "var(--admin-surface-alt)",
                        border: "1px solid var(--admin-border)",
                      }}
                    >
                      <MobileStat label="جمع واریز" value={depositsTotal} accent />
                      <Box>
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.25 }}>اختلاف روز</Typography>
                        <DiscrepancyCell value={displayDisc ?? null} />
                      </Box>
                      <Box>
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.25 }}>تجمعی</Typography>
                        <DiscrepancyCell
                          value={
                            cumulativePreviewByDate[row.date] != null
                              ? cumulativePreviewByDate[row.date]
                              : row.cumulative_discrepancy
                          }
                        />
                      </Box>
                    </Box>
                    {row.editable || row.is_closed ? (
                      <Button
                        fullWidth
                        size="small"
                        variant={row.editable ? "contained" : "outlined"}
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => openDepositModal(row)}
                        sx={{
                          ...adminButtonStartIconSx,
                          fontWeight: 700,
                          borderRadius: 1.75,
                          bgcolor: row.editable ? "var(--admin-accent)" : "transparent",
                          color: row.editable ? "var(--admin-on-accent)" : "var(--admin-text)",
                          borderColor: "var(--admin-border)",
                          "&:hover": {
                            bgcolor: row.editable ? "var(--admin-accent-hover)" : "var(--admin-menu-hover)",
                          },
                        }}
                      >
                        {row.editable ? "ثبت واریز" : "جزئیات واریز"}
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Dialog
            open={Boolean(depositModalRow)}
            onClose={closeDepositModal}
            fullWidth
            maxWidth="sm"
            PaperProps={{
              sx: {
                bgcolor: "var(--admin-surface)",
                color: "var(--admin-text)",
                borderRadius: 2.75,
                border: "1px solid var(--admin-border)",
                direction: "rtl",
                overflow: "hidden",
              },
            }}
          >
            <DialogTitle
              sx={{
                fontWeight: 800,
                pb: 1.25,
                pt: 2,
                px: 2.25,
                borderBottom: "1px solid var(--admin-border)",
                bgcolor: "var(--admin-surface-alt)",
              }}
            >
              <Typography component="span" sx={{ display: "block", fontSize: 17, fontWeight: 800, color: "var(--admin-text)" }}>
                {depositModalRow?.editable ? "ثبت واریز" : "جزئیات واریز"}
              </Typography>
              <Typography component="span" sx={{ display: "block", mt: 0.35, fontSize: 13, fontWeight: 600, color: "var(--admin-accent)" }}>
                {depositModalRow ? rowDateLabel(depositModalRow, monthFilter, { withWeekday: true }) : ""}
              </Typography>
            </DialogTitle>
            <DialogContent
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                px: 2.25,
                pb: 1.5,
                "&.MuiDialogContent-root": { pt: 2 },
              }}
            >
              {modalSalesLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={24} sx={{ color: "var(--admin-accent)" }} />
                </Box>
              ) : depositModalRow?.sales ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                  }}
                >
                  <MobileStat boxed label="فروش" value={depositModalRow.sales.total_sales} />
                  <MobileStat boxed label="جمع وصول" value={depositModalRow.sales.total_collected} accent />
                  <MobileStat boxed label="نقد" value={depositModalRow.sales.cash_amount} />
                  <MobileStat boxed label="کارت" value={depositModalRow.sales.card_amount} />
                  <MobileStat boxed label="اقساط" value={depositModalRow.sales.installments_collected} />
                  <MobileStat boxed label="وصول نسیه" value={depositModalRow.sales.debts_collected} accent />
                </Box>
              ) : null}

              {depositModalRow && modalDraft ? (
                <>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--admin-text)", mt: 0.25 }}>
                    مبالغ واریز
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1.1,
                    }}
                  >
                    {shopAccounts.map((account) => (
                      <TextField
                        key={account.id}
                        fullWidth
                        size="small"
                        label={account.name}
                        value={modalDraft.accounts[String(account.id)] || ""}
                        disabled={!depositModalRow.editable}
                        onChange={(e) => updateAccountDraft(depositModalRow.date, account.id, e.target.value)}
                        placeholder="۰"
                        sx={amountFieldSxFull}
                        inputProps={{ style: { direction: "rtl", textAlign: "right" } }}
                      />
                    ))}
                    <TextField
                      fullWidth
                      size="small"
                      label="نقدی"
                      value={modalDraft.deposit_cash}
                      disabled={!depositModalRow.editable}
                      onChange={(e) =>
                        updateDraft(depositModalRow.date, { deposit_cash: formatAmountInput(e.target.value) })
                      }
                      placeholder="۰"
                      sx={amountFieldSxFull}
                      inputProps={{ style: { direction: "rtl", textAlign: "right" } }}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="یادداشت"
                    value={modalDraft.notes}
                    disabled={!depositModalRow.editable}
                    onChange={(e) => updateDraft(depositModalRow.date, { notes: e.target.value })}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "var(--admin-surface-alt)",
                        color: "var(--admin-text)",
                        borderRadius: 1.5,
                        "& fieldset": { borderColor: "var(--admin-border)" },
                      },
                      "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                      p: 1.15,
                      borderRadius: 1.75,
                      bgcolor: "var(--admin-surface-alt)",
                      border: "1px solid var(--admin-border)",
                    }}
                  >
                    <Typography sx={{ fontSize: 12.5, color: "var(--admin-text-muted)" }}>
                      جمع واریز:{" "}
                      <Box component="span" sx={{ color: "var(--admin-accent)", fontWeight: 800 }}>
                        {formatNumber(depositTotal(modalDraft))}
                      </Box>{" "}
                      تومان
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Typography sx={{ fontSize: 12.5, color: "var(--admin-text-muted)" }}>اختلاف</Typography>
                      <DiscrepancyCell value={modalPreviewDisc} />
                    </Box>
                  </Box>
                </>
              ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 2.25, pb: 2, pt: 1, gap: 1, borderTop: "1px solid var(--admin-border)" }}>
              <Button onClick={closeDepositModal} disabled={Boolean(savingDate)} sx={{ color: "var(--admin-text-muted)" }}>
                بستن
              </Button>
              {depositModalRow?.editable ? (
                <Button
                  variant="contained"
                  disabled={Boolean(savingDate) || !modalDraft}
                  startIcon={
                    savingDate === depositModalRow.date ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={() => handleSave(depositModalRow)}
                  sx={{
                    ...adminButtonStartIconSx,
                    fontWeight: 800,
                    borderRadius: 1.75,
                    bgcolor: "var(--admin-accent)",
                    color: "var(--admin-on-accent)",
                    "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                  }}
                >
                  ثبت واریز
                </Button>
              ) : null}
            </DialogActions>
          </Dialog>
          </>
        )}

        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
