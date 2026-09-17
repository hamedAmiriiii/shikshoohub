"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  dismissSmartAction,
  executeSmartAction,
  fetchSmartActions,
  toFaNum,
  type SmartAction,
} from "@/app/lib/smartCustomer";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const panelSx = {
  boxShadow: "none",
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  p: 2,
  mb: 1.5,
} as const;

export default function SmartClubActionsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SmartAction[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSmartActions("suggested");
      setRows(res.data || []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت پیشنهادها"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onExecute = async (id: number) => {
    setBusyId(id);
    try {
      await executeSmartAction(id);
      toast.success("اقدام اجرا شد");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "اجرا ناموفق بود"));
    } finally {
      setBusyId(null);
    }
  };

  const onDismiss = async (id: number) => {
    setBusyId(id);
    try {
      await dismissSmartAction(id);
      toast.info("رد شد");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box sx={adminPageSx}>
      <ToastContainer position="top-center" rtl />
      <Typography variant="h5" fontWeight={800} mb={2}>
        پیشنهادهای اقدام
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">پیشنهاد فعالی نیست.</Typography>
      ) : (
        rows.map((a) => (
          <Box key={a.id} sx={panelSx}>
            <Typography fontWeight={700}>
              {a.title} — {a.name || a.phone}
            </Typography>
            <Typography variant="body2" color="text.secondary" my={0.5}>
              {a.reason}
            </Typography>
            <Typography variant="body2">
              ارزش تقریبی: {toFaNum(a.estimated_revenue)} تومان
              {a.suggested_send_at ? ` | زمان پیشنهادی: ${a.suggested_send_at}` : ""}
            </Typography>
            {a.payload?.credit ? (
              <Typography variant="body2">اعتبار پیشنهادی: {toFaNum(a.payload.credit as number)}</Typography>
            ) : null}
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Button
                variant="contained"
                size="small"
                disabled={busyId === a.id}
                onClick={() => void onExecute(a.id)}
                sx={adminButtonStartIconSx}
              >
                اجرا (اعتبار/پیامک)
              </Button>
              <Button
                variant="outlined"
                size="small"
                disabled={busyId === a.id}
                onClick={() => void onDismiss(a.id)}
              >
                رد
              </Button>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}
