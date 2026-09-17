"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import CloseIcon from "@mui/icons-material/Close";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  fetchProductSignals,
  fetchSmartOverview,
  recomputeSmartCustomer,
  toFaNum,
  type ProductSignalResult,
  type SmartOverview,
} from "@/app/lib/smartCustomer";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const panelSx = {
  boxShadow: "none",
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  p: 2,
} as const;

export default function SmartClubDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<SmartOverview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [signal, setSignal] = useState<ProductSignalResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSmartOverview();
      setData(res);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت باشگاه هوشمند"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRecompute = async () => {
    setBusy(true);
    try {
      const res = await recomputeSmartCustomer();
      toast.success((res as { message?: string }).message || "محاسبه انجام شد");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "محاسبه ناموفق بود"));
    } finally {
      setBusy(false);
    }
  };

  const openSignals = async (type: "bad" | "good") => {
    setModalOpen(true);
    setModalLoading(true);
    setSignal(null);
    try {
      const res = await fetchProductSignals(type);
      setSignal(res);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت لیست کالا"));
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <Box sx={adminPageSx}>
      <ToastContainer position="top-center" rtl />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 1, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            باشگاه هوشمند
          </Typography>
          <Typography variant="body2" color="text.secondary">
            پیشنهادهای امروز بر اساس RFM و رفتار خرید
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRecompute}
          disabled={busy}
          sx={adminButtonStartIconSx}
        >
          {busy ? "در حال محاسبه..." : "محاسبه دوباره"}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !data?.ready ? (
        <Box sx={panelSx}>
          <Typography>
            {data?.message || "جداول باشگاه هوشمند هنوز آماده نیست. فایل SQL را اجرا کنید."}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ ...panelSx, mb: 2 }}>
            <Typography fontWeight={700} mb={1}>
              سلام — امروز سیستم {(data.headline || []).length} پیشنهاد برای شما دارد:
            </Typography>
            {(data.headline || []).length === 0 ? (
              <Typography color="text.secondary">
                پیشنهادی نیست. اول «محاسبه دوباره» را بزنید یا صبر کنید تا کرون شبانه اجرا شود.
              </Typography>
            ) : (
              <Box component="ul" sx={{ m: 0, pr: 2 }}>
                {(data.headline || []).map((h) => (
                  <Typography component="li" key={h.text} sx={{ mb: 0.5 }}>
                    {h.tone === "danger" ? "🔴" : h.tone === "warning" ? "🟡" : "🟢"} {h.text}
                  </Typography>
                ))}
              </Box>
            )}
            {data.last_computed_at && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                آخرین محاسبه: {data.last_computed_at}
              </Typography>
            )}
          </Box>

          <Grid container spacing={1.5} mb={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<ThumbDownAltOutlinedIcon />}
                onClick={() => void openSignals("bad")}
                sx={{ ...adminButtonStartIconSx, py: 1.75, ...panelSx }}
              >
                کالاهای بد
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="success"
                startIcon={<ThumbUpAltOutlinedIcon />}
                onClick={() => void openSignals("good")}
                sx={{ ...adminButtonStartIconSx, py: 1.75, ...panelSx }}
              >
                کالاهای خوب
              </Button>
            </Grid>
          </Grid>

          <Typography fontWeight={700} mb={1}>
            پیشنهادهای امروز
          </Typography>
          <Grid container spacing={1.5} mb={2}>
            {(data.suggestions || []).map((s) => (
              <Grid item xs={12} md={4} key={s.key}>
                <Box sx={panelSx}>
                  <Typography fontWeight={700}>{s.title}</Typography>
                  <Typography variant="h5" fontWeight={800} my={1}>
                    {toFaNum(s.count)} مشتری
                  </Typography>
                  {s.estimated_revenue != null && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      ارزش تقریبی: {toFaNum(s.estimated_revenue)} تومان
                    </Typography>
                  )}
                  <Button component={Link} href="/admin/smart-club/actions" size="small" variant="outlined">
                    مشاهده پیشنهادها
                  </Button>
                </Box>
              </Grid>
            ))}
            {(data.suggestions || []).length === 0 && (
              <Grid item xs={12}>
                <Box sx={panelSx}>
                  <Typography color="text.secondary">فعلاً پیشنهاد آماده‌ای نیست.</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <Typography fontWeight={700} mb={1}>
            سگمنت‌ها
          </Typography>
          <Grid container spacing={1.5} mb={2}>
            {Object.entries(data.segment_labels || {}).map(([key, label]) => (
              <Grid item xs={6} sm={4} md={3} key={key}>
                <Box
                  component={Link}
                  href={`/admin/smart-club/customers?segment=${key}`}
                  sx={{ ...panelSx, display: "block", textDecoration: "none", color: "inherit" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {toFaNum(data.counts?.[key] || 0)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={1.5}>
            {[
              { href: "/admin/smart-club/customers", label: "مشتریان RFM", icon: <PeopleAltOutlinedIcon /> },
              { href: "/admin/smart-club/actions", label: "پیشنهاد اقدام", icon: <BoltOutlinedIcon /> },
              { href: "/admin/smart-club/campaigns", label: "کمپین‌ها", icon: <CampaignOutlinedIcon /> },
              { href: "/admin/smart-club/thresholds", label: "آستانه‌ها", icon: <TuneOutlinedIcon /> },
            ].map((item) => (
              <Grid item xs={6} md={3} key={item.href}>
                <Button
                  fullWidth
                  component={Link}
                  href={item.href}
                  variant="outlined"
                  startIcon={item.icon}
                  sx={{ ...adminButtonStartIconSx, py: 1.5, ...panelSx }}
                >
                  {item.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography fontWeight={800}>{signal?.title || "نتیجه"}</Typography>
          <IconButton onClick={() => setModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {modalLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !signal ? null : (
            <>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {signal.description}
              </Typography>
              <Typography fontWeight={700} mb={1}>
                {toFaNum(signal.customer_count)} مشتری
              </Typography>

              <Typography fontWeight={700} mt={2} mb={1}>
                کالاهای مشترک (بیشترین)
              </Typography>
              {signal.common_products.length === 0 ? (
                <Typography color="text.secondary" mb={2}>
                  کالایی پیدا نشد. اول «محاسبه دوباره» را بزنید.
                </Typography>
              ) : (
                <Box sx={{ overflowX: "auto", mb: 2, border: "1px solid var(--admin-border)", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>کالا</TableCell>
                        <TableCell>تعداد مشتری</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {signal.common_products.map((p) => (
                        <TableRow key={p.product_id}>
                          <TableCell>{p.product_name}</TableCell>
                          <TableCell>{toFaNum(p.customer_count)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />
              <Typography fontWeight={700} mb={1}>
                جزئیات مشتریان
              </Typography>
              <Box sx={{ overflowX: "auto", border: "1px solid var(--admin-border)", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>مشتری</TableCell>
                      <TableCell>خریدها</TableCell>
                      <TableCell>میانگین فاصله</TableCell>
                      <TableCell>روز از آخرین</TableCell>
                      <TableCell>آستانه ۲۰٪+</TableCell>
                      <TableCell>آخرین کالا</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {signal.customers.map((c) => (
                      <TableRow key={c.phone}>
                        <TableCell>
                          <Typography fontWeight={600}>{c.name || "—"}</Typography>
                          <Typography variant="caption">{c.phone}</Typography>
                        </TableCell>
                        <TableCell>{toFaNum(c.frequency)}</TableCell>
                        <TableCell>{toFaNum(c.avg_days_between)} روز</TableCell>
                        <TableCell>{toFaNum(c.recency_days)}</TableCell>
                        <TableCell>{toFaNum(c.overdue_threshold_days)}</TableCell>
                        <TableCell>{c.last_product_name || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
