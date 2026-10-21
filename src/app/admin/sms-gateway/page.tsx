"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import SmsIcon from "@mui/icons-material/Sms";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { adminSurfaceCardSx } from "@/app/admin/theme/adminTheme";

type Provider = "shina" | "melipayamak";

type GatewaySettings = {
  provider: Provider;
  providers: Record<string, string>;
  melipayamak: {
    username: string;
    api_key_set: boolean;
    api_key_masked: string;
    from: string;
    otp_body_id: number | null;
    otp_vars_mode: "code" | "shop_code";
    credit_body_id: number | null;
  };
  shina: { gateway: string };
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    borderRadius: "10px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiFormHelperText-root": { color: "var(--admin-text-secondary)" },
};

export default function SmsGatewayPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditLabel, setCreditLabel] = useState<string | null>(null);

  const [provider, setProvider] = useState<Provider>("shina");
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyHint, setApiKeyHint] = useState("");
  const [from, setFrom] = useState("30008810852036");
  const [otpBodyId, setOtpBodyId] = useState("");
  const [creditBodyId, setCreditBodyId] = useState("564775");
  const [otpVarsMode, setOtpVarsMode] = useState<"code" | "shop_code">("shop_code");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = tokenCode();
      const res = (await FetchWithJwtClient("GET", "/api/admin/sms-gateway", token)) as
        | GatewaySettings
        | { message?: string };
      if (!res || typeof res !== "object" || !("provider" in res)) {
        toast.error((res as { message?: string })?.message || "خواندن تنظیمات ناموفق بود");
        return;
      }
      const data = res as GatewaySettings;
      setProvider(data.provider === "melipayamak" ? "melipayamak" : "shina");
      setUsername(data.melipayamak.username || "");
      setApiKey("");
      setApiKeyHint(
        data.melipayamak.api_key_set
          ? data.melipayamak.api_key_masked || "ذخیره‌شده"
          : "هنوز ذخیره نشده",
      );
      setFrom(data.melipayamak.from || "30008810852036");
      setOtpBodyId(
        data.melipayamak.otp_body_id != null ? String(data.melipayamak.otp_body_id) : "564703",
      );
      setOtpVarsMode(data.melipayamak.otp_vars_mode === "code" ? "code" : "shop_code");
      setCreditBodyId(
        data.melipayamak.credit_body_id != null ? String(data.melipayamak.credit_body_id) : "564775",
      );
    } catch {
      toast.error("خطا در دریافت تنظیمات درگاه پیامک");
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

  const save = async () => {
    setSaving(true);
    try {
      const token = tokenCode();
      const body: Record<string, string> = {
        provider,
        melipayamak_username: username.trim(),
        melipayamak_from: from.trim(),
        melipayamak_otp_body_id: otpBodyId.trim(),
        melipayamak_credit_body_id: creditBodyId.trim(),
        melipayamak_otp_vars_mode: otpVarsMode,
      };
      if (apiKey.trim() !== "") {
        body.melipayamak_api_key = apiKey.trim();
      }
      const res = await FetchWithJwtClient("PUT", "/api/admin/sms-gateway", token, {}, {
        body: JSON.stringify(body),
      });
      if (res?.message) {
        toast.success(res.message);
      } else {
        toast.success("ذخیره شد");
      }
      setApiKey("");
      await load();
    } catch {
      toast.error("ذخیره تنظیمات ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const checkCredit = async () => {
    setCreditLoading(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient("GET", "/api/admin/sms-gateway/credit", token);
      if (res?.ok && res.credit != null) {
        const value =
          typeof res.credit === "object"
            ? JSON.stringify(res.credit)
            : String(res.credit);
        setCreditLabel(value);
        toast.success("موجودی دریافت شد");
      } else {
        setCreditLabel(null);
        toast.error(res?.raw?.StrRetStatus || "دریافت موجودی ناموفق بود");
      }
    } catch {
      toast.error("خطا در استعلام موجودی");
    } finally {
      setCreditLoading(false);
    }
  };

  if (!allowed) return null;

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, direction: "rtl" }}>
      <ToastContainer position="top-center" rtl theme="dark" />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            bgcolor: "var(--admin-icon-muted-bg)",
          }}
        >
          <SmsIcon sx={{ color: "var(--admin-accent)" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
            درگاه پیامک سامانه
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mt: 0.5 }}>
            انتخاب کنید کل وبینو از شینا پیامک بزند یا از ملی پیامک.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={creditLoading ? <CircularProgress size={14} /> : <RefreshIcon />}
          onClick={() => void checkCredit()}
          disabled={creditLoading || loading}
          sx={{
            color: "var(--admin-accent)",
            borderColor: "var(--admin-border)",
            borderRadius: "10px",
            textTransform: "none",
          }}
        >
          استعلام موجودی
        </Button>
      </Box>

      {creditLabel != null && (
        <Typography sx={{ color: "var(--admin-accent)", mb: 2, fontSize: 14 }}>
          موجودی: {creditLabel}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ ...adminSurfaceCardSx, p: { xs: 2, md: 2.5 }, maxWidth: 720 }}>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, mb: 1 }}>
            پروایدر فعال
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 2.5 }}>
            <RadioGroup
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              <FormControlLabel
                value="shina"
                control={<Radio sx={{ color: "var(--admin-accent)" }} />}
                label={
                  <Typography sx={{ color: "var(--admin-text)" }}>
                    شینا پیامک (فعلی)
                  </Typography>
                }
              />
              <FormControlLabel
                value="melipayamak"
                control={<Radio sx={{ color: "var(--admin-accent)" }} />}
                label={
                  <Typography sx={{ color: "var(--admin-text)" }}>
                    ملی پیامک
                  </Typography>
                }
              />
            </RadioGroup>
          </FormControl>

          <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, mb: 1.5 }}>
            تنظیمات ملی پیامک
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="نام کاربری"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              helperText="همان نام کاربری ورود به پنل ملی‌پیامک؛ معمولاً با 09 شروع می‌شود و نباید به 98 تبدیل شود."
              fullWidth
              sx={fieldSx}
              inputProps={{ dir: "ltr" }}
            />
            <TextField
              label="API Key (رمز وب‌سرویس)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              helperText={`خالی بگذارید تا تغییر نکند · ${apiKeyHint}`}
              fullWidth
              type="password"
              autoComplete="new-password"
              sx={fieldSx}
              inputProps={{ dir: "ltr" }}
            />
            <TextField
              label="شماره خط اختصاصی (from)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              helperText="شماره خط اختصاصی پنل. خط عمومی با وب‌سرویس ارسال نمی‌شود."
              fullWidth
              sx={fieldSx}
              inputProps={{ dir: "ltr" }}
            />
            <TextField
              label="شناسه پترن OTP (bodyId)"
              value={otpBodyId}
              onChange={(e) => setOtpBodyId(e.target.value.replace(/\D/g, ""))}
              helperText="الگوی تأییدشده ۵۶۴۷۰۳. کد تأیید از خط خدماتی اشتراکی می‌رود و به لیست سیاه هم می‌رسد."
              fullWidth
              sx={fieldSx}
              inputProps={{ dir: "ltr" }}
            />
            <TextField
              select
              label="متغیرهای پترن OTP"
              value={otpVarsMode}
              onChange={(e) =>
                setOtpVarsMode(e.target.value === "code" ? "code" : "shop_code")
              }
              fullWidth
              sx={fieldSx}
            >
              <MenuItem value="shop_code">{"{0}"} عنوان یا نام فروشگاه، {"{1}"} کد</MenuItem>
              <MenuItem value="code">فقط کد (برای الگوی تک‌متغیره)</MenuItem>
            </TextField>
            <TextField
              label="شناسه پترن اعتبار باشگاه (bodyId)"
              value={creditBodyId}
              onChange={(e) => setCreditBodyId(e.target.value.replace(/\D/g, ""))}
              helperText="الگوی ۵۶۴۷۷۵: {0} نام فروشگاه، {1} نام مشتری، {2} مبلغ. تا تأیید پنل، ارسال این الگو رد می‌شود."
              fullWidth
              sx={fieldSx}
              inputProps={{ dir: "ltr" }}
            />
          </Box>

          <Typography
            sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 2, lineHeight: 1.7 }}
          >
            کد تأیید با الگوی ۵۶۴۷۰۳ و افزایش اعتبار باشگاه با الگوی ۵۶۴۷۷۵ از وب‌سرویس خدماتی می‌رود.
            الگوی باشگاه هنوز منتظر تأیید پنل است. بقیهٔ پیامک‌های فروشگاه با خط اختصاصی و لغو11 ارسال می‌شوند.
          </Typography>

          <Button
            variant="contained"
            onClick={() => void save()}
            disabled={saving}
            sx={{
              mt: 2.5,
              bgcolor: "var(--admin-accent)",
              color: "#fff",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
          >
            {saving ? "در حال ذخیره…" : "ذخیره تنظیمات"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
