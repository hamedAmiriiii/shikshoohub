"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  getDebtInvoiceAmount,
  type PurchaseDebtInvoice,
} from "@/app/lib/purchaseDebts";
import { toast } from "react-toastify";
import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    backgroundColor: "var(--admin-surface-alt)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

type SettlementMode = "cash" | "card" | "split";

type Props = {
  open: boolean;
  invoice: PurchaseDebtInvoice | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function PurchaseDebtSettleDialog({
  open,
  invoice,
  onClose,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<SettlementMode>("cash");
  const [cardAmount, setCardAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const debtAmount = invoice ? getDebtInvoiceAmount(invoice) : 0;
  const purchaseId = invoice?.purchase_id ?? invoice?.id;

  useEffect(() => {
    if (!open || !invoice) return;
    setMode("cash");
    setCardAmount("");
    setCashAmount(debtAmount > 0 ? formatAmountNumber(debtAmount) : "");
    setNote("");
  }, [open, invoice, debtAmount]);

  const handleSubmit = async () => {
    if (!purchaseId) return;

    let body: Record<string, unknown> = {};
    if (mode === "cash") {
      body = { payment_settlement: "cash" };
    } else if (mode === "card") {
      body = { payment_settlement: "card" };
    } else {
      const card = parseAmountInput(cardAmount);
      const cash = parseAmountInput(cashAmount);
      if (card + cash !== debtAmount) {
        toast.error(`جمع کارت و نقد باید برابر ${formatNumber(debtAmount)} تومان باشد`);
        return;
      }
      body = { card_amount: card, cash_amount: cash };
    }

    if (note.trim()) body.note = note.trim();

    setLoading(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "POST",
        `/api/purchase-debts/${purchaseId}/settle`,
        token,
        {},
        { body: JSON.stringify(body) },
      );

      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در تسویه"));
        return;
      }

      toast.success(res?.message || "فاکتور با موفقیت تسویه شد");
      onClose();
      onSuccess?.();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: "var(--admin-text)" }}>تسویه فاکتور نسیه</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: "18px", mb: 2 }}>
          مبلغ بدهی: {formatNumber(debtAmount)} تومان
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <RadioGroup
            value={mode}
            onChange={(e) => {
              const next = e.target.value as SettlementMode;
              setMode(next);
              if (next === "cash") {
                setCashAmount(debtAmount > 0 ? formatAmountNumber(debtAmount) : "");
                setCardAmount("");
              } else if (next === "card") {
                setCardAmount(debtAmount > 0 ? formatAmountNumber(debtAmount) : "");
                setCashAmount("");
              }
            }}
          >
            <FormControlLabel value="cash" control={<Radio size="small" />} label="نقد" />
            <FormControlLabel value="card" control={<Radio size="small" />} label="کارت" />
            <FormControlLabel value="split" control={<Radio size="small" />} label="ترکیبی" />
          </RadioGroup>
        </FormControl>

        {mode === "split" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
            <TextField
              label="مبلغ کارت"
              value={cardAmount}
              onChange={(e) => setCardAmount(formatAmountInput(e.target.value))}
              fullWidth
              size="small"
              sx={inputSx}
              inputMode="numeric"
            />
            <TextField
              label="مبلغ نقد"
              value={cashAmount}
              onChange={(e) => setCashAmount(formatAmountInput(e.target.value))}
              fullWidth
              size="small"
              sx={inputSx}
              inputMode="numeric"
            />
          </Box>
        )}

        <TextField
          label="یادداشت (اختیاری)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          size="small"
          sx={inputSx}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          انصراف
        </Button>
        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSubmit}
          sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
        >
          {loading ? "…" : "تسویه"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
