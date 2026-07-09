"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import {
  fetchPublicReferralDashboard,
  PublicReferralResponse,
  ReferralItem,
  toFaNumber,
} from "@/app/lib/referral";

type Props = {
  params: {
    token: string;
  };
};

function statusChipColor(status?: string): "default" | "success" | "warning" | "info" {
  if (status === "rewarded") return "success";
  if (status === "paid") return "info";
  if (status === "registered") return "warning";
  return "default";
}

export default function PublicReferralDashboardPage({ params }: Props) {
  const token = decodeURIComponent(params.token);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<PublicReferralResponse | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      const json = await fetchPublicReferralDashboard(token);

      if (!active) return;

      if (json.hasError) {
        setError(json.message || "اطلاعات معرفی یافت نشد.");
        setData(null);
      } else {
        setData(json);
      }
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [token]);

  const stats = useMemo(() => data?.stats ?? {}, [data]);
  const referrals = data?.referrals ?? [];
  const referrer = data?.referrer;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        py: { xs: 3, md: 5 },
        px: 2,
        direction: "rtl",
      }}
    >
      <Container maxWidth="md">
        <Typography
          sx={{ color: "var(--admin-text)", fontWeight: 800, fontSize: { xs: "22px", md: "28px" }, mb: 1 }}
        >
          آمار معرفی
        </Typography>

        {referrer && (
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", mb: 3 }}>
            معرف: {referrer.name || "—"}
            {referrer.phone ? ` · ${referrer.phone}` : ""}
            {referrer.referral_code ? ` · کد: ${referrer.referral_code}` : ""}
          </Typography>
        )}

        {!referrer && (
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", mb: 3 }}>
            شناسه: {token}
          </Typography>
        )}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}>
                  <CardContent>
                    <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}>
                      تعداد ثبت‌نام
                    </Typography>
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "28px" }}>
                      {toFaNumber(stats.registered_count ?? 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}>
                  <CardContent>
                    <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}>
                      تعداد خرید اشتراک
                    </Typography>
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "28px" }}>
                      {toFaNumber(stats.paid_count ?? 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}>
                  <CardContent>
                    <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}>
                      موجودی پاداش
                    </Typography>
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "28px" }}>
                      {toFaNumber(stats.referral_balance ?? 0)} تومان
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: "16px",
                backgroundColor: "var(--admin-surface-alt)",
                border: "1px solid var(--admin-border)",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "var(--admin-text-secondary)", fontWeight: 600 }}>
                      فروشگاه
                    </TableCell>
                    <TableCell sx={{ color: "var(--admin-text-secondary)", fontWeight: 600 }}>
                      وضعیت
                    </TableCell>
                    <TableCell sx={{ color: "var(--admin-text-secondary)", fontWeight: 600 }}>
                      اشتراک
                    </TableCell>
                    <TableCell sx={{ color: "var(--admin-text-secondary)", fontWeight: 600 }}>
                      پاداش
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {referrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ color: "var(--admin-text-secondary)" }}>
                        زیرمجموعه‌ای ثبت نشده است.
                      </TableCell>
                    </TableRow>
                  ) : (
                    referrals.map((row: ReferralItem, index) => (
                      <TableRow key={`${row.shop?.name ?? "row"}-${index}`}>
                        <TableCell sx={{ color: "var(--admin-text)" }}>
                          {row.shop?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.status_label || row.status || "—"}
                            color={statusChipColor(row.status)}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "var(--admin-text-secondary)" }}>
                          {row.shop?.subscription_status === "paid" || row.shop?.is_paid
                            ? "پولی"
                            : "آزمایشی"}
                        </TableCell>
                        <TableCell sx={{ color: "var(--admin-text)" }}>
                          {row.reward_amount ? `${toFaNumber(row.reward_amount)} تومان` : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* <Typography sx={{ mt: 3, color: "var(--admin-text-secondary)", fontSize: "13px" }}>
          برای مشاهده لینک دیگر، به{" "}
          <Link href="/referrals" style={{ color: "var(--admin-accent)" }}>
            صفحه جستجوی معرفی
          </Link>{" "}
          بروید.
        </Typography> */}
      </Container>
    </Box>
  );
}
