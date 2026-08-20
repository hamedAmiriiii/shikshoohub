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
  Chip,
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
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

type ListFilter = "pending" | "paid" | "cancelled";

export default function TableOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ListFilter>("pending");
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [itemsOrder, setItemsOrder] = useState<TableOrder | null>(null);
  const [payOrder, setPayOrder] = useState<TableOrder | null>(null);
  const [paying, setPaying] = useState(false);
  const [invoiceReady, setInvoiceReady] = useState(false);
  const [cancelOrder, setCancelOrder] = useState<TableOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [receiptFilter, setReceiptFilter] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<TableOrder | null>(null);
  const { count: pendingCount, refresh: refreshPendingCount } = useTableOrdersPending();

  const loadOrders = useCallback(async (opts?: { silent?: boolean }) => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const query = new URLSearchParams();
      if (listFilter === "paid") query.set("settled", "1");
      else if (listFilter === "cancelled") query.set("status", "cancelled");
      else query.set("settled", "0");
      if (receiptFilter) {
        query.set("payment_method", "card_to_card");
        query.set("has_receipt", "1");
      }
      const res = await FetchWithJwtClient("GET", `/api/table-orders?${query.toString()}`, token);
      if (res?.hasError) {
        if (!opts?.silent) toast.error(getApiErrorMessage(res, "خطا در دریافت سفارش‌های پای میز"));
        return;
      }
      setOrders(extractTableOrders(res));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [listFilter, receiptFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const onNew = () => {
      toast.info("سفارش حضوری جدید رسید");
      if (listFilter === "pending") void loadOrders({ silent: true });
    };
    window.addEventListener(TABLE_ORDERS_NEW_EVENT, onNew);
    return () => window.removeEventListener(TABLE_ORDERS_NEW_EVENT, onNew);
  }, [listFilter, loadOrders]);

  const pendingTotal = orders.reduce((sum, order) => sum + getTableOrderAmount(order), 0);

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

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Typography sx={{ fontWeight: 800, mb: 1, fontSize: 18 }}>سفارش حضوری</Typography>
      {/* <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mb: 2 }}>
        سفارش‌های QR روی میز تا تأیید پرداخت فاکتور نمی‌شوند. روش انتخاب‌شده مشتری را اینجا می‌بینید.
      </Typography> */}

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Chip
          label={pendingCount > 0 ? `منتظر پرداخت (${pendingCount})` : "منتظر پرداخت"}
          onClick={() => setListFilter("pending")}
          sx={{
            bgcolor: listFilter === "pending" ? "var(--admin-accent)" : "var(--admin-surface)",
            color: listFilter === "pending" ? "#fff" : "var(--admin-text)",
            fontWeight: 700,
          }}
        />
        <Chip
          label="تسویه‌شده"
          onClick={() => setListFilter("paid")}
          sx={{
            bgcolor: listFilter === "paid" ? "var(--admin-accent)" : "var(--admin-surface)",
            color: listFilter === "paid" ? "#fff" : "var(--admin-text)",
            fontWeight: 700,
          }}
        />
        <Chip
          label="لغوشده"
          onClick={() => setListFilter("cancelled")}
          sx={{
            bgcolor: listFilter === "cancelled" ? "var(--admin-accent)" : "var(--admin-surface)",
            color: listFilter === "cancelled" ? "#fff" : "var(--admin-text)",
            fontWeight: 700,
          }}
        />
        {/* <Chip
          label="کارت‌به‌کارت با رسید"
          onClick={() => setReceiptFilter((prev) => !prev)}
          sx={{
            bgcolor: receiptFilter ? "var(--admin-accent)" : "var(--admin-surface)",
            color: receiptFilter ? "#fff" : "var(--admin-text)",
            fontWeight: 700,
          }}
        /> */}
      </Box>

      {listFilter === "pending" && orders.length > 0 && (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, mb: 1.5 }}>
          مجموع{" "}
          <Box component="span" sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: 16 }}>
            {formatNumber(pendingTotal)}
          </Box>{" "}
          تومان
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : orders.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-secondary)" }}>سفارشی برای نمایش نیست.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr" },
            gap: 0.85,
          }}
        >
        {orders.map((order) => {
          const label = order.table_label || (order.table_number != null ? `میز ${order.table_number}` : "میز");
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
                backgroundColor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                borderRadius: "12px",
                boxShadow: "none",
                cursor: "pointer",
                overflow: "hidden",
                transition: "border-color 0.15s ease",
                "&:hover": { borderColor: highlighted ? "#66bb6a" : "#ffb74d" },
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
                  <Box component="span" sx={{ fontSize: 9, fontWeight: 600, color: "var(--admin-text-muted)", mr: 0.35 }}>
                    تومان
                  </Box>
                </Typography>
                {tablePaymentMethodLabel(order) ? (
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 10, mt: 0.15 }}>
                    {tablePaymentMethodLabel(order)}
                  </Typography>
                ) : null}
                {order.phone ? (
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 10, mt: 0.1, direction: "ltr", textAlign: "right" }}>
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
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        mt: 0.35,
                        color: "#e53935",
                      }}
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
                      "&:hover": { bgcolor: "rgba(76, 175, 80, 0.28)" },
                    }}
                  >
                    مشاهده
                  </Button>
                ) : null}
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", mt: 0.35, mx: -0.35 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {listFilter === "pending" ? (
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
                  ) : (
                    <Box sx={{ width: 26 }} />
                  )}
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
                  {listFilter === "pending" ? (
                    <Tooltip title="لغو">
                      <IconButton
                        size="small"
                        onClick={() => setCancelOrder(order)}
                        sx={{ ...iconBtn, "&:hover": { color: "#c62828", bgcolor: "rgba(198,40,40,0.08)" } }}
                      >
                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Box sx={{ width: 26 }} />
                  )}
                </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
        </Box>
      )}

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
              {itemsOrder.has_receipt && itemsOrder.receipt_url ? (
                <Button
                  size="small"
                  onClick={() => setReceiptPreview(itemsOrder)}
                  sx={{ mt: 1.5, color: "var(--admin-accent)", fontWeight: 700, px: 0 }}
                >
                  مشاهده رسید کارت‌به‌کارت
                </Button>
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
                ? `فاکتور ${payOrder.table_label || "میز"} به مبلغ ${formatNumber(getTableOrderAmount(payOrder))} تومان ثبت شد. می‌توانید چاپ بگیرید.`
                : `روش مشتری: ${tablePaymentMethodLabel(payOrder)}. مبلغ ${formatNumber(getTableOrderAmount(payOrder))} تومان به‌صورت کارت روی فاکتور می‌نشیند.`
              : ""}
          </Typography>
          {payOrder?.has_receipt && payOrder.receipt_url ? (
            <Button
              size="small"
              onClick={() => {
                setReceiptPreview(payOrder);
              }}
              sx={{ mt: 1, color: "var(--admin-accent)", fontWeight: 700, px: 0 }}
            >
              مشاهده رسید مشتری
            </Button>
          ) : null}
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
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13 }}>
                  این رسید PDF است.
                </Typography>
                <Button
                  component="a"
                  href={receiptPreview.receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  variant="contained"
                  sx={{ bgcolor: "var(--admin-accent)", alignSelf: "flex-start" }}
                >
                  باز کردن PDF
                </Button>
              </Box>
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
      <ToastContainer position="bottom-center" autoClose={3000} />
    </Box>
  );
}
