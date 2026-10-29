"use client";

import { Box, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
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
  minWidth: 100,
  flex: "1 1 100px",
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--admin-surface)",
    color: "var(--admin-text)",
    borderRadius: "8px",
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
};

const toggleSx = {
  height: 36,
  px: 1.25,
  fontSize: 12,
  color: "var(--admin-text-muted)",
  borderColor: "var(--admin-border)",
  "&.Mui-selected": {
    bgcolor: "var(--admin-accent)",
    color: "var(--admin-on-accent)",
    borderColor: "var(--admin-accent)",
    "&:hover": { bgcolor: "var(--admin-accent-hover)" },
  },
};

export default function DocumentVatFields({
  enabled,
  value,
  onChange,
  baseAmount,
  disabled,
}: Props) {
  if (!enabled) return null;

  const vat = computePurchaseVat(baseAmount, value);
  const payable = purchaseVatPayable(baseAmount, value);
  const patch = (partial: Partial<PurchaseVatFormState>) => onChange({ ...value, ...partial });

  const setMode = (_: unknown, next: PurchaseVatMode | null) => {
    if (!next) return;
    patch({ mode: next });
  };

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography
        sx={{
          color: "var(--admin-text-muted)",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        ارزش افزوده
      </Typography>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={value.mode}
        disabled={disabled}
        onChange={setMode}
        sx={{ flexShrink: 0 }}
      >
        <ToggleButton value="none" sx={toggleSx}>
          بدون
        </ToggleButton>
        <ToggleButton value="percent" sx={toggleSx}>
          درصدی
        </ToggleButton>
        <ToggleButton value="amount" sx={toggleSx}>
          مبلغ
        </ToggleButton>
      </ToggleButtonGroup>

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
          label="مبلغ"
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
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: 1,
            px: 1,
            py: 0.5,
            borderRadius: "8px",
            border: "1px solid var(--admin-border)",
            bgcolor: "var(--admin-surface-alt)",
            flex: "1 1 180px",
            minWidth: 160,
          }}
        >
          <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}>
            VAT {formatAmountNumber(vat)}
            {baseAmount > 0 && value.mode === "percent" && parseAmountInput(value.percent) > 0
              ? ` (${formatAmountNumber(Math.round(baseAmount || 0))}×${value.percent}%)`
              : ""}
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)", whiteSpace: "nowrap" }}>
            قابل پرداخت {formatAmountNumber(payable)}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
