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
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import BottomSheet from "@/app/coponent/BottomSheet";
import {
  CHEQUE_TYPE_OPTIONS,
  dateObjectToPayload,
  extractCheque,
  formatInputWithSeparator,
  parseAmount,
  parseJalaliDateString,
  todayJalaliDateObject,
  type Cheque,
  type ChequeType,
} from "@/app/lib/cheques";

const DEFAULT_EXPENSE_TYPE = "جاری";

export const CHEQUE_DATE_PICKER_Z = 1600;

export const chequeFormFieldSx = {
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

export const chequeDatePickerBoxSx = {
  width: "100%",
  "& .rmdp-wrapper": { width: "100%" },
  "& .rmdp-portal": { zIndex: `${CHEQUE_DATE_PICKER_Z} !important` },
  "& .rmdp-input": {
    width: "100%",
    height: "36px",
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
  type: ChequeType;
  cheque_number: string;
  bank_name: string;
  payee: string;
  amount: string;
  title: string;
  note: string;
  issue_date: DateObject | null;
  due_date: DateObject | null;
};

function emptyForm(defaultType: ChequeType, defaultAmount?: number, defaultPayee?: string): FormState {
  return {
    type: defaultType,
    cheque_number: "",
    bank_name: "",
    payee: defaultPayee || "",
    amount:
      defaultAmount && defaultAmount > 0
        ? formatInputWithSeparator(String(defaultAmount))
        : "",
    title: "",
    note: "",
    issue_date: todayJalaliDateObject(),
    due_date: null,
  };
}

function formFromCheque(cheque: Cheque): FormState {
  return {
    type: (cheque.type as ChequeType) || "issued",
    cheque_number: cheque.cheque_number || "",
    bank_name: cheque.bank_name || "",
    payee: cheque.payee || "",
    amount: cheque.amount != null ? formatInputWithSeparator(String(cheque.amount)) : "",
    title: cheque.title || "",
    note: cheque.note || "",
    issue_date:
      parseJalaliDateString(cheque.issue_date_jalali || cheque.issue_date) ||
      todayJalaliDateObject(),
    due_date: parseJalaliDateString(cheque.due_date_jalali || cheque.due_date),
  };
}

export type ChequeFormSheetProps = {
  open: boolean;
  onClose: () => void;
  editing?: Cheque | null;
  defaultType?: ChequeType;
  lockType?: boolean;
  defaultAmount?: number;
  defaultPayee?: string;
  onSaved: (cheque: Cheque, wasEdit: boolean) => void;
};

export default function ChequeFormSheet({
  open,
  onClose,
  editing = null,
  defaultType = "issued",
  lockType = false,
  defaultAmount,
  defaultPayee,
  onSaved,
}: ChequeFormSheetProps) {
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(defaultType, defaultAmount, defaultPayee),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromCheque(editing) : emptyForm(defaultType, defaultAmount, defaultPayee));
  }, [open, editing, defaultType, defaultAmount, defaultPayee]);

  const close = () => {
    if (saving) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.cheque_number.trim()) {
      toast.error("شماره چک را وارد کنید");
      return;
    }
    if (!form.bank_name.trim()) {
      toast.error("نام بانک را وارد کنید");
      return;
    }
    if (!form.payee.trim()) {
      toast.error(form.type === "issued" ? "در وجه را وارد کنید" : "پرداخت‌کننده را وارد کنید");
      return;
    }
    const amountNum = parseAmount(form.amount);
    if (amountNum <= 0) {
      toast.error("مبلغ معتبر نیست");
      return;
    }
    const due = dateObjectToPayload(form.due_date);
    if (!due) {
      toast.error("تاریخ سررسید را انتخاب کنید");
      return;
    }

    const body: Record<string, unknown> = {
      type: form.type,
      cheque_number: form.cheque_number.trim(),
      bank_name: form.bank_name.trim(),
      payee: form.payee.trim(),
      amount: amountNum,
      due_date: due,
    };

    if (form.title.trim()) body.title = form.title.trim();
    if (form.note.trim()) body.note = form.note.trim();

    const issue = dateObjectToPayload(form.issue_date);
    if (issue) body.issue_date = issue;

    if (form.type === "issued") {
      body.expense_type = DEFAULT_EXPENSE_TYPE;
    }

    setSaving(true);
    try {
      const token = tokenCode();
      const res = editing
        ? await FetchWithJwtClient("PUT", `/api/cheques/${editing.id}`, body)
        : await FetchWithJwtClient("POST", "/api/cheques", body);

      if (res?.hasError) {
        toast.error(
          getApiErrorMessage(res, editing ? "خطا در ویرایش چک" : "خطا در ثبت چک"),
        );
        return;
      }

      const saved = extractCheque(res) ?? {
        id: editing?.id ?? Number(res?.id),
        type: form.type,
        cheque_number: form.cheque_number.trim(),
        bank_name: form.bank_name.trim(),
        payee: form.payee.trim(),
        amount: amountNum,
        title: form.title.trim() || null,
        note: form.note.trim() || null,
        status: "pending",
      };

      if (!saved.id) {
        toast.error("چک ثبت شد اما شناسه برنگشت. لیست را تازه‌سازی کنید");
        return;
      }

      toast.success(editing ? "چک ویرایش شد" : "چک ثبت شد");
      onSaved(saved, Boolean(editing));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={editing ? "ویرایش چک" : "ثبت چک"}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          p: 0.5,
          direction: "rtl",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {!lockType && (
          <RadioGroup
            row
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ChequeType }))}
            sx={{
              gap: 0.5,
              mb: 0.25,
              "& .MuiFormControlLabel-root": { mr: 0, ml: 0 },
            }}
          >
            {CHEQUE_TYPE_OPTIONS.map((o) => (
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
                disabled={Boolean(editing)}
              />
            ))}
          </RadioGroup>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
            gap: 1,
          }}
        >
          <TextField
            size="small"
            label="شماره چک"
            value={form.cheque_number}
            onChange={(e) => setForm((f) => ({ ...f, cheque_number: e.target.value }))}
            fullWidth
            sx={chequeFormFieldSx}
          />
          <TextField
            size="small"
            label="نام بانک"
            value={form.bank_name}
            onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
            fullWidth
            sx={chequeFormFieldSx}
          />
        </Box>

        <TextField
          size="small"
          label={form.type === "issued" ? "در وجه" : "پرداخت‌کننده / مشتری"}
          value={form.payee}
          onChange={(e) => setForm((f) => ({ ...f, payee: e.target.value }))}
          fullWidth
          sx={chequeFormFieldSx}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
            gap: 1,
          }}
        >
          <TextField
            size="small"
            label="مبلغ (تومان)"
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, amount: formatInputWithSeparator(e.target.value) }))
            }
            fullWidth
            sx={chequeFormFieldSx}
          />
          <TextField
            size="small"
            label="عنوان (اختیاری)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            sx={chequeFormFieldSx}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
            gap: 1,
          }}
        >
          <Box>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.25 }}>
              تاریخ صدور
            </Typography>
            <Box sx={chequeDatePickerBoxSx}>
              <DatePicker
                value={form.issue_date}
                onChange={(d) =>
                  setForm((f) => ({
                    ...f,
                    issue_date: d && !Array.isArray(d) ? (d as DateObject) : null,
                  }))
                }
                calendar={persian}
                locale={persian_fa}
                calendarPosition="bottom-center"
                zIndex={CHEQUE_DATE_PICKER_Z}
                portal
                placeholder="صدور"
                className="rmdp-mobile"
                containerStyle={{ width: "100%" }}
                style={{ width: "100%", height: 36, borderRadius: 8 }}
              />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.25 }}>
              تاریخ سررسید
            </Typography>
            <Box sx={chequeDatePickerBoxSx}>
              <DatePicker
                value={form.due_date}
                onChange={(d) =>
                  setForm((f) => ({
                    ...f,
                    due_date: d && !Array.isArray(d) ? (d as DateObject) : null,
                  }))
                }
                calendar={persian}
                locale={persian_fa}
                calendarPosition="bottom-center"
                zIndex={CHEQUE_DATE_PICKER_Z}
                portal
                placeholder="سررسید"
                className="rmdp-mobile"
                containerStyle={{ width: "100%" }}
                style={{ width: "100%", height: 36, borderRadius: 8 }}
              />
            </Box>
          </Box>
        </Box>

        <TextField
          size="small"
          label="یادداشت (اختیاری)"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          fullWidth
          multiline
          minRows={1}
          maxRows={2}
          sx={chequeFormFieldSx}
        />

        <Button
          size="small"
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          sx={{
            bgcolor: "var(--admin-accent)",
            color: "#fff",
            borderRadius: "8px",
            py: 0.9,
            mt: 0.5,
            fontSize: 13,
            fontWeight: 700,
            "&:hover": { bgcolor: "var(--admin-accent-hover)" },
          }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : editing ? "ذخیره" : "ثبت چک"}
        </Button>
      </Box>
    </BottomSheet>
  );
}
