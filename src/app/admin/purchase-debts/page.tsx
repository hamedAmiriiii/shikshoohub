"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import PurchaseDebtSettleDialog from "./PurchaseDebtSettleDialog";
import {
  extractDebtGridMeta,
  extractDebtorList,
  extractDebtInvoiceList,
  formatDebtStatus,
  getDebtInvoiceAmount,
  getDebtInvoiceId,
  getDebtInvoiceProducts,
  getDebtProductName,
  isDebtInvoicePending,
  type PurchaseDebtInvoice,
  type PurchaseDebtorRow,
  type PurchaseDebtsGridMeta,
} from "@/app/lib/purchaseDebts";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function formatDate(value?: string): string {
  if (!value) return "—";
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
  const [invoices, setInvoices] = useState<PurchaseDebtInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<string>("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<Record<number, PurchaseDebtInvoice>>({});
  const [detailsLoading, setDetailsLoading] = useState<number | null>(null);
  const [settleInvoice, setSettleInvoice] = useState<PurchaseDebtInvoice | null>(null);

  const loadDebtors = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/purchase-debts/grid", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت لیست بدهکاران"));
        return;
      }
      setDebtors(extractDebtorList(res));
      setMeta(extractDebtGridMeta(res));
    } finally {
      setLoading(false);
    }
  }, []);

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
      setInvoices(extractDebtInvoiceList(res.purchases));
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
      loadInvoices(selectedPhone, invoiceStatus);
    }
  }, [selectedPhone, invoiceStatus, loadInvoices]);

  const handleOpenDebtor = (phone: string) => {
    setSelectedPhone(phone);
    setInvoiceStatus("pending");
    setExpandedId(null);
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
    loadDebtors();
    if (selectedPhone) loadInvoices(selectedPhone, invoiceStatus);
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <AccountBalanceWalletIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
        <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "20px" }}>
          بدهکاران (نسیه)
        </Typography>
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

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : debtors.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", textAlign: "center", py: 4 }}>
          بدهکاری ثبت نشده است
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
                <TableCell align="center">شماره تلفن</TableCell>
                <TableCell align="center">تعداد قرض</TableCell>
                <TableCell align="center">مبلغ کل بدهی</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {debtors.map((row) => (
                <TableRow key={row.phone} hover>
                  <TableCell align="center" sx={{ direction: "ltr" }}>{row.phone}</TableCell>
                  <TableCell align="center">{formatNumber(row.debt_count)}</TableCell>
                  <TableCell align="center" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                    {formatNumber(row.total_debt_amount)} تومان
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined" onClick={() => handleOpenDebtor(row.phone)}>
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
        onClose={() => setSelectedPhone(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, color: "var(--admin-text)" }}>
            فاکتورهای نسیه — {selectedPhone}
          </Typography>
          <IconButton size="small" onClick={() => setSelectedPhone(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {STATUS_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                label={filter.label}
                clickable
                onClick={() => setInvoiceStatus(filter.value)}
                sx={{
                  fontWeight: 600,
                  ...(invoiceStatus === filter.value
                    ? { bgcolor: "var(--admin-accent)", color: "#fff" }
                    : { bgcolor: "var(--admin-surface-alt)", color: "var(--admin-text)" }),
                }}
              />
            ))}
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {invoices.map((invoice) => {
                const id = getDebtInvoiceId(invoice);
                const isExpanded = expandedId === id;
                const detail = invoiceDetails[id];
                const products = getDebtInvoiceProducts(detail ?? invoice);
                const pending = isDebtInvoicePending(invoice);

                return (
                  <Card key={id} sx={{ border: "1px solid var(--admin-border)", borderRadius: "10px" }}>
                    <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: "var(--admin-text)", fontSize: "14px" }}>
                            فاکتور #{id} — {formatNumber(getDebtInvoiceAmount(invoice))} تومان
                          </Typography>
                          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>
                            {formatDate(invoice.created_at)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            size="small"
                            label={formatDebtStatus(invoice)}
                            color={pending ? "warning" : "success"}
                          />
                          {pending && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => setSettleInvoice(invoice)}
                              sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
                            >
                              تسویه
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
        </DialogContent>
      </Dialog>

      <PurchaseDebtSettleDialog
        open={Boolean(settleInvoice)}
        invoice={settleInvoice}
        onClose={() => setSettleInvoice(null)}
        onSuccess={handleSettled}
      />

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
