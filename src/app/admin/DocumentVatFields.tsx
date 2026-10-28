"use client";

import { Box, MenuItem, TextField, Typography } from "@mui/material";
import { formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";
import {
  computePurchaseVat,
  formatAmountInput,
  purchaseVatPayable,
  type PurchaseVatFormState,
  type PurchaseVatMode,
} from "@/app/lib/purchaseVat";

type Props = {
  enabled: boolean;
  value: PurchaseVatFormState;
  onChange: (next: PurchaseVatFormState) => void;
  baseAmount: number;
  disabled?: boolean;
  compact?: boolean;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--admin-surface)",
    color: "var(--admin-text)",
    borderRadius: "8px",
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
};

export default function DocumentVatFields({
  enabled,
  value,
  onChange,
  baseAmount,
  disabled,
  compact,
}: Props) {
  if (!enabled) return null;

  const vat = computePurchaseVat(baseAmount, value);
  const payable = purchaseVatPayable(baseAmount, value);
  const patch = (partial: Partial<PurchaseVatFormState>) => onChange({ ...value, ...partial });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, gridColumn: "1 / -1" }}>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>ارزش افزوده</Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : { xs: "1fr", sm: "1fr 1fr 1fr" },
          gap: 1,
        }}
      >
        <TextField
          select
          size="small"
          label="نوع"
          value={value.mode}
          disabled={disabled}
          onChange={(e) => patch({ mode: e.target.value as PurchaseVatMode })}
          sx={fieldSx}
        >
          <MenuItem value="none">بدون ارزش افزوده</MenuItem>
          <MenuItem value="percent">درصدی</MenuItem>
          <MenuItem value="amount">مبلغ ثابت</MenuItem>
        </TextField>
        {value.mode === "percent" ? (
          <TextField
            size="small"
            label="درصد"
            value={value.percent}
            disabled={disabled}
            onChange={(e) => patch({ percent: formatAmountInput(e.target.value) })}
            inputMode="decimal"
            sx={fieldSx}
          />
        ) : null}
        {value.mode === "amount" ? (
          <TextField
            size="small"
            label="مبلغ ارزش افزوده"
            value={value.amount}
            disabled={disabled}
            onChange={(e) => patch({ amount: formatAmountInput(e.target.value) })}
            inputMode="numeric"
            sx={fieldSx}
          />
        ) : null}
        {value.mode !== "none" ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              px: 1,
              py: 0.75,
              borderRadius: "8px",
              border: "1px solid var(--admin-border)",
              bgcolor: "var(--admin-surface-alt)",
            }}
          >
            <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
              ارزش افزوده: {formatAmountNumber(vat)} تومان
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>
              جمع قابل پرداخت: {formatAmountNumber(payable)} تومان
            </Typography>
            {baseAmount > 0 && value.mode === "percent" ? (
              <Typography sx={{ fontSize: 10, color: "var(--admin-text-muted)" }}>
                پایه {formatAmountNumber(Math.round(baseAmount || 0))}
                {parseAmountInput(value.percent) > 0 ? ` × ${value.percent}%` : ""}
              </Typography>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
