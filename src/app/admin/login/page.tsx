"use client";

import { Box, Button, TextField, Typography, InputAdornment } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import PhoneNumberInput from "@/app/coponent/PhoneNumberInput/PhoneNumberInput";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import LockIcon from "@mui/icons-material/Lock";
import PhoneIcon from "@mui/icons-material/Phone";
import {
  formatAccessEndDate,
  mergeUserWithShopAccess,
  notifyShopAccessIfExpired,
  syncShopAccessFromLogin,
} from "@/app/lib/shopAccess";

type View = "login" | "forgot-phone" | "forgot-reset";

const CODE_VALID_SECONDS = 10 * 60;
const RESEND_MIN_SECONDS = 90;

function parseErrorBody(res: {
  errorText?: string;
  message?: string;
}): { message?: string; retry_after_seconds?: number } {
  if (res.message) return { message: String(res.message) };
  if (!res.errorText) return {};
  try {
    const j = JSON.parse(res.errorText) as Record<string, unknown>;
    return {
      message: typeof j.message === "string" ? j.message : undefined,
      retry_after_seconds:
        typeof j.retry_after_seconds === "number" ? j.retry_after_seconds : undefined,
    };
  } catch {
    return { message: res.errorText };
  }
}

function parseErrorMessage(res: { errorText?: string; message?: string }): string {
  const { message } = parseErrorBody(res);
  return message || "خطا در انجام عملیات";
}

const passwordFieldSx = {
  "& .MuiInputLabel-root": {
    color: "#ff9100",
    fontSize: { xs: "14px", md: "16px" },
  },
  "& .MuiOutlinedInput-root": {
    color: "#ff9100",
    fontSize: { xs: "14px", md: "16px" },
    "& fieldset": {
      borderRadius: { xs: "12px", md: "15px" },
      borderColor: "#1976d2",
    },
    "&.Mui-focused fieldset": { borderColor: "#1976d2" },
  },
  "& input": {
    padding: { xs: "12px 14px", md: "14px 16px" },
  },
} as const;

const forgotInputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    backgroundColor: "#1a1d2e",
    color: "#fff",
    "& fieldset": { borderColor: "#505669" },
    "&:hover fieldset": { borderColor: "#78b568" },
    "&.Mui-focused fieldset": { borderColor: "#78b568" },
  },
  "& .MuiInputBase-input": {
    padding: "14px 16px",
    fontSize: "15px",
    color: "#fff",
  },
} as const;

const cardSx = {
  width: "100%",
  maxWidth: { xs: "calc(100% - 0px)", sm: "420px", md: "450px" },
  backgroundColor: "#2b3143",
  borderRadius: { xs: "16px", md: "20px" },
  padding: { xs: "16px", sm: "28px", md: "32px" },
  border: "1px solid rgba(55, 84, 165, 0.3)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  marginTop: { xs: "20px", sm: "0" },
  boxSizing: "border-box",
} as const;

const primaryBtnSx = {
  borderRadius: { xs: "20px", md: "25px" },
  width: "100%",
  height: { xs: "48px", md: "56px" },
  fontWeight: "600",
  fontSize: { xs: "14px", md: "16px" },
  textTransform: "none",
} as const;

export default function ShikshooLoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [phon, setPhon] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const isPhoneValid = phon.length === 11 && phon.startsWith("09");
  const code = codeDigits.join("");
  const isCodeValid = code.length === 5;
  const isCodeExpired = view === "forgot-reset" && codeTimer === 0;
  const isResetFormValid =
    newPassword.length >= 6 && newPassword === confirmPassword && isCodeValid;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/admin");
    }
  }, [router]);

  useEffect(() => {
    if (codeTimer <= 0) return;
    const id = setInterval(() => setCodeTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [codeTimer]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const formatCountdown = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  const onChangePhone = (e: string) => {
    setPhon(!e.startsWith("0") ? "0" + e : e);
  };

  const focusInput = (idx: number) => {
    inputsRef.current[idx]?.focus();
  };

  const startCodeTimer = () => setCodeTimer(CODE_VALID_SECONDS);

  const startResendTimer = (seconds: number = RESEND_MIN_SECONDS) => {
    setResendTimer(Math.max(0, Math.ceil(seconds)));
  };

  const goToLogin = () => {
    setView("login");
    setCodeDigits(["", "", "", "", ""]);
    setCodeTimer(0);
    setResendTimer(0);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleCodeChange = (value: string, idx: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...codeDigits];
    next[idx] = value;
    setCodeDigits(next);
    if (value && idx < 4) focusInput(idx + 1);
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !codeDigits[idx] && idx > 0) {
      focusInput(idx - 1);
    }
  };

  const handleSendResetCode = async () => {
    if (!isPhoneValid) {
      toast.error("شماره همراه معتبر نیست (۱۱ رقم، شروع با ۰۹)");
      return;
    }

    setIsLoading(true);
    try {
      const res = await FetchWithJwtClient("POST", "/api/reset-password/send-code", { phone: phon });

      if (!res || res.hasError) {
        const { message, retry_after_seconds } = parseErrorBody(res || {});
        if (res?.statusCode === 404) {
          toast.error(message || "این شماره در سیستم ثبت نشده است");
          return;
        }
        if (res?.statusCode === 429) {
          const wait = retry_after_seconds ?? RESEND_MIN_SECONDS;
          startResendTimer(wait);
          toast.error(
            message || `لطفاً ${formatCountdown(wait)} دیگر برای ارسال مجدد صبر کنید`,
          );
          return;
        }
        toast.error(message || "خطا در ارسال کد");
        return;
      }

      toast.success("کد بازیابی رمز به شماره شما ارسال شد");
      startCodeTimer();
      startResendTimer();
      setCodeDigits(["", "", "", "", ""]);
      setView("forgot-reset");
      setTimeout(() => focusInput(0), 100);
    } catch {
      toast.error("خطا در اتصال به سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isPhoneValid) {
      toast.error("شماره همراه معتبر نیست");
      return;
    }
    if (!isCodeValid) {
      toast.error("کد تأیید ۵ رقمی را وارد کنید");
      return;
    }
    if (isCodeExpired) {
      toast.error("زمان اعتبار کد تمام شد. کد جدید دریافت کنید");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    setIsLoading(true);
    try {
      const res = await FetchWithJwtClient("POST", "/api/reset-password", {
        phone: phon,
        verification_code: code,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (!res || res.hasError) {
        const { message } = parseErrorBody(res || {});
        if (res?.statusCode === 422) {
          toast.error(message || "کد تأیید نامعتبر است یا منقضی شده است");
          return;
        }
        toast.error(message || "خطا در تغییر رمز عبور");
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("shop_access_expired");

      toast.success("رمز عبور با موفقیت تغییر کرد. اکنون وارد شوید");
      setPassword("");
      goToLogin();
    } catch {
      toast.error("خطا در اتصال به سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const send = async () => {
    if (!phon || !password) {
      toast.error("لطفاً تمام فیلدها را پر کنید");
      return;
    }
    if (!isPhoneValid) {
      toast.error("شماره تلفن معتبر نیست");
      return;
    }

    setIsLoading(true);
    try {
      const res = await FetchWithJwtClient("POST", "/api/auth/login", { username: phon, password });

      if (!res || res.hasError) {
        if (res?.statusCode === 403) {
          notifyShopAccessIfExpired(res as Record<string, unknown>);
          const end = res.shop_access_ends_at as string | undefined;
          const days = res.shop_access_days_remaining as number | undefined;
          let msg = parseErrorMessage(res);
          if (end) {
            msg = `اعتبار فروشگاه به پایان رسیده است (پایان: ${formatAccessEndDate(end)}`;
            if (days != null) msg += `، ${days.toLocaleString("fa-IR")} روز`;
            msg += ")";
          }
          toast.error(msg);
          return;
        }
        toast.error(parseErrorMessage(res || {}));
        return;
      }

      if (res.user && res.token) {
        localStorage.setItem("token", res.token);
        const user = mergeUserWithShopAccess(
          res.user as Record<string, unknown>,
          res as Record<string, unknown>,
        );
        localStorage.setItem("user", JSON.stringify(user));
        syncShopAccessFromLogin(res as Record<string, unknown>);
        toast.success("ورود با موفقیت انجام شد");
        router.push("/admin");
      }
    } catch {
      toast.error("خطا در اتصال به سرور");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCodeBoxes = () => (
    <Box sx={{ display: "flex", justifyContent: "center", gap: "10px", mt: 1, mb: 1, direction: "ltr" }}>
      {codeDigits.map((d, idx) => (
        <TextField
          key={idx}
          inputRef={(el) => {
            inputsRef.current[idx] = el;
          }}
          value={d}
          onChange={(e) => handleCodeChange(e.target.value, idx)}
          onKeyDown={(e) => handleCodeKeyDown(e, idx)}
          disabled={isLoading}
          inputProps={{
            maxLength: 1,
            inputMode: "numeric",
            style: { textAlign: "center", fontSize: "18px", direction: "ltr" },
          }}
          sx={{
            width: "50px",
            direction: "ltr",
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: "#1a1d2e",
              color: "#fff",
              "& fieldset": { borderColor: "#505669" },
              "&:hover fieldset": { borderColor: "#78b568" },
              "&.Mui-focused fieldset": { borderColor: "#78b568" },
            },
            "& .MuiInputBase-input": { color: "#fff" },
          }}
        />
      ))}
    </Box>
  );

  const renderLogin = () => (
    <>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#fff",
          textAlign: "center",
          mb: { xs: 3, md: 4 },
          fontSize: { xs: "18px", sm: "20px", md: "24px" },
        }}
      >
        ورود به فروشگاه
      </Typography>

      <Box sx={{ mb: { xs: 2, md: 3 }, overflow: "hidden" }}>
        <PhoneNumberInput defaultValue="" onChange={onChangePhone} name="phoneNumber" />
      </Box>

      <Box sx={{ mb: 1 }}>
        <TextField
          fullWidth
          name="password"
          label="کلمه عبور"
          variant="outlined"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          inputProps={{ maxLength: 15, minLength: 6 }}
          required
          disabled={isLoading}
          sx={passwordFieldSx}
        />
      </Box>

      <Box sx={{ textAlign: "left", mb: 2 }}>
        <Button
          variant="text"
          onClick={() => setView("forgot-phone")}
          disabled={isLoading}
          sx={{
            color: "#78b568",
            textTransform: "none",
            fontSize: "13px",
            p: 0,
            minWidth: 0,
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          فراموشی رمز عبور
        </Button>
      </Box>

      <Box display="flex" flexDirection="column" gap={1.5}>
        <Button
          onClick={send}
          disabled={isLoading || !phon || !password}
          variant="contained"
          sx={{
            ...primaryBtnSx,
            bgcolor: phon && password && !isLoading ? "#1976d2" : "#8e9191",
            "&:hover": { bgcolor: phon && password && !isLoading ? "#1565c0" : "#8e9191" },
          }}
        >
          {isLoading ? "در حال ورود..." : "ورود"}
        </Button>
        <Button
          onClick={() => router.push("/admin/register-shop")}
          disabled={isLoading}
          variant="outlined"
          sx={{
            ...primaryBtnSx,
            borderColor: "#78b568",
            color: "#78b568",
            "&:hover": { borderColor: "#5a9a4a", bgcolor: "rgba(120, 181, 104, 0.08)" },
          }}
        >
          ثبت‌نام فروشگاه
        </Button>
      </Box>
    </>
  );

  const renderForgotPhone = () => (
    <>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: "#fff", textAlign: "center", mb: 1, fontSize: "20px" }}
      >
        بازیابی رمز عبور
      </Typography>
      <Typography
        variant="body2"
        sx={{ mb: 3, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 1.7 }}
      >
        شماره همراه ثبت‌شده را وارد کنید. کد ۵ رقمی پیامکی ارسال می‌شود (اعتبار ۱۰ دقیقه).
      </Typography>

      <TextField
        value={phon}
        onChange={(e) => setPhon(e.target.value.replace(/\D/g, "").slice(0, 11))}
        placeholder="شماره همراه (مثال ۰۹۱۲۳۴۵۶۷۸۹)"
        fullWidth
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PhoneIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{ ...forgotInputSx, mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleSendResetCode}
        disabled={!isPhoneValid || isLoading}
        fullWidth
        sx={{
          ...primaryBtnSx,
          borderRadius: "14px",
          bgcolor: isPhoneValid ? "#78b568" : "#505669",
          "&:hover": { bgcolor: isPhoneValid ? "#5a9a4a" : "#505669" },
        }}
      >
        {isLoading ? "در حال ارسال..." : "دریافت کد پیامکی"}
      </Button>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button
          variant="text"
          onClick={goToLogin}
          sx={{
            color: "#ff9800",
            textTransform: "none",
            fontSize: "14px",
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          بازگشت به ورود
        </Button>
      </Box>
    </>
  );

  const renderForgotReset = () => (
    <>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: "#fff", textAlign: "center", mb: 1, fontSize: "20px" }}
      >
        رمز عبور جدید
      </Typography>
      <Typography sx={{ textAlign: "center", color: "rgba(255,255,255,0.7)", mb: 2, fontSize: "14px" }}>
        کد به شماره <strong style={{ color: "#fff" }}>{phon}</strong> ارسال شد.
      </Typography>

      <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", mb: 0.5 }}>
        کد تأیید ۵ رقمی
      </Typography>
      {codeTimer > 0 ? (
        <Typography sx={{ mb: 1, fontSize: "13px", color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
          اعتبار کد:{" "}
          <Box component="span" sx={{ color: "#78b568", fontWeight: 700 }}>
            {formatCountdown(codeTimer)}
          </Box>
        </Typography>
      ) : (
        <Typography sx={{ mb: 1, fontSize: "13px", color: "#ff9800", textAlign: "center", fontWeight: 600 }}>
          زمان اعتبار کد تمام شد — کد جدید دریافت کنید
        </Typography>
      )}
      {renderCodeBoxes()}

      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Button
          variant="text"
          disabled={resendTimer > 0 || isLoading}
          onClick={handleSendResetCode}
          sx={{
            color: resendTimer > 0 ? "rgba(255,255,255,0.35)" : "#78b568",
            textTransform: "none",
          }}
        >
          {resendTimer > 0
            ? `ارسال مجدد (${formatCountdown(resendTimer)})`
            : "ارسال مجدد کد"}
        </Button>
      </Box>

      <TextField
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)"
        fullWidth
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{ ...forgotInputSx, mb: 1.5 }}
      />
      <TextField
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="تکرار رمز عبور جدید"
        fullWidth
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{ ...forgotInputSx, mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleResetPassword}
        disabled={!isResetFormValid || isLoading || isCodeExpired}
        fullWidth
        sx={{
          ...primaryBtnSx,
          borderRadius: "14px",
          bgcolor: isResetFormValid && !isCodeExpired ? "#1976d2" : "#505669",
          "&:hover": {
            bgcolor: isResetFormValid && !isCodeExpired ? "#1565c0" : "#505669",
          },
        }}
      >
        {isLoading ? "در حال ذخیره..." : "تغییر رمز و ورود"}
      </Button>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2, flexWrap: "wrap" }}>
        <Button
          variant="text"
          onClick={() => {
            setView("forgot-phone");
            setCodeTimer(0);
            setCodeDigits(["", "", "", "", ""]);
          }}
          sx={{
            color: "#ff9800",
            textTransform: "none",
            fontSize: "14px",
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          ویرایش شماره
        </Button>
        <Button
          variant="text"
          onClick={goToLogin}
          sx={{
            color: "rgba(255,255,255,0.65)",
            textTransform: "none",
            fontSize: "14px",
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          بازگشت به ورود
        </Button>
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: { xs: "flex-start", sm: "center" },
        alignItems: "center",
        padding: { xs: "12px", sm: "20px", md: "24px" },
        paddingTop: { xs: "40px", sm: "20px" },
        boxSizing: "border-box",
        direction: "rtl",
      }}
    >
      <Box sx={cardSx}>
        {view === "login" && renderLogin()}
        {view === "forgot-phone" && renderForgotPhone()}
        {view === "forgot-reset" && renderForgotReset()}
      </Box>

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "72px", borderRadius: "15px" }}
        position="bottom-right"
        rtl
      />
    </Box>
  );
}
