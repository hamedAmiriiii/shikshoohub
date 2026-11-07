"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";
import {
  canSettleDocumentPayment,
  documentCreditRemaining,
  type DocumentPaymentFields,
} from "@/app/lib/documentPayments";
import type { BeneficiaryDoc } from "@/app/lib/beneficiaries";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";

type UnpaidInvoice = BeneficiaryDoc & DocumentPaymentFields;

type Allocation = {
  id: number;
  title: string;
  date: string;
  remaining: number;
  pay: number;
};

type Props = {
  open: boolean;
  invoices: UnpaidInvoice[];
  unpaidTotal: number;
  onClose: () => void;
  onSuccess: () => void;
};

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

function invoiceSortKey(doc: UnpaidInvoice): string {
  const date = String(doc.date || doc.created_at || "");
  const id = String(doc.id).padStart(12, "0");
  return `${date}|${id}`;
}

export function allocateBulkDebtPayment(invoices: UnpaidInvoice[], amount: number): Allocation[] {
  const budget = Math.max(0, Math.round(amount || 0));
  if (budget <= 0) return [];

  const sorted = [...invoices]
    .filter((row) => canSettleDocumentPayment(row))
    .sort((a, b) => invoiceSortKey(a).localeCompare(invoiceSortKey(b)));

  let left = budget;
  const rows: Allocation[] = [];
  for (const invoice of sorted) {
    if (left <= 0) break;
    const remaining = Math.round(documentCreditRemaining(invoice));
    if (remaining <= 0) continue;
    const pay = Math.min(remaining, left);
    if (pay <= 0) continue;
    rows.push({
      id: Number(invoice.id),
      title: String(invoice.title || "").trim() || "بدون عنوان",
      date: String(invoice.date || invoice.created_at || "—"),
      remaining,
      pay,
    });
    left -= pay;
  }
  return rows;
}

export default function BeneficiaryBulkDebtPayDialog({
  open,
  invoices,
  unpaidTotal,
  onClose,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setAccountId("");
  }, [open]);

  const amountNum = Math.round(parseAmountInput(amount));
  const allocations = useMemo(
    () => allocateBulkDebtPayment(invoices, amountNum),
    [invoices, amountNum],
  );
  const allocatedTotal = allocations.reduce((sum, row) => sum + row.pay, 0);
  const leftover = Math.max(0, amountNum - allocatedTotal);
  const invoiceNumbers = allocations.map((row) => `#${row.id}`);

  const handleSubmit = async () => {
    if (allocations.length === 0) {
      toast.error("با این مبلغ فاکتوری برای پرداخت پیدا نشد");
      return;
    }
    if (accountId === "") {
      toast.error("حساب برداشت را انتخاب کنید");
      return;
    }
    if (amountNum > unpaidTotal + 0.02) {
      toast.error(`مبلغ بیشتر از بدهی ${formatAmountNumber(unpaidTotal)} تومان است`);
      return;
    }

    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      for (const row of allocations) {
        const res = await FetchWithJwtClient("POST", `/api/invoices/${row.id}/settle`, {
          amount: row.pay,
          shop_account_id: accountId,
        });
        if (!res || res.hasError) {
          toast.error(
            getApiErrorMessage(
              res,
              `خطا در پرداخت فاکتور #${row.id}${successCount > 0 ? ` (بعد از ${successCount} مورد موفق)` : ""}`,
            ),
          );
          if (successCount > 0) onSuccess();
          return;
        }
        successCount += 1;
      }
      toast.success(
        `${formatAmountNumber(successCount)} فاکتور به جمع ${formatAmountNumber(allocatedTotal)} تومان پرداخت شد`,
      );
      onClose();
      onSuccess();
    } catch {
      toast.error("خطا در ارتباط با سرور");
      if (successCount > 0) onSuccess();
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
      PaperProps={{ sx: { borderRadius: 3, bgcolor: "var(--admin-surface)" } }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: "var(--admin-text)", pb: 1 }}>
        پرداخت بدهی جمعی
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", mb: 1.5 }}>
          مبلغ را وارد کنید؛ از فاکتورهای قدیمی به جدید تا همان مبلغ پرداخت می‌شود.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <TextField
            label="مبلغ پرداخت"
            value={amount}
            onChange={(e) => setAmount(formatAmountInput(e.target.value))}
            fullWidth
            size="small"
            sx={inputSx}
            inputMode="numeric"
            helperText={`بدهی قابل پرداخت فاکتورها تا ${formatAmountNumber(unpaidTotal)} تومان`}
          />
          <ShopAccountSelect
            value={accountId}
            onChange={setAccountId}
            required
            label="حساب برداشت"
            helperText="مبلغ از این حساب کسر می‌شود"
          />
        </Box>

        {amountNum > 0 ? (
          <Box
            sx={{
              mb: 1.5,
              p: 1.25,
              borderRadius: 2,
              border: "1px solid var(--admin-border)",
              bgcolor: "var(--admin-surface-alt)",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", mb: 0.5 }}>
              فاکتورهای انتخابی
            </Typography>
            {allocations.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                فاکتور نسیه‌ای برای این مبلغ پیدا نشد
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: 13, color: "var(--admin-accent)", fontWeight: 700, mb: 0.75 }}>
                  {invoiceNumbers.join("، ")}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "var(--admin-text-secondary)", mb: 1 }}>
                  جمع تخصیص: {formatAmountNumber(allocatedTotal)} تومان
                  {leftover > 0 ? ` — باقیمانده مبلغ بدون فاکتور: ${formatAmountNumber(leftover)}` : ""}
                </Typography>
                <TableContainer sx={{ maxHeight: 220 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ fontSize: 12, fontWeight: 700 }}>
                          فاکتور
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 12, fontWeight: 700 }}>
                          عنوان
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 12, fontWeight: 700 }}>
                          مانده
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 12, fontWeight: 700 }}>
                          پرداخت
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allocations.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell align="center" sx={{ fontSize: 12 }}>
                            #{row.id}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 12 }}>
                            {row.title}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 12 }}>
                            {formatAmountNumber(row.remaining)}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-accent)" }}>
                            {formatAmountNumber(row.pay)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
            بعد از وارد کردن مبلغ، شماره فاکتورهای انتخابی اینجا نشان داده می‌شود.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          انصراف
        </Button>
        <Button
          variant="contained"
          disabled={loading || allocations.length === 0 || accountId === ""}
          onClick={handleSubmit}
          sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
        >
          {loading ? "در حال پرداخت..." : `پرداخت ${formatAmountNumber(allocatedTotal)} تومان`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
