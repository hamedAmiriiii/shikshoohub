"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TABLE_ORDERS_NEW_EVENT,
  useTableOrdersPending,
} from "./TableOrdersPendingProvider";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { getDebtProductName } from "@/app/lib/purchaseDebts";
import {
  openSaleReceiptPrintPage,
  readSaleReceiptPrintSettings,
} from "@/app/lib/saleReceiptPrint";
import {
  extractTableOrders,
  getTableOrderAmount,
  getTableOrderProducts,
  tableOrderToSaleReceipt,
  tablePaymentMethodLabel,
  type TableOrder,
} from "@/app/lib/shopTables";
import {
  ADMIN_POS_SETTINGS_CHANGED_EVENT,
  readAdminPosSettings,
} from "@/app/lib/adminPosSettings";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function popupEnabled() {
  const settings = readAdminPosSettings();
  return settings.restaurantCafeEnabled && settings.menuTableOrdersPopupEnabled;
}

export default function AdminMenuTableOrdersPopup() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [itemsOrder, setItemsOrder] = useState<TableOrder | null>(null);
  const [payOrder, setPayOrder] = useState<TableOrder | null>(null);
  const [paying, setPaying] = useState(false);
  const [invoiceReady, setInvoiceReady] = useState(false);
  const [cancelOrder, setCancelOrder] = useState<TableOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<TableOrder | null>(null);
  const { refresh: refreshPendingCount } = useTableOrdersPending();

  const loadOrders = useCallback(async () => {
    const token = tokenCode();
    if (!token) return;
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/table-orders?settled=0", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت سفارش‌های پای میز"));
        return;
      }
      setOrders(extractTableOrders(res));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => setEnabled(popupEnabled());
    sync();
    window.addEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }
    const onNew = () => {
      setOpen(true);
      void loadOrders();
    };
    window.addEventListener(TABLE_ORDERS_NEW_EVENT, onNew);
    return () => window.removeEventListener(TABLE_ORDERS_NEW_EVENT, onNew);
  }, [enabled, loadOrders]);

  const printOrder = (order: TableOrder) => {
    let shopName: string | undefined;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}") as Record<string, unknown>;
      shopName =
        (typeof user.atelier_name === "string" && user.atelier_name) ||
        (typeof user.shop_name === "string" && user.shop_name) ||
        (typeof user.name === "string" && user.name) ||
        undefined;
    } catch {
      shopName = undefined;
    }
    const receipt = tableOrderToSaleReceipt(order, shopName);
    if (receipt.items.length === 0) {
      toast.error("اقلام این سفارش برای چاپ موجود نیست");
      return;
    }
    const direct = Boolean(readSaleReceiptPrintSettings().autoPrint);
    openSaleReceiptPrintPage(direct ? "/admin/print/sale?direct=1" : "/admin/print/sale", receipt);
  };

  const confirmPay = async () => {
    if (!payOrder) return;
    const token = tokenCode();
    if (!token) return;
    setPaying(true);
    try {
      const res = await FetchWithJwtClient("POST", `/api/table-orders/${payOrder.id}/pay`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "تأیید پرداخت ناموفق بود"));
        return;
      }
      toast.success(res?.message || "فاکتور ساخته شد");
      const paidId = payOrder.id;
      const purchaseId = Number(res?.purchase?.id ?? res?.table_order?.purchase_id);
      setPayOrder({
        ...payOrder,
        purchase_id: Number.isFinite(purchaseId) && purchaseId > 0 ? purchaseId : payOrder.purchase_id,
      });
      setInvoiceReady(true);
      setOrders((prev) => prev.filter((order) => order.id !== paidId));
      setItemsOrder((prev) => (prev?.id === paidId ? null : prev));
      setReceiptPreview((prev) => (prev?.id === paidId ? null : prev));
      void refreshPendingCount();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setPaying(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelOrder) return;
    const token = tokenCode();
    if (!token) return;
    setCancelling(true);
    try {
      const res = await FetchWithJwtClient("POST", `/api/table-orders/${cancelOrder.id}/cancel`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "لغو سفارش ناموفق بود"));
        return;
      }
      toast.success(res?.message || "سفارش لغو شد");
      const removedId = cancelOrder.id;
      setCancelOrder(null);
      setOrders((prev) => prev.filter((order) => order.id !== removedId));
      setItemsOrder((prev) => (prev?.id === removedId ? null : prev));
      setReceiptPreview((prev) => (prev?.id === removedId ? null : prev));
      void refreshPendingCount();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setCancelling(false);
    }
  };

  const closePopup = () => {
    if (paying || cancelling) return;
    setOpen(false);
    setItemsOrder(null);
    setPayOrder(null);
    setInvoiceReady(false);
    setCancelOrder(null);
    setReceiptPreview(null);
  };

  if (!enabled) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={closePopup}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            color: "var(--admin-text)",
            backgroundImage: "none",
            maxHeight: "88vh",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>سفارش حضوری جدید</DialogTitle>
        <DialogContent dividers sx={{ px: 1.5, py: 1.5 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress sx={{ color: "var(--admin-accent)" }} />
            </Box>
          ) : orders.length === 0 ? (
            <Typography sx={{ color: "var(--admin-text-secondary)", py: 3, textAlign: "center" }}>
              سفارشی برای نمایش نیست.
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" },
                gap: 0.85,
              }}
            >
              {orders.map((order) => {
                const label =
                  order.table_label || (order.table_number != null ? `میز ${order.table_number}` : "میز");
                const highlighted = Boolean(order.has_receipt) || order.payment_method === "online";
                const iconBtn = {
                  width: 26,
                  height: 26,
                  color: "var(--admin-text-muted)",
                  "&:hover": { color: "var(--admin-accent)", bgcolor: "var(--admin-menu-hover)" },
                };
                const openView = () => {
                  if (order.has_receipt && order.receipt_url) setReceiptPreview(order);
                  else setItemsOrder(order);
                };
                return (
                  <Card
                    key={order.id}
                    onClick={() => setItemsOrder(order)}
                    sx={{
                      backgroundColor: "var(--admin-surface-alt)",
                      border: "1px solid var(--admin-border)",
                      borderRadius: "12px",
                      boxShadow: "none",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 0.4,
                          px: 0.9,
                          py: 0.5,
                          bgcolor: highlighted ? "rgba(76, 175, 80, 0.22)" : "rgba(255, 152, 0, 0.18)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.35, minWidth: 0, flex: 1 }}>
                          <TableRestaurantIcon sx={{ color: highlighted ? "#66bb6a" : "#ffa726", fontSize: 14 }} />
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: 12,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: highlighted ? "#81c784" : "#ffb74d",
                            }}
                          >
                            {label}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            flex: 1,
                            fontWeight: 800,
                            fontSize: 11,
                            textAlign: "center",
                            color: highlighted ? "#81c784" : "#ffb74d",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatNumber(order.id)}
                        </Typography>
                        <Typography
                          sx={{
                            flex: 1,
                            color: highlighted ? "#81c784" : "#ffb74d",
                            fontSize: 9,
                            lineHeight: 1.3,
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(order.created_at)}
                        </Typography>
                      </Box>
                      <Box sx={{ px: 0.9, pb: 0.75, pt: 0.55 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 13, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                          {formatNumber(getTableOrderAmount(order))}
                          <Box
                            component="span"
                            sx={{ fontSize: 9, fontWeight: 600, color: "var(--admin-text-muted)", mr: 0.35 }}
                          >
                            تومان
                          </Box>
                        </Typography>
                        {tablePaymentMethodLabel(order) ? (
                          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 10, mt: 0.15 }}>
                            {tablePaymentMethodLabel(order)}
                          </Typography>
                        ) : null}
                        {order.phone ? (
                          <Typography
                            sx={{
                              color: "var(--admin-text-muted)",
                              fontSize: 10,
                              mt: 0.1,
                              direction: "ltr",
                              textAlign: "right",
                            }}
                          >
                            {order.phone}
                          </Typography>
                        ) : null}
                        {order.note?.trim() ? (
                          <Tooltip title={order.note.trim()}>
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemsOrder(order);
                              }}
                              sx={{ display: "inline-flex", alignItems: "center", mt: 0.35, color: "#e53935" }}
                            >
                              <StickyNote2OutlinedIcon sx={{ fontSize: 18 }} />
                            </Box>
                          </Tooltip>
                        ) : null}
                        {highlighted ? (
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openView();
                            }}
                            sx={{
                              mt: 0.45,
                              minWidth: 0,
                              px: 1,
                              py: 0.15,
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#2e7d32",
                              bgcolor: "rgba(76, 175, 80, 0.16)",
                              borderRadius: "8px",
                            }}
                          >
                            مشاهده
                          </Button>
                        ) : null}
                        <Box
                          sx={{ display: "flex", justifyContent: "space-between", mt: 0.35, mx: -0.35 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip title="تأیید پرداخت">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setInvoiceReady(false);
                                setPayOrder(order);
                              }}
                              sx={{ ...iconBtn, color: "var(--admin-accent)" }}
                            >
                              <CheckRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="اقلام">
                            <IconButton size="small" onClick={() => setItemsOrder(order)} sx={iconBtn}>
                              <NotesRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          {order.has_receipt && order.receipt_url ? (
                            <Tooltip title="رسید">
                              <IconButton size="small" onClick={() => setReceiptPreview(order)} sx={iconBtn}>
                                <ReceiptLongOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Box sx={{ width: 26 }} />
                          )}
                          <Tooltip title="پرینت">
                            <IconButton size="small" onClick={() => printOrder(order)} sx={iconBtn}>
                              <PrintOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="لغو">
                            <IconButton
                              size="small"
                              onClick={() => setCancelOrder(order)}
                              sx={{ ...iconBtn, "&:hover": { color: "#c62828", bgcolor: "rgba(198,40,40,0.08)" } }}
                            >
                              <CloseRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button onClick={closePopup} sx={{ color: "var(--admin-text-secondary)" }}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(itemsOrder)} onClose={() => setItemsOrder(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "var(--admin-text)", pb: 1 }}>
          اقلام {itemsOrder?.table_label || (itemsOrder?.table_number != null ? `میز ${itemsOrder.table_number}` : "")}
        </DialogTitle>
        <DialogContent>
          {itemsOrder ? (
            <>
              {getTableOrderProducts(itemsOrder).length === 0 ? (
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>اقلام در فاکتور نیست</Typography>
              ) : (
                getTableOrderProducts(itemsOrder).map((product, index) => (
                  <Box
                    key={`${product.id ?? product.product_id ?? index}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1,
                      py: 0.7,
                      borderBottom: "1px solid var(--admin-border)",
                    }}
                  >
                    <Typography sx={{ fontSize: 13 }}>
                      {getDebtProductName(product)} × {formatNumber(Number(product.quantity) || 1)}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "var(--admin-text-secondary)", whiteSpace: "nowrap" }}>
                      {formatNumber(
                        Number(
                          product.line_total ??
                            (Number(product.sale_price) || Number(product.unit_price) || 0) *
                              (Number(product.quantity) || 1),
                        ),
                      )}
                    </Typography>
                  </Box>
                ))
              )}
              {itemsOrder.note?.trim() ? (
                <Typography sx={{ mt: 1.5, fontSize: 13, color: "#e53935", lineHeight: 1.8 }}>
                  توضیحات: {itemsOrder.note.trim()}
                </Typography>
              ) : null}
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setItemsOrder(null)} sx={{ color: "var(--admin-text-secondary)" }}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(payOrder)}
        onClose={() => {
          if (paying) return;
          setPayOrder(null);
          setInvoiceReady(false);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ color: "var(--admin-text)" }}>
          {invoiceReady ? "فاکتور ساخته شد" : "تأیید پرداخت"}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 14, lineHeight: 1.8 }}>
            {payOrder
              ? invoiceReady
                ? `فاکتور ${payOrder.table_label || "میز"} به مبلغ ${formatNumber(getTableOrderAmount(payOrder))} تومان ثبت شد. `
                : `روش مشتری: ${tablePaymentMethodLabel(payOrder)}. مبلغ ${formatNumber(getTableOrderAmount(payOrder))} تومان `
              : ""}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {invoiceReady ? (
            <>
              <Button
                onClick={() => {
                  setPayOrder(null);
                  setInvoiceReady(false);
                }}
                sx={{ color: "var(--admin-text-secondary)" }}
              >
                بستن
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={() => payOrder && printOrder(payOrder)}
                sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
              >
                چاپ فاکتور
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setPayOrder(null);
                  setInvoiceReady(false);
                }}
                disabled={paying}
                sx={{ color: "var(--admin-text-secondary)" }}
              >
                انصراف
              </Button>
              <Button
                variant="contained"
                onClick={confirmPay}
                disabled={paying}
                sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
              >
                {paying ? "..." : "ساخت فاکتور"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(cancelOrder)} onClose={() => !cancelling && setCancelOrder(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "var(--admin-text)" }}>لغو سفارش</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 14, lineHeight: 1.8 }}>
            {cancelOrder
              ? `سفارش ${cancelOrder.table_label || "میز"} لغو شود؟ تا وقتی پرداخت نشده باشد قابل لغو است.`
              : ""}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelOrder(null)} disabled={cancelling} sx={{ color: "var(--admin-text-secondary)" }}>
            انصراف
          </Button>
          <Button
            variant="contained"
            onClick={confirmCancel}
            disabled={cancelling}
            sx={{ bgcolor: "#c62828", "&:hover": { bgcolor: "#b71c1c" } }}
          >
            {cancelling ? "..." : "لغو سفارش"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(receiptPreview)} onClose={() => setReceiptPreview(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: "var(--admin-text)" }}>رسید کارت‌به‌کارت</DialogTitle>
        <DialogContent>
          {receiptPreview?.receipt_url ? (
            receiptPreview.receipt_url.toLowerCase().includes(".pdf") ? (
              <Button
                component="a"
                href={receiptPreview.receipt_url}
                target="_blank"
                rel="noreferrer"
                variant="contained"
                sx={{ bgcolor: "var(--admin-accent)" }}
              >
                باز کردن PDF
              </Button>
            ) : (
              <Box
                component="img"
                src={receiptPreview.receipt_url}
                alt="رسید"
                sx={{ width: "100%", borderRadius: "12px", display: "block" }}
              />
            )
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReceiptPreview(null)} sx={{ color: "var(--admin-text-secondary)" }}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
