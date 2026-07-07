"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import ReplayIcon from "@mui/icons-material/Replay";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  OUTBOX_CHANGED_EVENT,
  clearOutbox,
  listOutboxItems,
  outboxItemToLegacyPending,
  removeOutboxItem,
  syncAllPendingPurchases,
  syncOutboxItem,
  type OutboxItem,
} from "@/app/lib/offline";

const formatNumber = (num: number) => new Intl.NumberFormat("fa-IR").format(num);

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

const statusLabel: Record<string, { label: string; color: "default" | "warning" | "error" | "info" }> = {
  pending: { label: "در انتظار", color: "warning" },
  syncing: { label: "در حال ارسال", color: "info" },
  failed: { label: "ناموفق", color: "error" },
};

export default function PendingPurchasesPage() {
  const router = useRouter();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const reload = useCallback(async () => {
    try {
      const all = await listOutboxItems();
      setItems(all.filter((item) => item.type === "purchase"));
    } catch (error) {
      console.error("load outbox failed:", error);
    }
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener(OUTBOX_CHANGED_EVENT, reload);
    return () => window.removeEventListener(OUTBOX_CHANGED_EVENT, reload);
  }, [reload]);

  const syncAll = async () => {
    if (items.length === 0 || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncAllPendingPurchases();
      await reload();
      const ok = result.successful.length + result.duplicate.length;
      if (ok > 0 && result.failed.length === 0) {
        toast.success(`${ok} خرید با موفقیت ثبت شد`);
      } else if (ok > 0) {
        toast.success(`${ok} خرید ثبت شد`);
        toast.warn(`${result.failed.length} خرید هنوز در صف است`);
      } else if (result.failed.length > 0) {
        toast.error("ثبت خریدها ناموفق بود");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const retryOne = async (item: OutboxItem) => {
    setIsSyncing(true);
    try {
      const outcome = await syncOutboxItem(item);
      await reload();
      if (outcome === "success" || outcome === "duplicate") {
        toast.success("خرید ثبت شد");
      } else {
        toast.error(item.lastError || "ثبت ناموفق بود");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteOne = async (id: string) => {
    await removeOutboxItem(id);
    await reload();
    toast.success("از صف حذف شد");
  };

  const deleteAll = async () => {
    await clearOutbox();
    setConfirmClearOpen(false);
    await reload();
    toast.success("همه عملیات معلق حذف شدند");
  };

  const calculateTotal = (item: OutboxItem) => {
    if (typeof item.meta.total === "number") return item.meta.total;
    const cart = item.meta.cart;
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, row: any) => sum + Number(row?.sale_price || 0) * Number(row?.quantity || 0), 0);
  };

  const pendingSalesTotal = useMemo(
    () => items.reduce((sum, item) => sum + calculateTotal(item), 0),
    [items],
  );

  return (
    <Box sx={{ position: "relative", minHeight: "100vh", direction: "rtl", background: "var(--admin-bg-gradient)" }}>
      <Container maxWidth="xl" sx={{ padding: { xs: "12px", md: "24px" }, paddingBottom: { xs: "100px", md: "40px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 2, md: 3 } }}>
          <IconButton
            onClick={() => router.push("/admin")}
            sx={{ color: "var(--admin-text)", backgroundColor: "var(--admin-divider)" }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 18, md: 24 }, color: "var(--admin-text)" }}>
            عملیات معلق
          </Typography>
          <Box sx={{ width: 40 }} />
        </Box>

        {!isOnline && (
          <Box sx={{ backgroundColor: "#ff9800", color: "var(--admin-text)", p: 1.5, borderRadius: 2, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CloudQueueIcon />
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              حالت Offline — پس از اتصال، همگام‌سازی کنید
            </Typography>
          </Box>
        )}

        {items.length > 0 && (
          <Card sx={{ mb: 2, borderRadius: 2, backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                مجموع فروش ثبت‌نشده
              </Typography>
              <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 24, mt: 0.5 }}>
                {formatNumber(pendingSalesTotal)} تومان
              </Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12, mt: 0.25 }}>
                {formatNumber(items.length)} خرید در صف
              </Typography>
            </CardContent>
          </Card>
        )}

        {items.length > 0 && (
          <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexDirection: { xs: "column", md: "row" } }}>
            {isOnline && (
              <Button
                onClick={syncAll}
                disabled={isSyncing}
                variant="contained"
                startIcon={isSyncing ? <CircularProgress size={18} color="inherit" /> : undefined}
              >
                {isSyncing ? "در حال همگام‌سازی..." : "همگام‌سازی همه"}
              </Button>
            )}
            <Button
              onClick={() => setConfirmClearOpen(true)}
              variant="outlined"
              sx={{ borderColor: "#ff4444", color: "#ff4444" }}
            >
              حذف همه
            </Button>
          </Box>
        )}

        {items.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: 2, backgroundColor: "var(--admin-surface)" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "var(--admin-surface-alt)" }}>
                  <TableCell align="right">تاریخ</TableCell>
                  <TableCell align="right">تلفن</TableCell>
                  <TableCell align="right">مبلغ</TableCell>
                  <TableCell align="right">وضعیت</TableCell>
                  <TableCell align="right">عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const legacy = outboxItemToLegacyPending(item);
                  const chip = statusLabel[item.status] ?? statusLabel.pending;
                  return (
                    <TableRow key={item.id}>
                      <TableCell align="right">{formatDate(item.createdAt)}</TableCell>
                      <TableCell align="right">{legacy.phone || "—"}</TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-accent)", fontWeight: 600 }}>
                        {formatNumber(calculateTotal(item))} تومان
                      </TableCell>
                      <TableCell align="right">
                        <Chip size="small" color={chip.color} label={chip.label} />
                        {item.lastError ? (
                          <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mt: 0.5 }}>
                            {item.lastError}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell align="right">
                        {isOnline ? (
                          <IconButton size="small" onClick={() => retryOne(item)} disabled={isSyncing} title="تلاش مجدد">
                            <ReplayIcon fontSize="small" />
                          </IconButton>
                        ) : null}
                        <IconButton size="small" onClick={() => deleteOne(item.id)} sx={{ color: "#ff4444" }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Card sx={{ backgroundColor: "var(--admin-surface)", textAlign: "center", p: 4 }}>
            <CardContent>
              <CloudQueueIcon sx={{ fontSize: 64, color: "var(--admin-text-secondary)", mb: 2 }} />
              <Typography sx={{ color: "var(--admin-text-muted)" }}>عملیات معلقی وجود ندارد</Typography>
            </CardContent>
          </Card>
        )}
      </Container>

      <Dialog open={confirmClearOpen} onClose={() => setConfirmClearOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>حذف همه عملیات معلق</DialogTitle>
        <DialogContent>
          <DialogContentText>همه خریدهای در صف حذف شوند؟ این عمل قابل بازگشت نیست.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearOpen(false)}>انصراف</Button>
          <Button color="error" variant="contained" onClick={deleteAll}>
            حذف همه
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer autoClose={3000} style={{ marginBottom: "76px" }} position="bottom-right" rtl />
    </Box>
  );
}
