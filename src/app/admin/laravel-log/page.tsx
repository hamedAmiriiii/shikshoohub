"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import BugReportIcon from "@mui/icons-material/BugReport";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminButtonStartIconSx, adminPageSx, adminSurfaceCardSx } from "@/app/admin/theme/adminTheme";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir").replace(/\/$/, "");

type LogFileRow = {
  name: string;
  size: number;
  size_label: string;
  modified_at?: string | null;
  exists?: boolean;
};

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1].trim());
    } catch {
      /* ignore */
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() || null;
}

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const trimmed = String(value).trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return trimmed;
  const year = Number(m[1]);
  if (year < 1700) return `${m[1]}/${m[2]}/${m[3]} ${m[4]}:${m[5]}`;
  const date = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+03:30`);
  if (Number.isNaN(date.getTime())) return trimmed;
  return date.toLocaleString("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LaravelLogPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<LogFileRow[]>([]);
  const [busyFile, setBusyFile] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LogFileRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient("GET", "/api/admin/laravel-log", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خواندن لیست لاگ ناموفق بود"));
        setFiles([]);
        return;
      }
      const list = Array.isArray(res?.files) ? (res.files as LogFileRow[]) : [];
      setFiles(list);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خواندن لیست لاگ ناموفق بود"));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
    void load();
  }, [load, router]);

  const downloadFile = async (file: LogFileRow) => {
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }
    setBusyFile(file.name);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/laravel-log/download?file=${encodeURIComponent(file.name)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/plain, application/octet-stream, application/json",
          },
        },
      );
      if (!response.ok) {
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          toast.error(getApiErrorMessage(parsed, "دانلود لاگ ناموفق بود"));
        } catch {
          toast.error(text || "دانلود لاگ ناموفق بود");
        }
        return;
      }
      const blob = await response.blob();
      const filename =
        filenameFromDisposition(response.headers.get("Content-Disposition")) || file.name;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("دانلود شروع شد");
    } catch {
      toast.error("دانلود لاگ ناموفق بود");
    } finally {
      setBusyFile(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    setBusyFile(name);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient("DELETE", "/api/admin/laravel-log", token, {
        file: name,
      });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "حذف لاگ ناموفق بود"));
        return;
      }
      toast.success(res?.message || "لاگ حذف شد");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "حذف لاگ ناموفق بود"));
    } finally {
      setBusyFile(null);
    }
  };

  if (!allowed) return null;

  return (
    <Box sx={{ ...adminPageSx, p: { xs: 1.5, md: 2.5 }, direction: "rtl" }}>
      <ToastContainer position="top-center" rtl theme="dark" />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
            لاگ خطای سرور
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mt: 0.5 }}>
            فایل‌های{" "}
            <Box component="span" dir="ltr" sx={{ fontFamily: "monospace" }}>
              storage/logs
            </Box>{" "}
            لاراول (مثل laravel.log و api-errors.log) — دانلود یا حذف.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => void load()}
          disabled={loading}
          sx={{
            ...adminButtonStartIconSx,
            color: "var(--admin-accent)",
            borderColor: "var(--admin-border)",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          بروزرسانی
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : files.length === 0 ? (
        <Box sx={{ ...adminSurfaceCardSx, p: 3, textAlign: "center" }}>
          <BugReportIcon sx={{ fontSize: 36, color: "var(--admin-text-muted)", mb: 1 }} />
          <Typography sx={{ color: "var(--admin-text-muted)" }}>فایل لاگی پیدا نشد.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {files.map((file) => {
            const busy = busyFile === file.name;
            return (
              <Box
                key={file.name}
                sx={{
                  ...adminSurfaceCardSx,
                  p: 1.75,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography
                    dir="ltr"
                    sx={{
                      color: "var(--admin-text)",
                      fontWeight: 700,
                      fontSize: 14,
                      fontFamily: "monospace",
                      textAlign: "left",
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.35 }}>
                    {file.size_label || "0 B"} · {formatWhen(file.modified_at)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
                  disabled={busy || file.size <= 0}
                  onClick={() => void downloadFile(file)}
                  sx={{
                    ...adminButtonStartIconSx,
                    textTransform: "none",
                    borderRadius: "10px",
                    bgcolor: "var(--admin-accent)",
                    fontWeight: 600,
                    "&:hover": { bgcolor: "var(--admin-accent)" },
                  }}
                >
                  دانلود
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  disabled={busy}
                  onClick={() => setDeleteTarget(file)}
                  sx={{
                    ...adminButtonStartIconSx,
                    textTransform: "none",
                    borderRadius: "10px",
                    fontWeight: 600,
                  }}
                >
                  حذف
                </Button>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} dir="rtl">
        <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: 700 }}>حذف فایل لاگ</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 14 }}>
            فایل{" "}
            <Box component="span" dir="ltr" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
              {deleteTarget?.name}
            </Box>{" "}
            حذف شود؟ این کار برگشت‌پذیر نیست.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>
            انصراف
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={busyFile === deleteTarget?.name}
            onClick={() => void confirmDelete()}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            حذف کن
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
