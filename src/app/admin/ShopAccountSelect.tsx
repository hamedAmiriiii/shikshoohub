"use client";

import { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import {
  fetchShopAccounts,
  formatAccountOptionLabel,
  type ShopAccount,
} from "@/app/lib/shopAccounts";

type ShopAccountSelectProps = {
  value: number | "";
  onChange: (value: number | "") => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  /** صندوق نقد را از لیست حذف کند */
  excludeTill?: boolean;
  /** اگر خالی باشد همه حساب‌های فعال لود می‌شوند */
  accounts?: ShopAccount[];
  /** ردیف اولِ غیرحسابی (مثلاً کارتخوان روز)؛ انتخابش onLeadingSelect را صدا می‌زند */
  leadingOption?: { label: string; disabled?: boolean };
  leadingSelected?: boolean;
  onLeadingSelect?: () => void;
};

const LEADING_OPTION_VALUE = "__leading__";

const selectSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    direction: "rtl",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": {
    color: "var(--admin-text-muted)",
    right: 14,
    left: "auto",
    transformOrigin: "top right",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(-14px, -9px) scale(0.75)",
  },
  "& .MuiSelect-select": { textAlign: "right", direction: "rtl" },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)", left: 7, right: "auto" },
} as const;

export default function ShopAccountSelect({
  value,
  onChange,
  label = "حساب برداشت",
  helperText,
  disabled,
  required,
  compact,
  excludeTill = false,
  accounts: accountsProp,
  leadingOption,
  leadingSelected = false,
  onLeadingSelect,
}: ShopAccountSelectProps) {
  const resolvedHelperText =
    helperText ?? (required ? "حساب اصلی یا تنخواه" : " حساب اصلی یا تنخواه");
  const [accounts, setAccounts] = useState<ShopAccount[]>(accountsProp || []);
  const [loading, setLoading] = useState(!accountsProp);

  useEffect(() => {
    if (accountsProp) {
      setAccounts(
        excludeTill
          ? accountsProp.filter((a) => a.type !== "till")
          : accountsProp,
      );
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchShopAccounts();
        const filtered = excludeTill
          ? list.filter((a) => a.type !== "till")
          : list;
        if (!cancelled) setAccounts(filtered);
      } catch {
        if (!cancelled) setAccounts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountsProp, excludeTill]);

  return (
    <Box sx={{ direction: "rtl" }}>
      <FormControl fullWidth size="small" sx={selectSx} disabled={disabled || loading}>
        <InputLabel id="shop-account-select-label" required={required} sx={{ fontSize: compact ? 12 : undefined }}>
          {label}
        </InputLabel>
        <Select
          labelId="shop-account-select-label"
          label={label}
          required={required}
          value={leadingOption && leadingSelected ? LEADING_OPTION_VALUE : value === "" ? "" : String(value)}
          onChange={(e) => {
            const next = e.target.value;
            if (next === LEADING_OPTION_VALUE) {
              onLeadingSelect?.();
              return;
            }
            onChange(next === "" ? "" : Number(next));
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                "& .MuiMenuItem-root": {
                  minHeight: compact ? 32 : 40,
                  fontSize: compact ? 12 : 14,
                  py: compact ? 0.4 : 1,
                },
              },
            },
          }}
          sx={compact ? { "& .MuiSelect-select": { py: "6px", fontSize: 12 } } : undefined}
        >
          {leadingOption ? (
            <MenuItem value={LEADING_OPTION_VALUE} disabled={leadingOption.disabled}>
              {leadingOption.label}
            </MenuItem>
          ) : null}
          {required ? null : (
            <MenuItem value="">
              <em>بدون انتخاب حساب</em>
            </MenuItem>
          )}
          {accounts.map((account) => (
            <MenuItem key={account.id} value={String(account.id)}>
              {formatAccountOptionLabel(account)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {resolvedHelperText ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.5 }}>
          {resolvedHelperText}
        </Typography>
      ) : null}
    </Box>
  );
}
