"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  TextField,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import HistoryIcon from "@mui/icons-material/History";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import DateObject from "react-date-object";
import { toast } from "react-toastify";
import {
  ACCOUNTING_SOURCE_TYPES,
  accountingSourceLabel,
  accountingVoucherStatusLabel,
  fetchAccountingAccounts,
  fetchAccountingPeriods,
  fetchAccountingVouchers,
  flattenAccounts,
  formatAccountingMoney,
  isReversalVoucher,
  jalaliYmd,
  type AccountingAccount,
  type AccountingPeriodsInfo,
  type AccountingVoucher,
} from "@/app/lib/accounting";
import {
  AccountingJalaliDateField,
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
  accountingButtonSx,
  accountingFieldSx,
  accountingPaginationSx,
} from "@/app/admin/accounting/ui";

function statusChip(voucher: AccountingVoucher) {
  const label = accountingVoucherStatusLabel(voucher);
  if (voucher.status === "reversed") {
    return <Chip size="small" label={label} sx={{ height: 22, fontSize: 11 }} />;
  }
  if (isReversalVoucher(voucher)) {
    return (
      <Chip
        size="small"
        label={label}
        sx={{ height: 22, fontSize: 11, bgcolor: "var(--admin-info-bg)", color: "var(--admin-info-icon)" }}
      />
    );
  }
  return (
    <Chip
      size="small"
      label={label}
      sx={{ height: 22, fontSize: 11, bgcolor: "var(--admin-accent)", color: "var(--admin-on-accent)" }}
    />
  );
}

function AccountingVouchersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSource = searchParams.get("source_type") || "";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AccountingVoucher[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sourceType, setSourceType] = useState(initialSource);
  const [status, setStatus] = useState("");
  const [periodsInfo, setPeriodsInfo] = useState<AccountingPeriodsInfo | null>(null);
  const [periodIndex, setPeriodIndex] = useState("");
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [account, setAccount] = useState<AccountingAccount | null>(null);
  const [fromDate, setFromDate] = useState<DateObject | null>(null);
  const [toDate, setToDate] = useState<DateObject | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    fetchAccountingPeriods()
      .then(setPeriodsInfo)
      .catch(() => setPeriodsInfo(null));
  }, []);

  useEffect(() => {
    fetchAccountingAccounts()
      .then((tree) => setAccounts(flattenAccounts(tree)))
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setAmount(amountInput.replace(/[^\d۰-۹٠-٩]/g, ""));
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput, amountInput]);

  const selectedPeriod = periodIndex === "" ? null : periodsInfo?.periods[Number(periodIndex)] ?? null;
  const canEditClosed = Boolean(periodsInfo?.can_edit_closed);
  const fromParam = jalaliYmd(fromDate) || selectedPeriod?.from || "";
  const toParam = jalaliYmd(toDate) || selectedPeriod?.to || "";
  const hasFilters = Boolean(
    sourceType || status || periodIndex !== "" || account || fromDate || toDate || searchInput || amountInput,
  );

  const clearFilters = () => {
    setSourceType("");
    setStatus("");
    setPeriodIndex("");
    setAccount(null);
    setFromDate(null);
    setToDate(null);
    setSearchInput("");
    setAmountInput("");
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAccountingVouchers({
        page,
        perPage: 20,
        sourceType: sourceType || undefined,
        status: status || undefined,
        from: fromParam || undefined,
        to: toParam || undefined,
        accountId: account?.id,
        amount: amount || undefined,
        q: search || undefined,
      });
      setRows(res.data);
      setLastPage(Math.max(1, res.last_page));
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت اسناد");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, sourceType, status, fromParam, toParam, account?.id, amount, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountingPageShell
      title="اسناد حسابداری"
      subtitle={`${new Intl.NumberFormat("fa-IR").format(total)} سند`}
      actions={
        <>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={loading}
            sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
          >
            بروزرسانی
          </Button>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => router.push("/admin/accounting/audit-log")}
            sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
          >
            لاگ حسابرس
          </Button>
          {canEditClosed && periodsInfo?.closed_through ? (
            <Button
              variant="outlined"
              startIcon={<EventRepeatIcon />}
              onClick={() => router.push("/admin/accounting/vouchers/new?mode=prior_year_adjust")}
              sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
            >
              تعدیلات سنواتی
            </Button>
          ) : null}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/admin/accounting/vouchers/new")}
            sx={accountingButtonSx}
          >
            سند دستی
          </Button>
        </>
      }
    >
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        {periodsInfo && periodsInfo.periods.length > 1 ? (
          <FormControl size="small" sx={{ minWidth: 240, ...accountingFieldSx }}>
            <InputLabel>دورهٔ مالی</InputLabel>
            <Select
              label="دورهٔ مالی"
              value={periodIndex}
              onChange={(e) => {
                setPeriodIndex(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">همهٔ دوره‌ها</MenuItem>
              {periodsInfo.periods.map((item, index) => (
                <MenuItem key={`${item.from}-${item.to}`} value={String(index)}>
                  {item.closed ? "🔒 " : ""}
                  {item.label}
                  {item.from || item.to ? ` (${item.from || "ابتدا"} تا ${item.to || "امروز"})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
        <FormControl size="small" sx={{ minWidth: 180, ...accountingFieldSx }}>
          <InputLabel>منبع</InputLabel>
          <Select
            label="منبع"
            value={sourceType}
            onChange={(e) => {
              setSourceType(e.target.value);
              setPage(1);
            }}
          >
            {ACCOUNTING_SOURCE_TYPES.map((item) => (
              <MenuItem key={item.value || "all"} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, ...accountingFieldSx }}>
          <InputLabel>وضعیت</InputLabel>
          <Select
            label="وضعیت"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">همه</MenuItem>
            <MenuItem value="posted">ثبت‌شده</MenuItem>
            <MenuItem value="reversed">برگشت‌خورده</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 2fr 1fr 1fr 1fr auto" },
          alignItems: "end",
          mb: 2,
        }}
      >
        <TextField
          size="small"
          label="جستجو"
          placeholder="شمارهٔ سند، شمارهٔ فاکتور یا شرح"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={accountingFieldSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "var(--admin-text-muted)" }} />
              </InputAdornment>
            ),
          }}
        />
        <Autocomplete
          size="small"
          options={accounts}
          value={account}
          onChange={(_e, value) => {
            setAccount(value);
            setPage(1);
          }}
          getOptionLabel={(option) => `${option.code} — ${option.name}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => <TextField {...params} label="حساب (با زیرحساب‌ها)" sx={accountingFieldSx} />}
          slotProps={{
            paper: { sx: { bgcolor: "var(--admin-surface)", color: "var(--admin-text)" } },
          }}
        />
        <TextField
          size="small"
          label="مبلغ آرتیکل"
          placeholder="مثلاً 250000"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          inputProps={{ inputMode: "numeric" }}
          sx={accountingFieldSx}
        />
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>از تاریخ</Typography>
          <AccountingJalaliDateField
            value={fromDate}
            onChange={(value) => {
              setFromDate(value);
              setPage(1);
            }}
            placeholder={selectedPeriod?.from || "از ابتدا"}
          />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>تا تاریخ</Typography>
          <AccountingJalaliDateField
            value={toDate}
            onChange={(value) => {
              setToDate(value);
              setPage(1);
            }}
            placeholder={selectedPeriod?.to || "تا امروز"}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterAltOffIcon />}
          onClick={clearFilters}
          disabled={!hasFilters}
          sx={{ height: 40, color: "var(--admin-text)", borderColor: "var(--admin-border)", whiteSpace: "nowrap" }}
        >
          حذف فیلترها
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", py: 4, textAlign: "center" }}>
          سندی یافت نشد.
        </Typography>
      ) : (
        <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <AccountingTableCell>شماره</AccountingTableCell>
                <AccountingTableCell>تاریخ</AccountingTableCell>
                <AccountingTableCell>شرح</AccountingTableCell>
                <AccountingTableCell>منبع</AccountingTableCell>
                <AccountingTableCell align="left">بدهکار</AccountingTableCell>
                <AccountingTableCell align="left">بستانکار</AccountingTableCell>
                <AccountingTableCell>وضعیت</AccountingTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <AccountingTableRow
                  key={row.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => router.push(`/admin/accounting/vouchers/${row.id}`)}
                >
                  <AccountingTableCell>{row.number}</AccountingTableCell>
                  <AccountingTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {row.date}
                      {row.locked ? (
                        <LockOutlinedIcon titleAccess="دورهٔ بسته" sx={{ fontSize: 14, color: "var(--admin-text-muted)" }} />
                      ) : null}
                    </Box>
                  </AccountingTableCell>
                  <AccountingTableCell>
                    <Typography sx={{ fontSize: 12, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.description || "—"}
                    </Typography>
                  </AccountingTableCell>
                  <AccountingTableCell>{accountingSourceLabel(row.source_type)}</AccountingTableCell>
                  <AccountingTableCell align="left">{formatAccountingMoney(row.debit_total)}</AccountingTableCell>
                  <AccountingTableCell align="left">{formatAccountingMoney(row.credit_total)}</AccountingTableCell>
                  <AccountingTableCell>{statusChip(row)}</AccountingTableCell>
                </AccountingTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {lastPage > 1 ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={lastPage}
            page={page}
            onChange={(_e, value) => setPage(value)}
            size="small"
            sx={accountingPaginationSx}
          />
        </Box>
      ) : null}
    </AccountingPageShell>
  );
}

export default function AccountingVouchersPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      }
    >
      <AccountingVouchersPage />
    </Suspense>
  );
}
