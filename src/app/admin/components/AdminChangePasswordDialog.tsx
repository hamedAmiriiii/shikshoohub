"use client";

import { useState } from "react";
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

type Props = {
  open: boolean;
  onClose: () => void;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-input-bg, var(--admin-surface-alt))",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiInputBase-input": { color: "var(--admin-text)" },
};

export default function AdminChangePasswordDialog({ open, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!currentPassword.trim()) {
      toast.error("رمز فعلی را وارد کنید");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("رمز جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("رمز جدید و تکرار آن یکسان نیست");
      return;
    }

    setSaving(true);
    try {
      const res = await FetchWithJwtClient("POST", "/api/atelier/profile/reset-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_confirm_password: confirmPassword,
      });

      if (res?.hasError) {
        const message =
          (typeof res.message === "string" && res.message) ||
          (typeof res.error === "string" && res.error) ||
          "تغییر رمز ناموفق بود";
        toast.error(message);
        return;
      }

      toast.success("رمز عبور با موفقیت تغییر کرد");
      resetForm();
      onClose();
    } catch {
      toast.error("خطا در اتصال به سرور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: "var(--admin-surface)",
          color: "var(--admin-text)",
          direction: "rtl",
          borderRadius: 2,
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle sx={{ fontSize: 16, fontWeight: 700, pb: 0.5 }}>تغییر رمز عبور</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.25, pt: "12px !important" }}>
        <Typography sx={{ fontSize: 12, color: "var(--admin-text-secondary)", mb: 0.5 }}>
          رمز فعلی و رمز جدید را وارد کنید.
        </Typography>
        <TextField
          size="small"
          type="password"
          label="رمز فعلی"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          sx={fieldSx}
        />
        <TextField
          size="small"
          type="password"
          label="رمز جدید"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          sx={fieldSx}
        />
        <TextField
          size="small"
          type="password"
          label="تکرار رمز جدید"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          sx={fieldSx}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={saving} sx={{ color: "var(--admin-text-secondary)" }}>
          انصراف
        </Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={() => void handleSubmit()}
          sx={{
            bgcolor: "var(--admin-accent)",
            color: "#fff",
            minWidth: 96,
            "&:hover": { bgcolor: "var(--admin-accent-hover, var(--admin-accent))" },
          }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : "ذخیره"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
