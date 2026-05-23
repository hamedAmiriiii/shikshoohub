"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, Switch, FormControlLabel, TextField, Button, Alert } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import ShopSmsQuotaCard from "@/app/coponent/ShopSmsQuotaCard";
import AdminThemeToggle from "@/app/admin/theme/AdminThemeToggle";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import { startAdminOnboarding } from "@/app/admin/onboarding/AdminOnboardingProvider";
import MenuBookIcon from "@mui/icons-material/MenuBook";

export default function SettingsPage() {
  const router = useRouter();
  const [loyaltyCreditEnabled, setLoyaltyCreditEnabled] = useState(true);
  const [creditExpiryDays, setCreditExpiryDays] = useState<number>(60);
  const [installmentInterestRate, setInstallmentInterestRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingExpiry, setIsSavingExpiry] = useState(false);
  const [isSavingInterestRate, setIsSavingInterestRate] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = tokenCode();
        
        // Fetch loyalty credit settings
        const loyaltyRes = await apiRequestError("Get", {}, {}, `/api/settings/loyalty-credit`, true, true, token);
        
        if (!loyaltyRes.hasError) {
          // فرض می‌کنیم API یک object با فیلد enabled برمی‌گرداند
          if (loyaltyRes?.enabled !== undefined) {
            setLoyaltyCreditEnabled(loyaltyRes.enabled);
          } else if (typeof loyaltyRes === 'boolean') {
            setLoyaltyCreditEnabled(loyaltyRes);
          } else if (loyaltyRes?.data?.enabled !== undefined) {
            setLoyaltyCreditEnabled(loyaltyRes.data.enabled);
          }
        }
        
        // Fetch credit expiry days
        const expiryRes = await apiRequestError("Get", {}, {}, `/api/settings/credit_expiry_days`, true, true, token);
        
        if (!expiryRes.hasError) {
          if (expiryRes?.value) {
            setCreditExpiryDays(parseInt(expiryRes.value));
          } else if (expiryRes?.days) {
            setCreditExpiryDays(expiryRes.days);
          } else if (expiryRes?.data?.value) {
            setCreditExpiryDays(parseInt(expiryRes.data.value));
          }
        }
        
        // Fetch installment interest rate
        const interestRateRes = await apiRequestError("Get", {}, {}, `/api/settings/installment-interest-rate`, true, true, token);
        
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

  // Handle toggle loyalty credit
  const handleToggleLoyaltyCredit = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setIsUpdating(true);
    const token = tokenCode();

    try {
      const data = {
        enabled: newValue
      };

      const res = await apiRequestError("Post", {}, data, `/api/settings/loyalty-credit/toggle`, true, true, token);
      
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message || "خطا در تغییر تنظیمات";
        toast.error(readableMessage);
        // Revert to previous value on error
        setLoyaltyCreditEnabled(!newValue);
        return;
      }

      setLoyaltyCreditEnabled(newValue);
      toast.success(`باشگاه مشتریان ${newValue ? 'فعال' : 'غیرفعال'} شد`);
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("خطا در تغییر تنظیمات");
      // Revert to previous value on error
      setLoyaltyCreditEnabled(!newValue);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle save credit expiry days
  const handleSaveExpiryDays = async () => {
    if (creditExpiryDays < 1 || creditExpiryDays > 365) {
      toast.error("تعداد روز باید بین 1 تا 365 باشد");
      return;
    }

    setIsSavingExpiry(true);
    const token = tokenCode();

    try {
      const data = {
        days: creditExpiryDays
      };

      // Try POST first, if it fails try PUT
      let res = await apiRequestError("Post", {}, data, `/api/settings/credit-expiry-days`, true, true, token);
      
      if (res.hasError) {
        // If POST fails, try PUT
        res = await apiRequestError("Put", {}, data, `/api/settings/credit-expiry-days`, true, true, token);
      }
      
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message || "خطا در ذخیره تنظیمات";
        toast.error(readableMessage);
        return;
      }

      toast.success(res.message || "تعداد روز انقضای اعتبار با موفقیت تنظیم شد");
    } catch (error) {
      console.error("Error updating expiry days:", error);
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setIsSavingExpiry(false);
    }
  };

  // Handle save installment interest rate
  const handleSaveInterestRate = async () => {
    if (installmentInterestRate < 0 || installmentInterestRate > 100) {
      toast.error("نرخ سود باید بین 0 تا 100 باشد");
      return;
    }

    setIsSavingInterestRate(true);
    const token = tokenCode();

    try {
      const data = {
        rate: installmentInterestRate
      };

      // Try POST first, if it fails try PUT
      let res = await apiRequestError("Post", {}, data, `/api/settings/installment-interest-rate`, true, true, token);
      
      if (res.hasError) {
        // If POST fails, try PUT
        res = await apiRequestError("Put", {}, data, `/api/settings/installment-interest-rate`, true, true, token);
      }
      
      if (res.hasError) {
        const parsedResponse = JSON.parse(res.errorText);
        const readableMessage = parsedResponse.message || "خطا در ذخیره تنظیمات";
        toast.error(readableMessage);
        return;
      }

      toast.success(res.message || "نرخ سود اقساط با موفقیت تنظیم شد");
    } catch (error) {
      console.error("Error updating interest rate:", error);
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setIsSavingInterestRate(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, padding: "16px" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            onClick={() => router.push("/admin")}
            sx={{
              cursor: "pointer",
              marginLeft: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--admin-title-gradient)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.1)",
              }
            }}
          >
            <ArrowBackIcon sx={{ color: "var(--admin-text)" }} />
          </Box>
          <Typography sx={{ fontSize: "24px", color: "var(--admin-text)", fontWeight: "700" }}>
            تنظیمات
          </Typography>
        </Box>
      </Box>

      <Card sx={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)", marginBottom: "16px" }}>
        <CardContent sx={{ p: 0 }}>
          <AdminThemeToggle />
        </CardContent>
      </Card>

      <Card sx={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)", marginBottom: "16px" }}>
        <CardContent sx={{ py: 2, px: 2 }}>
          <Typography sx={{ color: "var(--admin-text)", fontSize: "18px", fontWeight: 600, mb: 0.5 }}>
            راهنمای شروع
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", mb: 2, lineHeight: 1.7 }}>
            آموزش گام‌به‌گام پنل فروشگاه (منو، فروش، ثبت کالا و …)
          </Typography>
          <Button
            variant="contained"
            startIcon={<MenuBookIcon />}
            onClick={() => startAdminOnboarding()}
            sx={{
              bgcolor: "var(--admin-accent)",
              color: "#fff",
              fontWeight: 600,
              "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "#fff" },
            }}
          >
            مشاهده راهنما
          </Button>
        </CardContent>
      </Card>

      <ShopSmsQuotaCard compact />
     
      {/* Settings Cards */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "18px" }}>
            در حال بارگذاری...
          </Typography>
        </Box>
      ) : (
        <Card sx={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px" }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: "var(--admin-text)", fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                  باشگاه مشتریان
                </Typography>
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>
                  با فعال کردن این گزینه، سیستم باشگاه مشتریان فعال می‌شود
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={loyaltyCreditEnabled}
                    onChange={handleToggleLoyaltyCredit}
                    disabled={isUpdating}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "var(--admin-accent)",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "var(--admin-accent)",
                      },
                    }}
                  />
                }
                label=""
                sx={{ margin: 0 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Credit Expiry Days Card */}
      {!loading && (
        <Card sx={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)", marginTop: "16px" }}>
          <CardContent>
            <Box sx={{ padding: "16px" }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                تعداد روز انقضای اعتبار
              </Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
                تعداد روزی که اعتبار مشتریان معتبر است (بین 1 تا 365 روز)
              </Typography>
              <Box sx={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <TextField
                  type="number"
                  value={creditExpiryDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 365) {
                      setCreditExpiryDays(value);
                    } else if (e.target.value === '') {
                      setCreditExpiryDays(0);
                    }
                  }}
                  inputProps={{
                    min: 1,
                    max: 365,
                    style: { color: 'var(--admin-text)', textAlign: 'center' }
                  }}
                  sx={{
                    width: { xs: "100%", sm: "150px" },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "var(--admin-surface)",
                      color: "var(--admin-text)",
                      "& fieldset": {
                        borderColor: "#505669",
                      },
                      "&:hover fieldset": {
                        borderColor: "var(--admin-accent)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "var(--admin-accent)",
                      },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveExpiryDays}
                  disabled={isSavingExpiry || creditExpiryDays < 1 || creditExpiryDays > 365}
                  sx={{
                    backgroundColor: "var(--admin-accent)",
                    color: "var(--admin-text)",
                    "&:hover": {
                      backgroundColor: "var(--admin-accent-hover)",
                    },
                    "&:disabled": {
                      backgroundColor: "#505669",
                      color: "var(--admin-text-secondary)",
                    },
                  }}
                >
                  {isSavingExpiry ? "در حال ذخیره..." : "ذخیره"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Installment Interest Rate Card */}
      {!loading && (
        <Card sx={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)", marginTop: "16px" }}>
          <CardContent>
            <Box sx={{ padding: "16px" }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                نرخ سود اقساط
              </Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
                نرخ سود ماهانه برای خریدهای اقساطی (بین 0 تا 100 درصد)
              </Typography>
              <Box sx={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <TextField
                  type="number"
                  value={installmentInterestRate}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      setInstallmentInterestRate(value);
                    } else if (e.target.value === '') {
                      setInstallmentInterestRate(0);
                    }
                  }}
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 0.1,
                    style: { color: 'var(--admin-text)', textAlign: 'center' }
                  }}
                  sx={{
                    width: { xs: "100%", sm: "150px" },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "var(--admin-surface)",
                      color: "var(--admin-text)",
                      "& fieldset": {
                        borderColor: "#505669",
                      },
                      "&:hover fieldset": {
                        borderColor: "var(--admin-accent)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "var(--admin-accent)",
                      },
                    },
                  }}
                />
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px" }}>
                  درصد
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveInterestRate}
                  disabled={isSavingInterestRate || installmentInterestRate < 0 || installmentInterestRate > 100}
                  sx={{
                    backgroundColor: "var(--admin-accent)",
                    color: "var(--admin-text)",
                    "&:hover": {
                      backgroundColor: "var(--admin-accent-hover)",
                    },
                    "&:disabled": {
                      backgroundColor: "#505669",
                      color: "var(--admin-text-secondary)",
                    },
                  }}
                >
                  {isSavingInterestRate ? "در حال ذخیره..." : "ذخیره"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}

