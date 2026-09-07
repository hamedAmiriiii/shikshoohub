"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import SmsIcon from "@mui/icons-material/Sms";
import HistoryIcon from "@mui/icons-material/History";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import ShopSmsQuotaCard from "@/app/coponent/ShopSmsQuotaCard";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  extractApiList,
  formatSmsPackageOrderStatus,
  type SmsPackageOrder,
} from "@/app/lib/smsPackages";
import {
  consumePaymentReturn,
  fetchPaymentsCatalog,
  formatToman,
  isPaymentsError,
  parseCatalogItem,
  startZarinpalPayment,
  type PaymentsCatalogItem,
} from "@/app/lib/atelierZarinpal";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

const packageCardSx = {
  backgroundColor: "var(--admin-surface)",
  borderRadius: "16px",
  border: "1px solid var(--admin-border)",
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

function formatOrderDate(value?: string): string {
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

function orderChipColor(status?: string) {
  if (status === "approved" || status === "paid") return "success" as const;
  if (status === "rejected" || status === "failed" || status === "cancelled") {
    return "error" as const;
  }
  return "warning" as const;
}

export default function SmsPackagesPage() {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PaymentsCatalogItem[]>([]);
  const [orders, setOrders] = useState<SmsPackageOrder[]>([]);
  const [quotaKey, setQuotaKey] = useState(0);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [catalogRes, ordersRes] = await Promise.all([
        fetchPaymentsCatalog({ token }),
        FetchWithJwtClient("GET", "/api/sms-package-orders", token),
      ]);

      if (isPaymentsError(catalogRes)) {
        toast.error(getApiErrorMessage(catalogRes, "خطا در دریافت بسته‌ها"));
      } else if (catalogRes.sms_packages.length > 0) {
        setPackages(catalogRes.sms_packages);
      } else {
        const packagesRes = await FetchWithJwtClient("GET", "/api/sms-packages", token);
        if (packagesRes?.hasError) {
          toast.error(getApiErrorMessage(packagesRes, "خطا در دریافت بسته‌ها"));
        } else {
          setPackages(
            extractApiList(packagesRes)
              .map(parseCatalogItem)
              .filter((item): item is PaymentsCatalogItem => Boolean(item)),
          );
        }
      }

      if (ordersRes?.hasError) {
        toast.error(getApiErrorMessage(ordersRes, "خطا در دریافت تاریخچه"));
      } else {
        setOrders(extractApiList<SmsPackageOrder>(ordersRes));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const result = consumePaymentReturn();
    if (result) {
      if (result.ok) {
        toast.success("پرداخت موفق بود. اعتبار پیامک شارژ شد.");
        setQuotaKey((n) => n + 1);
      } else {
        toast.error("پرداخت انجام نشد یا لغو شد.");
      }
    }
    void loadData();
  }, [loadData]);

  const handlePurchase = async (pkg: PaymentsCatalogItem) => {
    const token = tokenCode();
    if (!token) return;
    setBuyingId(pkg.id);
    try {
      const res = await startZarinpalPayment({
        token,
        type: "sms_package",
        itemId: pkg.id,
        returnUrl: typeof window !== "undefined" ? window.location.href.split("#")[0] : "",
      });
      if (isPaymentsError(res)) {
        toast.error(getApiErrorMessage(res, "خطا در اتصال به درگاه"));
      }
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ mb: 2 }}>
        <ShopSmsQuotaCard key={quotaKey} />
      </Box>

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : packages.length === 0 ? (
        <Card sx={packageCardSx}>
          <CardContent sx={{ py: 4, textAlign: "center" }}>
            <SmsIcon sx={{ fontSize: 40, color: "var(--admin-text-muted)", mb: 1 }} />
            <Typography sx={{ color: "var(--admin-text-secondary)" }}>
              بسته فعالی برای خرید وجود ندارد
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {packages.map((pkg) => (
            <Grid item xs={12} sm={6} key={pkg.id}>
              <Card sx={packageCardSx}>
                <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SmsIcon sx={{ color: "var(--admin-accent)" }} />
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "17px" }}>
                      {pkg.name}
                    </Typography>
                  </Box>

                  {pkg.sms_count ? (
                    <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>
                      {formatNumber(pkg.sms_count)} پیامک
                    </Typography>
                  ) : null}

                  {pkg.price_toman > 0 && (
                    <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: "24px" }}>
                      {formatToman(pkg.price_toman)}
                    </Typography>
                  )}

                  {pkg.description && (
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px", flex: 1 }}>
                      {pkg.description}
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    disabled={buyingId === pkg.id}
                    onClick={() => void handlePurchase(pkg)}
                    sx={{
                      ...adminButtonStartIconSx,
                      mt: "auto",
                      bgcolor: "var(--admin-accent)",
                      "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                    }}
                  >
                    {buyingId === pkg.id ? "در حال انتقال…" : "پرداخت آنلاین"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <HistoryIcon sx={{ color: "var(--admin-text-muted)", fontSize: 22 }} />
        <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "16px" }}>
          تاریخچه خریدها
        </Typography>
      </Box>

      {orders.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px" }}>
          هنوز خریدی ثبت نشده است.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {orders.map((order) => (
            <Card
              key={order.id}
              sx={{
                borderRadius: "12px",
                border: "1px solid var(--admin-border)",
                bgcolor: "var(--admin-surface)",
              }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                  <Box>
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, fontSize: "14px" }}>
                      {formatNumber(order.sms_count ?? 0)} پیامک
                    </Typography>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mt: 0.25 }}>
                      {formatOrderDate(order.created_at)}
                    </Typography>
                    {order.admin_note && (
                      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px", mt: 0.5 }}>
                        {order.admin_note}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    size="small"
                    label={formatSmsPackageOrderStatus(order.status)}
                    color={orderChipColor(order.status)}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
