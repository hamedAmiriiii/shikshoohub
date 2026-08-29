"use client";

import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import PhoneNumberInput from "@/app/coponent/PhoneNumberInput/PhoneNumberInput";
import type { PaymentType } from "@/app/lib/paymentTypes";
import MultiCartToolbar from "@/app/admin/MultiCartToolbar";
import CartQuantityControl from "@/app/admin/CartQuantityControl";
import { getPriceUnitLabel } from "@/app/lib/productUnits";
import { formatAmountInput } from "@/app/lib/amountInput";
import type { AdminMenuModeCartPanelProps } from "@/app/admin/AdminMenuModeCartPanel";

type SettlementMode = "split" | "card_all" | "cash_all";

type AdminClassicPosViewProps = {
  cartPanel: AdminMenuModeCartPanelProps;
  /** باز کردن مودال اسکن / افزودن کالا */
  onOpenScanner?: () => void;
  /** وقتی با حالت منو ترکیب می‌شود ارتفاع جدول محدود می‌ماند */
  compact?: boolean;
};

const compactFieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface)",
    color: "var(--admin-text)",
    fontSize: "12px",
    minHeight: 32,
    borderRadius: "4px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": {
    color: "var(--admin-text)",
    fontSize: "12px",
    py: 0.5,
    px: 0.75,
  },
  "& .MuiFormHelperText-root": { fontSize: "10px", m: 0 },
};

const panelBorder = "1px solid var(--admin-border)";

function paymentButtonActive(
  paymentType: PaymentType,
  settlementMode: SettlementMode,
  target: "cash" | "card" | "split" | PaymentType,
): boolean {
  if (target === "cash") {
    return paymentType === "cash" && settlementMode === "cash_all";
  }
  if (target === "card") {
    return paymentType === "cash" && settlementMode === "card_all";
  }
  if (target === "split") {
    return paymentType === "cash" && settlementMode === "split";
  }
  return paymentType === target;
}

export default function AdminClassicPosView({
  cartPanel,
  onOpenScanner,
  compact = false,
}: AdminClassicPosViewProps) {
  const {
    cart,
    total,
    formatNumber,
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
    chequePaymentEnabled = false,
    selectedChequeId,
    onSelectedChequeChange,
    matchingCheques,
    loadingAvailableCheques = false,
    salePayableAmount,
    backPrice = 0,
    chequeRemainder = 0,
    selectedChequeAmount = 0,
    onOpenCreateCheque,
    salePriceEditEnabled = false,
    onSalePriceChange,
  } = cartPanel;

  const finalTotal = Math.max(0, total - useCreditAmount - discounttype - backPrice);

  const submitDisabled =
    !total ||
    isSubmitting ||
    (paymentType !== "debt" &&
      paymentType !== "cheque" &&
      payableNow > 0 &&
      !paymentFieldsValid) ||
    (paymentType === "debt" && (!phone || phone.trim() === "")) ||
    (installmentPaymentEnabled &&
      paymentType === "installment" &&
      (!phone ||
        phone.trim() === "" ||
        !!installmentCreditError ||
        (installmentCalculation &&
          installmentCalculation.has_enough_credit === false) ||
        !installmentCalculation?.installment_amount ||
        calculatingInstallments)) ||
    (chequePaymentEnabled &&
      paymentType === "cheque" &&
      (loadingAvailableCheques ||
        !selectedChequeId ||
        (chequeRemainder > 0 && !paymentFieldsValid)));

  const selectCashSettlement = (mode: SettlementMode) => {
    if (paymentType !== "cash") {
      onPaymentTypeChange("cash");
    }
    onSettlementModeChange(mode);
  };

  const paymentBtnInactiveBg = "var(--admin-surface)";
  const paymentBtnActiveBg = "var(--admin-accent)";
  const paymentBtnActiveColor = "#fff";

  const paymentButtons: Array<{
    key: string;
    label: string;
    onClick: () => void;
    active: boolean;
    show: boolean;
  }> = [
    {
      key: "cash",
      label: "نقدی",
      onClick: () => selectCashSettlement("cash_all"),
      active: paymentButtonActive(paymentType, settlementMode, "cash"),
      show: true,
    },
    {
      key: "card",
      label: "کارت",
      onClick: () => selectCashSettlement("card_all"),
      active: paymentButtonActive(paymentType, settlementMode, "card"),
      show: true,
    },
    {
      key: "split",
      label: "ترکیبی",
      onClick: () => selectCashSettlement("split"),
      active: paymentButtonActive(paymentType, settlementMode, "split"),
      show: true,
    },
    {
      key: "installment",
      label: "اقساطی",
      onClick: () => onPaymentTypeChange("installment"),
      active: paymentButtonActive(paymentType, settlementMode, "installment"),
      show: installmentPaymentEnabled,
    },
    {
      key: "debt",
      label: "نسیه",
      onClick: () => onPaymentTypeChange("debt"),
      active: paymentButtonActive(paymentType, settlementMode, "debt"),
      show: debtPaymentEnabled,
    },
    {
      key: "cheque",
      label: "چک+نقد",
      onClick: () => onPaymentTypeChange("cheque"),
      active: paymentButtonActive(paymentType, settlementMode, "cheque"),
      show: chequePaymentEnabled,
    },
  ];

  const headCellSx = {
    color: "#fff",
    fontWeight: 700,
    fontSize: "11px",
    py: 0.6,
    px: 0.75,
    borderBottom: "none",
    whiteSpace: "nowrap" as const,
  };

  const bodyCellSx = {
    color: "var(--admin-text)",
    fontSize: "12px",
    py: 0.45,
    px: 0.75,
    borderBottom: panelBorder,
    verticalAlign: "middle" as const,
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: compact ? "100%" : undefined,
        minHeight: compact
          ? "100%"
          : { xs: "calc(100vh - 230px)", md: "calc(100vh - 190px)" },
        border: panelBorder,
        borderRadius: "6px",
        overflow: "hidden",
        bgcolor: "var(--admin-surface)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          p: 1,
          borderBottom: panelBorder,
          bgcolor: "var(--admin-surface-alt)",
          direction: "rtl",
        }}
      >
        <MultiCartToolbar
          compact
          fullWidth={false}
          cartCount={cartCount}
          activeIndex={activeCartIndex}
          onSwitch={onSwitchCart}
          onAdd={onAddCart}
          onClearOrRemove={onClearCart}
        />

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            minWidth: 0,
          }}
        >
          {onOpenScanner ? (
            <Button
              size="small"
              variant="outlined"
              onClick={onOpenScanner}
              startIcon={<AddIcon sx={{ fontSize: 15 }} />}
              aria-label="افزودن کالا"
              sx={{
                flexShrink: 0,
                minHeight: 32,
                px: 1.1,
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 700,
                border: panelBorder,
                bgcolor: "var(--admin-surface)",
                color: "var(--admin-text)",
                boxShadow: "none",
                textTransform: "none",
                "&:hover": {
                  border: "1px solid var(--admin-accent)",
                  bgcolor: "var(--admin-menu-hover)",
                  boxShadow: "none",
                },
                "& .MuiButton-startIcon": { marginInlineEnd: 0.4, marginInlineStart: 0 },
              }}
            >
              افزودن کالا
            </Button>
          ) : null}

          <Box sx={{ flex: "1 1 160px", minWidth: 140, maxWidth: 220 }}>
            <PhoneNumberInput
              key={phoneInputKey ?? `classic-phone-${activeCartIndex}`}
              name="classic-phone"
              defaultValue={phone}
              onChange={onChangePhone}
              size="small"
              compact
              sx={{ width: "100%", ...compactFieldSx }}
            />
          </Box>

          {checkingCredit ? (
            <Typography sx={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
              بررسی اعتبار…
            </Typography>
          ) : credit > 0 ? (
            <Typography sx={{ fontSize: "11px", color: "var(--admin-accent)", fontWeight: 600 }}>
              اعتبار: {formatNumber(credit)}
            </Typography>
          ) : null}

          {(!installmentPaymentEnabled || paymentType !== "installment") && (
            <TextField
              size="small"
              placeholder="تخفیف (تومان)"
              value={discountDisplay}
              onFocus={onDiscountFocus}
              onChange={(e) => onDiscountChange(e.target.value)}
              onBlur={(e) => onDiscountBlur(e.target.value)}
              error={!!discountError}
              helperText={discountError || undefined}
              sx={{ ...compactFieldSx, width: 130 }}
              inputMode="numeric"
            />
          )}
        </Box>
      </Box>

      <TableContainer
        sx={{
          flex: 1,
          overflow: "auto",
          minHeight: 0,
          maxHeight: compact ? "calc(52% - 50px)" : undefined,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: "var(--admin-accent)" }}>
              <TableCell align="center" sx={{ ...headCellSx, width: 40 }}>
                ردیف
              </TableCell>
              <TableCell align="right" sx={headCellSx}>
                نام کالا
              </TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: 110 }}>
                تعداد
              </TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: 100 }}>
                قیمت
              </TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: 100 }}>
                جمع
              </TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: 48 }}>
                حذف
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cart.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 1.5, borderBottom: "none" }}>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px" }}>
                    سبد خالی است — بارکد اسکن کنید یا از لیست کالا اضافه کنید
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              cart.map((item, index) => {
                const lineTotal = Number(item.sale_price) * item.quantity;
                return (
                  <TableRow
                    key={`${item.id}-${index}`}
                    sx={{
                      bgcolor:
                        index % 2 === 0
                          ? "var(--admin-surface)"
                          : "var(--admin-surface-alt)",
                      "&:last-child td": { borderBottom: "none" },
                    }}
                  >
                    <TableCell align="center" sx={bodyCellSx}>
                      {index + 1}
                    </TableCell>
                    <TableCell align="right" sx={bodyCellSx}>
                      <Typography sx={{ fontSize: "12px", fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      {kgSalesEnabled && (
                        <Typography sx={{ fontSize: "10px", color: "var(--admin-text-muted)" }}>
                          {getPriceUnitLabel(item)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>
                      <CartQuantityControl
                        item={item}
                        kgSalesEnabled={kgSalesEnabled}
                        onChange={onSetQuantity}
                        compact
                      />
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>
                      {salePriceEditEnabled && onSalePriceChange ? (
                        <TextField
                          size="small"
                          value={formatAmountInput(String(item.sale_price ?? ""))}
                          onChange={(e) => onSalePriceChange(item.id, e.target.value)}
                          sx={{ ...compactFieldSx, width: 88 }}
                          inputMode="numeric"
                        />
                      ) : (
                        formatNumber(Number(item.sale_price))
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ ...bodyCellSx, fontWeight: 700 }}>
                      {formatNumber(lineTotal)}
                    </TableCell>
                    <TableCell align="center" sx={bodyCellSx}>
                      <IconButton
                        size="small"
                        onClick={() => onRemoveItem(item.id)}
                        sx={{
                          color: "#e53935",
                          bgcolor: "rgba(229, 57, 53, 0.1)",
                          borderRadius: "4px",
                          p: 0.35,
                          "&:hover": { bgcolor: "rgba(229, 57, 53, 0.18)" },
                        }}
                        aria-label="حذف"
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: compact
            ? "1fr"
            : { xs: "1fr", md: "minmax(180px, 1fr) minmax(220px, 1.2fr) minmax(180px, 1fr)" },
          borderTop: panelBorder,
          bgcolor: "var(--admin-surface-alt)",
          flexShrink: 0,
          maxHeight: compact ? "calc(48% + 50px)" : undefined,
          overflow: compact ? "auto" : undefined,
        }}
      >
        <Box
          sx={{
            p: compact ? 0.75 : 1,
            borderLeft: compact ? "none" : { md: panelBorder },
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
            <Typography sx={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
              جمع فاکتور
            </Typography>
            <Typography sx={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.2 }}>
              {formatNumber(total)}
            </Typography>
          </Box>
          {useCreditAmount > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
              <Typography sx={{ fontSize: "13px", color: "var(--admin-accent)" }}>
                اعتبار مصرفی
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "var(--admin-accent)", lineHeight: 1.2 }}>
                {formatNumber(useCreditAmount)}
              </Typography>
            </Box>
          )}
          {backPrice > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
              <Typography sx={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
                مبلغ برگشتی
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#e57373", lineHeight: 1.2 }}>
                -{formatNumber(backPrice)}
              </Typography>
            </Box>
          )}
          {discounttype > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
              <Typography sx={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
                تخفیف
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.2 }}>
                {formatNumber(discounttype)}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              mt: 0.5,
              pt: 0.5,
              borderTop: panelBorder,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: "14px", fontWeight: 800 }}>
              مبلغ نهایی
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "22px", md: "24px" },
                fontWeight: 800,
                color: "var(--admin-accent)",
                lineHeight: 1.1,
              }}
            >
              {formatNumber(finalTotal)}
            </Typography>
          </Box>
          {payableNow > 0 && paymentType === "cash" && (
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontSize: "11px", color: "var(--admin-text-muted)" }}>
                پرداخت الان
              </Typography>
              <Typography sx={{ fontSize: "12px", fontWeight: 600 }}>
                {formatNumber(payableNow)}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            p: compact ? 0.75 : 1,
            borderTop: compact ? panelBorder : { xs: panelBorder, md: "none" },
            borderLeft: compact ? "none" : { md: panelBorder },
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
          }}
        >
          <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "var(--admin-text-muted)" }}>
            نوع پرداخت
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 0.5,
            }}
          >
            {paymentButtons
              .filter((btn) => btn.show)
              .map((btn) => (
                <Button
                  key={btn.key}
                  size="small"
                  onClick={btn.onClick}
                  sx={{
                    fontSize: "11px",
                    fontWeight: 700,
                    py: 0.75,
                    borderRadius: "4px",
                    border: btn.active
                      ? "1px solid var(--admin-accent)"
                      : panelBorder,
                    bgcolor: btn.active ? paymentBtnActiveBg : paymentBtnInactiveBg,
                    color: btn.active ? paymentBtnActiveColor : "var(--admin-text)",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: btn.active
                        ? "var(--admin-accent-hover)"
                        : "var(--admin-surface-alt)",
                      borderColor: "var(--admin-accent)",
                      boxShadow: "none",
                    },
                  }}
                >
                  {btn.label}
                </Button>
              ))}
          </Box>

          {paymentType === "cash" && settlementMode === "split" && payableNow > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.25 }}>
              <Typography sx={{ fontSize: "10px", color: "var(--admin-text-muted)" }}>
                تقسیم مبلغ ({formatNumber(payableNow)} تومان)
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <TextField
                  size="small"
                  label="کارت"
                  placeholder="کارت خوان"
                  value={cardAmountInput}
                  onChange={(e) => onCardAmountChange(e.target.value)}
                  sx={{ ...compactFieldSx, flex: 1 }}
                />
                <TextField
                  size="small"
                  label="نقد"
                  placeholder="نقدی"
                  value={cashAmountInput}
                  onChange={(e) => onCashAmountChange(e.target.value)}
                  sx={{ ...compactFieldSx, flex: 1 }}
                />
              </Box>
              {paymentSplitError ? (
                <Typography sx={{ fontSize: "10px", color: "#e57373" }}>
                  {paymentSplitError}
                </Typography>
              ) : null}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            p: compact ? 0.75 : 1,
            borderTop: compact ? panelBorder : { xs: panelBorder, md: "none" },
            borderLeft: compact ? "none" : { md: panelBorder },
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            justifyContent: "space-between",
          }}
        >
          {paymentType === "installment" && installmentPaymentEnabled && (
            <TextField
              size="small"
              label="تعداد قسط"
              type="number"
              value={installmentCount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                if (v === "" || (Number(v) >= 2 && Number(v) <= 24)) {
                  onInstallmentCountChange(v === "" ? 2 : Number(v));
                }
              }}
              inputProps={{ min: 2, max: 24 }}
              sx={compactFieldSx}
            />
          )}

          {paymentType === "cheque" && chequePaymentEnabled && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "var(--admin-text)" }}>
                فروش ترکیبی چک + نقد/کارت
              </Typography>
              <Typography sx={{ fontSize: "10px", color: "var(--admin-text-muted)" }}>
                فاکتور: {formatNumber(salePayableAmount)}
                {selectedChequeId
                  ? ` · چک: ${formatNumber(selectedChequeAmount)} · باقی: ${formatNumber(chequeRemainder)}`
                  : " · چک را انتخاب کنید"}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <TextField
                  select
                  size="small"
                  value={selectedChequeId ?? ""}
                  onChange={(e) =>
                    onSelectedChequeChange(e.target.value ? Number(e.target.value) : null)
                  }
                  SelectProps={{ native: true }}
                  disabled={loadingAvailableCheques}
                  sx={{ ...compactFieldSx, flex: 1 }}
                >
                  <option value="">{loadingAvailableCheques ? "بارگذاری…" : "انتخاب چک"}</option>
                  {matchingCheques.map((cheque) => (
                    <option key={cheque.id} value={cheque.id}>
                      {[
                        cheque.cheque_number ? `چک ${cheque.cheque_number}` : `#${cheque.id}`,
                        cheque.bank_name,
                        cheque.amount != null ? formatNumber(Number(cheque.amount)) : null,
                      ]
                        .filter(Boolean)
                        .join(" — ")}
                    </option>
                  ))}
                </TextField>
                {onOpenCreateCheque && (
                  <IconButton
                    size="small"
                    onClick={onOpenCreateCheque}
                    aria-label="ثبت چک جدید"
                    sx={{
                      p: 0.4,
                      border: "1px solid var(--admin-border)",
                      borderRadius: "6px",
                      color: "var(--admin-accent)",
                    }}
                  >
                    <AddIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </Box>
              {!loadingAvailableCheques && matchingCheques.length === 0 && (
                <Typography sx={{ fontSize: "10px", color: "#e57373" }}>
                  چک مناسب نیست — با + ثبت کنید (مبلغ می‌تواند کمتر از فاکتور باشد)
                </Typography>
              )}
              {selectedChequeId && chequeRemainder === 0 && (
                <Typography sx={{ fontSize: "10px", color: "#2196f3" }}>
                  چک کل مبلغ را پوشش می‌دهد — نقد/کارت صفر
                </Typography>
              )}
              {selectedChequeId && chequeRemainder > 0 && (
                <>
                  <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "var(--admin-accent)" }}>
                    باقی‌مانده را با نقد یا کارت بپردازید: {formatNumber(chequeRemainder)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button
                      size="small"
                      variant={settlementMode === "card_all" ? "contained" : "outlined"}
                      onClick={() => onSettlementModeChange("card_all")}
                      sx={{ flex: 1, minWidth: 0, fontSize: "10px", py: 0.3 }}
                    >
                      کارت
                    </Button>
                    <Button
                      size="small"
                      variant={settlementMode === "cash_all" ? "contained" : "outlined"}
                      onClick={() => onSettlementModeChange("cash_all")}
                      sx={{ flex: 1, minWidth: 0, fontSize: "10px", py: 0.3 }}
                    >
                      نقد
                    </Button>
                    <Button
                      size="small"
                      variant={settlementMode === "split" ? "contained" : "outlined"}
                      onClick={() => onSettlementModeChange("split")}
                      sx={{ flex: 1, minWidth: 0, fontSize: "10px", py: 0.3 }}
                    >
                      نقد+کارت
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}

          {paymentType === "cheque" &&
            !!selectedChequeId &&
            settlementMode === "split" &&
            chequeRemainder > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography sx={{ fontSize: "10px", color: "var(--admin-text-muted)" }}>
                تقسیم باقی‌مانده ({formatNumber(chequeRemainder)} تومان)
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <TextField
                  size="small"
                  label="کارت"
                  placeholder="کارت خوان"
                  value={cardAmountInput}
                  onChange={(e) => onCardAmountChange(e.target.value)}
                  sx={{ ...compactFieldSx, flex: 1 }}
                />
                <TextField
                  size="small"
                  label="نقد"
                  placeholder="نقدی"
                  value={cashAmountInput}
                  onChange={(e) => onCashAmountChange(e.target.value)}
                  sx={{ ...compactFieldSx, flex: 1 }}
                />
              </Box>
            </Box>
          )}

          {paymentSplitError &&
            !(paymentType === "cash" && settlementMode === "split" && payableNow > 0) && (
            <Typography sx={{ fontSize: "10px", color: "#e57373" }}>
              {paymentSplitError}
            </Typography>
          )}

          {installmentPaymentEnabled && paymentType === "installment" && calculatingInstallments && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CircularProgress size={12} />
              <Typography sx={{ fontSize: "10px" }}>محاسبه اقساط…</Typography>
            </Box>
          )}

          {installmentCreditError && (
            <Typography sx={{ fontSize: "10px", color: "#e57373" }}>
              {installmentCreditError}
            </Typography>
          )}

          {paymentType === "debt" && (
            <Typography sx={{ fontSize: "10px", color: "#ff9800" }}>
              مبلغ به بدهی مشتری اضافه می‌شود
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            disabled={submitDisabled}
            onClick={onConfirm}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={14} sx={{ color: "inherit" }} />
              ) : (
                <CheckCircleIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              fontSize: "12px",
              fontWeight: 700,
              py: 0.85,
              borderRadius: "4px",
              bgcolor: "#2e7d32",
              boxShadow: "none",
              "&:hover": { bgcolor: "#1b5e20", boxShadow: "none" },
              "&.Mui-disabled": {
                bgcolor: "var(--admin-border)",
                color: "var(--admin-text-secondary)",
              },
            }}
          >
            {isSubmitting ? "در حال ثبت…" : "ثبت فروش"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
