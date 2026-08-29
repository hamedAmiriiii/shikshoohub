"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import {
  backupTableLabel,
  downloadShopBackup,
  fetchShopBackupSummary,
  restoreShopBackup,
  SHOP_BACKUP_MAX_BYTES,
  type ShopBackupSummary,
} from "@/app/lib/shopBackup";

const btnSx = {
  ...adminButtonStartIconSx,
  fontSize: "12px",
  py: 0.5,
  px: 1.25,
};

const CONFIRM_WORD = "بازگردانی";

export default function ShopBackupSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<ShopBackupSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const loadSummary = async () => {
    setLoadingSummary(true);
    const res = await fetchShopBackupSummary();
    if (!res.ok) {
      toast.error(res.message);
      setSummary(null);
    } else {
      setSummary(res.summary);
    }
    setLoadingSummary(false);
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    const res = await downloadShopBackup();
    if (!res.ok) toast.error(res.message);
    else toast.success("فایل پشتیبان دانلود شد");
    setDownloading(false);
  };

  const handlePickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("فقط فایل zip پشتیبان قابل بازگردانی است");
      return;
    }
    if (file.size > SHOP_BACKUP_MAX_BYTES) {
      toast.error("حجم فایل بیشتر از ۲۰۰ مگابایت است");
      return;
    }
    setRestoreFile(file);
    setConfirmText("");
    setConfirmOpen(true);
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    if (confirmText.trim() !== CONFIRM_WORD) {
      toast.error(`برای تأیید، واژه «${CONFIRM_WORD}» را وارد کنید`);
      return;
    }
    setRestoring(true);
    const res = await restoreShopBackup(restoreFile, "RESTORE");
    setRestoring(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message || "بازگردانی انجام شد");
    setConfirmOpen(false);
    setRestoreFile(null);
    setConfirmText("");
    void loadSummary();
  };

  return (
    <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 11, lineHeight: 1.5 }}>
        بازگردانی پشتیبان اشتراک و سهمیه پیامک عوض نمی‌شود. دادهٔ فعلی فروشگاه پاک می‌شود.
      </Typography>

      {/* {loadingSummary ? (
        <Box sx={{ py: 1, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={16} sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : summary ? (
        <Box
          sx={{
            border: "1px solid var(--admin-border)",
            borderRadius: "8px",
            p: 1,
            backgroundColor: "var(--admin-surface-alt)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Typography sx={{ color: "var(--admin-text)", fontSize: 12, fontWeight: 600 }}>
              خلاصه فعلی
            </Typography>
            <Button
              size="small"
              onClick={() => void loadSummary()}
              startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
              sx={{ ...btnSx, color: "var(--admin-text-muted)", minWidth: 0 }}
            >
              بروزرسانی
            </Button>
          </Box>
          {summary.extra?.shop_name || summary.extra?.shop_code ? (
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.5 }}>
              {[summary.extra.shop_name, summary.extra.shop_code].filter(Boolean).join(" · ")}
            </Typography>
          ) : null}
          {summary.tables.length > 0 ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px" }}>
              {summary.tables.map((row) => (
                <Box key={row.key} sx={{ display: "contents" }}>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
                    {backupTableLabel(row.key)}
                  </Typography>
                  <Typography sx={{ color: "var(--admin-text)", fontSize: 11, fontWeight: 600, textAlign: "left" }}>
                    {row.count.toLocaleString("fa-IR")}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
              تعداد جداول در پاسخ نیامد
            </Typography>
          )}
          <Typography sx={{ color: "var(--admin-text)", fontSize: 11, fontWeight: 600, mt: 0.75 }}>
            فایل‌ها: {summary.filesCount.toLocaleString("fa-IR")}
          </Typography>
        </Box>
      ) : (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
          خلاصه پشتیبان دریافت نشد
        </Typography>
      )} */}

      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
        <Button
          size="small"
          variant="contained"
          disabled={downloading}
          startIcon={downloading ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : <CloudDownloadIcon sx={{ fontSize: 16 }} />}
          onClick={() => void handleDownload()}
          sx={{
            ...btnSx,
            bgcolor: "var(--admin-accent)",
            color: "#fff",
            "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "#fff" },
          }}
        >
          {downloading ? "در حال دانلود..." : "دانلود پشتیبان"}
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={restoring}
          startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            ...btnSx,
            color: "var(--admin-text)",
            borderColor: "var(--admin-border)",
          }}
        >
          بازگردانی از فایل
        </Button>
        <input ref={fileInputRef} type="file" accept=".zip,application/zip" hidden onChange={handlePickFile} />
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={restoring ? undefined : () => setConfirmOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "var(--admin-surface)",
            borderRadius: "12px",
            border: "1px solid var(--admin-border)",
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", fontSize: 15, fontWeight: 700 }}>
          بازگردانی پشتیبان
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#ef5350", fontSize: 12, mb: 1, lineHeight: 1.6 }}>
            دادهٔ فعلی این فروشگاه پاک می‌شود و محتوای فایل جای آن می‌نشیند. این کار برگشت‌ناپذیر است.
          </Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 1, lineHeight: 1.5 }}>
            حساب پرسنل، کد فروشگاه، اشتراک و سهمیه پیامک عوض نمی‌شود. بعد از بازگردانی مشتری‌های آنلاین باید دوباره وارد شوند.
          </Typography>
          {restoreFile ? (
            <Typography sx={{ color: "var(--admin-text)", fontSize: 12, mb: 1.5 }}>
              فایل: {restoreFile.name}
            </Typography>
          ) : null}
          <TextField
            size="small"
            fullWidth
            label={`برای تأیید بنویسید: ${CONFIRM_WORD}`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--admin-surface-alt)",
                color: "var(--admin-text)",
                fontSize: 13,
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
              "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: 13 },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            size="small"
            disabled={restoring}
            onClick={() => setConfirmOpen(false)}
            sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}
          >
            انصراف
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={restoring || confirmText.trim() !== CONFIRM_WORD}
            onClick={() => void handleRestore()}
            sx={{ backgroundColor: "#ff4444", fontSize: 12, "&:hover": { backgroundColor: "#cc0000" } }}
          >
            {restoring ? "در حال بازگردانی..." : "بازگردانی"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
