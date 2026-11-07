"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { isIranMobile, normalizeIranMobile } from "@/app/lib/purchaseReturns";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import PurchaseDebtCreateDialog from "./PurchaseDebtCreateDialog";
import PurchaseDebtSettleDialog from "./PurchaseDebtSettleDialog";
import {
  extractDebtGridMeta,
  extractDebtorList,
  extractDebtInvoiceList,
  formatDebtStatus,
  getDebtInvoiceAmount,
  getDebtInvoiceId,
  getDebtInvoiceOriginalAmount,
  getDebtInvoicePaidAmount,
  getDebtInvoiceProducts,
  getDebtProductName,
  getDebtorDisplayName,
  isDebtInvoicePending,
  type PurchaseDebtInvoice,
  type PurchaseDebtorRow,
  type PurchaseDebtsGridMeta,
} from "@/app/lib/purchaseDebts";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

/** نام یا شمارهٔ مشتری → صفحهٔ گردش مالی او؛ اگر شماره معتبر نبود فقط متن */
function CustomerHistoryLink({ phone, children }: { phone?: string | null; children: ReactNode }) {
  const normalized = normalizeIranMobile(String(phone || ""));
  if (!isIranMobile(normalized)) return <>{children}</>;
  return (
    <Link
      href={`/admin/purchas/customer/${normalized}`}
      style={{ color: "var(--admin-accent)", fontWeight: 600, textDecoration: "none" }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}

function normalizeDebtSearch(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .trim();
}

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

function formatDate(value?: string): string {
  if (!value) return "—";
  const jalali = normalizeDebtSearch(value).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (jalali && Number(jalali[1]) < 1700) {
    const [, y, m, d, hh, mm] = jalali;
    const fa = (n: number, pad = false) =>
      new Intl.NumberFormat("fa-IR", { useGrouping: false, minimumIntegerDigits: pad ? 2 : 1 }).format(n);
    const monthName = JALALI_MONTHS[Number(m) - 1] ?? m;
    const datePart = `${fa(Number(d))} ${monthName} ${fa(Number(y))}`;
    return hh !== undefined && mm !== undefined
      ? `${datePart}، ${fa(Number(hh), true)}:${fa(Number(mm), true)}`
      : datePart;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const STATUS_FILTERS = [
  { value: "pending", label: "تسویه‌نشده" },
  { value: "settled", label: "تسویه‌شده" },
  { value: "all", label: "همه" },
] as const;

export default function PurchaseDebtsPage() {
  const [loading, setLoading] = useState(true);
  const [debtors, setDebtors] = useState<PurchaseDebtorRow[]>([]);
  const [meta, setMeta] = useState<PurchaseDebtsGridMeta>({});
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [invoices, setInvoices] = useState<PurchaseDebtInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<string>("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<Record<number, PurchaseDebtInvoice>>({});
  const [detailsLoading, setDetailsLoading] = useState<number | null>(null);
  const [settleInvoices, setSettleInvoices] = useState<PurchaseDebtInvoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<PurchaseDebtInvoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(normalizeDebtSearch(searchInput)), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadDebtors = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("searchFilterModel", JSON.stringify(search));
      const query = params.toString();
      const res = await FetchWithJwtClient(
        "GET",
        `/api/purchase-debts/grid${query ? `?${query}` : ""}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت لیست بدهکاران"));
        return;
      }
      setDebtors(extractDebtorList(res));
      setMeta(extractDebtGridMeta(res));
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadInvoices = useCallback(async (phone: string, status: string) => {
    const token = tokenCode();
    if (!token) return;

    setInvoicesLoading(true);
    try {
      const res = await FetchWithJwtClient(
        "GET",
        `/api/purchase-debts/by-phone?phone=${encodeURIComponent(phone)}&status=${status}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت فاکتورها"));
        return;
      }
      setInvoices(extractDebtInvoiceList(res));
      const name = String(res?.name || res?.customer_name || "").trim();
      if (name) setSelectedName(name);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const loadInvoiceDetails = useCallback(async (purchaseId: number) => {
    if (invoiceDetails[purchaseId]) return;

    const token = tokenCode();
    if (!token) return;

    setDetailsLoading(purchaseId);
    try {
      const res = await FetchWithJwtClient("GET", `/api/purchase-debts/${purchaseId}`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت جزئیات"));
        return;
      }
      const detail = (res.data ?? res) as PurchaseDebtInvoice;
      setInvoiceDetails((prev) => ({ ...prev, [purchaseId]: detail }));
    } finally {
      setDetailsLoading(null);
    }
  }, [invoiceDetails]);

  useEffect(() => {
    loadDebtors();
  }, [loadDebtors]);

  useEffect(() => {
    if (selectedPhone) {
      setSelectedInvoiceIds([]);
      loadInvoices(selectedPhone, invoiceStatus);
    }
  }, [selectedPhone, invoiceStatus, loadInvoices]);

  const handleOpenDebtor = (row: PurchaseDebtorRow) => {
    setSelectedPhone(row.phone);
    setSelectedName(getDebtorDisplayName(row));
    setInvoiceStatus("pending");
    setExpandedId(null);
    setInvoiceDetails({});
    setSelectedInvoiceIds([]);
  };

  const pendingInvoices = invoices.filter((invoice) => isDebtInvoicePending(invoice));
  const selectedPendingInvoices = pendingInvoices.filter((invoice) =>
    selectedInvoiceIds.includes(getDebtInvoiceId(invoice)),
  );
  const selectedRemainingTotal = selectedPendingInvoices.reduce(
    (sum, invoice) => sum + getDebtInvoiceAmount(invoice),
    0,
  );
  const allPendingSelected =
    pendingInvoices.length > 0 && selectedPendingInvoices.length === pendingInvoices.length;

  const toggleInvoiceSelected = (invoice: PurchaseDebtInvoice) => {
    const id = getDebtInvoiceId(invoice);
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedInvoiceIds([]);
      return;
    }
    setSelectedInvoiceIds(pendingInvoices.map((invoice) => getDebtInvoiceId(invoice)));
  };

  const openSettle = (rows: PurchaseDebtInvoice[]) => {
    if (rows.length === 0) return;
    setSettleInvoices(
      rows.map((invoice) => ({
        ...invoice,
        phone: invoice.phone || selectedPhone || undefined,
        name: selectedName || invoice.name,
        customer_name: selectedName || invoice.customer_name,
      })),
    );
  };

  const handleToggleDetails = async (invoice: PurchaseDebtInvoice) => {
    const id = getDebtInvoiceId(invoice);
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (getDebtInvoiceProducts(invoice).length === 0) {
      await loadInvoiceDetails(id);
    }
  };

  const handleSettled = () => {
    setInvoiceDetails({});
    loadDebtors();
    if (selectedPhone) loadInvoices(selectedPhone, invoiceStatus);
  };

  const handleConfirmDelete = async () => {
    if (!deleteInvoice) return;
    const token = tokenCode();
    if (!token) return;

    setDeleting(true);
    try {
      const res = await FetchWithJwtClient(
        "DELETE",
        `/api/purchase-debts/${getDebtInvoiceId(deleteInvoice)}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "حذف بدهی انجام نشد"));
        return;
      }
      toast.success(res?.message || "بدهی دستی حذف شد.");
      setDeleteInvoice(null);
      handleSettled();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <AccountBalanceWalletIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
        <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "20px", flex: 1 }}>
          بدهکاران (نسیه)
        </Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)} sx={{ bgcolor: "var(--admin-accent)" }}>
          ثبت بدهی
        </Button>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "تعداد بدهکار", value: meta.total_debtors ?? debtors.length },
          { label: "تعداد قرض", value: meta.total_debt_count ?? 0 },
          { label: "جمع بدهی", value: meta.total_debt_amount ?? 0, suffix: "تومان" },
        ].map((stat) => (
          <Grid item xs={12} sm={4} key={stat.label}>
            <Card sx={{ borderRadius: "12px", border: "1px solid var(--admin-border)", bgcolor: "var(--admin-surface)" }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>{stat.label}</Typography>
                <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: "18px" }}>
                  {formatNumber(stat.value)}{stat.suffix ? ` ${stat.suffix}` : ""}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TextField
        fullWidth
        size="small"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="جستجو با نام یا شماره"
        sx={{
          mb: 1.5,
          "& .MuiOutlinedInput-root": {
            color: "var(--admin-text)",
            bgcolor: "var(--admin-surface)",
            borderRadius: "10px",
            "& fieldset": { borderColor: "var(--admin-border)" },
            "&:hover fieldset": { borderColor: "var(--admin-accent)" },
            "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "var(--admin-text-muted)", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : debtors.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", textAlign: "center", py: 4 }}>
          {search ? "بدهکاری با این نام یا شماره پیدا نشد" : "بدهکاری ثبت نشده است"}
        </Typography>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: "12px",
            border: "1px solid var(--admin-border)",
            bgcolor: "var(--admin-surface)",
            mb: 2,
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">نام مشتری</TableCell>
                <TableCell align="center">شماره تلفن</TableCell>
                <TableCell align="center">تعداد قرض</TableCell>
                <TableCell align="center">مبلغ کل بدهی</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {debtors.map((row) => (
                <TableRow key={row.phone} hover>
                  <TableCell align="center">
                    <CustomerHistoryLink phone={row.phone}>{getDebtorDisplayName(row) || "—"}</CustomerHistoryLink>
                  </TableCell>
                  <TableCell align="center" sx={{ direction: "ltr" }}>
                    <CustomerHistoryLink phone={row.phone}>{row.phone}</CustomerHistoryLink>
                  </TableCell>
                  <TableCell align="center">{formatNumber(row.debt_count)}</TableCell>
                  <TableCell align="center" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                    {formatNumber(row.total_debt_amount ?? 0)} تومان
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined" onClick={() => handleOpenDebtor(row)}>
                      جزئیات
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={Boolean(selectedPhone)}
        onClose={() => {
          setSelectedPhone(null);
          setSelectedName("");
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, color: "var(--admin-text)" }}>
            فاکتورهای نسیه —{" "}
            <CustomerHistoryLink phone={selectedPhone}>
              {selectedName ? `${selectedName} — ` : ""}{selectedPhone}
            </CustomerHistoryLink>
          </Typography>
          <IconButton size="small" onClick={() => {
            setSelectedPhone(null);
            setSelectedName("");
          }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 2 }}>
            {STATUS_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                label={filter.label}
                clickable
                onClick={() => setInvoiceStatus(filter.value)}
                sx={{
                  fontWeight: 600,
                  ...(invoiceStatus === filter.value
                    ? { bgcolor: "var(--admin-accent)", color: "var(--admin-on-accent)" }
                    : { bgcolor: "var(--admin-surface-alt)", color: "var(--admin-text)" }),
                }}
              />
            ))}
            {pendingInvoices.length > 0 && (
              <FormControlLabel
                sx={{ ml: "auto", mr: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={allPendingSelected}
                    indeterminate={selectedPendingInvoices.length > 0 && !allPendingSelected}
                    onChange={toggleSelectAllPending}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>
                    انتخاب همه تسویه‌نشده
                  </Typography>
                }
              />
            )}
          </Box>

          {invoicesLoading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
            </Box>
          ) : invoices.length === 0 ? (
            <Typography sx={{ color: "var(--admin-text-muted)", textAlign: "center", py: 3 }}>
              فاکتوری یافت نشد
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pb: selectedPendingInvoices.length > 0 ? 8 : 0 }}>
              {invoices.map((invoice) => {
                const id = getDebtInvoiceId(invoice);
                const isExpanded = expandedId === id;
                const detail = invoiceDetails[id];
                const products = getDebtInvoiceProducts(detail ?? invoice);
                const pending = isDebtInvoicePending(invoice);
                const remaining = getDebtInvoiceAmount(invoice);
                const originalAmount = getDebtInvoiceOriginalAmount(invoice);
                const paidAmount = getDebtInvoicePaidAmount(invoice);
                const partial = pending && paidAmount > 0;
                const selected = selectedInvoiceIds.includes(id);

                return (
                  <Card
                    key={id}
                    sx={{
                      border: selected ? "1px solid var(--admin-accent)" : "1px solid var(--admin-border)",
                      borderRadius: "10px",
                      bgcolor: selected ? "color-mix(in srgb, var(--admin-accent) 8%, transparent)" : undefined,
                    }}
                  >
                    <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, minWidth: 0 }}>
                          {pending && (
                            <Checkbox
                              size="small"
                              checked={selected}
                              onChange={() => toggleInvoiceSelected(invoice)}
                              sx={{ mt: -0.5 }}
                            />
                          )}
                          <Box>
                            <Typography sx={{ fontWeight: 600, color: "var(--admin-text)", fontSize: "14px" }}>
                              فاکتور #{id} — مانده {formatNumber(remaining)} تومان
                            </Typography>
                            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>
                              {formatDate(invoice.created_at)}
                              {originalAmount > remaining || paidAmount > 0
                                ? ` — اصل ${formatNumber(originalAmount)} / پرداخت‌شده ${formatNumber(paidAmount)}`
                                : ""}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                          <Chip
                            size="small"
                            label={formatDebtStatus(invoice)}
                            color={pending ? (partial ? "info" : "warning") : "success"}
                          />
                          {pending && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => openSettle([invoice])}
                              sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
                            >
                              {partial ? "پرداخت" : "تسویه"}
                            </Button>
                          )}
                          {invoice.can_delete && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => setDeleteInvoice(invoice)}
                            >
                              حذف
                            </Button>
                          )}
                          <IconButton size="small" onClick={() => handleToggleDetails(invoice)}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Box>

                      <Collapse in={isExpanded}>
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px dashed var(--admin-border)" }}>
                          {detailsLoading === id ? (
                            <CircularProgress size={20} sx={{ color: "var(--admin-accent)" }} />
                          ) : products.length === 0 ? (
                            <Typography sx={{ fontSize: "12px", color: "var(--admin-text-muted)" }}>
                              جزئیات محصول در دسترس نیست
                            </Typography>
                          ) : (
                            products.map((product, index) => (
                              <Box
                                key={`${id}-${index}`}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  py: 0.5,
                                  fontSize: "12px",
                                  color: "var(--admin-text-secondary)",
                                }}
                              >
                                <Typography sx={{ fontSize: "12px" }}>
                                  {getDebtProductName(product)} × {formatNumber(product.quantity || 0)}
                                  {product.size ? ` / ${product.size}` : ""}
                                  {product.color ? ` / ${product.color}` : ""}
                                </Typography>
                                <Typography sx={{ fontSize: "12px", fontWeight: 600 }}>
                                  {formatNumber(
                                    product.line_total ??
                                      (Number(product.sale_price || product.unit_price || 0) *
                                        Number(product.quantity || 0)),
                                  )}
                                </Typography>
                              </Box>
                            ))
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {selectedPendingInvoices.length > 0 && (
            <Paper
              elevation={6}
              sx={{
                position: "sticky",
                bottom: 0,
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                border: "1px solid var(--admin-border)",
                bgcolor: "var(--admin-surface)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                zIndex: 2,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, color: "var(--admin-text)", fontSize: 14 }}>
                  {formatNumber(selectedPendingInvoices.length)} فاکتور انتخاب‌شده
                </Typography>
                <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: 16 }}>
                  جمع: {formatNumber(selectedRemainingTotal)} تومان
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" onClick={() => setSelectedInvoiceIds([])}>
                  لغو انتخاب
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => openSettle(selectedPendingInvoices)}
                  sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
                >
                  تسویه انتخاب‌شده‌ها
                </Button>
              </Box>
            </Paper>
          )}
        </DialogContent>
      </Dialog>

      <PurchaseDebtCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(phone) => {
          loadDebtors();
          setSelectedPhone(phone);
          setInvoiceStatus("pending");
        }}
      />

      <Dialog open={Boolean(deleteInvoice)} onClose={() => !deleting && setDeleteInvoice(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>حذف بدهی دستی</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "14px", color: "var(--admin-text)" }}>
            بدهی فاکتور #{deleteInvoice ? getDebtInvoiceId(deleteInvoice) : ""} به مبلغ{" "}
            {formatNumber(deleteInvoice ? getDebtInvoiceAmount(deleteInvoice) : 0)} تومان حذف و سند حسابداری آن برگشت
            می‌خورد. ادامه می‌دهید؟
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteInvoice(null)} disabled={deleting}>
            انصراف
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>

      <PurchaseDebtSettleDialog
        open={settleInvoices.length > 0}
        invoices={settleInvoices}
        onClose={() => setSettleInvoices([])}
        onSuccess={() => {
          setSelectedInvoiceIds([]);
          handleSettled();
        }}
      />

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
