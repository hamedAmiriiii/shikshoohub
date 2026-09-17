"use client";

import { useCallback, useEffect, useState } from "react";
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
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
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
  DEFAULT_PAYMENT_GATEWAYS,
  fetchPaymentStatus,
  fetchPaymentsCatalog,
  formatPlanDuration,
  formatToman,
  isPaymentsError,
  planPayableToman,
  startGatewayPayment,
  type PaymentGatewayId,
  type PaymentsCatalogItem,
  type ShopSubscriptionPricing,
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
  const [shopSubscription, setShopSubscription] = useState<ShopSubscriptionPricing | null>(null);
  const [gateways, setGateways] = useState(DEFAULT_PAYMENT_GATEWAYS);
  const [gateway, setGateway] = useState<PaymentGatewayId>("zarinpal");
  const [pendingPlan, setPendingPlan] = useState<PaymentsCatalogItem | null>(null);
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
      setShopSubscription(res.shop_subscription ?? null);
      if (res.gateways?.length) {
        setGateways(res.gateways as typeof DEFAULT_PAYMENT_GATEWAYS);
      }
      if (res.default_gateway === "sep" || res.default_gateway === "zarinpal") {
        setGateway(res.default_gateway);
      }
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

  const openPayDialog = (plan: PaymentsCatalogItem) => {
    setPendingPlan(plan);
  };

  const confirmPay = async () => {
    if (!pendingPlan) return;
    const token = tokenCode();
    if (!token) return;
    const plan = pendingPlan;
    setBuyingId(plan.id);
    try {
      const res = await startGatewayPayment({
        token,
        type: "shop_plan",
        itemId: plan.id,
        gateway,
        returnUrl: typeof window !== "undefined" ? window.location.href.split("#")[0] : "",
      });
      if (isPaymentsError(res)) {
        toast.error(getApiErrorMessage(res, "خطا در اتصال به درگاه"));
        setBuyingId(null);
        return;
      }
      setPendingPlan(null);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
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
            const list = plan.price_toman || 0;
            const payable = planPayableToman(plan);
            const hasDiscount =
              plan.discount_price_toman != null &&
              plan.discount_price_toman > 0 &&
              plan.discount_price_toman < list;
            return (
              <Card key={`${plan.id}-${plan.name}`} sx={packageCardSx}>
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
                  {(payable > 0 || list > 0) && (
                    <Box>
                      {hasDiscount ? (
                        <>
                          <Typography
                            sx={{
                              color: "var(--admin-text-muted)",
                              fontSize: "14px",
                              textDecoration: "line-through",
                            }}
                          >
                            {formatToman(list)}
                          </Typography>
                          <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: "24px" }}>
                            {formatToman(payable)}
                          </Typography>
                        </>
                      ) : (
                        <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: "24px" }}>
                          {formatToman(payable || list)}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {plan.description && (
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px", flex: 1 }}>
                      {plan.description}
                    </Typography>
                  )}
                  {plan.unlimited_products ? (
                    <Typography sx={{ color: "var(--admin-accent)", fontSize: "13px", fontWeight: 600 }}>
                      بدون سقف تعداد کالا
                    </Typography>
                  ) : null}
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={buyingId === plan.id}
                    onClick={() => openPayDialog(plan)}
                    sx={{
                      ...adminButtonStartIconSx,
                      mt: "auto",
                      bgcolor: "var(--admin-accent)",
                      "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                    }}
                  >
                    {buyingId === plan.id
                      ? "در حال انتقال…"
                      : plan.unlimited_products
                        ? "خرید اشتراک طلایی"
                        : "پرداخت و تمدید"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog
        open={Boolean(pendingPlan)}
        onClose={() => (buyingId == null ? setPendingPlan(null) : undefined)}
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            borderRadius: "16px",
            direction: "rtl",
            minWidth: { xs: "90%", sm: 360 },
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", textAlign: "center" }}>
          انتخاب درگاه پرداخت
        </DialogTitle>
        <DialogContent>
          {pendingPlan ? (
            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, textAlign: "center", mb: 1.5 }}>
              {pendingPlan.name}
              {planPayableToman(pendingPlan) > 0
                ? ` — ${formatToman(planPayableToman(pendingPlan))}`
                : ""}
            </Typography>
          ) : null}
          <FormControl fullWidth>
            <RadioGroup
              value={gateway}
              onChange={(e) => setGateway(e.target.value as PaymentGatewayId)}
            >
              {gateways.map((item) => (
                <FormControlLabel
                  key={item.id}
                  value={item.id}
                  control={
                    <Radio
                      size="small"
                      sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }}
                    />
                  }
                  label={
                    <Typography sx={{ color: "var(--admin-text)", fontSize: 14 }}>{item.name}</Typography>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 1, pb: 2 }}>
          <Button
            onClick={() => setPendingPlan(null)}
            disabled={buyingId != null}
            sx={{ color: "var(--admin-text)" }}
          >
            انصراف
          </Button>
          <Button
            variant="contained"
            onClick={() => void confirmPay()}
            disabled={buyingId != null}
            sx={{
              bgcolor: "var(--admin-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
            startIcon={buyingId != null ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            ادامه پرداخت
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
