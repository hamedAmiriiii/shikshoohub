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
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import { extractTablePagerCalls, type TablePagerCall } from "@/app/lib/tablePagers";

type ListFilter = "open" | "acknowledged" | "cancelled";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function TablePagersPage() {
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ListFilter>("open");
  const [calls, setCalls] = useState<TablePagerCall[]>([]);
  const [actingId, setActingId] = useState<number | null>(null);
  const { count: pendingCount, refresh: refreshPendingCount } = useTablePagersPending();

  const loadCalls = useCallback(
    async (opts?: { silent?: boolean }) => {
      const token = tokenCode();
      if (!token) {
        setLoading(false);
        return;
      }
      if (!opts?.silent) setLoading(true);
      try {
        const res = await FetchWithJwtClient(
          "GET",
          `/api/table-pagers?status=${listFilter}`,
          token,
        );
        if (res?.hasError) {
          if (!opts?.silent) toast.error(getApiErrorMessage(res, "خطا در دریافت پیجر میز"));
          return;
        }
        setCalls(extractTablePagerCalls(res));
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [listFilter],
  );

  useEffect(() => {
    void loadCalls();
  }, [loadCalls]);

  useEffect(() => {
    const onNew = () => {
      toast.info("پیجر میز جدید");
      if (listFilter === "open") void loadCalls({ silent: true });
    };
    window.addEventListener(TABLE_PAGERS_NEW_EVENT, onNew);
    return () => window.removeEventListener(TABLE_PAGERS_NEW_EVENT, onNew);
  }, [listFilter, loadCalls]);

  const act = async (row: TablePagerCall, action: "ack" | "cancel") => {
    const token = tokenCode();
    if (!token) return;
    setActingId(row.id);
    try {
      const res = await FetchWithJwtClient("POST", `/api/table-pagers/${row.id}/${action}`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, action === "ack" ? "ثبت رسیدگی ناموفق بود" : "لغو ناموفق بود"));
        return;
      }
      toast.success(res?.message || (action === "ack" ? "رسیدگی شد" : "لغو شد"));
      setCalls((prev) => prev.filter((item) => item.id !== row.id));
      void refreshPendingCount();
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setActingId(null);
    }
  };

  return (
    <Box sx={adminPageSx}>
      <ToastContainer position="top-center" rtl />
      <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: 18 }}>پیجر میز</Typography>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mb: 2 }}>
        وقتی مهمان از منوی QR دکمه پیجر را بزند، اینجا می‌بینید کدام میز خدمات می‌خواهد.
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Chip
          label={pendingCount > 0 ? `در انتظار (${pendingCount})` : "در انتظار"}
          onClick={() => setListFilter("open")}
          sx={{
            bgcolor: listFilter === "open" ? "var(--admin-accent)" : "var(--admin-surface)",
            color: listFilter === "open" ? "#fff" : "var(--admin-text)",
            fontWeight: 700,
          }}
        />
        <Chip
          label="رسیدگی‌شده"
          onClick={() => setListFilter("acknowledged")}
          sx={{
            bgcolor: listFilter === "acknowledged" ? "var(--admin-accent)" : "var(--admin-surface)",
            color: listFilter === "acknowledged" ? "#fff" : "var(--admin-text)",
            fontWeight: 700,
          }}
        />
        <Chip
          label="لغوشده"
          onClick={() => setListFilter("cancelled")}
          sx={{
            bgcolor: listFilter === "cancelled" ? "var(--admin-accent)" : "var(--admin-surface)",
            color: listFilter === "cancelled" ? "#fff" : "var(--admin-text)",
            fontWeight: 700,
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : calls.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-secondary)" }}>درخواستی برای نمایش نیست.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr" },
            gap: 0.85,
          }}
        >
          {calls.map((row) => (
            <Card key={row.id} variant="outlined" sx={{ borderRadius: "12px" }}>
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                  <NotificationsActiveIcon sx={{ fontSize: 18, color: "#d97706" }} />
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                    {row.table_label || (row.table_number != null ? `میز ${row.table_number}` : "میز")}
                  </Typography>
                </Box>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1 }}>
                  {formatDate(row.created_at)}
                </Typography>
                {listFilter === "open" ? (
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckRoundedIcon />}
                      disabled={actingId === row.id}
                      onClick={() => void act(row, "ack")}
                      sx={{ flex: 1, bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}
                    >
                      رسیدم
                    </Button>
                    <Button
                      size="small"
                      color="inherit"
                      startIcon={<CloseRoundedIcon />}
                      disabled={actingId === row.id}
                      onClick={() => void act(row, "cancel")}
                    >
                      لغو
                    </Button>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                    {row.status_label || row.status}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
