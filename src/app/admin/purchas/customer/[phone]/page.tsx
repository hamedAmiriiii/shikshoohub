"use client";

import { useEffect, useState } from "react";
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
import PrintIcon from "@mui/icons-material/Print";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { paymentTypeLabel } from "@/app/lib/paymentTypes";
import { isIranMobile, normalizeIranMobile } from "@/app/lib/purchaseReturns";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";

type HistoryItem = {
  display_name?: string | null;
  item_name?: string | null;
  quantity?: number | string | null;
  product?: { name?: string | null } | null;
};

type HistoryPurchase = {
  id: number;
  created_at?: string | null;
  total_amount?: number | string | null;
  payment_type?: string | null;
  payment_type_label?: string | null;
  purchased_products?: HistoryItem[];
};

type HistoryStats = {
  phone?: string;
  name?: string | null;
  id?: number | null;
  total_purchases?: number;
  total_spent?: number | string;
  current_credit?: number | string;
};

type BeneficiaryTotals = {
  purchased_total?: number;
  paid_total?: number;
  unpaid_total?: number;
  invoice_count?: number;
  expense_count?: number;
};

const cellSx = {
  color: "var(--admin-text)",
  fontSize: 12,
  py: 0.9,
  px: 1.25,
  textAlign: "center",
  whiteSpace: "nowrap",
} as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asAmount(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: unknown): string {
  return `${new Intl.NumberFormat("fa-IR").format(Math.floor(asAmount(value)))} تومان`;
}

function itemLabel(item: HistoryItem): string {
  const name = String(item.display_name || item.item_name || item.product?.name || "").trim();
  if (!name) return "";
  const qty = asAmount(item.quantity);
  if (qty > 1) return `${name} × ${new Intl.NumberFormat("fa-IR").format(qty)}`;
  return name;
}

function purchaseItems(purchase: HistoryPurchase): string {
  const labels = (purchase.purchased_products || []).map(itemLabel).filter(Boolean);
  return labels.length ? labels.join("، ") : "—";
}

function paymentLabel(purchase: HistoryPurchase): string {
  return purchase.payment_type_label || paymentTypeLabel(purchase.payment_type || "");
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printCustomerHistory(input: {
  title: string;
  phone: string;
  purchaseCount: string;
  totalSpent: string;
  credit: string;
  purchases: HistoryPurchase[];
  boughtFromCustomer: boolean;
  purchasedTotal: string;
  unpaidTotal: string;
}) {
  const rows = input.purchases
    .map(
      (purchase) => `<tr>
        <td>#${escapeHtml(purchase.id)}</td>
        <td>${escapeHtml(purchase.created_at || "—")}</td>
        <td>${escapeHtml(paymentLabel(purchase))}</td>
        <td>${escapeHtml(formatMoney(purchase.total_amount))}</td>
        <td class="items">${escapeHtml(purchaseItems(purchase))}</td>
      </tr>`,
    )
    .join("");
  const bought = input.boughtFromCustomer
    ? `<p class="note">خرید از این شخص: ${escapeHtml(input.purchasedTotal)} — بدهی ${escapeHtml(input.unpaidTotal)}</p>`
    : "";
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>سابقه ${escapeHtml(input.title)}</title>
  <style>
    body { font-family: Tahoma, "IRANSans", sans-serif; direction: rtl; padding: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { font-size: 12px; color: #555; margin-bottom: 14px; }
    .stats { display: flex; gap: 16px; font-size: 13px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: center; }
    th { background: #f3f3f3; }
    td.items { text-align: right; }
    .note { margin-top: 14px; font-size: 12px; color: #333; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(input.title)}</h1>
  <div class="sub">فروش‌های ثبت‌شده برای این مشتری</div>
  <div class="stats">
    <span>تعداد فروش: ${escapeHtml(input.purchaseCount)}</span>
    <span>مجموع فروش: ${escapeHtml(input.totalSpent)}</span>
    <span>اعتبار فعلی: ${escapeHtml(input.credit)}</span>
  </div>
  <table>
    <thead>
      <tr><th>شماره</th><th>تاریخ</th><th>پرداخت</th><th>مبلغ</th><th>اقلام</th></tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="5">فروشی ثبت نشده</td></tr>`}
    </tbody>
  </table>
  ${bought}
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
  return true;
}

async function downloadCustomerHistoryExcel(input: {
  title: string;
  phone: string;
  purchaseCount: number;
  totalSpent: number;
  credit: number;
  purchases: HistoryPurchase[];
  boughtFromCustomer: boolean;
  purchasedTotal: number;
  unpaidTotal: number;
}) {
  const XLSX = await import("xlsx");
  const rows: Array<Array<string | number>> = [
    ["مشتری", input.title],
    ["شماره", input.phone],
    ["تعداد فروش", input.purchaseCount],
    ["مجموع فروش (تومان)", input.totalSpent],
    ["اعتبار فعلی (تومان)", input.credit],
  ];
  if (input.boughtFromCustomer) {
    rows.push(["خرید از این شخص (تومان)", input.purchasedTotal], ["بدهی (تومان)", input.unpaidTotal]);
  }
  rows.push([], ["شماره", "تاریخ", "پرداخت", "مبلغ (تومان)", "اقلام"]);
  for (const purchase of input.purchases) {
    rows.push([
      purchase.id,
      purchase.created_at || "",
      paymentLabel(purchase),
      Math.floor(asAmount(purchase.total_amount)),
      purchaseItems(purchase) === "—" ? "" : purchaseItems(purchase),
    ]);
  }
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 48 }];
  const book = XLSX.utils.book_new();
  book.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(book, sheet, "سابقه");
  XLSX.writeFile(book, `سابقه-مشتری-${input.phone}.xlsx`);
}

export default function CustomerPurchaseHistoryPage() {
  const params = useParams();
  const phone = normalizeIranMobile(String(params?.phone || ""));
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [purchases, setPurchases] = useState<HistoryPurchase[]>([]);
  const [beneficiary, setBeneficiary] = useState<BeneficiaryTotals | null>(null);

  useEffect(() => {
    if (!isIranMobile(phone)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const token = tokenCode();
      const res = await FetchWithJwtClient("GET", `/api/customers/${phone}`, token);
      if (cancelled) return;
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "سابقه مشتری دریافت نشد"));
        setStats(null);
        setPurchases([]);
        setLoading(false);
        return;
      }
      const body = asRecord(res);
      const nested = asRecord(body?.data);
      const statsRow = (asRecord(body?.stats) ?? asRecord(nested?.stats) ?? null) as HistoryStats | null;
      const list = Array.isArray(body?.purchases)
        ? body.purchases
        : Array.isArray(nested?.purchases)
          ? nested.purchases
          : [];
      const beneficiaryRow = (asRecord(body?.as_beneficiary) ?? asRecord(nested?.as_beneficiary) ?? null) as BeneficiaryTotals | null;
      setStats(statsRow);
      setPurchases(list as HistoryPurchase[]);
      setBeneficiary(beneficiaryRow);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [phone]);

  const name = String(stats?.name || "").trim();
  const title = name ? `${name} — ${phone}` : phone;
  const boughtFromCustomer =
    asAmount(beneficiary?.purchased_total) > 0 ||
    asAmount(beneficiary?.invoice_count) > 0 ||
    asAmount(beneficiary?.expense_count) > 0;
  const beneficiaryId = Number(stats?.id);
  const purchaseCountLabel = new Intl.NumberFormat("fa-IR").format(
    purchases.length || asAmount(stats?.total_purchases),
  );
  const exportInput = {
    title,
    phone,
    purchaseCount: purchases.length || asAmount(stats?.total_purchases),
    totalSpent: Math.floor(asAmount(stats?.total_spent)),
    credit: Math.floor(asAmount(stats?.current_credit)),
    purchases,
    boughtFromCustomer,
    purchasedTotal: Math.floor(asAmount(beneficiary?.purchased_total)),
    unpaidTotal: Math.floor(asAmount(beneficiary?.unpaid_total)),
  };

  const handlePrint = () => {
    const ok = printCustomerHistory({
      ...exportInput,
      purchaseCount: purchaseCountLabel,
      totalSpent: formatMoney(stats?.total_spent),
      credit: formatMoney(stats?.current_credit),
      purchasedTotal: formatMoney(beneficiary?.purchased_total),
      unpaidTotal: formatMoney(beneficiary?.unpaid_total),
    });
    if (!ok) toast.error("پنجره پرینت باز نشد");
  };

  const handleExcel = () => {
    void downloadCustomerHistoryExcel(exportInput).catch(() => {
      toast.error("خروجی اکسل ساخته نشد");
    });
  };

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.25, md: 2 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.25, md: 2 } }}>
        <ToastContainer autoClose={3000} position="bottom-right" rtl />
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : !isIranMobile(phone) ? (
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>شماره مشتری معتبر نیست</Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "var(--admin-text)", mb: 0.5 }}>
                  {title}
                </Typography>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                  فروش‌های ثبت‌شده برای این مشتری
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
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
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExcel}
                  sx={{
                    ...adminButtonStartIconSx,
                    color: "var(--admin-text)",
                    borderColor: "var(--admin-border)",
                    fontSize: 12,
                  }}
                >
                  خروجی اکسل
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 1,
                mb: 1.5,
              }}
            >
              {[
                { label: "تعداد فروش", value: purchaseCountLabel },
                { label: "مجموع فروش", value: formatMoney(stats?.total_spent) },
                { label: "اعتبار فعلی", value: formatMoney(stats?.current_credit) },
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
                    <Typography sx={{ color: "var(--admin-accent)", fontSize: 14, fontWeight: 700 }}>{item.value}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {purchases.length === 0 ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, py: 2, textAlign: "center" }}>
                فروشی برای این مشتری ثبت نشده
              </Typography>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  backgroundColor: "var(--admin-surface)",
                  borderRadius: "10px",
                  border: "1px solid var(--admin-border)",
                  boxShadow: "none",
                  overflowX: "auto",
                  mb: 2,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["شماره", "تاریخ", "پرداخت", "مبلغ", "اقلام"].map((label) => (
                        <TableCell key={label} sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell sx={cellSx}>#{purchase.id}</TableCell>
                        <TableCell sx={cellSx}>{purchase.created_at || "—"}</TableCell>
                        <TableCell sx={cellSx}>
                          {purchase.payment_type_label || paymentTypeLabel(purchase.payment_type || "")}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, color: "var(--admin-accent)", fontWeight: 700 }}>
                          {formatMoney(purchase.total_amount)}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, whiteSpace: "normal", textAlign: "right" }}>
                          {purchaseItems(purchase)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {boughtFromCustomer && Number.isFinite(beneficiaryId) && beneficiaryId > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                  خرید از این شخص: {formatMoney(beneficiary?.purchased_total)} — بدهی {formatMoney(beneficiary?.unpaid_total)}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  component={Link}
                  href={`/admin/beneficiaries/${beneficiaryId}`}
                  sx={{
                    ...adminButtonStartIconSx,
                    color: "var(--admin-text)",
                    borderColor: "var(--admin-border)",
                    fontSize: 12,
                  }}
                >
                  اسناد خرید
                </Button>
              </Box>
            ) : null}
          </>
        )}
      </Container>
    </Box>
  );
}
