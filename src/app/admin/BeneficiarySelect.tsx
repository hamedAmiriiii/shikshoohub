"use client";

import { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import {
  fetchBeneficiaries,
  fetchBeneficiary,
  formatBeneficiaryAmount,
  formatBeneficiaryLabel,
  registerBeneficiaryCustomer,
  type Beneficiary,
} from "@/app/lib/beneficiaries";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { toast } from "react-toastify";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: 13,
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
  "& .MuiInputBase-input": {
    textAlign: "right",
    direction: "rtl",
  },
} as const;

type Props = {
  value: number | "";
  initialOption?: Beneficiary | null;
  onChange: (id: number | "", option: Beneficiary | null) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  allowRegister?: boolean;
  compact?: boolean;
};

export default function BeneficiarySelect({
  value,
  initialOption,
  onChange,
  label = "مشتری (طرف‌حساب خرید)",
  helperText = "اختیاری — کسی که از او خرید کرده‌اید",
  disabled,
  allowRegister = true,
  compact,
}: Props) {
  const [options, setOptions] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState<Beneficiary | null>(initialOption ?? null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registering, setRegistering] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIdRef = useRef<number | "">(value);

  useEffect(() => {
    selectedIdRef.current = value;
  }, [value]);

  useEffect(() => {
    if (value === "") {
      setSelected(null);
      return;
    }
    if (initialOption?.id === value) {
      setSelected(initialOption);
      return;
    }
    if (selected?.id === value) return;
    let cancelled = false;
    void fetchBeneficiary(value).then((detail) => {
      if (!cancelled && detail && selectedIdRef.current === value) {
        setSelected(detail);
      }
    });
    return () => {
      cancelled = true;
    };
    // selected is intentionally omitted to avoid a fetch loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, initialOption]);

  const search = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      void fetchBeneficiaries(query)
        .then((rows) => setOptions(rows))
        .finally(() => setLoading(false));
    }, 280);
  };

  const handleRegister = async () => {
    const phone = registerPhone.trim();
    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره موبایل را به‌صورت ۱۱ رقمی وارد کنید");
      return;
    }
    setRegistering(true);
    try {
      const created = await registerBeneficiaryCustomer(phone, registerName);
      if (!created) {
        toast.error("مشتری ثبت شد ولی شناسه برنگشت؛ دوباره جستجو کنید");
        return;
      }
      setSelected(created);
      onChange(created.id, created);
      setRegisterOpen(false);
      setRegisterPhone("");
      setRegisterName("");
      toast.success("مشتری انتخاب شد");
    } catch (error) {
      const res = (error as Error & { response?: unknown }).response;
      toast.error(getApiErrorMessage(res, (error as Error).message || "ثبت مشتری ناموفق بود"));
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Box sx={{ direction: "rtl" }}>
      <Autocomplete
        disabled={disabled}
        size="small"
        options={options}
        loading={loading}
        value={selected}
        onInputChange={(_e, next, reason) => {
          setInputValue(next);
          if (reason === "input") search(next);
        }}
        onOpen={() => {
          if (options.length === 0) search(inputValue);
        }}
        onChange={(_e, next) => {
          setSelected(next);
          onChange(next ? next.id : "", next);
        }}
        isOptionEqualToValue={(option, current) => option.id === current.id}
        getOptionLabel={(option) => formatBeneficiaryLabel(option)}
        noOptionsText="مشتری پیدا نشد"
        loadingText="در حال جستجو..."
        clearOnBlur={false}
        filterOptions={(x) => x}
        slotProps={{
          popper: { sx: { zIndex: 1700, direction: "rtl" } },
          listbox: {
            sx: {
              py: 0,
              "& .MuiAutocomplete-option": {
                minHeight: compact ? 32 : 44,
                py: compact ? 0.4 : 0.75,
                fontSize: compact ? 12 : 13,
              },
            },
          },
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: "grid" }}>
              <Typography sx={{ fontSize: compact ? 12 : 13 }}>{formatBeneficiaryLabel(option)}</Typography>
              {!compact && (option.unpaid_total || option.purchased_total) ? (
                <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                  خرید {formatBeneficiaryAmount(option.purchased_total)} — بدهی{" "}
                  {formatBeneficiaryAmount(option.unpaid_total)}
                </Typography>
              ) : null}
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            size="small"
            sx={fieldSx}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      {helperText ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.5 }}>
          {helperText}
        </Typography>
      ) : null}
      {allowRegister && !compact ? (
        <Button
          size="small"
          onClick={() => {
            setRegisterPhone(inputValue.replace(/[^\d]/g, "").slice(0, 11));
            setRegisterOpen(true);
          }}
          sx={{ mt: 0.5, color: "var(--admin-accent)", fontSize: 12, px: 0 }}
        >
          + ثبت مشتری جدید
        </Button>
      ) : null}

      <Dialog
        open={registerOpen}
        onClose={() => !registering && setRegisterOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", fontSize: 15, fontWeight: 700 }}>
          ثبت طرف‌حساب در 
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gap: 1.5, mt: 0.5 }}>
            <TextField
              size="small"
              label="شماره موبایل"
              value={registerPhone}
              onChange={(e) => setRegisterPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
              inputMode="numeric"
              sx={fieldSx}
            />
            <TextField
              size="small"
              label="نام"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              sx={fieldSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            size="small"
            disabled={registering}
            onClick={() => setRegisterOpen(false)}
            sx={{ color: "var(--admin-text-muted)" }}
          >
            انصراف
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={registering}
            onClick={() => void handleRegister()}
            sx={{ backgroundColor: "var(--admin-accent)", "&:hover": { backgroundColor: "var(--admin-accent-hover)" } }}
          >
            {registering ? "..." : "ثبت و انتخاب"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
