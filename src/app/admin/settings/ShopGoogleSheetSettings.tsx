"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { toast } from "react-toastify";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import GoogleIcon from "@mui/icons-material/Google";
import {
  connectShopGoogleSheet,
  disconnectShopGoogleSheet,
  exportShopToGoogleSheet,
  fetchShopGoogleOAuthUrl,
  fetchShopGoogleSheetStatus,
  type ShopGoogleSheetStatus,
} from "@/app/lib/shopGoogleSheet";

const btnSx = {
  ...adminButtonStartIconSx,
  fontSize: "12px",
  py: 0.5,
  px: 1.25,
};

const hintSx = { color: "var(--admin-text-secondary)", fontSize: 11, lineHeight: 1.6 };

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("fa-IR");
}

export default function ShopGoogleSheetSettings() {
  const [status, setStatus] = useState<ShopGoogleSheetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetchShopGoogleSheetStatus();
    if (res.ok) setStatus(res.status);
    else toast.error(res.message);
    setLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("google_sheet");
    if (result) {
      if (result === "connected") {
        const email = params.get("email");
        toast.success(email ? `حساب گوگل ${email} متصل شد` : "حساب گوگل متصل شد");
      } else {
        toast.error(params.get("message") || "اتصال حساب گوگل ناموفق بود");
      }
      ["google_sheet", "email", "message"].forEach((key) => params.delete(key));
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
    void load();
  }, []);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    const res = await fetchShopGoogleOAuthUrl(`${window.location.origin}${window.location.pathname}`);
    if (!res.ok) {
      setSigningIn(false);
      toast.error(res.message);
      return;
    }
    window.location.href = res.url;
  };

  const handleConnect = async () => {
    if (!link.trim()) {
      toast.error("لینک گوگل شیت را وارد کنید");
      return;
    }
    setConnecting(true);
    const res = await connectShopGoogleSheet(link.trim());
    setConnecting(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    setStatus(res.status);
    setLink("");
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    const res = await disconnectShopGoogleSheet();
    setDisconnecting(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setStatus(res.status);
  };

  const handleExport = async () => {
    setExporting(true);
    const res = await exportShopToGoogleSheet();
    setExporting(false);
    if (!res.ok) {
      toast.error(res.message);
      void load();
      return;
    }
    toast.success(`${res.result.message} (${res.result.rows.toLocaleString("fa-IR")} ردیف)`);
    void load();
  };

  const copyEmail = async () => {
    if (!status?.serviceAccountEmail) return;
    try {
      await navigator.clipboard.writeText(status.serviceAccountEmail);
      toast.success("ایمیل کپی شد");
    } catch {
      toast.error("کپی ممکن نشد");
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 1, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={16} sx={{ color: "var(--admin-accent)" }} />
      </Box>
    );
  }

  if (!status?.configured) {
    return (
      <Typography sx={{ ...hintSx, mt: 1 }}>
        اتصال گوگل شیت هنوز روی سرور فعال نشده است. با پشتیبانی تماس بگیرید.
      </Typography>
    );
  }

  const lastExport = formatDate(status.lastExportAt);
  const accentBtnSx = {
    ...btnSx,
    bgcolor: "var(--admin-accent)",
    color: "var(--admin-on-accent)",
    "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "var(--admin-on-accent)" },
  };

  if (status.oauthEnabled && !status.googleConnected) {
    return (
      <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography sx={hintSx}>
          با حساب گوگل فروشگاه وارد شوید. در اولین ارسال، یک شیت در گوگل‌درایو همان حساب ساخته می‌شود و برنامه فقط به
          همین شیت دسترسی دارد.
        </Typography>
        <Button
          size="small"
          variant="contained"
          disabled={signingIn}
          onClick={() => void handleGoogleSignIn()}
          startIcon={
            signingIn ? (
              <CircularProgress size={12} sx={{ color: "var(--admin-on-accent)" }} />
            ) : (
              <GoogleIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={{ ...accentBtnSx, alignSelf: "flex-start" }}
        >
          {signingIn ? "در حال انتقال به گوگل..." : "ورود با گوگل"}
        </Button>
      </Box>
    );
  }

  if (status.oauthEnabled && status.googleConnected) {
    return (
      <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography sx={{ ...hintSx, color: "var(--admin-text)" }}>
          متصل به حساب گوگل: <span dir="ltr">{status.googleEmail || "—"}</span>
        </Typography>
        <Typography sx={hintSx}>
          {status.spreadsheetId
            ? "با هر ارسال، همه جداول فروشگاه (هر جدول در یک تب) با دادهٔ فعلی جایگزین می‌شود. تغییرات دستی در این تب‌ها پاک می‌شود."
            : "با اولین ارسال، شیت فروشگاه در گوگل‌درایو همین حساب ساخته می‌شود."}
        </Typography>
        {lastExport ? <Typography sx={hintSx}>آخرین ارسال: {lastExport}</Typography> : null}
        {status.lastExportError ? (
          <Typography sx={{ color: "var(--admin-error)", fontSize: 11, lineHeight: 1.6 }}>
            خطای آخرین ارسال: {status.lastExportError}
          </Typography>
        ) : null}
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="contained"
            disabled={exporting}
            onClick={() => void handleExport()}
            startIcon={
              exporting ? (
                <CircularProgress size={12} sx={{ color: "var(--admin-on-accent)" }} />
              ) : (
                <CloudSyncIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={accentBtnSx}
          >
            {exporting ? "در حال ارسال..." : "ارسال به گوگل شیت"}
          </Button>
          {status.spreadsheetUrl ? (
            <Button
              size="small"
              variant="outlined"
              href={status.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              sx={{ ...btnSx, color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
            >
              باز کردن شیت
            </Button>
          ) : null}
          <Button
            size="small"
            disabled={disconnecting || exporting}
            onClick={() => void handleDisconnect()}
            startIcon={<LinkOffIcon sx={{ fontSize: 16 }} />}
            sx={{ ...btnSx, color: "var(--admin-text-muted)" }}
          >
            خروج از حساب گوگل
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
      {!status.spreadsheetId ? (
        <>
          <Typography sx={hintSx}>
            ۱. در گوگل درایو یک شیت خالی بسازید.
            <br />
            ۲. با دکمه Share، شیت را با ایمیل زیر به صورت Editor به اشتراک بگذارید.
            <br />
            ۳. لینک شیت را اینجا وارد کنید.
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              border: "1px solid var(--admin-border)",
              borderRadius: "8px",
              px: 1,
              py: 0.5,
              backgroundColor: "var(--admin-surface-alt)",
            }}
          >
            <Typography
              sx={{ color: "var(--admin-text)", fontSize: 11, direction: "ltr", flex: 1, wordBreak: "break-all" }}
            >
              {status.serviceAccountEmail}
            </Typography>
            <Button
              size="small"
              onClick={() => void copyEmail()}
              startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
              sx={{ ...btnSx, color: "var(--admin-text-muted)", minWidth: 0 }}
            >
              کپی
            </Button>
          </Box>
          <TextField
            size="small"
            fullWidth
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            inputProps={{ dir: "ltr" }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--admin-surface-alt)",
                color: "var(--admin-text)",
                fontSize: 12,
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
            }}
          />
          <Button
            size="small"
            variant="contained"
            disabled={connecting}
            onClick={() => void handleConnect()}
            startIcon={
              connecting ? (
                <CircularProgress size={12} sx={{ color: "var(--admin-on-accent)" }} />
              ) : (
                <LinkIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              ...btnSx,
              alignSelf: "flex-start",
              bgcolor: "var(--admin-accent)",
              color: "var(--admin-on-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "var(--admin-on-accent)" },
            }}
          >
            {connecting ? "در حال بررسی..." : "اتصال"}
          </Button>
        </>
      ) : (
        <>
          <Typography sx={hintSx}>
            با هر ارسال، همه جداول فروشگاه (هر جدول در یک تب) با دادهٔ فعلی جایگزین می‌شود. تغییرات دستی در این تب‌ها
            پاک می‌شود.
          </Typography>
          {lastExport ? <Typography sx={hintSx}>آخرین ارسال: {lastExport}</Typography> : null}
          {status.lastExportError ? (
            <Typography sx={{ color: "var(--admin-error)", fontSize: 11, lineHeight: 1.6 }}>
              خطای آخرین ارسال: {status.lastExportError}
            </Typography>
          ) : null}
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="contained"
              disabled={exporting}
              onClick={() => void handleExport()}
              startIcon={
                exporting ? (
                  <CircularProgress size={12} sx={{ color: "var(--admin-on-accent)" }} />
                ) : (
                  <CloudSyncIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{
                ...btnSx,
                bgcolor: "var(--admin-accent)",
                color: "var(--admin-on-accent)",
                "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "var(--admin-on-accent)" },
              }}
            >
              {exporting ? "در حال ارسال..." : "ارسال به گوگل شیت"}
            </Button>
            {status.spreadsheetUrl ? (
              <Button
                size="small"
                variant="outlined"
                href={status.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                sx={{ ...btnSx, color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
              >
                باز کردن شیت
              </Button>
            ) : null}
            <Button
              size="small"
              disabled={disconnecting || exporting}
              onClick={() => void handleDisconnect()}
              startIcon={<LinkOffIcon sx={{ fontSize: 16 }} />}
              sx={{ ...btnSx, color: "var(--admin-text-muted)" }}
            >
              قطع اتصال
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
