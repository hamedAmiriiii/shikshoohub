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
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import GroupsIcon from "@mui/icons-material/Groups";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import {
  formatToman,
  getMarketerToken,
  marketerApi,
  setMarketerToken,
  toFaNumber,
  toLatinDigits,
  type MarketerDashboard,
  type MarketerSummary,
} from "@/app/lib/marketing";
import { PayoutsTable, ReferralsTable, StatCard } from "./MarketerTables";

type PanelView = "home" | "all" | "paid" | "payouts" | "profile";

const PANEL_TITLES: Record<PanelView, string> = {
  home: "خانه",
  all: "زیرمجموعه‌ها",
  paid: "خریداران",
  payouts: "تسویه‌ها",
  profile: "اطلاعات حساب",
};

function CompactSummary({ summary, percent }: { summary: MarketerSummary; percent: number }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
        gap: 1,
      }}
    >
      <StatCard label="بازدید" value={toFaNumber(summary.visitors_count)} />
      <StatCard label="ثبت‌نام" value={toFaNumber(summary.registered_count)} />
      <StatCard label="پورسانت" value={`${toFaNumber(percent)}٪`} />
      <StatCard label="مانده تسویه" value={formatToman(summary.balance_toman)} accent />
    </Box>
  );
}

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
  const [view, setView] = useState<PanelView>("home");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
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
  const menuOpen = Boolean(menuAnchor);

  const openView = (next: PanelView) => {
    setView(next);
    setMenuAnchor(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 720, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 800, fontSize: { xs: "18px", md: "22px" } }}>
            {marketer.name ? `سلام ${marketer.name}` : "پنل بازاریابی"}
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px" }}>
            {view === "home" ? <span dir="ltr">{marketer.phone}</span> : PANEL_TITLES[view]}
          </Typography>
        </Box>
        <IconButton aria-label="منو" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ color: "var(--admin-text)" }}>
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 220,
                bgcolor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text)",
              },
            },
          }}
        >
          <MenuItem selected={view === "home"} onClick={() => openView("home")}>
            <ListItemIcon sx={{ color: "var(--admin-text-secondary)", minWidth: 36 }}>
              <HomeOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="خانه" />
          </MenuItem>
          <MenuItem selected={view === "all"} onClick={() => openView("all")}>
            <ListItemIcon sx={{ color: "var(--admin-text-secondary)", minWidth: 36 }}>
              <GroupsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={`زیرمجموعه‌ها (${toFaNumber(data.referrals.length)})`} />
          </MenuItem>
          <MenuItem selected={view === "paid"} onClick={() => openView("paid")}>
            <ListItemIcon sx={{ color: "var(--admin-text-secondary)", minWidth: 36 }}>
              <ShoppingBagOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={`خریداران (${toFaNumber(paidReferrals.length)})`} />
          </MenuItem>
          <MenuItem selected={view === "payouts"} onClick={() => openView("payouts")}>
            <ListItemIcon sx={{ color: "var(--admin-text-secondary)", minWidth: 36 }}>
              <AccountBalanceWalletOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="تسویه‌ها" />
          </MenuItem>
          <MenuItem selected={view === "profile"} onClick={() => openView("profile")}>
            <ListItemIcon sx={{ color: "var(--admin-text-secondary)", minWidth: 36 }}>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="اطلاعات حساب" />
          </MenuItem>
          <Divider sx={{ borderColor: "var(--admin-border)", my: 0.5 }} />
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              void logout();
            }}
          >
            <ListItemIcon sx={{ color: "var(--admin-text-secondary)", minWidth: 36 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="خروج" />
          </MenuItem>
        </Menu>
      </Box>

      {view === "home" ? (
        <>
          <Card sx={cardSx}>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.25, py: 2, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
                <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 14 }}>لینک شما</Typography>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }} dir="ltr">
                  کد {marketer.code}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.1,
                  borderRadius: "10px",
                  backgroundColor: "var(--admin-surface-alt)",
                  border: "1px dashed var(--admin-border)",
                  direction: "ltr",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: "var(--admin-accent)",
                  wordBreak: "break-all",
                }}
              >
                {marketer.referral_link}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => void copyLink()}
                  sx={{ ...primaryButtonSx, flex: 1, "& .MuiButton-startIcon": { ml: 0.5, mr: 0 } }}
                >
                  {copied ? "کپی شد" : "کپی"}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={() => void shareLink()}
                  sx={{
                    flex: 1,
                    color: "var(--admin-accent)",
                    borderColor: "var(--admin-accent)",
                    "& .MuiButton-startIcon": { ml: 0.5, mr: 0 },
                  }}
                >
                  اشتراک
                </Button>
              </Box>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11.5px", lineHeight: 1.7 }}>
                تا {toFaNumber(data.attribution_days ?? 60)} روز بعد از کلیک، ثبت‌نام‌ها زیرمجموعه شما می‌شوند —{" "}
                {toFaNumber(marketer.commission_percent)}٪ از خرید اکانت پولی.
              </Typography>
            </CardContent>
          </Card>

          <CompactSummary summary={summary} percent={marketer.commission_percent} />
        </>
      ) : null}

      {view === "all" ? (
        <ReferralsTable rows={data.referrals} emptyText="هنوز کسی با لینک شما ثبت‌نام نکرده است." />
      ) : null}
      {view === "paid" ? (
        <ReferralsTable rows={paidReferrals} emptyText="هنوز هیچ‌کدام از زیرمجموعه‌ها اکانت پولی نخریده‌اند." />
      ) : null}
      {view === "payouts" ? <PayoutsTable rows={data.payouts} /> : null}
      {view === "profile" ? <ProfileForm data={data} onSaved={() => void load()} /> : null}
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
