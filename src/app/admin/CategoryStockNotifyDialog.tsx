"use client";

import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

type Props = {
  open: boolean;
  categoryId: string | number | null;
  categoryName?: string;
  onClose: () => void;
};

export default function CategoryStockNotifyDialog({
  open,
  categoryId,
  categoryName,
  onClose,
}: Props) {
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone("");
      setNote("");
    }
  }, [open, categoryId]);

  const submit = async () => {
    const trimmed = phone.trim();
    if (!/^09\d{9}$/.test(trimmed)) {
      toast.error("شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد");
      return;
    }
    const catId = Number(categoryId);
    if (!Number.isFinite(catId) || catId <= 0) {
      toast.error("دسته‌بندی معتبر نیست");
      return;
    }
    setSaving(true);
    try {
      const res = await FetchWithJwtClient("POST", "/api/category-stock-notify", tokenCode(), {}, {
        body: JSON.stringify({
          category_id: catId,
          phone: trimmed,
          note: note.trim() || null,
        }),
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت اعلان ناموفق بود"));
        return;
      }
      toast.success(
        typeof res.message === "string" ? res.message : "شماره در لیست خبر دسته ثبت شد",
      );
      onClose();
    } catch {
      toast.error("خطا در ثبت اعلان");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      disableScrollLock
      open={open}
      onClose={() => {
        if (saving) return;
        onClose();
      }}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: "var(--admin-surface)",
          color: "var(--admin-text)",
          borderRadius: "16px",
          direction: "rtl",
        },
      }}
    >
      <DialogTitle sx={{ fontSize: 16 }}>موجود شد خبر بده</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1.5 }}>
          دسته: {categoryName || "—"}
          <br />
          با اضافه شدن کالای جدید یا موجود شدن کالای تمام‌شده در این دسته، پیامک می‌رود.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="شماره موبایل مشتری"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          inputMode="tel"
          inputProps={{ style: { direction: "ltr", textAlign: "left" }, placeholder: "09xxxxxxxxx" }}
          InputLabelProps={{ sx: { color: "var(--admin-text-muted)" } }}
          sx={{
            mt: 0.5,
            mb: 1.5,
            "& .MuiOutlinedInput-root": {
              color: "var(--admin-text)",
              "& fieldset": { borderColor: "var(--admin-border)" },
            },
          }}
        />
        <TextField
          fullWidth
          label="یادداشت (اختیاری)"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 255))}
          InputLabelProps={{ sx: { color: "var(--admin-text-muted)" } }}
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "var(--admin-text)",
              "& fieldset": { borderColor: "var(--admin-border)" },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "var(--admin-text)" }}>
          انصراف
        </Button>
        <Button
          variant="contained"
          onClick={() => void submit()}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          ثبت
        </Button>
      </DialogActions>
    </Dialog>
  );
}
