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
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import EventIcon from "@mui/icons-material/Event";
import PercentIcon from "@mui/icons-material/Percent";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PrintIcon from "@mui/icons-material/Print";
import ScaleIcon from "@mui/icons-material/Scale";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import ShopSmsQuotaCard from "@/app/coponent/ShopSmsQuotaCard";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import { startAdminOnboarding } from "@/app/admin/onboarding/AdminOnboardingProvider";
import {
  readAdminPosSettings,
  writeAdminPosSettings,
} from "@/app/lib/adminPosSettings";
import LoyaltyCreditTiersSettings from "@/app/admin/settings/LoyaltyCreditTiersSettings";
import {
  readSaleReceiptPrintSettings,
  writeSaleReceiptPrintSettings,
} from "@/app/lib/saleReceiptPrint";

const settingsCardSx = {
  backgroundColor: "var(--admin-surface)",
  borderRadius: "16px",
  border: "1px solid var(--admin-border)",
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
  mb: 1.5,
  overflow: "hidden",
};

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

function SettingsSectionCard({
  icon,
  title,
  hint,
  children,
  loading = false,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children?: React.ReactNode;
  loading?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <Card sx={settingsCardSx}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            mb: children ? 0 : 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, minWidth: 0, flex: 1 }}>
            <Box sx={{ color: "var(--admin-accent)", mt: 0.15, flexShrink: 0 }}>{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", fontWeight: 700 }}>
                {title}
              </Typography>
              {hint && (
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px", mt: 0.25 }}>
                  {hint}
                </Typography>
              )}
            </Box>
          </Box>
          {action}
        </Box>
        {loading ? (
          <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={24} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [loyaltyCreditEnabled, setLoyaltyCreditEnabled] = useState(true);
  const [creditExpiryDays, setCreditExpiryDays] = useState<number>(60);
  const [installmentInterestRate, setInstallmentInterestRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingExpiry, setIsSavingExpiry] = useState(false);
  const [isSavingInterestRate, setIsSavingInterestRate] = useState(false);
  const [showProductListOnMainPage, setShowProductListOnMainPage] = useState(false);
  const [menuMode, setMenuMode] = useState(false);
  const [installmentPaymentEnabled, setInstallmentPaymentEnabled] = useState(true);
  const [debtPaymentEnabled, setDebtPaymentEnabled] = useState(false);
  const [kgSalesEnabled, setKgSalesEnabled] = useState(false);
  const [restaurantCafeEnabled, setRestaurantCafeEnabled] = useState(false);
  const [menuTableOrdersPopupEnabled, setMenuTableOrdersPopupEnabled] = useState(false);
  const [directPrintEnabled, setDirectPrintEnabled] = useState(false);
  const [shopCardNumber, setShopCardNumber] = useState("");
  const [shopCardHolder, setShopCardHolder] = useState("");
  const [shopBankName, setShopBankName] = useState("");
  const [isSavingShopCard, setIsSavingShopCard] = useState(false);

  useEffect(() => {
    const settings = readAdminPosSettings();
    setShowProductListOnMainPage(settings.showProductListOnMainPage);
    setMenuMode(settings.menuMode);
    setInstallmentPaymentEnabled(settings.installmentPaymentEnabled);
    setDebtPaymentEnabled(settings.debtPaymentEnabled);
    setKgSalesEnabled(settings.kgSalesEnabled);
    setRestaurantCafeEnabled(settings.restaurantCafeEnabled);
    setMenuTableOrdersPopupEnabled(settings.menuTableOrdersPopupEnabled);
    setDirectPrintEnabled(readSaleReceiptPrintSettings().autoPrint);
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

  const handleToggleMenuMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setMenuMode(enabled);
    writeAdminPosSettings({ menuMode: enabled });
    toast.success(
      enabled
        ? "حالت منو فعال شد — صفحه فروش به نمای کارتی تغییر می‌کند"
        : "حالت منو غیرفعال شد",
    );
  };

  const handleToggleInstallmentPayment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setInstallmentPaymentEnabled(enabled);
    writeAdminPosSettings({ installmentPaymentEnabled: enabled });
    toast.success(
      enabled
        ? "گزینه‌های نقدی و اقساطی در صفحه فروش نمایش داده می‌شوند"
        : "گزینه‌های نقدی و اقساطی از صفحه فروش پنهان شدند",
    );
  };

  const handleToggleRestaurantCafe = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setRestaurantCafeEnabled(enabled);
    writeAdminPosSettings({ restaurantCafeEnabled: enabled });
    toast.success(
      enabled
        ? "حالت رستوران و کافه فعال شد — میز و سفارش حضوری در منو دیده می‌شود"
        : "حالت رستوران و کافه غیرفعال شد",
    );
  };

  const handleToggleMenuTableOrdersPopup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setMenuTableOrdersPopupEnabled(enabled);
    writeAdminPosSettings({ menuTableOrdersPopupEnabled: enabled });
    toast.success(
      enabled
        ? "پاپ‌آپ سفارش حضوری در حالت منو فعال شد"
        : "پاپ‌آپ سفارش حضوری در حالت منو غیرفعال شد",
    );
  };

  const handleToggleKgSales = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setKgSalesEnabled(enabled);
    writeAdminPosSettings({ kgSalesEnabled: enabled });
    toast.success(
      enabled
        ? "فروش محصولات کیلویی فعال شد — هنگام ثبت کالا می‌توانید واحد کیلو انتخاب کنید"
        : "فروش محصولات کیلویی غیرفعال شد",
    );
  };

  const handleToggleDebtPayment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setDebtPaymentEnabled(enabled);
    writeAdminPosSettings({ debtPaymentEnabled: enabled });
    toast.success(
      enabled
        ? "گزینه پرداخت نسیه در صفحه فروش فعال شد"
        : "گزینه پرداخت نسیه از صفحه فروش پنهان شد",
    );
  };

  const handleToggleDirectPrint = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setDirectPrintEnabled(enabled);
    writeSaleReceiptPrintSettings({ autoPrint: enabled });
    toast.success(
      enabled
        ? "حالت چاپ مستقیم فعال شد؛ پیش‌نمایش چاپ نمایش داده نمی‌شود"
        : "حالت پیش‌نمایش چاپ فعال شد",
    );
  };

  const handleSaveShopCard = async () => {
    const token = tokenCode();
    if (!token) return;
    setIsSavingShopCard(true);
    try {
      const entries = [
        ["shop_card_number", shopCardNumber.trim()],
        ["shop_card_holder", shopCardHolder.trim()],
        ["shop_bank_name", shopBankName.trim()],
      ] as const;
      for (const [key, value] of entries) {
        const res = await apiRequestError(
          "Put",
          {},
          { value: value || " " },
          `/api/settings/${key}`,
          true,
          true,
          token,
        );
        if (res?.hasError) {
          toast.error(typeof res.message === "string" ? res.message : "ذخیره کارت فروشگاه ناموفق بود");
          return;
        }
      }
      toast.success("مشخصات کارت فروشگاه ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره کارت فروشگاه");
    } finally {
      setIsSavingShopCard(false);
    }
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
        const allSettings = await apiRequestError(
          "Get",
          {},
          {},
          `/api/settings`,
          true,
          true,
          token,
        );
        if (!allSettings?.hasError && allSettings && typeof allSettings === "object") {
          const rows = allSettings as Record<string, unknown>;
          if (typeof rows.shop_card_number === "string") setShopCardNumber(rows.shop_card_number);
          if (typeof rows.shop_card_holder === "string") setShopCardHolder(rows.shop_card_holder);
          if (typeof rows.shop_bank_name === "string") setShopBankName(rows.shop_bank_name);
        }
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
          ...settingsCardSx,
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          "&:hover": { bgcolor: "var(--admin-menu-hover)" },
        }}
        onClick={() => startAdminOnboarding()}
      >
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MenuBookIcon sx={{ color: "var(--admin-accent)", fontSize: 22 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", fontWeight: 700 }}>
                راهنمای شروع
              </Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px" }}>
                آموزش گام‌به‌گام پنل
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "var(--admin-text-muted)", fontSize: 20 }} />
          </Box>
        </CardContent>
      </Card>

      <SettingsSectionCard
        icon={<TableRestaurantIcon sx={{ fontSize: 22 }} />}
        title="رستوران و کافه"
        hint="نمایش میزها و سفارش حضوری در منو، و بررسی سفارش‌های جدید هر ۳۰ ثانیه"
        action={
          <Switch
            size="small"
            checked={restaurantCafeEnabled}
            onChange={handleToggleRestaurantCafe}
            sx={switchSx}
          />
        }
      />

      {restaurantCafeEnabled ? (
      <SettingsSectionCard
        icon={<NotificationsActiveIcon sx={{ fontSize: 22 }} />}
        title="پاپ‌آپ سفارش حضوری در حالت منو"
        hint="وقتی سفارش جدید رسید، در صفحه فروش منو با همان کارت‌ها باز شود تا رسیدگی کنید"
        action={
          <Switch
            size="small"
            checked={menuTableOrdersPopupEnabled}
            onChange={handleToggleMenuTableOrdersPopup}
            sx={switchSx}
          />
        }
      />
      ) : null}

      {restaurantCafeEnabled ? (
      <Card
        sx={{
          ...settingsCardSx,
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          "&:hover": { bgcolor: "var(--admin-menu-hover)" },
        }}
        onClick={() => router.push("/admin/shop-tables")}
      >
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TableRestaurantIcon sx={{ color: "var(--admin-accent)", fontSize: 22 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", fontWeight: 700 }}>
                میزها و سفارش پای میز
              </Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px" }}>
                تعریف میز، لینک QR و سفارش‌های منتظر پرداخت
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "var(--admin-text-muted)", fontSize: 20 }} />
          </Box>
        </CardContent>
      </Card>
      ) : null}

   

      <SettingsSectionCard
        icon={<Inventory2Icon sx={{ fontSize: 22 }} />}
        title="لیست کالا در صفحه فروش"
        hint="جستجو و افزودن سریع به سبد از کش محلی"
        action={
          <Switch
            size="small"
            checked={showProductListOnMainPage}
            onChange={handleToggleProductListOnMainPage}
            disabled={menuMode}
            sx={switchSx}
          />
        }
      />

      <SettingsSectionCard
        icon={<RestaurantMenuIcon sx={{ fontSize: 22 }} />}
        title="حالت منو"
        hint="نمایش کارتی کالاها با فیلتر دسته‌بندی؛ جایگزین صفحه فروش عادی"
        action={
          <Switch
            size="small"
            checked={menuMode}
            onChange={handleToggleMenuMode}
            sx={switchSx}
          />
        }
      />

      <SettingsSectionCard
        icon={<PaymentsIcon sx={{ fontSize: 22 }} />}
        title="نحوه پرداخت در فروش"
        hint="نمایش گزینه نقدی و اقساطی هنگام ثبت فروش"
        action={
          <Switch
            size="small"
            checked={installmentPaymentEnabled}
            onChange={handleToggleInstallmentPayment}
            sx={switchSx}
          />
        }
      />

      <SettingsSectionCard
        icon={<AccountBalanceWalletIcon sx={{ fontSize: 22 }} />}
        title="پرداخت نسیه (قرضی)"
        hint="نمایش گزینه نسیه هنگام ثبت فروش؛ مشتری بدهکار می‌شود"
        action={
          <Switch
            size="small"
            checked={debtPaymentEnabled}
            onChange={handleToggleDebtPayment}
            sx={switchSx}
          />
        }
      />

      <SettingsSectionCard
        icon={<ScaleIcon sx={{ fontSize: 22 }} />}
        title="فروش محصولات کیلویی"
        hint="ثبت و فروش کالا با واحد کیلوگرم و مقدار اعشاری (مثل ۱.۳۵۰)"
        action={
          <Switch
            size="small"
            checked={kgSalesEnabled}
            onChange={handleToggleKgSales}
            sx={switchSx}
          />
        }
      />

      <SettingsSectionCard
        icon={<PrintIcon sx={{ fontSize: 22 }} />}
        title="چاپ مستقیم فاکتور"
        hint="با فعال‌سازی، پیش‌نمایش چاپ مخفی می‌شود و فاکتور مستقیم چاپ می‌گردد"
        action={
          <Switch
            size="small"
            checked={directPrintEnabled}
            onChange={handleToggleDirectPrint}
            sx={switchSx}
          />
        }
      />

      <SettingsSectionCard
        icon={<CreditCardIcon sx={{ fontSize: 22 }} />}
        title="کارت فروشگاه"
        hint="برای پرداخت کارت‌به‌کارت در سفارش پای میز"
      >
        <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1.2 }}>
          <TextField
            size="small"
            label="شماره کارت"
            value={shopCardNumber}
            onChange={(e) => setShopCardNumber(e.target.value)}
            inputProps={{ inputMode: "numeric" }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--admin-surface-alt)",
                color: "var(--admin-text)",
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
              "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
            }}
          />
          <TextField
            size="small"
            label="به نام"
            value={shopCardHolder}
            onChange={(e) => setShopCardHolder(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--admin-surface-alt)",
                color: "var(--admin-text)",
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
              "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
            }}
          />
          <TextField
            size="small"
            label="نام بانک"
            value={shopBankName}
            onChange={(e) => setShopBankName(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--admin-surface-alt)",
                color: "var(--admin-text)",
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
              "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
            }}
          />
          <Button
            size="small"
            variant="contained"
            disabled={isSavingShopCard}
            onClick={handleSaveShopCard}
            sx={{ ...saveBtnSx, alignSelf: "flex-end" }}
          >
            {isSavingShopCard ? "…" : "ذخیره"}
          </Button>
        </Box>
      </SettingsSectionCard>

<SettingsSectionCard
        icon={<LoyaltyIcon sx={{ fontSize: 22 }} />}
        title="باشگاه مشتریان"
        hint="اعتبار و امتیاز مشتری بر اساس مبلغ خرید"
        loading={loading}
        action={
          !loading ? (
            <Switch
              size="small"
              checked={loyaltyCreditEnabled}
              onChange={handleToggleLoyaltyCredit}
              disabled={isUpdating}
              sx={switchSx}
            />
          ) : undefined
        }
      >
        <Divider sx={{ borderColor: "var(--admin-divider)", my: 1.5 }} />
        <LoyaltyCreditTiersSettings disabled={!loyaltyCreditEnabled} />
      </SettingsSectionCard>



      {/* <SettingsSectionCard
        icon={<EventIcon sx={{ fontSize: 22 }} />}
        title="انقضای اعتبار"
        hint="مدت اعتبار مشتری · ۱ تا ۳۶۵ روز"
        loading={loading}
      >
        <Box
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: "1px solid var(--admin-divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
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
        </Box>
      </SettingsSectionCard> */}

      {/* <SettingsSectionCard
        icon={<PercentIcon sx={{ fontSize: 22 }} />}
        title="نرخ سود اقساط"
        hint="درصد ماهانه · ۰ تا ۱۰۰"
        loading={loading}
      >
        <Box
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: "1px solid var(--admin-divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
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
        </Box>
      </SettingsSectionCard> */}

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "76px", borderRadius: "15px" }}
        position="bottom-right"
      />
    </Box>
  );
}
