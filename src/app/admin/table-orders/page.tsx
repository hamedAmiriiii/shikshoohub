"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TABLE_ORDERS_NEW_EVENT,
  useTableOrdersPending,
} from "./TableOrdersPendingProvider";
import {
  Box,
  Button,
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
import { notifySmsQuotaIfExhausted } from "@/app/lib/notifySmsQuota";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import { getDebtProductName } from "@/app/lib/purchaseDebts";
import {
  getShopNameFromUser,
  printTableOrderLikeSaleReceipt,
} from "@/app/lib/purchaseReceiptPrint";
import {
  extractTableOrders,
  getTableOrderAmount,
  getTableOrderProducts,
  tableOrderToSaleReceipt,
  tablePaymentMethodLabel,
  type TableOrder,
} from "@/app/lib/shopTables";
import TableOrderSettlementPicker, {
  DEFAULT_SETTLEMENT,
  settlementRequestBody,
  type SettlementValue,
} from "./TableOrderSettlementPicker";

const CANCELLED_BY_LABEL: Record<string, string> = {
  customer: "لغو توسط مشتری",
  staff: "لغو توسط پرسنل",
  system: "لغو خودکار",
};

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

type ListFilter = "pending" | "paid" | "cancelled";

function orderRowBackground(order: TableOrder, listFilter: ListFilter): string {
  const status = (order.status || listFilter || "pending").toLowerCase();
  if (status === "cancelled" || listFilter === "cancelled") {
    return "rgba(198, 40, 40, 0.12)";
  }
  if (status === "paid" || listFilter === "paid") {
    return "rgba(76, 175, 80, 0.14)";
  }
  // pending — رسید یا پرداخت آنلاین: کمی سبزتر
  if (order.has_receipt || order.paid_online) {
    return "rgba(76, 175, 80, 0.10)";
  }
  return "rgba(255, 152, 0, 0.12)";
}

function orderRowBorder(order: TableOrder, listFilter: ListFilter): string {
  const status = (order.status || listFilter || "pending").toLowerCase();
  if (status === "cancelled" || listFilter === "cancelled") return "rgba(229, 115, 115, 0.45)";
  if (status === "paid" || listFilter === "paid") return "rgba(129, 199, 132, 0.5)";
  if (order.has_receipt || order.paid_online) return "rgba(129, 199, 132, 0.45)";
  return "rgba(255, 183, 77, 0.45)";
}

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

export default function TableOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ListFilter>("pending");
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [itemsOrder, setItemsOrder] = useState<TableOrder | null>(null);
  const [payOrder, setPayOrder] = useState<TableOrder | null>(null);
  const [settlement, setSettlement] = useState<SettlementValue>(DEFAULT_SETTLEMENT);
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
    const onNew = (event: Event) => {
      const onlinePaid = Boolean((event as CustomEvent<{ onlinePaid?: boolean }>).detail?.onlinePaid);
      toast.info(onlinePaid ? "سفارش حضوری آنلاین پرداخت شد" : "سفارش حضوری جدید رسید");
      if (listFilter !== "cancelled") void loadOrders({ silent: true });
    };
    window.addEventListener(TABLE_ORDERS_NEW_EVENT, onNew);
    return () => window.removeEventListener(TABLE_ORDERS_NEW_EVENT, onNew);
  }, [listFilter, loadOrders]);

  const pendingTotal = orders.reduce((sum, order) => sum + getTableOrderAmount(order), 0);

  const printOrder = async (order: TableOrder) => {
    const result = await printTableOrderLikeSaleReceipt(order, {
      shopName: getShopNameFromUser(),
      fallbackReceipt: tableOrderToSaleReceipt(order, getShopNameFromUser()),
    });
    if (!result.ok) {
      toast.error(result.message);
    }
  };

  const confirmPay = async () => {
    if (!payOrder) return;
    const token = tokenCode();
    if (!token) return;
    const request = settlementRequestBody(settlement, payOrder);
    if ("error" in request) {
      toast.error(request.error);
      return;
    }
    setPaying(true);
    try {
      const res = await FetchWithJwtClient("POST", `/api/table-orders/${payOrder.id}/pay`, token, {}, {
        body: JSON.stringify(request.body),
      });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "تأیید پرداخت ناموفق بود"));
        return;
      }
      toast.success(res?.message || "فاکتور ساخته شد");
      notifySmsQuotaIfExhausted(res);
      const paidId = payOrder.id;
      const purchase = res?.purchase;
      const purchaseId = Number(purchase?.id ?? res?.table_order?.purchase_id);
      const ticket =
        Number(purchase?.daily_ticket_number ?? purchase?.dailyTicketNumber) || undefined;
      setPayOrder({
        ...payOrder,
        purchase_id: Number.isFinite(purchaseId) && purchaseId > 0 ? purchaseId : payOrder.purchase_id,
        purchase,
        daily_ticket_number: ticket,
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {orders.map((order) => {
          const label = order.table_label || (order.table_number != null ? `میز ${order.table_number}` : "میز");
          const highlighted = Boolean(order.has_receipt) || Boolean(order.paid_online);
          const iconBtn = {
            width: 32,
            height: 32,
            color: "var(--admin-text-muted)",
            "&:hover": { color: "var(--admin-accent)", bgcolor: "var(--admin-menu-hover)" },
          };
          const openView = () => {
            if (order.has_receipt && order.receipt_url) setReceiptPreview(order);
            else setItemsOrder(order);
          };
          return (
            <Box
              key={order.id}
              onClick={() => setItemsOrder(order)}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: { xs: 0.75, sm: 1.25 },
                px: { xs: 1, sm: 1.5 },
                py: 1,
                borderRadius: "10px",
                border: `1px solid ${orderRowBorder(order, listFilter)}`,
                backgroundColor: orderRowBackground(order, listFilter),
                cursor: "pointer",
                transition: "border-color 0.15s ease, filter 0.15s ease",
                "&:hover": { filter: "brightness(1.06)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: "1 1 140px" }}>
                <TableRestaurantIcon sx={{ color: "var(--admin-accent)", fontSize: 20, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--admin-text)",
                    }}
                  >
                    {label}
                    <Box component="span" sx={{ color: "var(--admin-text-muted)", fontWeight: 600, fontSize: 12, mr: 0.75 }}>
                      #{formatNumber(order.id)}
                    </Box>
                  </Typography>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, whiteSpace: "nowrap" }}>
                    {formatDate(order.created_at)}
                    {order.phone ? ` · ${order.phone}` : ""}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "flex-start", sm: "flex-end" }, flex: "0 1 auto", minWidth: 90 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em", lineHeight: 1.2, color: "var(--admin-text)" }}>
                  {formatNumber(getTableOrderAmount(order))}
                  <Box component="span" sx={{ fontSize: 10, fontWeight: 600, color: "var(--admin-text-muted)", mr: 0.35 }}>
                    تومان
                  </Box>
                </Typography>
                {tablePaymentMethodLabel(order) ? (
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 10 }}>
                    {tablePaymentMethodLabel(order)}
                  </Typography>
                ) : null}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", flex: "1 1 auto" }}>
                {order.paid_online ? (
                  <Chip
                    size="small"
                    label="پرداخت آنلاین ✓"
                    sx={{ height: 22, fontSize: 11, fontWeight: 800, color: "#2e7d32", bgcolor: "rgba(76, 175, 80, 0.16)" }}
                  />
                ) : null}
                {listFilter === "cancelled" && order.cancelled_by ? (
                  <Typography sx={{ color: "#e57373", fontSize: 11 }}>
                    {CANCELLED_BY_LABEL[order.cancelled_by] || "لغوشده"}
                  </Typography>
                ) : null}
                {order.note?.trim() ? (
                  <Tooltip title={order.note.trim()}>
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemsOrder(order);
                      }}
                      sx={{ display: "inline-flex", alignItems: "center", color: "#e53935" }}
                    >
                      <StickyNote2OutlinedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  </Tooltip>
                ) : null}
              </Box>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto", flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {highlighted ? (
                  <Button
                    size="small"
                    onClick={openView}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      py: 0.25,
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
                {listFilter === "pending" ? (
                  <Tooltip title="تأیید پرداخت">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setInvoiceReady(false);
                        setSettlement(DEFAULT_SETTLEMENT);
                        setPayOrder(order);
                      }}
                      sx={{ ...iconBtn, color: "var(--admin-accent)" }}
                    >
                      <CheckRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
                <Tooltip title="اقلام">
                  <IconButton size="small" onClick={() => setItemsOrder(order)} sx={iconBtn}>
                    <NotesRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                {order.has_receipt && order.receipt_url ? (
                  <Tooltip title="رسید">
                    <IconButton size="small" onClick={() => setReceiptPreview(order)} sx={iconBtn}>
                      <ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
                <Tooltip title="پرینت">
                  <IconButton size="small" onClick={() => printOrder(order)} sx={iconBtn}>
                    <PrintOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                {listFilter === "pending" && !order.paid_online ? (
                  <Tooltip title="لغو">
                    <IconButton
                      size="small"
                      onClick={() => setCancelOrder(order)}
                      sx={{ ...iconBtn, "&:hover": { color: "#c62828", bgcolor: "rgba(198,40,40,0.08)" } }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>
            </Box>
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
                ? `فاکتور ${payOrder.table_label || "میز"} به مبلغ ${formatNumber(getTableOrderAmount(payOrder))} تومان ثبت شد. `
                : `روش مشتری: ${tablePaymentMethodLabel(payOrder)}. مبلغ ${formatNumber(getTableOrderAmount(payOrder))} تومان `
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
          {payOrder && !invoiceReady ? (
            <TableOrderSettlementPicker
              order={payOrder}
              amount={getTableOrderAmount(payOrder)}
              value={settlement}
              onChange={setSettlement}
              disabled={paying}
            />
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
