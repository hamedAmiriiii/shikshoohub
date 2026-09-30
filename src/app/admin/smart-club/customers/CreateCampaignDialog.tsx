"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { formatAmountInput, parseAmountInput } from "@/app/lib/amountInput";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  createSmartCampaign,
  runSmartCampaign,
  toFaNum,
  type SmartCampaign,
} from "@/app/lib/smartCustomer";

type CampaignRule = { field: string; op: string; value: unknown };

type CreateCampaignDialogProps = {
  open: boolean;
  onClose: () => void;
  /** شرط‌های کمپین از روی فیلترهای فعلی لیست مشتریان */
  conditions: CampaignRule[];
  recipientsCount: number;
  defaultName: string;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    bgcolor: "var(--admin-surface-alt)",
    borderRadius: "10px",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "var(--admin-border)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiFormHelperText-root": { color: "var(--admin-text-muted)", mx: 0.5 },
} as const;

const DEFAULT_SMS = "دلمون براتون تنگ شده! {credit} تومان اعتبار هدیه منتظر شماست.";

export default function CreateCampaignDialog({
  open,
  onClose,
  conditions,
  recipientsCount,
  defaultName,
}: CreateCampaignDialogProps) {
  const [name, setName] = useState(defaultName);
  const [credit, setCredit] = useState("100,000");
  const [expiresDays, setExpiresDays] = useState("14");
  const [smsMessage, setSmsMessage] = useState(DEFAULT_SMS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(defaultName);
  }, [open, defaultName]);

  const creditAmount = Math.floor(parseAmountInput(credit));
  const days = Math.max(0, Math.floor(Number(expiresDays) || 0));
  const message = smsMessage.trim();
  const hasAction = creditAmount > 0 || message !== "";
  const canSubmit = !busy && name.trim() !== "" && hasAction && recipientsCount > 0 && conditions.length > 0;

  const buildActions = () => {
    const actions: { type: string; config: Record<string, unknown> }[] = [];
    if (creditAmount > 0) {
      actions.push({
        type: "grant_credit",
        config: { amount: creditAmount, mode: "add", ...(days > 0 ? { expires_days: days } : {}) },
      });
    }
    if (message) actions.push({ type: "send_sms", config: { message } });
    return actions;
  };

  const submit = async (runNow: boolean) => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const created = (await createSmartCampaign({
        name: name.trim(),
        status: "active",
        cooldown_days: 1000,
        max_recipients_per_run: Math.min(10000, Math.max(1, recipientsCount)),
        conditions: { all: conditions },
        actions: buildActions(),
      })) as { campaign?: SmartCampaign };

      if (!runNow) {
        toast.success("کمپین ذخیره شد؛ از صفحه کمپین‌ها هر وقت خواستی اجرا کن");
        onClose();
        return;
      }

      const campaignId = created?.campaign?.id;
      if (!campaignId) {
        toast.warning("کمپین ساخته شد ولی اجرا نشد؛ از صفحه کمپین‌ها اجرا کن");
        onClose();
        return;
      }

      const res = (await runSmartCampaign(campaignId)) as {
        ok?: boolean;
        message?: string;
        matched?: number;
        sent?: number;
        skipped?: number;
        failed?: number;
      };
      if (res.ok === false) {
        toast.error(`کمپین ذخیره شد ولی اجرا نشد: ${res.message || "خطا"}`);
      } else {
        toast.success(
          `ارسال شد به ${toFaNum(res.sent)} مشتری` +
            ((res.skipped || 0) > 0 ? `، ${toFaNum(res.skipped)} نفر رد شدند` : "") +
            ((res.failed || 0) > 0 ? `، ${toFaNum(res.failed)} ناموفق` : ""),
        );
      }
      onClose();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ساخت کمپین ناموفق"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      PaperProps={{
        sx: {
          width: 360,
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
      <Typography sx={{ fontWeight: 800, fontSize: 15 }}>کمپین برای این مشتری‌ها</Typography>
      <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mt: 0.25, mb: 1.5 }}>
        {toFaNum(recipientsCount)} مشتری · اعتبار و پیامک برای همین لیست
      </Typography>

      <Box sx={{ display: "grid", gap: 1 }}>
        <TextField
          size="small"
          label="نام کمپین"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={fieldSx}
        />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 1 }}>
          <TextField
            size="small"
            label="اعتبار هدیه (تومان)"
            value={credit}
            onChange={(e) => setCredit(formatAmountInput(e.target.value))}
            inputMode="numeric"
            helperText="خالی = بدون اعتبار"
            sx={fieldSx}
          />
          <TextField
            size="small"
            label="مهلت (روز)"
            value={expiresDays}
            onChange={(e) => setExpiresDays(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            disabled={creditAmount <= 0}
            sx={fieldSx}
          />
        </Box>
        <TextField
          size="small"
          label="متن پیامک"
          value={smsMessage}
          onChange={(e) => setSmsMessage(e.target.value)}
          multiline
          minRows={2}
          helperText="{credit} = مبلغ اعتبار · خالی = بدون پیامک"
          sx={fieldSx}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          disabled={!canSubmit}
          onClick={() => void submit(true)}
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ borderRadius: "10px", fontWeight: 700, fontSize: 13 }}
        >
          ساخت و ارسال به {toFaNum(recipientsCount)} نفر
        </Button>
        <Button
          disabled={!canSubmit}
          onClick={() => void submit(false)}
          sx={{ borderRadius: "10px", fontSize: 12, color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}
        >
          فقط ذخیره
        </Button>
      </Box>
    </Dialog>
  );
}
