"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { toast } from "react-toastify";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import BottomSheet from "@/app/coponent/BottomSheet";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";
import {
  MANUAL_TRADE_TYPE_OPTIONS,
  formatInputWithSeparator,
  parseAmount,
  parseTradeDateObject,
  resolveShopAccountId,
  todayJalaliDateObject,
  tradeDateToApi,
  type ManualTrade,
  type ManualTradeType,
} from "@/app/lib/manualTrades";

const DATE_PICKER_Z = 1600;

export const manualTradeFormFieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontSize: "13px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": {
    color: "var(--admin-text-muted)",
    right: 14,
    left: "auto",
    transformOrigin: "top right",
    fontSize: "13px",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(-14px, -9px) scale(0.75)",
  },
  "& .MuiInputBase-input": {
    textAlign: "right",
    direction: "rtl",
    py: "8.5px",
  },
} as const;

const datePickerBoxSx = {
  width: "100%",
  "& .rmdp-wrapper": { width: "100%" },
  "& .rmdp-portal": { zIndex: `${DATE_PICKER_Z} !important` },
  "& .rmdp-input": {
    width: "100%",
    height: "40px",
    borderRadius: "8px",
    backgroundColor: "var(--admin-surface-alt)",
    border: "1px solid var(--admin-border)",
    color: "var(--admin-text)",
    fontSize: "13px",
    padding: "6px 10px",
    boxSizing: "border-box",
  },
  "& .rmdp-input:focus": {
    borderColor: "var(--admin-accent)",
    outline: "none",
  },
} as const;

type FormState = {
  type: ManualTradeType;
  title: string;
  amount: string;
  description: string;
  date: DateObject | null;
  shopAccountId: number | "";
};

function emptyForm(defaultType: ManualTradeType): FormState {
  return {
    type: defaultType,
    title: "",
    amount: "",
    description: "",
    date: todayJalaliDateObject(),
    shopAccountId: "",
  };
}

function formFromTrade(trade: ManualTrade): FormState {
  return {
    type: trade.type === "sale" ? "sale" : "purchase",
    title: trade.title || "",
    amount: trade.amount != null ? formatInputWithSeparator(String(trade.amount)) : "",
    description: trade.description || "",
    date: parseTradeDateObject(trade) || todayJalaliDateObject(),
    shopAccountId: resolveShopAccountId(trade),
  };
}

type ManualTradeFormSheetProps = {
  open: boolean;
  onClose: () => void;
  editing?: ManualTrade | null;
  defaultType?: ManualTradeType;
  onSaved: () => void;
};

export default function ManualTradeFormSheet({
  open,
  onClose,
  editing = null,
  defaultType = "purchase",
  onSaved,
}: ManualTradeFormSheetProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultType));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromTrade(editing) : emptyForm(defaultType));
  }, [open, editing, defaultType]);

  const close = () => {
    if (saving) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("عنوان سند را وارد کنید");
      return;
    }
    const amountNum = parseAmount(form.amount);
    if (amountNum <= 0) {
      toast.error("مبلغ معتبر نیست");
      return;
    }
    const date = tradeDateToApi(form.date);
    if (!date) {
      toast.error("تاریخ سند را انتخاب کنید");
      return;
    }

    const body: Record<string, unknown> = {
      type: form.type,
      title: form.title.trim(),
      amount: amountNum,
      date,
    };
    if (form.description.trim()) {
      body.description = form.description.trim();
    } else if (editing) {
      body.description = null;
    }
    body.shop_account_id = form.shopAccountId === "" ? null : form.shopAccountId;

    setSaving(true);
    try {
      const res = editing
        ? await FetchWithJwtClient("PUT", `/api/manual-trades/${editing.id}`, body)
        : await FetchWithJwtClient("POST", "/api/manual-trades", body);

      if (res?.hasError) {
        toast.error(
          getApiErrorMessage(res, editing ? "خطا در ویرایش سند" : "خطا در ثبت سند"),
        );
        return;
      }

      toast.success(editing ? "سند ویرایش شد" : "سند ثبت شد");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const accountHelper =
    form.type === "sale"
      ? "اختیاری — موجودی همان حساب اضافه می‌شود"
      : "اختیاری — موجودی همان حساب کم می‌شود";

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={editing ? "ویرایش سند" : "ثبت سند"}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          p: 0.5,
          direction: "rtl",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <RadioGroup
          row
          value={form.type}
          onChange={(e) =>
            setForm((f) => ({ ...f, type: e.target.value as ManualTradeType }))
          }
          sx={{
            gap: 0.5,
            "& .MuiFormControlLabel-root": { mr: 0, ml: 0 },
          }}
        >
          {MANUAL_TRADE_TYPE_OPTIONS.map((o) => (
            <FormControlLabel
              key={o.value}
              value={o.value}
              control={
                <Radio
                  size="small"
                  sx={{
                    color: "var(--admin-accent)",
                    py: 0.25,
                    "&.Mui-checked": { color: "var(--admin-accent)" },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>
                  {o.label}
                </Typography>
              }
            />
          ))}
        </RadioGroup>

        <TextField
          size="small"
          label="عنوان"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          fullWidth
          sx={manualTradeFormFieldSx}
        />

        <TextField
          size="small"
          label="مبلغ (تومان)"
          value={form.amount}
          onChange={(e) =>
            setForm((f) => ({ ...f, amount: formatInputWithSeparator(e.target.value) }))
          }
          fullWidth
          sx={manualTradeFormFieldSx}
        />

        <Box>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5 }}>
            تاریخ سند
          </Typography>
          <Box sx={datePickerBoxSx}>
            <DatePicker
              value={form.date}
              onChange={(d) =>
                setForm((f) => ({
                  ...f,
                  date: d && !Array.isArray(d) ? (d as DateObject) : null,
                }))
              }
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-center"
              zIndex={DATE_PICKER_Z}
              portal
              placeholder="تاریخ"
              className="rmdp-mobile"
              containerStyle={{ width: "100%" }}
              style={{ width: "100%", height: 40, borderRadius: 8 }}
            />
          </Box>
        </Box>

        <TextField
          size="small"
          label="توضیحات (اختیاری)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          sx={manualTradeFormFieldSx}
        />

        <ShopAccountSelect
          value={form.shopAccountId}
          onChange={(value) => setForm((f) => ({ ...f, shopAccountId: value }))}
          label="حساب فروشگاه"
          helperText={accountHelper}
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          sx={{
            bgcolor: "var(--admin-accent)",
            color: "#fff",
            borderRadius: "8px",
            py: 1.1,
            mt: 0.5,
            fontSize: 14,
            fontWeight: 700,
            "&:hover": { bgcolor: "var(--admin-accent-hover)" },
          }}
        >
          {saving ? (
            <CircularProgress size={18} color="inherit" />
          ) : editing ? (
            "ذخیره سند"
          ) : (
            "ثبت سند"
          )}
        </Button>
      </Box>
    </BottomSheet>
  );
}
