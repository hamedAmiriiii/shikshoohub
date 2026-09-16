"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import PeopleIcon from "@mui/icons-material/People";
import SmsIcon from "@mui/icons-material/Sms";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShareIcon from "@mui/icons-material/Share";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import CustomersList from "@/app/admin/customers/CustomersList";
import { formatBeneficiaryAmount, parseAsBeneficiary } from "@/app/lib/beneficiaries";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import { useShopPermissionGate } from "@/app/lib/shopPermissions";

type ClubStats = {
  inactive_30d: number;
  frequent_30d: number;
  club_members: number;
};

type BestSeller = {
  id: number;
  name: string;
  sale_price: number;
  quantity?: number;
  total_sold: number;
  image?: string | null;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface)",
    color: "var(--admin-text)",
    fontSize: "14px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
};

const formatNumber = (num: number | string) => {
  const n = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (Number.isNaN(n)) return "۰";
  return new Intl.NumberFormat("fa-IR").format(n);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "بدون تاریخ";
  try {
    const date = new Date(dateString.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
};

const QUICK_LINKS = [
  { href: "/admin/customers", label: "لیست خریداران", icon: <PeopleIcon />, permission: "customers" as const },
  { href: "/admin/broadcast-sms", label: "ارسال پیامک", icon: <SmsIcon />, permission: "shop_sms" as const },
  { href: "/admin/shop-sms-logs", label: "پیامک‌های فروشگاه", icon: <SmsIcon />, permission: "shop_sms" as const },
  { href: "/admin/sms-packages", label: "خرید بسته پیامک", icon: <ShoppingCartCheckoutIcon />, permission: "shop_sms" as const },
  { href: "/admin/best-selling", label: "محصولات پرفروش", icon: <TrendingUpIcon />, permission: "products" as const },
  { href: "/admin/referral", label: "پنل معرفی", icon: <ShareIcon />, permission: "referral" as const },
  { href: "/admin/shop-plans", label: "تمدید اشتراک", icon: <CardMembershipIcon /> },
];

export default function CustomerClubPage() {
  const { can } = useShopPermissionGate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClubStats>({
    inactive_30d: 0,
    frequent_30d: 0,
    club_members: 0,
  });
  const [bestSelling, setBestSelling] = useState<BestSeller[]>([]);
  const [regPhone, setRegPhone] = useState("");
  const [regName, setRegName] = useState("");
  const [regBirth, setRegBirth] = useState("");
  const [registering, setRegistering] = useState(false);
  const [listKey, setListKey] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const token = tokenCode();
      const res = await FetchWithJwtClient("GET", "/api/customers/club-dashboard", token);
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت داشبورد باشگاه"));
        return;
      }
      const payload = res as {
        stats?: Partial<ClubStats>;
        best_selling?: BestSeller[];
        data?: { stats?: Partial<ClubStats>; best_selling?: BestSeller[] };
      };
      const s = payload.stats ?? payload.data?.stats ?? {};
      setStats({
        inactive_30d: Number(s.inactive_30d) || 0,
        frequent_30d: Number(s.frequent_30d) || 0,
        club_members: Number(s.club_members) || 0,
      });
      const products = payload.best_selling ?? payload.data?.best_selling ?? [];
      setBestSelling(Array.isArray(products) ? products.slice(0, 4) : []);
    } catch {
      toast.error("خطا در دریافت داشبورد باشگاه");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const visibleLinks = useMemo(
    () => QUICK_LINKS.filter((link) => !link.permission || can(link.permission)),
    [can],
  );

  const handleRegister = async () => {
    const phone = regPhone.trim();
    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد");
      return;
    }
    if (!regName.trim()) {
      toast.error("نام مشتری را وارد کنید");
      return;
    }
    setRegistering(true);
    try {
      const body: Record<string, string> = {
        phone,
        name: regName.trim(),
      };
      if (regBirth.trim()) body.birth_date = regBirth.trim();
      const res = await FetchWithJwtClient("POST", "/api/customers/register", body);
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت مشتری ناموفق بود"));
        return;
      }
      toast.success(
        typeof (res as { message?: string }).message === "string"
          ? (res as { message: string }).message
          : "مشتری ثبت شد",
      );
      setRegPhone("");
      setRegName("");
      setRegBirth("");
      setListKey((k) => k + 1);
      void loadDashboard();
    } catch {
      toast.error("خطا در ثبت مشتری");
    } finally {
      setRegistering(false);
    }
  };

  const searchBoxList = [
    { fieldName: "phone", fieldOperation: "MATCH" as const, fieldValue: "", nextConditionOperator: "OR" as const },
    { fieldName: "name", fieldOperation: "MATCH" as const, fieldValue: "", nextConditionOperator: "OR" as const },
  ];

  const desktopColumns = [
    {
      label: "نام",
      field: (item: { name?: string | null }) => item?.name?.trim() || "—",
    },
    {
      label: "شماره تلفن",
      field: (item: { phone?: string }) => item?.phone || "بدون شماره",
    },
    {
      label: "تعداد کل خریدها",
      field: (item: { total_purchases?: number }) =>
        item?.total_purchases ? `${formatNumber(item.total_purchases)} عدد` : "۰ عدد",
    },
    {
      label: "مجموع مبلغ خرید",
      field: (item: { total_spent?: number }) =>
        item?.total_spent ? `${formatNumber(item.total_spent)} تومان` : "۰ تومان",
    },
    {
      label: "تاریخ آخرین خرید",
      field: (item: { last_purchase_date?: string }) =>
        item?.last_purchase_date ? formatDate(item.last_purchase_date) : "بدون تاریخ",
    },
    {
      label: "اعتبار فعلی",
      field: (item: { current_credit?: number }) =>
        item?.current_credit ? `${formatNumber(item.current_credit)} تومان` : "۰ تومان",
    },
    {
      label: "خرید از او (ذینفع)",
      field: (item: unknown) => {
        const asBeneficiary = parseAsBeneficiary(item);
        if (!asBeneficiary) return "—";
        return `خرید ${formatBeneficiaryAmount(asBeneficiary.purchased_total)} / بدهی ${formatBeneficiaryAmount(asBeneficiary.unpaid_total)}`;
      },
    },
  ];

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Typography sx={{ fontSize: 20, fontWeight: 800, mb: 0.5, color: "var(--admin-text)" }}>
        باشگاه مشتریان
      </Typography>
      <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", mb: 2 }}>
        آمار خرید، ثبت مشتری، پیامک و لیست خریداران در یک صفحه
      </Typography>

      {loading ? (
        <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : (
        <>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: "12px" }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                    بدون خرید در ۳۰ روز اخیر
                  </Typography>
                  <Typography sx={{ fontSize: 26, fontWeight: 800, color: "var(--admin-accent)" }}>
                    {formatNumber(stats.inactive_30d)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: "12px" }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                    بیش از ۳ خرید در ۳۰ روز گذشته
                  </Typography>
                  <Typography sx={{ fontSize: 26, fontWeight: 800, color: "var(--admin-accent)" }}>
                    {formatNumber(stats.frequent_30d)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: "12px" }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>اعضای باشگاه</Typography>
                  <Typography sx={{ fontSize: 26, fontWeight: 800, color: "var(--admin-accent)" }}>
                    {formatNumber(stats.club_members)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
            ۴ محصول پرفروش
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {bestSelling.length === 0 ? (
              <Grid item xs={12}>
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13 }}>
                  هنوز فروش ثبت‌شده‌ای برای رتبه‌بندی نیست.
                </Typography>
              </Grid>
            ) : (
              bestSelling.map((p) => (
                <Grid item xs={6} md={3} key={p.id}>
                  <Card
                    sx={{
                      height: "100%",
                      bgcolor: "var(--admin-surface)",
                      border: "1px solid var(--admin-border)",
                      borderRadius: "12px",
                    }}
                  >
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5, minHeight: 36 }}>
                        {p.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                        فروش: {formatNumber(p.total_sold)}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "var(--admin-accent)", fontWeight: 700 }}>
                        {formatNumber(p.sale_price)} ت
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
            میانبرها
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2.5 }}>
            {visibleLinks.map((link) => (
              <Grid item xs={6} sm={4} md={3} key={link.href}>
                <Button
                  component={Link}
                  href={link.href}
                  fullWidth
                  variant="outlined"
                  startIcon={link.icon}
                  sx={{
                    ...adminButtonStartIconSx,
                    justifyContent: "flex-start",
                    borderColor: "var(--admin-border)",
                    color: "var(--admin-text)",
                    bgcolor: "var(--admin-surface)",
                    borderRadius: "10px",
                    py: 1.1,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {link.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Card
        sx={{
          mb: 2.5,
          bgcolor: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          borderRadius: "12px",
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <PersonAddAltIcon sx={{ color: "var(--admin-accent)" }} />
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>ثبت مشتری</Typography>
          </Box>
          <Grid container spacing={1.25}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="شماره موبایل"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
                inputProps={{ style: { direction: "ltr", textAlign: "left" } }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="نام"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="تاریخ تولد"
                value={regBirth}
                onChange={(e) => setRegBirth(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                disabled={registering}
                onClick={() => void handleRegister()}
                sx={{
                  bgcolor: "var(--admin-accent)",
                  color: "var(--admin-on-accent)",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                }}
              >
                {registering ? "در حال ثبت..." : "ثبت در باشگاه"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
        لیست خریداران
      </Typography>
      <CustomersList
        key={listKey}
        disableFilter
        searchBoxList={searchBoxList}
        filterBoxList={[]}
        url="/api/customers"
        showTotal
        textTotal={["مشتری", ""]}
        rows={20}
        desktopColumns={desktopColumns}
      />

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "76px", borderRadius: "15px" }}
        position="bottom-right"
      />
    </Box>
  );
}
