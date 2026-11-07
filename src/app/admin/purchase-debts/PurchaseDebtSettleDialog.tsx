"use client";

import { useEffect, useMemo, useState } from "react";
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
  getDebtInvoiceId,
  getDebtInvoiceOriginalAmount,
  getDebtInvoicePaidAmount,
  getDebtorDisplayName,
  type PurchaseDebtInvoice,
} from "@/app/lib/purchaseDebts";
import { toast } from "react-toastify";
import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";

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
  invoices: PurchaseDebtInvoice[];
  onClose: () => void;
  onSuccess?: () => void;
};

function paymentMethodLabel(card: number, cash: number): string {
  if (card > 0 && cash > 0) return "ترکیبی";
  if (card > 0) return "کارت";
  return "نقد";
}

function purchaseIdOf(invoice: PurchaseDebtInvoice): number {
  return Number(invoice.purchase_id ?? invoice.id);
}

/** تقسیم کارت/نقد بین چند فاکتور به‌تناسب مانده؛ فاکتور آخر باقیمانده را می‌گیرد. */
function allocateSplitAmounts(
  remainings: number[],
  totalCard: number,
  totalCash: number,
): Array<{ card: number; cash: number }> {
  const total = remainings.reduce((sum, value) => sum + value, 0);
  if (total <= 0 || remainings.length === 0) return [];

  let usedCard = 0;
  let usedCash = 0;
  return remainings.map((remaining, index) => {
    if (index === remainings.length - 1) {
      return {
        card: Math.max(0, totalCard - usedCard),
        cash: Math.max(0, totalCash - usedCash),
      };
    }
    const card = Math.min(remaining, Math.max(0, Math.round((totalCard * remaining) / total)));
    const cash = Math.max(0, remaining - card);
    usedCard += card;
    usedCash += cash;
    return { card, cash };
  });
}

export default function PurchaseDebtSettleDialog({
  open,
  invoices,
  onClose,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<SettlementMode>("cash");
  const [payAmount, setPayAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [lastSplitEdited, setLastSplitEdited] = useState<"card" | "cash">("card");

  const isBulk = invoices.length > 1;
  const invoice = invoices[0] ?? null;
  const totalRemaining = useMemo(
    () => invoices.reduce((sum, row) => sum + getDebtInvoiceAmount(row), 0),
    [invoices],
  );
  const remaining = isBulk ? totalRemaining : invoice ? getDebtInvoiceAmount(invoice) : 0;
  const originalAmount = !isBulk && invoice ? getDebtInvoiceOriginalAmount(invoice) : 0;
  const paidAmount = !isBulk && invoice ? getDebtInvoicePaidAmount(invoice) : 0;
  const customerName = invoice ? getDebtorDisplayName(invoice) : "";
  const previousPayments = !isBulk && invoice ? invoice.debt_payments ?? [] : [];
  const payValue = parseAmountInput(payAmount);

  useEffect(() => {
    if (!open || invoices.length === 0) return;
    setMode("cash");
    setPayAmount(remaining > 0 ? formatAmountNumber(remaining) : "");
    setCardAmount("");
    setCashAmount(remaining > 0 ? formatAmountNumber(remaining) : "");
    setNote("");
    setAccountId("");
    setLastSplitEdited("card");
  }, [open, invoices, remaining]);

  const applyModeAmounts = (nextMode: SettlementMode, amountText: string) => {
    const amount = parseAmountInput(amountText);
    if (nextMode === "cash") {
      setCashAmount(amount > 0 ? formatAmountNumber(amount) : "");
      setCardAmount("");
    } else if (nextMode === "card") {
      setCardAmount(amount > 0 ? formatAmountNumber(amount) : "");
      setCashAmount("");
    } else if (amount > 0) {
      setCardAmount(formatAmountNumber(amount));
      setCashAmount(formatAmountNumber(0));
      setLastSplitEdited("card");
    } else {
      setCardAmount("");
      setCashAmount("");
    }
  };

  const syncSplitFromCard = (nextCardText: string) => {
    const pay = parseAmountInput(payAmount);
    const card = parseAmountInput(nextCardText);
    setCardAmount(nextCardText);
    setLastSplitEdited("card");
    const cash = Math.max(0, pay - card);
    setCashAmount(pay > 0 ? formatAmountNumber(cash) : "");
  };

  const syncSplitFromCash = (nextCashText: string) => {
    const pay = parseAmountInput(payAmount);
    const cash = parseAmountInput(nextCashText);
    setCashAmount(nextCashText);
    setLastSplitEdited("cash");
    const card = Math.max(0, pay - cash);
    setCardAmount(pay > 0 ? formatAmountNumber(card) : "");
  };

  const handlePayAmountChange = (next: string) => {
    setPayAmount(next);
    if (mode === "split") {
      const pay = parseAmountInput(next);
      if (lastSplitEdited === "card") {
        const card = Math.min(parseAmountInput(cardAmount), pay);
        setCardAmount(pay > 0 ? formatAmountNumber(card) : "");
        setCashAmount(pay > 0 ? formatAmountNumber(Math.max(0, pay - card)) : "");
      } else {
        const cash = Math.min(parseAmountInput(cashAmount), pay);
        setCashAmount(pay > 0 ? formatAmountNumber(cash) : "");
        setCardAmount(pay > 0 ? formatAmountNumber(Math.max(0, pay - cash)) : "");
      }
      return;
    }
    applyModeAmounts(mode, next);
  };

  const settleOne = async (
    target: PurchaseDebtInvoice,
    amount: number,
    card: number,
    cash: number,
    sharedNote: string,
  ) => {
    const purchaseId = purchaseIdOf(target);
    const body: Record<string, unknown> = {
      amount,
      card_amount: card,
      cash_amount: cash,
      shop_account_id: accountId,
    };
    if (sharedNote) body.note = sharedNote;

    const token = tokenCode();
    return FetchWithJwtClient(
      "POST",
      `/api/purchase-debts/${purchaseId}/settle`,
      token,
      {},
      { body: JSON.stringify(body) },
    );
  };

  const handleSubmit = async () => {
    if (invoices.length === 0) return;

    const pay = parseAmountInput(payAmount);
    if (pay <= 0) {
      toast.error("مبلغ پرداخت را وارد کنید");
      return;
    }
    if (pay > remaining) {
      toast.error(`مبلغ پرداخت از مانده ${formatNumber(remaining)} تومان بیشتر است`);
      return;
    }
    if (isBulk && Math.abs(pay - remaining) > 0.02) {
      toast.error("برای تسویه چند فاکتور، مبلغ باید برابر جمع مانده‌ها باشد");
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

    if (accountId === "") {
      toast.error("حساب مقصد وصول را انتخاب کنید");
      return;
    }

    const sharedNote = note.trim();
    setLoading(true);
    try {
      if (!isBulk) {
        const res = await settleOne(invoices[0], pay, card, cash, sharedNote);
        if (res?.hasError) {
          toast.error(getApiErrorMessage(res, "خطا در تسویه"));
          return;
        }
        toast.success(res?.message || "پرداخت ثبت شد");
        onClose();
        onSuccess?.();
        return;
      }

      const remainings = invoices.map((row) => getDebtInvoiceAmount(row));
      const splits =
        mode === "split"
          ? allocateSplitAmounts(remainings, card, cash)
          : remainings.map((value) =>
              mode === "card" ? { card: value, cash: 0 } : { card: 0, cash: value },
            );

      let successCount = 0;
      for (let index = 0; index < invoices.length; index += 1) {
        const target = invoices[index];
        const amount = remainings[index];
        const part = splits[index] ?? { card: 0, cash: amount };
        const res = await settleOne(target, amount, part.card, part.cash, sharedNote);
        if (res?.hasError) {
          toast.error(
            getApiErrorMessage(
              res,
              `خطا در تسویه فاکتور #${getDebtInvoiceId(target)}${successCount > 0 ? ` (بعد از ${successCount} مورد موفق)` : ""}`,
            ),
          );
          onSuccess?.();
          return;
        }
        successCount += 1;
      }

      toast.success(`${formatNumber(successCount)} فاکتور با موفقیت تسویه شد`);
      onClose();
      onSuccess?.();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: "var(--admin-surface)",
        },
      }}
    >
      <DialogTitle sx={{ color: "var(--admin-text)", pb: 1, fontWeight: 700 }}>
        {isBulk
          ? `تسویه ${formatNumber(invoices.length)} فاکتور نسیه`
          : remaining < originalAmount && remaining > 0
            ? "پرداخت از مانده نسیه"
            : "تسویه فاکتور نسیه"}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1fr" },
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid var(--admin-border)",
              bgcolor: "var(--admin-surface-alt)",
            }}
          >
            {customerName ? (
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, mb: 0.25 }}>
                {customerName}
              </Typography>
            ) : null}
            {invoice?.phone ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, direction: "ltr" }}>
                {invoice.phone}
              </Typography>
            ) : null}
            {isBulk ? (
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12, mt: 0.75 }}>
                {formatNumber(invoices.length)} فاکتور انتخاب‌شده
              </Typography>
            ) : null}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid var(--admin-border)",
              bgcolor: "var(--admin-surface-alt)",
              textAlign: { xs: "right", sm: "center" },
            }}
          >
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
              {isBulk ? "جمع مانده" : "مانده"}
            </Typography>
            <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: 20 }}>
              {formatNumber(remaining)} تومان
            </Typography>
            {!isBulk && (originalAmount > remaining || paidAmount > 0) ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.5 }}>
                اصل {formatNumber(originalAmount)}
                {paidAmount > 0 ? ` — پرداخت‌شده ${formatNumber(paidAmount)}` : ""}
              </Typography>
            ) : null}
          </Box>
        </Box>

        {isBulk ? (
          <Box
            sx={{
              mb: 2,
              maxHeight: 120,
              overflowY: "auto",
              borderRadius: 2,
              border: "1px solid var(--admin-border)",
            }}
          >
            {invoices.map((row) => {
              const id = getDebtInvoiceId(row);
              const rowRemaining = getDebtInvoiceAmount(row);
              return (
                <Box
                  key={id}
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    borderBottom: "1px solid var(--admin-border)",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>فاکتور #{id}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-accent)" }}>
                    {formatNumber(rowRemaining)} تومان
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ) : null}

        {previousPayments.length > 0 ? (
          <Box sx={{ mb: 2, p: 1.25, borderRadius: 2, bgcolor: "var(--admin-surface-alt)" }}>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>
              پرداخت‌های قبلی
            </Typography>
            <Box sx={{ maxHeight: 72, overflowY: "auto" }}>
              {previousPayments.map((payment) => (
                <Typography
                  key={payment.id ?? `${payment.paid_at}-${payment.amount}`}
                  sx={{ fontSize: 12, color: "var(--admin-text)" }}
                >
                  {formatNumber(Number(payment.amount || 0))} تومان —{" "}
                  {paymentMethodLabel(Number(payment.card_amount || 0), Number(payment.cash_amount || 0))}
                  {payment.shop_account_name ? ` — ${payment.shop_account_name}` : ""}
                  {payment.paid_at ? ` — ${payment.paid_at}` : ""}
                </Typography>
              ))}
            </Box>
          </Box>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: isBulk ? "1fr" : "1fr 1fr" },
            gap: 1.5,
            mb: 1.5,
            alignItems: "start",
          }}
        >
          <TextField
            label={isBulk ? "مبلغ کل پرداخت" : "مبلغ این پرداخت"}
            value={payAmount}
            onChange={(e) => handlePayAmountChange(formatAmountInput(e.target.value))}
            fullWidth
            size="small"
            sx={inputSx}
            inputMode="numeric"
            disabled={isBulk}
            helperText={
              isBulk
                ? "برای چند فاکتور، کل مانده به‌صورت کامل تسویه می‌شود"
                : `حداکثر ${formatNumber(remaining)} تومان`
            }
          />

          <FormControl component="fieldset" sx={{ m: 0 }}>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>
              نوع پرداخت
            </Typography>
            <RadioGroup
              row
              value={mode}
              onChange={(e) => {
                const next = e.target.value as SettlementMode;
                setMode(next);
                applyModeAmounts(next, payAmount);
              }}
              sx={{ flexWrap: "nowrap", gap: { xs: 0, sm: 1 } }}
            >
              <FormControlLabel value="cash" control={<Radio size="small" />} label="نقد" sx={{ mr: 1 }} />
              <FormControlLabel value="card" control={<Radio size="small" />} label="کارت" sx={{ mr: 1 }} />
              <FormControlLabel value="split" control={<Radio size="small" />} label="ترکیبی" />
            </RadioGroup>
          </FormControl>
        </Box>

        {mode === "split" && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <TextField
              label="مبلغ کارت"
              value={cardAmount}
              onChange={(e) => syncSplitFromCard(formatAmountInput(e.target.value))}
              fullWidth
              size="small"
              sx={inputSx}
              inputMode="numeric"
            />
            <TextField
              label="مبلغ نقد"
              value={cashAmount}
              onChange={(e) => syncSplitFromCash(formatAmountInput(e.target.value))}
              fullWidth
              size="small"
              sx={inputSx}
              inputMode="numeric"
            />
          </Box>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <ShopAccountSelect
            value={accountId}
            onChange={setAccountId}
            required
            label="حساب مقصد"
            helperText="بعد از تطبیق روزانه به این حساب واریز می‌شود"
          />
          <TextField
            label="یادداشت (اختیاری)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={3}
            size="small"
            sx={inputSx}
            helperText={isBulk ? "همین یادداشت برای همه فاکتورها ثبت می‌شود" : undefined}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          انصراف
        </Button>
        <Button
          variant="contained"
          disabled={loading || accountId === ""}
          onClick={handleSubmit}
          sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
        >
          {loading
            ? "…"
            : isBulk
              ? `تسویه ${formatNumber(invoices.length)} فاکتور`
              : payValue > 0 && payValue < remaining
                ? "ثبت پرداخت"
                : "تسویه"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
