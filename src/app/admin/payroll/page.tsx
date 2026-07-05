"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PaidIcon from "@mui/icons-material/Paid";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import { useRouter } from "next/navigation";
import DateObject from "react-date-object";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import JalaliMonthPickerField from "./JalaliMonthPickerField";
import PayrollConfirmDialog from "./PayrollConfirmDialog";
import {
  PERSIAN_MONTHS,
  buildPayrollBody,
  buildJalaliYearOptions,
  buildPayrollUrl,
  createJalaliDateObject,
  extractList,
  extractSettings,
  formatJalaliYearMonth,
  formatNumber,
  getCurrentJalaliYearMonth,
  getPayrollEmployeeId,
  getPayrollMonth,
  getPayrollSalary,
  getPayrollYear,
  isPayrollPaid,
  normalizePhoneDigits,
  normalizeSearchText,
  parseJalaliMonthPicker,
  type Employee,
  type Payroll,
  type PayrollSettings,
} from "@/app/lib/payroll";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

type PayrollConfirmState =
  | { kind: "pay"; payroll: Payroll }
  | { kind: "delete"; payroll: Payroll };

export default function PayrollPage() {
  const router = useRouter();
  const currentJalali = getCurrentJalaliYearMonth();

  const [loading, setLoading] = useState(true);
  const [payrollsLoading, setPayrollsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [settings, setSettings] = useState<PayrollSettings>({
    salary_hourly_wage: 0,
    salary_monthly_work_hours: 0,
  });

  const [filterYear, setFilterYear] = useState<number | "all">(currentJalali.year);
  const [filterMonth, setFilterMonth] = useState<number | "all">(currentJalali.month);
  const [searchQuery, setSearchQuery] = useState("");

  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [payrollEmployeeId, setPayrollEmployeeId] = useState<number | "">("");
  const [payrollMonthValue, setPayrollMonthValue] = useState<DateObject | null>(
    createJalaliDateObject(currentJalali.year, currentJalali.month),
  );
  const [hoursWorked, setHoursWorked] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<PayrollConfirmState | null>(null);

  const employeeMap = useMemo(() => {
    const map = new Map<number, Employee>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);

  const matchesSearch = useCallback(
    (employee?: Employee | null, fallbackName?: string) => {
      const query = normalizeSearchText(searchQuery);
      const phoneQuery = normalizePhoneDigits(searchQuery);
      if (!query && !phoneQuery) return true;

      const name = normalizeSearchText(employee?.name || fallbackName || "");
      const phone = normalizePhoneDigits(employee?.phone || "");
      const nameMatch = query ? name.includes(query) : false;
      const phoneMatch = phoneQuery ? phone.includes(phoneQuery) : false;
      return nameMatch || phoneMatch;
    },
    [searchQuery],
  );

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const employee = p.employee || employeeMap.get(getPayrollEmployeeId(p));
      return matchesSearch(employee, p.employee_name);
    });
  }, [payrolls, employeeMap, matchesSearch]);

  const filteredSummary = useMemo(() => {
    let totalSalary = 0;
    let totalPaid = 0;
    filteredPayrolls.forEach((p) => {
      const salary = getPayrollSalary(p, settings.salary_hourly_wage);
      totalSalary += salary;
      if (isPayrollPaid(p)) totalPaid += salary;
    });
    return {
      count: filteredPayrolls.length,
      totalSalary,
      totalPaid,
    };
  }, [filteredPayrolls, settings.salary_hourly_wage]);

  const yearOptions = useMemo(
    () => buildJalaliYearOptions(payrolls.map((p) => getPayrollYear(p))),
    [payrolls],
  );

  const loadPayrolls = useCallback(async (year: number | "all", month: number | "all") => {
    const token = tokenCode();
    if (!token) return;

    setPayrollsLoading(true);
    try {
      const payrollRes = await FetchWithJwtClient("GET", buildPayrollUrl(year, month), token);
      if (payrollRes?.hasError) {
        toast.error(getApiErrorMessage(payrollRes, "خطا در دریافت حقوق"));
        return;
      }
      setPayrolls(extractList<Payroll>(payrollRes));
    } finally {
      setPayrollsLoading(false);
    }
  }, []);

  const loadBaseData = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [empRes, settingsRes] = await Promise.all([
        FetchWithJwtClient("GET", "/api/shop-employees", token),
        FetchWithJwtClient("GET", "/api/settings/payroll", token),
      ]);

      if (!empRes?.hasError) {
        setEmployees(extractList<Employee>(empRes));
      }
      if (!settingsRes?.hasError) {
        setSettings(extractSettings(settingsRes));
      }

      if (empRes?.hasError) toast.error(getApiErrorMessage(empRes, "خطا در دریافت کارمندها"));
      if (settingsRes?.hasError) {
        toast.error(getApiErrorMessage(settingsRes, "خطا در دریافت تنظیمات حقوق"));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadPayrolls(filterYear, filterMonth);
  }, [filterYear, filterMonth, loadPayrolls]);

  const clearFilters = () => {
    const jalali = getCurrentJalaliYearMonth();
    setFilterYear(jalali.year);
    setFilterMonth(jalali.month);
    setSearchQuery("");
  };

  const openPayrollDialog = () => {
    const jalali = getCurrentJalaliYearMonth();
    setEditingPayroll(null);
    setPayrollEmployeeId("");
    setPayrollMonthValue(createJalaliDateObject(jalali.year, jalali.month));
    setHoursWorked("");
    setPayrollDialogOpen(true);
  };

  const openEditPayroll = (item: Payroll) => {
    if (isPayrollPaid(item)) {
      toast.error("رکورد پرداخت‌شده قابل ویرایش نیست");
      return;
    }
    setEditingPayroll(item);
    setPayrollEmployeeId(getPayrollEmployeeId(item));
    setPayrollMonthValue(
      createJalaliDateObject(getPayrollYear(item), getPayrollMonth(item)),
    );
    setHoursWorked(String(item.hours_worked || ""));
    setPayrollDialogOpen(true);
  };

  const getEmployeeName = (p: Payroll) =>
    p.employee_name || p.employee?.name || employeeMap.get(getPayrollEmployeeId(p))?.name || "—";

  const getEmployeePhone = (p: Payroll) =>
    p.employee?.phone || employeeMap.get(getPayrollEmployeeId(p))?.phone || "—";

  const savePayroll = async () => {
    if (!payrollEmployeeId) {
      toast.error("کارمند را انتخاب کنید");
      return;
    }
    const jalali = parseJalaliMonthPicker(payrollMonthValue);
    if (!jalali) {
      toast.error("سال و ماه شمسی را انتخاب کنید");
      return;
    }
    const hours = Number(hoursWorked);
    if (!hours || hours <= 0) {
      toast.error("ساعت کارکرد معتبر نیست");
      return;
    }
    setSaving(true);
    try {
      const token = tokenCode();
      const body = buildPayrollBody(payrollEmployeeId, jalali.year, jalali.month, hours);
      const res = editingPayroll
        ? await FetchWithJwtClient(
            "PUT",
            `/api/employee-payrolls/${editingPayroll.id}`,
            token,
            {},
            { body: JSON.stringify(body) },
          )
        : await FetchWithJwtClient(
            "POST",
            "/api/employee-payrolls",
            token,
            {},
            { body: JSON.stringify(body) },
          );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, editingPayroll ? "خطا در ویرایش کارکرد" : "خطا در ثبت کارکرد"));
        return;
      }
      toast.success(editingPayroll ? "کارکرد ویرایش شد" : "کارکرد ماهانه ثبت شد");
      setPayrollDialogOpen(false);
      setEditingPayroll(null);
      setHoursWorked("");
      await loadPayrolls(filterYear, filterMonth);
    } finally {
      setSaving(false);
    }
  };

  const requestDeletePayroll = (item: Payroll) => {
    if (isPayrollPaid(item)) {
      toast.error("رکورد پرداخت‌شده قابل حذف نیست");
      return;
    }
    setConfirmState({ kind: "delete", payroll: item });
  };

  const executeDeletePayroll = async (item: Payroll) => {
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient("DELETE", `/api/employee-payrolls/${item.id}`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف رکورد حقوق"));
        return;
      }
      toast.success("رکورد حقوق حذف شد");
      setConfirmState(null);
      await loadPayrolls(filterYear, filterMonth);
    } finally {
      setSaving(false);
    }
  };

  const requestPayPayroll = (item: Payroll) => {
    setConfirmState({ kind: "pay", payroll: item });
  };

  const executePayPayroll = async (item: Payroll) => {
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient("POST", `/api/employee-payrolls/${item.id}/pay`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در پرداخت حقوق"));
        return;
      }
      toast.success("حقوق پرداخت شد و هزینه ثبت گردید");
      setConfirmState(null);
      await loadPayrolls(filterYear, filterMonth);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    if (confirmState.kind === "delete") {
      await executeDeletePayroll(confirmState.payroll);
    } else {
      await executePayPayroll(confirmState.payroll);
    }
  };

  const confirmDialogProps = useMemo(() => {
    if (!confirmState) return null;
    const payroll = confirmState.payroll;
    const employeeName = getEmployeeName(payroll);
    const monthLabel = formatJalaliYearMonth(getPayrollYear(payroll), getPayrollMonth(payroll));

    if (confirmState.kind === "pay") {
      return {
        title: "پرداخت حقوق",
        message: `حقوق «${employeeName}» برای ${monthLabel} پرداخت شود؟ با تأیید، هزینه در بخش هزینه‌ها ثبت می‌شود.`,
        confirmLabel: "پرداخت",
        confirmColor: "success" as const,
      };
    }

    return {
      title: "حذف رکورد حقوق",
      message: `رکورد حقوق «${employeeName}» (${monthLabel}) حذف شود؟`,
      confirmLabel: "حذف",
      confirmColor: "error" as const,
    };
  }, [confirmState, employeeMap]);

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <BadgeIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "20px" }}>
            مدیریت حقوق
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => router.push("/admin/payroll/employees")}
            sx={{ borderColor: "var(--admin-border)", color: "var(--admin-text-secondary)" }}
          >
            کارمندها
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => router.push("/admin/payroll/settings")}
            sx={{ borderColor: "var(--admin-border)", color: "var(--admin-text-secondary)" }}
          >
            تنظیمات
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2, border: "1px solid var(--admin-border)" }}>
        <CardContent>
          <Grid container spacing={1.25} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="جستجو نام یا تلفن..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "var(--admin-text-muted)" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="سال شمسی"
                value={filterYear}
                onChange={(e) =>
                  setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                sx={fieldSx}
              >
                <MenuItem value="all">همه</MenuItem>
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year}>
                    {formatNumber(year)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="ماه شمسی"
                value={filterMonth}
                onChange={(e) =>
                  setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                sx={fieldSx}
              >
                <MenuItem value="all">همه</MenuItem>
                {PERSIAN_MONTHS.map((label, index) => (
                  <MenuItem key={label} value={index + 1}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FilterAltOffIcon />}
                onClick={clearFilters}
                sx={{ borderColor: "var(--admin-border)", color: "var(--admin-text-secondary)" }}
              >
                بازنشانی فیلتر
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: "1px solid var(--admin-border)" }}>
            <CardContent>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>تعداد رکورد</Typography>
              <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 20 }}>
                {formatNumber(filteredSummary.count)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: "1px solid var(--admin-border)" }}>
            <CardContent>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>جمع حقوق</Typography>
              <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 20 }}>
                {formatNumber(filteredSummary.totalSalary)} تومان
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: "1px solid var(--admin-border)" }}>
            <CardContent>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>جمع پرداخت‌شده</Typography>
              <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 20 }}>
                {formatNumber(filteredSummary.totalPaid)} تومان
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ border: "1px solid var(--admin-border)" }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>لیست حقوق ماهانه</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={openPayrollDialog}>
              ثبت کارکرد
            </Button>
          </Box>
          {loading || payrollsLoading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={26} />
            </Box>
          ) : filteredPayrolls.length === 0 ? (
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
              {payrolls.length === 0 ? "رکورد حقوقی وجود ندارد" : "رکوردی با این فیلتر یافت نشد"}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>کارمند</TableCell>
                    <TableCell>تلفن</TableCell>
                    <TableCell align="center">ماه شمسی</TableCell>
                    <TableCell align="center">کارکرد</TableCell>
                    <TableCell align="center">حقوق</TableCell>
                    <TableCell align="center">وضعیت</TableCell>
                    <TableCell align="center">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayrolls.map((p) => {
                    const employeeName = getEmployeeName(p);
                    const employeePhone = getEmployeePhone(p);
                    const paid = isPayrollPaid(p);
                    const salary = getPayrollSalary(p, settings.salary_hourly_wage);
                    const payrollYear = getPayrollYear(p);
                    const payrollMonth = getPayrollMonth(p);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{employeeName}</TableCell>
                        <TableCell sx={{ direction: "ltr" }}>{employeePhone}</TableCell>
                        <TableCell align="center">{formatJalaliYearMonth(payrollYear, payrollMonth)}</TableCell>
                        <TableCell align="center">
                          {formatNumber(Number(p.hours_worked || 0))} ساعت
                        </TableCell>
                        <TableCell align="center">{formatNumber(salary)} تومان</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            color={paid ? "success" : "warning"}
                            label={paid ? "پرداخت‌شده" : "در انتظار"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, flexWrap: "wrap", justifyContent: "center" }}>
                            {!paid ? (
                              <>
                                <IconButton
                                  size="small"
                                  title="ویرایش"
                                  onClick={() => openEditPayroll(p)}
                                  disabled={saving}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  title="حذف"
                                  onClick={() => requestDeletePayroll(p)}
                                  disabled={saving}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<PaidIcon />}
                                  onClick={() => requestPayPayroll(p)}
                                  disabled={saving}
                                >
                                  پرداخت
                                </Button>
                              </>
                            ) : (
                              "—"
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={payrollDialogOpen}
        onClose={() => {
          if (saving) return;
          setPayrollDialogOpen(false);
          setEditingPayroll(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {editingPayroll ? "ویرایش کارکرد ماهانه (شمسی)" : "ثبت کارکرد ماهانه (شمسی)"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
            <TextField
              select
              size="small"
              label="کارمند"
              value={payrollEmployeeId}
              onChange={(e) => setPayrollEmployeeId(Number(e.target.value))}
              sx={fieldSx}
            >
              {employees.length === 0 ? (
                <MenuItem disabled value="">
                  کارمندی ثبت نشده — از بخش کارمندها اضافه کنید
                </MenuItem>
              ) : (
                employees.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.name}
                    {e.phone ? ` — ${e.phone}` : ""}
                  </MenuItem>
                ))
              )}
            </TextField>
            <JalaliMonthPickerField
              label="سال و ماه شمسی"
              value={payrollMonthValue}
              onChange={setPayrollMonthValue}
            />
            <TextField
              size="small"
              type="number"
              label="ساعت کارکرد"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              sx={fieldSx}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPayrollDialogOpen(false);
              setEditingPayroll(null);
            }}
            disabled={saving}
          >
            انصراف
          </Button>
          <Button variant="contained" onClick={savePayroll} disabled={saving || employees.length === 0}>
            {editingPayroll ? "ذخیره" : "ثبت"}
          </Button>
        </DialogActions>
      </Dialog>

      <PayrollConfirmDialog
        open={Boolean(confirmState && confirmDialogProps)}
        title={confirmDialogProps?.title ?? ""}
        message={confirmDialogProps?.message ?? ""}
        confirmLabel={confirmDialogProps?.confirmLabel ?? "تأیید"}
        confirmColor={confirmDialogProps?.confirmColor ?? "primary"}
        loading={saving}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState(null)}
      />

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
