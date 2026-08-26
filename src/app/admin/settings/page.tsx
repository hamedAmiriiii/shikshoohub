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
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PrintIcon from "@mui/icons-material/Print";
import ScaleIcon from "@mui/icons-material/Scale";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import KitchenIcon from "@mui/icons-material/Kitchen";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
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
  borderRadius: "10px",
  border: "1px solid var(--admin-border)",
  boxShadow: "none",
  mb: 1,
  overflow: "hidden",
};

const switchSx = {
  transform: "scale(0.85)",
  "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "var(--admin-accent)",
  },
};

const fieldSx = {
  width: 72,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: "13px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": { py: 0.5, textAlign: "center" },
};

const saveBtnSx = {
  ...adminButtonStartIconSx,
  minWidth: 64,
  py: 0.5,
  fontSize: "12px",
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
      <CardContent sx={{ py: 1, px: 1.25, "&:last-child": { pb: 1 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.75,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1 }}>
            <Box sx={{ color: "var(--admin-accent)", flexShrink: 0, display: "flex" }}>{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: "var(--admin-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: 1.25,
                }}
              >
                {title}
              </Typography>
              {hint && (
                <Typography
                  sx={{
                    color: "var(--admin-text-secondary)",
                    fontSize: "11px",
                    lineHeight: 1.3,
                    mt: 0.15,
                  }}
                >
                  {hint}
                </Typography>
              )}
            </Box>
          </Box>
          {action}
        </Box>
        {loading ? (
          <Box sx={{ py: 1.5, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={18} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function SettingsToggleRow({
  icon,
  title,
  hint,
  checked,
  onChange,
  disabled,
  last = false,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 0.75,
        py: 0.7,
        borderBottom: last ? "none" : "1px solid var(--admin-divider)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1 }}>
        <Box sx={{ color: "var(--admin-accent)", flexShrink: 0, display: "flex" }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ color: "var(--admin-text)", fontSize: "13px", fontWeight: 600, lineHeight: 1.25 }}
          >
            {title}
          </Typography>
          {hint ? (
            <Typography
              sx={{
                color: "var(--admin-text-secondary)",
                fontSize: "11px",
                lineHeight: 1.25,
                mt: 0.1,
              }}
            >
              {hint}
            </Typography>
          ) : null}
        </Box>
      </Box>
      <Switch
        size="small"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        sx={switchSx}
      />
    </Box>
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
  const [menuModeShowProductImages, setMenuModeShowProductImages] = useState(true);
  const [installmentPaymentEnabled, setInstallmentPaymentEnabled] = useState(true);
  const [debtPaymentEnabled, setDebtPaymentEnabled] = useState(false);
  const [chequePaymentEnabled, setChequePaymentEnabled] = useState(false);
  const [producedGoodsMenuEnabled, setProducedGoodsMenuEnabled] = useState(false);
  const [kgSalesEnabled, setKgSalesEnabled] = useState(false);
  const [salePriceEditEnabled, setSalePriceEditEnabled] = useState(false);
  const [classicPosMode, setClassicPosMode] = useState(false);
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
    setMenuModeShowProductImages(settings.menuModeShowProductImages);
    setInstallmentPaymentEnabled(settings.installmentPaymentEnabled);
    setDebtPaymentEnabled(settings.debtPaymentEnabled);
    setChequePaymentEnabled(settings.chequePaymentEnabled);
    setProducedGoodsMenuEnabled(settings.producedGoodsMenuEnabled);
    setKgSalesEnabled(settings.kgSalesEnabled);
    setSalePriceEditEnabled(settings.salePriceEditEnabled);
    setClassicPosMode(settings.classicPosMode);
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

  const handleToggleMenuModeShowProductImages = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const enabled = event.target.checked;
    setMenuModeShowProductImages(enabled);
    writeAdminPosSettings({ menuModeShowProductImages: enabled });
    toast.success(
      enabled
        ? "نمایش عکس کالا در حالت منو فعال شد"
        : "کارت‌های حالت منو بدون عکس نمایش داده می‌شوند",
    );
  };

  const handleToggleClassicPosMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setClassicPosMode(enabled);
    writeAdminPosSettings({ classicPosMode: enabled });
    toast.success(
      enabled
        ? "تم کلاسیک فاکتور فعال شد — با حالت منو هم قابل ترکیب است"
        : "تم کلاسیک فاکتور غیرفعال شد",
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

  const handleToggleSalePriceEdit = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setSalePriceEditEnabled(enabled);
    writeAdminPosSettings({ salePriceEditEnabled: enabled });
    toast.success(
      enabled
        ? "تغییر قیمت هنگام خرید فعال شد"
        : "تغییر قیمت هنگام خرید غیرفعال شد",
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

  const handleToggleChequePayment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setChequePaymentEnabled(enabled);
    writeAdminPosSettings({ chequePaymentEnabled: enabled });
    toast.success(
      enabled
        ? "گزینه فروش چکی در صفحه فروش فعال شد"
        : "گزینه فروش چکی از صفحه فروش پنهان شد",
    );
  };

  const handleToggleProducedGoodsMenu = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setProducedGoodsMenuEnabled(enabled);
    writeAdminPosSettings({ producedGoodsMenuEnabled: enabled });
    toast.success(
      enabled
        ? "«کالاهای تولیدی» در منوی مدیریت کالا نمایش داده می‌شود"
        : "«کالاهای تولیدی» از منوی مدیریت کالا پنهان شد",
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
    <Box sx={{ ...adminPageSx, p: 1.5, pb: 12 }}>
      <ShopSmsQuotaCard compact />

      <Card
        sx={{
          ...settingsCardSx,
          cursor: "pointer",
          transition: "background-color 0.15s ease",
          "&:hover": { bgcolor: "var(--admin-menu-hover)" },
        }}
        onClick={() => startAdminOnboarding()}
      >
        <CardContent sx={{ py: 1, px: 1.25, "&:last-child": { pb: 1 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <MenuBookIcon sx={{ color: "var(--admin-accent)", fontSize: 18 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "13px", fontWeight: 600 }}>
                راهنمای شروع
              </Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "11px" }}>
                آموزش گام‌به‌گام پنل
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "var(--admin-text-muted)", fontSize: 18 }} />
          </Box>
        </CardContent>
      </Card>

      <Card sx={settingsCardSx}>
        <CardContent sx={{ py: 0.5, px: 1.25, "&:last-child": { pb: 0.5 } }}>
          <SettingsToggleRow
            icon={<TableRestaurantIcon sx={{ fontSize: 18 }} />}
            title="رستوران و کافه"
            hint="میز و سفارش حضوری در منو"
            checked={restaurantCafeEnabled}
            onChange={handleToggleRestaurantCafe}
            last={!restaurantCafeEnabled}
          />
          {restaurantCafeEnabled ? (
            <SettingsToggleRow
              icon={<NotificationsActiveIcon sx={{ fontSize: 18 }} />}
              title="پاپ‌آپ سفارش حضوری"
              hint="در حالت منو وقتی سفارش جدید رسید"
              checked={menuTableOrdersPopupEnabled}
              onChange={handleToggleMenuTableOrdersPopup}
            />
          ) : null}
          {restaurantCafeEnabled ? (
            <Box
              onClick={() => router.push("/admin/shop-tables")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                py: 0.7,
                cursor: "pointer",
                "&:hover": { opacity: 0.85 },
              }}
            >
              <TableRestaurantIcon sx={{ color: "var(--admin-accent)", fontSize: 18 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: "var(--admin-text)", fontSize: "13px", fontWeight: 600 }}>
                  میزها و سفارش پای میز
                </Typography>
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "11px" }}>
                  تعریف میز، لینک QR و سفارش‌ها
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ color: "var(--admin-text-muted)", fontSize: 18 }} />
            </Box>
          ) : null}
        </CardContent>
      </Card>

      <Card sx={settingsCardSx}>
        <CardContent sx={{ py: 0.5, px: 1.25, "&:last-child": { pb: 0.5 } }}>
          <SettingsToggleRow
            icon={<Inventory2Icon sx={{ fontSize: 18 }} />}
            title="لیست کالا در صفحه فروش"
            hint="جستجو و افزودن سریع از کش محلی"
            checked={showProductListOnMainPage}
            onChange={handleToggleProductListOnMainPage}
            disabled={menuMode}
          />
          <SettingsToggleRow
            icon={<RestaurantMenuIcon sx={{ fontSize: 18 }} />}
            title="حالت منو"
            hint="نمایش کارتی با فیلتر دسته"
            checked={menuMode}
            onChange={handleToggleMenuMode}
          />
          <SettingsToggleRow
            icon={<ImageOutlinedIcon sx={{ fontSize: 18 }} />}
            title="عکس کالا در حالت منو"
            hint="خاموش = کارت‌ها فقط نام و قیمت"
            checked={menuModeShowProductImages}
            onChange={handleToggleMenuModeShowProductImages}
            disabled={!menuMode}
          />
          <SettingsToggleRow
            icon={<PointOfSaleIcon sx={{ fontSize: 18 }} />}
            title="تم کلاسیک فاکتور"
            hint="ظاهر فاکتور سنتی — با حالت منو هم کار می‌کند"
            checked={classicPosMode}
            onChange={handleToggleClassicPosMode}
          />
          <SettingsToggleRow
            icon={<PaymentsIcon sx={{ fontSize: 18 }} />}
            title="پرداخت نقدی و اقساطی"
            hint="نمایش گزینه‌ها هنگام ثبت فروش"
            checked={installmentPaymentEnabled}
            onChange={handleToggleInstallmentPayment}
          />
          <SettingsToggleRow
            icon={<AccountBalanceWalletIcon sx={{ fontSize: 18 }} />}
            title="پرداخت نسیه"
            hint="مشتری بدهکار می‌شود"
            checked={debtPaymentEnabled}
            onChange={handleToggleDebtPayment}
          />
          <SettingsToggleRow
            icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
            title="فروش چکی"
            hint="پرداخت با چک دریافتی"
            checked={chequePaymentEnabled}
            onChange={handleToggleChequePayment}
          />
          <SettingsToggleRow
            icon={<KitchenIcon sx={{ fontSize: 18 }} />}
            title="کالای تولیدی"
            hint="در منوی مدیریت کالا"
            checked={producedGoodsMenuEnabled}
            onChange={handleToggleProducedGoodsMenu}
          />
          <SettingsToggleRow
            icon={<ScaleIcon sx={{ fontSize: 18 }} />}
            title="فروش کیلویی"
            hint="واحد کیلو و مقدار اعشاری"
            checked={kgSalesEnabled}
            onChange={handleToggleKgSales}
          />
          <SettingsToggleRow
            icon={<PriceChangeIcon sx={{ fontSize: 18 }} />}
            title="تغییر قیمت هنگام خرید"
            hint="ویرایش قیمت فروش در سبد"
            checked={salePriceEditEnabled}
            onChange={handleToggleSalePriceEdit}
          />
          <SettingsToggleRow
            icon={<PrintIcon sx={{ fontSize: 18 }} />}
            title="چاپ مستقیم فاکتور"
            hint="بدون پیش‌نمایش چاپ"
            checked={directPrintEnabled}
            onChange={handleToggleDirectPrint}
            last
          />
        </CardContent>
      </Card>

      <SettingsSectionCard
        icon={<CreditCardIcon sx={{ fontSize: 18 }} />}
        title="کارت فروشگاه"
        hint="پرداخت کارت‌به‌کارت سفارش پای میز"
      >
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
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
                fontSize: "13px",
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
              "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: "13px" },
              "& .MuiInputBase-input": { py: 0.75 },
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
                fontSize: "13px",
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
              "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: "13px" },
              "& .MuiInputBase-input": { py: 0.75 },
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
                fontSize: "13px",
                "& fieldset": { borderColor: "var(--admin-border)" },
              },
              "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: "13px" },
              "& .MuiInputBase-input": { py: 0.75 },
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
        icon={<LoyaltyIcon sx={{ fontSize: 18 }} />}
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
        <LoyaltyCreditTiersSettings disabled={!loyaltyCreditEnabled} />
      </SettingsSectionCard>

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "76px", borderRadius: "15px" }}
        position="bottom-right"
      />
    </Box>
  );
}
