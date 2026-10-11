"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import LogoutIcon from "@mui/icons-material/Logout";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getFirstAllowedAdminPath } from "@/app/lib/shopPermissions";
import { buildContractClauses, setShopContractRequired } from "@/app/lib/shopContract";

type ContractInfo = {
  version: string;
  required: boolean;
  accepted: boolean;
  shop_name?: string | null;
  phone?: string | null;
  owner_name?: string | null;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": {
    textAlign: "center",
    letterSpacing: "8px",
    fontSize: 20,
    direction: "ltr",
  },
} as const;

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export default function ShopContractPage() {
  const router = useRouter();
  const [info, setInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [readToEnd, setReadToEnd] = useState(false);
  const [agree, setAgree] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const leave = useCallback(() => {
    setShopContractRequired(false);
    window.location.href = getFirstAllowedAdminPath();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/admin/login");
      return;
    }
    void FetchWithJwtClient("GET", "/api/shop-contract", tokenCode()).then((res) => {
      if (!res || res.hasError) {
        toast.error(String(res?.message || "خطا در دریافت قرارداد"));
        setLoading(false);
        return;
      }
      const data = res as ContractInfo;
      if (!data.required) {
        leave();
        return;
      }
      setInfo(data);
      setLoading(false);
    });
  }, [router, leave]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const clauses = useMemo(() => buildContractClauses(info?.shop_name || ""), [info?.shop_name]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) setReadToEnd(true);
  }, []);

  useEffect(() => {
    // اگر متن کوتاه‌تر از کادر باشد، نیازی به اسکرول نیست
    const timer = window.setTimeout(checkScroll, 200);
    return () => window.clearTimeout(timer);
  }, [checkScroll, info]);

  const sendCode = async () => {
    setSending(true);
    const res = await FetchWithJwtClient("POST", "/api/shop-contract/send-code", tokenCode(), {}, {
      body: JSON.stringify({}),
    });
    setSending(false);
    if (!res || res.hasError) {
      if (res?.retry_after_seconds) setCooldown(Number(res.retry_after_seconds));
      toast.error(String(res?.message || "ارسال کد ناموفق بود"));
      return;
    }
    setCodeSent(true);
    setMaskedPhone(String(res.masked_phone || ""));
    setCooldown(Number(res.retry_after_seconds) || 60);
    setCode("");
    toast.success("کد تأیید ارسال شد");
  };

  const confirm = async () => {
    setConfirming(true);
    const res = await FetchWithJwtClient("POST", "/api/shop-contract/accept", tokenCode(), {}, {
      body: JSON.stringify({ code: toEnglishDigits(code), agree: true }),
    });
    setConfirming(false);
    if (!res || res.hasError) {
      toast.error(String(res?.message || "تأیید قرارداد ناموفق بود"));
      return;
    }
    toast.success("قرارداد تأیید شد");
    window.setTimeout(leave, 600);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShopContractRequired(false);
    router.push("/admin/login");
  };

  const codeDigits = toEnglishDigits(code).replace(/\D/g, "");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        display: "flex",
        justifyContent: "center",
        alignItems: { xs: "flex-start", sm: "center" },
        p: { xs: "12px", sm: "24px" },
        direction: "rtl",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 640,
          backgroundColor: "var(--admin-surface)",
          borderRadius: { xs: "16px", md: "20px" },
          p: { xs: "16px", sm: "28px" },
          border: "1px solid var(--admin-border)",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
          <GavelIcon sx={{ color: "var(--admin-accent)" }} />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 17, md: 20 }, color: "var(--admin-text)" }}>
            قرارداد استفاده از وبینو
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", mb: 2 }}>
          برای ادامه، متن زیر را تا انتها بخوانید، تیک پذیرش را بزنید و با کد پیامکی تأیید کنید.
        </Typography>

        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : !info ? (
          <Typography sx={{ color: "var(--admin-error)", textAlign: "center", py: 3 }}>
            دریافت قرارداد ممکن نشد. صفحه را دوباره باز کنید.
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
                mb: 1.5,
              }}
            >
              <Box sx={{ p: 1.25, borderRadius: "12px", border: "1px solid var(--admin-border)", backgroundColor: "var(--admin-surface-alt)" }}>
                <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", display: "flex", alignItems: "center", gap: 0.5 }}>
                  <StorefrontIcon sx={{ fontSize: 15 }} /> نام فروشگاه
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: "var(--admin-text)" }}>
                  {info.shop_name || "—"}
                </Typography>
              </Box>
              <Box sx={{ p: 1.25, borderRadius: "12px", border: "1px solid var(--admin-border)", backgroundColor: "var(--admin-surface-alt)" }}>
                <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", display: "flex", alignItems: "center", gap: 0.5 }}>
                  <PhoneIphoneIcon sx={{ fontSize: 15 }} /> شمارهٔ تماس طرف مقابل
                </Typography>
                <Typography dir="ltr" sx={{ fontWeight: 700, fontSize: 14, color: "var(--admin-text)", textAlign: "right" }}>
                  {info.phone || "—"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ position: "relative" }}>
              <Box
                ref={scrollRef}
                onScroll={checkScroll}
                sx={{
                  maxHeight: { xs: "46vh", sm: "400px" },
                  overflowY: "auto",
                  p: 1.5,
                  borderRadius: "12px",
                  border: "1px solid var(--admin-border)",
                  backgroundColor: "var(--admin-surface-alt)",
                  display: "grid",
                  gap: 1.5,
                }}
              >
                {clauses.map((clause) => (
                  <Box
                    key={clause.title}
                    sx={
                      clause.highlight
                        ? {
                            p: 1.25,
                            borderRadius: "10px",
                            border: "1px solid rgba(255,167,38,0.55)",
                            backgroundColor: "rgba(255,167,38,0.1)",
                          }
                        : undefined
                    }
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: clause.highlight ? "#ffa726" : "var(--admin-text)", mb: 0.5 }}>
                      {clause.title}
                    </Typography>
                    <Typography sx={{ fontSize: 13, lineHeight: 2, color: "var(--admin-text)", textAlign: "justify" }}>
                      {clause.body}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {!readToEnd && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "999px",
                    backgroundColor: "var(--admin-accent)",
                    color: "#fff",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    pointerEvents: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  }}
                >
                  <KeyboardDoubleArrowDownIcon sx={{ fontSize: 16 }} />
                  تا انتهای متن بخوانید
                </Box>
              )}
            </Box>

            <FormControlLabel
              sx={{ mt: 1.5, mr: 0, alignItems: "flex-start", opacity: readToEnd ? 1 : 0.5 }}
              control={
                <Checkbox
                  checked={agree}
                  disabled={!readToEnd || codeSent}
                  onChange={(e) => setAgree(e.target.checked)}
                  sx={{ pt: 0.25 }}
                />
              }
              label={
                <Typography sx={{ fontSize: 13, color: "var(--admin-text)", lineHeight: 1.9 }}>
                  متن قرارداد را کامل خوانده‌ام و با تمام مفاد آن، به‌ویژه سلب مسئولیت وبینو دربارهٔ پشتیبان‌گیری از داده‌ها، موافقم.
                </Typography>
              }
            />

            {!codeSent ? (
              <Button
                fullWidth
                variant="contained"
                disabled={!agree || sending}
                onClick={() => void sendCode()}
                sx={{ mt: 1.5, py: 1.1, borderRadius: "12px", backgroundColor: "var(--admin-accent)", fontWeight: 700 }}
              >
                {sending ? <CircularProgress size={20} color="inherit" /> : "ارسال کد تأیید به موبایل"}
              </Button>
            ) : (
              <Box sx={{ mt: 1.5, display: "grid", gap: 1.25 }}>
                <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", textAlign: "center" }}>
                  کد ۵ رقمی به شمارهٔ <span dir="ltr">{maskedPhone || info.phone}</span> پیامک شد.
                </Typography>
                <TextField
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 5))}
                  inputProps={{ inputMode: "numeric", maxLength: 5, autoComplete: "one-time-code" }}
                  placeholder="•••••"
                  sx={fieldSx}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && codeDigits.length === 5 && !confirming) void confirm();
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  disabled={codeDigits.length !== 5 || confirming}
                  onClick={() => void confirm()}
                  sx={{ py: 1.1, borderRadius: "12px", backgroundColor: "var(--admin-accent)", fontWeight: 700 }}
                >
                  {confirming ? <CircularProgress size={20} color="inherit" /> : "تأیید قرارداد و ورود به پنل"}
                </Button>
                <Button
                  disabled={cooldown > 0 || sending}
                  onClick={() => void sendCode()}
                  sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}
                >
                  {cooldown > 0 ? `ارسال دوباره کد تا ${cooldown} ثانیه دیگر` : "ارسال دوباره کد"}
                </Button>
              </Box>
            )}
          </>
        )}

        <Button
          onClick={logout}
          startIcon={<LogoutIcon />}
          fullWidth
          sx={{ mt: 2, color: "var(--admin-error)", textTransform: "none" }}
        >
          خروج از حساب
        </Button>
      </Box>
      <ToastContainer autoClose={3000} position="bottom-right" rtl />
    </Box>
  );
}
