"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  const [amount, setAmount] = useState("");
  const [shopAccountId, setShopAccountId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(remainingAmount > 0 ? formatAmountNumber(remainingAmount) : "");
    setShopAccountId("");
  }, [open, remainingAmount]);

  const handleSubmit = async () => {
    if (!documentId) return;
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
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
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
          {saving ? "..." : "تسویه"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
