"use client";

import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  InputAdornment,
} from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { apiRequestError } from "@/app/lib/apiRequestError";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import PhoneIcon from "@mui/icons-material/Phone";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import StorefrontIcon from "@mui/icons-material/Storefront";

type Step = "phone" | "register";

function parseErrorBody(errorText: string | undefined): {
  message?: string;
  retry_after_seconds?: number;
} {
  if (!errorText) return {};
  try {
    const j = JSON.parse(errorText) as Record<string, unknown>;
    return {
      message: typeof j.message === "string" ? j.message : undefined,
      retry_after_seconds:
        typeof j.retry_after_seconds === "number" ? j.retry_after_seconds : undefined,
    };
  } catch {
    return { message: errorText };
  }
}

/** تایمر واحد: اعتبار کد و فاصلهٔ ارسال مجدد (۵ دقیقه) */
const CODE_TIMER_SECONDS = 5 * 60;

export default function RegisterShopPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [atelierName, setAtelierName] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (codeTimer <= 0) return;
    const id = setInterval(() => setCodeTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [codeTimer]);

  const formatCountdown = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  const isCodeExpired = step === "register" && codeTimer === 0;

  const gradientBg = "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)";

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#2b3143",
      color: "#fff",
      "& fieldset": { borderColor: "#505669" },
      "&:hover fieldset": { borderColor: "#78b568" },
      "&.Mui-focused fieldset": { borderColor: "#78b568" },
    },
    "& .MuiInputBase-input": {
      padding: "14px 16px",
      fontSize: "15px",
      color: "#fff",
      "&:-webkit-autofill": {
        WebkitBoxShadow: "0 0 0 100px #2b3143 inset !important",
        WebkitTextFillColor: "#fff !important",
        caretColor: "#fff",
        transition: "background-color 5000s ease-in-out 0s",
      },
    },
    "& .MuiInputBase-input::placeholder": {
      color: "rgba(255,255,255,0.5)",
      opacity: 1,
    },
  } as const;

  const isPhoneValid = phone.length === 11 && phone.startsWith("09");
  const nationalOk = /^\d{10}$/.test(nationalCode);
  const code = codeDigits.join("");
  const isCodeValid = code.length === 5;
  const isFormValid =
    name.trim() &&
    lastName.trim() &&
    atelierName.trim() &&
    nationalOk &&
    password.length >= 6 &&
    password === confirmPassword;

  const focusInput = (idx: number) => {
    const el = inputsRef.current[idx];
    if (el) el.focus();
  };

  const startCodeTimer = (seconds: number = CODE_TIMER_SECONDS) => {
    setCodeTimer(Math.max(0, Math.ceil(seconds)));
  };

  const handleSendPhoneCode = async () => {
    if (!isPhoneValid) {
      toast.error("شماره همراه معتبر نیست (۱۱ رقم، شروع با ۰۹)");
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiRequestError(
        "Post",
        {},
        { phone },
        "/api/auth/register/send-phone-code",
        false,
        false,
        "",
      );
      setIsLoading(false);


      if (res.hasError) {
        const { message, retry_after_seconds } = parseErrorBody(res.errorText);
        if (res.statusCode === 429) {
          const wait = retry_after_seconds ?? CODE_TIMER_SECONDS;
          startCodeTimer(wait);
          toast.error(
            message ||
              `لطفاً ${formatCountdown(wait)} دیگر دوباره تلاش کنید.`,
          );
          return;
        }
        toast.error(message || "خطا در ارسال کد");
        return;
      }

      toast.success("کد تأیید به شماره شما ارسال شد");
      startCodeTimer();
      setStep("register");
      setCodeDigits(["", "", "", "", ""]);
      setTimeout(() => focusInput(0), 100);
    } catch {
      setIsLoading(false);
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const handleRegisterShop = async () => {
    if (!isPhoneValid) {
      toast.error("شماره همراه معتبر نیست");
      return;
    }
    if (!isFormValid) {
      toast.error("لطفاً همه فیلدها را درست پر کنید (کد ملی ۱۰ رقم، رمز حداقل ۶ کاراکتر و یکسان)");
      return;
    }
    if (!isCodeValid) {
      toast.error("کد تأیید ۵ رقمی را وارد کنید");
      return;
    }
    if (isCodeExpired) {
      toast.error("زمان اعتبار کد تمام شد. لطفاً کد جدید دریافت کنید.");
      return;
    }

    setIsLoading(true);
    try {
      const body = {
        name: name.trim(),
        last_name: lastName.trim(),
        type: [2],
        password,
        phone,
        atelier_name: atelierName.trim(),
        national_code: nationalCode,
        verification_code: code,
      };

      const res = await apiRequestError("Post", {}, body, "/api/auth/register", false, false, "");
      console.log("res : ",res);
      setIsLoading(false);

      if (res.hasError) {
        const { message } = parseErrorBody(res.errorText);
        if (res.statusCode === 422) {
          toast.error(message || "کد تأیید نامعتبر است یا منقضی شده است.");
          return;
        }
        toast.error(message || "ثبت‌نام انجام نشد");
        return;
      }

      toast.success("فروشگاه با موفقیت ثبت شد. اکنون می‌توانید وارد شوید.");
      setTimeout(() => router.push("/admin/login"), 1500);
    } catch {
      setIsLoading(false);
      toast.error("خطا در ارتباط با سرور");
    }
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
          onKeyDown={(e: React.KeyboardEvent) => handleCodeKeyDown(e, idx)}
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
              backgroundColor: "#2b3143",
              color: "#fff",
              direction: "ltr",
              "& fieldset": { borderColor: "#505669" },
              "&:hover fieldset": { borderColor: "#78b568" },
              "&.Mui-focused fieldset": { borderColor: "#78b568" },
            },
            "& .MuiInputBase-input": { color: "#fff", direction: "ltr" },
          }}
        />
      ))}
    </Box>
  );

  const renderPhoneStep = () => (
    <>
      <Typography
        variant="h5"
        sx={{ mb: 1, fontSize: "20px", color: "#fff", textAlign: "center", fontWeight: 700 }}
      >
        ثبت فروشگاه
      </Typography>
      <Typography
        variant="body2"
        sx={{ mb: 3, color: "rgba(255,255,255,0.75)", textAlign: "center" }}
      >
        ابتدا شماره همراه را وارد کنید تا کد تأیید پیامکی برای شما ارسال شود.
      </Typography>

      <TextField
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
        placeholder="شماره همراه (مثال ۰۹۱۲۳۴۵۶۷۸۹)"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PhoneIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }} />
            </InputAdornment>
          ),
        }}
        sx={{ ...inputSx, mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleSendPhoneCode}
        disabled={!isPhoneValid || isLoading}
        fullWidth
        sx={{
          py: "12px",
          borderRadius: "14px",
          fontSize: "15px",
          fontWeight: 600,
          textTransform: "none",
          backgroundColor: isPhoneValid ? "#78b568" : "#505669",
          color: "#fff",
          boxShadow: "none",
          "&:hover": { backgroundColor: isPhoneValid ? "#5a9a4a" : "#505669" },
          "&:disabled": { backgroundColor: "#505669", color: "rgba(255,255,255,0.5)" },
        }}
      >
        {isLoading ? "در حال ارسال..." : "دریافت کد پیامکی"}
      </Button>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button
          variant="text"
          onClick={() => router.push("/admin/login")}
          sx={{
            color: "#78b568",
            textTransform: "none",
            fontSize: "14px",
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          ورود به پنل فروشگاه
        </Button>
      </Box>
    </>
  );

  const renderRegisterStep = () => (
    <>
      <Typography
        variant="h5"
        sx={{ mb: 1, fontSize: "20px", color: "#fff", textAlign: "center", fontWeight: 700 }}
      >
        تکمیل ثبت‌نام
      </Typography>
      <Typography sx={{ textAlign: "center", color: "rgba(255,255,255,0.7)", mb: 2 }}>
        کد به شماره <strong style={{ color: "#fff" }}>{phone}</strong> ارسال شده است.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <TextField
          value={phone}
          disabled
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
        <TextField
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
        <TextField
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="نام خانوادگی"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
        <TextField
          value={atelierName}
          onChange={(e) => setAtelierName(e.target.value)}
          placeholder="نام فروشگاه / آتلیه"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <StorefrontIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
        <TextField
          value={nationalCode}
          onChange={(e) => setNationalCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="کد ملی (۱۰ رقم)"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PermIdentityIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
        <TextField
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="رمز عبور (حداقل ۶ کاراکتر)"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
        <TextField
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="تکرار رمز عبور"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
      </Box>

      <Typography sx={{ mt: 2, mb: 0.5, color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>
        کد تأیید ۵ رقمی
      </Typography>
      {codeTimer > 0 ? (
        <Typography sx={{ mb: 1, fontSize: "13px", color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
          زمان باقی‌مانده:{" "}
          <Box component="span" sx={{ color: "#78b568", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {formatCountdown(codeTimer)}
          </Box>
        </Typography>
      ) : (
        <Typography sx={{ mb: 1, fontSize: "13px", color: "#ff9800", textAlign: "center", fontWeight: 600 }}>
          زمان اعتبار کد تمام شد — کد جدید دریافت کنید
        </Typography>
      )}
      {renderCodeBoxes()}

      <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
        <Button
          variant="text"
          disabled={codeTimer > 0 || isLoading}
          onClick={handleSendPhoneCode}
          sx={{
            color: codeTimer > 0 ? "rgba(255,255,255,0.35)" : "#78b568",
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          ارسال مجدد کد
        </Button>
      </Box>

      <Button
        variant="contained"
        onClick={handleRegisterShop}
        disabled={!isFormValid || !isCodeValid || isLoading || isCodeExpired}
        fullWidth
        sx={{
          mt: 1,
          py: "12px",
          borderRadius: "14px",
          fontSize: "15px",
          fontWeight: 600,
          textTransform: "none",
          backgroundColor: isFormValid && isCodeValid && !isCodeExpired ? "#78b568" : "#505669",
          color: "#fff",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: isFormValid && isCodeValid && !isCodeExpired ? "#5a9a4a" : "#505669",
          },
          "&:disabled": { backgroundColor: "#505669", color: "rgba(255,255,255,0.5)" },
        }}
      >
        {isLoading ? "در حال ثبت..." : "ثبت فروشگاه"}
      </Button>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button
          variant="text"
          onClick={() => {
            setStep("phone");
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
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: gradientBg,
        padding: { xs: "16px", md: "24px" },
        direction: "rtl",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="sm" sx={{ width: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            padding: { xs: "24px", md: "28px" },
            borderRadius: "22px",
            backgroundColor: "#1a1d2e",
            border: "1px solid #505669",
            boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
          }}
        >
          {step === "phone" ? renderPhoneStep() : renderRegisterStep()}
        </Paper>
      </Container>
      <ToastContainer position="top-center" rtl />
    </Box>
  );
}
