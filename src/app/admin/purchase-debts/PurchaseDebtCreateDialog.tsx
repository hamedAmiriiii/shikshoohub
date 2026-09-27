"use client";

import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { formatAmountInput, parseAmountInput } from "@/app/lib/amountInput";
import { isIranMobile, normalizeIranMobile } from "@/app/lib/purchaseReturns";
import { toast } from "react-toastify";

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

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (phone: string) => void;
};

export default function PurchaseDebtCreateDialog({ open, onClose, onSuccess }: Props) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhone("");
    setName("");
    setAmount("");
    setNote("");
    setLoading(false);
  }, [open]);

  const handleSave = async () => {
    const normalized = normalizeIranMobile(phone);
    const value = parseAmountInput(amount);
    if (!isIranMobile(normalized)) {
      toast.error("شماره موبایل را درست وارد کنید");
      return;
    }
    if (value < 1) {
      toast.error("مبلغ بدهی را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient("POST", "/api/purchase-debts", token, {}, {
        body: JSON.stringify({
          phone: normalized,
          amount: value,
          name: name.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ثبت بدهی"));
        return;
      }
      toast.success(res?.message || "بدهی ثبت شد و قابل تسویه است");
      onSuccess?.(normalized);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: "var(--admin-surface)",
          color: "var(--admin-text)",
          borderRadius: "12px",
          border: "1px solid var(--admin-border)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>ثبت بدهی مشتری</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5, pt: "8px !important" }}>
        <TextField
          label="شماره موبایل"
          value={phone}
          onChange={(e) => setPhone(normalizeIranMobile(e.target.value))}
          placeholder="09xxxxxxxxx"
          sx={inputSx}
        />
        <TextField label="نام مشتری" value={name} onChange={(e) => setName(e.target.value)} sx={inputSx} />
        <TextField
          label="مبلغ بدهی (تومان)"
          value={amount}
          onChange={(e) => setAmount(formatAmountInput(e.target.value))}
          inputMode="numeric"
          sx={inputSx}
        />
        <TextField
          label="شرح"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="بدهی دستی"
          sx={inputSx}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: "var(--admin-text-muted)" }}>
          انصراف
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ bgcolor: "var(--admin-accent)" }}>
          {loading ? "در حال ثبت…" : "ثبت و آماده تسویه"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
