"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  fetchBalanceSheet,
  formatAccountingMoney,
  jalaliYmd,
  type BalanceSheetReport,
  type BalanceSheetRow,
} from "@/app/lib/accounting";
import {
  AccountingJalaliDateField,
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
} from "@/app/admin/accounting/ui";

function Section({
  title,
  total,
  rows,
}: {
  title: string;
  total: number;
  rows: BalanceSheetRow[];
}) {
  return (
    <Card sx={{ bgcolor: "var(--admin-surface)", border: "1px solid var(--admin-border)", height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography sx={{ fontWeight: 700, color: "var(--admin-text)" }}>{title}</Typography>
          <Typography sx={{ fontWeight: 700, color: "var(--admin-accent)" }}>
            {formatAccountingMoney(total)}
          </Typography>
        </Box>
        {rows.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>ردیفی نیست</Typography>
        ) : (
          rows.map((row) => (
            <Box key={row.code} sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
              <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>
                {row.code} {row.name ? `— ${row.name}` : ""}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>
                {formatAccountingMoney(row.debit_balance ?? row.credit_balance ?? 0)}
              </Typography>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function BalanceSheetPage() {
  const [asOf, setAsOf] = useState<DateObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<BalanceSheetReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await fetchBalanceSheet({ asOf: jalaliYmd(asOf) || undefined }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ترازنامه");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [asOf]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountingPageShell
      title="ترازنامه"
      subtitle="دارایی = بدهی + سرمایه + سود جاری. عدد دفتر را با اختلاف نقد عوض نکنید."
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
      <Box sx={{ maxWidth: 280, mb: 2 }}>
        <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>تا تاریخ</Typography>
        <AccountingJalaliDateField value={asOf} onChange={setAsOf} placeholder="امروز تهران" />
      </Box>

      {loading ? (
        <Typography sx={{ color: "var(--admin-text-muted)" }}>در حال بارگذاری…</Typography>
      ) : !report ? null : (
        <>
          {report.note ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              {report.note}
            </Alert>
          ) : null}

          {!report.equation.balanced ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              معادله ترازنامه برقرار نیست. این باگ سند است نه UI.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              معادله برقرار است: دارایی {formatAccountingMoney(report.equation.assets)} = بدهی‌سرمایه‌سود{" "}
              {formatAccountingMoney(report.equation.liabilities_equity_profit)}
            </Alert>
          )}

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mb: 2 }}>
            <Section title="دارایی‌ها" total={report.assets.total} rows={report.assets.rows} />
            <Section title="بدهی‌ها" total={report.liabilities.total} rows={report.liabilities.rows} />
            <Section title="سرمایه" total={report.equity.total} rows={report.equity.rows} />
            <Card sx={{ bgcolor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700, color: "var(--admin-text)" }}>
                    {report.current_profit_label || "سود جاری"}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "var(--admin-accent)" }}>
                    {formatAccountingMoney(report.current_profit)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Typography sx={{ fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>تطبیق نقد دفتر و عملیات</Typography>
          <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <AccountingTableCell>کد</AccountingTableCell>
                  <AccountingTableCell>نام</AccountingTableCell>
                  <AccountingTableCell align="left">مانده دفتر</AccountingTableCell>
                  <AccountingTableCell align="left">مانده عملیاتی</AccountingTableCell>
                  <AccountingTableCell align="left">اختلاف</AccountingTableCell>
                  <AccountingTableCell>یادداشت</AccountingTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.cash_compare.map((row) => {
                  const mismatch = row.difference != null && row.difference !== 0;
                  return (
                    <AccountingTableRow key={row.code} sx={mismatch ? { bgcolor: "rgba(244, 67, 54, 0.12) !important" } : undefined}>
                      <AccountingTableCell>{row.code}</AccountingTableCell>
                      <AccountingTableCell>{row.name || "—"}</AccountingTableCell>
                      <AccountingTableCell align="left">{formatAccountingMoney(row.ledger_balance)}</AccountingTableCell>
                      <AccountingTableCell align="left">
                        {row.operational_balance == null ? "—" : formatAccountingMoney(row.operational_balance)}
                      </AccountingTableCell>
                      <AccountingTableCell align="left">
                        {row.difference == null ? "—" : formatAccountingMoney(row.difference)}
                      </AccountingTableCell>
                      <AccountingTableCell>{row.note || (mismatch ? "اختلاف با عملیات؛ عدد دفتر عوض نشود" : "—")}</AccountingTableCell>
                    </AccountingTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </AccountingPageShell>
  );
}
