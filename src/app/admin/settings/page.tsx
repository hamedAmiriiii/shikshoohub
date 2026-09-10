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
  CircularProgress,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuBookIcon from "@mui/icons-material/MenuBook";
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
import PersonIcon from "@mui/icons-material/Person";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import { startAdminOnboarding } from "@/app/admin/onboarding/AdminOnboardingProvider";
import {
  readAdminPosSettings,
  writeAdminPosSettings,
} from "@/app/lib/adminPosSettings";
import { readShopFeatures } from "@/app/lib/shopFeatures";
import OrderSoundTestButton from "@/app/admin/components/OrderSoundTestButton";
import LoyaltyCreditTiersSettings from "@/app/admin/settings/LoyaltyCreditTiersSettings";
import ShopBackupSettings from "@/app/admin/settings/ShopBackupSettings";
import {
  DEFAULT_SALE_RECEIPT_PRINT_SETTINGS,
  readSaleReceiptPrintSettings,
  writeSaleReceiptPrintSettings,
  type SaleReceiptPrintSettings,
} from "@/app/lib/saleReceiptPrint";
import { StationPrinterSettings } from "@/app/admin/print/sale/StationPrinterSettings";
import { useShopPermissionGate } from "@/app/lib/shopPermissions";

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

const viewBtnSx = {
  ...adminButtonStartIconSx,
  minWidth: 72,
  py: 0.35,
  px: 1.25,
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--admin-accent)",
  borderColor: "var(--admin-accent)",
  "&:hover": {
    borderColor: "var(--admin-accent-hover)",
    bgcolor: "var(--admin-menu-hover)",
  },
};

const saveBtnSx = {
  ...adminButtonStartIconSx,
  minWidth: 64,
  py: 0.5,
  fontSize: "12px",
  bgcolor: "var(--admin-accent)",
  color: "var(--admin-on-accent)",
  "&:hover": { bgcolor: "var(--admin-accent-hover)", color: "var(--admin-on-accent)" },
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
  const { can } = useShopPermissionGate();
  const [loyaltyCreditEnabled, setLoyaltyCreditEnabled] = useState(true);
  const [creditExpiryDays, setCreditExpiryDays] = useState<number>(60);
  const [installmentInterestRate, setInstallmentInterestRate] = useState<number>(0);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [loyaltyLoaded, setLoyaltyLoaded] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [shopCardOpen, setShopCardOpen] = useState(false);
  const [shopCardLoaded, setShopCardLoaded] = useState(false);
  const [shopCardLoading, setShopCardLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingExpiry, setIsSavingExpiry] = useState(false);
  const [isSavingInterestRate, setIsSavingInterestRate] = useState(false);
  const [showProductListOnMainPage, setShowProductListOnMainPage] = useState(false);
  const [menuMode, setMenuMode] = useState(false);
  const [menuModeShowProductImages, setMenuModeShowProductImages] = useState(true);
  const [installmentPaymentEnabled, setInstallmentPaymentEnabled] = useState(true);
  const [debtPaymentEnabled, setDebtPaymentEnabled] = useState(false);
  const [chequePaymentEnabled, setChequePaymentEnabled] = useState(false);
  const [kgSalesEnabled, setKgSalesEnabled] = useState(false);
  const [salePriceEditEnabled, setSalePriceEditEnabled] = useState(false);
  const [classicPosMode, setClassicPosMode] = useState(false);
  const [askCustomerName, setAskCustomerName] = useState(false);
  const [showDailyTicketNumber, setShowDailyTicketNumber] = useState(false);
  const [restaurantCafeEnabled, setRestaurantCafeEnabled] = useState(false);
  const [menuTableOrdersPopupEnabled, setMenuTableOrdersPopupEnabled] = useState(false);
  const [receiptPrintSettings, setReceiptPrintSettings] = useState<SaleReceiptPrintSettings>(
    DEFAULT_SALE_RECEIPT_PRINT_SETTINGS,
  );
  const [shopCardNumber, setShopCardNumber] = useState("");
  const [shopCardHolder, setShopCardHolder] = useState("");
  const [shopBankName, setShopBankName] = useState("");
  const [isSavingShopCard, setIsSavingShopCard] = useState(false);
  const [printerOpen, setPrinterOpen] = useState(false);

  useEffect(() => {
    const settings = readAdminPosSettings();
    setShowProductListOnMainPage(settings.showProductListOnMainPage);
    setMenuMode(settings.menuMode);
    setMenuModeShowProductImages(settings.menuModeShowProductImages);
    setInstallmentPaymentEnabled(settings.installmentPaymentEnabled);
    setDebtPaymentEnabled(settings.debtPaymentEnabled);
    setChequePaymentEnabled(settings.chequePaymentEnabled);
    setKgSalesEnabled(settings.kgSalesEnabled);
    setSalePriceEditEnabled(settings.salePriceEditEnabled);
    setClassicPosMode(settings.classicPosMode);
    setAskCustomerName(settings.askCustomerName);
    setShowDailyTicketNumber(Boolean(settings.showDailyTicketNumber));
    setRestaurantCafeEnabled(readShopFeatures().restaurant_cafe_enabled);
    setMenuTableOrdersPopupEnabled(settings.menuTableOrdersPopupEnabled);
    const printSettings = readSaleReceiptPrintSettings();
    setReceiptPrintSettings(printSettings);
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

  const handleToggleAskCustomerName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setAskCustomerName(enabled);
    writeAdminPosSettings({ askCustomerName: enabled });
    toast.success(
      enabled
        ? "در ثبت مشتری، فیلد نام هم نمایش داده می‌شود"
        : "ثبت مشتری فقط با شماره تلفن انجام می‌شود",
    );
  };

  const handleToggleShowDailyTicketNumber = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setShowDailyTicketNumber(enabled);
    writeAdminPosSettings({ showDailyTicketNumber: enabled });
    toast.success(
      enabled
        ? "شماره فیش روزانه نمایش داده می‌شود"
        : "شماره فیش روزانه پنهان شد",
    );
  };

  const applyLoyaltyResponse = (loyaltyRes: Record<string, unknown> | boolean) => {
    if (typeof loyaltyRes === "boolean") {
      setLoyaltyCreditEnabled(loyaltyRes);
      return;
    }
    if (loyaltyRes?.enabled !== undefined) {
      setLoyaltyCreditEnabled(Boolean(loyaltyRes.enabled));
    } else if ((loyaltyRes?.data as { enabled?: boolean } | undefined)?.enabled !== undefined) {
      setLoyaltyCreditEnabled(Boolean((loyaltyRes.data as { enabled?: boolean }).enabled));
    }
  };

  const applyShopCardResponse = (raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    const rows = raw as Record<string, unknown>;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(rows.data)
        ? rows.data
        : Array.isArray(rows.settings)
          ? rows.settings
          : null;
    const fromList = (key: string) => {
      if (!list) return "";
      const row = list.find((item) => (item as { key?: string })?.key === key) as
        | { value?: string }
        | undefined;
      return typeof row?.value === "string" ? row.value : "";
    };
    const number = typeof rows.shop_card_number === "string" ? rows.shop_card_number : fromList("shop_card_number");
    const holder = typeof rows.shop_card_holder === "string" ? rows.shop_card_holder : fromList("shop_card_holder");
    const bank = typeof rows.shop_bank_name === "string" ? rows.shop_bank_name : fromList("shop_bank_name");
    if (number) setShopCardNumber(number);
    if (holder) setShopCardHolder(holder);
    if (bank) setShopBankName(bank);
  };

  const openLoyaltyClub = async () => {
    setLoyaltyOpen(true);
    if (loyaltyLoaded) return;
    const token = tokenCode();
    if (!token) return;
    setLoyaltyLoading(true);
    try {
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
        applyLoyaltyResponse(loyaltyRes as Record<string, unknown> | boolean);
      }
      setLoyaltyLoaded(true);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const openShopCard = async () => {
    setShopCardOpen(true);
    if (shopCardLoaded) return;
    const token = tokenCode();
    if (!token) return;
    setShopCardLoading(true);
    try {
      const allSettings = await apiRequestError(
        "Get",
        {},
        {},
        `/api/settings`,
        true,
        true,
        token,
      );
      if (!allSettings?.hasError) {
        applyShopCardResponse(allSettings);
      }
      setShopCardLoaded(true);
    } finally {
      setShopCardLoading(false);
    }
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
        <CardContent sx={{ py: 1, px: 1.25, "&:last-child": { pb: 1 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
            <NotificationsActiveIcon sx={{ color: "var(--admin-accent)", fontSize: 20 }} />
            <Box>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "13px", fontWeight: 600 }}>
                صدای اعلان سفارش
              </Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "11px" }}>
                برای تست، دکمه زیر را بزنید
              </Typography>
            </Box>
          </Box>
          <OrderSoundTestButton fullWidth showHint />
        </CardContent>
      </Card>

      {restaurantCafeEnabled ? (
      <Card sx={settingsCardSx}>
        <CardContent sx={{ py: 0.5, px: 1.25, "&:last-child": { pb: 0.5 } }}>
            <SettingsToggleRow
              icon={<NotificationsActiveIcon sx={{ fontSize: 18 }} />}
              title="پاپ‌آپ سفارش حضوری"
              hint="در حالت منو وقتی سفارش جدید رسید"
              checked={menuTableOrdersPopupEnabled}
              onChange={handleToggleMenuTableOrdersPopup}
            />
        </CardContent>
      </Card>
      ) : null}

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
            title="فروش نسیه"
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
            icon={<PersonIcon sx={{ fontSize: 18 }} />}
            title="نام مشتری هنگام ثبت"
            hint="علاوه بر تلفن، نام هم گرفته شود"
            checked={askCustomerName}
            onChange={handleToggleAskCustomerName}
          />
          <SettingsToggleRow
            icon={<ConfirmationNumberOutlinedIcon sx={{ fontSize: 18 }} />}
            title="نمایش شماره فیش روزانه"
            hint="هر فروش از ۱؛ هر روز از نو — در لیست فروش هم دیده می‌شود"
            checked={showDailyTicketNumber}
            onChange={handleToggleShowDailyTicketNumber}
            last
          />
        </CardContent>
      </Card>

      <SettingsSectionCard
        icon={<PrintIcon sx={{ fontSize: 18 }} />}
        title="تنظیمات پرینتر"
        hint="چاپ مستقیم، فیش‌ها، انتخاب پرینتر و اتصال QZ"
        action={
          printerOpen ? undefined : (
            <Button size="small" variant="outlined" onClick={() => setPrinterOpen(true)} sx={viewBtnSx}>
              مشاهده
            </Button>
          )
        }
      >
        {printerOpen ? (
        <Box sx={{ mt: 1 }}>
          <StationPrinterSettings
            compact
            showReceiptToggles
            settings={receiptPrintSettings}
            onChange={(partial) => {
              const next = writeSaleReceiptPrintSettings(partial);
              setReceiptPrintSettings(next);
            }}
          />
        </Box>
        ) : null}
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={<CreditCardIcon sx={{ fontSize: 18 }} />}
        title="کارت فروشگاه"
        hint="پرداخت کارت‌به‌کارت سفارش پای میز"
        loading={shopCardOpen && shopCardLoading}
        action={
          shopCardOpen ? undefined : (
            <Button size="small" variant="outlined" onClick={() => void openShopCard()} sx={viewBtnSx}>
              مشاهده
            </Button>
          )
        }
      >
        {shopCardOpen && !shopCardLoading ? (
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
        ) : null}
      </SettingsSectionCard>

      {can("backup") ? (
      <SettingsSectionCard
        icon={<CloudDownloadIcon sx={{ fontSize: 18 }} />}
        title="پشتیبان‌گیری"
        hint="دانلود و بازگردانی دادهٔ همین فروشگاه"
      >
        <ShopBackupSettings />
      </SettingsSectionCard>
      ) : null}

      <SettingsSectionCard
        icon={<LoyaltyIcon sx={{ fontSize: 18 }} />}
        title="باشگاه مشتریان"
        hint="اعتبار و امتیاز مشتری بر اساس مبلغ خرید"
        loading={loyaltyOpen && loyaltyLoading}
        action={
          loyaltyOpen && !loyaltyLoading ? (
            <Switch
              size="small"
              checked={loyaltyCreditEnabled}
              onChange={handleToggleLoyaltyCredit}
              disabled={isUpdating}
              sx={switchSx}
            />
          ) : loyaltyOpen ? undefined : (
            <Button size="small" variant="outlined" onClick={() => void openLoyaltyClub()} sx={viewBtnSx}>
              مشاهده
            </Button>
          )
        }
      >
        {loyaltyOpen && !loyaltyLoading ? (
          <LoyaltyCreditTiersSettings disabled={!loyaltyCreditEnabled} />
        ) : null}
      </SettingsSectionCard>

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "76px", borderRadius: "15px" }}
        position="bottom-right"
      />
    </Box>
  );
}
