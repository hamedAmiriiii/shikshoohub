"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

type PayrollConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: "primary" | "error" | "success" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function PayrollConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "تأیید",
  confirmColor = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: PayrollConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => !loading && onCancel()}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          backgroundColor: "var(--admin-surface)",
          borderRadius: "16px",
          border: "1px solid var(--admin-border)",
        },
      }}
    >
      <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: "var(--admin-text-secondary)", fontSize: 14 }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} sx={{ color: "var(--admin-text-muted)" }}>
          انصراف
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
