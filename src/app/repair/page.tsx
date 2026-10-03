"use client";

import Link from "next/link";
import { Box, Button, Grid2 as Grid, Paper, Stack, Typography } from "@mui/material";
import EngineeringIcon from "@mui/icons-material/Engineering";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PaymentsIcon from "@mui/icons-material/Payments";
import VerifiedIcon from "@mui/icons-material/Verified";
import { repairHomeFor } from "@/app/lib/repair/api";
import { useRepairAuth } from "./RepairAuth";
import { RepairInstallBanner } from "./RepairInstall";

const STEPS = [
  { icon: AssignmentIcon, title: "ثبت درخواست", text: "مشکل و آدرس را بنویسید؛ چند ثانیه بیشتر طول نمی‌کشد." },
  { icon: EngineeringIcon, title: "اعزام تعمیرکار", text: "تعمیرکار مناسب ارجاع می‌شود و با شما تماس می‌گیرد." },
  { icon: PaymentsIcon, title: "پرداخت امن", text: "پس از انجام کار، هزینه را آنلاین یا کارت به کارت بپردازید." },
  { icon: VerifiedIcon, title: "پیگیری لحظه‌ای", text: "وضعیت درخواست و فاکتور همیشه در پنل شما در دسترس است." },
];

export default function RepairLandingPage() {
  const { user, config } = useRepairAuth();
  const brand = config?.brand_name || "تعمیرکار";
  const primaryHref = !user || user.role === "customer" ? "/repair/requests/new" : repairHomeFor(user.role);
  const primaryLabel = !user || user.role === "customer" ? "درخواست تعمیرکار" : "ورود به پنل";

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          color: "#fff",
          background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
        }}
      >
        <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5, fontSize: { xs: 26, sm: 34 } }}>
          {brand}؛ تعمیرکار مطمئن، دمِ در خانه
        </Typography>
        <Typography sx={{ opacity: 0.9, mb: 3, lineHeight: 2 }}>
          درخواست بدهید، تعمیرکار متخصص اعزام می‌شود و بعد از انجام کار، هزینه را با فاکتور شفاف پرداخت می‌کنید.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button component={Link} href={primaryHref} size="large" variant="contained" color="inherit" sx={{ color: "primary.main", fontWeight: 700 }}>
            {primaryLabel}
          </Button>
          {user?.role === "customer" && (
            <Button component={Link} href="/repair/requests" size="large" variant="outlined" color="inherit">
              پیگیری درخواست‌ها
            </Button>
          )}
          {!user && (
            <Button component={Link} href="/repair/login" size="large" variant="outlined" color="inherit">
              ورود تعمیرکاران و مدیر
            </Button>
          )}
        </Stack>
      </Paper>

      <RepairInstallBanner app="customer" />

      <Grid container spacing={2}>
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Grid key={step.title} size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                <Box sx={{ color: "primary.main", mb: 1 }}>
                  <Icon />
                </Box>
                <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.text}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {config?.support_phone && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          پشتیبانی: <a href={`tel:${config.support_phone}`}>{config.support_phone}</a>
        </Typography>
      )}
    </Stack>
  );
}
