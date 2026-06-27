"use client";

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
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import PhoneNumberInput from "@/app/coponent/PhoneNumberInput/PhoneNumberInput";

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
};

export type AdminMenuModeCartPanelProps = {
  cart: MenuCartItem[];
  total: number;
  formatNumber: (num: number) => string;
  onUpdateQuantity: (itemId: number | string, increment: number) => void;
  onRemoveItem: (itemId: number | string) => void;
  onClearCart: () => void;
  phone: string;
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
  paymentType: "cash" | "installment";
  onPaymentTypeChange: (type: "cash" | "installment") => void;
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
};

export default function AdminMenuModeCartPanel({
  cart,
  total,
  formatNumber,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  phone,
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
}: AdminMenuModeCartPanelProps) {
  const finalTotal = Math.max(0, total - useCreditAmount - discounttype);

  const submitDisabled =
    !total ||
    isSubmitting ||
    (payableNow > 0 && !paymentFieldsValid) ||
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
      sx={{
        position: "fixed",
        left: { xs: 4, md: 8 },
        top: { xs: 72, md: 80 },
        bottom: { xs: 8, md: 16 },
        width: { xs: 148, sm: 168, md: 188 },
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--admin-surface)",
        border: "1px solid var(--admin-accent-border)",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        overflow: "hidden",
        fontSize: "10px",
      }}
    >
      <Box
        sx={{
          px: 0.75,
          py: 0.5,
          borderBottom: "1px solid var(--admin-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "var(--admin-surface-alt)",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "var(--admin-text)" }}>
          سبد ({cart.length})
        </Typography>
        <IconButton size="small" onClick={onClearCart} sx={{ p: 0.25 }} aria-label="انصراف">
          <CloseIcon sx={{ fontSize: 14, color: "var(--admin-text-muted)" }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 0.75, py: 0.5 }}>
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
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.25 }}>
              <Typography sx={{ fontSize: "9px", color: "var(--admin-accent)", fontWeight: 700 }}>
                {formatNumber(Number(item.sale_price) * item.quantity)}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <IconButton
                  size="small"
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  sx={{
                    p: 0.15,
                    bgcolor: "var(--admin-surface-alt)",
                    width: 18,
                    height: 18,
                  }}
                >
                  <RemoveIcon sx={{ fontSize: 12 }} />
                </IconButton>
                <Typography sx={{ fontSize: "9px", minWidth: 14, textAlign: "center" }}>
                  {item.quantity}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  sx={{
                    p: 0.15,
                    bgcolor: "var(--admin-surface-alt)",
                    width: 18,
                    height: 18,
                  }}
                >
                  <AddIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          borderTop: "1px solid var(--admin-border)",
          px: 0.75,
          py: 0.75,
          bgcolor: "var(--admin-surface-alt)",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <PhoneNumberInput
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

        {installmentPaymentEnabled && (
          <FormControl component="fieldset" sx={{ minWidth: 0 }}>
            <RadioGroup
              row
              value={paymentType}
              onChange={(e) => onPaymentTypeChange(e.target.value as "cash" | "installment")}
              sx={{ gap: 0, "& .MuiFormControlLabel-root": { mr: 0, ml: 0 } }}
            >
              <FormControlLabel
                value="cash"
                control={<Radio size="small" sx={{ p: 0.25, "& .MuiSvgIcon-root": { fontSize: 14 } }} />}
                label={<Typography sx={{ fontSize: "9px" }}>نقد</Typography>}
              />
              <FormControlLabel
                value="installment"
                control={<Radio size="small" sx={{ p: 0.25, "& .MuiSvgIcon-root": { fontSize: 14 } }} />}
                label={<Typography sx={{ fontSize: "9px" }}>قسط</Typography>}
              />
            </RadioGroup>
          </FormControl>
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
              py: 0.35,
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
              py: 0.35,
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
