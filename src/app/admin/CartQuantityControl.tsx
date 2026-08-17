"use client";

import { useState } from "react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import {
  formatProductQuantity,
  getMinQuantity,
  getQuantityIncrement,
  isKgProduct,
  normalizeQuantityValue,
  parseQuantityInput,
  type ProductUnitFields,
} from "@/app/lib/productUnits";

type CartQuantityControlProps = {
  item: ProductUnitFields & { id: number | string; quantity: number };
  kgSalesEnabled: boolean;
  onChange: (itemId: number | string, quantity: number) => void;
  compact?: boolean;
};

export default function CartQuantityControl({
  item,
  kgSalesEnabled,
  onChange,
  compact = false,
}: CartQuantityControlProps) {
  const isKg = kgSalesEnabled && isKgProduct(item);
  const [draft, setDraft] = useState<string | null>(null);

  const displayQty = draft ?? formatProductQuantity(item.quantity, item);
  const step = getQuantityIncrement(item);
  const minQty = getMinQuantity(item);

  const applyQuantity = (raw: number) => {
    const normalized = normalizeQuantityValue(raw, isKg ? item : { unit_type: "piece" });
    if (normalized < minQty) {
      onChange(item.id, 0);
      return;
    }
    onChange(item.id, normalized);
  };

  const bump = (delta: number) => {
    applyQuantity(item.quantity + delta);
    setDraft(null);
  };

  if (!isKg) {
    const iconSize = compact ? 12 : 16;
    const btnSize = compact ? 18 : { xs: 24, md: 32 };
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: compact ? 0.25 : { xs: 0.75, md: 1.5 }, justifyContent: "flex-end" }}>
        <IconButton
          size="small"
          onClick={() => bump(-1)}
          sx={{
            color: "var(--admin-text)",
            backgroundColor: "var(--admin-surface-alt)",
            width: btnSize,
            height: btnSize,
            "&:hover": { backgroundColor: "var(--admin-accent)" },
          }}
        >
          <RemoveIcon sx={{ fontSize: iconSize }} />
        </IconButton>
        <Typography
          sx={{
            color: "var(--admin-text)",
            minWidth: compact ? 14 : { xs: 24, md: 40 },
            textAlign: "center",
            fontSize: compact ? "9px" : { xs: "12px", md: "16px" },
          }}
        >
          {formatProductQuantity(item.quantity, item)}
        </Typography>
        <IconButton
          size="small"
          onClick={() => bump(1)}
          sx={{
            color: "var(--admin-text)",
            backgroundColor: "var(--admin-surface-alt)",
            width: btnSize,
            height: btnSize,
            "&:hover": { backgroundColor: "var(--admin-accent)" },
          }}
        >
          <AddIcon sx={{ fontSize: iconSize }} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
      <IconButton size="small" onClick={() => bump(-step)} sx={{ p: compact ? 0.15 : 0.5 }}>
        <RemoveIcon sx={{ fontSize: compact ? 12 : 16 }} />
      </IconButton>
      <TextField
        size="small"
        value={displayQty}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) {
            const parsed = parseQuantityInput(draft, item);
            if (parsed !== null) applyQuantity(parsed);
          }
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        inputProps={{
          inputMode: "decimal",
          style: { textAlign: "center", fontSize: compact ? 10 : 14, padding: compact ? "2px 4px" : undefined },
        }}
        sx={{
          width: compact ? 52 : 72,
          "& .MuiOutlinedInput-root": {
            minHeight: compact ? 24 : 32,
            bgcolor: "var(--admin-surface-alt)",
          },
        }}
      />
      <IconButton size="small" onClick={() => bump(step)} sx={{ p: compact ? 0.15 : 0.5 }}>
        <AddIcon sx={{ fontSize: compact ? 12 : 16 }} />
      </IconButton>
    </Box>
  );
}
