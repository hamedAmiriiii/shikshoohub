"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DateObject from "react-date-object";
import { toast } from "react-toastify";
import {
  fetchTrialBalance,
  formatAccountingMoney,
  jalaliYmd,
  type TrialBalanceReport,
} from "@/app/lib/accounting";
import {
  AccountingJalaliDateField,
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
  accountingFieldSx,
} from "@/app/admin/accounting/ui";

export default function TrialBalancePage() {
  const [from, setFrom] = useState<DateObject | null>(null);
  const [to, setTo] = useState<DateObject | null>(null);
  const [includeZero, setIncludeZero] = useState(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<TrialBalanceReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(
        await fetchTrialBalance({
          from: jalaliYmd(from) || undefined,
          to: jalaliYmd(to) || undefined,
          includeZero,
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در تراز آزمایشی");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [from, includeZero, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountingPageShell
      title="تراز آزمایشی"
      subtitle={report ? `${report.from || "از ابتدا"} تا ${report.to || "امروز"}` : "گردش و مانده از آرتیکل سند"}
      actions={
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={load}
          sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
        >
          بروزرسانی
        </Button>
      }
    >
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" }, mb: 2, alignItems: "center" }}>
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>از تاریخ</Typography>
          <AccountingJalaliDateField value={from} onChange={setFrom} placeholder="از ابتدا" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>تا تاریخ</Typography>
          <AccountingJalaliDateField value={to} onChange={setTo} placeholder="تا امروز" />
        </Box>
        <FormControlLabel
          control={<Switch checked={includeZero} onChange={(e) => setIncludeZero(e.target.checked)} />}
          label={<Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>حساب‌های بدون گردش</Typography>}
          sx={{ ...accountingFieldSx, whiteSpace: "nowrap" }}
        />
      </Box>

      {report && !report.balanced ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          تراز برقرار نیست. این باگ سند است نه UI؛ عدد دفتر را عوض نکنید.
        </Alert>
      ) : null}

      {loading ? (
        <Typography sx={{ color: "var(--admin-text-muted)" }}>در حال بارگذاری…</Typography>
      ) : !report ? null : (
        <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <AccountingTableCell>کد</AccountingTableCell>
                <AccountingTableCell>حساب</AccountingTableCell>
                <AccountingTableCell align="left">گردش بدهکار</AccountingTableCell>
                <AccountingTableCell align="left">گردش بستانکار</AccountingTableCell>
                <AccountingTableCell align="left">مانده بدهکار</AccountingTableCell>
                <AccountingTableCell align="left">مانده بستانکار</AccountingTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.rows.map((row) => (
                <AccountingTableRow key={row.account_id}>
                  <AccountingTableCell>{row.code}</AccountingTableCell>
                  <AccountingTableCell>{row.name}</AccountingTableCell>
                  <AccountingTableCell align="left">{formatAccountingMoney(row.debit_turnover)}</AccountingTableCell>
                  <AccountingTableCell align="left">{formatAccountingMoney(row.credit_turnover)}</AccountingTableCell>
                  <AccountingTableCell align="left">{formatAccountingMoney(row.debit_balance)}</AccountingTableCell>
                  <AccountingTableCell align="left">{formatAccountingMoney(row.credit_balance)}</AccountingTableCell>
                </AccountingTableRow>
              ))}
              <AccountingTableRow>
                <AccountingTableCell colSpan={2} sx={{ fontWeight: 700 }}>
                  جمع
                </AccountingTableCell>
                <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                  {formatAccountingMoney(report.totals.debit_turnover)}
                </AccountingTableCell>
                <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                  {formatAccountingMoney(report.totals.credit_turnover)}
                </AccountingTableCell>
                <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                  {formatAccountingMoney(report.totals.debit_balance)}
                </AccountingTableCell>
                <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                  {formatAccountingMoney(report.totals.credit_balance)}
                </AccountingTableCell>
              </AccountingTableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </AccountingPageShell>
  );
}
