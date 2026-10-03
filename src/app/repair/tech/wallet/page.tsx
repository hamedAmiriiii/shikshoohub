"use client";

import { useEffect, useState } from "react";
import { Grid2 as Grid, Paper, Stack, Typography } from "@mui/material";
import {
  formatFaDate,
  formatFaNumber,
  formatToman,
  isRepairError,
  repairApi,
  type RepairPayout,
  type RepairWalletSummary,
} from "@/app/lib/repair/api";
import { EmptyState, Loader, Section, useRequireRole } from "../../ui";

export default function TechnicianWalletPage() {
  const { allowed } = useRequireRole(["technician"]);
  const [data, setData] = useState<{ summary: RepairWalletSummary; share_percent: number; payouts: RepairPayout[] } | null>(null);

  useEffect(() => {
    if (!allowed) return;
    void repairApi.techWallet().then((res) => {
      if (!isRepairError(res)) setData(res);
    });
  }, [allowed]);

  if (!allowed || !data) return <Loader />;
  const { summary } = data;

  const cards = [
    { label: "مانده قابل دریافت", value: formatToman(summary.balance), color: summary.balance > 0 ? "success.main" : "text.primary" },
    { label: "کل سهم کارکرد", value: formatToman(summary.earned) },
    { label: "دریافت‌شده", value: formatToman(summary.paid) },
    { label: "کارهای انجام‌شده", value: formatFaNumber(summary.completed_jobs) },
  ];

  return (
    <Stack spacing={2}>
      <Grid container spacing={1.5}>
        {cards.map((card) => (
          <Grid key={card.label} size={{ xs: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
              <Typography fontWeight={800} color={card.color}>
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Typography variant="body2" color="text.secondary">
        سهم شما: {data.share_percent}٪ اجرت + کل هزینهٔ قطعات هر کار.
      </Typography>
      <Section title="تسویه‌های دریافتی">
        {data.payouts.length === 0 ? (
          <EmptyState text="هنوز تسویه‌ای ثبت نشده است." />
        ) : (
          <Stack divider={<span style={{ borderTop: "1px solid #eee" }} />}>
            {data.payouts.map((p) => (
              <Stack key={p.id} direction="row" justifyContent="space-between" sx={{ py: 1 }}>
                <div>
                  <Typography variant="body2">{formatFaDate(p.paid_on, false)}</Typography>
                  {(p.method || p.note) && (
                    <Typography variant="caption" color="text.secondary">
                      {[p.method, p.note].filter(Boolean).join(" — ")}
                    </Typography>
                  )}
                </div>
                <Typography fontWeight={700}>{formatToman(p.amount)}</Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Section>
    </Stack>
  );
}
