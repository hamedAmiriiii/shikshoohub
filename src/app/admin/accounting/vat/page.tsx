"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import Link from "next/link";
import DateObject from "react-date-object";
import { toast } from "react-toastify";
import {
  fetchVatReport,
  formatAccountingMoney,
  jalaliYmd,
  type VatReport,
} from "@/app/lib/accounting";
import {
  AccountingJalaliDateField,
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
} from "@/app/admin/accounting/ui";

function partyLabel(row: VatReport["rows"][number]): string {
  if (row.party_name && row.party_phone) return `${row.party_name} — ${row.party_phone}`;
  if (row.party_name) return row.party_name;
  if (row.party_phone) return row.party_phone;
  return "—";
}

function vatModeLabel(mode: string, percent: number | null): string {
  if (mode === "percent" && percent != null) return `${percent}٪`;
  if (mode === "amount") return "مبلغ ثابت";
  return "—";
}

export default function VatReportPage() {
  const [from, setFrom] = useState<DateObject | null>(null);
  const [to, setTo] = useState<DateObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<VatReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(
        await fetchVatReport({
          from: jalaliYmd(from) || undefined,
          to: jalaliYmd(to) || undefined,
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در گزارش ارزش افزوده");
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
      title="گزارش ارزش افزوده"
      subtitle={
        report
          ? `${report.from || "از ابتدا"} تا ${report.to || "امروز"} — اعتبار خرید به تفکیک طرف معامله`
          : "ارزش افزوده پرداخت‌شده در خرید و هزینه"
      }
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
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          mb: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>از تاریخ</Typography>
          <AccountingJalaliDateField value={from} onChange={setFrom} placeholder="از ابتدا" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>تا تاریخ</Typography>
          <AccountingJalaliDateField value={to} onChange={setTo} placeholder="تا امروز" />
        </Box>
      </Box>

      {report && !report.enabled ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          ثبت ارزش افزوده خرید برای این فروشگاه خاموش است. از تنظیمات فاکتور/هزینه می‌توانید روشن کنید؛ ردیف‌های قبلی با مبلغ VAT همچنان اینجا دیده می‌شوند.
        </Alert>
      ) : null}

      {report ? (
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
            mb: 2,
          }}
        >
          {[
            { label: "اعتبار خرید (فاکتور)", value: report.totals.input_invoices },
            { label: "اعتبار خرید (هزینه)", value: report.totals.input_expenses },
            { label: "جمع اعتبار اسناد", value: report.totals.input_documents },
            { label: "خروجی فروش (دفتر)", value: report.totals.output_ledger },
          ].map((card) => (
            <Box
              key={card.label}
              sx={{
                border: "1px solid var(--admin-border)",
                borderRadius: "10px",
                p: 1.5,
                bgcolor: "var(--admin-surface, transparent)",
              }}
            >
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                {formatAccountingMoney(card.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}

      {report ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          مانده تقریبی قابل پرداخت به سازمان: {formatAccountingMoney(report.totals.net_payable)}{" "}
          (خروجی فروش − اعتبار خرید). عدد منفی یعنی اعتبار بیشتر از خروجی است.
        </Alert>
      ) : null}

      {loading ? (
        <Typography sx={{ color: "var(--admin-text-muted)" }}>در حال بارگذاری…</Typography>
      ) : !report ? null : report.rows.length === 0 ? (
        <Alert severity="warning">در این بازه سند خرید/هزینه با ارزش افزوده یافت نشد.</Alert>
      ) : (
        <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <AccountingTableCell>تاریخ</AccountingTableCell>
                <AccountingTableCell>نوع</AccountingTableCell>
                <AccountingTableCell>شماره</AccountingTableCell>
                <AccountingTableCell>طرف معامله</AccountingTableCell>
                <AccountingTableCell>شرح</AccountingTableCell>
                <AccountingTableCell align="left">مبلغ پایه</AccountingTableCell>
                <AccountingTableCell>نرخ</AccountingTableCell>
                <AccountingTableCell align="left">ارزش افزوده</AccountingTableCell>
                <AccountingTableCell>وضعیت پرداخت</AccountingTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.rows.map((row) => (
                <AccountingTableRow key={`${row.kind}-${row.id}`}>
                  <AccountingTableCell>{row.date}</AccountingTableCell>
                  <AccountingTableCell>{row.kind_label}</AccountingTableCell>
                  <AccountingTableCell>
                    <Link
                      href={row.href}
                      style={{ color: "var(--admin-accent)", textDecoration: "none" }}
                    >
                      {row.number != null ? `#${row.number}` : `#${row.id}`}
                    </Link>
                  </AccountingTableCell>
                  <AccountingTableCell>{partyLabel(row)}</AccountingTableCell>
                  <AccountingTableCell>{row.title || "—"}</AccountingTableCell>
                  <AccountingTableCell align="left">
                    {formatAccountingMoney(row.base_amount)}
                  </AccountingTableCell>
                  <AccountingTableCell>{vatModeLabel(row.vat_mode, row.vat_percent)}</AccountingTableCell>
                  <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                    {formatAccountingMoney(row.vat_amount)}
                  </AccountingTableCell>
                  <AccountingTableCell>{row.payment_status_label || "—"}</AccountingTableCell>
                </AccountingTableRow>
              ))}
              <AccountingTableRow>
                <AccountingTableCell colSpan={7} sx={{ fontWeight: 700 }}>
                  جمع ارزش افزوده خرید
                </AccountingTableCell>
                <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                  {formatAccountingMoney(report.totals.input_documents)}
                </AccountingTableCell>
                <AccountingTableCell />
              </AccountingTableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {report?.note ? (
        <Typography sx={{ mt: 2, fontSize: 12, color: "var(--admin-text-muted)" }}>
          {report.note}
          {` گردش دفتر ۱۱۵۰۱: ${formatAccountingMoney(report.accounts.input.net)} — گردش دفتر ۲۱۳۰۱: ${formatAccountingMoney(report.accounts.output.net)}.`}
        </Typography>
      ) : null}
    </AccountingPageShell>
  );
}
