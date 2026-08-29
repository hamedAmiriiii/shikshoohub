"use client";

import { Box, FormControlLabel, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";
import { CHEQUE_DATE_PICKER_Z, chequeDatePickerBoxSx, chequeFormFieldSx } from "@/app/admin/cheques/ChequeFormSheet";
import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";
import {
  type DocumentPaymentFormState,
  type DocumentPaymentMethod,
} from "@/app/lib/documentPayments";

const MODES: { value: DocumentPaymentMethod; label: string }[] = [
  { value: "account", label: "نقد" },
  { value: "cheque", label: "چک" },
  { value: "credit", label: "نسیه" },
  { value: "mixed", label: "ترکیبی" },
];

type Props = {
  value: DocumentPaymentFormState;
  onChange: (next: DocumentPaymentFormState) => void;
  totalAmount: number;
  disabled?: boolean;
  compact?: boolean;
};

export default function DocumentPaymentFields({
  value,
  onChange,
  totalAmount,
  disabled,
  compact,
}: Props) {
  const patch = (partial: Partial<DocumentPaymentFormState>) => onChange({ ...value, ...partial });
  const cash = parseAmountInput(value.cashAmount);
  const cheque = parseAmountInput(value.chequeAmount);
  const credit = parseAmountInput(value.creditAmount);
  const mixedSum = cash + cheque + credit;
  const mixedDiff = Math.round(totalAmount) - Math.round(mixedSum);
  const needsAccount = value.mode === "account" || (value.mode === "mixed" && cash > 0);
  const needsCheque = value.mode === "cheque" || (value.mode === "mixed" && cheque > 0);

  const setMode = (mode: DocumentPaymentMethod) => {
    if (mode === "mixed" && !value.cashAmount && !value.chequeAmount && !value.creditAmount && totalAmount > 0) {
      patch({
        mode,
        cashAmount: formatAmountInput(String(Math.round(totalAmount))),
        chequeAmount: "",
        creditAmount: "",
      });
      return;
    }
    patch({ mode });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, gridColumn: "1 / -1" }}>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>نوع پرداخت</Typography>
      <RadioGroup
        row
        value={value.mode}
        onChange={(e) => setMode(e.target.value as DocumentPaymentMethod)}
        sx={{ gap: 0.5, "& .MuiFormControlLabel-root": { mr: 0.5, ml: 0 } }}
      >
        {MODES.map((mode) => (
          <FormControlLabel
            key={mode.value}
            value={mode.value}
            disabled={disabled}
            control={
              <Radio
                size="small"
                sx={{ color: "var(--admin-accent)", py: 0.25, "&.Mui-checked": { color: "var(--admin-accent)" } }}
              />
            }
            label={<Typography sx={{ fontSize: compact ? 12 : 13, color: "var(--admin-text)" }}>{mode.label}</Typography>}
          />
        ))}
      </RadioGroup>

      {value.mode === "credit" ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
          مبلغ به‌صورت نسیه ثبت می‌شود و بعداً از همین سند قابل تسویه است.
        </Typography>
      ) : null}

      {value.mode === "mixed" ? (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: compact ? "1fr 1fr" : { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1 }}>
            <TextField
              size="small"
              label="نقد"
              value={value.cashAmount}
              onChange={(e) => patch({ cashAmount: formatAmountInput(e.target.value) })}
              disabled={disabled}
              sx={chequeFormFieldSx}
            />
            <TextField
              size="small"
              label="چک"
              value={value.chequeAmount}
              onChange={(e) => patch({ chequeAmount: formatAmountInput(e.target.value) })}
              disabled={disabled}
              sx={chequeFormFieldSx}
            />
            <TextField
              size="small"
              label="نسیه"
              value={value.creditAmount}
              onChange={(e) => patch({ creditAmount: formatAmountInput(e.target.value) })}
              disabled={disabled}
              sx={chequeFormFieldSx}
            />
          </Box>
          <Typography
            sx={{
              color: mixedDiff === 0 ? "var(--admin-accent)" : "#e6a23c",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {totalAmount > 0
              ? mixedDiff === 0
                ? `جمع برابر مبلغ سند است (${formatAmountNumber(totalAmount)} تومان)`
                : `مانده نسبت به مبلغ سند: ${formatAmountNumber(mixedDiff)} تومان`
              : "ابتدا مبلغ سند را وارد کنید"}
          </Typography>
        </>
      ) : null}

      {needsAccount || value.mode === "mixed" ? (
        <ShopAccountSelect
          value={value.shopAccountId}
          onChange={(shopAccountId) => patch({ shopAccountId })}
          required={needsAccount}
          compact={compact}
          helperText={compact ? "" : needsAccount ? "نقد همان لحظه از این حساب کم می‌شود" : "برای سهم نقد لازم است"}
        />
      ) : null}

      {needsCheque ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
          <TextField
            size="small"
            label="شماره چک"
            value={value.chequeNumber}
            onChange={(e) => patch({ chequeNumber: e.target.value })}
            disabled={disabled}
            sx={chequeFormFieldSx}
          />
          <TextField
            size="small"
            label="نام بانک"
            value={value.chequeBank}
            onChange={(e) => patch({ chequeBank: e.target.value })}
            disabled={disabled}
            sx={chequeFormFieldSx}
          />
          <TextField
            size="small"
            label="در وجه"
            value={value.chequePayee}
            onChange={(e) => patch({ chequePayee: e.target.value })}
            disabled={disabled}
            sx={chequeFormFieldSx}
          />
          <Box sx={compact ? { width: "100%" } : chequeDatePickerBoxSx}>
            {!compact ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.25 }}>
                سررسید چک
              </Typography>
            ) : null}
            <DatePicker
              value={value.chequeDueDate}
              onChange={(d) =>
                patch({ chequeDueDate: d && !Array.isArray(d) ? (d as DateObject) : null })
              }
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              zIndex={CHEQUE_DATE_PICKER_Z}
              portal
              containerStyle={{ width: "100%" }}
              disabled={disabled}
              placeholder="سررسید"
              className={compact ? undefined : "rmdp-mobile"}
              style={compact ? undefined : { width: "100%", height: 36, borderRadius: 8 }}
              render={
                compact
                  ? (text, openCalendar) => (
                      <TextField
                        size="small"
                        label="سررسید چک"
                        value={typeof text === "string" ? text : String(text || "")}
                        onClick={openCalendar}
                        onFocus={openCalendar}
                        fullWidth
                        disabled={disabled}
                        sx={chequeFormFieldSx}
                        inputProps={{ readOnly: true, style: { cursor: "pointer" } }}
                      />
                    )
                  : undefined
              }
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
