"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  formatSmsPackageOrderStatus,
  getOrderPackage,
  getOrderShopName,
  getOrderSmsCount,
  getSmsPackageName,
  type SmsPackageOrder,
} from "@/app/lib/smsPackages";
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

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

type Props = {
  item: SmsPackageOrder;
  onSuccess?: () => void;
  variant?: "row" | "card";
};

export function SmsPackageOrderStatusChip({ status }: { status?: string }) {
  const label = formatSmsPackageOrderStatus(status);
  const color =
    status === "approved" ? "success" : status === "rejected" ? "error" : "warning";

  return (
    <Chip
      size="small"
      label={label}
      color={color}
      sx={{ fontWeight: 600, fontSize: "12px" }}
    />
  );
}

export function SmsPackageOrderMobileCard({
  data,
  onSuccess,
}: {
  data: SmsPackageOrder;
  onSuccess?: () => void;
}) {
  const pkg = getOrderPackage(data);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "12px",
        border: "1px solid var(--admin-border)",
        bgcolor: "var(--admin-surface)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Typography sx={{ fontWeight: 700, color: "var(--admin-text)", fontSize: "15px" }}>
          {getOrderShopName(data)}
        </Typography>
        <SmsPackageOrderStatusChip status={data.status} />
      </Box>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}>
        بسته: {getSmsPackageName(pkg)} ({formatNumber(getOrderSmsCount(data))} پیامک)
      </Typography>
      {data.phone && (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mb: 1 }}>
          تلفن: {data.phone}
        </Typography>
      )}
      <SmsPackageOrderActions item={data} onSuccess={onSuccess} variant="card" />
    </Box>
  );
}

export default function SmsPackageOrderActions({ item, onSuccess, variant = "row" }: Props) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);

  const isPending = item.status === "pending";

  const submitAction = async (action: "approve" | "reject") => {
    setLoading(true);
    try {
      const token = tokenCode();
      const body = adminNote.trim() ? { admin_note: adminNote.trim() } : {};
      const res = await FetchWithJwtClient(
        "POST",
        `/api/admin/sms-package-orders/${item.id}/${action}`,
        token,
        {},
        { body: JSON.stringify(body) },
      );

      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در انجام عملیات"));
        return;
      }

      toast.success(action === "approve" ? "درخواست تأیید و اعتبار شارژ شد" : "درخواست رد شد");
      setApproveOpen(false);
      setRejectOpen(false);
      setAdminNote("");
      onSuccess?.();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (!isPending) {
    return variant === "card" ? (
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mt: 1 }}>
        {item.admin_note ? `یادداشت: ${item.admin_note}` : "عملیاتی در دسترس نیست"}
      </Typography>
    ) : null;
  }

  const buttons = (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", ...(variant === "card" ? { mt: 1 } : {}) }}>
      <Button
        size="small"
        variant="contained"
        startIcon={<CheckCircleOutlineIcon />}
        onClick={() => setApproveOpen(true)}
        sx={{
          bgcolor: "var(--admin-accent)",
          "&:hover": { bgcolor: "var(--admin-accent-hover)" },
          fontSize: variant === "card" ? "12px" : "13px",
        }}
      >
        تأیید
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<CancelOutlinedIcon />}
        onClick={() => setRejectOpen(true)}
        sx={{
          borderColor: "#e57373",
          color: "#e57373",
          fontSize: variant === "card" ? "12px" : "13px",
        }}
      >
        رد
      </Button>
    </Box>
  );

  return (
    <>
      {buttons}

      <Dialog open={approveOpen} onClose={() => !loading && setApproveOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "var(--admin-text)" }}>تأیید درخواست خرید</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", mb: 2 }}>
            {getOrderShopName(item)} — {formatNumber(getOrderSmsCount(item))} پیامک
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="یادداشت (اختیاری)"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="مثلاً: پرداخت دریافت شد"
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApproveOpen(false)} disabled={loading}>
            انصراف
          </Button>
          <Button
            variant="contained"
            disabled={loading}
            onClick={() => submitAction("approve")}
            sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
          >
            {loading ? "…" : "تأیید و شارژ"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => !loading && setRejectOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "var(--admin-text)" }}>رد درخواست</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", mb: 2 }}>
            آیا از رد این درخواست مطمئن هستید؟
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="دلیل (اختیاری)"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)} disabled={loading}>
            انصراف
          </Button>
          <Button variant="contained" color="error" disabled={loading} onClick={() => submitAction("reject")}>
            {loading ? "…" : "رد درخواست"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
