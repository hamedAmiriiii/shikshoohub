"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Grid2 as Grid, Paper, Stack, Typography } from "@mui/material";
import { formatFaNumber, formatToman, isRepairError, repairApi, type RepairDashboard } from "@/app/lib/repair/api";
import { Loader, Section, StatusChip, useRequireRole } from "../ui";
import { AppQrCard } from "./AppQr";

export default function RepairAdminDashboard() {
  const { allowed } = useRequireRole(["admin"]);
  const [data, setData] = useState<RepairDashboard | null>(null);

  useEffect(() => {
    if (!allowed) return;
    void repairApi.adminDashboard().then((res) => {
      if (!isRepairError(res)) setData(res);
    });
  }, [allowed]);

  if (!allowed || !data) return <Loader />;

  const monthCards = [
    { label: "کارهای تکمیل‌شدهٔ این ماه", value: formatFaNumber(data.month.jobs) },
    { label: "دریافتی این ماه", value: formatToman(data.month.revenue) },
    { label: "سهم مجموعه (ماه)", value: formatToman(data.month.platform_share) },
    { label: "بدهی به تعمیرکاران", value: formatToman(data.technicians_balance), href: "/repair/admin/payouts" },
    ...(typeof data.sms_balance === "number"
      ? [{ label: "پیامک باقی‌مانده", value: formatFaNumber(data.sms_balance), href: "/repair/admin/sms" }]
      : []),
  ];

  return (
    <Stack spacing={2}>
      {(data.pending_technicians ?? 0) > 0 && (
        <Alert
          severity="warning"
          action={
            <Button component={Link} href="/repair/admin/technicians" color="inherit" size="small">
              بررسی
            </Button>
          }
        >
          {formatFaNumber(data.pending_technicians)} تعمیرکار ثبت‌نام کرده و منتظر تأیید است.
        </Alert>
      )}
      {typeof data.sms_balance === "number" && data.sms_balance < 50 && (
        <Alert
          severity={data.sms_balance === 0 ? "error" : "warning"}
          action={
            <Button component={Link} href="/repair/admin/sms?tab=charge" color="inherit" size="small">
              شارژ
            </Button>
          }
        >
          {data.sms_balance === 0
            ? "اعتبار پیامک تمام شده و پیامک‌های اطلاع‌رسانی ارسال نمی‌شوند."
            : `فقط ${formatFaNumber(data.sms_balance)} پیامک باقی مانده است.`}
        </Alert>
      )}
      <Grid container spacing={1.5}>
        {monthCards.map((card) => (
          <Grid key={card.label} size={{ xs: 6, sm: 4, md: 12 / monthCards.length }}>
            <Paper
              variant="outlined"
              component={card.href ? Link : "div"}
              href={card.href}
              sx={{ p: 2, borderRadius: 3, display: "block", textDecoration: "none", color: "inherit", height: "100%" }}
            >
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
              <Typography fontWeight={800}>{card.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Section title="درخواست‌ها بر اساس وضعیت">
        <Grid container spacing={1}>
          {data.counts.map((c) => (
            <Grid key={c.status} size={{ xs: 6, sm: 4 }}>
              <Paper
                component={Link}
                href={`/repair/admin/requests?status=${c.status}`}
                variant="outlined"
                sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit", borderRadius: 2 }}
              >
                <StatusChip status={c.status} label={c.label} />
                <Typography fontWeight={800}>{formatFaNumber(c.count)}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section title="QR نصب اپ‌ها">
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppQrCard kind="customer" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <AppQrCard kind="technician" />
          </Grid>
        </Grid>
      </Section>
    </Stack>
  );
}
