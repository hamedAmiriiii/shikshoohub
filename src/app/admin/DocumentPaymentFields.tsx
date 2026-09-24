"use client";

import { useState } from "react";
import { Box, FormControlLabel, IconButton, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";
import { CHEQUE_DATE_PICKER_Z, chequeDatePickerBoxSx, chequeFormFieldSx } from "@/app/admin/cheques/ChequeFormSheet";
import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";
import {
  appendDocumentCheque,
  beginEditDocumentCheque,
  documentChequeTotal,
  removeDocumentCheque,
  type DocumentPaymentFormState,
  type DocumentPaymentMethod,
} from "@/app/lib/documentPayments";

const CHEQUE_ROW_TONES = [
  { bg: "rgba(120, 181, 104, 0.18)", border: "rgba(120, 181, 104, 0.7)", mark: "#5f9a4a" },
  { bg: "rgba(70, 130, 210, 0.16)", border: "rgba(70, 130, 210, 0.65)", mark: "#3d78c4" },
  { bg: "rgba(196, 140, 42, 0.18)", border: "rgba(196, 140, 42, 0.7)", mark: "#b57a1e" },
  { bg: "rgba(150, 96, 196, 0.16)", border: "rgba(150, 96, 196, 0.65)", mark: "#8d55b8" },
];

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
  const [chequeError, setChequeError] = useState("");
  const patch = (partial: Partial<DocumentPaymentFormState>) => onChange({ ...value, ...partial });
  const cash = parseAmountInput(value.cashAmount);
  const cheque = parseAmountInput(value.chequeAmount);
  const credit = parseAmountInput(value.creditAmount);
  const mixedSum = cash + cheque + credit;
  const mixedDiff = Math.round(totalAmount) - Math.round(mixedSum);
  const needsAccount = value.mode === "account" || (value.mode === "mixed" && cash > 0);
  const needsCheque = value.mode === "cheque" || value.mode === "mixed";
  const listedChequeTotal = documentChequeTotal(value.cheques);
  const addCheque = () => {
    const added = appendDocumentCheque(value);
    if (added.error || !added.form) {
      setChequeError(added.error || "مشخصات چک را وارد کنید");
      return;
    }
    setChequeError("");
    const used = documentChequeTotal(added.form.cheques) + cash + credit;
    const remaining = Math.round(totalAmount) - used;
    onChange({
      ...added.form,
      draftChequeAmount:
        value.mode === "cheque" && remaining > 0
          ? formatAmountInput(String(remaining))
          : "",
    });
  };

  const editCheque = (key: string) => {
    const edited = beginEditDocumentCheque(value, key);
    if (edited.error || !edited.form) {
      setChequeError(edited.error || "ویرایش این چک ممکن نیست");
      return;
    }
    setChequeError("");
    onChange(edited.form);
  };

  const setMode = (mode: DocumentPaymentMethod) => {
    if (mode === "cheque" && !value.draftChequeAmount && value.cheques.length === 0 && totalAmount > 0) {
      patch({
        mode,
        draftChequeAmount: formatAmountInput(String(Math.round(totalAmount))),
      });
      return;
    }
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
              label="جمع چک‌ها"
              value={value.chequeAmount}
              disabled
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {value.cheques.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {value.cheques.map((row, index) => {
                const tone = CHEQUE_ROW_TONES[index % CHEQUE_ROW_TONES.length];
                return (
                <Box
                  key={row.key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1,
                    py: 0.7,
                    borderRadius: "8px",
                    border: `1px solid ${tone.border}`,
                    bgcolor: tone.bg,
                  }}
                >
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "6px",
                      bgcolor: tone.mark,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography sx={{ flex: 1, minWidth: 0, color: "var(--admin-text)", fontSize: 12, fontWeight: 600 }}>
                    {row.chequeNumber ? `شماره ${row.chequeNumber}` : "بدون شماره"}
                    {row.chequeBank ? ` — ${row.chequeBank}` : ""}
                    {` — ${formatAmountNumber(parseAmountInput(row.amount))} تومان`}
                    {row.chequeDueDate ? ` — سررسید ${row.chequeDueDate.format("YYYY/MM/DD")}` : ""}
                  </Typography>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    aria-label="ویرایش چک"
                    onClick={() => editCheque(row.key)}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 18, color: tone.mark }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    aria-label="حذف چک"
                    onClick={() => {
                      setChequeError("");
                      onChange(removeDocumentCheque(value, row.key));
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18, color: "var(--admin-error-soft)" }} />
                  </IconButton>
                </Box>
                );
              })}
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
                {value.cheques.length} چک در لیست — جمع {formatAmountNumber(listedChequeTotal)} تومان. برای تغییر، ویرایش همان ردیف را بزنید.
              </Typography>
            </Box>
          ) : null}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
          <TextField
            size="small"
            label="مبلغ این چک"
            value={value.draftChequeAmount}
            onChange={(e) => {
              setChequeError("");
              patch({ draftChequeAmount: formatAmountInput(e.target.value) });
            }}
            disabled={disabled}
            sx={chequeFormFieldSx}
          />
          <TextField
            size="small"
            label="شماره چک"
            value={value.chequeNumber}
            onChange={(e) => {
              setChequeError("");
              patch({ chequeNumber: e.target.value });
            }}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <IconButton
              onClick={addCheque}
              disabled={disabled}
              aria-label="افزودن چک"
              sx={{
                bgcolor: "var(--admin-accent)",
                color: "var(--admin-on-accent)",
                width: 32,
                height: 32,
                "&:hover": { bgcolor: "var(--admin-accent-hover)" },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>
              {value.cheques.length === 0 ? "ثبت این چک" : "چک بعدی"}
            </Typography>
          </Box>
          {chequeError ? (
            <Typography sx={{ color: "var(--admin-error-soft)", fontSize: 11 }}>{chequeError}</Typography>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
