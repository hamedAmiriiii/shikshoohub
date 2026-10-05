"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Button, Grid2 as Grid, Paper, Stack, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BuildIcon from "@mui/icons-material/Build";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ComputerIcon from "@mui/icons-material/Computer";
import ElectricalServicesIcon from "@mui/icons-material/ElectricalServices";
import EngineeringIcon from "@mui/icons-material/Engineering";
import HandymanIcon from "@mui/icons-material/Handyman";
import KitchenIcon from "@mui/icons-material/Kitchen";
import LocalLaundryServiceIcon from "@mui/icons-material/LocalLaundryService";
import MicrowaveIcon from "@mui/icons-material/Microwave";
import PaymentsIcon from "@mui/icons-material/Payments";
import PhoneIcon from "@mui/icons-material/Phone";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import PlumbingIcon from "@mui/icons-material/Plumbing";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import TvIcon from "@mui/icons-material/Tv";
import VerifiedIcon from "@mui/icons-material/Verified";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { formatToman, isRepairError, repairApi, repairHomeFor, type RepairRequest } from "@/app/lib/repair/api";
import { useRepairAuth } from "./RepairAuth";
import { RepairInstallBanner } from "./RepairInstall";
import { Section, StatusChip } from "./ui";

const STEPS = [
  { icon: AssignmentIcon, title: "ثبت درخواست", text: "نوع خدمت، مشکل و آدرس را بنویسید." },
  { icon: ScheduleIcon, title: "انتخاب زمان", text: "روز و بازهٔ ساعت مراجعه را خودتان تعیین کنید." },
  { icon: EngineeringIcon, title: "اعزام تعمیرکار", text: "تعمیرکار متخصص ارجاع می‌شود و با شما تماس می‌گیرد." },
  { icon: PaymentsIcon, title: "فاکتور و پرداخت", text: "پس از انجام کار، آنلاین یا کارت به کارت پرداخت کنید." },
];

const FEATURES = [
  { icon: VerifiedIcon, title: "تعمیرکار تأییدشده", text: "همهٔ تعمیرکاران پیش از همکاری بررسی و تأیید می‌شوند." },
  { icon: ReceiptLongIcon, title: "فاکتور شفاف", text: "اجرت و هزینهٔ قطعات جدا و دقیق نوشته می‌شود." },
  { icon: PaymentsIcon, title: "پرداخت امن", text: "فقط بعد از انجام کار و از درگاه بانکی یا کارت به کارت." },
  { icon: SupportAgentIcon, title: "پیگیری و پشتیبانی", text: "وضعیت درخواست همیشه در دسترس است و پشتیبانی کنار شماست." },
];

const SERVICE_ICONS: [RegExp, SvgIconComponent][] = [
  [/یخچال|فریزر/, KitchenIcon],
  [/لباسشویی|ظرفشویی/, LocalLaundryServiceIcon],
  [/کولر|اسپلیت|تهویه/, AcUnitIcon],
  [/پکیج|آبگرمکن|بخاری|گرمایش|شوفاژ/, WhatshotIcon],
  [/برق|سیم‌کشی|روشنایی/, ElectricalServicesIcon],
  [/لوله|تاسیسات|تأسیسات|شیرآلات/, PlumbingIcon],
  [/تلویزیون|صوتی|تصویری/, TvIcon],
  [/کامپیوتر|لپ|رایانه/, ComputerIcon],
  [/موبایل|گوشی|تبلت/, PhoneAndroidIcon],
  [/مایکروویو|اجاق|گاز/, MicrowaveIcon],
];

const TONES = [
  { bg: "#eff6ff", fg: "#2563eb" },
  { bg: "#f5f3ff", fg: "#7c3aed" },
  { bg: "#ecfdf5", fg: "#059669" },
  { bg: "#fff7ed", fg: "#ea580c" },
  { bg: "#fdf2f8", fg: "#db2777" },
  { bg: "#f0f9ff", fg: "#0284c7" },
];

const OPEN_STATUSES = new Set<RepairRequest["status"]>(["pending", "assigned", "in_progress", "invoiced", "payment_review"]);

function serviceIcon(name: string): SvgIconComponent {
  return SERVICE_ICONS.find(([pattern]) => pattern.test(name))?.[1] || BuildIcon;
}

const HERO_BADGES = [
  { icon: VerifiedIcon, label: "تعمیرکار تأییدشده" },
  { icon: ReceiptLongIcon, label: "فاکتور شفاف" },
  { icon: PaymentsIcon, label: "پرداخت بعد از کار" },
];

export default function RepairLandingPage() {
  const { user, config } = useRepairAuth();
  const [openRequests, setOpenRequests] = useState<RepairRequest[]>([]);
  const brand = config?.brand_name || "امید تعمیر";
  const isCustomer = !user || user.role === "customer";
  const primaryHref = isCustomer ? "/repair/requests/new" : repairHomeFor(user.role);
  const primaryLabel = isCustomer ? "درخواست تعمیرکار" : "ورود به پنل";

  const realServices = (config?.services || []).filter((s) => s.id > 0);
  const services = realServices.length
    ? realServices.map((s) => ({ key: String(s.id), name: s.name }))
    : (config?.categories || []).map((name) => ({ key: name, name }));

  useEffect(() => {
    if (user?.role !== "customer") {
      setOpenRequests([]);
      return;
    }
    void repairApi.myRequests().then((res) => {
      if (!isRepairError(res)) setOpenRequests(res.requests.filter((r) => OPEN_STATUSES.has(r.status)));
    });
  }, [user?.role]);

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 2.5, sm: 5 },
          borderRadius: { xs: 4, sm: 5 },
          color: "#fff",
          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 45%, #7c3aed 100%)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
            top: -110,
            insetInlineEnd: -80,
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.06)",
            bottom: -80,
            insetInlineStart: -50,
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            insetInlineEnd: { sm: 40, md: 64 },
            top: "50%",
            transform: "translateY(-50%) rotate(-8deg)",
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            justifyContent: "center",
            width: 150,
            height: 150,
            borderRadius: "36px",
            bgcolor: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow: "0 20px 40px rgba(15,23,42,0.25)",
          }}
        >
          <HandymanIcon sx={{ fontSize: 84 }} />
        </Box>

        <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ position: "relative", maxWidth: { sm: "calc(100% - 210px)" } }}>
          {user?.name && (
            <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 600 }}>
              سلام {user.name}، خوش آمدید
            </Typography>
          )}
          <Box>
            <Typography sx={{ opacity: 0.8, fontWeight: 700, fontSize: { xs: 13, sm: 15 }, mb: 0.5 }}>{brand}</Typography>
            <Typography variant="h4" component="h1" fontWeight={900} sx={{ fontSize: { xs: 22, sm: 34 }, lineHeight: 1.6 }}>
              تعمیرکار مطمئن، دمِ در خانه
            </Typography>
          </Box>
          <Typography sx={{ opacity: 0.88, lineHeight: 1.9, fontSize: { xs: 14, sm: 16 } }}>
            <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
              درخواست بدهید، زمان را انتخاب کنید؛ بقیه با ما.
            </Box>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              درخواست بدهید، زمان مراجعه را انتخاب کنید؛ تعمیرکار متخصص اعزام می‌شود و بعد از انجام کار، هزینه را با
              فاکتور شفاف پرداخت می‌کنید.
            </Box>
          </Typography>
          <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
            <Button
              component={Link}
              href={primaryHref}
              variant="contained"
              color="inherit"
              endIcon={<ChevronLeftIcon />}
              sx={{
                flex: { xs: 1, sm: "0 0 auto" },
                py: { xs: 1.1, sm: 1.4 },
                px: 3,
                color: "primary.main",
                fontWeight: 800,
                borderRadius: 3,
                whiteSpace: "nowrap",
                boxShadow: "0 8px 20px rgba(15,23,42,0.18)",
              }}
            >
              {primaryLabel}
            </Button>
            {(user?.role === "customer" || !user) && (
              <Button
                component={Link}
                href={user ? "/repair/requests" : "/repair/login"}
                variant="outlined"
                color="inherit"
                sx={{
                  flex: { xs: 1, sm: "0 0 auto" },
                  py: { xs: 1.1, sm: 1.4 },
                  px: 2,
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                  borderColor: "rgba(255,255,255,0.5)",
                }}
              >
                {user ? (
                  "پیگیری درخواست‌ها"
                ) : (
                  <>
                    <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                      ورود همکاران
                    </Box>
                    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                      ورود تعمیرکاران و مدیر
                    </Box>
                  </>
                )}
              </Button>
            )}
          </Stack>
        </Stack>

        <Box
          sx={{
            position: "relative",
            mt: { xs: 2.5, sm: 3 },
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            maxWidth: { sm: 520 },
          }}
        >
          {HERO_BADGES.map(({ icon: Icon, label }, index) => (
            <Stack
              key={label}
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 0.5, sm: 1 }}
              alignItems="center"
              justifyContent="center"
              sx={{
                py: 1.25,
                px: 0.5,
                textAlign: "center",
                borderInlineStart: index > 0 ? "1px solid rgba(255,255,255,0.18)" : "none",
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: { xs: 11, sm: 12.5 }, fontWeight: 700, lineHeight: 1.5 }}>{label}</Typography>
            </Stack>
          ))}
        </Box>
      </Paper>

      <RepairInstallBanner app="customer" />

      {openRequests.length > 0 && (
        <Section
          title="درخواست‌های جاری شما"
          action={
            <Button component={Link} href="/repair/requests" size="small" endIcon={<ChevronLeftIcon />}>
              همه
            </Button>
          }
        >
          <Stack spacing={1}>
            {openRequests.slice(0, 3).map((row) => (
              <Box
                key={row.id}
                component={Link}
                href={`/repair/requests/${row.id}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: "action.hover",
                  color: "inherit",
                  textDecoration: "none",
                  transition: "background-color .15s",
                  "&:hover": { bgcolor: "action.selected" },
                }}
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700}>
                    #{row.id}
                    {row.category ? ` · ${row.category}` : ""}
                  </Typography>
                  <Typography
                    variant="caption"
                    component="div"
                    noWrap
                    color={row.status === "invoiced" ? "secondary.main" : "text.secondary"}
                    fontWeight={row.status === "invoiced" ? 700 : 400}
                  >
                    {row.status === "invoiced" ? `منتظر پرداخت شما · ${formatToman(row.total_amount)}` : row.description}
                  </Typography>
                </Box>
                <StatusChip status={row.status} label={row.status_label} />
              </Box>
            ))}
          </Stack>
        </Section>
      )}

      {isCustomer && services.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
            چه چیزی نیاز به تعمیر دارد؟
          </Typography>
          <Grid container spacing={1.5}>
            {services.map((service, index) => {
              const Icon = serviceIcon(service.name);
              const tone = TONES[index % TONES.length];
              return (
                <Grid key={service.key} size={{ xs: 4, sm: 3, md: 2 }}>
                  <Paper
                    component={Link}
                    href={`/repair/requests/new?service=${encodeURIComponent(service.key)}`}
                    variant="outlined"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      p: 1.5,
                      height: "100%",
                      borderRadius: 3,
                      color: "inherit",
                      textDecoration: "none",
                      textAlign: "center",
                      transition: "transform .15s, box-shadow .15s, border-color .15s",
                      "&:hover": { transform: "translateY(-2px)", boxShadow: 3, borderColor: tone.fg },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: tone.bg,
                        color: tone.fg,
                      }}
                    >
                      <Icon />
                    </Box>
                    <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.6 }}>
                      {service.name}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      <Box>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
          چطور کار می‌کند؟
        </Typography>
        <Grid container spacing={1.5}>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Grid key={step.title} size={{ xs: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ position: "relative", p: 2, borderRadius: 3, height: "100%", overflow: "hidden" }}>
                  <Typography
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: 4,
                      insetInlineEnd: 12,
                      fontSize: 44,
                      fontWeight: 900,
                      color: "primary.main",
                      opacity: 0.08,
                      lineHeight: 1,
                    }}
                  >
                    {(index + 1).toLocaleString("fa-IR")}
                  </Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "primary.main",
                      color: "#fff",
                      mb: 1.25,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                    {step.text}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
          چرا {brand}؟
        </Typography>
        <Grid container spacing={1.5}>
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const tone = TONES[index % TONES.length];
            return (
              <Grid key={feature.title} size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1.5} sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper", height: "100%" }}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: tone.bg,
                      color: tone.fg,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} sx={{ mb: 0.25 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                      {feature.text}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {config?.support_phone && (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 4,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
            borderColor: "primary.light",
            background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.06))",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
            <SupportAgentIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography fontWeight={800}>سؤالی دارید؟</Typography>
              <Typography variant="body2" color="text.secondary">
                کارشناسان پشتیبانی آمادهٔ پاسخ‌گویی به شما هستند.
              </Typography>
            </Box>
          </Stack>
          <Button
            href={`tel:${config.support_phone}`}
            variant="contained"
            startIcon={<PhoneIcon />}
            sx={{ borderRadius: 3, fontWeight: 700 }}
          >
            <Box component="span" dir="ltr">
              {config.support_phone}
            </Box>
          </Button>
        </Paper>
      )}
    </Stack>
  );
}
