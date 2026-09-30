"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Dialog, LinearProgress, Typography } from "@mui/material";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  fetchSmartCampaignReport,
  toFaNum,
  type SmartCampaign,
  type SmartCampaignReport,
} from "@/app/lib/smartCustomer";

function faDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fa-IR");
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ bgcolor: "var(--admin-surface-alt)", borderRadius: "10px", px: 1.25, py: 1 }}>
      <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 800, mt: 0.25 }}>{value}</Typography>
    </Box>
  );
}

export default function CampaignReportDialog({
  campaign,
  onClose,
}: {
  campaign: SmartCampaign | null;
  onClose: () => void;
}) {
  const [report, setReport] = useState<SmartCampaignReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!campaign) return;
    let cancelled = false;
    setReport(null);
    setError("");
    setLoading(true);
    fetchSmartCampaignReport(campaign.id)
      .then((res) => {
        if (!cancelled) setReport(res);
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e, "دریافت گزارش ناموفق"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaign]);

  const creditCost = report ? (report.credit_used ?? report.credit_given) : 0;
  const roi = report && creditCost > 0 ? report.revenue / creditCost : null;

  return (
    <Dialog
      open={Boolean(campaign)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 420,
          maxWidth: "calc(100% - 32px)",
          m: 2,
          p: 2,
          bgcolor: "var(--admin-surface)",
          color: "var(--admin-text)",
          border: "1px solid var(--admin-border)",
          borderRadius: "14px",
          direction: "rtl",
        },
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 15 }}>بررسی کمپین</Typography>
      <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mt: 0.25, mb: 1.5 }}>
        {campaign?.name}
      </Typography>

      {loading ? (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Typography sx={{ color: "var(--admin-error-soft, #e57373)", fontSize: 13, py: 2 }}>{error}</Typography>
      ) : report && report.recipients === 0 ? (
        <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", py: 2 }}>
          این کمپین هنوز برای کسی ارسال نشده.
        </Typography>
      ) : report ? (
        <>
          <Box sx={{ bgcolor: "var(--admin-surface-alt)", borderRadius: "12px", p: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontSize: 26, fontWeight: 900, color: "var(--admin-accent)", lineHeight: 1 }}>
                {toFaNum(report.returned)}
              </Typography>
              <Typography sx={{ fontSize: 13 }}>
                از {toFaNum(report.recipients)} نفر برگشتند و خرید کردند
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, report.conversion_pct)}
                sx={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "var(--admin-border)",
                  "& .MuiLinearProgress-bar": { bgcolor: "var(--admin-accent)", borderRadius: 3 },
                }}
              />
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                ٪{toFaNum(report.conversion_pct)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75, mt: 1 }}>
            <Stat label="خرید بعد از کمپین" value={`${toFaNum(report.revenue)} تومان`} />
            <Stat label="تعداد فاکتور" value={toFaNum(report.orders)} />
            <Stat label="میانگین هر فاکتور" value={`${toFaNum(report.avg_order_value)} تومان`} />
            <Stat
              label="میانگین فاصله تا برگشت"
              value={report.avg_days_to_return != null ? `${toFaNum(report.avg_days_to_return)} روز` : "—"}
            />
            <Stat label="اعتبار داده‌شده" value={`${toFaNum(report.credit_given)} تومان`} />
            <Stat
              label="اعتبار خرج‌شده"
              value={report.credit_used != null ? `${toFaNum(report.credit_used)} تومان` : "—"}
            />
          </Box>

          {roi != null ? (
            <Typography sx={{ fontSize: 12, mt: 1, color: "var(--admin-text-muted)" }}>
              هر ۱ تومان اعتبار ≈{" "}
              <Box component="span" sx={{ color: "var(--admin-accent)", fontWeight: 800 }}>
                {toFaNum(Math.round(roi * 10) / 10)} تومان
              </Box>{" "}
              فروش آورده
            </Typography>
          ) : null}

          <Typography sx={{ fontSize: 11, mt: 0.75, color: "var(--admin-text-muted)" }}>
            {toFaNum(report.runs)} بار اجرا · از {faDate(report.first_run_at)}
            {report.last_run_at && report.last_run_at !== report.first_run_at
              ? ` تا ${faDate(report.last_run_at)}`
              : ""}
          </Typography>

          {report.top_customers.length > 0 ? (
            <Box sx={{ mt: 1.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>برگشتی‌ها</Typography>
              <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                {report.top_customers.map((c) => (
                  <Box
                    key={c.phone}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 0.6,
                      borderBottom: "1px solid var(--admin-divider, var(--admin-border))",
                      fontSize: 12,
                    }}
                  >
                    <Typography sx={{ fontSize: 12, direction: "ltr", flex: 1 }}>{c.phone}</Typography>
                    <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                      {faDate(c.first_purchase_at)}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", minWidth: 44 }}>
                      {toFaNum(c.orders)} خرید
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, minWidth: 80, textAlign: "left" }}>
                      {toFaNum(c.revenue)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}
        </>
      ) : null}

      <Button
        fullWidth
        onClick={onClose}
        sx={{ mt: 1.5, borderRadius: "10px", fontSize: 13, color: "var(--admin-text-muted)" }}
      >
        بستن
      </Button>
    </Dialog>
  );
}
