"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import CardMembershipOutlinedIcon from "@mui/icons-material/CardMembershipOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HistoryToggleOffOutlinedIcon from "@mui/icons-material/HistoryToggleOffOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { gregorianApiDateFromDateObject } from "@/app/lib/shopAccess";
import {
  CHEQUE_DATE_PICKER_Z,
  chequeDatePickerBoxSx,
} from "@/app/admin/cheques/ChequeFormSheet";
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

const noShadow = { boxShadow: "none" } as const;

const panelSx = {
  ...noShadow,
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "18px",
  transition: "border-color 160ms ease, background-color 160ms ease, transform 160ms ease",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: "14px",
    borderRadius: "12px",
    ...noShadow,
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

const QUICK_LINKS = [
  {
    href: "/admin/customers",
    label: "لیست خریداران",
    hint: "مشاهده و جستجو",
    icon: <PeopleOutlineIcon />,
    permission: "customers" as const,
  },
  {
    href: "/admin/broadcast-sms",
    label: "ارسال پیامک",
    hint: "گروه و پیام گروهی",
    icon: <SmsOutlinedIcon />,
    permission: "shop_sms" as const,
  },
  {
    href: "/admin/shop-sms-logs",
    label: "پیامک‌های فروشگاه",
    hint: "سوابق ارسال",
    icon: <SmsOutlinedIcon />,
    permission: "shop_sms" as const,
  },
  {
    href: "/admin/sms-packages",
    label: "خرید بسته پیامک",
    hint: "افزایش اعتبار",
    icon: <ShoppingCartCheckoutIcon />,
    permission: "shop_sms" as const,
  },
  {
    href: "/admin/best-selling",
    label: "محصولات پرفروش",
    hint: "گزارش کامل",
    icon: <TrendingUpIcon />,
    permission: "products" as const,
  },
  {
    href: "/admin/referral",
    label: "پنل معرفی",
    hint: "لینک دعوت",
    icon: <ShareOutlinedIcon />,
    permission: "referral" as const,
  },
  {
    href: "/admin/shop-plans",
    label: "تمدید اشتراک",
    hint: "پلن فروشگاه",
    icon: <CardMembershipOutlinedIcon />,
  },
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
  const [regBirth, setRegBirth] = useState<DateObject | null>(null);
  const [registering, setRegistering] = useState(false);

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
      const birthYmd = gregorianApiDateFromDateObject(regBirth);
      if (birthYmd) body.birth_date = birthYmd;
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
      setRegBirth(null);
      void loadDashboard();
    } catch {
      toast.error("خطا در ثبت مشتری");
    } finally {
      setRegistering(false);
    }
  };

  const statItems = [
    {
      key: "inactive",
      label: "بدون خرید ۳۰ روز اخیر",
      value: stats.inactive_30d,
      icon: <HistoryToggleOffOutlinedIcon sx={{ fontSize: 22 }} />,
      tone: "warn" as const,
    },
    {
      key: "frequent",
      label: "بیش از ۳ خرید در ۳۰ روز",
      value: stats.frequent_30d,
      icon: <LocalFireDepartmentOutlinedIcon sx={{ fontSize: 22 }} />,
      tone: "hot" as const,
    },
    {
      key: "members",
      label: "اعضای باشگاه",
      value: stats.club_members,
      icon: <GroupsOutlinedIcon sx={{ fontSize: 22 }} />,
      tone: "ok" as const,
    },
  ];

  return (
    <Box
      sx={{
        ...adminPageSx,
        p: { xs: 1.5, md: 2.5 },
        pb: 12,
        position: "relative",
        overflow: "hidden",
        "& *": { boxShadow: "none !important" },
      }}
    >
      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 70% 45% at 100% 0%, color-mix(in srgb, var(--admin-accent) 22%, transparent), transparent 60%),
            radial-gradient(ellipse 55% 40% at 0% 20%, color-mix(in srgb, var(--admin-accent) 12%, transparent), transparent 55%),
            linear-gradient(180deg, transparent 0%, transparent 70%, color-mix(in srgb, var(--admin-surface-alt) 35%, transparent) 100%)
          `,
          opacity: 1,
        }}
      />

      <Box sx={{ position: "relative", maxWidth: 1100, mx: "auto" }}>
        <Box
          sx={{
            ...panelSx,
            mb: 2.5,
            p: { xs: 2, md: 2.75 },
            background: `
              linear-gradient(135deg,
                color-mix(in srgb, var(--admin-accent) 16%, var(--admin-surface)) 0%,
                var(--admin-surface) 48%,
                color-mix(in srgb, var(--admin-surface-alt) 70%, var(--admin-surface)) 100%)
            `,
            borderColor: "color-mix(in srgb, var(--admin-accent) 35%, var(--admin-border))",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: "1px solid color-mix(in srgb, var(--admin-accent) 35%, transparent)",
              top: -60,
              left: -40,
              opacity: 0.7,
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: "1px solid color-mix(in srgb, var(--admin-accent) 28%, transparent)",
              top: 20,
              left: 40,
              opacity: 0.5,
            }}
          />

          <Box sx={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                bgcolor: "color-mix(in srgb, var(--admin-accent) 18%, transparent)",
                border: "1px solid color-mix(in srgb, var(--admin-accent) 40%, transparent)",
                color: "var(--admin-accent)",
                flexShrink: 0,
              }}
            >
              <GroupsOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 32 },
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  color: "var(--admin-text)",
                  mb: 0.75,
                }}
              >
                باشگاه مشتریان
              </Typography>
              <Typography
                sx={{
                  fontSize: 13.5,
                  color: "var(--admin-text-muted)",
                  maxWidth: 520,
                  lineHeight: 1.7,
                }}
              >
                آمار وفاداری، پرفروش‌ها و ثبت عضو جدید — همه در یک نگاه.
              </Typography>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={30} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          <>
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
              {statItems.map((item) => (
                <Grid item xs={12} sm={4} key={item.key}>
                  <Box
                    sx={{
                      ...panelSx,
                      p: 2,
                      height: "100%",
                      background:
                        item.tone === "ok"
                          ? "linear-gradient(160deg, color-mix(in srgb, var(--admin-accent) 14%, var(--admin-surface)), var(--admin-surface))"
                          : item.tone === "hot"
                            ? "linear-gradient(160deg, color-mix(in srgb, #f59e0b 12%, var(--admin-surface)), var(--admin-surface))"
                            : "linear-gradient(160deg, color-mix(in srgb, #64748b 10%, var(--admin-surface)), var(--admin-surface))",
                      borderColor:
                        item.tone === "ok"
                          ? "color-mix(in srgb, var(--admin-accent) 40%, var(--admin-border))"
                          : "var(--admin-border)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        borderColor: "color-mix(in srgb, var(--admin-accent) 55%, var(--admin-border))",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "12px",
                          display: "grid",
                          placeItems: "center",
                          color:
                            item.tone === "hot"
                              ? "#f59e0b"
                              : item.tone === "ok"
                                ? "var(--admin-accent)"
                                : "var(--admin-text-muted)",
                          bgcolor: "var(--admin-surface-alt)",
                          border: "1px solid var(--admin-border)",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--admin-text-muted)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        ۳۰ روز
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12.5, color: "var(--admin-text-muted)", mb: 0.5, minHeight: 36 }}>
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: 30, md: 34 },
                        fontWeight: 900,
                        lineHeight: 1,
                        color: "var(--admin-text)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatNumber(item.value)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1.25, gap: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--admin-text)" }}>
                  چهار محصول پرفروش
                </Typography>
                <Button
                  component={Link}
                  href="/admin/best-selling"
                  size="small"
                  endIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: "12px !important" }} />}
                  sx={{
                    ...adminButtonStartIconSx,
                    color: "var(--admin-accent)",
                    fontSize: 12,
                    fontWeight: 700,
                    minWidth: 0,
                    px: 0.5,
                  }}
                >
                  همه
                </Button>
              </Box>

              {bestSelling.length === 0 ? (
                <Box
                  sx={{
                    ...panelSx,
                    p: 2.5,
                    textAlign: "center",
                    color: "var(--admin-text-secondary)",
                    fontSize: 13,
                  }}
                >
                  هنوز فروش ثبت‌شده‌ای برای رتبه‌بندی نیست.
                </Box>
              ) : (
                <Grid container spacing={1.25}>
                  {bestSelling.map((p, index) => (
                    <Grid item xs={6} md={3} key={p.id}>
                      <Box
                        sx={{
                          ...panelSx,
                          p: 1.75,
                          height: "100%",
                          position: "relative",
                          overflow: "hidden",
                          "&:hover": {
                            borderColor: "color-mix(in srgb, var(--admin-accent) 50%, var(--admin-border))",
                            bgcolor: "color-mix(in srgb, var(--admin-accent) 6%, var(--admin-surface))",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 10,
                            fontSize: 28,
                            fontWeight: 900,
                            lineHeight: 1,
                            color: "color-mix(in srgb, var(--admin-accent) 28%, transparent)",
                            userSelect: "none",
                          }}
                        >
                          {formatNumber(index + 1)}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 13.5,
                            fontWeight: 800,
                            mb: 1.25,
                            minHeight: 40,
                            pr: 0.5,
                            color: "var(--admin-text)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {p.name}
                        </Typography>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 1,
                            py: 0.35,
                            borderRadius: "999px",
                            border: "1px solid var(--admin-border)",
                            bgcolor: "var(--admin-surface-alt)",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--admin-text-muted)",
                            mb: 1,
                          }}
                        >
                          {formatNumber(p.total_sold)} فروش
                        </Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 800, color: "var(--admin-accent)" }}>
                          {formatNumber(p.sale_price)} تومان
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--admin-text)", mb: 1.25 }}>
                میانبرها
              </Typography>
              <Grid container spacing={1.25}>
                {visibleLinks.map((link) => (
                  <Grid item xs={6} sm={4} md={3} key={link.href}>
                    <Box
                      component={Link}
                      href={link.href}
                      sx={{
                        ...panelSx,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        p: 1.6,
                        height: "100%",
                        textDecoration: "none",
                        color: "inherit",
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "color-mix(in srgb, var(--admin-accent) 55%, var(--admin-border))",
                          bgcolor: "color-mix(in srgb, var(--admin-accent) 8%, var(--admin-surface))",
                          transform: "translateY(-2px)",
                          "& .club-link-arrow": { opacity: 1, transform: "translateX(-2px)" },
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "12px",
                            display: "grid",
                            placeItems: "center",
                            color: "var(--admin-accent)",
                            bgcolor: "color-mix(in srgb, var(--admin-accent) 14%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--admin-accent) 30%, transparent)",
                          }}
                        >
                          {link.icon}
                        </Box>
                        <ArrowBackIosNewRoundedIcon
                          className="club-link-arrow"
                          sx={{
                            fontSize: 14,
                            color: "var(--admin-accent)",
                            opacity: 0.35,
                            transition: "opacity 160ms ease, transform 160ms ease",
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--admin-text)" }}>
                          {link.label}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mt: 0.25 }}>
                          {link.hint}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}

        <Box
          sx={{
            ...panelSx,
            p: { xs: 2, md: 2.5 },
            background: `
              linear-gradient(145deg,
                var(--admin-surface) 0%,
                color-mix(in srgb, var(--admin-accent) 8%, var(--admin-surface)) 100%)
            `,
            borderColor: "color-mix(in srgb, var(--admin-accent) 28%, var(--admin-border))",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                bgcolor: "color-mix(in srgb, var(--admin-accent) 16%, transparent)",
                border: "1px solid color-mix(in srgb, var(--admin-accent) 35%, transparent)",
                color: "var(--admin-accent)",
              }}
            >
              <PersonAddAltIcon />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 16, color: "var(--admin-text)" }}>
                ثبت عضو جدید
              </Typography>
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                نام، موبایل و تاریخ تولد شمسی
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={1.5}>
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
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5, fontWeight: 600 }}>
                تاریخ تولد (شمسی)
              </Typography>
              <Box
                sx={{
                  ...chequeDatePickerBoxSx,
                  "& .rmdp-input": {
                    ...chequeDatePickerBoxSx["& .rmdp-input"],
                    height: "40px",
                    borderRadius: "12px",
                    backgroundColor: "var(--admin-surface-alt)",
                    boxShadow: "none",
                  },
                }}
              >
                <DatePicker
                  value={regBirth}
                  onChange={(d) =>
                    setRegBirth(d && !Array.isArray(d) ? (d as DateObject) : null)
                  }
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-center"
                  format="YYYY/MM/DD"
                  zIndex={CHEQUE_DATE_PICKER_Z}
                  portal
                  placeholder="مثلاً ۱۳۷۰/۰۱/۰۱"
                  className="rmdp-mobile"
                  containerStyle={{ width: "100%" }}
                  style={{ width: "100%", height: 40, borderRadius: 12, boxShadow: "none" }}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                disabled={registering}
                onClick={() => void handleRegister()}
                startIcon={<PersonAddAltIcon />}
                sx={{
                  ...adminButtonStartIconSx,
                  ...noShadow,
                  mt: 0.5,
                  px: 2.5,
                  py: 1.1,
                  borderRadius: "12px",
                  bgcolor: "var(--admin-accent)",
                  color: "var(--admin-on-accent)",
                  fontWeight: 800,
                  "&:hover": {
                    bgcolor: "var(--admin-accent-hover)",
                    boxShadow: "none",
                  },
                }}
              >
                {registering ? "در حال ثبت..." : "ثبت در باشگاه"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "76px", borderRadius: "15px" }}
        position="bottom-right"
      />
    </Box>
  );
}
