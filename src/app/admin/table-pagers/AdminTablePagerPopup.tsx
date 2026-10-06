"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TABLE_PAGERS_NEW_EVENT,
  useTablePagersPending,
} from "./TablePagersPendingProvider";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { extractTablePagerCalls, type TablePagerCall } from "@/app/lib/tablePagers";
import { readShopFeatures } from "@/app/lib/shopFeatures";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function popupEnabled() {
  const features = readShopFeatures();
  return features.restaurant_cafe_enabled || features.room_services_enabled;
}

export default function AdminTablePagerPopup() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calls, setCalls] = useState<TablePagerCall[]>([]);
  const [actingId, setActingId] = useState<number | null>(null);
  const { refresh: refreshPendingCount } = useTablePagersPending();

  const loadCalls = useCallback(async () => {
    const token = tokenCode();
    if (!token) return;
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/table-pagers?status=open", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت پیجر میز"));
        return;
      }
      setCalls(extractTablePagerCalls(res));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setEnabled(popupEnabled());
  }, []);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }
    const onNew = () => {
      setOpen(true);
      void loadCalls();
    };
    window.addEventListener(TABLE_PAGERS_NEW_EVENT, onNew);
    return () => window.removeEventListener(TABLE_PAGERS_NEW_EVENT, onNew);
  }, [enabled, loadCalls]);

  const ack = async (row: TablePagerCall) => {
    const token = tokenCode();
    if (!token) return;
    setActingId(row.id);
    try {
      const res = await FetchWithJwtClient("POST", `/api/table-pagers/${row.id}/ack`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت رسیدگی ناموفق بود"));
        return;
      }
      setCalls((prev) => prev.filter((item) => item.id !== row.id));
      void refreshPendingCount();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setActingId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <NotificationsActiveIcon sx={{ color: "#d97706" }} />
        پیجر میز
      </DialogTitle>
      <DialogContent>
        {loading && calls.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : calls.length === 0 ? (
          <Typography sx={{ color: "var(--admin-text-secondary)", py: 2 }}>
            درخواست بازی نیست.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1 }}>
            {calls.map((row) => (
              <Card key={row.id} variant="outlined" sx={{ borderRadius: "12px" }}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 16 }}>
                    {row.table_label || (row.table_number != null ? `میز ${row.table_number}` : "میز")}
                  </Typography>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1 }}>
                    {formatDate(row.created_at)}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CheckRoundedIcon />}
                    disabled={actingId === row.id}
                    onClick={() => void ack(row)}
                    sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}
                  >
                    رسیدم
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>بستن</Button>
      </DialogActions>
    </Dialog>
  );
}
