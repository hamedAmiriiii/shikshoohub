"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SmsIcon from "@mui/icons-material/SmsOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toast } from "react-toastify";
import {
  formatFaDate,
  formatFaNumber,
  formatToman,
  isRepairError,
  repairApi,
  type RepairSmsLog,
  type RepairSmsOrder,
  type RepairSmsSummary,
} from "@/app/lib/repair/api";
import { getSmsDeliveryStatusColor } from "@/app/lib/shopSms";
import { EmptyState, Loader, Section, useRequireRole } from "../../ui";

type TabKey = "logs" | "charge";

const LOW_BALANCE = 50;

const STATUS_OPTIONS = [
  { value: "", label: "همه" },
  { value: "DELIVERED", label: "تحویل داده شده" },
  { value: "SENT", label: "ارسال‌شده به مخابرات" },
  { value: "failed", label: "ناموفق" },
  { value: "NO_CREDIT", label: "اعتبار ناکافی" },
];

function statusColor(status: string) {
  return status === "NO_CREDIT" ? "error" : getSmsDeliveryStatusColor(status);
}

export default function RepairSmsPage() {
  const { allowed } = useRequireRole(["admin"]);
  const [tab, setTab] = useState<TabKey>("logs");
  const [summary, setSummary] = useState<RepairSmsSummary | null>(null);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    const res = await repairApi.adminSmsSummary();
    if (isRepairError(res)) setError(res.message);
    else setSummary(res);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get("payment");
    if (result === "ok") toast.success("پرداخت انجام شد و پنل پیامک شارژ شد.");
    else if (result === "failed") toast.error(params.get("message") || "پرداخت ناموفق بود.");
    if (result || params.get("tab") === "charge") setTab("charge");
    if (result) window.history.replaceState(null, "", window.location.pathname);
    void loadSummary();
  }, [allowed, loadSummary]);

  if (!allowed) return <Loader />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!summary) return <Loader />;

  const low = summary.balance < LOW_BALANCE;

  return (
    <Stack spacing={2}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 4,
          color: "#fff",
          background: low
            ? "linear-gradient(135deg, #b91c1c 0%, #ea580c 100%)"
            : "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #7c3aed 100%)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SmsIcon sx={{ fontSize: 30 }} />
            </Box>
            <Box>
              <Typography sx={{ opacity: 0.85, fontSize: 14 }}>پیامک باقی‌مانده</Typography>
              <Typography fontWeight={900} sx={{ fontSize: { xs: 30, sm: 36 }, lineHeight: 1.3 }}>
                {formatFaNumber(summary.balance)}
                <Typography component="span" sx={{ fontSize: 15, fontWeight: 600, opacity: 0.85 }}>
                  {" "}
                  پیامک
                </Typography>
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={3} sx={{ opacity: 0.95 }}>
            <Box>
              <Typography sx={{ fontSize: 12, opacity: 0.8 }}>ارسال امروز</Typography>
              <Typography fontWeight={800}>{formatFaNumber(summary.sent_today)}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, opacity: 0.8 }}>مصرف این ماه</Typography>
              <Typography fontWeight={800}>{formatFaNumber(summary.used_this_month)}</Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            color="inherit"
            onClick={() => setTab("charge")}
            sx={{ color: low ? "#b91c1c" : "primary.main", fontWeight: 800, borderRadius: 3, px: 3 }}
          >
            شارژ پنل
          </Button>
        </Stack>
        {low && (
          <Typography sx={{ mt: 1.5, fontSize: 13, opacity: 0.95 }}>
            اعتبار پیامک رو به اتمام است. با تمام شدن اعتبار، پیامک‌های اطلاع‌رسانی ارسال نمی‌شوند (کد ورود همچنان ارسال
            می‌شود).
          </Typography>
        )}
      </Paper>

      {!summary.enabled && (
        <Alert severity="warning">
          جدول پیامک‌های تعمیرات روی سرور ساخته نشده است. فایل <b dir="ltr">create_repair_sms_logs_manual.sql</b> را اجرا کنید.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <Tabs value={tab} onChange={(_, v: TabKey) => setTab(v)} variant="fullWidth">
          <Tab value="logs" label="پیامک‌های ارسال‌شده" />
          <Tab value="charge" label="شارژ پنل پیامک" />
        </Tabs>
      </Paper>

      {tab === "logs" ? <SmsLogs summary={summary} /> : <SmsCharge summary={summary} />}
    </Stack>
  );
}

function SmsLogs({ summary }: { summary: RepairSmsSummary }) {
  const [rows, setRows] = useState<RepairSmsLog[] | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState<number | "all" | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setRows(null);
    const res = await repairApi.adminSmsLogs({ type, status, q: query, page });
    if (isRepairError(res)) {
      toast.error(res.message);
      setRows([]);
      return;
    }
    setRows(res.logs);
    setLastPage(res.meta.last_page);
    setTotal(res.meta.total);
  }, [type, status, query, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshOne = async (id: number) => {
    setRefreshing(id);
    const res = await repairApi.adminSmsRefreshStatus(id);
    setRefreshing(null);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    setRows((list) => list?.map((row) => (row.id === id ? res.log : row)) ?? list);
  };

  const refreshAll = async () => {
    setRefreshing("all");
    const res = await repairApi.adminSmsRefreshPending();
    setRefreshing(null);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    void load();
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField size="small" label="جستجو (شماره یا متن)" value={q} onChange={(e) => setQ(e.target.value)} fullWidth />
        <TextField select size="small" label="نوع پیامک" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} sx={{ minWidth: 170 }}>
          <MenuItem value="">همه</MenuItem>
          {summary.types.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="وضعیت" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 170 }}>
          {STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value || "all"} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {formatFaNumber(total)} پیامک
        </Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => void refreshAll()}
          disabled={refreshing !== null}
        >
          به‌روزرسانی وضعیت‌ها
        </Button>
      </Stack>

      {rows === null ? (
        <Loader />
      ) : rows.length === 0 ? (
        <EmptyState text="پیامکی یافت نشد." />
      ) : (
        rows.map((row) => (
          <Paper key={row.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography fontWeight={800} dir="ltr" sx={{ flexGrow: 1, textAlign: "right" }}>
                {row.phone}
              </Typography>
              <Chip size="small" variant="outlined" label={row.sms_type_label} />
              <Chip size="small" color={statusColor(row.delivery_status)} label={row.delivery_status_label} />
              {row.can_refresh && (
                <Tooltip title="استعلام وضعیت">
                  <span>
                    <IconButton size="small" onClick={() => void refreshOne(row.id)} disabled={refreshing !== null}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                bgcolor: "action.hover",
                p: 1.25,
                borderRadius: 2,
                lineHeight: 1.9,
              }}
            >
              {row.message}
            </Typography>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatFaDate(row.created_at)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFaNumber(row.sms_parts)} واحد
              </Typography>
            </Stack>
          </Paper>
        ))
      )}

      {lastPage > 1 && (
        <Stack alignItems="center">
          <Pagination count={lastPage} page={page} onChange={(_, p) => setPage(p)} />
        </Stack>
      )}
    </Stack>
  );
}

function SmsCharge({ summary }: { summary: RepairSmsSummary }) {
  const [selected, setSelected] = useState<number | null>(summary.packages[0]?.id ?? null);
  const [gateway, setGateway] = useState(summary.default_gateway);
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<RepairSmsOrder[] | null>(null);

  useEffect(() => {
    void repairApi.adminSmsOrders().then((res) => setOrders(isRepairError(res) ? [] : res.orders));
  }, []);

  const pay = async () => {
    if (!selected) {
      toast.error("یک بسته انتخاب کنید.");
      return;
    }
    setBusy(true);
    const res = await repairApi.adminSmsPurchase({
      package_id: selected,
      gateway,
      return_url: `${window.location.origin}${window.location.pathname}?tab=charge`,
    });
    if (isRepairError(res)) {
      setBusy(false);
      toast.error(res.message);
      return;
    }
    window.location.href = res.payment_url;
  };

  const chosen = summary.packages.find((p) => p.id === selected);

  return (
    <Stack spacing={2}>
      {summary.packages.length === 0 ? (
        <EmptyState text="بستهٔ پیامکی فعالی تعریف نشده است." />
      ) : (
        <Grid container spacing={1.5}>
          {summary.packages.map((pkg) => {
            const active = pkg.id === selected;
            const priceToman = pkg.price_toman ?? Math.floor(pkg.price_rial / 10);
            return (
              <Grid key={pkg.id} size={{ xs: 12, sm: 6 }}>
                <Paper
                  variant="outlined"
                  onClick={() => setSelected(pkg.id)}
                  sx={{
                    position: "relative",
                    p: 2.5,
                    borderRadius: 3,
                    cursor: "pointer",
                    height: "100%",
                    borderWidth: 2,
                    borderColor: active ? "primary.main" : "divider",
                    bgcolor: active ? "rgba(37,99,235,0.05)" : "background.paper",
                    transition: "border-color .15s, background-color .15s",
                  }}
                >
                  {active && (
                    <CheckCircleIcon color="primary" sx={{ position: "absolute", top: 12, insetInlineEnd: 12 }} />
                  )}
                  <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                    {pkg.name}
                  </Typography>
                  <Typography fontWeight={900} color="primary.main" sx={{ fontSize: 26 }}>
                    {formatFaNumber(pkg.sms_count)}
                    <Typography component="span" color="text.secondary" sx={{ fontSize: 14, fontWeight: 600 }}>
                      {" "}
                      پیامک
                    </Typography>
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 1 }}>
                    <Typography fontWeight={800}>{formatToman(priceToman)}</Typography>
                    {pkg.sms_count > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        هر پیامک {formatToman(Math.round(priceToman / pkg.sms_count))}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {summary.packages.length > 0 && (
        <Section title="درگاه پرداخت">
          <Stack spacing={2}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              color="primary"
              value={gateway}
              onChange={(_, value: string | null) => value && setGateway(value)}
            >
              {summary.gateways.map((g) => (
                <ToggleButton key={g.id} value={g.id} sx={{ fontWeight: 700 }}>
                  {g.name}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Button
              variant="contained"
              size="large"
              onClick={() => void pay()}
              disabled={busy || !chosen || !summary.enabled}
              sx={{ borderRadius: 3, fontWeight: 800 }}
            >
              {chosen
                ? `پرداخت ${formatToman(chosen.price_toman ?? Math.floor(chosen.price_rial / 10))} و شارژ ${formatFaNumber(chosen.sms_count)} پیامک`
                : "پرداخت"}
            </Button>
          </Stack>
        </Section>
      )}

      <Section title="سوابق شارژ">
        {orders === null ? (
          <Loader />
        ) : orders.length === 0 ? (
          <EmptyState text="هنوز شارژی انجام نشده است." />
        ) : (
          <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
            {orders.map((order) => (
              <Stack key={order.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.25 }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700}>
                    {order.name || "بستهٔ پیامک"} · {formatFaNumber(order.sms_count)} پیامک
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {formatFaDate(order.paid_at || order.created_at)}
                    {order.ref_id ? ` · کد پیگیری ${order.ref_id}` : ""}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="body2" fontWeight={700}>
                    {formatToman(order.amount_toman)}
                  </Typography>
                  <Chip
                    size="small"
                    color={order.status === "paid" ? "success" : "error"}
                    label={order.status === "paid" ? "موفق" : "ناموفق"}
                  />
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Section>
    </Stack>
  );
}
