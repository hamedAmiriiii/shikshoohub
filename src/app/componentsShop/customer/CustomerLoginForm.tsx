"use client";

import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PhoneIcon from "@mui/icons-material/Phone";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiRequestError } from "@/app/lib/apiRequestError";
import {
  customerRegisterPath,
  getCustomerToken,
  saveLastShopCode,
  setCustomerSession,
  shopApiPath,
  shopPath,
} from "@/app/lib/shopStorefront";
import { customerInputSx, customerPaperSx } from "./customerAuthStyles";

type CustomerLoginFormProps = {
  shopCode: string;
  redirectUrl?: string;
};

export default function CustomerLoginForm({ shopCode, redirectUrl = "" }: CustomerLoginFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const homePath = shopPath(shopCode);
  const afterLogin = redirectUrl || homePath;

  useEffect(() => {
    saveLastShopCode(shopCode);
    const token = getCustomerToken(shopCode);
    if (token) {
      router.replace(afterLogin);
    }
  }, [shopCode, afterLogin, router]);

  const handleLogin = async () => {
    if (!phone || !password) {
      toast.error("لطفاً شماره تلفن و رمز عبور را وارد کنید");
      return;
    }
    if (phone.length !== 11 || !phone.startsWith("09")) {
      toast.error("شماره تلفن معتبر نیست");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequestError(
        "Post",
        {},
        { phone, password },
        shopApiPath(shopCode, "/api/customer/login"),
        false,
        false,
        "",
      );
      setIsLoading(false);
      if (res.hasError) {
        let message = "خطا در ورود";
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
        toast.success("ورود با موفقیت انجام شد");
        window.dispatchEvent(new Event("customerLogin"));
        setTimeout(() => router.push(afterLogin), 100);
      } else {
        toast.error("خطا در ورود");
      }
    } catch {
      setIsLoading(false);
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const buttonEnabled = phone && password && !isLoading;

  return (
    <Paper elevation={0} sx={customerPaperSx}>
      <Typography
        variant="h6"
        sx={{ mb: 3, fontSize: "16px", color: "#fff", textAlign: "center", fontWeight: 500 }}
      >
        شماره همراه و رمز عبور خود را وارد کنید.
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

        <Button
          variant="contained"
          onClick={handleLogin}
          disabled={!buttonEnabled}
          fullWidth
          sx={{
            mt: 1,
            py: "12px",
            borderRadius: "14px",
            fontSize: "15px",
            fontWeight: 600,
            textTransform: "none",
            backgroundColor: buttonEnabled ? "#78b568" : "#505669",
            color: "#fff",
            boxShadow: "none",
            "&:hover": { backgroundColor: buttonEnabled ? "#5a9a4a" : "#505669" },
            "&:disabled": {
              backgroundColor: "#505669",
              color: "rgba(255,255,255,0.5)",
            },
          }}
        >
          {isLoading ? "در حال ورود..." : "ورود"}
        </Button>

        <Box sx={{ textAlign: "center", mt: 1 }}>
          <Button
            variant="text"
            onClick={() => router.push(customerRegisterPath(shopCode))}
            sx={{
              color: "#78b568",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
            }}
          >
            ثبت‌نام مشتری
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export function CustomerLoginLoading() {
  return (
    <Paper
      elevation={0}
      sx={{
        ...customerPaperSx,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "300px",
      }}
    >
      <CircularProgress sx={{ color: "#78b568" }} />
    </Paper>
  );
}
