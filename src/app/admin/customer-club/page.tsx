"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import gregorian from "react-date-object/calendars/gregorian";
import persian_fa from "react-date-object/locales/persian_fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { notifySmsQuotaIfExhausted } from "@/app/lib/notifySmsQuota";
import { gregorianApiDateFromDateObject } from "@/app/lib/shopAccess";
import {
  CHEQUE_DATE_PICKER_Z,
  chequeDatePickerBoxSx,
} from "@/app/admin/cheques/ChequeFormSheet";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import { useShopPermissionGate } from "@/app/lib/shopPermissions";
import { BROADCAST_PRESELECT_STORAGE_KEY } from "@/app/lib/broadcastPreselect";

type ClubStats = {
  inactive: number;
  frequent: number;
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

type DayWindow = 30 | 60;

function birthDateFromApi(ymd: string | null | undefined): DateObject | null {
  const raw = String(ymd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  try {
    return new DateObject({ date: raw, calendar: gregorian, format: "YYYY-MM-DD" }).convert(
      persian,
      persian_fa,
    );
  } catch {
    return null;
  }
}

const noShadow = { boxShadow: "none" } as const;

const panelSx = {
  ...noShadow,
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  transition: "border-color 140ms ease, background-color 140ms ease",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: "13px",
    borderRadius: "10px",
    ...noShadow,
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { fontSize: "12px" },
};

const formatNumber = (num: number | string) => {
  const n = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (Number.isNaN(n)) return "۰";
  return new Intl.NumberFormat("fa-IR").format(n);
};

const QUICK_LINKS = [
  {
    href: "/admin/customers",
    label: "خریداران",
    icon: <PeopleOutlineIcon sx={{ fontSize: 18 }} />,
    permission: "customers" as const,
  },
  {
    href: "/admin/broadcast-sms",
    label: "ارسال پیامک",
    icon: <SmsOutlinedIcon sx={{ fontSize: 18 }} />,
    permission: "shop_sms" as const,
  },
  {
    href: "/admin/shop-sms-logs",
    label: "پیامک‌ها",
    icon: <SmsOutlinedIcon sx={{ fontSize: 18 }} />,
    permission: "shop_sms" as const,
  },
  {
    href: "/admin/sms-packages",
    label: "بسته پیامک",
    icon: <ShoppingCartCheckoutIcon sx={{ fontSize: 18 }} />,
    permission: "shop_sms" as const,
  },
  {
    href: "/admin/best-selling",
    label: "پرفروش‌ها",
    icon: <TrendingUpIcon sx={{ fontSize: 18 }} />,
    permission: "products" as const,
  },
  {
    href: "/admin/referral",
    label: "معرفی",
    icon: <ShareOutlinedIcon sx={{ fontSize: 18 }} />,
    permission: "referral" as const,
  },
  {
    href: "/admin/shop-plans",
    label: "تمدید",
    icon: <CardMembershipOutlinedIcon sx={{ fontSize: 18 }} />,
  },
];

export default function CustomerClubPage() {
  const router = useRouter();
  const { can } = useShopPermissionGate();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayWindow>(30);
  const [stats, setStats] = useState<ClubStats>({
    inactive: 0,
    frequent: 0,
    club_members: 0,
  });
  const [inactivePhones, setInactivePhones] = useState<string[]>([]);
  const [frequentPhones, setFrequentPhones] = useState<string[]>([]);
  const [bestSelling, setBestSelling] = useState<BestSeller[]>([]);
  const [regPhone, setRegPhone] = useState("");
  const [regName, setRegName] = useState("");
  const [regBirth, setRegBirth] = useState<DateObject | null>(null);
  const [registering, setRegistering] = useState(false);
  const [editingExisting, setEditingExisting] = useState(false);
  const lookupSeq = useRef(0);

  const loadDashboard = useCallback(async (windowDays: DayWindow) => {
    try {
      setLoading(true);
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "GET",
        `/api/customers/club-dashboard?days=${windowDays}`,
        token,
      );
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت داشبورد باشگاه"));
        return;
      }
      const payload = res as {
        stats?: Partial<ClubStats> & {
          inactive_30d?: number;
          frequent_30d?: number;
        };
        best_selling?: BestSeller[];
        inactive_phones?: string[];
        frequent_phones?: string[];
        data?: {
          stats?: Partial<ClubStats> & {
            inactive_30d?: number;
            frequent_30d?: number;
          };
          best_selling?: BestSeller[];
          inactive_phones?: string[];
          frequent_phones?: string[];
        };
      };
      const s = payload.stats ?? payload.data?.stats ?? {};
      setStats({
        inactive: Number(s.inactive ?? s.inactive_30d) || 0,
        frequent: Number(s.frequent ?? s.frequent_30d) || 0,
        club_members: Number(s.club_members) || 0,
      });
      const inactiveList = payload.inactive_phones ?? payload.data?.inactive_phones ?? [];
      const frequentList = payload.frequent_phones ?? payload.data?.frequent_phones ?? [];
      setInactivePhones(Array.isArray(inactiveList) ? inactiveList.map(String) : []);
      setFrequentPhones(Array.isArray(frequentList) ? frequentList.map(String) : []);
      const products = payload.best_selling ?? payload.data?.best_selling ?? [];
      setBestSelling(Array.isArray(products) ? products.slice(0, 10) : []);
    } catch {
      toast.error("خطا در دریافت داشبورد باشگاه");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(days);
  }, [days, loadDashboard]);

  const visibleLinks = useMemo(
    () => QUICK_LINKS.filter((link) => !link.permission || can(link.permission)),
    [can],
  );

  const openBroadcastWithPhones = (phones: string[], label: string) => {
    const unique = Array.from(new Set(phones.map((p) => String(p || "").trim()).filter(Boolean)));
    if (unique.length === 0) {
      toast.info(`کسی در «${label}» نیست`);
      return;
    }
    try {
      sessionStorage.setItem(BROADCAST_PRESELECT_STORAGE_KEY, JSON.stringify(unique));
    } catch {
      toast.error("امکان انتقال لیست شماره‌ها نیست");
      return;
    }
    router.push("/admin/broadcast-sms?preselect=1");
  };

  const lookupCustomerByPhone = useCallback(async (phone: string) => {
    if (!/^09\d{9}$/.test(phone)) {
      setEditingExisting(false);
      return;
    }
    const seq = ++lookupSeq.current;
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient("GET", `/api/customers/${phone}`, token);
      if (seq !== lookupSeq.current) return;
      if (!res || res.hasError) {
        setEditingExisting(false);
        return;
      }
      const payload = res as {
        stats?: { id?: number | null; name?: string | null; birth_date?: string | null };
        data?: { stats?: { id?: number | null; name?: string | null; birth_date?: string | null } };
      };
      const statsRow = payload.stats ?? payload.data?.stats;
      const isMember = Boolean(statsRow?.id);
      if (!isMember) {
        setEditingExisting(false);
        return;
      }
      const name = String(statsRow?.name || "").trim();
      const birth = birthDateFromApi(statsRow?.birth_date);
      if (name) setRegName(name);
      setRegBirth(birth);
      setEditingExisting(true);
      toast.info("مشتری قبلی پیدا شد — می‌توانید ویرایش و ذخیره کنید");
    } catch {
      if (seq === lookupSeq.current) setEditingExisting(false);
    }
  }, []);

  useEffect(() => {
    const phone = regPhone.trim();
    if (!/^09\d{9}$/.test(phone)) {
      setEditingExisting(false);
      return;
    }
    const t = window.setTimeout(() => {
      void lookupCustomerByPhone(phone);
    }, 350);
    return () => window.clearTimeout(t);
  }, [regPhone, lookupCustomerByPhone]);

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
          : editingExisting
            ? "اطلاعات مشتری به‌روز شد"
            : "مشتری ثبت شد",
      );
      notifySmsQuotaIfExhausted(res);
      setRegPhone("");
      setRegName("");
      setRegBirth(null);
      setEditingExisting(false);
      void loadDashboard(days);
    } catch {
      toast.error("خطا در ثبت مشتری");
    } finally {
      setRegistering(false);
    }
  };

  const statItems = [
    {
      key: "inactive" as const,
      label: `بدون خرید ${days} روز`,
      value: stats.inactive,
      icon: <HistoryToggleOffOutlinedIcon sx={{ fontSize: 16 }} />,
      tone: "warn" as const,
      clickable: true,
      phones: inactivePhones,
    },
    {
      key: "frequent" as const,
      label: `بیش از ۳ خرید / ${days} روز`,
      value: stats.frequent,
      icon: <LocalFireDepartmentOutlinedIcon sx={{ fontSize: 16 }} />,
      tone: "hot" as const,
      clickable: true,
      phones: frequentPhones,
    },
    {
      key: "members" as const,
      label: "اعضای باشگاه",
      value: stats.club_members,
      icon: <GroupsOutlinedIcon sx={{ fontSize: 16 }} />,
      tone: "ok" as const,
      clickable: false,
      phones: [] as string[],
    },
  ];

  return (
    <Box
      sx={{
        ...adminPageSx,
        p: { xs: 1, md: 1.25 },
        pb: { xs: 10, md: 1.25 },
        position: "relative",
        overflow: "hidden",
        minHeight: { md: "calc(100vh - 56px)" },
        height: { md: "calc(100vh - 56px)" },
        display: "flex",
        flexDirection: "column",
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
            radial-gradient(ellipse 60% 40% at 100% 0%, color-mix(in srgb, var(--admin-accent) 16%, transparent), transparent 55%),
            radial-gradient(ellipse 45% 30% at 0% 10%, color-mix(in srgb, var(--admin-accent) 10%, transparent), transparent 50%)
          `,
        }}
      />

      <Box
        sx={{
          position: "relative",
          maxWidth: 1080,
          mx: "auto",
          width: "100%",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          overflow: { xs: "auto", md: "hidden" },
        }}
      >
        <Box
          sx={{
            ...panelSx,
            px: 1.25,
            py: 0.85,
            display: "flex",
            alignItems: "center",
            gap: 1,
            background: `
              linear-gradient(135deg,
                color-mix(in srgb, var(--admin-accent) 14%, var(--admin-surface)) 0%,
                var(--admin-surface) 55%)
            `,
            borderColor: "color-mix(in srgb, var(--admin-accent) 35%, var(--admin-border))",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              display: "grid",
              placeItems: "center",
              bgcolor: "color-mix(in srgb, var(--admin-accent) 16%, transparent)",
              border: "1px solid color-mix(in srgb, var(--admin-accent) 40%, transparent)",
              color: "var(--admin-accent)",
              flexShrink: 0,
            }}
          >
            <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            sx={{
              fontSize: { xs: 16, md: 18 },
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "var(--admin-text)",
              lineHeight: 1.2,
            }}
          >
            باشگاه مشتریان
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CircularProgress size={26} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flexShrink: 0,
              }}
            >
              {([30, 60] as DayWindow[]).map((d) => {
                const active = days === d;
                return (
                  <Button
                    key={d}
                    size="small"
                    onClick={() => setDays(d)}
                    sx={{
                      minWidth: 52,
                      height: 28,
                      px: 1.25,
                      borderRadius: "999px",
                      fontSize: 12,
                      fontWeight: 800,
                      border: "1px solid",
                      borderColor: active
                        ? "color-mix(in srgb, var(--admin-accent) 55%, var(--admin-border))"
                        : "var(--admin-border)",
                      bgcolor: active
                        ? "color-mix(in srgb, var(--admin-accent) 16%, var(--admin-surface))"
                        : "var(--admin-surface)",
                      color: active ? "var(--admin-accent)" : "var(--admin-text-muted)",
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "color-mix(in srgb, var(--admin-accent) 10%, var(--admin-surface))",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {formatNumber(d)}
                  </Button>
                );
              })}
              <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mr: 0.5 }}>
                روز
              </Typography>
            </Box>

            <Grid container spacing={0.75} sx={{ flexShrink: 0 }}>
              {statItems.map((item) => (
                <Grid item xs={4} key={item.key}>
                  <Box
                    role={item.clickable ? "button" : undefined}
                    tabIndex={item.clickable ? 0 : undefined}
                    onClick={() => {
                      if (!item.clickable) return;
                      openBroadcastWithPhones(item.phones, item.label);
                    }}
                    onKeyDown={(e) => {
                      if (!item.clickable) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openBroadcastWithPhones(item.phones, item.label);
                      }
                    }}
                    sx={{
                      ...panelSx,
                      p: 1,
                      cursor: item.clickable ? "pointer" : "default",
                      background:
                        item.tone === "ok"
                          ? "linear-gradient(160deg, color-mix(in srgb, var(--admin-accent) 12%, var(--admin-surface)), var(--admin-surface))"
                          : item.tone === "hot"
                            ? "linear-gradient(160deg, color-mix(in srgb, #f59e0b 10%, var(--admin-surface)), var(--admin-surface))"
                            : "var(--admin-surface)",
                      borderColor:
                        item.tone === "ok"
                          ? "color-mix(in srgb, var(--admin-accent) 40%, var(--admin-border))"
                          : "var(--admin-border)",
                      "&:hover": item.clickable
                        ? {
                            borderColor: "color-mix(in srgb, var(--admin-accent) 55%, var(--admin-border))",
                            bgcolor: "color-mix(in srgb, var(--admin-accent) 8%, var(--admin-surface))",
                          }
                        : undefined,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.35 }}>
                      <Box
                        sx={{
                          color:
                            item.tone === "hot"
                              ? "#f59e0b"
                              : item.tone === "ok"
                                ? "var(--admin-accent)"
                                : "var(--admin-text-muted)",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 10.5,
                          color: "var(--admin-text-muted)",
                          lineHeight: 1.25,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: { xs: 20, md: 24 },
                        fontWeight: 900,
                        lineHeight: 1,
                        color: "var(--admin-text)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatNumber(item.value)}
                    </Typography>
                    {item.clickable ? (
                      <Typography sx={{ fontSize: 10, color: "var(--admin-accent)", mt: 0.35, fontWeight: 700 }}>
                        ارسال پیامک
                      </Typography>
                    ) : null}
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box
              sx={{
                ...panelSx,
                px: 1.25,
                py: 0.85,
                flexShrink: 0,
                background: `
                  linear-gradient(145deg,
                    var(--admin-surface) 0%,
                    color-mix(in srgb, var(--admin-accent) 7%, var(--admin-surface)) 100%)
                `,
                borderColor: "color-mix(in srgb, var(--admin-accent) 28%, var(--admin-border))",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.6 }}>
                <PersonAddAltIcon sx={{ fontSize: 18, color: "var(--admin-accent)" }} />
                <Typography sx={{ fontWeight: 800, fontSize: 13, color: "var(--admin-text)" }}>
                  {editingExisting ? "ویرایش عضو" : "ثبت عضو جدید"}
                </Typography>
              </Box>

              <Grid container spacing={0.75} alignItems="flex-end">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="موبایل"
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(e.target.value);
                      if (editingExisting) setEditingExisting(false);
                    }}
                    placeholder="09xxxxxxxxx"
                    inputProps={{ style: { direction: "ltr", textAlign: "left" } }}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="نام"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.35, fontWeight: 600 }}>
                    تولد (شمسی)
                  </Typography>
                  <Box
                    sx={{
                      ...chequeDatePickerBoxSx,
                      "& .rmdp-input": {
                        ...chequeDatePickerBoxSx["& .rmdp-input"],
                        height: "36px",
                        fontSize: "12px",
                        borderRadius: "10px",
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
                      placeholder="۱۳۷۰/۰۱/۰۱"
                      className="rmdp-mobile"
                      containerStyle={{ width: "100%" }}
                      style={{ width: "100%", height: 36, borderRadius: 10, boxShadow: "none" }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={registering}
                    onClick={() => void handleRegister()}
                    startIcon={<PersonAddAltIcon sx={{ fontSize: "16px !important" }} />}
                    sx={{
                      ...adminButtonStartIconSx,
                      ...noShadow,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: "var(--admin-accent)",
                      color: "var(--admin-on-accent)",
                      fontWeight: 800,
                      fontSize: 12.5,
                      "&:hover": {
                        bgcolor: "var(--admin-accent-hover)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {registering ? "..." : editingExisting ? "ذخیره" : "ثبت"}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ flexShrink: 0, minHeight: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--admin-text)" }}>
                  ۱۰ محصول پرفروش
                </Typography>
                <Button
                  component={Link}
                  href="/admin/best-selling"
                  size="small"
                  endIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: "10px !important" }} />}
                  sx={{
                    ...adminButtonStartIconSx,
                    color: "var(--admin-accent)",
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 0,
                    px: 0.25,
                    py: 0,
                  }}
                >
                  همه
                </Button>
              </Box>

              {bestSelling.length === 0 ? (
                <Box
                  sx={{
                    ...panelSx,
                    px: 1.25,
                    py: 1,
                    textAlign: "center",
                    color: "var(--admin-text-secondary)",
                    fontSize: 12,
                  }}
                >
                  هنوز فروشی برای رتبه‌بندی نیست.
                </Box>
              ) : (
                <Grid container spacing={0.6}>
                  {bestSelling.map((p, index) => (
                    <Grid item xs={6} sm={4} md={2.4} key={p.id} sx={{ flexBasis: { md: "20%" }, maxWidth: { md: "20%" } }}>
                      <Box
                        sx={{
                          ...panelSx,
                          px: 0.85,
                          py: 0.7,
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
                            top: 2,
                            left: 6,
                            fontSize: 14,
                            fontWeight: 900,
                            lineHeight: 1,
                            color: "color-mix(in srgb, var(--admin-accent) 26%, transparent)",
                            userSelect: "none",
                          }}
                        >
                          {formatNumber(index + 1)}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            mb: 0.25,
                            color: "var(--admin-text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            pl: 0.25,
                          }}
                        >
                          {p.name}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5 }}>
                          <Typography sx={{ fontSize: 10, color: "var(--admin-text-muted)", fontWeight: 600 }}>
                            {formatNumber(p.total_sold)}
                          </Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 800, color: "var(--admin-accent)" }}>
                            {formatNumber(p.sale_price)} ت
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <Box sx={{ flexShrink: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--admin-text)", mb: 0.5 }}>
                میانبرها
              </Typography>
              <Grid container spacing={0.75}>
                {visibleLinks.map((link) => (
                  <Grid item xs={6} sm={4} md="auto" key={link.href} sx={{ flexGrow: { md: 1 } }}>
                    <Box
                      component={Link}
                      href={link.href}
                      sx={{
                        ...panelSx,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1,
                        py: 0.7,
                        textDecoration: "none",
                        color: "inherit",
                        cursor: "pointer",
                        minHeight: 36,
                        "&:hover": {
                          borderColor: "color-mix(in srgb, var(--admin-accent) 55%, var(--admin-border))",
                          bgcolor: "color-mix(in srgb, var(--admin-accent) 8%, var(--admin-surface))",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: "8px",
                          display: "grid",
                          placeItems: "center",
                          color: "var(--admin-accent)",
                          bgcolor: "color-mix(in srgb, var(--admin-accent) 14%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--admin-accent) 28%, transparent)",
                          flexShrink: 0,
                        }}
                      >
                        {link.icon}
                      </Box>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "var(--admin-text)", lineHeight: 1.2 }}>
                        {link.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </Box>

      <ToastContainer
        autoClose={3000}
        style={{ marginBottom: "76px", borderRadius: "15px" }}
        position="bottom-right"
      />
    </Box>
  );
}
