"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
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
import { useParams, useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  fetchBeneficiary,
  formatBeneficiaryAmount,
  formatBeneficiaryLabel,
  type BeneficiaryDetail,
  type BeneficiaryDoc,
} from "@/app/lib/beneficiaries";
import { canSettleDocumentPayment, documentCreditRemaining } from "@/app/lib/documentPayments";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import BeneficiaryBulkDebtPayDialog from "../BeneficiaryBulkDebtPayDialog";

const cellSx = {
  color: "var(--admin-text)",
  fontSize: 12,
  py: 0.9,
  px: 1.25,
  textAlign: "center",
} as const;

function docAmount(doc: BeneficiaryDoc): number {
  if (doc.payable_amount != null && doc.payable_amount !== "") {
    const payable = Number(doc.payable_amount);
    if (Number.isFinite(payable)) return Math.max(0, Math.round(payable));
  }
  const base = typeof doc.amount === "string" ? parseFloat(doc.amount) : Number(doc.amount);
  const vat = Number(doc.vat_amount) || 0;
  const discount = Number(doc.discount_amount) || 0;
  const value = (Number.isFinite(base) ? base : 0) + vat - discount;
  return Math.max(0, Math.round(value));
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printRows(rows: BeneficiaryDoc[]): string {
  if (rows.length === 0) {
    return `<tr><td colspan="4" style="text-align:center">موردی ثبت نشده است</td></tr>`;
  }
  return rows
    .map(
      (row, index) => `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.title || "—")}</td>
        <td>${escapeHtml(formatBeneficiaryAmount(docAmount(row)))}</td>
        <td>${escapeHtml(docDate(row))}</td>
      </tr>`,
    )
    .join("");
}

function printBeneficiary(detail: BeneficiaryDetail) {
  const invoices = detail.invoices || [];
  const expenses = detail.expenses || [];
  const invoiceTotal = invoices.reduce((sum, row) => sum + docAmount(row), 0);
  const expenseTotal = expenses.reduce((sum, row) => sum + docAmount(row), 0);
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(formatBeneficiaryLabel(detail))}</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; color: #111; padding: 16px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 18px 0 8px; }
    .meta { font-size: 12px; color: #555; margin-bottom: 14px; }
    .stats { display: flex; gap: 18px; font-size: 13px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: center; }
    th { background: #f3f5f8; }
    tfoot td { font-weight: 800; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(formatBeneficiaryLabel(detail))}</h1>
  <div class="meta">گردش ذینفع</div>
  <div class="stats">
    <span>کل خرید: <b>${escapeHtml(formatBeneficiaryAmount(detail.purchased_total))}</b></span>
    <span>پرداخت‌شده: <b>${escapeHtml(formatBeneficiaryAmount(detail.paid_total))}</b></span>
    <span>بدهی: <b>${escapeHtml(formatBeneficiaryAmount(detail.unpaid_total))}</b></span>
  </div>
  <h2>فاکتورها</h2>
  <table>
    <thead><tr><th>ردیف</th><th>عنوان</th><th>مبلغ</th><th>تاریخ</th></tr></thead>
    <tbody>${printRows(invoices)}</tbody>
    <tfoot><tr><td colspan="2">جمع فاکتورها</td><td>${escapeHtml(formatBeneficiaryAmount(invoiceTotal))}</td><td></td></tr></tfoot>
  </table>
  <h2>هزینه‌ها</h2>
  <table>
    <thead><tr><th>ردیف</th><th>عنوان</th><th>مبلغ</th><th>تاریخ</th></tr></thead>
    <tbody>${printRows(expenses)}</tbody>
    <tfoot><tr><td colspan="2">جمع هزینه‌ها</td><td>${escapeHtml(formatBeneficiaryAmount(expenseTotal))}</td><td></td></tr></tfoot>
  </table>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:800px;height:600px;border:0;opacity:0;pointer-events:none;z-index:-1";
  const cleanup = () => window.setTimeout(() => iframe.remove(), 400);
  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      iframe.remove();
      return;
    }
    frameWindow.addEventListener("afterprint", cleanup, { once: true });
    frameWindow.focus();
    frameWindow.print();
  };
  document.body.appendChild(iframe);
  iframe.srcdoc = html;
}

function docDate(doc: BeneficiaryDoc): string {
  return doc.date || doc.created_at || "—";
}

function DocsTable({ rows }: { rows: BeneficiaryDoc[] }) {
  if (rows.length === 0) {
    return (
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, py: 1.5, textAlign: "center" }}>
        موردی ثبت نشده است
      </Typography>
    );
  }
  return (
    <TableContainer
      component={Paper}
      sx={{
        backgroundColor: "var(--admin-surface)",
        borderRadius: "10px",
        border: "1px solid var(--admin-border)",
        boxShadow: "none",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>ردیف</TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>عنوان</TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>مبلغ</TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>تاریخ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id ?? index}>
              <TableCell sx={cellSx}>{index + 1}</TableCell>
              <TableCell sx={cellSx}>{row.title || "—"}</TableCell>
              <TableCell sx={cellSx}>{formatBeneficiaryAmount(docAmount(row))} تومان</TableCell>
              <TableCell sx={cellSx}>{docDate(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function BeneficiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [detail, setDetail] = useState<BeneficiaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkPayOpen, setBulkPayOpen] = useState(false);

  const reload = useCallback(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchBeneficiary(id)
      .then((row) => {
        setDetail(row);
        if (!row) toast.error("ذینفع پیدا نشد");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchBeneficiary(id)
      .then((row) => {
        if (!cancelled) setDetail(row);
        if (!row) toast.error("ذینفع پیدا نشد");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const unpaidInvoices = useMemo(
    () => (detail?.invoices || []).filter((row) => canSettleDocumentPayment(row)),
    [detail?.invoices],
  );
  const unpaidInvoiceTotal = useMemo(
    () => unpaidInvoices.reduce((sum, row) => sum + documentCreditRemaining(row), 0),
    [unpaidInvoices],
  );

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.25, md: 2 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.25, md: 2 } }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : !detail ? (
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>ذینفع پیدا نشد</Typography>
        ) : (
          <>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "var(--admin-text)", mb: 0.5 }}>
              {formatBeneficiaryLabel(detail)}
            </Typography>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1.5 }}>
              بدهی فقط روی اسناد پرداخت‌نشده حساب می‌شود
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 1,
                mb: 1.5,
              }}
            >
              {[
                { label: "کل خرید", value: detail.purchased_total },
                { label: "پرداخت‌شده", value: detail.paid_total },
                { label: "بدهی", value: detail.unpaid_total },
              ].map((item) => (
                <Card
                  key={item.label}
                  sx={{
                    backgroundColor: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "10px",
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ py: 1, px: 1.5, "&:last-child": { pb: 1 } }}>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>{item.label}</Typography>
                    <Typography sx={{ color: "var(--admin-accent)", fontSize: 14, fontWeight: 700 }}>
                      {formatBeneficiaryAmount(item.value)} تومان
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              {unpaidInvoices.length > 0 ? (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setBulkPayOpen(true)}
                  sx={{
                    ...adminButtonStartIconSx,
                    bgcolor: "var(--admin-accent)",
                    color: "var(--admin-on-accent)",
                    fontSize: 12,
                    "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                  }}
                >
                  پرداخت بدهی جمعی
                </Button>
              ) : null}
              <Button
                size="small"
                variant="outlined"
                onClick={() => printBeneficiary(detail)}
                sx={{
                  ...adminButtonStartIconSx,
                  color: "var(--admin-text)",
                  borderColor: "var(--admin-border)",
                  fontSize: 12,
                }}
              >
                پرینت
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => router.push(`/admin/invoices?beneficiary_id=${detail.id}`)}
                sx={{
                  ...adminButtonStartIconSx,
                  color: "var(--admin-text)",
                  borderColor: "var(--admin-border)",
                  fontSize: 12,
                }}
              >
                فاکتورهای این ذینفع
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => router.push(`/admin/expenses?beneficiary_id=${detail.id}`)}
                sx={{
                  ...adminButtonStartIconSx,
                  color: "var(--admin-text)",
                  borderColor: "var(--admin-border)",
                  fontSize: 12,
                }}
              >
                هزینه‌های این ذینفع
              </Button>
            </Box>

            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", mb: 1 }}>
              فاکتورها
            </Typography>
            <DocsTable rows={detail.invoices || []} />

            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", mt: 2, mb: 1 }}>
              هزینه‌ها
            </Typography>
            <DocsTable rows={detail.expenses || []} />
          </>
        )}
        <BeneficiaryBulkDebtPayDialog
          open={bulkPayOpen}
          invoices={unpaidInvoices}
          unpaidTotal={unpaidInvoiceTotal}
          onClose={() => setBulkPayOpen(false)}
          onSuccess={() => {
            setBulkPayOpen(false);
            reload();
          }}
        />
        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
