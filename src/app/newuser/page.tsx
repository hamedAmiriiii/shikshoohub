"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  getMarketerToken,
  marketerApi,
  setMarketerToken,
  toFaNumber,
  toLatinDigits,
  type MarketerDashboard,
} from "@/app/lib/marketing";
import { PayoutsTable, ReferralsTable, SummaryCards } from "./MarketerTables";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiFormHelperText-root": { color: "var(--admin-text-muted)" },
} as const;

const primaryButtonSx = {
  bgcolor: "var(--admin-accent)",
  "&:hover": { bgcolor: "var(--admin-accent-hover)" },
  fontWeight: 700,
} as const;

const cardSx = {
  backgroundColor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "16px",
} as const;

function LoginCard({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async () => {
    const normalized = toLatinDigits(phone).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(normalized)) {
      setError("شماره موبایل را درست وارد کنید (مثل ۰۹۱۲۱۲۳۴۵۶۷).");
      return;
    }
    setBusy(true);
    setError("");
    const res = await marketerApi.sendCode(normalized);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setPhone(normalized);
    setStep("code");
    setInfo(res.data.message);
    setResendIn(res.data.resend_after_seconds ?? 90);
  };

  const verify = async () => {
    const normalizedCode = toLatinDigits(code).replace(/\D/g, "");
    if (normalizedCode.length < 4) {
      setError("کد پیامک‌شده را وارد کنید.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await marketerApi.verify(phone, normalizedCode);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMarketerToken(res.data.token);
    onLoggedIn();
  };

  return (
    <Card sx={{ ...cardSx, maxWidth: 420, mx: "auto" }}>
      <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 800, fontSize: "20px" }}>
            پنل بازاریابی وبینو
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mt: 0.5 }}>
            با شماره موبایل وارد شوید، لینک اختصاصی‌تان را بگیرید و از هر خرید زیرمجموعه‌ها پورسانت بگیرید.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {!error && info && step === "code" ? <Alert severity="success">{info}</Alert> : null}

        {step === "phone" ? (
          <>
            <TextField
              label="شماره موبایل"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendCode()}
              inputProps={{ inputMode: "tel", dir: "ltr", maxLength: 14 }}
              sx={fieldSx}
              fullWidth
              autoFocus
            />
            <Button variant="contained" onClick={() => void sendCode()} disabled={busy} sx={primaryButtonSx}>
              {busy ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "دریافت کد"}
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="کد پیامک‌شده"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void verify()}
              inputProps={{ inputMode: "numeric", dir: "ltr", maxLength: 6, autoComplete: "one-time-code" }}
              helperText={`کد به ${phone} ارسال شد`}
              sx={fieldSx}
              fullWidth
              autoFocus
            />
            <Button variant="contained" onClick={() => void verify()} disabled={busy} sx={primaryButtonSx}>
              {busy ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "ورود"}
            </Button>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                size="small"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError("");
                }}
                sx={{ color: "var(--admin-text-secondary)" }}
              >
                تغییر شماره
              </Button>
              <Button
                size="small"
                disabled={resendIn > 0 || busy}
                onClick={() => void sendCode()}
                sx={{ color: "var(--admin-accent)" }}
              >
                {resendIn > 0 ? `ارسال دوباره (${toFaNumber(resendIn)})` : "ارسال دوباره"}
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileForm({ data, onSaved }: { data: MarketerDashboard; onSaved: () => void }) {
  const [name, setName] = useState(data.marketer.name || "");
  const [card, setCard] = useState(data.marketer.card_number || "");
  const [sheba, setSheba] = useState(data.marketer.sheba || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    const res = await marketerApi.updateProfile({ name, card_number: card, sheba });
    setBusy(false);
    if (!res.ok) {
      setMessage({ type: "error", text: res.message });
      return;
    }
    setMessage({ type: "success", text: "اطلاعات ذخیره شد." });
    onSaved();
  };

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxWidth: 480 }}>
        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px" }}>
          برای واریز پورسانت، شماره کارت یا شبا را کامل کنید.
        </Typography>
        {message ? <Alert severity={message.type}>{message.text}</Alert> : null}
        <TextField label="نام و نام خانوادگی" value={name} onChange={(e) => setName(e.target.value)} sx={fieldSx} />
        <TextField
          label="شماره کارت"
          value={card}
          onChange={(e) => setCard(e.target.value)}
          inputProps={{ inputMode: "numeric", dir: "ltr", maxLength: 19 }}
          sx={fieldSx}
        />
        <TextField
          label="شماره شبا"
          value={sheba}
          onChange={(e) => setSheba(e.target.value)}
          inputProps={{ dir: "ltr", maxLength: 32 }}
          placeholder="IR..."
          sx={fieldSx}
        />
        <Button variant="contained" onClick={() => void save()} disabled={busy} sx={{ ...primaryButtonSx, alignSelf: "flex-start" }}>
          {busy ? "…" : "ذخیره"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Dashboard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [data, setData] = useState<MarketerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"all" | "paid" | "payouts" | "profile">("all");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await marketerApi.dashboard();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setMarketerToken(null);
        onLoggedOut();
        return;
      }
      setError(res.message);
      setLoading(false);
      return;
    }
    setData(res.data);
    setError("");
    setLoading(false);
  }, [onLoggedOut]);

  useEffect(() => {
    void load();
  }, [load]);

  const paidReferrals = useMemo(() => (data?.referrals ?? []).filter((r) => r.is_paid), [data]);

  const copyLink = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.marketer.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("لینک را کپی کنید:", data.marketer.referral_link);
    }
  };

  const shareLink = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "وبینو",
          text: "نرم‌افزار فروشگاهی وبینو را امتحان کنید:",
          url: data.marketer.referral_link,
        });
      } catch {
        /* کاربر لغو کرد */
      }
      return;
    }
    void copyLink();
  };

  const logout = async () => {
    await marketerApi.logout();
    setMarketerToken(null);
    onLoggedOut();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: "var(--admin-accent)" }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void load()}>
            تلاش دوباره
          </Button>
        }
      >
        {error || "خطا در دریافت اطلاعات"}
      </Alert>
    );
  }

  const { marketer, summary } = data;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Box>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 800, fontSize: { xs: "20px", md: "24px" } }}>
            {marketer.name ? `سلام ${marketer.name}` : "پنل بازاریابی"}
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", direction: "ltr", textAlign: "right" }}>
            {marketer.phone}
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<LogoutIcon />}
          onClick={() => void logout()}
          sx={{ color: "var(--admin-text-secondary)", "& .MuiButton-startIcon": { ml: 0.5, mr: 0 } }}
        >
          خروج
        </Button>
      </Box>

      <Card sx={cardSx}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700 }}>لینک اختصاصی شما</Typography>
          <Box
            sx={{
              p: 1.25,
              borderRadius: "10px",
              backgroundColor: "var(--admin-surface-alt)",
              border: "1px dashed var(--admin-border)",
              direction: "ltr",
              fontFamily: "monospace",
              fontSize: "14px",
              color: "var(--admin-accent)",
              wordBreak: "break-all",
            }}
          >
            {marketer.referral_link}
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<ContentCopyIcon />}
              onClick={() => void copyLink()}
              sx={{ ...primaryButtonSx, "& .MuiButton-startIcon": { ml: 0.5, mr: 0 } }}
            >
              {copied ? "کپی شد" : "کپی لینک"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={() => void shareLink()}
              sx={{
                color: "var(--admin-accent)",
                borderColor: "var(--admin-accent)",
                "& .MuiButton-startIcon": { ml: 0.5, mr: 0 },
              }}
            >
              اشتراک‌گذاری
            </Button>
          </Box>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", lineHeight: 1.9 }}>
            کد معرف شما (عدد ۴ رقمی): <b style={{ direction: "ltr" }}>{marketer.code}</b> — هر کس با این لینک وارد سایت شود و تا{" "}
            {toFaNumber(data.attribution_days ?? 60)} روز بعد ثبت‌نام کند، زیرمجموعهٔ شما می‌شود و از هر خرید اکانت پولی
            او {toFaNumber(marketer.commission_percent)}٪ پورسانت می‌گیرید. می‌توانید <span dir="ltr">?mref={marketer.code}</span>{" "}
            را به آخر هر صفحه‌ای از سایت هم اضافه کنید.
          </Typography>
        </CardContent>
      </Card>

      <SummaryCards summary={summary} percent={marketer.commission_percent} />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          minHeight: 40,
          "& .MuiTab-root": { color: "var(--admin-text-muted)", minHeight: 40 },
          "& .Mui-selected": { color: "var(--admin-accent) !important" },
          "& .MuiTabs-indicator": { backgroundColor: "var(--admin-accent)" },
        }}
      >
        <Tab value="all" label={`زیرمجموعه‌ها (${toFaNumber(data.referrals.length)})`} />
        <Tab value="paid" label={`خریداران (${toFaNumber(paidReferrals.length)})`} />
        <Tab value="payouts" label="تسویه‌ها" />
        <Tab value="profile" label="اطلاعات حساب" />
      </Tabs>

      {tab === "all" ? (
        <ReferralsTable rows={data.referrals} emptyText="هنوز کسی با لینک شما ثبت‌نام نکرده است." />
      ) : null}
      {tab === "paid" ? (
        <ReferralsTable rows={paidReferrals} emptyText="هنوز هیچ‌کدام از زیرمجموعه‌ها اکانت پولی نخریده‌اند." />
      ) : null}
      {tab === "payouts" ? <PayoutsTable rows={data.payouts} /> : null}
      {tab === "profile" ? <ProfileForm data={data} onSaved={() => void load()} /> : null}
    </Box>
  );
}

export default function MarketerPanelPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getMarketerToken()));
    setReady(true);
  }, []);

  const handleLoggedOut = useCallback(() => setLoggedIn(false), []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        py: { xs: 3, md: 5 },
        px: 2,
        direction: "rtl",
      }}
    >
      <Container maxWidth="lg">
        {!ready ? null : loggedIn ? (
          <Dashboard onLoggedOut={handleLoggedOut} />
        ) : (
          <Box sx={{ pt: { xs: 4, md: 8 } }}>
            <LoginCard onLoggedIn={() => setLoggedIn(true)} />
          </Box>
        )}
      </Container>
    </Box>
  );
}
