"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  applyShopAccessFromPayment,
  consumePaymentReturn,
  fetchPaymentStatus,
  fetchPaymentsCatalog,
  formatPlanDuration,
  formatToman,
  isPaymentsError,
  startZarinpalPayment,
  type PaymentsCatalogItem,
} from "@/app/lib/atelierZarinpal";

const packageCardSx = {
  backgroundColor: "var(--admin-surface)",
  borderRadius: "16px",
  border: "1px solid var(--admin-border)",
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

export default function ShopPlansPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PaymentsCatalogItem[]>([]);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const loadPlans = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchPaymentsCatalog({ token });
      if (isPaymentsError(res)) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت پلن‌ها"));
        return;
      }
      setPlans(res.shop_plans);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const result = consumePaymentReturn();
    const token = tokenCode();
    if (result) {
      if (result.ok) {
        toast.success("پرداخت موفق بود. اعتبار فروشگاه تمدید شد.");
        if (token && result.authority) {
          void fetchPaymentStatus({ token, authority: result.authority }).then((status) => {
            if (!isPaymentsError(status)) applyShopAccessFromPayment(status);
          });
        }
      } else {
        toast.error("پرداخت انجام نشد یا لغو شد.");
      }
    }
    void loadPlans();
  }, [loadPlans]);

  const handleBuy = async (plan: PaymentsCatalogItem) => {
    const token = tokenCode();
    if (!token) return;
    setBuyingId(plan.id);
    try {
      const res = await startZarinpalPayment({
        token,
        type: "shop_plan",
        itemId: plan.id,
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
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 2 }}>
        پس از پرداخت موفق در زرین‌پال، اعتبار فروشگاه خودکار تمدید می‌شود.
      </Typography>

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : plans.length === 0 ? (
        <Card sx={packageCardSx}>
          <CardContent sx={{ py: 4, textAlign: "center" }}>
            <CardMembershipIcon sx={{ fontSize: 40, color: "var(--admin-text-muted)", mb: 1 }} />
            <Typography sx={{ color: "var(--admin-text-secondary)" }}>
              پلنی برای خرید وجود ندارد
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          {plans.map((plan) => {
            const duration = formatPlanDuration(plan);
            return (
              <Card key={plan.id} sx={packageCardSx}>
                <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CardMembershipIcon sx={{ color: "var(--admin-accent)" }} />
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "17px" }}>
                      {plan.name}
                    </Typography>
                  </Box>
                  {duration ? (
                    <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>
                      مدت: {duration}
                    </Typography>
                  ) : null}
                  {plan.price_toman > 0 && (
                    <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: "24px" }}>
                      {formatToman(plan.price_toman)}
                    </Typography>
                  )}
                  {plan.description && (
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px", flex: 1 }}>
                      {plan.description}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={buyingId === plan.id}
                    onClick={() => void handleBuy(plan)}
                    sx={{
                      ...adminButtonStartIconSx,
                      mt: "auto",
                      bgcolor: "var(--admin-accent)",
                      "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                    }}
                  >
                    {buyingId === plan.id ? "در حال انتقال…" : "پرداخت و تمدید"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
