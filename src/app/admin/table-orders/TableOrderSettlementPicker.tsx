"use client";

import { Box, Chip, TextField, Typography } from "@mui/material";
import type { TableOrder } from "@/app/lib/shopTables";

export type SettlementMode = "card" | "cash" | "split";

export type SettlementValue = {
  mode: SettlementMode;
  card: string;
  cash: string;
};

export const DEFAULT_SETTLEMENT: SettlementValue = { mode: "card", card: "", cash: "" };

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\d]/g, "");
}

/** بدنهٔ POST /api/table-orders/{id}/pay یا پیام خطا. */
export function settlementRequestBody(
  value: SettlementValue,
  order: TableOrder,
): { body: Record<string, unknown> } | { error: string } {
  if (order.paid_online) return { body: { payment_settlement: "card" } };
  if (value.mode !== "split") return { body: { payment_settlement: value.mode } };
  const card = Number(toLatinDigits(value.card)) || 0;
  const cash = Number(toLatinDigits(value.cash)) || 0;
  if (card <= 0 && cash <= 0) return { error: "مبلغ کارت و نقد را وارد کنید." };
  return { body: { card_amount: card, cash_amount: cash } };
}

const MODES: Array<{ key: SettlementMode; label: string }> = [
  { key: "card", label: "کارت" },
  { key: "cash", label: "نقد" },
  { key: "split", label: "ترکیبی" },
];

export default function TableOrderSettlementPicker({
  order,
  amount,
  value,
  onChange,
  disabled,
}: {
  order: TableOrder;
  amount: number;
  value: SettlementValue;
  onChange: (next: SettlementValue) => void;
  disabled?: boolean;
}) {
  if (order.paid_online) {
    return (
      <Box sx={{ mt: 1.5, p: 1.2, borderRadius: "10px", bgcolor: "rgba(76, 175, 80, 0.14)" }}>
        <Typography sx={{ fontWeight: 800, fontSize: 13, color: "#2e7d32" }}>
          مشتری آنلاین پرداخت کرده است
        </Typography>
        {order.online_ref_id ? (
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-secondary)", mt: 0.3 }}>
            کد پیگیری زرین‌پال: <span style={{ direction: "ltr", display: "inline-block" }}>{order.online_ref_id}</span>
          </Typography>
        ) : null}
      </Box>
    );
  }

  const setSplit = (field: "card" | "cash", raw: string) => {
    const digits = toLatinDigits(raw);
    const n = Number(digits) || 0;
    const other = Math.max(0, amount - n);
    onChange(
      field === "card"
        ? { mode: "split", card: digits, cash: digits ? String(other) : value.cash }
        : { mode: "split", cash: digits, card: digits ? String(other) : value.card },
    );
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", mb: 0.8 }}>
        نحوهٔ تسویه
      </Typography>
      <Box sx={{ display: "flex", gap: 0.75 }}>
        {MODES.map((mode) => {
          const active = value.mode === mode.key;
          return (
            <Chip
              key={mode.key}
              label={mode.label}
              disabled={disabled}
              onClick={() =>
                onChange(
                  mode.key === "split"
                    ? { mode: "split", card: value.card || String(amount), cash: value.cash || "0" }
                    : { ...value, mode: mode.key },
                )
              }
              sx={{
                flex: 1,
                fontWeight: 700,
                bgcolor: active ? "var(--admin-accent)" : "var(--admin-surface)",
                color: active ? "#fff" : "var(--admin-text)",
                border: "1px solid var(--admin-border)",
              }}
            />
          );
        })}
      </Box>
      {value.mode === "split" ? (
        <Box sx={{ display: "flex", gap: 1, mt: 1.2 }}>
          <TextField
            size="small"
            label="کارت (تومان)"
            value={value.card ? formatNumber(Number(value.card)) : ""}
            onChange={(e) => setSplit("card", e.target.value)}
            disabled={disabled}
            inputProps={{ inputMode: "numeric", style: { direction: "ltr" } }}
            fullWidth
          />
          <TextField
            size="small"
            label="نقد (تومان)"
            value={value.cash ? formatNumber(Number(value.cash)) : ""}
            onChange={(e) => setSplit("cash", e.target.value)}
            disabled={disabled}
            inputProps={{ inputMode: "numeric", style: { direction: "ltr" } }}
            fullWidth
          />
        </Box>
      ) : null}
    </Box>
  );
}
