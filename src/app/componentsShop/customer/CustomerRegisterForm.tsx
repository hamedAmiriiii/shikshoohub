"use client";

import {
  Box,
  Button,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PhoneIcon from "@mui/icons-material/Phone";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { apiRequestError } from "@/app/lib/apiRequestError";
import {
  customerLoginPath,
  getCustomerToken,
  saveLastShopCode,
  setCustomerSession,
  shopApiPath,
  shopPath,
} from "@/app/lib/shopStorefront";
import { customerInputSx, customerPaperSx } from "./customerAuthStyles";

type CustomerRegisterFormProps = {
  shopCode: string;
};

export default function CustomerRegisterForm({ shopCode }: CustomerRegisterFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", ""]);
  const [timer, setTimer] = useState<number>(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const homePath = shopPath(shopCode);

  useEffect(() => {
    saveLastShopCode(shopCode);
    const token = getCustomerToken(shopCode);
    if (token) {
      router.replace(homePath);
    }
  }, [shopCode, homePath, router]);

  useEffect(() => {
    if (step !== "verify" || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  const isPhoneValid = phone.length === 11 && phone.startsWith("09");
  const isFormValid = password && confirmPassword && password === confirmPassword;
  const code = codeDigits.join("");
  const isCodeValid = code.length === 5;

  const focusInput = (idx: number) => {
    const el = inputsRef.current[idx];
    if (el) el.focus();
  };

  const handleSendCode = async () => {
    if (!isPhoneValid) {
      toast.error("شماره تلفن معتبر نیست");
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiRequestError(
        "Post",
        {},
        { phone },
        shopApiPath(shopCode, "/api/customer-register/send-code"),
        false,
        false,
        "",
      );
      setIsLoading(false);
      if (res.hasError) {
        let message = "خطا در ارسال کد";
        try {
          const parsed = JSON.parse(res.errorText || "{}");
          message = parsed.message || message;
        } catch {
          message = res.message || message;
        }
        toast.error(message);
        return;
      }
      toast.success("کد تایید ارسال شد");
      setStep("verify");
      setTimer(110);
      setCodeDigits(["", "", "", "", ""]);
      focusInput(0);
    } catch {
      setIsLoading(false);
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const handleVerify = async () => {
    if (!isPhoneValid || !isCodeValid) {
      toast.error("لطفاً شماره و کد را تکمیل کنید");
      return;
    }
    if (!isFormValid) {
      toast.error("لطفاً رمز عبور را تکمیل و رمزها را یکسان کنید");
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiRequestError(
        "Post",
        {},
        { phone, code, password },
        shopApiPath(shopCode, "/api/customer-register/verify"),
        false,
        false,
        "",
      );
      setIsLoading(false);
      if (res.hasError) {
        let message = "خطا در ثبت نام";
        try {
          const parsed = JSON.parse(res.errorText || "{}");
          message = parsed.message || message;
        } catch {
          message = res.message || message;
        }
        toast.error(message);
        return;
      }
      if (res.token) {
        setCustomerSession(shopCode, res.token, res.customer);
        toast.success("ثبت‌نام و ورود با موفقیت انجام شد");
        window.dispatchEvent(new Event("customerLogin"));
        setTimeout(() => router.push(homePath), 100);
      } else {
        toast.success("ثبت‌نام با موفقیت انجام شد");
        setTimeout(() => router.push(customerLoginPath(shopCode)), 100);
      }
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

  const renderPhoneStep = () => (
    <>
      <Typography
        variant="h6"
        sx={{ mb: 3, fontSize: "16px", color: "#fff", textAlign: "center", fontWeight: 500 }}
      >
        شماره همراه خود را برای دریافت کد تأیید وارد کنید.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <TextField
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="شماره همراه"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
          sx={customerInputSx}
        />

        <Button
          variant="contained"
          onClick={handleSendCode}
          disabled={!isPhoneValid || isLoading}
          fullWidth
          sx={{
            mt: 1,
            py: "12px",
            borderRadius: "14px",
            fontSize: "15px",
            fontWeight: 600,
            textTransform: "none",
            backgroundColor: isPhoneValid ? "#78b568" : "#505669",
            color: "#fff",
            "&:hover": { backgroundColor: isPhoneValid ? "#5a9a4a" : "#505669" },
          }}
        >
          {isLoading ? "در حال ارسال..." : "دریافت کد یکبار مصرف"}
        </Button>

        <Box sx={{ textAlign: "center", mt: 1 }}>
          <Button
            variant="text"
            onClick={() => router.push(customerLoginPath(shopCode))}
            sx={{
              color: "#78b568",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ورود مشتری
          </Button>
        </Box>
      </Box>
    </>
  );

  const renderCodeInput = () => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        mt: 1,
        mb: 1,
        direction: "ltr",
      }}
    >
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

  const renderVerifyStep = () => (
    <>
      <Typography
        variant="h6"
        sx={{ mb: 2, fontSize: "16px", color: "#fff", textAlign: "center", fontWeight: 500 }}
      >
        کد تأیید ۵ رقمی ارسال‌شده را وارد کنید.
      </Typography>
      <Typography sx={{ textAlign: "center", color: "rgba(255,255,255,0.7)", mb: 2 }}>
        {phone}
      </Typography>

      {renderCodeInput()}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 1,
          mb: 2,
        }}
      >
        <Button
          variant="text"
          disabled={timer > 0}
          onClick={handleSendCode}
          sx={{ color: timer > 0 ? "rgba(255,255,255,0.3)" : "#78b568", textTransform: "none" }}
        >
          ارسال مجدد
        </Button>
        <Typography sx={{ color: "#78b568", fontWeight: 600 }}>
          {timer > 0
            ? `0${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`
            : ""}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", mt: 1 }}>
        <TextField
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="رمز عبور"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
          sx={customerInputSx}
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
          sx={customerInputSx}
        />
      </Box>

      <Button
        variant="contained"
        onClick={handleVerify}
        disabled={!isCodeValid || !isFormValid || isLoading}
        fullWidth
        sx={{
          mt: 2,
          py: "12px",
          borderRadius: "14px",
          fontWeight: 600,
          textTransform: "none",
          backgroundColor: isCodeValid && isFormValid ? "#78b568" : "#505669",
          color: "#fff",
        }}
      >
        {isLoading ? "در حال ثبت‌نام..." : "ثبت‌نام و ورود"}
      </Button>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button
          variant="text"
          onClick={() => {
            setStep("phone");
            setTimer(0);
            setCodeDigits(["", "", "", "", ""]);
          }}
          sx={{ color: "#ff9800", textTransform: "none", fontWeight: 600 }}
        >
          ویرایش شماره
        </Button>
      </Box>
    </>
  );

  return (
    <Paper elevation={0} sx={customerPaperSx}>
      {step === "phone" ? renderPhoneStep() : renderVerifyStep()}
    </Paper>
  );
}
