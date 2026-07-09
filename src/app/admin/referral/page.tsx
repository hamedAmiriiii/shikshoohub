"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import {
  buildRegisterLinkFallback,
  ReferralItem,
  ReferrerPanelResponse,
  toFaNumber,
} from "@/app/lib/referral";
import { toast } from "react-toastify";

function statusChipColor(status?: string): "default" | "success" | "warning" | "info" {
  if (status === "rewarded") return "success";
  if (status === "paid") return "info";
  if (status === "registered") return "warning";
  return "default";
}

export default function ReferralPanelPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ReferrerPanelResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = tokenCode();
      if (!token) {
        setError("برای مشاهده پنل معرفی ابتدا وارد شوید.");
        setData(null);
        return;
      }

      const res = (await apiRequestError(
        "Get",
        {},
        {},
        "/api/referral",
        true,
        true,
        token,
      )) as ReferrerPanelResponse;

      if (res?.hasError) {
        setError(
          typeof res.message === "string" ? res.message : "دریافت اطلاعات معرفی ناموفق بود.",
        );
        setData(null);
        return;
      }

      setData(res);
    } catch {
      setError("خطا در ارتباط با سرور.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const registerLink =
    data?.register_link ||
    (data?.referral_code ? buildRegisterLinkFallback(data.referral_code) : "");
  const dashboardLink = data?.dashboard_link || "";
  const stats = data?.stats;
  const referrals = data?.referrals ?? [];

  const copyText = async (text: string, successMsg: string) => {
    if (!text) {
      toast.error("لینک در دسترس نیست");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg);
    } catch {
      toast.error("کپی لینک انجام نشد");
    }
  };

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 1.5, md: 2 }, direction: "rtl" ,marginBottom:"60px" }}>
      <Container maxWidth="lg">
        <Typography
          sx={{
            color: "var(--admin-text)",
            fontWeight: 800,
            fontSize: { xs: "22px", md: "28px" },
            mb: 0.5,
          }}
        >
          پنل معرفی
        </Typography>
        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "14px", mb: 3 }}>
          لینک ثبت‌نام را با دوستان خود به اشتراک بگذارید. پس از فعال‌سازی پلن پولی توسط ادمین،
          پاداش به موجودی شما اضافه می‌شود.
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && data && (
          <>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: "16px",
                backgroundColor: "var(--admin-surface-alt)",
                border: "1px solid var(--admin-border)",
              }}
            >
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}>
                کد معرفی شما
              </Typography>
              <Typography
                sx={{
                  color: "var(--admin-text)",
                  fontWeight: 700,
                  fontSize: "24px",
                  letterSpacing: "0.08em",
                  mb: 2,
                }}
              >
                {data.referral_code || "—"}
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => void copyText(registerLink, "لینک ثبت‌نام کپی شد")}
                  sx={{
                    backgroundColor: "var(--admin-accent)",
                    "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
                  }}
                >
                  کپی لینک ثبت‌نام
                </Button>
                {dashboardLink && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => void copyText(dashboardLink, "لینک داشبورد کپی شد")}
                      sx={{ borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
                    >
                      کپی لینک داشبورد
                    </Button>
                    <Button
                      variant="text"
                      startIcon={<OpenInNewIcon />}
                      href={dashboardLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: "var(--admin-accent)" }}
                    >
                      مشاهده داشبورد عمومی
                    </Button>
                  </>
                )}
              </Box>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: "ثبت‌نام‌شده", value: stats?.registered_count ?? 0 },
                { label: "خرید اشتراک", value: stats?.paid_count ?? 0 },
                { label: "پاداش پرداخت‌شده", value: stats?.rewarded_count ?? 0 },
                {
                  label: "موجودی پاداش (تومان)",
                  value: stats?.referral_balance ?? 0,
                  suffix: "",
                },
              ].map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item.label}>
                  <Card
                    sx={{
                      backgroundColor: "var(--admin-surface-alt)",
                      border: "1px solid var(--admin-border)",
                    }}
                  >
                    <CardContent>
                      <Typography
                        sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 0.5 }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "26px" }}
                      >
                        {toFaNumber(item.value)}
                        {item.suffix}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {typeof stats?.reward_per_activation === "number" && (
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 2 }}>
                مبلغ پاداش هر فعال‌سازی: {toFaNumber(stats.reward_per_activation)} تومان
              </Typography>
            )}

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
                        هنوز زیرمجموعه‌ای ثبت نشده است.
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
      </Container>
    </Box>
  );
}
