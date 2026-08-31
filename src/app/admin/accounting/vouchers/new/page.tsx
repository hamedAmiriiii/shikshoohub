"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DateObject from "react-date-object";
import { toast } from "react-toastify";
import {
  createAccountingVoucher,
  fetchAccountingAccounts,
  formatAccountingMoney,
  jalaliYmd,
  postingAccounts,
  todayJalaliYmd,
  type AccountingAccount,
} from "@/app/lib/accounting";
import { todayJalaliDateObject } from "@/app/lib/cheques";
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

function emptyLine(): DraftLine {
  return {
    key: `${Date.now()}-${Math.random()}`,
    account: null,
    debit: "",
    credit: "",
    description: "",
  };
}

export default function NewAccountingVoucherPage() {
  const router = useRouter();
  const [date, setDate] = useState<DateObject | null>(() => todayJalaliDateObject());
  const [description, setDescription] = useState("");
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(), emptyLine()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccountingAccounts()
      .then((tree) => setAccounts(postingAccounts(tree)))
      .catch((e) => toast.error(e instanceof Error ? e.message : "خطا در دریافت حساب‌ها"));
  }, []);

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + parseAmountInput(line.debit), 0);
    const credit = lines.reduce((sum, line) => sum + parseAmountInput(line.credit), 0);
    return { debit, credit, diff: Math.abs(debit - credit), balanced: Math.abs(debit - credit) < 0.01 && debit > 0 };
  }, [lines]);

  const filledCount = lines.filter((line) => line.account && (parseAmountInput(line.debit) > 0 || parseAmountInput(line.credit) > 0)).length;

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const handleAmount = (key: string, field: "debit" | "credit", value: string) => {
    const formatted = formatAmountInput(value);
    if (field === "debit") updateLine(key, { debit: formatted, credit: formatted ? "" : "" });
    else updateLine(key, { credit: formatted, debit: formatted ? "" : "" });
  };

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

    setSaving(true);
    try {
      const voucher = await createAccountingVoucher({
        date: jalaliYmd(date) || todayJalaliYmd(),
        description: description.trim() || undefined,
        source_type: "manual",
        lines: payloadLines,
      });
      toast.success("سند ثبت شد.");
      router.push(`/admin/accounting/vouchers/${voucher.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ثبت سند");
    } finally {
      setSaving(false);
    }
  }, [date, description, lines, router, totals.balanced]);

  return (
    <AccountingPageShell
      title="سند دستی"
      subtitle="جمع بدهکار و بستانکار باید برابر باشد. دکمه تا تراز بودن قفل است."
      actions={
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !totals.balanced || filledCount < 2}
          sx={accountingButtonSx}
        >
          {saving ? "در حال ثبت…" : "ثبت سند"}
        </Button>
      }
    >
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "200px 1fr" }, mb: 2 }}>
        <AccountingJalaliDateField value={date} onChange={setDate} />
        <TextField
          label="شرح سند"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={accountingFieldSx}
        />
      </Box>

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
