"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { toast } from "react-toastify";
import {
  fetchShopAccountTransactions,
  SHOP_ACCOUNT_TX_PAGE_SIZE,
  type ShopAccount,
  type ShopAccountTransactionEvent,
  type ShopAccountTransactionHistory,
} from "@/app/lib/shopAccounts";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num || 0));

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printHistory(history: ShopAccountTransactionHistory) {
  const rows = history.events
    .map((event) => {
      const isIn = event.direction === "in";
      return `<tr>
        <td>${escapeHtml(event.date_jalali || event.at_jalali || "—")}</td>
        <td>${escapeHtml(event.kind_label || event.kind)}</td>
        <td class="title">${escapeHtml(event.title)}${
          event.description ? `<div class="sub">${escapeHtml(event.description)}</div>` : ""
        }</td>
        <td class="${isIn ? "in" : "out"}">${isIn ? "+" : "−"}${escapeHtml(formatNumber(event.amount))}</td>
        <td>${escapeHtml(event.balance_after != null ? formatNumber(event.balance_after) : "—")}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>گردش حساب ${escapeHtml(history.account.name)}</title>
  <style>
    body { font-family: Tahoma, "IRANSans", sans-serif; direction: rtl; padding: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .subline { font-size: 12px; color: #555; margin-bottom: 14px; }
    .stats { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: center; }
    th { background: #f3f3f3; }
    td.title { text-align: right; }
    td.title .sub { color: #666; font-size: 11px; margin-top: 2px; }
    td.in { color: #2e7d32; font-weight: 700; }
    td.out { color: #c62828; font-weight: 700; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>گردش حساب «${escapeHtml(history.account.name)}»</h1>
  <div class="subline">${escapeHtml(history.account.type_label || "")} · موجودی فعلی ${escapeHtml(formatNumber(history.account.balance))} تومان</div>
  <div class="stats">
    <span>جمع ورودی: ${escapeHtml(formatNumber(history.summary.in_total))}</span>
    <span>جمع خروجی: ${escapeHtml(formatNumber(history.summary.out_total))}</span>
    <span>خالص: ${escapeHtml(formatNumber(history.summary.net))}</span>
    <span>تعداد: ${escapeHtml(formatNumber(history.summary.events_count))}</span>
  </div>
  <table>
    <thead>
      <tr><th>تاریخ</th><th>نوع</th><th>شرح</th><th>مبلغ</th><th>مانده</th></tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="5">تراکنشی ثبت نشده</td></tr>`}
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
}

async function downloadHistoryExcel(history: ShopAccountTransactionHistory) {
  const XLSX = await import("xlsx");
  const rows: Array<Array<string | number>> = [
    ["حساب", history.account.name],
    ["نوع", history.account.type_label || ""],
    ["موجودی فعلی (تومان)", history.account.balance],
    ["جمع ورودی (تومان)", history.summary.in_total],
    ["جمع خروجی (تومان)", history.summary.out_total],
    ["خالص (تومان)", history.summary.net],
    [],
    ["تاریخ", "نوع", "شرح", "جزئیات", "جهت", "مبلغ (تومان)", "مانده بعد (تومان)"],
  ];
  for (const event of history.events) {
    rows.push([
      event.date_jalali || event.at_jalali || "",
      event.kind_label || event.kind,
      event.title,
      event.description || "",
      event.direction === "in" ? "ورودی" : "خروجی",
      event.signed_amount,
      event.balance_after ?? "",
    ]);
  }
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 36 },
    { wch: 28 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
  ];
  const book = XLSX.utils.book_new();
  book.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(book, sheet, "گردش حساب");
  const safeName = history.account.name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 40);
  XLSX.writeFile(book, `گردش-حساب-${safeName}.xlsx`);
}

type Props = {
  open: boolean;
  account: ShopAccount | null;
  onClose: () => void;
};

export default function ShopAccountHistoryDialog({ open, account, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [history, setHistory] = useState<ShopAccountTransactionHistory | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    if (!open || !account) {
      setHistory(null);
      setHasMore(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchShopAccountTransactions(account.id, {
          limit: SHOP_ACCOUNT_TX_PAGE_SIZE,
          offset: 0,
        });
        if (!cancelled) {
          setHistory(data);
          setHasMore(data.pagination.has_more);
        }
      } catch (e) {
        if (!cancelled) {
          setHistory(null);
          setHasMore(false);
          toast.error(e instanceof Error ? e.message : "خطا در دریافت گردش حساب");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, account]);

  const loadMore = useCallback(async () => {
    if (!account || !history || !hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const data = await fetchShopAccountTransactions(account.id, {
        limit: SHOP_ACCOUNT_TX_PAGE_SIZE,
        offset: history.events.length,
      });
      setHistory((prev) => {
        if (!prev) return data;
        const seen = new Set(prev.events.map((e) => e.id));
        const appended = data.events.filter((e) => !seen.has(e.id));
        return {
          ...prev,
          summary: data.summary,
          pagination: data.pagination,
          events: [...prev.events, ...appended],
        };
      });
      setHasMore(data.pagination.has_more);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در بارگذاری بیشتر");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [account, history, hasMore]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !hasMore || loadingMoreRef.current) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      void loadMore();
    }
  };

  const fetchAllForExport = async (): Promise<ShopAccountTransactionHistory | null> => {
    if (!account || !history) return null;
    const total = history.summary.events_count || history.pagination.total;
    if (!hasMore && history.events.length >= total) return history;
    try {
      return await fetchShopAccountTransactions(account.id, {
        limit: Math.min(Math.max(total, SHOP_ACCOUNT_TX_PAGE_SIZE), 2000),
        offset: 0,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت کامل گردش");
      return null;
    }
  };

  const handlePrint = async () => {
    const full = await fetchAllForExport();
    if (!full) return;
    printHistory(full);
  };

  const handleExport = async () => {
    const full = await fetchAllForExport();
    if (!full) return;
    try {
      await downloadHistoryExcel(full);
    } catch {
      toast.error("خروجی اکسل ساخته نشد");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: "var(--admin-surface)",
          color: "var(--admin-text)",
          borderRadius: 2.5,
          border: "1px solid var(--admin-border)",
          direction: "rtl",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        گردش حساب {account?.name || ""}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : !history ? (
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, py: 3, textAlign: "center" }}>
            تراکنشی یافت نشد
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                gap: 1,
              }}
            >
              {[
                { label: "موجودی فعلی", value: history.summary.current_balance, accent: true },
                { label: "جمع ورودی", value: history.summary.in_total },
                { label: "جمع خروجی", value: history.summary.out_total },
                { label: "تعداد تراکنش", value: history.summary.events_count },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    p: 1.1,
                    borderRadius: 1.75,
                    border: "1px solid var(--admin-border)",
                    bgcolor: "var(--admin-surface-alt)",
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{item.label}</Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: item.accent ? "var(--admin-accent)" : "var(--admin-text)",
                      mt: 0.25,
                    }}
                  >
                    {formatNumber(item.value)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => void handlePrint()}
                disabled={history.events.length === 0}
                sx={{ ...adminButtonStartIconSx, color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
              >
                پرینت
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => void handleExport()}
                disabled={history.events.length === 0}
                sx={{ ...adminButtonStartIconSx, color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
              >
                خروجی اکسل
              </Button>
            </Box>

            <TableContainer
              ref={scrollRef}
              onScroll={handleScroll}
              sx={{
                border: "1px solid var(--admin-border)",
                borderRadius: 2,
                maxHeight: 420,
                overflow: "auto",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={headSx}>تاریخ</TableCell>
                    <TableCell align="center" sx={headSx}>نوع</TableCell>
                    <TableCell align="right" sx={headSx}>شرح</TableCell>
                    <TableCell align="center" sx={headSx}>مبلغ</TableCell>
                    <TableCell align="center" sx={headSx}>مانده</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: "var(--admin-text-muted)", py: 3 }}>
                        تراکنشی ثبت نشده
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.events.map((event) => <EventRow key={event.id} event={event} />)
                  )}
                  {loadingMore ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 1.5 }}>
                        <CircularProgress size={18} sx={{ color: "var(--admin-accent)" }} />
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {!loadingMore && hasMore ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{ color: "var(--admin-text-muted)", fontSize: 11, py: 1 }}
                      >
                        برای دیدن بقیه به پایین اسکرول کنید
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: "var(--admin-text-muted)" }}>
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const headSx = {
  bgcolor: "var(--admin-surface-alt)",
  color: "var(--admin-text-muted)",
  fontWeight: 700,
  fontSize: 12,
  borderBottom: "1px solid var(--admin-border)",
  whiteSpace: "nowrap",
} as const;

function EventRow({ event }: { event: ShopAccountTransactionEvent }) {
  const isIn = event.direction === "in";
  return (
    <TableRow hover sx={{ bgcolor: "var(--admin-surface)", "&:nth-of-type(even)": { bgcolor: "var(--admin-surface-alt)" } }}>
      <TableCell align="center" sx={{ color: "var(--admin-text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
        {event.date_jalali || event.at_jalali || "—"}
      </TableCell>
      <TableCell align="center" sx={{ fontSize: 12, whiteSpace: "nowrap" }}>
        {event.kind_label || event.kind}
      </TableCell>
      <TableCell align="right" sx={{ fontSize: 12.5 }}>
        <Typography sx={{ fontWeight: 700, color: "var(--admin-text)", fontSize: 12.5 }}>{event.title}</Typography>
        {event.description ? (
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.2 }}>{event.description}</Typography>
        ) : null}
      </TableCell>
      <TableCell
        align="center"
        sx={{
          fontWeight: 800,
          fontSize: 13,
          whiteSpace: "nowrap",
          color: isIn ? "var(--admin-accent)" : "var(--admin-error, #f87171)",
        }}
      >
        {isIn ? "+" : "−"}
        {formatNumber(event.amount)}
      </TableCell>
      <TableCell align="center" sx={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
        {event.balance_after != null ? formatNumber(event.balance_after) : "—"}
      </TableCell>
    </TableRow>
  );
}
