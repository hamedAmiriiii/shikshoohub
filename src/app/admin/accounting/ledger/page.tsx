"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DateObject from "react-date-object";
import { toast } from "react-toastify";
import {
  accountingSourceLabel,
  fetchAccountingAccounts,
  fetchLedger,
  flattenAccounts,
  formatAccountingMoney,
  jalaliYmd,
  type AccountingAccount,
  type LedgerReport,
} from "@/app/lib/accounting";
import {
  AccountingJalaliDateField,
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
  accountingFieldSx,
} from "@/app/admin/accounting/ui";

export default function LedgerPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [account, setAccount] = useState<AccountingAccount | null>(null);
  const [from, setFrom] = useState<DateObject | null>(null);
  const [to, setTo] = useState<DateObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<LedgerReport | null>(null);

  useEffect(() => {
    fetchAccountingAccounts()
      .then((tree) => setAccounts(flattenAccounts(tree).filter((item) => item.level === "moein" || item.level === "tafsili")))
      .catch((e) => toast.error(e instanceof Error ? e.message : "خطا در دریافت حساب‌ها"));
  }, []);

  const load = useCallback(async () => {
    if (!account) {
      setReport(null);
      return;
    }
    setLoading(true);
    try {
      setReport(
        await fetchLedger({
          accountId: account.id,
          from: jalaliYmd(from) || undefined,
          to: jalaliYmd(to) || undefined,
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دفتر حساب");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [account, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountingPageShell
      title="دفتر حساب"
      subtitle="مانده اول دوره، آرتیکل‌ها و مانده پایان. سند برگشت با برچسب جدا مشخص است."
      actions={
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={load}
          disabled={!account}
          sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
        >
          بروزرسانی
        </Button>
      }
    >
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" }, mb: 2 }}>
        <Autocomplete
          options={accounts}
          value={account}
          onChange={(_e, value) => setAccount(value)}
          getOptionLabel={(option) => `${option.code} — ${option.name}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => <TextField {...params} label="حساب" sx={accountingFieldSx} />}
          slotProps={{
            paper: { sx: { bgcolor: "var(--admin-surface)", color: "var(--admin-text)" } },
          }}
        />
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>از تاریخ</Typography>
          <AccountingJalaliDateField value={from} onChange={setFrom} placeholder="از ابتدا" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>تا تاریخ</Typography>
          <AccountingJalaliDateField value={to} onChange={setTo} placeholder="تا امروز" />
        </Box>
      </Box>

      {!account ? (
        <Alert severity="info">یک حساب معین یا تفصیلی انتخاب کنید.</Alert>
      ) : loading ? (
        <Typography sx={{ color: "var(--admin-text-muted)" }}>در حال بارگذاری…</Typography>
      ) : !report ? null : (
        <>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <Chip
              label={`مانده اول بدهکار ${formatAccountingMoney(report.opening.debit_balance)}`}
              sx={{ bgcolor: "var(--admin-surface)", color: "var(--admin-text)" }}
            />
            <Chip
              label={`مانده اول بستانکار ${formatAccountingMoney(report.opening.credit_balance)}`}
              sx={{ bgcolor: "var(--admin-surface)", color: "var(--admin-text)" }}
            />
            <Chip
              label={`مانده پایان بدهکار ${formatAccountingMoney(report.closing.debit_balance)}`}
              sx={{ bgcolor: "var(--admin-surface)", color: "var(--admin-text)" }}
            />
            <Chip
              label={`مانده پایان بستانکار ${formatAccountingMoney(report.closing.credit_balance)}`}
              sx={{ bgcolor: "var(--admin-surface)", color: "var(--admin-text)" }}
            />
          </Box>

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
                  <AccountingTableCell align="left">مانده جاری بدهکار</AccountingTableCell>
                  <AccountingTableCell align="left">مانده جاری بستانکار</AccountingTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.rows.map((row) => (
                  <AccountingTableRow
                    key={row.line_id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/admin/accounting/vouchers/${row.voucher_id}`)}
                  >
                    <AccountingTableCell>{row.number}</AccountingTableCell>
                    <AccountingTableCell>{row.date}</AccountingTableCell>
                    <AccountingTableCell>
                      {row.description}
                      {row.line_description ? ` — ${row.line_description}` : ""}
                      {row.is_reversal ? " (برگشت)" : ""}
                    </AccountingTableCell>
                    <AccountingTableCell>{accountingSourceLabel(row.source_type)}</AccountingTableCell>
                    <AccountingTableCell align="left">{formatAccountingMoney(row.debit)}</AccountingTableCell>
                    <AccountingTableCell align="left">{formatAccountingMoney(row.credit)}</AccountingTableCell>
                    <AccountingTableCell align="left">{formatAccountingMoney(row.running_debit)}</AccountingTableCell>
                    <AccountingTableCell align="left">{formatAccountingMoney(row.running_credit)}</AccountingTableCell>
                  </AccountingTableRow>
                ))}
                <AccountingTableRow>
                  <AccountingTableCell colSpan={4} sx={{ fontWeight: 700 }}>
                    جمع دوره
                  </AccountingTableCell>
                  <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                    {formatAccountingMoney(report.period.debit)}
                  </AccountingTableCell>
                  <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                    {formatAccountingMoney(report.period.credit)}
                  </AccountingTableCell>
                  <AccountingTableCell colSpan={2} />
                </AccountingTableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </AccountingPageShell>
  );
}
