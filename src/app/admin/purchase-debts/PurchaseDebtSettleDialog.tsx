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
  getDebtInvoiceOriginalAmount,
  getDebtInvoicePaidAmount,
  getDebtorDisplayName,
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

function paymentMethodLabel(card: number, cash: number): string {
  if (card > 0 && cash > 0) return "ترکیبی";
  if (card > 0) return "کارت";
  return "نقد";
}

export default function PurchaseDebtSettleDialog({
  open,
  invoice,
  onClose,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<SettlementMode>("cash");
  const [payAmount, setPayAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const remaining = invoice ? getDebtInvoiceAmount(invoice) : 0;
  const originalAmount = invoice ? getDebtInvoiceOriginalAmount(invoice) : 0;
  const paidAmount = invoice ? getDebtInvoicePaidAmount(invoice) : 0;
  const purchaseId = invoice?.purchase_id ?? invoice?.id;
  const customerName = invoice ? getDebtorDisplayName(invoice) : "";
  const previousPayments = invoice?.debt_payments ?? [];

  useEffect(() => {
    if (!open || !invoice) return;
    setMode("cash");
    setPayAmount(remaining > 0 ? formatAmountNumber(remaining) : "");
    setCardAmount("");
    setCashAmount(remaining > 0 ? formatAmountNumber(remaining) : "");
    setNote("");
  }, [open, invoice, remaining]);

  const applyModeAmounts = (nextMode: SettlementMode, amountText: string) => {
    const amount = parseAmountInput(amountText);
    if (nextMode === "cash") {
      setCashAmount(amount > 0 ? formatAmountNumber(amount) : "");
      setCardAmount("");
    } else if (nextMode === "card") {
      setCardAmount(amount > 0 ? formatAmountNumber(amount) : "");
      setCashAmount("");
    }
  };

  const handleSubmit = async () => {
    if (!purchaseId) return;

    const pay = parseAmountInput(payAmount);
    if (pay <= 0) {
      toast.error("مبلغ پرداخت را وارد کنید");
      return;
    }
    if (pay > remaining) {
      toast.error(`مبلغ پرداخت از مانده ${formatNumber(remaining)} تومان بیشتر است`);
      return;
    }

    let card = 0;
    let cash = 0;
    if (mode === "cash") {
      cash = pay;
    } else if (mode === "card") {
      card = pay;
    } else {
      card = parseAmountInput(cardAmount);
      cash = parseAmountInput(cashAmount);
      if (card + cash !== pay) {
        toast.error(`جمع کارت و نقد باید برابر ${formatNumber(pay)} تومان باشد`);
        return;
      }
    }

    const body: Record<string, unknown> = {
      amount: pay,
      card_amount: card,
      cash_amount: cash,
    };
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

      toast.success(res?.message || "پرداخت ثبت شد");
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
      <DialogTitle sx={{ color: "var(--admin-text)" }}>
        {remaining < originalAmount && remaining > 0 ? "پرداخت از مانده نسیه" : "تسویه فاکتور نسیه"}
      </DialogTitle>
      <DialogContent>
        {customerName ? (
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, mb: 0.5 }}>
            {customerName}
          </Typography>
        ) : null}
        {invoice?.phone ? (
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px", direction: "ltr", mb: 1.5 }}>
            {invoice.phone}
          </Typography>
        ) : null}

        <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: "18px" }}>
          مانده: {formatNumber(remaining)} تومان
        </Typography>
        {originalAmount > remaining || paidAmount > 0 ? (
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "13px", mb: 2 }}>
            مبلغ فاکتور {formatNumber(originalAmount)} تومان
            {paidAmount > 0 ? ` — تا الان ${formatNumber(paidAmount)} تومان پرداخت شده` : ""}
          </Typography>
        ) : (
          <Box sx={{ mb: 2 }} />
        )}

        {previousPayments.length > 0 ? (
          <Box sx={{ mb: 2, p: 1.25, borderRadius: "8px", bgcolor: "var(--admin-surface-alt)" }}>
            <Typography sx={{ fontSize: "12px", color: "var(--admin-text-muted)", mb: 0.75 }}>
              پرداخت‌های قبلی
            </Typography>
            {previousPayments.map((payment) => (
              <Typography key={payment.id ?? `${payment.paid_at}-${payment.amount}`} sx={{ fontSize: "12px", color: "var(--admin-text)" }}>
                {formatNumber(Number(payment.amount || 0))} تومان — {paymentMethodLabel(Number(payment.card_amount || 0), Number(payment.cash_amount || 0))}
                {payment.paid_at ? ` — ${payment.paid_at}` : ""}
              </Typography>
            ))}
          </Box>
        ) : null}

        <TextField
          label="مبلغ این پرداخت"
          value={payAmount}
          onChange={(e) => {
            const next = formatAmountInput(e.target.value);
            setPayAmount(next);
            applyModeAmounts(mode, next);
          }}
          fullWidth
          size="small"
          sx={{ ...inputSx, mb: 2 }}
          inputMode="numeric"
          helperText={`حداکثر ${formatNumber(remaining)} تومان`}
        />

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <RadioGroup
            value={mode}
            onChange={(e) => {
              const next = e.target.value as SettlementMode;
              setMode(next);
              applyModeAmounts(next, payAmount);
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
          {loading ? "…" : parseAmountInput(payAmount) > 0 && parseAmountInput(payAmount) < remaining ? "ثبت پرداخت" : "تسویه"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
