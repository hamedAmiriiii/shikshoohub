"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  TextField,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import ShopSmsQuotaCard from "@/app/coponent/ShopSmsQuotaCard";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import { startAdminOnboarding } from "@/app/admin/onboarding/AdminOnboardingProvider";
import {
  readAdminPosSettings,
  writeAdminPosSettings,
} from "@/app/lib/adminPosSettings";

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "var(--admin-accent)",
  },
};

const fieldSx = {
  width: 88,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: "14px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": { py: 0.75, textAlign: "center" },
};

const saveBtnSx = {
  ...adminButtonStartIconSx,
  minWidth: 72,
  py: 0.75,
  fontSize: "13px",
  bgcolor: "var(--admin-accent)",
  color: "#fff",
  "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "#fff" },
  "&.Mui-disabled": {
    bgcolor: "var(--admin-border)",
    color: "var(--admin-text-secondary)",
  },
};

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        py: 1.25,
        px: 1.5,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", fontWeight: 600 }}>
          {label}
        </Typography>
        {hint && (
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px", mt: 0.25 }}>
            {hint}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

export default function SettingsPage() {
  const [loyaltyCreditEnabled, setLoyaltyCreditEnabled] = useState(true);
  const [creditExpiryDays, setCreditExpiryDays] = useState<number>(60);
  const [installmentInterestRate, setInstallmentInterestRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingExpiry, setIsSavingExpiry] = useState(false);
  const [isSavingInterestRate, setIsSavingInterestRate] = useState(false);
  const [showProductListOnMainPage, setShowProductListOnMainPage] = useState(false);

  useEffect(() => {
    setShowProductListOnMainPage(readAdminPosSettings().showProductListOnMainPage);
  }, []);

  const handleToggleProductListOnMainPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const enabled = event.target.checked;
    setShowProductListOnMainPage(enabled);
    writeAdminPosSettings({ showProductListOnMainPage: enabled });
    toast.success(
      enabled
        ? "لیست کالا در صفحه فروش نمایش داده می‌شود"
        : "لیست کالا از صفحه فروش پنهان شد",
    );
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = tokenCode();

        const loyaltyRes = await apiRequestError(
          "Get",
          {},
          {},
          `/api/settings/loyalty-credit`,
          true,
          true,
          token,
        );
        if (!loyaltyRes.hasError) {
          if (loyaltyRes?.enabled !== undefined) {
            setLoyaltyCreditEnabled(loyaltyRes.enabled);
          } else if (typeof loyaltyRes === "boolean") {
            setLoyaltyCreditEnabled(loyaltyRes);
          } else if (loyaltyRes?.data?.enabled !== undefined) {
            setLoyaltyCreditEnabled(loyaltyRes.data.enabled);
          }
        }

        const expiryRes = await apiRequestError(
          "Get",
          {},
          {},
          `/api/settings/credit_expiry_days`,
          true,
          true,
          token,
        );
        if (!expiryRes.hasError) {
          if (expiryRes?.value) {
            setCreditExpiryDays(parseInt(expiryRes.value, 10));
          } else if (expiryRes?.days) {
            setCreditExpiryDays(expiryRes.days);
          } else if (expiryRes?.data?.value) {
            setCreditExpiryDays(parseInt(expiryRes.data.value, 10));
          }
        }

        const interestRateRes = await apiRequestError(
          "Get",
          {},
          {},
          `/api/settings/installment-interest-rate`,
          true,
          true,
          token,
        );
        if (!interestRateRes.hasError) {
          if (interestRateRes?.rate !== undefined) {
            setInstallmentInterestRate(parseFloat(interestRateRes.rate));
          } else if (interestRateRes?.data?.rate !== undefined) {
            setInstallmentInterestRate(parseFloat(interestRateRes.data.rate));
          } else if (interestRateRes?.value !== undefined) {
            setInstallmentInterestRate(parseFloat(interestRateRes.value));
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("خطا در دریافت تنظیمات");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleLoyaltyCredit = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setIsUpdating(true);
    const token = tokenCode();
    try {
      const res = await apiRequestError(
        "Post",
        {},
        { enabled: newValue },
        `/api/settings/loyalty-credit/toggle`,
        true,
        true,
        token,
      );
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        toast.error(parsedResponse.message || "خطا در تغییر تنظیمات");
        setLoyaltyCreditEnabled(!newValue);
        return;
      }
      setLoyaltyCreditEnabled(newValue);
      toast.success(`باشگاه مشتریان ${newValue ? "فعال" : "غیرفعال"} شد`);
    } catch {
      toast.error("خطا در تغییر تنظیمات");
      setLoyaltyCreditEnabled(!newValue);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveExpiryDays = async () => {
    if (creditExpiryDays < 1 || creditExpiryDays > 365) {
      toast.error("بین ۱ تا ۳۶۵ روز");
      return;
    }
    setIsSavingExpiry(true);
    const token = tokenCode();
    try {
      let res = await apiRequestError(
        "Post",
        {},
        { days: creditExpiryDays },
        `/api/settings/credit-expiry-days`,
        true,
        true,
        token,
      );
      if (res.hasError) {
        res = await apiRequestError(
          "Put",
          {},
          { days: creditExpiryDays },
          `/api/settings/credit-expiry-days`,
          true,
          true,
          token,
        );
      }
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        toast.error(parsedResponse.message || "خطا در ذخیره");
        return;
      }
      toast.success(res.message || "ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setIsSavingExpiry(false);
    }
  };

  const handleSaveInterestRate = async () => {
    if (installmentInterestRate < 0 || installmentInterestRate > 100) {
      toast.error("بین ۰ تا ۱۰۰ درصد");
      return;
    }
    setIsSavingInterestRate(true);
    const token = tokenCode();
    try {
      let res = await apiRequestError(
        "Post",
        {},
        { rate: installmentInterestRate },
        `/api/settings/installment-interest-rate`,
        true,
        true,
        token,
      );
      if (res.hasError) {
        res = await apiRequestError(
          "Put",
          {},
          { rate: installmentInterestRate },
          `/api/settings/installment-interest-rate`,
          true,
          true,
          token,
        );
      }
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        toast.error(parsedResponse.message || "خطا در ذخیره");
        return;
      }
      toast.success(res.message || "ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setIsSavingInterestRate(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <ShopSmsQuotaCard compact />

      <Card
        sx={{
          mt: 1.5,
          bgcolor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => startAdminOnboarding()}
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            border: "none",
            bgcolor: "transparent",
            cursor: "pointer",
            py: 1.25,
            px: 1.5,
            textAlign: "right",
            "&:hover": { bgcolor: "var(--admin-menu-hover)" },
          }}
        >
          <MenuBookIcon sx={{ color: "var(--admin-accent)", fontSize: 22, ml: 1 }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", fontWeight: 600 }}>
              راهنمای شروع
            </Typography>
            <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px" }}>
              آموزش گام‌به‌گام پنل
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ color: "var(--admin-text-muted)", fontSize: 20 }} />
        </Box>

        <Divider sx={{ borderColor: "var(--admin-divider)" }} />

        {loading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <SettingRow label="باشگاه مشتریان" hint="اعتبار و امتیاز مشتری">
              <Switch
                size="small"
                checked={loyaltyCreditEnabled}
                onChange={handleToggleLoyaltyCredit}
                disabled={isUpdating}
                sx={switchSx}
              />
            </SettingRow>

            <Divider sx={{ borderColor: "var(--admin-divider)" }} />

            <SettingRow
              label="لیست کالا در صفحه فروش"
              hint="جستجو و افزودن سریع به سبد از کش محلی"
            >
              <Switch
                size="small"
                checked={showProductListOnMainPage}
                onChange={handleToggleProductListOnMainPage}
                sx={switchSx}
              />
            </SettingRow>

            <Divider sx={{ borderColor: "var(--admin-divider)" }} />

            <SettingRow label="انقضای اعتبار" hint="۱ تا ۳۶۵ روز">
              <TextField
                size="small"
                type="number"
                value={creditExpiryDays}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 1 && value <= 365) {
                    setCreditExpiryDays(value);
                  } else if (e.target.value === "") {
                    setCreditExpiryDays(0);
                  }
                }}
                inputProps={{ min: 1, max: 365 }}
                sx={fieldSx}
              />
              <Button
                size="small"
                variant="contained"
                disabled={isSavingExpiry || creditExpiryDays < 1 || creditExpiryDays > 365}
                onClick={handleSaveExpiryDays}
                sx={saveBtnSx}
              >
                {isSavingExpiry ? "…" : "ذخیره"}
              </Button>
            </SettingRow>

            <Divider sx={{ borderColor: "var(--admin-divider)" }} />

            <SettingRow label="نرخ سود اقساط" hint="درصد ماهانه · ۰ تا ۱۰۰">
              <TextField
                size="small"
                type="number"
                value={installmentInterestRate}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    setInstallmentInterestRate(value);
                  } else if (e.target.value === "") {
                    setInstallmentInterestRate(0);
                  }
                }}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                sx={fieldSx}
              />
              <Button
                size="small"
                variant="contained"
                disabled={
                  isSavingInterestRate ||
                  installmentInterestRate < 0 ||
                  installmentInterestRate > 100
                }
                onClick={handleSaveInterestRate}
                sx={saveBtnSx}
              >
                {isSavingInterestRate ? "…" : "ذخیره"}
              </Button>
            </SettingRow>
          </CardContent>
        )}
      </Card>

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "76px", borderRadius: "15px" }}
        position="bottom-right"
      />
    </Box>
  );
}
