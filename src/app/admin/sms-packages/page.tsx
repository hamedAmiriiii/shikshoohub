"use client";

import { useCallback, useEffect, useState } from "react";
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
  Grid,
  Typography,
} from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
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
  getSmsPackageCount,
  getSmsPackageName,
  getSmsPackagePrice,
  type SmsPackage,
  type SmsPackageOrder,
} from "@/app/lib/smsPackages";

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

export default function SmsPackagesPage() {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<SmsPackage[]>([]);
  const [orders, setOrders] = useState<SmsPackageOrder[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SmsPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const loadData = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [packagesRes, ordersRes] = await Promise.all([
        FetchWithJwtClient("GET", "/api/sms-packages", token),
        FetchWithJwtClient("GET", "/api/sms-package-orders", token),
      ]);

      if (packagesRes?.hasError) {
        toast.error(getApiErrorMessage(packagesRes, "خطا در دریافت بسته‌ها"));
      } else {
        setPackages(extractApiList<SmsPackage>(packagesRes));
      }
console.log("ordersRes",ordersRes);

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
    loadData();
  }, [loadData]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    const token = tokenCode();
    if (!token) return;

    setPurchasing(true);
    try {
      const res = await FetchWithJwtClient(
        "POST",
        `/api/sms-packages/${selectedPackage.id}/purchase`,
        token,
      );

      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ثبت درخواست"));
        return;
      }

      toast.success(res?.message || "درخواست خرید ثبت شد. پس از تأیید ادمین اعتبار شما شارژ می‌شود.");
      setSelectedPackage(null);
      await loadData();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        
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
          {packages.map((pkg) => {
            const smsCount = getSmsPackageCount(pkg);
            const price = getSmsPackagePrice(pkg);

            return (
              <Grid item xs={12} sm={6} key={pkg.id}>
                <Card sx={packageCardSx}>
                  <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SmsIcon sx={{ color: "var(--admin-accent)" }} />
                      <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "17px" }}>
                        {getSmsPackageName(pkg)}
                      </Typography>
                    </Box>

                   

                    {price > 0 && (
                      <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: "24px" }}>
                        مبلغ: {formatNumber(price)} تومان
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
                      onClick={() => setSelectedPackage(pkg)}
                      sx={{
                        ...adminButtonStartIconSx,
                        mt: "auto",
                        bgcolor: "var(--admin-accent)",
                        "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                      }}
                    >
                      ثبت درخواست خرید
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <HistoryIcon sx={{ color: "var(--admin-text-muted)", fontSize: 22 }} />
        <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "16px" }}>
          تاریخچه درخواست‌ها
        </Typography>
      </Box>

      {orders.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px" }}>
          هنوز درخواستی ثبت نشده است.
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
                      {formatNumber(order.sms_count )} پیامک
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
                    color={
                      order.status === "approved"
                        ? "success"
                        : order.status === "rejected"
                          ? "error"
                          : "warning"
                    }
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={Boolean(selectedPackage)}
        onClose={() => !purchasing && setSelectedPackage(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ color: "var(--admin-text)" }}>ثبت درخواست خرید</DialogTitle>
        <DialogContent>
          {selectedPackage && (
            <>
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, mb: 1 }}>
                {getSmsPackageName(selectedPackage)}
              </Typography>
              {/* <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, mb: 1.5 }}>
                {formatNumber(getSmsPackagePrice(price_rial))} پیامک
              </Typography> */}
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>
               لطفا مبلغ بسته را به شماره کارت 5041721059095506 واریز کنید سپس ثبت درخواست کنید
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedPackage(null)} disabled={purchasing}>
            انصراف
          </Button>
          <Button
            variant="contained"
            disabled={purchasing}
            onClick={handlePurchase}
            sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
          >
            {purchasing ? "…" : "ثبت درخواست"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
