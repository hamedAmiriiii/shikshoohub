"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  formatConsultationDate,
  formatConsultationSource,
  formatConsultationStatus,
  getConsultationCityName,
  getConsultationStateName,
  getConsultationStatusColor,
  type ConsultationRequest,
  type SelectOption,
} from "@/app/lib/consultationRequests";

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
  item: ConsultationRequest;
  statuses: SelectOption[];
  onSuccess?: () => void;
  variant?: "row" | "card";
};

export function ConsultationStatusChip({ status }: { status?: string }) {
  return (
    <Chip
      size="small"
      label={formatConsultationStatus(status)}
      color={getConsultationStatusColor(status)}
      sx={{ fontWeight: 600, fontSize: "12px" }}
    />
  );
}

export function ConsultationMobileCard({
  data,
  statuses,
  onSuccess,
}: {
  data: ConsultationRequest;
  statuses: SelectOption[];
  onSuccess?: () => void;
}) {
  return (
    <Box
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: "12px",
        border: "1px solid var(--admin-border)",
        bgcolor: "var(--admin-surface)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Typography sx={{ fontWeight: 700, color: "var(--admin-text)", fontSize: "15px" }}>
          {data.name || "—"}
        </Typography>
        <ConsultationStatusChip status={data.status} />
      </Box>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}>
        {data.business_name || "—"}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }} dir="ltr">
        {data.phone || "—"}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}>
        {getConsultationStateName(data)} / {getConsultationCityName(data)}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mb: 0.5 }}>
        {formatConsultationSource(data.source, data.source_label)}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mb: 1.5 }}>
        {formatConsultationDate(data.created_at)}
      </Typography>
      <ConsultationRequestActions item={data} statuses={statuses} onSuccess={onSuccess} variant="card" />
    </Box>
  );
}

export default function ConsultationRequestActions({
  item,
  statuses,
  onSuccess,
  variant = "row",
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [status, setStatus] = useState(item.status || "pending");
  const [note, setNote] = useState(item.admin_note || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setStatus(item.status || "pending");
    setNote(item.admin_note || "");
  }, [item]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await FetchWithJwtClient("PUT", `/api/admin/consultation-requests/${item.id}`, {
        status,
        admin_note: note.trim() || null,
      });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در بروزرسانی"));
        return;
      }
      toast.success("ذخیره شد");
      setEditOpen(false);
      onSuccess?.();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await FetchWithJwtClient(
        "DELETE",
        `/api/admin/consultation-requests/${item.id}`,
        tokenCode(),
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف"));
        return;
      }
      toast.success("حذف شد");
      setDeleteOpen(false);
      onSuccess?.();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", gap: 0.5, justifyContent: variant === "card" ? "flex-end" : "center" }}>
        <Tooltip title="ویرایش وضعیت">
          <IconButton size="small" onClick={() => setEditOpen(true)} sx={{ color: "var(--admin-accent)" }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="حذف">
          <IconButton size="small" onClick={() => setDeleteOpen(true)} sx={{ color: "var(--admin-error)" }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Dialog
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            direction: "rtl",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)" }}>پیگیری درخواست</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13 }}>
            {item.name} — {item.business_name}
          </Typography>
          <TextField
            select
            label="وضعیت"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth
            size="small"
            sx={inputSx}
          >
            {statuses.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="یادداشت ادمین"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving} sx={{ color: "var(--admin-text)" }}>
            انصراف
          </Button>
          <Button variant="contained" onClick={() => void save()} disabled={saving}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            direction: "rtl",
            borderRadius: "16px",
            minWidth: { xs: "90%", sm: 360 },
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", textAlign: "center" }}>حذف درخواست</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--admin-text-muted)", textAlign: "center" }}>
            درخواست «{item.name}» حذف شود؟
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 1, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting} sx={{ color: "var(--admin-text)" }}>
            انصراف
          </Button>
          <Button color="error" variant="contained" onClick={() => void remove()} disabled={deleting}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
