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

type SettleMode = "account" | "transfer" | "advance";

type Props = {
  open: boolean;
  kind: DocumentPaymentKind;
  documentId: number | null;
  remainingAmount: number;
  /** اعتبار ظهرنویسی موجود برای ذینفع این سند */
  advanceAvailable?: number;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DocumentPaymentSettleDialog({
  open,
  kind,
  documentId,
  remainingAmount,
  advanceAvailable = 0,
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
  const [fetchedAdvance, setFetchedAdvance] = useState(0);

  const advanceBalance = fetchedAdvance > 0.02 ? fetchedAdvance : advanceAvailable;

  const eligibleCheques = useMemo(
    () => cheques.filter((c) => parseAmount(c.amount) > 0),
    [cheques],
  );

  const selectedChequeAmount = selectedCheque ? parseAmount(selectedCheque.amount) : 0;
  const transferExcess =
    mode === "transfer" && selectedChequeAmount > remainingAmount + 0.02
      ? Math.round(selectedChequeAmount - remainingAmount)
      : 0;

  useEffect(() => {
    if (!open) return;
    setAmount(remainingAmount > 0 ? formatAmountNumber(remainingAmount) : "");
    setShopAccountId("");
    setSelectedCheque(null);
    setCheques([]);
    setFetchedAdvance(0);
  }, [open, remainingAmount]);

  useEffect(() => {
    if (!open || !documentId) return;
    const token = tokenCode();
    if (!token) return;
    const path = kind === "invoice" ? `/api/invoices/${documentId}` : `/api/expenses/${documentId}`;
    FetchWithJwtClient("GET", path, token).then((res) => {
      if (!res || res.hasError) return;
      const doc = (res.data ?? res.invoice ?? res.expense ?? res) as {
        beneficiary_advance_available?: number | string;
      };
      const avail = Number(doc?.beneficiary_advance_available) || 0;
      setFetchedAdvance(avail);
      setMode(avail > 0.02 ? "advance" : "account");
    });
  }, [open, documentId, kind]);

  useEffect(() => {
    if (!open || mode !== "transfer") return;
    const token = tokenCode();
    if (!token) return;
    setLoadingCheques(true);
    // بدون سقف مبلغ — چک بزرگ‌تر از بدهی هم مجاز است (مابقی = اعتبار)
    FetchWithJwtClient("GET", buildAvailableChequesForTransferUrl(), token)
      .then((res) => setCheques(extractChequeList(res)))
      .finally(() => setLoadingCheques(false));
  }, [open, mode]);

  const handleSubmit = async () => {
    if (!documentId) return;
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }

    if (mode === "advance") {
      const amountNum = Math.round(parseAmountInput(amount));
      if (amountNum <= 0) {
        toast.error("مبلغ مصرف اعتبار را وارد کنید");
        return;
      }
      if (amountNum > remainingAmount) {
        toast.error(`مبلغ نمی‌تواند بیشتر از ${formatAmountNumber(remainingAmount)} تومان باشد`);
        return;
      }
      if (amountNum > advanceBalance) {
        toast.error(`اعتبار موجود ${formatAmountNumber(advanceBalance)} تومان است`);
        return;
      }
      setSaving(true);
      try {
        const path =
          kind === "invoice"
            ? `/api/invoices/${documentId}/apply-advance`
            : `/api/expenses/${documentId}/apply-advance`;
        const res = await FetchWithJwtClient("POST", path, { amount: amountNum });
        if (!res || res.hasError) {
          toast.error(getApiErrorMessage(res, "خطا در مصرف اعتبار"));
          return;
        }
        toast.success(typeof res.message === "string" ? res.message : "اعتبار مصرف شد");
        onClose();
        onSuccess();
      } catch {
        toast.error("خطا در مصرف اعتبار");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (mode === "transfer") {
      if (!selectedCheque?.id) {
        toast.error("چک دریافتی را انتخاب کنید");
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
        {advanceBalance > 0.02 ? (
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
            اعتبار ظهرنویسی ذینفع: {formatAmountNumber(advanceBalance)} تومان
          </Typography>
        ) : null}

        <RadioGroup
          row
          value={mode}
          onChange={(e) => setMode(e.target.value as SettleMode)}
          sx={{ gap: 0.5, flexWrap: "wrap" }}
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
            label="ظهرنویسی چک"
            sx={{ m: 0, color: "var(--admin-text)", "& .MuiFormControlLabel-label": { fontSize: 12 } }}
          />
          {advanceBalance > 0.02 ? (
            <FormControlLabel
              value="advance"
              control={
                <Radio
                  size="small"
                  sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }}
                />
              }
              label="از اعتبار ظهرنویسی"
              sx={{ m: 0, color: "var(--admin-text)", "& .MuiFormControlLabel-label": { fontSize: 12 } }}
            />
          ) : null}
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
        ) : null}

        {mode === "advance" ? (
          <>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
              از اعتبار قبلی ظهرنویسی همین ذینفع روی بدهی این سند مصرف می‌شود — بدون حرکت صندوق.
            </Typography>
            <TextField
              size="small"
              label="مبلغ مصرف اعتبار"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
              sx={chequeFormFieldSx}
            />
          </>
        ) : null}

        {mode === "transfer" ? (
          <>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
              چک دریافتی بدون برداشت از صندوق منتقل می‌شود. اگر مبلغ چک بیشتر از بدهی باشد، مابقی اعتبار
              ذینفع می‌شود.
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
            {transferExcess > 0 ? (
              <Typography sx={{ color: "var(--admin-accent)", fontSize: 12, fontWeight: 700 }}>
                مابقی {formatAmountNumber(transferExcess)} تومان → اعتبار ذینفع
              </Typography>
            ) : null}
          </>
        ) : null}
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
          {saving
            ? "..."
            : mode === "transfer"
              ? "ظهرنویسی و تسویه"
              : mode === "advance"
                ? "مصرف اعتبار"
                : "تسویه"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
