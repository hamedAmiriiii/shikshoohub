"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import DateObject from "react-date-object";
import { toast } from "react-toastify";
import {
  fetchPeriodClosePreview,
  fetchPeriodCloseStatus,
  formatAccountingMoney,
  jalaliYmd,
  postPeriodClose,
  reopenPeriodClose,
  todayJalaliYmd,
  type PeriodCloseMode,
  type PeriodClosePreview,
  type PeriodCloseStatus,
} from "@/app/lib/accounting";
import { todayJalaliDateObject } from "@/app/lib/cheques";
import {
  AccountingJalaliDateField,
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
  accountingButtonSx,
  accountingFieldSx,
} from "@/app/admin/accounting/ui";

const STEPPER_LABELS = ["نوع و تاریخ", "آماده‌سازی عملیات", "کنترل دفتر", "ثبت بستن"];

const OPS_CHECKS = [
  { key: "recon", label: "تطبیق روزانه تا تاریخ بستن زده شده (کارتخوان و صندوق)." },
  { key: "docs", label: "فاکتور خرید، هزینه و حقوق همان دوره ثبت شده‌اند." },
  { key: "cheque", label: "وصول چک‌ها و نسیه/اقساط عقب‌مانده همان دوره در سیستم است." },
  {
    key: "credit",
    label: "می‌دانم اعتبار کیف پول مشتری بسته نمی‌شود؛ فقط هزینهٔ اعتبار مصرف‌شده به سود انباشته می‌رود.",
  },
];

export default function AccountingPeriodClosePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [mode, setMode] = useState<PeriodCloseMode>("year");
  const [year, setYear] = useState<number>(() => {
    const t = todayJalaliDateObject();
    return t.year || 1404;
  });
  const [asOf, setAsOf] = useState<DateObject | null>(() => todayJalaliDateObject());
  const [status, setStatus] = useState<PeriodCloseStatus | null>(null);
  const [ops, setOps] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<PeriodClosePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchPeriodCloseStatus();
      setStatus(data);
      if (data.default_year) setYear(data.default_year);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در وضعیت بستن دوره");
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const opsReady = OPS_CHECKS.every((item) => ops[item.key]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const data = await fetchPeriodClosePreview({
        mode,
        year: mode === "year" ? year : undefined,
        asOf: mode === "mid" ? jalaliYmd(asOf) || todayJalaliYmd() : undefined,
      });
      setPreview(data);
      setActiveStep(2);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در پیش‌نمایش بستن");
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePost = async () => {
    if (!preview?.can_close) return;
    setSaving(true);
    try {
      const result = await postPeriodClose({
        mode,
        year: mode === "year" ? year : undefined,
        asOf: mode === "mid" ? jalaliYmd(asOf) || todayJalaliYmd() : undefined,
      });
      toast.success(result.message);
      await loadStatus();
      if (result.data?.id) {
        router.push(`/admin/accounting/vouchers/${result.data.id}`);
        return;
      }
      setPreview(result.preview);
      setActiveStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ثبت بستن دوره");
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    setSaving(true);
    try {
      const result = await reopenPeriodClose();
      toast.success(result.message);
      setReopenOpen(false);
      setPreview(null);
      setActiveStep(0);
      await loadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در بازگشایی");
    } finally {
      setSaving(false);
    }
  };

  const yearEndHint = useMemo(() => {
    if (mode !== "year" || !status) return null;
    if (year === status.default_year && status.today < status.jalali_year_end) {
      return `سال ${year} هنوز به ${status.jalali_year_end} نرسیده. یا میان‌دوره تا امروز بزنید، یا صبر کنید تا آخر اسفند.`;
    }
    return null;
  }, [mode, year, status]);

  return (
    <AccountingPageShell
      title="بستن سال / میان‌دوره"
      subtitle="حساب‌های درآمد، تخفیف، بها و هزینه صفر می‌شوند و خالص به سود انباشته (۳۵) می‌رود. بعد از ثبت، تاریخ‌های آن دوره قفل می‌شوند."
      actions={
        status?.latest ? (
          <Button
            variant="outlined"
            onClick={() => setReopenOpen(true)}
            sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
          >
            بازگشایی آخرین بستن
          </Button>
        ) : null
      }
    >
      {status?.closed_through ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          دفتر تا {status.closed_through} بسته است. ثبت سند در این بازه رد می‌شود.
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          هنوز دوره‌ای بسته نشده؛ سود سال‌های قبل در ترازنامه به‌صورت «سود جاری» مانده است.
        </Alert>
      )}

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 3,
          "& .MuiStepLabel-label": { color: "var(--admin-text-muted)", fontSize: 12 },
          "& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
            color: "var(--admin-text)",
          },
        }}
      >
        {STEPPER_LABELS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          <FormControl>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
              نوع بستن
            </Typography>
            <RadioGroup
              value={mode}
              onChange={(e) => setMode(e.target.value as PeriodCloseMode)}
            >
              <FormControlLabel
                value="year"
                control={<Radio />}
                label="بستن سال مالی (۱ فروردین تا آخر اسفند همان سال)"
              />
              <FormControlLabel
                value="mid"
                control={<Radio />}
                label="بستن میان‌دوره (تا یک تاریخ مشخص؛ از فردای آخرین بستن)"
              />
            </RadioGroup>
          </FormControl>

          {mode === "year" ? (
            <TextField
              label="سال شمسی"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              sx={{ maxWidth: 220, ...accountingFieldSx }}
            />
          ) : (
            <Box sx={{ maxWidth: 280 }}>
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>
                تا تاریخ
              </Typography>
              <AccountingJalaliDateField value={asOf} onChange={setAsOf} placeholder="تاریخ بستن" />
            </Box>
          )}

          {yearEndHint ? <Alert severity="warning">{yearEndHint}</Alert> : null}

          <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
            نقد، موجودی، طلب و بدهی حمل می‌شوند. سند افتتاحیه سال بعد ساخته نمی‌شود.
          </Typography>

          <Box>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              sx={accountingButtonSx}
            >
              ادامه؛ چک‌لیست عملیات
            </Button>
          </Box>
        </Box>
      ) : null}

      {activeStep === 1 ? (
        <Box>
          <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", mb: 1.5 }}>
            این موارد در خود بستن خودکار چک نمی‌شوند؛ قبل از قفل دوره باید در ماژول مربوطه انجام شده باشند.
          </Typography>
          {OPS_CHECKS.map((item) => (
            <FormControlLabel
              key={item.key}
              sx={{ display: "flex", alignItems: "flex-start", mb: 1, ml: 0 }}
              control={
                <Checkbox
                  checked={Boolean(ops[item.key])}
                  onChange={(e) => setOps((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                />
              }
              label={
                <Typography sx={{ fontSize: 13, color: "var(--admin-text)", pt: 1 }}>
                  {item.label}
                </Typography>
              }
            />
          ))}
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button onClick={() => setActiveStep(0)}>بازگشت</Button>
            <Button
              variant="contained"
              disabled={!opsReady || loadingPreview}
              onClick={loadPreview}
              sx={accountingButtonSx}
            >
              {loadingPreview ? "در حال کنترل دفتر…" : "کنترل تراز و سود دوره"}
            </Button>
          </Box>
        </Box>
      ) : null}

      {activeStep >= 2 && preview ? (
        <Box>
          {preview.note ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              {preview.note}
            </Alert>
          ) : null}

          <Typography sx={{ fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
            مراحل کنترل دفتر
          </Typography>
          {preview.steps.map((step) => (
            <Box
              key={step.key}
              sx={{
                display: "flex",
                gap: 1,
                mb: 1,
                p: 1.25,
                borderRadius: 1,
                border: "1px solid var(--admin-border)",
                bgcolor: "var(--admin-surface)",
              }}
            >
              {step.ok ? (
                <CheckCircleOutlineIcon sx={{ color: "success.main" }} />
              ) : (
                <HighlightOffIcon sx={{ color: "error.main" }} />
              )}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: "var(--admin-text)" }}>
                  {step.title}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                  {step.detail}
                  {step.hint ? ` — ${step.hint}` : ""}
                </Typography>
              </Box>
            </Box>
          ))}

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              my: 2,
            }}
          >
            <Box sx={{ p: 1.5, border: "1px solid var(--admin-border)", borderRadius: 1 }}>
              <Typography sx={{ fontWeight: 700, mb: 1, fontSize: 13 }}>سود و زیان همین دوره</Typography>
              {[
                ["درآمد فروش", preview.profit_loss.sales],
                ["تخفیفات", preview.profit_loss.discounts],
                ["بهای تمام‌شده", preview.profit_loss.cogs],
                ["هزینه جاری", preview.profit_loss.operating_expense],
                ["حقوق", preview.profit_loss.payroll],
                ["اعتبار وفاداری", preview.profit_loss.loyalty],
                ["سایر درآمد", preview.profit_loss.other_income],
                ["سود خالص", preview.profit_loss.net_profit],
              ].map(([label, value]) => (
                <Box key={String(label)} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography sx={{ fontSize: 12 }}>{label}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                    {formatAccountingMoney(Number(value))}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ p: 1.5, border: "1px solid var(--admin-border)", borderRadius: 1 }}>
              <Typography sx={{ fontWeight: 700, mb: 1, fontSize: 13 }}>پیش‌نمایش سند</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <AccountingTableCell>حساب</AccountingTableCell>
                    <AccountingTableCell align="left">بدهکار</AccountingTableCell>
                    <AccountingTableCell align="left">بستانکار</AccountingTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.lines.map((line, index) => (
                    <AccountingTableRow key={`${line.account_id}-${index}`}>
                      <AccountingTableCell>
                        {line.account_code} {line.account_name}
                      </AccountingTableCell>
                      <AccountingTableCell align="left">
                        {line.debit ? formatAccountingMoney(line.debit) : "—"}
                      </AccountingTableCell>
                      <AccountingTableCell align="left">
                        {line.credit ? formatAccountingMoney(line.credit) : "—"}
                      </AccountingTableCell>
                    </AccountingTableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>

          {preview.already_posted ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              سند این تاریخ قبلاً ثبت شده است.
            </Alert>
          ) : null}

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              onClick={() => {
                setActiveStep(1);
              }}
            >
              بازگشت
            </Button>
            <Button
              variant="contained"
              disabled={!preview.can_close || saving}
              onClick={handlePost}
              sx={accountingButtonSx}
            >
              {saving ? "در حال ثبت…" : "تأیید و بستن دوره"}
            </Button>
            {preview.voucher?.id ? (
              <Button onClick={() => router.push(`/admin/accounting/vouchers/${preview.voucher?.id}`)}>
                مشاهده سند
              </Button>
            ) : null}
          </Box>
        </Box>
      ) : null}

      {status && status.history.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <Typography sx={{ fontWeight: 700, mb: 1, color: "var(--admin-text)" }}>
            دوره‌های بسته‌شده
          </Typography>
          {status.history.map((row) => (
            <Box
              key={row.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                py: 0.75,
                borderBottom: "1px solid var(--admin-border)",
                cursor: "pointer",
              }}
              onClick={() => router.push(`/admin/accounting/vouchers/${row.id}`)}
            >
              <Typography sx={{ fontSize: 13 }}>
                سند {row.number} — {row.date} — {row.description}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                {row.status_label}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}

      <Dialog open={reopenOpen} onClose={() => setReopenOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>بازگشایی آخرین بستن</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
            سند بستن برگشت می‌خورد و قفل تاریخ برداشته می‌شود. فقط آخرین بستن قابل بازگشایی است.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReopenOpen(false)}>انصراف</Button>
          <Button onClick={handleReopen} disabled={saving} sx={accountingButtonSx}>
            {saving ? "…" : "برگشت سند بستن"}
          </Button>
        </DialogActions>
      </Dialog>
    </AccountingPageShell>
  );
}
