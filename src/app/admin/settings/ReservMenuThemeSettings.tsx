"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { toast } from "react-toastify";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import tokenCode from "@/app/coponent/tokenCode";
import { getAdminShopCode, tableReservAbsoluteUrl } from "@/app/lib/shopTables";
import {
  RESERV_MENU_BG_MAX_BYTES,
  RESERV_MENU_ICON_MAX_BYTES,
  RESERV_MENU_PREVIEW_QUERY,
  RESERV_MENU_THEMES,
  RESERV_MENU_THEME_SETTING_KEY,
  parseReservMenuTheme,
  type ReservMenuThemeConfig,
  type ReservMenuThemeId,
} from "@/app/lib/reservMenuThemes";
import { ReservMenuThemePreview } from "@/app/admin/settings/ReservMenuThemePreview";

const API_BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir").replace(/\/$/, "");

const BG_ACCEPT = "video/mp4,video/webm,video/quicktime,image/gif,image/webp,image/jpeg,image/png";
const ICON_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const smallBtnSx = {
  fontSize: "11px",
  fontWeight: 700,
  py: 0.25,
  px: 1,
  minWidth: 0,
  color: "var(--admin-accent)",
  borderColor: "var(--admin-border)",
  "& .MuiButton-startIcon": { marginInlineEnd: "4px", marginInlineStart: 0 },
} as const;

export default function ReservMenuThemeSettings() {
  const [config, setConfig] = useState<ReservMenuThemeConfig>({
    id: "classic",
    backgroundUrl: null,
    backgroundType: null,
    iconUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<ReservMenuThemeId | null>(null);
  const [uploading, setUploading] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [zoomId, setZoomId] = useState<ReservMenuThemeId | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const iconFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequestError("Get", {}, {}, "/api/settings/reserv-menu-theme", true, true, token);
        const parsed = res?.hasError ? null : parseReservMenuTheme(res);
        if (!cancelled && parsed) setConfig(parsed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectTheme = async (id: ReservMenuThemeId) => {
    if (id === config.id || savingId) return;
    const token = tokenCode();
    if (!token) return;
    setSavingId(id);
    try {
      const res = await apiRequestError(
        "Put",
        {},
        { value: id },
        `/api/settings/${RESERV_MENU_THEME_SETTING_KEY}`,
        true,
        true,
        token,
      );
      if (res?.hasError) {
        toast.error(typeof res.message === "string" ? res.message : "ذخیره تم منو ناموفق بود");
        return;
      }
      setConfig((prev) => ({ ...prev, id }));
      toast.success("تم منوی میز ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره تم منو");
    } finally {
      setSavingId(null);
    }
  };

  const uploadBackground = async (file: File | null) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (file.size > RESERV_MENU_BG_MAX_BYTES) {
      toast.error("حجم فایل نباید بیشتر از ۱۵ مگابایت باشد");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_BASE}/api/settings/reserv-menu-background`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body,
      });
      const text = await response.text();
      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }
      if (!response.ok) {
        toast.error(
          response.status === 413
            ? "حجم فایل برای سرور زیاد است"
            : getApiErrorMessage(parsed || { message: text }, "آپلود پس‌زمینه ناموفق بود"),
        );
        return;
      }
      const next = parseReservMenuTheme(parsed);
      if (next) setConfig((prev) => ({ ...prev, backgroundUrl: next.backgroundUrl, backgroundType: next.backgroundType }));
      toast.success("پس‌زمینهٔ منو ذخیره شد");
    } catch {
      toast.error("خطا در آپلود پس‌زمینه");
    } finally {
      setUploading(false);
    }
  };

  const removeBackground = async () => {
    const token = tokenCode();
    if (!token) return;
    setUploading(true);
    try {
      const res = await apiRequestError("Delete", {}, {}, "/api/settings/reserv-menu-background", true, true, token);
      if (res?.hasError) {
        toast.error(typeof res.message === "string" ? res.message : "حذف پس‌زمینه ناموفق بود");
        return;
      }
      setConfig((prev) => ({ ...prev, backgroundUrl: null, backgroundType: null }));
      toast.success("پس‌زمینهٔ منو حذف شد");
    } finally {
      setUploading(false);
    }
  };

  const uploadIcon = async (file: File | null) => {
    if (iconFileRef.current) iconFileRef.current.value = "";
    if (!file) return;
    if (file.size > RESERV_MENU_ICON_MAX_BYTES) {
      toast.error("حجم آیکون نباید بیشتر از ۲ مگابایت باشد");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setIconUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_BASE}/api/settings/reserv-menu-icon`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body,
      });
      const text = await response.text();
      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }
      if (!response.ok) {
        toast.error(
          response.status === 413
            ? "حجم فایل برای سرور زیاد است"
            : getApiErrorMessage(parsed || { message: text }, "آپلود آیکون ناموفق بود"),
        );
        return;
      }
      const next = parseReservMenuTheme(parsed);
      if (next) setConfig((prev) => ({ ...prev, iconUrl: next.iconUrl }));
      toast.success("آیکون فروشگاه ذخیره شد");
    } catch {
      toast.error("خطا در آپلود آیکون");
    } finally {
      setIconUploading(false);
    }
  };

  const removeIcon = async () => {
    const token = tokenCode();
    if (!token) return;
    setIconUploading(true);
    try {
      const res = await apiRequestError("Delete", {}, {}, "/api/settings/reserv-menu-icon", true, true, token);
      if (res?.hasError) {
        toast.error(typeof res.message === "string" ? res.message : "حذف آیکون ناموفق بود");
        return;
      }
      setConfig((prev) => ({ ...prev, iconUrl: null }));
      toast.success("آیکون فروشگاه حذف شد");
    } finally {
      setIconUploading(false);
    }
  };

  const openLivePreview = (id: ReservMenuThemeId) => {
    const shopCode = getAdminShopCode();
    if (!shopCode) {
      toast.error("کد فروشگاه پیدا نشد");
      return;
    }
    const url = `${tableReservAbsoluteUrl(shopCode, 1)}?${RESERV_MENU_PREVIEW_QUERY}=${id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={18} sx={{ color: "var(--admin-accent)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1, display: "grid", gap: 1.25 }}>
      <Typography sx={{ fontSize: 11, color: "var(--admin-text-secondary)" }}>
        روی هر مدل بزنید تا برای منوی QR میزها فعال شود. «پیش‌نمایش زنده» همان مدل را با کالاهای خودتان نشان می‌دهد
        (در پیش‌نمایش ثبت سفارش غیرفعال است).
      </Typography>

      <Box
        sx={{
          borderRadius: 1.5,
          border: "1px solid var(--admin-border)",
          bgcolor: "var(--admin-surface-alt, var(--admin-surface))",
          p: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "14px",
            overflow: "hidden",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: 18,
            bgcolor: "var(--admin-accent)",
            color: "var(--admin-on-accent)",
            border: "1px solid var(--admin-border)",
          }}
        >
          {config.iconUrl ? (
            <Box component="img" src={config.iconUrl} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            "آ"
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 160 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "var(--admin-text)" }}>آیکون فروشگاه</Typography>
          <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-secondary)", lineHeight: 1.55 }}>
            در هدر منوی میز به‌جای حرف اول نام نشان داده می‌شود. jpg، png، webp یا gif تا ۲ مگابایت.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="contained"
            startIcon={iconUploading ? <CircularProgress size={12} color="inherit" /> : <CloudUploadIcon />}
            disabled={iconUploading}
            onClick={() => iconFileRef.current?.click()}
            sx={{ ...smallBtnSx, color: "var(--admin-on-accent)", bgcolor: "var(--admin-accent)" }}
          >
            {config.iconUrl ? "تغییر آیکون" : "آپلود آیکون"}
          </Button>
          {config.iconUrl ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              disabled={iconUploading}
              onClick={() => void removeIcon()}
              sx={{ ...smallBtnSx, color: "#e57373" }}
            >
              حذف
            </Button>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 1 }}>
        {RESERV_MENU_THEMES.map((theme) => {
          const active = config.id === theme.id;
          return (
            <Box
              key={theme.id}
              sx={{
                borderRadius: 1.5,
                border: active ? "2px solid var(--admin-accent)" : "1px solid var(--admin-border)",
                boxShadow: active ? "0 0 0 1px var(--admin-accent)" : "none",
                bgcolor: "var(--admin-surface-alt, var(--admin-surface))",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => void selectTheme(theme.id)}
                sx={{ all: "unset", cursor: "pointer", display: "block", "&:hover .theme-title": { color: "var(--admin-accent)" } }}
              >
                <Box sx={{ px: 1, pt: 1, pb: 0.75, display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className="theme-title" sx={{ fontSize: 12.5, fontWeight: 800, color: "var(--admin-text)" }}>
                      {theme.title}
                      {theme.id === "classic" ? " (فعلی)" : ""}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-secondary)", lineHeight: 1.5 }}>
                      {theme.hint}
                    </Typography>
                  </Box>
                  {savingId === theme.id ? (
                    <CircularProgress size={16} sx={{ color: "var(--admin-accent)", flexShrink: 0 }} />
                  ) : active ? (
                    <CheckCircleIcon sx={{ fontSize: 18, color: "var(--admin-accent)", flexShrink: 0 }} />
                  ) : null}
                </Box>
                <Box sx={{ bgcolor: "#e8e8e8", py: 1 }}>
                  <ReservMenuThemePreview
                    themeId={theme.id}
                    backgroundUrl={config.backgroundUrl}
                    backgroundType={config.backgroundType}
                    iconUrl={config.iconUrl}
                    scale={0.48}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, p: 0.75, flexWrap: "wrap" }}>
                <Button size="small" variant="outlined" startIcon={<ZoomInIcon />} onClick={() => setZoomId(theme.id)} sx={smallBtnSx}>
                  بزرگ‌نمایی
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => openLivePreview(theme.id)}
                  sx={smallBtnSx}
                >
                  پیش‌نمایش زنده
                </Button>
              </Box>
              {theme.id === "video" ? (
                <Box sx={{ px: 0.75, pb: 0.9, display: "grid", gap: 0.6 }}>
                  <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-secondary)", lineHeight: 1.6 }}>
                    ویدیو (mp4، webm) یا تصویر متحرک (gif، webp) تا ۱۵ مگابایت. ویدیو بی‌صدا و تکرارشونده پخش می‌شود؛ ویدیوی
                    کوتاه و کم‌حجم سریع‌تر لود می‌شود.
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={uploading ? <CircularProgress size={12} color="inherit" /> : <CloudUploadIcon />}
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                      sx={{ ...smallBtnSx, color: "var(--admin-on-accent)", bgcolor: "var(--admin-accent)" }}
                    >
                      {config.backgroundUrl ? "تغییر پس‌زمینه" : "آپلود پس‌زمینه"}
                    </Button>
                    {config.backgroundUrl ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DeleteOutlineIcon />}
                        disabled={uploading}
                        onClick={() => void removeBackground()}
                        sx={{ ...smallBtnSx, color: "#e57373" }}
                      >
                        حذف
                      </Button>
                    ) : null}
                  </Box>
                  {!config.backgroundUrl ? (
                    <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)" }}>
                      تا آپلود نکنید، پس‌زمینهٔ متحرک پیش‌فرض نمایش داده می‌شود.
                    </Typography>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>

      <input
        ref={fileRef}
        type="file"
        accept={BG_ACCEPT}
        hidden
        onChange={(event) => void uploadBackground(event.target.files?.[0] || null)}
      />
      <input
        ref={iconFileRef}
        type="file"
        accept={ICON_ACCEPT}
        hidden
        onChange={(event) => void uploadIcon(event.target.files?.[0] || null)}
      />

      <Dialog open={Boolean(zoomId)} onClose={() => setZoomId(null)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ p: 2, bgcolor: "#e8e8e8" }}>
          {zoomId ? (
            <ReservMenuThemePreview
              themeId={zoomId}
              backgroundUrl={config.backgroundUrl}
              backgroundType={config.backgroundType}
              iconUrl={config.iconUrl}
              height={680}
              scrollable
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1, justifyContent: "space-between" }}>
          <Button onClick={() => setZoomId(null)} sx={{ color: "var(--admin-text-secondary)" }}>
            بستن
          </Button>
          {zoomId ? (
            <Button
              variant="contained"
              disabled={zoomId === config.id || Boolean(savingId)}
              onClick={() => {
                void selectTheme(zoomId);
                setZoomId(null);
              }}
              sx={{ bgcolor: "var(--admin-accent)", color: "var(--admin-on-accent)" }}
            >
              {zoomId === config.id ? "فعال است" : "انتخاب این مدل"}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
