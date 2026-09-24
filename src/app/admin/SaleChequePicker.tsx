"use client";

import { Box, IconButton, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { parseAmount } from "@/app/lib/cheques";

type SaleChequeOption = {
  id: number;
  cheque_number?: string | null;
  bank_name?: string | null;
  amount?: number | string | null;
};

const ROW_TONES = [
  { bg: "rgba(120, 181, 104, 0.2)", border: "rgba(120, 181, 104, 0.7)", mark: "#5f9a4a" },
  { bg: "rgba(70, 130, 210, 0.16)", border: "rgba(70, 130, 210, 0.65)", mark: "#3d78c4" },
  { bg: "rgba(196, 140, 42, 0.18)", border: "rgba(196, 140, 42, 0.7)", mark: "#b57a1e" },
  { bg: "rgba(150, 96, 196, 0.16)", border: "rgba(150, 96, 196, 0.65)", mark: "#8d55b8" },
];

type Props = {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  options: SaleChequeOption[];
  loading?: boolean;
  payableAmount: number;
  onCreate?: () => void;
  formatAmount: (value: number) => string;
  fieldSx?: object;
  dense?: boolean;
};

function chequeTitle(cheque: SaleChequeOption | undefined, id: number): string {
  if (!cheque) return `چک ${id}`;
  const parts = [
    cheque.cheque_number ? `شماره ${cheque.cheque_number}` : `چک ${id}`,
    cheque.bank_name,
  ].filter(Boolean);
  return parts.join(" — ");
}

export default function SaleChequePicker({
  selectedIds,
  onChange,
  options,
  loading,
  payableAmount,
  onCreate,
  formatAmount,
  fieldSx,
  dense,
}: Props) {
  const selected = selectedIds.map((id) => options.find((cheque) => cheque.id === id));
  const selectedSum = selected.reduce((sum, cheque) => sum + (cheque ? parseAmount(cheque.amount) : 0), 0);
  const room = Math.max(0, payableAmount - selectedSum);
  const choices = options.filter((cheque) => {
    if (selectedIds.includes(cheque.id)) return false;
    const amount = parseAmount(cheque.amount);
    return amount > 0 && amount <= room + 0.02;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: dense ? 0.35 : 0.75, width: "100%" }}>
      {selectedIds.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
          {selectedIds.map((id, index) => {
            const cheque = selected[index];
            const tone = ROW_TONES[index % ROW_TONES.length];
            const amount = cheque ? parseAmount(cheque.amount) : 0;
            return (
              <Box
                key={id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 0.75,
                  py: 0.4,
                  borderRadius: "8px",
                  border: `1px solid ${tone.border}`,
                  bgcolor: tone.bg,
                }}
              >
                <Box
                  sx={{
                    width: dense ? 16 : 20,
                    height: dense ? 16 : 20,
                    borderRadius: "5px",
                    bgcolor: tone.mark,
                    color: "#fff",
                    fontSize: dense ? 10 : 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    color: "var(--admin-text)",
                    fontSize: dense ? 10 : 12,
                    fontWeight: 600,
                    lineHeight: 1.35,
                  }}
                >
                  {chequeTitle(cheque, id)}
                  {amount > 0 ? ` — ${formatAmount(amount)}` : ""}
                </Typography>
                <IconButton
                  size="small"
                  aria-label="حذف چک"
                  onClick={() => onChange(selectedIds.filter((rowId) => rowId !== id))}
                  sx={{ p: 0.25 }}
                >
                  <CloseIcon sx={{ fontSize: dense ? 14 : 16 }} />
                </IconButton>
              </Box>
            );
          })}
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: dense ? 10 : 11 }}>
            {selectedIds.length} چک — جمع {formatAmount(selectedSum)}
          </Typography>
        </Box>
      ) : null}
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <TextField
          select
          size="small"
          value=""
          onChange={(e) => {
            const id = Number(e.target.value);
            if (!id || selectedIds.includes(id)) return;
            onChange([...selectedIds, id]);
          }}
          SelectProps={{ native: true }}
          disabled={loading || room <= 0}
          sx={{ ...fieldSx, flex: 1, minWidth: 0 }}
        >
          <option value="">
            {loading
              ? "بارگذاری..."
              : room <= 0 && selectedIds.length > 0
                ? "مبلغ چک‌ها کامل است"
                : selectedIds.length === 0
                  ? "انتخاب چک"
                  : "چک بعدی"}
          </option>
          {choices.map((cheque) => (
            <option key={cheque.id} value={cheque.id}>
              {[
                cheque.cheque_number ? `چک ${cheque.cheque_number}` : `#${cheque.id}`,
                cheque.bank_name,
                formatAmount(parseAmount(cheque.amount)),
              ]
                .filter(Boolean)
                .join(" — ")}
            </option>
          ))}
        </TextField>
        {onCreate ? (
          <IconButton
            size="small"
            onClick={onCreate}
            aria-label="ثبت چک جدید"
            sx={{
              p: dense ? 0.35 : 0.6,
              border: "1px solid var(--admin-border)",
              borderRadius: "8px",
              color: "var(--admin-accent)",
              bgcolor: "var(--admin-icon-bg)",
              flexShrink: 0,
            }}
          >
            <AddIcon sx={{ fontSize: dense ? 16 : 20 }} />
          </IconButton>
        ) : null}
      </Box>
    </Box>
  );
}
