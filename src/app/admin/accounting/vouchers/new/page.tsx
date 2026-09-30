"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DateObject from "react-date-object";
import { toast } from "react-toastify";
import {
  auditorCorrectVoucher,
  auditorCreateVoucher,
  auditorPriorYearAdjust,
  createAccountingVoucher,
  fetchAccountingAccounts,
  fetchAccountingPeriods,
  fetchAccountingVoucher,
  formatAccountingMoney,
  jalaliYmd,
  postingAccounts,
  todayJalaliYmd,
  type AccountingAccount,
  type AccountingPeriodsInfo,
  type AccountingVoucher,
} from "@/app/lib/accounting";
import { parseJalaliDateString, todayJalaliDateObject } from "@/app/lib/cheques";
import { formatAmountInput, parseAmountInput } from "@/app/lib/amountInput";
import {
  AccountingJalaliDateField,
  AccountingPageShell,
  accountingButtonSx,
  accountingFieldSx,
} from "@/app/admin/accounting/ui";

type DraftLine = {
  key: string;
  account: AccountingAccount | null;
  debit: string;
  credit: string;
  description: string;
};

type Mode = "new" | "correct" | "adjusting" | "prior_year_adjust";

const TEMP_KINDS = new Set(["revenue", "cogs", "expense"]);

function emptyLine(): DraftLine {
  return {
    key: `${Date.now()}-${Math.random()}`,
    account: null,
    debit: "",
    credit: "",
    description: "",
  };
}

function amountText(value: number): string {
  return value > 0 ? formatAmountInput(String(Math.round(value))) : "";
}

function NewAccountingVoucherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const correctId = Number(searchParams.get("correct")) || 0;
  const refId = Number(searchParams.get("ref")) || 0;
  const mode: Mode = correctId
    ? "correct"
    : searchParams.get("mode") === "prior_year_adjust"
      ? "prior_year_adjust"
      : refId
        ? "adjusting"
        : "new";

  const [date, setDate] = useState<DateObject | null>(() => todayJalaliDateObject());
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(), emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [periods, setPeriods] = useState<AccountingPeriodsInfo | null>(null);
  const [source, setSource] = useState<AccountingVoucher | null>(null);
  const [loadingSource, setLoadingSource] = useState(Boolean(correctId || refId));

  useEffect(() => {
    fetchAccountingAccounts()
      .then((tree) => setAccounts(postingAccounts(tree)))
      .catch((e) => toast.error(e instanceof Error ? e.message : "خطا در دریافت حساب‌ها"));
    fetchAccountingPeriods()
      .then(setPeriods)
      .catch(() => setPeriods(null));
  }, []);

  useEffect(() => {
    const id = correctId || refId;
    if (!id) return;
    setLoadingSource(true);
    fetchAccountingVoucher(id)
      .then((voucher) => {
        setSource(voucher);
        const parsedDate = parseJalaliDateString(voucher.date);
        if (parsedDate) setDate(parsedDate);
        setDescription(correctId ? voucher.description : `اصلاح سند ${voucher.number}`);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "سند مرجع یافت نشد"))
      .finally(() => setLoadingSource(false));
  }, [correctId, refId]);

  useEffect(() => {
    if (mode !== "correct" || !source || accounts.length === 0) return;
    const byId = new Map(accounts.map((account) => [account.id, account]));
    setLines(
      source.lines.map((line) => ({
        ...emptyLine(),
        account: byId.get(line.account_id) ?? null,
        debit: amountText(line.debit),
        credit: amountText(line.credit),
        description: line.description,
      })),
    );
  }, [mode, source, accounts]);

  const canEditClosed = Boolean(periods?.can_edit_closed);
  const closedThrough = periods?.closed_through ?? null;
  const dateYmd = jalaliYmd(date) || todayJalaliYmd();
  const inClosedPeriod = Boolean(closedThrough && dateYmd <= closedThrough);
  const sourceInClosedPeriod = Boolean(closedThrough && source && source.date <= closedThrough);
  const reasonRequired =
    canEditClosed && (inClosedPeriod || mode === "prior_year_adjust" || (mode === "correct" && sourceInClosedPeriod));

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + parseAmountInput(line.debit), 0);
    const credit = lines.reduce((sum, line) => sum + parseAmountInput(line.credit), 0);
    return { debit, credit, diff: Math.abs(debit - credit), balanced: Math.abs(debit - credit) < 0.01 && debit > 0 };
  }, [lines]);

  const filledCount = lines.filter((line) => line.account && (parseAmountInput(line.debit) > 0 || parseAmountInput(line.credit) > 0)).length;
  const tempLineCount = lines.filter((line) => line.account && TEMP_KINDS.has(line.account.kind)).length;

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const handleAmount = (key: string, field: "debit" | "credit", value: string) => {
    const formatted = formatAmountInput(value);
    if (field === "debit") updateLine(key, { debit: formatted, credit: formatted ? "" : "" });
    else updateLine(key, { credit: formatted, debit: formatted ? "" : "" });
  };

  const blockedByLock = !canEditClosed && inClosedPeriod;
  const blockedByPriorDate = mode === "prior_year_adjust" && inClosedPeriod;

  const handleSave = useCallback(async () => {
    const payloadLines = lines
      .map((line) => ({
        account_id: line.account?.id,
        debit: parseAmountInput(line.debit),
        credit: parseAmountInput(line.credit),
        description: line.description.trim(),
      }))
      .filter((line) => line.account_id && (line.debit > 0 || line.credit > 0));

    if (payloadLines.length < 2) {
      toast.error("سند باید حداقل دو آرتیکل داشته باشد.");
      return;
    }
    if (!totals.balanced) {
      toast.error("سند نامتوازن است. جمع بدهکار و بستانکار برابر نیست.");
      return;
    }
    for (const line of payloadLines) {
      if ((line.debit > 0 && line.credit > 0) || (line.debit <= 0 && line.credit <= 0)) {
        toast.error("هر آرتیکل باید دقیقاً بدهکار یا بستانکار باشد.");
        return;
      }
    }
    if (reasonRequired && reason.trim().length < 3) {
      toast.error("دلیل تغییر را بنویسید.");
      return;
    }

    const body = {
      date: dateYmd,
      description: description.trim() || undefined,
      reason: reason.trim() || undefined,
      lines: payloadLines,
    };

    setSaving(true);
    try {
      let voucher: AccountingVoucher;
      if (mode === "correct") {
        voucher = await auditorCorrectVoucher(correctId, body);
        toast.success("سند اصلاح شد.");
      } else if (mode === "prior_year_adjust") {
        voucher = await auditorPriorYearAdjust(body);
        toast.success("تعدیلات سنواتی ثبت شد.");
      } else if (canEditClosed) {
        voucher = await auditorCreateVoucher(body);
        toast.success("سند ثبت شد.");
      } else {
        voucher = await createAccountingVoucher({
          date: body.date,
          description: body.description,
          source_type: "manual",
          lines: payloadLines,
        });
        toast.success("سند ثبت شد.");
      }
      router.push(`/admin/accounting/vouchers/${voucher.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ثبت سند");
    } finally {
      setSaving(false);
    }
  }, [canEditClosed, correctId, dateYmd, description, lines, mode, reason, reasonRequired, router, totals.balanced]);

  const title =
    mode === "correct"
      ? `اصلاح سند ${source?.number ?? ""}`
      : mode === "prior_year_adjust"
        ? "تعدیلات سنواتی"
        : mode === "adjusting"
          ? `سند اصلاحی برای سند ${source?.number ?? ""}`
          : "سند دستی";

  if (loadingSource) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "var(--admin-accent)" }} />
      </Box>
    );
  }

  return (
    <AccountingPageShell
      title={title}
      subtitle="جمع بدهکار و بستانکار باید برابر باشد. دکمه تا تراز بودن قفل است."
      actions={
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !totals.balanced || filledCount < 2 || blockedByLock || blockedByPriorDate}
          sx={accountingButtonSx}
        >
          {saving ? "در حال ثبت…" : mode === "correct" ? "ثبت اصلاح" : "ثبت سند"}
        </Button>
      }
    >
      {mode === "correct" ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          سند {source?.number} با همان تاریخ برگشت می‌خورد و این سند جایش ثبت می‌شود. هر دو در دفتر و لاگ حسابرس می‌مانند.
        </Alert>
      ) : null}
      {mode === "adjusting" ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          سند {source?.number} از عملیات سیستم ساخته شده و مستقیم تغییر نمی‌کند. فقط اختلاف را اینجا ثبت کنید، مثلاً برای
          جابه‌جایی حساب، حساب اشتباه را بستانکار و حساب درست را بدهکار کنید.
        </Alert>
      ) : null}
      {mode === "prior_year_adjust" ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          آرتیکل‌ها را مثل سند همان سال قبل وارد کنید. حساب‌های درآمد، بهای تمام‌شده و هزینه خودکار به «۳۵ سود انباشته»
          تبدیل می‌شوند و سود دورهٔ جاری دست نمی‌خورد.
          {tempLineCount > 0 ? ` (${new Intl.NumberFormat("fa-IR").format(tempLineCount)} آرتیکل به ۳۵ می‌رود.)` : ""}
        </Alert>
      ) : null}
      {inClosedPeriod && canEditClosed && mode !== "prior_year_adjust" ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          این تاریخ داخل دورهٔ بسته‌شده (تا {closedThrough}) است. اثر سود و زیانِ سند با یک «تکمیل بستن دوره» به سود
          انباشته می‌رود و گزارش‌های آن دوره عوض می‌شوند.
        </Alert>
      ) : null}
      {blockedByLock ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          دوره تا {closedThrough} بسته است. فقط حسابرس می‌تواند در این بازه سند بزند.
        </Alert>
      ) : null}
      {blockedByPriorDate ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          تاریخ تعدیلات سنواتی باید بعد از آخرین بستن ({closedThrough}) باشد.
        </Alert>
      ) : null}

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "200px 1fr" }, mb: 2 }}>
        <AccountingJalaliDateField value={date} onChange={setDate} />
        <TextField
          label="شرح سند"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={accountingFieldSx}
        />
      </Box>

      {canEditClosed ? (
        <TextField
          label={reasonRequired ? "دلیل تغییر (الزامی)" : "دلیل تغییر (اختیاری)"}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required={reasonRequired}
          fullWidth
          multiline
          minRows={2}
          sx={{ ...accountingFieldSx, mb: 2 }}
        />
      ) : null}

      {lines.map((line, index) => (
        <Box
          key={line.key}
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr 1.5fr auto" },
            alignItems: "center",
            mb: 1,
            p: 1,
            borderRadius: "8px",
            border: "1px solid var(--admin-border)",
            bgcolor: "var(--admin-surface)",
          }}
        >
          <Autocomplete
            options={accounts}
            value={line.account}
            onChange={(_e, value) => updateLine(line.key, { account: value })}
            getOptionLabel={(option) => `${option.code} — ${option.name}`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} label={`حساب آرتیکل ${index + 1}`} sx={accountingFieldSx} />
            )}
            slotProps={{
              paper: { sx: { bgcolor: "var(--admin-surface)", color: "var(--admin-text)" } },
            }}
          />
          <TextField
            label="بدهکار"
            value={line.debit}
            onChange={(e) => handleAmount(line.key, "debit", e.target.value)}
            inputMode="numeric"
            sx={accountingFieldSx}
          />
          <TextField
            label="بستانکار"
            value={line.credit}
            onChange={(e) => handleAmount(line.key, "credit", e.target.value)}
            inputMode="numeric"
            sx={accountingFieldSx}
          />
          <TextField
            label="شرح آرتیکل"
            value={line.description}
            onChange={(e) => updateLine(line.key, { description: e.target.value })}
            sx={accountingFieldSx}
          />
          <IconButton
            onClick={() => setLines((prev) => (prev.length <= 2 ? prev : prev.filter((item) => item.key !== line.key)))}
            disabled={lines.length <= 2}
            sx={{ color: "var(--admin-text-muted)" }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Box>
      ))}

      <Button startIcon={<AddIcon />} onClick={() => setLines((prev) => [...prev, emptyLine()])} sx={{ mb: 2 }}>
        آرتیکل جدید
      </Button>

      <Alert severity={totals.balanced ? "success" : "warning"} sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontSize: 13 }}>
            جمع بدهکار: {formatAccountingMoney(totals.debit)} — جمع بستانکار: {formatAccountingMoney(totals.credit)}
          </Typography>
          {!totals.balanced ? (
            <Typography sx={{ fontSize: 12 }}>اختلاف: {formatAccountingMoney(totals.diff)}</Typography>
          ) : null}
        </Box>
      </Alert>
    </AccountingPageShell>
  );
}

export default function NewAccountingVoucherPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      }
    >
      <NewAccountingVoucherPage />
    </Suspense>
  );
}
