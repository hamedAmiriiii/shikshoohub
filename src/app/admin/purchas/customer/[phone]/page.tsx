"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { paymentTypeLabel } from "@/app/lib/paymentTypes";
import { isIranMobile, normalizeIranMobile } from "@/app/lib/purchaseReturns";
import { buildDocumentLink, type LedgerDocumentType } from "@/app/lib/documentReturn";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import BeneficiarySelect from "@/app/admin/BeneficiarySelect";
import type { Beneficiary } from "@/app/lib/beneficiaries";

type LedgerSide = "debtor" | "creditor" | "settled";

type LedgerEntry = {
  key: string;
  type: LedgerDocumentType;
  id: number;
  date?: string | null;
  description?: string | null;
  payment_type?: string | null;
  amount: number | string;
  debtor_amount: number | string;
  creditor_amount: number | string;
  side: LedgerSide;
};

type LedgerSummary = {
  sales_total?: number | string;
  documents_total?: number | string;
  debtor_total?: number | string;
  creditor_total?: number | string;
  net?: number | string;
  net_side?: LedgerSide;
};

type HistoryStats = {
  phone?: string;
  name?: string | null;
  id?: number | null;
  total_purchases?: number;
  total_spent?: number | string;
  current_credit?: number | string;
};

type LedgerFilter = "all" | LedgerDocumentType | "open";

const DEBTOR_COLOR = "#ef5350";
const CREDITOR_COLOR = "#43a047";

const TYPE_LABEL: Record<LedgerDocumentType, string> = {
  sale: "فروش",
  invoice: "فاکتور",
  expense: "هزینه",
};

const SIDE_LABEL: Record<LedgerSide, string> = {
  debtor: "بدهکار",
  creditor: "بستانکار",
  settled: "تسویه‌شده",
};

const SIDE_COLOR: Record<LedgerSide, string> = {
  debtor: DEBTOR_COLOR,
  creditor: CREDITOR_COLOR,
  settled: "var(--admin-text-muted)",
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

function formatMoneyOrDash(value: unknown): string {
  return asAmount(value) > 0 ? formatMoney(value) : "—";
}

function entryKind(entry: LedgerEntry): string {
  if (entry.type === "sale" && entry.payment_type) {
    return `${TYPE_LABEL.sale} · ${paymentTypeLabel(entry.payment_type)}`;
  }
  return TYPE_LABEL[entry.type];
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function netText(summary: LedgerSummary | null): string {
  const side = summary?.net_side ?? "settled";
  if (side === "settled") return "تسویه";
  return `${SIDE_LABEL[side]} ${formatMoney(Math.abs(asAmount(summary?.net)))}`;
}

function netHint(summary: LedgerSummary | null): string {
  const side = summary?.net_side ?? "settled";
  if (side === "debtor") return "این شخص به شما بدهکار است";
  if (side === "creditor") return "شما به این شخص بدهکارید";
  return "حساب این شخص صاف است";
}

function printLedger(input: {
  title: string;
  summary: LedgerSummary | null;
  credit: string;
  entries: LedgerEntry[];
}) {
  const rows = input.entries
    .map(
      (entry) => `<tr>
        <td>#${escapeHtml(entry.id)}</td>
        <td>${escapeHtml(entry.date || "—")}</td>
        <td>${escapeHtml(entryKind(entry))}</td>
        <td class="items">${escapeHtml(entry.description || "—")}</td>
        <td>${escapeHtml(formatMoney(entry.amount))}</td>
        <td class="debtor">${escapeHtml(formatMoneyOrDash(entry.debtor_amount))}</td>
        <td class="creditor">${escapeHtml(formatMoneyOrDash(entry.creditor_amount))}</td>
        <td>${escapeHtml(SIDE_LABEL[entry.side])}</td>
      </tr>`,
    )
    .join("");
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>گردش مالی ${escapeHtml(input.title)}</title>
  <style>
    body { font-family: Tahoma, "IRANSans", sans-serif; direction: rtl; padding: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { font-size: 12px; color: #555; margin-bottom: 14px; }
    .stats { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: center; }
    th { background: #f3f3f3; }
    td.items { text-align: right; }
    td.debtor { color: #c62828; }
    td.creditor { color: #2e7d32; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(input.title)}</h1>
  <div class="sub">گردش مالی کامل: فروش، فاکتور و هزینه</div>
  <div class="stats">
    <span><b>وضعیت حساب:</b> ${escapeHtml(netText(input.summary))}</span>
    <span>جمع بدهکاری: ${escapeHtml(formatMoney(input.summary?.debtor_total))}</span>
    <span>جمع بستانکاری: ${escapeHtml(formatMoney(input.summary?.creditor_total))}</span>
    <span>مجموع فروش: ${escapeHtml(formatMoney(input.summary?.sales_total))}</span>
    <span>اعتبار باشگاه: ${escapeHtml(input.credit)}</span>
  </div>
  <table>
    <thead>
      <tr><th>شماره</th><th>تاریخ</th><th>نوع</th><th>شرح</th><th>مبلغ</th><th>بدهکار</th><th>بستانکار</th><th>وضعیت</th></tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="8">تراکنشی ثبت نشده</td></tr>`}
    </tbody>
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
  return true;
}

async function downloadLedgerExcel(input: {
  title: string;
  phone: string;
  summary: LedgerSummary | null;
  entries: LedgerEntry[];
}) {
  const XLSX = await import("xlsx");
  const rows: Array<Array<string | number>> = [
    ["مشتری", input.title],
    ["شماره", input.phone],
    ["وضعیت حساب", netText(input.summary)],
    ["جمع بدهکاری (تومان)", Math.floor(asAmount(input.summary?.debtor_total))],
    ["جمع بستانکاری (تومان)", Math.floor(asAmount(input.summary?.creditor_total))],
    ["مجموع فروش (تومان)", Math.floor(asAmount(input.summary?.sales_total))],
    [],
    ["شماره", "تاریخ", "نوع", "شرح", "مبلغ (تومان)", "بدهکار (تومان)", "بستانکار (تومان)", "وضعیت"],
  ];
  for (const entry of input.entries) {
    rows.push([
      entry.id,
      entry.date || "",
      entryKind(entry),
      entry.description || "",
      Math.floor(asAmount(entry.amount)),
      Math.floor(asAmount(entry.debtor_amount)),
      Math.floor(asAmount(entry.creditor_amount)),
      SIDE_LABEL[entry.side],
    ]);
  }
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 44 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
  const book = XLSX.utils.book_new();
  book.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(book, sheet, "گردش مالی");
  XLSX.writeFile(book, `گردش-مالی-${input.phone}.xlsx`);
}

export default function CustomerPurchaseHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const phone = normalizeIranMobile(String(params?.phone || ""));
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [beneficiaryId, setBeneficiaryId] = useState<number>(0);
  const [filter, setFilter] = useState<LedgerFilter>("all");

  const pagePath = `/admin/purchas/customer/${phone}`;

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
        toast.error(getApiErrorMessage(res, "گردش مالی مشتری دریافت نشد"));
        setStats(null);
        setLedger([]);
        setSummary(null);
        setLoading(false);
        return;
      }
      const body = asRecord(res);
      const nested = asRecord(body?.data);
      const source = body?.ledger !== undefined || body?.stats !== undefined ? body : nested;
      const statsRow = (asRecord(source?.stats) ?? null) as HistoryStats | null;
      setStats(statsRow);
      setLedger(Array.isArray(source?.ledger) ? (source?.ledger as LedgerEntry[]) : []);
      setSummary((asRecord(source?.ledger_summary) ?? null) as LedgerSummary | null);
      setBeneficiaryId(Number(statsRow?.id) || 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [phone]);

  const visibleEntries = useMemo(() => {
    if (filter === "all") return ledger;
    if (filter === "open") return ledger.filter((entry) => entry.side !== "settled");
    return ledger.filter((entry) => entry.type === filter);
  }, [ledger, filter]);

  const name = String(stats?.name || "").trim();
  const title = name ? `${name} — ${phone}` : phone;
  const netSide = summary?.net_side ?? "settled";
  const hasDocuments = ledger.some((entry) => entry.type !== "sale");

  const openEntry = (entry: LedgerEntry) => {
    router.push(buildDocumentLink(entry.type, entry.id, pagePath));
  };

  const handlePrint = () => {
    const ok = printLedger({
      title,
      summary,
      credit: formatMoney(stats?.current_credit),
      entries: visibleEntries,
    });
    if (!ok) toast.error("پنجره پرینت باز نشد");
  };

  const handleExcel = () => {
    void downloadLedgerExcel({ title, phone, summary, entries: visibleEntries }).catch(() => {
      toast.error("خروجی اکسل ساخته نشد");
    });
  };

  const summaryCards = [
    {
      label: "وضعیت حساب",
      value: netText(summary),
      hint: netHint(summary),
      color: SIDE_COLOR[netSide],
      emphasis: true,
    },
    { label: "جمع بدهکاری", value: formatMoney(summary?.debtor_total), hint: "طلب شما از این شخص", color: DEBTOR_COLOR },
    { label: "جمع بستانکاری", value: formatMoney(summary?.creditor_total), hint: "بدهی شما به این شخص", color: CREDITOR_COLOR },
    { label: "مجموع فروش", value: formatMoney(summary?.sales_total ?? stats?.total_spent), color: "var(--admin-accent)" },
    { label: "اعتبار باشگاه", value: formatMoney(stats?.current_credit), color: "var(--admin-accent)" },
  ];

  const currentBeneficiary: Beneficiary | null =
    beneficiaryId > 0 ? { id: beneficiaryId, name: name || null, phone: phone || null } : null;

  const switchCustomer = (option: Beneficiary | null) => {
    if (!option) return;
    const nextPhone = normalizeIranMobile(String(option.phone || ""));
    if (!isIranMobile(nextPhone)) {
      toast.error("این طرف‌حساب شماره موبایل معتبر ندارد");
      return;
    }
    if (nextPhone === phone) return;
    router.push(`/admin/purchas/customer/${nextPhone}`);
  };

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.25, md: 2 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.25, md: 2 } }}>
        <ToastContainer autoClose={3000} position="bottom-right" rtl />

        <Box
          sx={{
            mb: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <BeneficiarySelect
            value={beneficiaryId > 0 ? beneficiaryId : ""}
            initialOption={currentBeneficiary?.id ? currentBeneficiary : null}
            onChange={(_id, option) => switchCustomer(option)}
            label="جستجو با نام یا طرف‌حساب"
            helperText="فقط نام یا شماره را تایپ کنید"
            allowRegister={false}
          />
        </Box>

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
                  گردش مالی کامل: فروش، فاکتور و هزینه
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{ ...adminButtonStartIconSx, color: "var(--admin-text)", borderColor: "var(--admin-border)", fontSize: 12 }}
                >
                  پرینت
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExcel}
                  sx={{ ...adminButtonStartIconSx, color: "var(--admin-text)", borderColor: "var(--admin-border)", fontSize: 12 }}
                >
                  خروجی اکسل
                </Button>
                {beneficiaryId > 0 && hasDocuments ? (
                  <Button
                    size="small"
                    variant="outlined"
                    component={Link}
                    href={`/admin/beneficiaries/${beneficiaryId}`}
                    sx={{ ...adminButtonStartIconSx, color: "var(--admin-text)", borderColor: "var(--admin-border)", fontSize: 12 }}
                  >
                    اسناد خرید
                  </Button>
                ) : null}
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" },
                gap: 1,
                mb: 1.5,
              }}
            >
              {summaryCards.map((item) => (
                <Card
                  key={item.label}
                  sx={{
                    backgroundColor: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    borderColor: item.emphasis ? item.color : "var(--admin-border)",
                    borderRadius: "10px",
                    boxShadow: "none",
                    gridColumn: item.emphasis ? { xs: "1 / -1", md: "auto" } : "auto",
                  }}
                >
                  <CardContent sx={{ py: 1, px: 1.5, "&:last-child": { pb: 1 } }}>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>{item.label}</Typography>
                    <Typography sx={{ color: item.color, fontSize: item.emphasis ? 16 : 14, fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                    {item.hint ? (
                      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.25 }}>{item.hint}</Typography>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </Box>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={filter}
              onChange={(_, value: LedgerFilter | null) => value && setFilter(value)}
              sx={{ mb: 1.25, flexWrap: "wrap", direction: "rtl" }}
            >
              {(
                [
                  ["all", "همه"],
                  ["open", "فقط مانده‌دار"],
                  ["sale", "فروش"],
                  ["invoice", "فاکتور"],
                  ["expense", "هزینه"],
                ] as Array<[LedgerFilter, string]>
              ).map(([value, label]) => (
                <ToggleButton
                  key={value}
                  value={value}
                  sx={{
                    fontSize: 12,
                    px: 1.5,
                    py: 0.4,
                    color: "var(--admin-text-muted)",
                    borderColor: "var(--admin-border)",
                    "&.Mui-selected": { color: "var(--admin-text)", backgroundColor: "var(--admin-menu-hover)" },
                  }}
                >
                  {label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {visibleEntries.length === 0 ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, py: 2, textAlign: "center" }}>
                {ledger.length === 0 ? "تراکنشی برای این شخص ثبت نشده" : "موردی با این فیلتر پیدا نشد"}
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
                      {["شماره", "تاریخ", "نوع", "شرح", "مبلغ", "بدهکار", "بستانکار", "وضعیت"].map((label) => (
                        <TableCell key={label} sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleEntries.map((entry) => (
                      <TableRow
                        key={entry.key}
                        hover
                        onClick={() => openEntry(entry)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell sx={cellSx}>
                          <Link
                            href={buildDocumentLink(entry.type, entry.id, pagePath)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: "var(--admin-accent)", fontWeight: 700, textDecoration: "none" }}
                          >
                            #{entry.id}
                          </Link>
                        </TableCell>
                        <TableCell sx={cellSx}>{entry.date || "—"}</TableCell>
                        <TableCell sx={cellSx}>{entryKind(entry)}</TableCell>
                        <TableCell sx={{ ...cellSx, whiteSpace: "normal", textAlign: "right", minWidth: 140 }}>
                          {entry.description || "—"}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{formatMoney(entry.amount)}</TableCell>
                        <TableCell sx={{ ...cellSx, color: DEBTOR_COLOR, fontWeight: 700 }}>
                          {formatMoneyOrDash(entry.debtor_amount)}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, color: CREDITOR_COLOR, fontWeight: 700 }}>
                          {formatMoneyOrDash(entry.creditor_amount)}
                        </TableCell>
                        <TableCell sx={cellSx}>
                          <Chip
                            size="small"
                            label={SIDE_LABEL[entry.side]}
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: SIDE_COLOR[entry.side],
                              backgroundColor:
                                entry.side === "debtor"
                                  ? "rgba(239,83,80,0.12)"
                                  : entry.side === "creditor"
                                    ? "rgba(67,160,71,0.14)"
                                    : "var(--admin-surface-alt)",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
