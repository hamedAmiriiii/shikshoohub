"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  PAYROLL_ITEM_TYPE_OPTIONS,
  createJalaliDateObject,
  formatInputWithSeparator,
  formatNumber,
  getCurrentJalaliYearMonth,
  parseAmount,
  parseJalaliMonthPicker,
  payrollItemTypeLabel,
  type Employee,
  type PayrollItemType,
} from "@/app/lib/payroll";
import JalaliMonthPickerField from "./JalaliMonthPickerField";
import DateObject from "react-date-object";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

type Template = {
  id: number;
  item_type: string;
  title: string;
  amount: number | string;
  is_active?: boolean;
};

type Loan = {
  id: number;
  title: string;
  principal: number | string;
  monthly_installment: number | string;
  remaining: number | string;
  status: string;
};

type AttendanceDay = {
  id: number;
  attendance_day: number;
  status: string;
  hours?: number | string | null;
};

type Props = {
  employee: Employee | null;
  onClose: () => void;
};

export default function EmployeePayrollExtrasDialog({ employee, onClose }: Props) {
  const [tab, setTab] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
  const [summary, setSummary] = useState({ days_present: 0, hours_total: 0 });
  const [saving, setSaving] = useState(false);

  const [tplType, setTplType] = useState<PayrollItemType>("allowance");
  const [tplTitle, setTplTitle] = useState("حق اولاد");
  const [tplAmount, setTplAmount] = useState("");

  const [loanTitle, setLoanTitle] = useState("وام کارمند");
  const [loanPrincipal, setLoanPrincipal] = useState("");
  const [loanInstallment, setLoanInstallment] = useState("");

  const jalaliNow = getCurrentJalaliYearMonth();
  const [attMonth, setAttMonth] = useState<DateObject | null>(
    createJalaliDateObject(jalaliNow.year, jalaliNow.month),
  );
  const [attDay, setAttDay] = useState("1");
  const [attStatus, setAttStatus] = useState("present");
  const [attHours, setAttHours] = useState("8");

  const loadAll = useCallback(async () => {
    if (!employee) return;
    const token = tokenCode();
    if (!token) return;
    const ym = parseJalaliMonthPicker(attMonth) || jalaliNow;
    const [tRes, lRes, aRes] = await Promise.all([
      FetchWithJwtClient("GET", `/api/shop-employees/${employee.id}/payroll-templates`, token),
      FetchWithJwtClient("GET", `/api/shop-employees/${employee.id}/loans`, token),
      FetchWithJwtClient(
        "GET",
        `/api/shop-employees/${employee.id}/attendance?year=${ym.year}&month=${ym.month}`,
        token,
      ),
    ]);
    if (!tRes?.hasError) setTemplates(((tRes as { data?: Template[] }).data) || []);
    if (!lRes?.hasError) setLoans(((lRes as { data?: Loan[] }).data) || []);
    if (!aRes?.hasError) {
      setAttendance(((aRes as { data?: AttendanceDay[] }).data) || []);
      const s = (aRes as { summary?: { days_present: number; hours_total: number } }).summary;
      if (s) setSummary(s);
    }
  }, [employee, attMonth]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (!employee) return null;

  const addTemplate = async () => {
    const amount = parseAmount(tplAmount);
    if (!tplTitle.trim() || amount <= 0) {
      toast.error("عنوان و مبلغ قالب را وارد کنید");
      return;
    }
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "POST",
        `/api/shop-employees/${employee.id}/payroll-templates`,
        token,
        {},
        {
          body: JSON.stringify({
            item_type: tplType,
            title: tplTitle.trim(),
            amount,
            is_active: true,
          }),
        },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ذخیره قالب"));
        return;
      }
      setTplAmount("");
      toast.success("قالب ذخیره شد");
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: number) => {
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "DELETE",
        `/api/shop-employees/${employee.id}/payroll-templates/${id}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف قالب"));
        return;
      }
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const addLoan = async () => {
    const principal = parseAmount(loanPrincipal);
    const installment = parseAmount(loanInstallment);
    if (principal <= 0 || installment <= 0) {
      toast.error("مبلغ وام و قسط ماهانه را وارد کنید");
      return;
    }
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "POST",
        `/api/shop-employees/${employee.id}/loans`,
        token,
        {},
        {
          body: JSON.stringify({
            title: loanTitle.trim() || "وام کارمند",
            principal,
            monthly_installment: installment,
          }),
        },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ثبت وام"));
        return;
      }
      setLoanPrincipal("");
      setLoanInstallment("");
      toast.success("وام ثبت شد");
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const closeLoan = async (id: number) => {
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "POST",
        `/api/shop-employees/${employee.id}/loans/${id}/close`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در بستن وام"));
        return;
      }
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const saveAttendance = async () => {
    const ym = parseJalaliMonthPicker(attMonth);
    const day = Number(attDay);
    if (!ym || !day) {
      toast.error("ماه و روز را مشخص کنید");
      return;
    }
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "POST",
        `/api/shop-employees/${employee.id}/attendance`,
        token,
        {},
        {
          body: JSON.stringify({
            year: ym.year,
            month: ym.month,
            day,
            status: attStatus,
            hours: attStatus === "present" ? Number(attHours) || 0 : 0,
          }),
        },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ثبت حضور"));
        return;
      }
      toast.success("حضور ثبت شد");
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>امکانات حقوق — {employee.name}</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1.5 }}>
          <Tab label="قالب ماهانه" />
          <Tab label="وام قسطی" />
          <Tab label="حضور" />
        </Tabs>

        {tab === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
              این ردیف‌ها هنگام محاسبهٔ فیش ماه به‌صورت خودکار اضافه می‌شوند.
            </Typography>
            <TextField select size="small" label="نوع" value={tplType} onChange={(e) => setTplType(e.target.value)} sx={fieldSx}>
              {PAYROLL_ITEM_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
            <TextField size="small" label="عنوان" value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} sx={fieldSx} />
            <TextField
              size="small"
              label="مبلغ"
              value={tplAmount}
              onChange={(e) => setTplAmount(formatInputWithSeparator(e.target.value))}
              sx={fieldSx}
              inputProps={{ inputMode: "numeric", style: { direction: "ltr", textAlign: "right" } }}
            />
            <Button variant="contained" onClick={() => void addTemplate()} disabled={saving}>افزودن قالب</Button>
            <Divider />
            {templates.map((t) => (
              <Box key={t.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: 13 }}>
                  {t.title} ({payrollItemTypeLabel(t.item_type)}) — {formatNumber(parseAmount(t.amount))}
                </Typography>
                <IconButton size="small" onClick={() => void deleteTemplate(t.id)} disabled={saving}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : null}

        {tab === 1 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
              هر ماه قسط از فیش کسر می‌شود تا مانده وام صفر شود.
            </Typography>
            <TextField size="small" label="عنوان" value={loanTitle} onChange={(e) => setLoanTitle(e.target.value)} sx={fieldSx} />
            <TextField
              size="small"
              label="مبلغ کل وام"
              value={loanPrincipal}
              onChange={(e) => setLoanPrincipal(formatInputWithSeparator(e.target.value))}
              sx={fieldSx}
              inputProps={{ inputMode: "numeric", style: { direction: "ltr", textAlign: "right" } }}
            />
            <TextField
              size="small"
              label="قسط ماهانه"
              value={loanInstallment}
              onChange={(e) => setLoanInstallment(formatInputWithSeparator(e.target.value))}
              sx={fieldSx}
              inputProps={{ inputMode: "numeric", style: { direction: "ltr", textAlign: "right" } }}
            />
            <Button variant="contained" onClick={() => void addLoan()} disabled={saving}>ثبت وام</Button>
            <Divider />
            {loans.map((l) => (
              <Box key={l.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: 13 }}>
                  {l.title}: مانده {formatNumber(parseAmount(l.remaining))} / قسط {formatNumber(parseAmount(l.monthly_installment))}
                  {l.status !== "active" ? " (بسته)" : ""}
                </Typography>
                {l.status === "active" ? (
                  <Button size="small" onClick={() => void closeLoan(l.id)} disabled={saving}>بستن</Button>
                ) : null}
              </Box>
            ))}
          </Box>
        ) : null}

        {tab === 2 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
              حضور ساده برای پر کردن روز/ساعت در محاسبه گروهی.
            </Typography>
            <JalaliMonthPickerField label="ماه" value={attMonth} onChange={setAttMonth} />
            <TextField
              size="small"
              type="number"
              label="روز ماه"
              value={attDay}
              onChange={(e) => setAttDay(e.target.value)}
              sx={fieldSx}
              inputProps={{ min: 1, max: 31 }}
            />
            <TextField select size="small" label="وضعیت" value={attStatus} onChange={(e) => setAttStatus(e.target.value)} sx={fieldSx}>
              <MenuItem value="present">حاضر</MenuItem>
              <MenuItem value="absent">غایب</MenuItem>
              <MenuItem value="leave">مرخصی</MenuItem>
            </TextField>
            {attStatus === "present" ? (
              <TextField
                size="small"
                type="number"
                label="ساعت"
                value={attHours}
                onChange={(e) => setAttHours(e.target.value)}
                sx={fieldSx}
                inputProps={{ min: 0, max: 24, step: 0.5 }}
              />
            ) : null}
            <Button variant="contained" onClick={() => void saveAttendance()} disabled={saving}>ثبت روز</Button>
            <Typography sx={{ fontSize: 13 }}>
              خلاصه ماه: {formatNumber(summary.days_present)} روز حاضر — {formatNumber(summary.hours_total)} ساعت
            </Typography>
            <Divider />
            {attendance.map((d) => (
              <Typography key={d.id} sx={{ fontSize: 13 }}>
                روز {d.attendance_day}: {d.status === "present" ? "حاضر" : d.status === "leave" ? "مرخصی" : "غایب"}
                {d.hours ? ` — ${formatNumber(Number(d.hours))} ساعت` : ""}
              </Typography>
            ))}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>بستن</Button>
      </DialogActions>
    </Dialog>
  );
}
