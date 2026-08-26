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
    fontSize: "11px",
    padding: "6px 4px",
    whiteSpace: "nowrap",
    lineHeight: 1.25,
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: "11px",
    padding: "4px 3px",
    verticalAlign: "middle",
    lineHeight: 1.25,
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

/** عرض ستون‌های چسبان سمت راست (واریز و ثبت) */
const STICKY_W = {
  date: 56,
  account: 84,
  cash: 76,
  daily: 64,
  cumul: 64,
  notes: 92,
  save: 48,
} as const;

function stickyRightSx(
  right: number,
  width: number,
  opts?: { isHead?: boolean; isEdge?: boolean; accent?: boolean }
) {
  const headBg = opts?.accent
    ? "rgba(120,181,104,0.14)"
    : "var(--admin-surface-alt)";
  return {
    position: "sticky" as const,
    right,
    width,
    minWidth: width,
    maxWidth: width,
    zIndex: opts?.isHead ? 5 : 3,
    backgroundColor: opts?.isHead ? headBg : "inherit",
    ...(opts?.isEdge
      ? {
          boxShadow: "-6px 0 10px rgba(0,0,0,0.18)",
          borderLeft: "1px solid var(--admin-border)",
        }
      : null),
  };
}

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

interface DailySalesApiResponse {
  date: string;
  date_jalali?: string;
  total_sales: number;
  cash_amount: number;
  card_amount: number;
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
      debts_collected: Math.floor(Number(obj.debts_collected) || 0),
      discount_given: Math.floor(Number(obj.discount_given) || 0),
      total_collected: Math.floor(Number(obj.total_collected) || 0),
      credit_used_total: Math.floor(Number(obj.credit_used_total) || 0),
      uncollected_debts: Math.floor(Number(obj.uncollected_debts) || 0),
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
    debts_collected: salesField(source, nested, "debts_collected"),
    discount_given: salesField(source, nested, "discount_given"),
    total_collected: salesField(source, nested, "total_collected"),
    credit_used_total: salesField(source, nested, "credit_used_total"),
    uncollected_debts: salesField(source, nested, "uncollected_debts"),
  };
}

function salesSnapshotFromDailySales(data: DailySalesApiResponse): SalesSnapshot {
  return salesSnapshotFromRecord(data as unknown as Record<string, unknown>);
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
  const [refreshingSalesDate, setRefreshingSalesDate] = useState<string | null>(null);
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
      // سازگاری با فرانت/بک‌اند قدیمی
      deposit_account_1: accountDeposits[0]?.amount ?? 0,
      deposit_account_2: accountDeposits[1]?.amount ?? 0,
      ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
    };

    console.log("[daily-reconciliation] POST /api/daily-reconciliations body", body);

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
      console.log("[daily-reconciliation] POST response", res);
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

  const renderCashCell = (row: DailyReconciliationRow, fullWidth = false) => {
    const draft = drafts[row.date];
    if (!row.editable) {
      const val = row.deposits?.deposit_cash ?? 0;
      return (
        <Typography sx={{ color: "var(--admin-text)", fontSize: "11px" }}>
          {val > 0 ? formatNumber(val) : "—"}
        </Typography>
      );
    }
    if (!draft) return null;
    return (
      <TextField
        size="small"
        value={draft.deposit_cash}
        onChange={(e) => updateDraft(row.date, { deposit_cash: formatAmountInput(e.target.value) })}
        placeholder="۰"
        sx={fullWidth ? amountFieldSxFull : amountFieldSx}
      />
    );
  };

  const renderAccountCell = (
    row: DailyReconciliationRow,
    account: ShopAccount,
    accountIndex: number,
    fullWidth = false
  ) => {
    const draft = drafts[row.date];
    if (!row.editable) {
      const val = depositAmountForAccount(row, account, accountIndex);
      return (
        <Typography sx={{ color: "var(--admin-text)", fontSize: "11px" }}>
          {val > 0 ? formatNumber(val) : "—"}
        </Typography>
      );
    }
    if (!draft) return null;
    return (
      <TextField
        size="small"
        value={draft.accounts[String(account.id)] || ""}
        onChange={(e) => updateAccountDraft(row.date, account.id, e.target.value)}
        placeholder="۰"
        sx={fullWidth ? amountFieldSxFull : amountFieldSx}
      />
    );
  };

  const reversedVisibleRows = useMemo(
    () => [...visibleRows].reverse(),
    [visibleRows]
  );

  const stickyLayout = useMemo(() => {
    let right = 0;
    const date = { right, width: STICKY_W.date };
    right += STICKY_W.date;
    const accounts = shopAccounts.map(() => {
      const col = { right, width: STICKY_W.account };
      right += STICKY_W.account;
      return col;
    });
    const cash = { right, width: STICKY_W.cash };
    right += STICKY_W.cash;
    const daily = { right, width: STICKY_W.daily };
    right += STICKY_W.daily;
    const cumul = { right, width: STICKY_W.cumul };
    right += STICKY_W.cumul;
    const notes = { right, width: STICKY_W.notes };
    right += STICKY_W.notes;
    const save = { right, width: STICKY_W.save };
    return { date, accounts, cash, daily, cumul, notes, save };
  }, [shopAccounts]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        paddingTop: { xs: "12px", md: "24px" },
        paddingBottom: { xs: "150px", md: "60px" },
        direction: "rtl",
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 } }}>
        <Card
          sx={{
            mb: 2,
            backgroundColor: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderRadius: 2,
          }}
        >
          <CardContent
            sx={{
              py: 1.25,
              px: { xs: 1.5, md: 2 },
              "&:last-child": { pb: 1.25 },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                color: "var(--admin-text-muted)",
                fontSize: 13,
                lineHeight: 1.7,
                flex: "1 1 220px",
                minWidth: 0,
              }}
            >
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
                    <Chip
                      label="ماه جاری"
                      size="small"
                      sx={{ ml: 1, height: 22, fontSize: 11 }}
                      color="primary"
                      variant="outlined"
                    />
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
                size="small"
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
            <Table size="small" stickyHeader sx={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell
                    align="center"
                    sx={stickyRightSx(stickyLayout.date.right, stickyLayout.date.width, {
                      isHead: true,
                    })}
                  >
                    تاریخ
                  </StyledTableCell>
                  {shopAccounts.map((account, index) => (
                    <StyledTableCell
                      key={account.id}
                      align="center"
                      sx={stickyRightSx(
                        stickyLayout.accounts[index]?.right ?? 0,
                        stickyLayout.accounts[index]?.width ?? STICKY_W.account,
                        { isHead: true, accent: true }
                      )}
                    >
                      {account.name}
                    </StyledTableCell>
                  ))}
                  <StyledTableCell
                    align="center"
                    sx={stickyRightSx(stickyLayout.cash.right, stickyLayout.cash.width, {
                      isHead: true,
                      accent: true,
                    })}
                  >
                    نقدی
                  </StyledTableCell>
                  <StyledTableCell
                    align="center"
                    sx={stickyRightSx(stickyLayout.daily.right, stickyLayout.daily.width, {
                      isHead: true,
                    })}
                  >
                    اختلاف روز
                  </StyledTableCell>
                  <StyledTableCell
                    align="center"
                    sx={stickyRightSx(stickyLayout.cumul.right, stickyLayout.cumul.width, {
                      isHead: true,
                    })}
                  >
                    تجمعی
                  </StyledTableCell>
                  <StyledTableCell
                    align="center"
                    sx={stickyRightSx(stickyLayout.notes.right, stickyLayout.notes.width, {
                      isHead: true,
                    })}
                  >
                    یادداشت
                  </StyledTableCell>
                  <StyledTableCell
                    align="center"
                    sx={stickyRightSx(stickyLayout.save.right, stickyLayout.save.width, {
                      isHead: true,
                      isEdge: true,
                    })}
                  >
                    ثبت
                  </StyledTableCell>
                  <StyledTableCell align="center">فروش</StyledTableCell>
                  <StyledTableCell align="center">نقد</StyledTableCell>
                  <StyledTableCell align="center">کارت</StyledTableCell>
                  <StyledTableCell align="center">اقساط</StyledTableCell>
                  <StyledTableCell align="center">وصول نسیه</StyledTableCell>
                  <StyledTableCell align="center">تخفیف</StyledTableCell>
                  <StyledTableCell align="center">جمع وصول</StyledTableCell>
                  <StyledTableCell align="center">اعتبار</StyledTableCell>
                  <StyledTableCell align="center">بدهی باز</StyledTableCell>
                  <StyledTableCell align="center">بروز</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reversedVisibleRows.map((row) => {
                  const draft = drafts[row.date];
                  const displayDisc = rowDisplayDiscrepancy(row, draft);
                  const depositsTotal = depositsTotalForTone(row, draft, shopAccounts);
                  const totalCollected = row.sales?.total_collected ?? 0;
                  const discrepancyTone =
                    displayDisc != null
                      ? displayDisc < depositsTotal - totalCollected
                        ? "negative"
                        : displayDisc > depositsTotal - totalCollected
                          ? "positive"
                          : null
                      : null;

                  return (
                    <StyledTableRow
                      key={row.date}
                      sx={
                        discrepancyTone
                          ? {
                              backgroundColor:
                                discrepancyTone === "negative"
                                  ? "rgba(239, 68, 68, 0.10) !important"
                                  : "rgba(74, 222, 128, 0.10) !important",
                              "&:nth-of-type(even)": {
                                backgroundColor:
                                  discrepancyTone === "negative"
                                    ? "rgba(239, 68, 68, 0.16) !important"
                                    : "rgba(74, 222, 128, 0.16) !important",
                              },
                              "&:hover": {
                                backgroundColor:
                                  discrepancyTone === "negative"
                                    ? "rgba(239, 68, 68, 0.20) !important"
                                    : "rgba(74, 222, 128, 0.20) !important",
                              },
                            }
                          : undefined
                      }
                    >
                      <StyledTableCell
                        align="center"
                        sx={stickyRightSx(stickyLayout.date.right, stickyLayout.date.width)}
                      >
                        <Typography sx={{ fontWeight: 600, fontSize: 10 }}>
                          {rowDateLabel(row, monthFilter)}
                        </Typography>
                      </StyledTableCell>
                      {shopAccounts.map((account, index) => (
                        <StyledTableCell
                          key={account.id}
                          align="center"
                          sx={stickyRightSx(
                            stickyLayout.accounts[index]?.right ?? 0,
                            stickyLayout.accounts[index]?.width ?? STICKY_W.account,
                            { accent: true }
                          )}
                        >
                          {renderAccountCell(row, account, index)}
                        </StyledTableCell>
                      ))}
                      <StyledTableCell
                        align="center"
                        sx={stickyRightSx(stickyLayout.cash.right, stickyLayout.cash.width, {
                          accent: true,
                        })}
                      >
                        {renderCashCell(row)}
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={{
                          ...stickyRightSx(stickyLayout.daily.right, stickyLayout.daily.width),
                          ...(discrepancyTone
                            ? {
                                backgroundColor:
                                  discrepancyTone === "negative"
                                    ? "rgba(239, 68, 68, 0.16)"
                                    : "rgba(74, 222, 128, 0.16)",
                              }
                            : null),
                        }}
                      >
                        <DiscrepancyCell value={displayDisc ?? null} />
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={stickyRightSx(stickyLayout.cumul.right, stickyLayout.cumul.width)}
                      >
                        <DiscrepancyCell value={row.cumulative_discrepancy} />
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={stickyRightSx(stickyLayout.notes.right, stickyLayout.notes.width)}
                      >
                        {row.editable && draft ? (
                          <TextField
                            size="small"
                            placeholder="—"
                            value={draft.notes}
                            onChange={(e) => updateDraft(row.date, { notes: e.target.value })}
                            sx={{
                              minWidth: 78,
                              maxWidth: 88,
                              "& .MuiOutlinedInput-root": {
                                backgroundColor: "var(--admin-surface-alt)",
                                fontSize: "10px",
                                "& fieldset": { borderColor: "var(--admin-border)" },
                              },
                              "& .MuiInputBase-input": {
                                color: "var(--admin-text)",
                                py: 0.35,
                                px: 0.5,
                                fontSize: "10px",
                              },
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{
                              color: "var(--admin-text-muted)",
                              fontSize: "10px",
                              maxWidth: 86,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.notes?.trim() || "—"}
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell
                        align="center"
                        sx={stickyRightSx(stickyLayout.save.right, stickyLayout.save.width, {
                          isEdge: true,
                        })}
                      >
                        {row.editable ? (
                          <IconButton
                            size="small"
                            disabled={savingDate === row.date}
                            onClick={() => handleSave(row)}
                            aria-label="ثبت"
                            sx={{
                              color: "#fff",
                              bgcolor: "var(--admin-accent)",
                              width: 28,
                              height: 28,
                              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                              "&.Mui-disabled": { bgcolor: "var(--admin-border)", color: "var(--admin-text-muted)" },
                            }}
                          >
                            {savingDate === row.date ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <SaveIcon sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        ) : (
                          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 10 }}>
                            —
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatNumber(row.sales?.total_sales ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatNumber(row.sales?.cash_amount ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatNumber(row.sales?.card_amount ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatNumber(row.sales?.installments_collected ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatNumber(row.sales?.debts_collected ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatNumber(row.sales?.discount_given ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Typography sx={{ fontWeight: 700, color: "var(--admin-accent)", fontSize: 11 }}>
                          {formatNumber(row.sales?.total_collected ?? 0)}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatNumber(row.sales?.credit_used_total ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        {formatNumber(row.sales?.uncollected_debts ?? 0)}
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <IconButton
                          size="small"
                          disabled={refreshingSalesDate === row.date}
                          onClick={() => handleRefreshSales(row)}
                          aria-label="بروزرسانی فروش"
                          sx={{ color: "var(--admin-text-muted)", width: 26, height: 26 }}
                        >
                          {refreshingSalesDate === row.date ? (
                            <CircularProgress size={12} />
                          ) : (
                            <SyncIcon sx={{ fontSize: 15 }} />
                          )}
                        </IconButton>
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
              const depositsTotal = depositsTotalForTone(row, draft, shopAccounts);
              const totalCollected = sales?.total_collected ?? 0;
              const discrepancyTone =
                displayDisc != null
                  ? displayDisc <depositsTotal - totalCollected
                    ? "negative"
                    : displayDisc > depositsTotal - totalCollected
                      ? "positive"
                      : null
                  : null;



              return (
                <Card
                  key={row.date}
                  sx={{
                    backgroundColor: discrepancyTone
                      ? discrepancyTone === "negative"
                        ? "rgba(239, 68, 68, 0.10)"
                        : "rgba(74, 222, 128, 0.10)"
                      : "var(--admin-surface)",
                    borderRadius: "16px",
                    border: discrepancyTone
                      ? discrepancyTone === "negative"
                        ? "1px solid rgba(239, 68, 68, 0.45)"
                        : "1px solid rgba(74, 222, 128, 0.45)"
                      : "1px solid var(--admin-border)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: discrepancyTone
                        ? discrepancyTone === "negative"
                          ? "rgba(239, 68, 68, 0.65)"
                          : "rgba(74, 222, 128, 0.65)"
                        : "rgba(120, 181, 104, 0.4)",
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
                      <MobileStat label="وصول نسیه" value={sales?.debts_collected ?? 0} />
                      <MobileStat label="تخفیف" value={sales?.discount_given ?? 0} />
                      <MobileStat label="جمع وصول" value={sales?.total_collected ?? 0} accent />
                      <MobileStat
                        label="اعتبار مصرف‌شده"
                        value={sales?.credit_used_total ?? 0}
                      />
                      <MobileStat label="بدهی باز" value={sales?.uncollected_debts ?? 0} />
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
                      {shopAccounts.map((account, index) => (
                        <Box key={account.id}>
                          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.5 }}>
                            {account.name}
                          </Typography>
                          {renderAccountCell(row, account, index, true)}
                        </Box>
                      ))}
                      <Box>
                        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.5 }}>
                          نقدی
                        </Typography>
                        {renderCashCell(row, true)}
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
