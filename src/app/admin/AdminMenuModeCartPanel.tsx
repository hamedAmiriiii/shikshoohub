"use client";

import { useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Divider,
  CircularProgress,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PhoneNumberInput from "@/app/coponent/PhoneNumberInput/PhoneNumberInput";
import type { PaymentType } from "@/app/lib/paymentTypes";
import MultiCartToolbar from "@/app/admin/MultiCartToolbar";
import CartQuantityControl from "@/app/admin/CartQuantityControl";
import { getPriceUnitLabel } from "@/app/lib/productUnits";
import {
  ADMIN_MENU_CART_WIDTH,
  ADMIN_MENU_CART_WIDTH_VAR,
} from "@/app/admin/adminMenuCartLayout";

export { ADMIN_MENU_CART_WIDTH, ADMIN_MENU_CART_WIDTH_VAR } from "@/app/admin/adminMenuCartLayout";

type SettlementMode = "split" | "card_all" | "cash_all";

const tinyFieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: "10px",
    minHeight: 28,
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": {
    color: "var(--admin-text)",
    fontSize: "10px",
    py: 0.5,
    px: 0.75,
  },
  "& .MuiFormHelperText-root": { fontSize: "9px", m: 0 },
};

type MenuCartItem = {
  id: number | string;
  name?: string;
  sale_price?: number | string;
  quantity: number;
  unit_type?: string;
  unit_label?: string;
  price_unit_label?: string;
};

export type AdminMenuModeCartPanelProps = {
  cart: MenuCartItem[];
  total: number;
  formatNumber: (num: number) => string;
  onUpdateQuantity: (itemId: number | string, increment: number) => void;
  onSetQuantity: (itemId: number | string, quantity: number) => void;
  kgSalesEnabled?: boolean;
  onRemoveItem: (itemId: number | string) => void;
  onClearCart: () => void;
  cartCount: number;
  activeCartIndex: number;
  onSwitchCart: (index: number) => void;
  onAddCart: () => void;
  phone: string;
  phoneInputKey?: string | number;
  onChangePhone: (value: string) => void;
  checkingCredit: boolean;
  credit: number;
  useCreditAmount: number;
  discounttype: number;
  discountDisplay: string;
  discountError: string;
  isDiscountFocused: boolean;
  onDiscountFocus: () => void;
  onDiscountChange: (value: string) => void;
  onDiscountBlur: (value: string) => void;
  paymentType: PaymentType;
  onPaymentTypeChange: (type: PaymentType) => void;
  installmentCount: number;
  onInstallmentCountChange: (count: number) => void;
  payableNow: number;
  settlementMode: SettlementMode;
  onSettlementModeChange: (mode: SettlementMode) => void;
  cardAmountInput: string;
  cashAmountInput: string;
  onCardAmountChange: (value: string) => void;
  onCashAmountChange: (value: string) => void;
  paymentSplitError: string;
  paymentFieldsValid: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  calculatingInstallments: boolean;
  installmentCreditError: string;
  installmentCalculation: any;
  installmentPaymentEnabled?: boolean;
  debtPaymentEnabled?: boolean;
};

export default function AdminMenuModeCartPanel({
  cart,
  total,
  formatNumber,
  onUpdateQuantity,
  onSetQuantity,
  kgSalesEnabled = false,
  onRemoveItem,
  onClearCart,
  cartCount,
  activeCartIndex,
  onSwitchCart,
  onAddCart,
  phone,
  phoneInputKey,
  onChangePhone,
  checkingCredit,
  credit,
  useCreditAmount,
  discounttype,
  discountDisplay,
  discountError,
  isDiscountFocused,
  onDiscountFocus,
  onDiscountChange,
  onDiscountBlur,
  paymentType,
  onPaymentTypeChange,
  installmentCount,
  onInstallmentCountChange,
  payableNow,
  settlementMode,
  onSettlementModeChange,
  cardAmountInput,
  cashAmountInput,
  onCardAmountChange,
  onCashAmountChange,
  paymentSplitError,
  paymentFieldsValid,
  isSubmitting,
  onConfirm,
  calculatingInstallments,
  installmentCreditError,
  installmentCalculation,
  installmentPaymentEnabled = true,
  debtPaymentEnabled = false,
}: AdminMenuModeCartPanelProps) {
  const finalTotal = Math.max(0, total - useCreditAmount - discounttype);
  const showPaymentTypeSelector = installmentPaymentEnabled || debtPaymentEnabled;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(ADMIN_MENU_CART_WIDTH_VAR, `${ADMIN_MENU_CART_WIDTH}px`);
    return () => {
      root.style.removeProperty(ADMIN_MENU_CART_WIDTH_VAR);
    };
  }, []);

  const submitDisabled =
    !total ||
    isSubmitting ||
    (paymentType !== "debt" && payableNow > 0 && !paymentFieldsValid) ||
    (paymentType === "debt" && (!phone || phone.trim() === "")) ||
    (installmentPaymentEnabled &&
      paymentType === "installment" &&
      (!phone ||
        phone.trim() === "" ||
        !!installmentCreditError ||
        (installmentCalculation && installmentCalculation.has_enough_credit === false) ||
        !installmentCalculation?.installment_amount ||
        calculatingInstallments));

  return (
    <Box
      component="aside"
      aria-label="سبد خرید"
      sx={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: ADMIN_MENU_CART_WIDTH,
        zIndex: (theme) => theme.zIndex.drawer,
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--admin-surface)",
        borderRight: "1px solid var(--admin-accent-border)",
        borderRadius: 0,
        boxSizing: "border-box",
        overflow: "hidden",
        fontSize: "10px",
      }}
    >
      <Box
        sx={{
          px: 0.75,
          py: 0.5,
          borderBottom: "1px solid var(--admin-border)",
          bgcolor: "var(--admin-surface-alt)",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "var(--admin-text-muted)" }}>
          سبد {activeCartIndex + 1} · {cart.length} کالا
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 0.75, py: 0.5 }}>
        {cart.length === 0 && (
          <Typography sx={{ fontSize: "9px", color: "var(--admin-text-muted)", textAlign: "center", py: 2 }}>
            سبد خالی است
          </Typography>
        )}
        {cart.map((item) => (
          <Box
            key={item.id}
            sx={{
              mb: 0.75,
              pb: 0.75,
              borderBottom: "1px dashed var(--admin-divider)",
              "&:last-child": { borderBottom: "none", mb: 0 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.25 }}>
              <Typography
                sx={{
                  flex: 1,
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--admin-text)",
                  lineHeight: 1.3,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.name || "—"}
              </Typography>
              <IconButton
                size="small"
                onClick={() => onRemoveItem(item.id)}
                sx={{ p: 0.15, mt: -0.25 }}
                aria-label="حذف"
              >
                <DeleteOutlineIcon sx={{ fontSize: 13, color: "#e57373" }} />
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.25, gap: 0.25 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "9px", color: "var(--admin-accent)", fontWeight: 700 }}>
                  {formatNumber(Number(item.sale_price) * item.quantity)}
                </Typography>
                {kgSalesEnabled && (
                  <Typography sx={{ fontSize: "8px", color: "var(--admin-text-muted)" }}>
                    {getPriceUnitLabel(item)}
                  </Typography>
                )}
              </Box>
              <CartQuantityControl
                item={item}
                kgSalesEnabled={kgSalesEnabled}
                onChange={onSetQuantity}
                compact
              />
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          borderTop: "1px solid var(--admin-border)",
          px: 0.75,
          pt: 0.75,
          pb: { xs: "88px", md: 1.25 },
          bgcolor: "var(--admin-surface-alt)",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <MultiCartToolbar
          compact
          cartCount={cartCount}
          activeIndex={activeCartIndex}
          onSwitch={onSwitchCart}
          onAdd={onAddCart}
          onClearOrRemove={onClearCart}
        />
        <PhoneNumberInput
          key={phoneInputKey ?? `menu-phone-${activeCartIndex}`}
          name="menu-phone"
          defaultValue={phone}
          onChange={onChangePhone}
          size="small"
          compact
          sx={{
            width: "100%",
            ...tinyFieldSx,
          }}
        />
        {checkingCredit && (
          <Typography sx={{ fontSize: "8px", color: "var(--admin-text-muted)" }}>
            بررسی اعتبار...
          </Typography>
        )}
        {!checkingCredit && credit > 0 && (
          <Typography sx={{ fontSize: "8px", color: "var(--admin-accent)" }}>
            اعتبار: {formatNumber(credit)}
          </Typography>
        )}

        {(!installmentPaymentEnabled || paymentType !== "installment") && (
          <TextField
            size="small"
            placeholder="تخفیف"
            value={
              isDiscountFocused
                ? discountDisplay.replace(/,/g, "")
                : discounttype > 0
                  ? discountDisplay
                  : ""
            }
            onFocus={onDiscountFocus}
            onChange={(e) => onDiscountChange(e.target.value)}
            onBlur={(e) => onDiscountBlur(e.target.value)}
            error={!!discountError}
            helperText={discountError || undefined}
            sx={tinyFieldSx}
          />
        )}

        {showPaymentTypeSelector && (
          <FormControl component="fieldset" sx={{ minWidth: 0 }}>
            <RadioGroup
              row
              value={paymentType}
              onChange={(e) => onPaymentTypeChange(e.target.value as PaymentType)}
              sx={{ gap: 0, flexWrap: "wrap", "& .MuiFormControlLabel-root": { mr: 0, ml: 0 } }}
            >
              <FormControlLabel
                value="cash"
                control={<Radio size="small" sx={{ p: 0.25, "& .MuiSvgIcon-root": { fontSize: 14 } }} />}
                label={<Typography sx={{ fontSize: "9px" }}>نقد</Typography>}
              />
              {installmentPaymentEnabled && (
                <FormControlLabel
                  value="installment"
                  control={<Radio size="small" sx={{ p: 0.25, "& .MuiSvgIcon-root": { fontSize: 14 } }} />}
                  label={<Typography sx={{ fontSize: "9px" }}>قسط</Typography>}
                />
              )}
              {debtPaymentEnabled && (
                <FormControlLabel
                  value="debt"
                  control={<Radio size="small" sx={{ p: 0.25, "& .MuiSvgIcon-root": { fontSize: 14 } }} />}
                  label={<Typography sx={{ fontSize: "9px" }}>نسیه</Typography>}
                />
              )}
            </RadioGroup>
          </FormControl>
        )}

        {paymentType === "debt" && (
          <Typography sx={{ fontSize: "8px", color: "#ff9800", lineHeight: 1.3 }}>
            ثبت قرضی — مبلغ به بدهی مشتری اضافه می‌شود
          </Typography>
        )}

        {installmentPaymentEnabled && paymentType === "installment" && (
          <TextField
            size="small"
            type="number"
            value={installmentCount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              if (v === "" || (Number(v) >= 2 && Number(v) <= 24)) {
                onInstallmentCountChange(v === "" ? 2 : Number(v));
              }
            }}
            inputProps={{ min: 2, max: 24 }}
            sx={tinyFieldSx}
          />
        )}

        {paymentType === "cash" && payableNow > 0 && (
          <FormControl component="fieldset" sx={{ minWidth: 0 }}>
            <RadioGroup
              row
              value={settlementMode}
              onChange={(e) => onSettlementModeChange(e.target.value as SettlementMode)}
              sx={{
                flexWrap: "wrap",
                gap: 0,
                "& .MuiFormControlLabel-root": { mr: 0, ml: 0, height: 20 },
              }}
            >
              <FormControlLabel
                value="card_all"
                control={<Radio size="small" sx={{ p: 0.2, "& .MuiSvgIcon-root": { fontSize: 13 } }} />}
                label={<Typography sx={{ fontSize: "8px" }}>کارت</Typography>}
              />
              <FormControlLabel
                value="cash_all"
                control={<Radio size="small" sx={{ p: 0.2, "& .MuiSvgIcon-root": { fontSize: 13 } }} />}
                label={<Typography sx={{ fontSize: "8px" }}>نقد</Typography>}
              />
              <FormControlLabel
                value="split"
                control={<Radio size="small" sx={{ p: 0.2, "& .MuiSvgIcon-root": { fontSize: 13 } }} />}
                label={<Typography sx={{ fontSize: "8px" }}>ترکیب</Typography>}
              />
            </RadioGroup>
          </FormControl>
        )}

        {paymentType === "cash" && settlementMode === "split" && payableNow > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
            <TextField
              size="small"
              placeholder="کارت"
              value={cardAmountInput}
              onChange={(e) => onCardAmountChange(e.target.value)}
              sx={tinyFieldSx}
            />
            <TextField
              size="small"
              placeholder="نقد"
              value={cashAmountInput}
              onChange={(e) => onCashAmountChange(e.target.value)}
              sx={tinyFieldSx}
            />
          </Box>
        )}

        {paymentSplitError && (
          <Typography sx={{ fontSize: "8px", color: "#e57373" }}>{paymentSplitError}</Typography>
        )}

        {installmentPaymentEnabled && paymentType === "installment" && calculatingInstallments && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CircularProgress size={10} />
            <Typography sx={{ fontSize: "8px" }}>محاسبه...</Typography>
          </Box>
        )}
        {installmentPaymentEnabled && paymentType === "installment" && installmentCreditError && (
          <Typography sx={{ fontSize: "8px", color: "#e57373", lineHeight: 1.3 }}>
            {installmentCreditError}
          </Typography>
        )}

        <Divider sx={{ my: 0.25 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "9px", color: "var(--admin-text-secondary)" }}>جمع</Typography>
          <Typography sx={{ fontSize: "9px", fontWeight: 700 }}>{formatNumber(total)}</Typography>
        </Box>
        {useCreditAmount > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: "8px", color: "var(--admin-text-muted)" }}>اعتبار</Typography>
            <Typography sx={{ fontSize: "8px" }}>-{formatNumber(useCreditAmount)}</Typography>
          </Box>
        )}
        {discounttype > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: "8px", color: "var(--admin-text-muted)" }}>تخفیف</Typography>
            <Typography sx={{ fontSize: "8px" }}>-{formatNumber(discounttype)}</Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "9px", fontWeight: 700 }}>نهایی</Typography>
          <Typography sx={{ fontSize: "10px", fontWeight: 800, color: "var(--admin-accent)" }}>
            {formatNumber(
              installmentPaymentEnabled && paymentType === "installment" && payableNow > 0
                ? payableNow
                : finalTotal,
            )}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={onClearCart}
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: "9px",
              py: 0.3,
              borderColor: "var(--admin-border)",
              color: "var(--admin-text-secondary)",
            }}
          >
            انصراف
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={submitDisabled}
            onClick={onConfirm}
            sx={{
              flex: 1.4,
              minWidth: 0,
              fontSize: "9px",
              py: 0.3,
              bgcolor: "var(--admin-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
          >
            {isSubmitting ? "..." : "ثبت"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
