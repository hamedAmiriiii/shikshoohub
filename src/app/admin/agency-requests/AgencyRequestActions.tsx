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
  formatAgencyDate,
  formatAgencyStatus,
  formatEducation,
  getAgencyStatusColor,
  getCityName,
  getRequesterName,
  getStateName,
  type AgencyRequest,
  type SelectOption,
} from "@/app/lib/agencyRequests";

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
  item: AgencyRequest;
  statuses: SelectOption[];
  onSuccess?: () => void;
  variant?: "row" | "card";
};

export function AgencyRequestStatusChip({ status }: { status?: string }) {
  return (
    <Chip
      size="small"
      label={formatAgencyStatus(status)}
      color={getAgencyStatusColor(status)}
      sx={{ fontWeight: 600, fontSize: "12px" }}
    />
  );
}

export function AgencyRequestMobileCard({
  data,
  statuses,
  onSuccess,
}: {
  data: AgencyRequest;
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
          {getRequesterName(data)}
        </Typography>
        <AgencyRequestStatusChip status={data.status} />
      </Box>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }} dir="ltr">
        {data.phone || "—"}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}>
        {getStateName(data)} / {getCityName(data)}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mb: 0.5 }}>
        مدرک: {formatEducation(data.education_label || data.education)}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>
        {formatAgencyDate(data.created_at)}
      </Typography>
      {data.admin_note && (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mt: 0.5 }}>
          یادداشت: {data.admin_note}
        </Typography>
      )}
      <AgencyRequestActions item={data} statuses={statuses} onSuccess={onSuccess} variant="card" />
    </Box>
  );
}

export default function AgencyRequestActions({
  item,
  statuses,
  onSuccess,
  variant = "row",
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [status, setStatus] = useState(item.status || "");
  const [adminNote, setAdminNote] = useState(item.admin_note || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editOpen) {
      setStatus(item.status || "");
      setAdminNote(item.admin_note || "");
    }
  }, [editOpen, item.admin_note, item.status]);

  const statusOptions = statuses.length
    ? statuses
    : [
        { value: "pending", label: formatAgencyStatus("pending") },
        { value: "in_progress", label: formatAgencyStatus("in_progress") },
        { value: "approved", label: formatAgencyStatus("approved") },
        { value: "rejected", label: formatAgencyStatus("rejected") },
      ];

  const submitUpdate = async () => {
    if (!status) {
      toast.error("وضعیت پیگیری را انتخاب کنید");
      return;
    }

    setLoading(true);
    try {
      const res = await FetchWithJwtClient(
        "PUT",
        `/api/admin/agency-requests/${item.id}`,
        tokenCode(),
        {},
        { body: JSON.stringify({ status, admin_note: adminNote.trim() }) },
      );

      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در به‌روزرسانی درخواست"));
        return;
      }

      toast.success("درخواست به‌روزرسانی شد");
      setEditOpen(false);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const submitDelete = async () => {
    setLoading(true);
    try {
      const res = await FetchWithJwtClient(
        "DELETE",
        `/api/admin/agency-requests/${item.id}`,
        tokenCode(),
      );

      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف درخواست"));
        return;
      }

      toast.success("درخواست حذف شد");
      setDeleteOpen(false);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {variant === "card" ? (
        <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
            sx={{
              bgcolor: "var(--admin-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
              fontSize: "12px",
            }}
          >
            پیگیری
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
            sx={{ borderColor: "#e57373", color: "#e57373", fontSize: "12px" }}
          >
            حذف
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
          <Tooltip title="ثبت پیگیری" arrow placement="top">
            <IconButton
              onClick={() => setEditOpen(true)}
              sx={{
                backgroundColor: "var(--admin-accent)",
                color: "#fff",
                "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف" arrow placement="top">
            <IconButton
              onClick={() => setDeleteOpen(true)}
              sx={{
                backgroundColor: "#ff4444",
                color: "#fff",
                "&:hover": { backgroundColor: "#cc0000" },
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Dialog
        open={editOpen}
        onClose={() => !loading && setEditOpen(false)}
        fullWidth
        maxWidth="xs"
        dir="rtl"
      >
        <DialogTitle sx={{ color: "var(--admin-text)" }}>پیگیری درخواست نمایندگی</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "15px" }}>
              {getRequesterName(item)}
            </Typography>
            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px" }} dir="ltr">
              {item.phone || "—"}
            </Typography>
            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px" }}>
              {getStateName(item)} / {getCityName(item)} —{" "}
              {formatEducation(item.education_label || item.education)}
            </Typography>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px" }}>
              ثبت: {formatAgencyDate(item.created_at)}
            </Typography>
          </Box>

          <TextField
            select
            fullWidth
            label="وضعیت پیگیری"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ ...inputSx, mb: 2 }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            minRows={2}
            label="یادداشت ادمین (اختیاری)"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="مثلاً: تماس گرفته شد، مدارک ارسال شود"
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={loading}>
            انصراف
          </Button>
          <Button
            variant="contained"
            disabled={loading}
            onClick={submitUpdate}
            sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
          >
            {loading ? "…" : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => !loading && setDeleteOpen(false)}
        fullWidth
        maxWidth="xs"
        dir="rtl"
      >
        <DialogTitle sx={{ color: "var(--admin-text)" }}>حذف درخواست</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>
            درخواست «{getRequesterName(item)}» حذف شود؟ این عملیات قابل بازگشت نیست.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={loading}>
            انصراف
          </Button>
          <Button variant="contained" color="error" disabled={loading} onClick={submitDelete}>
            {loading ? "…" : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
