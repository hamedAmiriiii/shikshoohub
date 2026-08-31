"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DateObject from "react-date-object";
import { toast } from "react-toastify";
import {
  fetchProfitLoss,
  formatAccountingMoney,
  jalaliYmd,
  type ProfitLossReport,
} from "@/app/lib/accounting";
import { AccountingJalaliDateField, AccountingPageShell } from "@/app/admin/accounting/ui";

function Block({ title, rows }: { title: string; rows: { label: string; value: number; muted?: boolean }[] }) {
  return (
    <Card sx={{ bgcolor: "var(--admin-surface)", border: "1px solid var(--admin-border)", height: "100%" }}>
      <CardContent>
        <Typography sx={{ fontWeight: 700, mb: 1.5, color: "var(--admin-text)" }}>{title}</Typography>
        {rows.map((row) => (
          <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography sx={{ fontSize: 13, color: row.muted ? "var(--admin-text-muted)" : "var(--admin-text)" }}>
              {row.label}
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text)" }}>
              {formatAccountingMoney(row.value)}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AccountingProfitLossPage() {
  const [from, setFrom] = useState<DateObject | null>(null);
  const [to, setTo] = useState<DateObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ProfitLossReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(
        await fetchProfitLoss({
          from: jalaliYmd(from) || undefined,
          to: jalaliYmd(to) || undefined,
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در سود و زیان دفتر");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountingPageShell
      title="سود و زیان دفتر"
      subtitle="این گزارش از آرتیکل سند است و جایگزین گزارش ماهانه POS نیست."
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
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>از تاریخ</Typography>
          <AccountingJalaliDateField value={from} onChange={setFrom} placeholder="از ابتدا" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>تا تاریخ</Typography>
          <AccountingJalaliDateField value={to} onChange={setTo} placeholder="تا امروز" />
        </Box>
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

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Block
              title="فروش و بهای تمام‌شده"
              rows={[
                { label: "درآمد فروش (۴۱۱)", value: report.sales },
                { label: "تخفیفات (۴۱۲)", value: report.discounts },
                { label: "بهای تمام‌شده (۵۱۱)", value: report.cogs },
                { label: "سود ناخالص", value: report.gross_profit },
              ]}
            />
            <Block
              title="هزینه‌های عملیاتی"
              rows={[
                { label: "هزینه جاری (۶۱۱)", value: report.operating_expense },
                { label: "حقوق (۶۱۲)", value: report.payroll },
                { label: "اعتبار وفاداری (۶۱۳)", value: report.loyalty },
              ]}
            />
            <Block
              title="سایر درآمد"
              rows={[{ label: "سایر درآمد (۴۳۱)", value: report.other_income }]}
            />
            <Block
              title="نتیجه"
              rows={[{ label: "سود خالص", value: report.net_profit }]}
            />
          </Box>
        </>
      )}
    </AccountingPageShell>
  );
}
