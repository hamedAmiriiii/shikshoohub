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
  /** اگر خالی باشد همه حساب‌های فعال لود می‌شوند */
  accounts?: ShopAccount[];
};

const selectSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiSelect-icon": { color: "var(--admin-text-muted)" },
} as const;

export default function ShopAccountSelect({
  value,
  onChange,
  label = "حساب برداشت",
  helperText = "اختیاری — حساب اصلی یا تنخواه",
  disabled,
  accounts: accountsProp,
}: ShopAccountSelectProps) {
  const [accounts, setAccounts] = useState<ShopAccount[]>(accountsProp || []);
  const [loading, setLoading] = useState(!accountsProp);

  useEffect(() => {
    if (accountsProp) {
      setAccounts(accountsProp);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchShopAccounts();
        if (!cancelled) setAccounts(list);
      } catch {
        if (!cancelled) setAccounts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountsProp]);

  return (
    <Box>
      <FormControl fullWidth size="small" sx={selectSx} disabled={disabled || loading}>
        <InputLabel id="shop-account-select-label">{label}</InputLabel>
        <Select
          labelId="shop-account-select-label"
          label={label}
          value={value === "" ? "" : String(value)}
          onChange={(e) => {
            const next = e.target.value;
            onChange(next === "" ? "" : Number(next));
          }}
        >
          <MenuItem value="">
            <em>بدون انتخاب حساب</em>
          </MenuItem>
          {accounts.map((account) => (
            <MenuItem key={account.id} value={String(account.id)}>
              {formatAccountOptionLabel(account)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {helperText ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.5 }}>
          {helperText}
        </Typography>
      ) : null}
    </Box>
  );
}
