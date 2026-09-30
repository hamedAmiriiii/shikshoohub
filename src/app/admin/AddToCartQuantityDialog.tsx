"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Dialog, IconButton, InputBase, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  formatProductQuantity,
  getMinQuantity,
  getQuantityIncrement,
  getUnitLabel,
  normalizeQuantityValue,
  parseQuantityInput,
  type ProductUnitFields,
} from "@/app/lib/productUnits";

type AddToCartQuantityDialogProps = {
  open: boolean;
  productName: string;
  /** واحد مؤثر کالا؛ وقتی فروش کیلویی خاموش است باید «عدد» باشد */
  unitItem: ProductUnitFields;
  /** حداکثر قابل افزودن = موجودی منهای مقدار فعلی در سبد */
  maxQuantity: number;
  inCartQuantity: number;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
};

export default function AddToCartQuantityDialog({
  open,
  productName,
  unitItem,
  maxQuantity,
  inCartQuantity,
  onClose,
  onConfirm,
}: AddToCartQuantityDialogProps) {
  const [value, setValue] = useState("1");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue("1");
    const id = window.setTimeout(() => inputRef.current?.select(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  const unitLabel = getUnitLabel(unitItem);
  const minQuantity = getMinQuantity(unitItem);
  const parsed = parseQuantityInput(value, unitItem);
  const quantity = parsed == null ? null : normalizeQuantityValue(parsed, unitItem);

  let error = "";
  if (value.trim() !== "") {
    if (quantity == null || quantity < minQuantity) {
      error = "تعداد معتبر نیست";
    } else if (quantity > maxQuantity) {
      error = "بیشتر از موجودی نمی‌شود";
    }
  }
  const canSubmit = quantity != null && quantity >= minQuantity && !error;

  const step = (direction: 1 | -1) => {
    const current = quantity ?? 0;
    const next = normalizeQuantityValue(current + direction * getQuantityIncrement(unitItem), unitItem);
    const clamped = Math.min(Math.max(next, minQuantity), maxQuantity);
    setValue(String(clamped));
  };

  const submit = () => {
    if (!canSubmit || quantity == null) return;
    onConfirm(quantity);
  };

  return (
    <Dialog
      disableScrollLock
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 260,
          m: 2,
          p: 2,
          bgcolor: "var(--admin-surface)",
          color: "var(--admin-text)",
          borderRadius: "14px",
          border: "1px solid var(--admin-border)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
          direction: "rtl",
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {productName || "بدون نام"}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.25 }}>
        تا {formatProductQuantity(maxQuantity, unitItem)} {unitLabel}
        {inCartQuantity > 0 ? ` · در سبد ${formatProductQuantity(inCartQuantity, unitItem)}` : ""}
      </Typography>

      <Box
        sx={{
          mt: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 0.5,
          borderRadius: "10px",
          bgcolor: "var(--admin-surface-alt)",
          border: `1px solid ${error ? "var(--admin-error-soft, #e57373)" : "transparent"}`,
        }}
      >
        <IconButton
          size="small"
          onClick={() => step(1)}
          disabled={quantity != null && quantity >= maxQuantity}
          sx={{ color: "var(--admin-accent)" }}
          aria-label="افزایش تعداد"
        >
          <AddIcon fontSize="small" />
        </IconButton>
        <InputBase
          autoFocus
          fullWidth
          inputRef={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              submit();
            }
          }}
          inputMode="decimal"
          inputProps={{ "aria-label": `تعداد (${unitLabel})` }}
          sx={{
            color: "var(--admin-text)",
            "& input": { textAlign: "center", fontSize: 20, fontWeight: 800, py: 0.75 },
          }}
        />
        <IconButton
          size="small"
          onClick={() => step(-1)}
          disabled={quantity == null || quantity <= minQuantity}
          sx={{ color: "var(--admin-accent)" }}
          aria-label="کاهش تعداد"
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
      </Box>
      {error ? (
        <Typography sx={{ color: "var(--admin-error-soft, #e57373)", fontSize: 11, mt: 0.5 }}>
          {error}
        </Typography>
      ) : null}

      <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={submit}
          disabled={!canSubmit}
          sx={{ borderRadius: "10px", fontSize: 13, fontWeight: 700, py: 0.75 }}
        >
          افزودن
        </Button>
        <Button
          onClick={onClose}
          sx={{ borderRadius: "10px", fontSize: 13, color: "var(--admin-text-muted)", minWidth: 64 }}
        >
          انصراف
        </Button>
      </Box>
    </Dialog>
  );
}
