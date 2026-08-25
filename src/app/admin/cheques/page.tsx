"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import BottomSheet from "@/app/coponent/BottomSheet";
import BottomSheetModal from "@/app/coponent/BottomSheetModal";
import ChequeCard from "./ChequeCard";
import {
  CHEQUE_STATUS_OPTIONS,
  CHEQUE_TYPE_OPTIONS,
  EXPENSE_TYPE_OPTIONS,
  TIME_FILTER_OPTIONS,
  buildChequesUrl,
  dateObjectToPayload,
  extractChequeList,
  formatInputWithSeparator,
  formatNumber,
  parseAmount,
  parseJalaliDateString,
  todayJalaliDateObject,
  type Cheque,
  type ChequeType,
  type ExpenseType,
} from "@/app/lib/cheques";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": {
    color: "var(--admin-text-muted)",
    right: 14,
    left: "auto",
    transformOrigin: "top right",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(-14px, -9px) scale(0.75)",
  },
  "& .MuiInputBase-input": {
    textAlign: "right",
    direction: "rtl",
  },
} as const;

const DATE_PICKER_Z = 1600;

const datePickerBoxSx = {
  width: "100%",
  "& .rmdp-wrapper": { width: "100%" },
  "& .rmdp-portal": { zIndex: `${DATE_PICKER_Z} !important` },
  "& .rmdp-input": {
    width: "100%",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "var(--admin-surface-alt)",
    border: "1px solid var(--admin-border)",
    color: "var(--admin-text)",
    fontSize: "14px",
    padding: "8px 12px",
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
  expense_type: ExpenseType;
  note: string;
  issue_date: DateObject | null;
  due_date: DateObject | null;
};

const emptyForm = (): FormState => ({
  type: "issued",
  cheque_number: "",
  bank_name: "",
  payee: "",
  amount: "",
  title: "",
  expense_type: "جاری",
  note: "",
  issue_date: todayJalaliDateObject(),
  due_date: null,
});

export default function ChequesPage() {
  const [loading, setLoading] = useState(true);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [typeFilter, setTypeFilter] = useState<ChequeType | "all">("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [timeFilter, setTimeFilter] = useState("all");
  const [chequeNumberFilter, setChequeNumberFilter] = useState("");
  const [upcoming, setUpcoming] = useState(false);
  const [upcomingDays, setUpcomingDays] = useState(7);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cheque | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Cheque | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [clearTarget, setClearTarget] = useState<Cheque | null>(null);
  const [clearDate, setClearDate] = useState<DateObject | null>(todayJalaliDateObject());
  const [clearing, setClearing] = useState(false);

  const hasFilters = useMemo(() => {
    return (
      typeFilter !== "all" ||
      statusFilter !== "pending" ||
      timeFilter !== "all" ||
      chequeNumberFilter.trim() !== "" ||
      upcoming
    );
  }, [typeFilter, statusFilter, timeFilter, chequeNumberFilter, upcoming]);

  const loadCheques = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = buildChequesUrl({
        type: typeFilter,
        status: statusFilter,
        filter: timeFilter,
        chequeNumber: chequeNumberFilter,
        upcoming,
        upcomingDays,
      });
      const res = await FetchWithJwtClient("GET", url, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت لیست چک‌ها"));
        setCheques([]);
        return;
      }
      setCheques(extractChequeList(res));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, timeFilter, chequeNumberFilter, upcoming, upcomingDays]);

  useEffect(() => {
    loadCheques();
  }, [loadCheques]);

  const handleClearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("pending");
    setTimeFilter("all");
    setChequeNumberFilter("");
    setUpcoming(false);
    setUpcomingDays(7);
    setFilterSheetOpen(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (cheque: Cheque) => {
    setEditing(cheque);
    setForm({
      type: (cheque.type as ChequeType) || "issued",
      cheque_number: cheque.cheque_number || "",
      bank_name: cheque.bank_name || "",
      payee: cheque.payee || "",
      amount: cheque.amount != null ? formatInputWithSeparator(String(cheque.amount)) : "",
      title: cheque.title || "",
      expense_type: (cheque.expense_type as ExpenseType) || "جاری",
      note: cheque.note || "",
      issue_date:
        parseJalaliDateString(cheque.issue_date_jalali || cheque.issue_date) ||
        todayJalaliDateObject(),
      due_date: parseJalaliDateString(cheque.due_date_jalali || cheque.due_date),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm());
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
      body.expense_type = form.expense_type;
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

      toast.success(editing ? "چک ویرایش شد" : "چک ثبت شد");
      closeForm();
      await loadCheques();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      const res = await FetchWithJwtClient("DELETE", `/api/cheques/${deleteTarget.id}`, tokenCode());
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف چک"));
        return;
      }
      toast.success("چک حذف شد");
      setDeleteTarget(null);
      await loadCheques();
    } finally {
      setDeleting(false);
    }
  };

  const openClear = (cheque: Cheque) => {
    setClearTarget(cheque);
    setClearDate(todayJalaliDateObject());
  };

  const confirmClear = async () => {
    if (!clearTarget?.id) return;
    setClearing(true);
    try {
      const body: Record<string, unknown> = {};
      const payload = dateObjectToPayload(clearDate);
      if (payload) body.clear_date = payload;

      const res = await FetchWithJwtClient(
        "POST",
        `/api/cheques/${clearTarget.id}/clear`,
        body,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در وصول چک"));
        return;
      }
      toast.success(
        clearTarget.type === "received"
          ? "چک وصول شد و به درآمد اضافه شد"
          : "چک وصول شد و به هزینه اضافه شد",
      );
      setClearTarget(null);
      await loadCheques();
    } finally {
      setClearing(false);
    }
  };

  const totalAmount = useMemo(
    () => cheques.reduce((sum, c) => sum + parseAmount(c.amount), 0),
    [cheques],
  );

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <ToastContainer position="top-center" rtl autoClose={3000} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ReceiptLongIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 20 }}>
            چک
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{
            ...adminButtonStartIconSx,
            bgcolor: "var(--admin-accent)",
            color: "#fff",
            borderRadius: "12px",
            "&:hover": { bgcolor: "var(--admin-accent-hover)" },
          }}
        >
          ثبت چک
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="جستجوی شماره چک"
          value={chequeNumberFilter}
          onChange={(e) => setChequeNumberFilter(e.target.value)}
          sx={{ ...fieldSx, flex: 1, minWidth: 160 }}
        />
        {hasFilters ? (
          <IconButton
            onClick={handleClearFilters}
            sx={{ color: "#ff4444", bgcolor: "rgba(255,68,68,0.1)" }}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        ) : null}
        <IconButton
          onClick={() => setFilterSheetOpen(true)}
          sx={{
            color: hasFilters ? "var(--admin-accent)" : "var(--admin-text)",
            bgcolor: hasFilters ? "rgba(120, 181, 104, 0.2)" : "var(--admin-icon-bg)",
            border: "1px solid var(--admin-border)",
            borderRadius: "12px",
          }}
          size="small"
        >
          <FilterListIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          px: 1,
        }}
      >
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
          {upcoming ? `سررسید تا ${upcomingDays} روز آینده` : "لیست چک‌ها"}
          {" — "}
          {cheques.length.toLocaleString("fa-IR")} مورد
        </Typography>
        <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 14 }}>
          جمع: {formatNumber(totalAmount)} تومان
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : cheques.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 6,
            color: "var(--admin-text-muted)",
            border: "1px dashed var(--admin-border)",
            borderRadius: "12px",
          }}
        >
          چکی یافت نشد
        </Box>
      ) : (
        cheques.map((cheque) => (
          <ChequeCard
            key={cheque.id}
            cheque={cheque}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            onClear={openClear}
          />
        ))
      )}

      <BottomSheetModal open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)}>
        <Box sx={{ p: 2, direction: "rtl" }}>
          <Typography sx={{ color: "#000", mb: 1, fontSize: 14, fontWeight: 600 }}>نوع چک</Typography>
          <RadioGroup
            row
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ChequeType | "all")}
            sx={{ mb: 2, justifyContent: "space-around" }}
          >
            <FormControlLabel value="all" control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />} label="همه" sx={{ color: "#000" }} />
            {CHEQUE_TYPE_OPTIONS.map((o) => (
              <FormControlLabel
                key={o.value}
                value={o.value}
                control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />}
                label={o.label}
                sx={{ color: "#000" }}
              />
            ))}
          </RadioGroup>

          <Typography sx={{ color: "#000", mb: 1, fontSize: 14, fontWeight: 600 }}>وضعیت</Typography>
          <RadioGroup
            row
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setUpcoming(false);
            }}
            sx={{ mb: 2, justifyContent: "space-around" }}
          >
            {CHEQUE_STATUS_OPTIONS.map((o) => (
              <FormControlLabel
                key={o.value}
                value={o.value}
                control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />}
                label={o.label}
                sx={{ color: "#000" }}
              />
            ))}
          </RadioGroup>

          <Typography sx={{ color: "#000", mb: 1, fontSize: 14, fontWeight: 600 }}>بازه زمانی</Typography>
          <RadioGroup
            row
            value={timeFilter}
            onChange={(e) => {
              setTimeFilter(e.target.value);
              setUpcoming(false);
            }}
            sx={{ mb: 2, justifyContent: "space-around", flexWrap: "wrap" }}
          >
            {TIME_FILTER_OPTIONS.map((o) => (
              <FormControlLabel
                key={o.value}
                value={o.value}
                control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />}
                label={o.label}
                sx={{ color: "#000" }}
              />
            ))}
          </RadioGroup>

          <Typography sx={{ color: "#000", mb: 1, fontSize: 14, fontWeight: 600 }}>
            چک‌های در انتظار (سررسید نزدیک)
          </Typography>
          <RadioGroup
            row
            value={upcoming ? "upcoming" : "list"}
            onChange={(e) => setUpcoming(e.target.value === "upcoming")}
            sx={{ mb: 1, justifyContent: "space-around" }}
          >
            <FormControlLabel value="list" control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />} label="لیست عادی" sx={{ color: "#000" }} />
            <FormControlLabel value="upcoming" control={<Radio sx={{ color: "#1f9ad1", "&.Mui-checked": { color: "#1f9ad1" } }} />} label="سررسید نزدیک" sx={{ color: "#000" }} />
          </RadioGroup>

          {upcoming ? (
            <TextField
              fullWidth
              type="number"
              label="تعداد روز آینده"
              value={upcomingDays}
              onChange={(e) => setUpcomingDays(Math.max(1, Number(e.target.value) || 7))}
              sx={{ ...fieldSx, mb: 2, mt: 1 }}
            />
          ) : null}

          {hasFilters ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleClearFilters}
                sx={{
                  ...adminButtonStartIconSx,
                  color: "#ff4444",
                  borderColor: "#ff4444",
                }}
              >
                حذف فیلترها
              </Button>
            </Box>
          ) : null}
        </Box>
      </BottomSheetModal>

      <BottomSheet
        open={formOpen}
        onClose={closeForm}
        title={editing ? "ویرایش چک" : "ثبت چک"}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2, direction: "rtl", maxHeight: "70vh", overflowY: "auto" }}>
          <Box>
            <Typography sx={{ color: "var(--admin-text)", mb: 1, fontSize: 14 }}>نوع چک</Typography>
            <RadioGroup
              row
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ChequeType }))}
              sx={{ gap: 2 }}
            >
              {CHEQUE_TYPE_OPTIONS.map((o) => (
                <FormControlLabel
                  key={o.value}
                  value={o.value}
                  control={<Radio sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }} />}
                  label={o.label}
                  sx={{ color: "var(--admin-text)" }}
                  disabled={Boolean(editing)}
                />
              ))}
            </RadioGroup>
          </Box>

          {form.type === "issued" ? (
            <Box>
              <Typography sx={{ color: "var(--admin-text)", mb: 1, fontSize: 14 }}>نوع هزینه</Typography>
              <RadioGroup
                row
                value={form.expense_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expense_type: e.target.value as ExpenseType }))
                }
                sx={{ gap: 2 }}
              >
                {EXPENSE_TYPE_OPTIONS.map((o) => (
                  <FormControlLabel
                    key={o.value}
                    value={o.value}
                    control={<Radio sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }} />}
                    label={o.label}
                    sx={{ color: "var(--admin-text)" }}
                  />
                ))}
              </RadioGroup>
            </Box>
          ) : null}

          <TextField
            label="شماره چک"
            value={form.cheque_number}
            onChange={(e) => setForm((f) => ({ ...f, cheque_number: e.target.value }))}
            fullWidth
            sx={fieldSx}
          />
          <TextField
            label="نام بانک"
            value={form.bank_name}
            onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
            fullWidth
            sx={fieldSx}
          />
          <TextField
            label={form.type === "issued" ? "در وجه" : "پرداخت‌کننده / مشتری"}
            value={form.payee}
            onChange={(e) => setForm((f) => ({ ...f, payee: e.target.value }))}
            fullWidth
            sx={fieldSx}
          />
          <TextField
            label="مبلغ (تومان)"
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, amount: formatInputWithSeparator(e.target.value) }))
            }
            fullWidth
            sx={fieldSx}
          />
          <TextField
            label="عنوان (اختیاری)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            sx={fieldSx}
          />

          <Box>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5 }}>
              تاریخ صدور
            </Typography>
            <Box sx={datePickerBoxSx}>
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
                zIndex={DATE_PICKER_Z}
                portal
                placeholder="تاریخ صدور"
                className="rmdp-mobile"
                containerStyle={{ width: "100%" }}
                style={{ width: "100%", height: 48, borderRadius: 12 }}
              />
            </Box>
          </Box>

          <Box>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5 }}>
              تاریخ سررسید
            </Typography>
            <Box sx={datePickerBoxSx}>
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
                zIndex={DATE_PICKER_Z}
                portal
                placeholder="تاریخ سررسید"
                className="rmdp-mobile"
                containerStyle={{ width: "100%" }}
                style={{ width: "100%", height: 48, borderRadius: 12 }}
              />
            </Box>
          </Box>

          <TextField
            label="یادداشت (اختیاری)"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            sx={fieldSx}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              bgcolor: "var(--admin-accent)",
              color: "#fff",
              borderRadius: "12px",
              py: 1.2,
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : editing ? "ذخیره تغییرات" : "ثبت چک"}
          </Button>
        </Box>
      </BottomSheet>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            borderRadius: "16px",
            direction: "rtl",
            minWidth: { xs: "90%", sm: 360 },
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", textAlign: "center" }}>حذف چک</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "var(--admin-text-muted)", textAlign: "center" }}>
            آیا از حذف چک شماره {deleteTarget?.cheque_number} مطمئن هستید؟
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 1, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ color: "var(--admin-text)" }}>
            انصراف
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(clearTarget)}
        onClose={() => !clearing && setClearTarget(null)}
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            borderRadius: "16px",
            direction: "rtl",
            minWidth: { xs: "90%", sm: 400 },
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--admin-text)", textAlign: "center" }}>وصول چک</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "var(--admin-text-muted)", textAlign: "center", mb: 2 }}>
            چک شماره {clearTarget?.cheque_number} به مبلغ{" "}
            {formatNumber(parseAmount(clearTarget?.amount))} تومان وصول شود؟
            {clearTarget?.type === "received"
              ? " (به درآمد اضافه می‌شود)"
              : " (به هزینه اضافه می‌شود)"}
          </DialogContentText>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5 }}>
            تاریخ وصول (اختیاری — پیش‌فرض امروز)
          </Typography>
          <Box sx={datePickerBoxSx}>
            <DatePicker
              value={clearDate}
              onChange={(d) => setClearDate(d && !Array.isArray(d) ? (d as DateObject) : null)}
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-center"
              zIndex={DATE_PICKER_Z}
              portal
              placeholder="تاریخ وصول"
              className="rmdp-mobile"
              containerStyle={{ width: "100%" }}
              style={{ width: "100%", height: 48, borderRadius: 12 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 1, pb: 2 }}>
          <Button onClick={() => setClearTarget(null)} disabled={clearing} sx={{ color: "var(--admin-text)" }}>
            انصراف
          </Button>
          <Button
            variant="contained"
            onClick={confirmClear}
            disabled={clearing}
            sx={{
              bgcolor: "var(--admin-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
            startIcon={clearing ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            تایید وصول
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
