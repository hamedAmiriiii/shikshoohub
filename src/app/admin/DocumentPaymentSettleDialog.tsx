"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";
import { chequeFormFieldSx } from "@/app/admin/cheques/ChequeFormSheet";
import type { DocumentPaymentKind } from "@/app/lib/documentPayments";
import {
  buildAvailableChequesForTransferUrl,
  extractChequeList,
  formatChequeOptionLabel,
  parseAmount,
  type Cheque,
} from "@/app/lib/cheques";

type SettleMode = "account" | "transfer";

type Props = {
  open: boolean;
  kind: DocumentPaymentKind;
  documentId: number | null;
  remainingAmount: number;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DocumentPaymentSettleDialog({
  open,
  kind,
  documentId,
  remainingAmount,
  onClose,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<SettleMode>("account");
  const [amount, setAmount] = useState("");
  const [shopAccountId, setShopAccountId] = useState<number | "">("");
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [loadingCheques, setLoadingCheques] = useState(false);
  const [saving, setSaving] = useState(false);

  const eligibleCheques = useMemo(
    () => cheques.filter((c) => parseAmount(c.amount) > 0 && parseAmount(c.amount) <= remainingAmount + 0.02),
    [cheques, remainingAmount],
  );

  useEffect(() => {
    if (!open) return;
    setMode("account");
    setAmount(remainingAmount > 0 ? formatAmountNumber(remainingAmount) : "");
    setShopAccountId("");
    setSelectedCheque(null);
    setCheques([]);
  }, [open, remainingAmount]);

  useEffect(() => {
    if (!open || mode !== "transfer") return;
    const token = tokenCode();
    if (!token) return;
    setLoadingCheques(true);
    FetchWithJwtClient("GET", buildAvailableChequesForTransferUrl(remainingAmount), token)
      .then((res) => setCheques(extractChequeList(res)))
      .finally(() => setLoadingCheques(false));
  }, [open, mode, remainingAmount]);

  const handleSubmit = async () => {
    if (!documentId) return;
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }

    if (mode === "transfer") {
      if (!selectedCheque?.id) {
        toast.error("چک دریافتی را انتخاب کنید");
        return;
      }
      const chequeAmount = parseAmount(selectedCheque.amount);
      if (chequeAmount - remainingAmount > 0.02) {
        toast.error("مبلغ چک بیشتر از مانده نسیه است");
        return;
      }
      setSaving(true);
      try {
        const body =
          kind === "invoice"
            ? { invoice_id: documentId }
            : { expense_id: documentId };
        const res = await FetchWithJwtClient("POST", `/api/cheques/${selectedCheque.id}/transfer`, body);
        if (!res || res.hasError) {
          toast.error(getApiErrorMessage(res, "خطا در ظهرنویسی چک"));
          return;
        }
        toast.success(typeof res.message === "string" ? res.message : "چک ظهرنویسی و بدهی تسویه شد");
        onClose();
        onSuccess();
      } catch {
        toast.error("خطا در ظهرنویسی چک");
      } finally {
        setSaving(false);
      }
      return;
    }

    const amountNum = Math.round(parseAmountInput(amount));
    if (amountNum <= 0) {
      toast.error("مبلغ تسویه را وارد کنید");
      return;
    }
    if (amountNum > remainingAmount) {
      toast.error(`مبلغ تسویه نمی‌تواند بیشتر از ${formatAmountNumber(remainingAmount)} تومان باشد`);
      return;
    }
    if (shopAccountId === "") {
      toast.error("حساب برداشت را انتخاب کنید");
      return;
    }
    setSaving(true);
    try {
      const path = kind === "invoice" ? `/api/invoices/${documentId}/settle` : `/api/expenses/${documentId}/settle`;
      const res = await FetchWithJwtClient("POST", path, {
        amount: amountNum,
        shop_account_id: shopAccountId,
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در تسویه"));
        return;
      }
      toast.success(res?.message || "تسویه ثبت شد");
      onClose();
      onSuccess();
    } catch {
      toast.error("خطا در تسویه");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "var(--admin-surface)",
          borderRadius: "12px",
          border: "1px solid var(--admin-border)",
        },
      }}
    >
      <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15 }}>
        تسویه نسیه
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "12px !important" }}>
        <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 14 }}>
          باقی‌مانده: {formatAmountNumber(remainingAmount)} تومان
        </Typography>

        <RadioGroup
          row
          value={mode}
          onChange={(e) => setMode(e.target.value as SettleMode)}
          sx={{ gap: 0.5 }}
        >
          <FormControlLabel
            value="account"
            control={
              <Radio
                size="small"
                sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }}
              />
            }
            label="از حساب"
            sx={{ m: 0, color: "var(--admin-text)", "& .MuiFormControlLabel-label": { fontSize: 12 } }}
          />
          <FormControlLabel
            value="transfer"
            control={
              <Radio
                size="small"
                sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }}
              />
            }
            label="ظهرنویسی چک دریافتی"
            sx={{ m: 0, color: "var(--admin-text)", "& .MuiFormControlLabel-label": { fontSize: 12 } }}
          />
        </RadioGroup>

        {mode === "account" ? (
          <>
            <TextField
              size="small"
              label="مبلغ تسویه"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
              sx={chequeFormFieldSx}
            />
            <ShopAccountSelect
              value={shopAccountId}
              onChange={setShopAccountId}
              required
              helperText="نقد تسویه از این حساب کم می‌شود"
            />
          </>
        ) : (
          <>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
              چک دریافتی نزد شما بدون برداشت از صندوق به بستانکار این سند منتقل می‌شود. مبلغ چک باید حداکثر برابر
              مانده نسیه باشد.
            </Typography>
            <Autocomplete
              size="small"
              options={eligibleCheques}
              loading={loadingCheques}
              value={selectedCheque}
              onChange={(_e, next) => setSelectedCheque(next)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              getOptionLabel={formatChequeOptionLabel}
              noOptionsText={loadingCheques ? "در حال بارگذاری..." : "چک دریافتی مناسبی نیست"}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="چک دریافتی"
                  sx={chequeFormFieldSx}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCheques ? <CircularProgress color="inherit" size={14} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 1.5 }}>
        <Button size="small" disabled={saving} onClick={onClose} sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
          انصراف
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={saving}
          onClick={() => void handleSubmit()}
          sx={{ backgroundColor: "var(--admin-accent)", fontSize: 12, "&:hover": { backgroundColor: "var(--admin-accent-hover)" } }}
        >
          {saving ? "..." : mode === "transfer" ? "ظهرنویسی و تسویه" : "تسویه"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
