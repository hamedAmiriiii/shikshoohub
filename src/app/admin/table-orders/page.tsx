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
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import PurchaseDebtSettleDialog from "@/app/admin/purchase-debts/PurchaseDebtSettleDialog";
import { getDebtProductName, type PurchaseDebtInvoice } from "@/app/lib/purchaseDebts";
import {
  extractTableOrders,
  getTableOrderAmount,
  getTableOrderProducts,
  tableOrderToDebtInvoice,
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

export default function TableOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [settled, setSettled] = useState<"0" | "1">("0");
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [settleInvoice, setSettleInvoice] = useState<PurchaseDebtInvoice | null>(null);

  const loadOrders = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", `/api/table-orders?settled=${settled}`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت سفارش‌های پای میز"));
        return;
      }
      setOrders(extractTableOrders(res));
    } finally {
      setLoading(false);
    }
  }, [settled]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const pendingTotal = orders.reduce((sum, order) => sum + getTableOrderAmount(order), 0);

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Typography sx={{ fontWeight: 800, mb: 1, fontSize: 18 }}>سفارش حضوری</Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mb: 2 }}>
        سفارش‌های حضوری مشتری از QR روی میز. تا تسویه، به‌صورت نسیه در انتظار پرداخت می‌مانند.
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Chip
          label="منتظر پرداخت"
          onClick={() => setSettled("0")}
          sx={{
            bgcolor: settled === "0" ? "var(--admin-accent)" : "var(--admin-surface)",
            color: settled === "0" ? "#fff" : "var(--admin-text)",
            fontWeight: 700,
          }}
        />
        <Chip
          label="تسویه‌شده"
          onClick={() => setSettled("1")}
          sx={{
            bgcolor: settled === "1" ? "var(--admin-accent)" : "var(--admin-surface)",
            color: settled === "1" ? "#fff" : "var(--admin-text)",
            fontWeight: 700,
          }}
        />
      </Box>

      {settled === "0" && orders.length > 0 && (
        <Card sx={{ mb: 2, backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>مجموع منتظر پرداخت</Typography>
            <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: 22 }}>
              {formatNumber(pendingTotal)} تومان
            </Typography>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : orders.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-secondary)" }}>سفارشی برای نمایش نیست.</Typography>
      ) : (
        orders.map((order) => {
          const products = getTableOrderProducts(order);
          const open = expandedId === order.id;
          const label = order.table_label || (order.table_number != null ? `میز ${order.table_number}` : "میز");
          return (
            <Card
              key={order.id}
              sx={{ mb: 1.25, backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <TableRestaurantIcon sx={{ color: "var(--admin-accent)", mt: 0.3 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }}>{label}</Typography>
                    <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>
                      {formatDate(order.created_at)} · {formatNumber(getTableOrderAmount(order))} تومان
                    </Typography>
                    {order.note ? (
                      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.5 }}>
                        یادداشت: {order.note}
                      </Typography>
                    ) : null}
                  </Box>
                  {settled === "0" && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setSettleInvoice(tableOrderToDebtInvoice(order))}
                      sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
                    >
                      تسویه
                    </Button>
                  )}
                  <Button
                    size="small"
                    onClick={() => setExpandedId(open ? null : order.id)}
                    endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{ color: "var(--admin-text)" }}
                  >
                    اقلام
                  </Button>
                </Box>
                <Collapse in={open}>
                  <Box sx={{ mt: 1.5, pr: 0.5 }}>
                    {products.length === 0 ? (
                      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>اقلام در فاکتور نیست</Typography>
                    ) : (
                      products.map((product, index) => (
                        <Box
                          key={`${product.id ?? product.product_id ?? index}`}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            py: 0.5,
                            borderBottom: "1px solid var(--admin-border)",
                          }}
                        >
                          <Typography sx={{ fontSize: 13 }}>
                            {getDebtProductName(product)} × {formatNumber(Number(product.quantity) || 1)}
                          </Typography>
                          <Typography sx={{ fontSize: 13, color: "var(--admin-text-secondary)" }}>
                            {formatNumber(Number(product.line_total ?? (Number(product.sale_price) || Number(product.unit_price) || 0) * (Number(product.quantity) || 1)))}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          );
        })
      )}

      <PurchaseDebtSettleDialog
        open={Boolean(settleInvoice)}
        invoice={settleInvoice}
        onClose={() => setSettleInvoice(null)}
        onSuccess={() => {
          setSettleInvoice(null);
          loadOrders();
        }}
      />
      <ToastContainer position="bottom-center" autoClose={3000} />
    </Box>
  );
}
