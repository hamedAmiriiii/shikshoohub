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
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import PhoneNumberInput from "@/app/coponent/PhoneNumberInput/PhoneNumberInput";
import type { PaymentType } from "@/app/lib/paymentTypes";
import MultiCartToolbar from "@/app/admin/MultiCartToolbar";
import CartQuantityControl from "@/app/admin/CartQuantityControl";
import PosSegmentButtons from "@/app/admin/PosSegmentButtons";
import { getPriceUnitLabel } from "@/app/lib/productUnits";
import { formatAmountInput } from "@/app/lib/amountInput";
import { catalogItemKey } from "@/app/lib/catalogItems";
import SaleChequePicker from "@/app/admin/SaleChequePicker";
import {
  ADMIN_MENU_CART_WIDTH,
  ADMIN_MENU_CART_WIDTH_VAR,
} from "@/app/admin/adminMenuCartLayout";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { CHEQUE_DATE_PICKER_Z, chequeDatePickerBoxSx } from "@/app/admin/cheques/ChequeFormSheet";
import { todayJalaliDateObject } from "@/app/lib/cheques";

export { ADMIN_MENU_CART_WIDTH, ADMIN_MENU_CART_WIDTH_VAR } from "@/app/admin/adminMenuCartLayout";

type SettlementMode = "split" | "card_all" | "cash_all";

function cartFont(size: number, boost: number) {
  return `${size + boost}px`;
}

function cartFieldSx(boost: number) {
  return {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "var(--admin-surface-alt)",
      color: "var(--admin-text)",
      fontSize: cartFont(10, boost),
      minHeight: 28,
      "& fieldset": { borderColor: "var(--admin-border)" },
      "&:hover fieldset": { borderColor: "var(--admin-accent)" },
      "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
    },
    "& .MuiInputBase-input": {
      color: "var(--admin-text)",
      fontSize: cartFont(10, boost),
      py: 0.5,
      px: 0.75,
    },
    "& .MuiFormHelperText-root": { fontSize: cartFont(9, boost), m: 0 },
  };
}

type MenuCartItem = {
  id: number | string;
  name?: string;
  sale_price?: number | string;
  default_sale_price?: number | string;
  quantity: number;
  unit_type?: string;
  unit_label?: string;
  price_unit_label?: string;
  item_type?: string;
  produced_good_id?: number | string | null;
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
  discountPercentDisplay?: string;
  discountError: string;
  isDiscountFocused: boolean;
  onDiscountFocus: () => void;
  onDiscountChange: (value: string) => void;
  onDiscountBlur: (value: string) => void;
  onDiscountPercentChange?: (value: string) => void;
  onDiscountPercentBlur?: (value: string) => void;
  manualCartQuantityEnabled?: boolean;
  cartProfitEnabled?: boolean;
  profitPercentDisplay?: string;
  onProfitPercentChange?: (value: string) => void;
  onProfitPercentBlur?: (value: string) => void;
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
  proformaEnabled?: boolean;
  onSaveProforma?: () => void;
  savingProforma?: boolean;
  calculatingInstallments: boolean;
  installmentCreditError: string;
  installmentCalculation: any;
  installmentPaymentEnabled?: boolean;
  debtPaymentEnabled?: boolean;
  chequePaymentEnabled?: boolean;
  selectedChequeId: number | null;
  selectedChequeIds: number[];
  onSelectedChequeIdsChange: (ids: number[]) => void;
  matchingCheques: Array<{
    id: number;
    cheque_number?: string;
    bank_name?: string;
    payee?: string;
    due_date_jalali?: string | null;
    amount?: number | string;
  }>;
  loadingAvailableCheques?: boolean;
  salePayableAmount: number;
  backPrice?: number;
  chequeRemainder?: number;
  selectedChequeAmount?: number;
  mixedDebtResidual?: number;
  mixedPaymentInvalid?: boolean;
  onOpenCreateCheque?: () => void;
  salePriceEditEnabled?: boolean;
  onSalePriceChange?: (itemId: number | string, value: string) => void;
  saleDateEditEnabled?: boolean;
  saleDate?: DateObject | null;
  onSaleDateChange?: (value: DateObject | null) => void;
  submitLabel?: string;
  cartTitle?: string;
  clearLabel?: string;
  cartWidth?: number;
  /** یک شماره به فونت‌های سبد اضافه می‌شود */
  largerText?: boolean;
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
  discountPercentDisplay = "",
  discountError,
  isDiscountFocused,
  onDiscountFocus,
  onDiscountChange,
  onDiscountBlur,
  onDiscountPercentChange,
  onDiscountPercentBlur,
  manualCartQuantityEnabled = false,
  cartProfitEnabled = false,
  profitPercentDisplay = "",
  onProfitPercentChange,
  onProfitPercentBlur,
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
  proformaEnabled = false,
  onSaveProforma,
  savingProforma = false,
  calculatingInstallments,
  installmentCreditError,
  installmentCalculation,
  installmentPaymentEnabled = true,
  debtPaymentEnabled = false,
  chequePaymentEnabled = false,
  selectedChequeId,
  selectedChequeIds,
  onSelectedChequeIdsChange,
  matchingCheques,
  loadingAvailableCheques = false,
  salePayableAmount,
  backPrice = 0,
  chequeRemainder = 0,
  selectedChequeAmount = 0,
  mixedDebtResidual = 0,
  mixedPaymentInvalid = false,
  onOpenCreateCheque,
  salePriceEditEnabled = false,
  onSalePriceChange,
  saleDateEditEnabled = false,
  saleDate,
  onSaleDateChange,
  submitLabel,
  cartTitle,
  clearLabel,
  cartWidth = ADMIN_MENU_CART_WIDTH,
  largerText = false,
}: AdminMenuModeCartPanelProps) {
  const fontBoost = largerText ? 1 : 0;
  const fs = (size: number) => cartFont(size, fontBoost);
  const fieldSx = cartFieldSx(fontBoost);
  const finalTotal = Math.max(0, total - useCreditAmount - discounttype - backPrice);
  const showPaymentTypeSelector = true;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(ADMIN_MENU_CART_WIDTH_VAR, `${cartWidth}px`);
    return () => {
      root.style.removeProperty(ADMIN_MENU_CART_WIDTH_VAR);
    };
  }, [cartWidth]);

  const submitDisabled =
    !total ||
    isSubmitting ||
    (paymentType !== "debt" &&
      paymentType !== "cheque" &&
      paymentType !== "mixed" &&
      payableNow > 0 &&
      !paymentFieldsValid) ||
    (paymentType === "debt" && (!phone || phone.trim() === "")) ||
    (paymentType === "mixed" && mixedPaymentInvalid) ||
    (installmentPaymentEnabled &&
      paymentType === "installment" &&
      (!phone ||
        phone.trim() === "" ||
        !!installmentCreditError ||
        (installmentCalculation && installmentCalculation.has_enough_credit === false) ||
        !installmentCalculation?.installment_amount ||
        calculatingInstallments)) ||
    (chequePaymentEnabled &&
      paymentType === "cheque" &&
      (loadingAvailableCheques ||
        !selectedChequeId ||
        (chequeRemainder > 0 && !paymentFieldsValid)));

  useEffect(() => {
    if (!largerText) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "F8") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("[role='dialog']")) return;
      event.preventDefault();
      event.stopPropagation();
      if (submitDisabled) return;
      onConfirm();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [largerText, submitDisabled, onConfirm]);

  return (
    <Box
      component="aside"
      aria-label="سبد خرید"
      sx={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: cartWidth,
        zIndex: (theme) => theme.zIndex.drawer + 3,
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--admin-surface)",
        borderRight: "1px solid var(--admin-accent-border)",
        borderRadius: 0,
        boxSizing: "border-box",
        overflow: "hidden",
        fontSize: fs(10),
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
        <Typography sx={{ fontSize: fs(10), fontWeight: 600, color: "var(--admin-text-muted)" }}>
          سبد {activeCartIndex + 1} · {cart.length} کالا{cartTitle ? ` · ${cartTitle}` : ""}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 0.75, py: 0.5 }}>
        {cart.length === 0 && (
          <Typography sx={{ fontSize: fs(9), color: "var(--admin-text-muted)", textAlign: "center", py: 2 }}>
            سبد خالی است
          </Typography>
        )}
        {cart.map((item) => (
          <Box
            key={catalogItemKey(item)}
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
                  fontSize: fs(9),
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
                onClick={() => onRemoveItem(catalogItemKey(item))}
                sx={{ p: 0.15, mt: -0.25 }}
                aria-label="حذف"
              >
                <DeleteOutlineIcon sx={{ fontSize: 13, color: "var(--admin-error-soft)" }} />
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.25, gap: 0.25 }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {salePriceEditEnabled && onSalePriceChange ? (
                  <TextField
                    size="small"
                    placeholder="قیمت"
                    value={formatAmountInput(String(item.sale_price ?? ""))}
                    onChange={(e) => onSalePriceChange(catalogItemKey(item), e.target.value)}
                    inputProps={{ inputMode: "numeric", style: { textAlign: "right", direction: "ltr" } }}
                    sx={{ ...fieldSx, mb: 0.25 }}
                  />
                ) : (
                  <Typography sx={{ fontSize: fs(9), color: "var(--admin-accent)", fontWeight: 700 }}>
                    {formatNumber(Number(item.sale_price) * item.quantity)}
                  </Typography>
                )}
                {salePriceEditEnabled && onSalePriceChange ? (
                  <Typography sx={{ fontSize: fs(8), color: "var(--admin-text-muted)" }}>
                    جمع: {formatNumber(Number(item.sale_price) * item.quantity)}
                  </Typography>
                ) : null}
                {kgSalesEnabled && (
                  <Typography sx={{ fontSize: fs(8), color: "var(--admin-text-muted)" }}>
                    {getPriceUnitLabel(item)}
                  </Typography>
                )}
              </Box>
              <CartQuantityControl
                item={item}
                kgSalesEnabled={kgSalesEnabled}
                onChange={onSetQuantity}
                compact
                fontBoost={fontBoost}
                manualEntry={manualCartQuantityEnabled}
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
          hideCaptions
          fontBoost={fontBoost}
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
            ...fieldSx,
          }}
        />
        {saleDateEditEnabled && onSaleDateChange && (
          <Box
            sx={{
              ...chequeDatePickerBoxSx,
              "& .rmdp-input": {
                ...chequeDatePickerBoxSx["& .rmdp-input"],
                height: "28px",
                fontSize: fs(10),
                borderRadius: "6px",
              },
              "& .rmdp-portal": { zIndex: `${CHEQUE_DATE_PICKER_Z} !important` },
            }}
          >
            <DatePicker
              value={saleDate ?? todayJalaliDateObject()}
              onChange={(d) =>
                onSaleDateChange(
                  d && !Array.isArray(d) ? (d as DateObject) : todayJalaliDateObject(),
                )
              }
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              format="YYYY/MM/DD"
              containerStyle={{ width: "100%" }}
              inputClass="rmdp-input"
              placeholder="تاریخ فروش"
            />
          </Box>
        )}
        {checkingCredit && (
          <Typography sx={{ fontSize: fs(9), color: "var(--admin-text-muted)" }}>
            بررسی اعتبار...
          </Typography>
        )}
        {!checkingCredit && credit > 0 && (
          <Typography sx={{ fontSize: fs(10), color: "var(--admin-accent)", fontWeight: 600 }}>
            اعتبار: {formatNumber(credit)}
          </Typography>
        )}

        {(!installmentPaymentEnabled || paymentType !== "installment" || cartProfitEnabled) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            {(!installmentPaymentEnabled || paymentType !== "installment") ? (
            <>
            <Typography sx={{ fontSize: fs(9), fontWeight: 700, color: "var(--admin-text)", flexShrink: 0 }}>
              تخفیف
            </Typography>
            <TextField
              size="small"
              placeholder="درصد"
              value={discountPercentDisplay}
              onChange={(e) => onDiscountPercentChange?.(e.target.value)}
              onBlur={(e) => onDiscountPercentBlur?.(e.target.value)}
              error={!!discountError}
              sx={{
                ...fieldSx,
                width: 56,
                flex: "0 0 56px",
                "& .MuiOutlinedInput-root": {
                  ...fieldSx["& .MuiOutlinedInput-root"],
                  fontSize: fs(11),
                  minHeight: 30,
                },
                "& .MuiInputBase-input": {
                  ...fieldSx["& .MuiInputBase-input"],
                  fontSize: fs(11),
                  py: 0.6,
                  textAlign: "center",
                },
              }}
              inputMode="decimal"
            />
            <TextField
              size="small"
              placeholder="مبلغ"
              value={discountDisplay}
              onFocus={onDiscountFocus}
              onChange={(e) => onDiscountChange(e.target.value)}
              onBlur={(e) => onDiscountBlur(e.target.value)}
              error={!!discountError}
              helperText={discountError || undefined}
              sx={{
                ...fieldSx,
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  ...fieldSx["& .MuiOutlinedInput-root"],
                  fontSize: fs(11),
                  minHeight: 30,
                },
                "& .MuiInputBase-input": {
                  ...fieldSx["& .MuiInputBase-input"],
                  fontSize: fs(11),
                  py: 0.6,
                },
              }}
              inputMode="numeric"
            />
            </>
            ) : null}
            {cartProfitEnabled ? (
              <>
                <Typography sx={{ fontSize: fs(9), fontWeight: 700, color: "var(--admin-text)", flexShrink: 0 }}>
                  سود
                </Typography>
                <TextField
                  size="small"
                  placeholder="٪"
                  value={profitPercentDisplay}
                  onChange={(e) => onProfitPercentChange?.(e.target.value)}
                  onBlur={(e) => onProfitPercentBlur?.(e.target.value)}
                  sx={{
                    ...fieldSx,
                    width: 52,
                    flex: "0 0 52px",
                    "& .MuiOutlinedInput-root": {
                      ...fieldSx["& .MuiOutlinedInput-root"],
                      fontSize: fs(11),
                      minHeight: 30,
                    },
                    "& .MuiInputBase-input": {
                      ...fieldSx["& .MuiInputBase-input"],
                      fontSize: fs(11),
                      py: 0.6,
                      textAlign: "center",
                    },
                  }}
                  inputMode="decimal"
                />
              </>
            ) : null}
          </Box>
        )}

        {showPaymentTypeSelector && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Typography sx={{ fontSize: fs(9), fontWeight: 700, color: "var(--admin-text)" }}>
              نوع پرداخت
            </Typography>
            <PosSegmentButtons
              dense
              fontBoost={fontBoost}
              value={paymentType}
              onChange={onPaymentTypeChange}
              options={[
                { value: "cash", label: "نقد" },
                { value: "debt", label: "نسیه", show: debtPaymentEnabled },
                { value: "installment", label: "قسط", show: installmentPaymentEnabled },
                { value: "cheque", label: "چک", show: chequePaymentEnabled },
                { value: "mixed", label: "ترکیبی" },
              ]}
            />
          </Box>
        )}

        {paymentType === "debt" && (
          <Typography sx={{ fontSize: fs(8), color: "var(--admin-warning)", lineHeight: 1.3 }}>
            ثبت قرضی — مبلغ به بدهی مشتری اضافه می‌شود
          </Typography>
        )}

        {paymentType === "mixed" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
            <Typography sx={{ fontSize: fs(8), fontWeight: 700, color: "var(--admin-text)" }}>
              ترکیبی — نقد / کارت / چک / نسیه
            </Typography>
            <TextField
              size="small"
              placeholder="نقد"
              value={cashAmountInput}
              onChange={(e) => onCashAmountChange(e.target.value)}
              sx={fieldSx}
            />
            <TextField
              size="small"
              placeholder="کارت"
              value={cardAmountInput}
              onChange={(e) => onCardAmountChange(e.target.value)}
              sx={fieldSx}
            />
            {chequePaymentEnabled && (
              <SaleChequePicker
                dense
                selectedIds={selectedChequeIds}
                onChange={onSelectedChequeIdsChange}
                options={matchingCheques}
                loading={loadingAvailableCheques}
                payableAmount={salePayableAmount}
                onCreate={onOpenCreateCheque}
                formatAmount={formatNumber}
                fieldSx={fieldSx}
              />
            )}
            <Typography sx={{ fontSize: fs(9), fontWeight: 700, color: "var(--admin-accent)" }}>
              مانده نسیه: {formatNumber(mixedDebtResidual)}
            </Typography>
            {mixedDebtResidual > 0 && (
              <Typography sx={{ fontSize: fs(8), color: "var(--admin-warning)", lineHeight: 1.3 }}>
                برای مانده نسیه، شماره تلفن الزامی است
              </Typography>
            )}
          </Box>
        )}

        {chequePaymentEnabled && paymentType === "cheque" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
            <Typography sx={{ fontSize: fs(8), fontWeight: 700, color: "var(--admin-text)" }}>
              پرداخت با چک
            </Typography>
            <Typography sx={{ fontSize: fs(8), color: "var(--admin-text-muted)" }}>
              فاکتور: {formatNumber(salePayableAmount)}
              {selectedChequeIds.length > 0
                ? ` · جمع چک: ${formatNumber(selectedChequeAmount)} · باقی: ${formatNumber(chequeRemainder)}`
                : ""}
            </Typography>
            <SaleChequePicker
              dense
              selectedIds={selectedChequeIds}
              onChange={onSelectedChequeIdsChange}
              options={matchingCheques}
              loading={loadingAvailableCheques}
              payableAmount={salePayableAmount}
              onCreate={onOpenCreateCheque}
              formatAmount={formatNumber}
              fieldSx={fieldSx}
            />
            {!loadingAvailableCheques && matchingCheques.length === 0 && (
              <Typography sx={{ fontSize: fs(8), color: "var(--admin-error-soft)", lineHeight: 1.3 }}>
                چک مناسب نیست — با + ثبت کنید
              </Typography>
            )}
            {selectedChequeId && chequeRemainder === 0 && (
              <Typography sx={{ fontSize: fs(8), color: "var(--admin-online)", lineHeight: 1.3 }}>
                چک کل مبلغ را پوشش می‌دهد
              </Typography>
            )}
            {selectedChequeId && chequeRemainder > 0 && (
              <Typography sx={{ fontSize: fs(8), color: "var(--admin-accent)", lineHeight: 1.3 }}>
                باقی‌مانده را پایین با نقد یا کارت بپردازید
              </Typography>
            )}
          </Box>
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
            sx={fieldSx}
          />
        )}

        {(paymentType === "cash" && payableNow > 0) ||
        (paymentType === "cheque" && !!selectedChequeId && chequeRemainder > 0) ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Typography sx={{ fontSize: fs(9), fontWeight: 700, color: "var(--admin-text)" }}>
              {paymentType === "cheque"
                ? `روش پرداخت باقی‌مانده (${formatNumber(chequeRemainder)})`
                : "روش پرداخت"}
            </Typography>
            <PosSegmentButtons
              dense
              fontBoost={fontBoost}
              value={settlementMode}
              onChange={onSettlementModeChange}
              options={[
                { value: "card_all", label: "کارتخوان" },
                { value: "cash_all", label: "پول نقد" },
                { value: "split", label: "ترکیب" },
              ]}
            />
          </Box>
        ) : null}

        {((paymentType === "cash" && settlementMode === "split" && payableNow > 0) ||
          (paymentType === "cheque" && settlementMode === "split" && chequeRemainder > 0)) && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
            <TextField
              size="small"
              placeholder="کارت خوان"
              value={cardAmountInput}
              onChange={(e) => onCardAmountChange(e.target.value)}
              sx={fieldSx}
            />
            <TextField
              size="small"
              placeholder="نقدی"
              value={cashAmountInput}
              onChange={(e) => onCashAmountChange(e.target.value)}
              sx={fieldSx}
            />
          </Box>
        )}

        {paymentSplitError && (
          <Typography sx={{ fontSize: fs(8), color: "var(--admin-error-soft)" }}>{paymentSplitError}</Typography>
        )}

        {installmentPaymentEnabled && paymentType === "installment" && calculatingInstallments && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CircularProgress size={10} />
            <Typography sx={{ fontSize: fs(8) }}>محاسبه...</Typography>
          </Box>
        )}
        {installmentPaymentEnabled && paymentType === "installment" && installmentCreditError && (
          <Typography sx={{ fontSize: fs(8), color: "var(--admin-error-soft)", lineHeight: 1.3 }}>
            {installmentCreditError}
          </Typography>
        )}

        <Divider sx={{ my: 0.25 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 0.5 }}>
          <Typography sx={{ fontSize: fs(12), color: "var(--admin-text-secondary)" }}>جمع</Typography>
          <Typography sx={{ fontSize: fs(14), fontWeight: 700, lineHeight: 1.2 }}>{formatNumber(total)}</Typography>
        </Box>
        {useCreditAmount > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 0.5 }}>
            <Typography sx={{ fontSize: fs(12), color: "var(--admin-text-muted)" }}>اعتبار</Typography>
            <Typography sx={{ fontSize: fs(13), fontWeight: 700, color: "var(--admin-error-soft)", lineHeight: 1.2 }}>
              -{formatNumber(useCreditAmount)}
            </Typography>
          </Box>
        )}
        {backPrice > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 0.5 }}>
            <Typography sx={{ fontSize: fs(12), color: "var(--admin-text-muted)" }}>برگشتی</Typography>
            <Typography sx={{ fontSize: fs(13), fontWeight: 700, color: "var(--admin-error-soft)", lineHeight: 1.2 }}>
              -{formatNumber(backPrice)}
            </Typography>
          </Box>
        )}
        {discounttype > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 0.5 }}>
            <Typography sx={{ fontSize: fs(12), color: "var(--admin-text-muted)" }}>تخفیف</Typography>
            <Typography sx={{ fontSize: fs(13), fontWeight: 700, lineHeight: 1.2 }}>
              -{formatNumber(discounttype)}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 0.5 }}>
          <Typography sx={{ fontSize: fs(13), fontWeight: 800 }}>نهایی</Typography>
          <Typography sx={{ fontSize: fs(18), fontWeight: 800, color: "var(--admin-accent)", lineHeight: 1.15 }}>
            {formatNumber(
              installmentPaymentEnabled && paymentType === "installment" && payableNow > 0
                ? payableNow
                : paymentType === "cheque"
                  ? salePayableAmount
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
              fontSize: fs(9),
              py: 0.3,
              borderColor: "var(--admin-border)",
              color: "var(--admin-text-secondary)",
            }}
          >
            {clearLabel || "انصراف"}
          </Button>
          {proformaEnabled ? (
            <Button
              size="small"
              variant="outlined"
              disabled={!total || isSubmitting || savingProforma}
              onClick={onSaveProforma}
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: fs(9),
                py: 0.3,
                borderColor: "var(--admin-accent)",
                color: "var(--admin-accent)",
              }}
            >
              {savingProforma ? "..." : "پیش فاکتور"}
            </Button>
          ) : null}
          <Button
            size="small"
            variant="contained"
            disabled={submitDisabled}
            onClick={onConfirm}
            sx={{
              flex: 1.4,
              minWidth: 0,
              fontSize: fs(9),
              py: 0.3,
              bgcolor: "var(--admin-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
          >
            {isSubmitting ? "..." : submitLabel || "ثبت"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
