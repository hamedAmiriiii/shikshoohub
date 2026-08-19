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
  PAYMENT_TYPE_OPTIONS,
  PERSIAN_MONTHS,
  buildPayrollBody,
  buildJalaliYearOptions,
  buildPayrollUrl,
  createJalaliDateObject,
  estimateSalaryFromEmployee,
  extractList,
  formatJalaliYearMonth,
  formatNumber,
  getCurrentJalaliYearMonth,
  getPayrollEmployeeId,
  getPayrollMonth,
  getPayrollPayments,
  getPayrollRemaining,
  getPayrollSalary,
  getPayrollStatus,
  getPayrollTotalPaid,
  getPayrollYear,
  isPayrollPaid,
  normalizePhoneDigits,
  normalizeSearchText,
  parseAmount,
  parseJalaliMonthPicker,
  paymentTypeLabel,
  payrollStatusColor,
  payrollStatusLabel,
  type Employee,
  type Payroll,
  type PayrollPayment,
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
  | { kind: "delete"; payroll: Payroll }
  | { kind: "delete-payment"; payment: PayrollPayment };

export default function PayrollPage() {
  const router = useRouter();
  const currentJalali = getCurrentJalaliYearMonth();

  const [loading, setLoading] = useState(true);
  const [payrollsLoading, setPayrollsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

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

  const [paymentsPayroll, setPaymentsPayroll] = useState<Payroll | null>(null);
  const [payments, setPayments] = useState<PayrollPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState("salary");
  const [paymentTitle, setPaymentTitle] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const employeeMap = useMemo(() => {
    const map = new Map<number, Employee>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);

  const selectedEmployee = useMemo(() => {
    if (!payrollEmployeeId) return undefined;
    return employeeMap.get(Number(payrollEmployeeId));
  }, [employeeMap, payrollEmployeeId]);

  const estimatedSalary = useMemo(() => {
    const hours = Number(hoursWorked) || 0;
    if (!selectedEmployee || hours <= 0) return 0;
    return estimateSalaryFromEmployee(selectedEmployee, hours);
  }, [hoursWorked, selectedEmployee]);

  const estimatedOvertime = useMemo(() => {
    const hours = Number(hoursWorked) || 0;
    const baseHours = Number(selectedEmployee?.base_work_hours) || 0;
    return Math.max(0, hours - baseHours);
  }, [hoursWorked, selectedEmployee]);

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
    let totalRemaining = 0;
    filteredPayrolls.forEach((p) => {
      totalSalary += getPayrollSalary(p);
      totalPaid += getPayrollTotalPaid(p);
      totalRemaining += getPayrollRemaining(p);
    });
    return {
      count: filteredPayrolls.length,
      totalSalary,
      totalPaid,
      totalRemaining,
    };
  }, [filteredPayrolls]);

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
      const list = extractList<Payroll>(payrollRes);
      setPayrolls(list);
      return list;
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
      const empRes = await FetchWithJwtClient("GET", "/api/shop-employees", token);
      if (!empRes?.hasError) {
        setEmployees(extractList<Employee>(empRes));
      } else {
        toast.error(getApiErrorMessage(empRes, "خطا در دریافت کارمندها"));
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
    if (isPayrollPaid(item) || getPayrollTotalPaid(item) > 0) {
      toast.error("رکوردی که پرداخت دارد قابل ویرایش نیست");
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
    const employee = employeeMap.get(Number(payrollEmployeeId));
    if (!employee?.base_salary) {
      toast.error("برای این کارمند پایه حقوق ثبت نشده است");
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
    if (getPayrollTotalPaid(item) > 0) {
      toast.error("رکوردی که پرداخت دارد قابل حذف نیست");
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

  const applyPayrollToPaymentsDialog = (item: Payroll) => {
    setPaymentsPayroll(item);
    setPayments(getPayrollPayments(item));
  };

  const loadPayments = async (payroll: Payroll) => {
    const nested = getPayrollPayments(payroll);
    if (nested.length > 0 || payroll.payments) {
      setPayments(nested);
      return;
    }
    setPaymentsLoading(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "GET",
        `/api/employee-payrolls/${payroll.id}/payments`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت پرداخت‌ها"));
        setPayments([]);
        return;
      }
      setPayments(extractList<PayrollPayment>(res));
    } finally {
      setPaymentsLoading(false);
    }
  };

  const openPaymentsDialog = async (item: Payroll) => {
    setPaymentAmount("");
    setPaymentType("salary");
    setPaymentTitle("");
    setPaymentNote("");
    applyPayrollToPaymentsDialog(item);
    await loadPayments(item);
  };

  const closePaymentsDialog = () => {
    if (saving) return;
    setPaymentsPayroll(null);
    setPayments([]);
    setConfirmState(null);
  };

  const savePayment = async () => {
    if (!paymentsPayroll) return;
    const remaining = getPayrollRemaining(paymentsPayroll);
    const amount = parseAmount(paymentAmount);
    if (amount <= 0) {
      toast.error("مبلغ پرداخت را وارد کنید");
      return;
    }
    if (amount > remaining) {
      toast.error("مبلغ از مانده حقوق بیشتر است");
      return;
    }
    setSaving(true);
    try {
      const token = tokenCode();
      const body: Record<string, unknown> = {
        amount,
        payment_type: paymentType,
      };
      if (paymentTitle.trim()) body.title = paymentTitle.trim();
      if (paymentNote.trim()) body.note = paymentNote.trim();
      const res = await FetchWithJwtClient(
        "POST",
        `/api/employee-payrolls/${paymentsPayroll.id}/payments`,
        token,
        {},
        { body: JSON.stringify(body) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ثبت پرداخت"));
        return;
      }
      toast.success("پرداخت ثبت شد");
      setPaymentAmount("");
      setPaymentTitle("");
      setPaymentNote("");
      const list = (await loadPayrolls(filterYear, filterMonth)) || [];
      const updated = list.find((p) => p.id === paymentsPayroll.id);
      if (updated) applyPayrollToPaymentsDialog(updated);
    } finally {
      setSaving(false);
    }
  };

  const executeDeletePayment = async (payment: PayrollPayment) => {
    if (!paymentsPayroll) return;
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "DELETE",
        `/api/employee-payrolls/${paymentsPayroll.id}/payments/${payment.id}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف پرداخت"));
        return;
      }
      toast.success("پرداخت حذف شد");
      setConfirmState(null);
      const list = (await loadPayrolls(filterYear, filterMonth)) || [];
      const updated = list.find((p) => p.id === paymentsPayroll.id);
      if (updated) applyPayrollToPaymentsDialog(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    if (confirmState.kind === "delete") {
      await executeDeletePayroll(confirmState.payroll);
    } else {
      await executeDeletePayment(confirmState.payment);
    }
  };

  const confirmDialogProps = useMemo(() => {
    if (!confirmState) return null;

    if (confirmState.kind === "delete-payment") {
      return {
        title: "حذف پرداخت",
        message: `پرداخت ${formatNumber(Number(confirmState.payment.amount))} تومان حذف شود؟`,
        confirmLabel: "حذف",
        confirmColor: "error" as const,
      };
    }

    const payroll = confirmState.payroll;
    const employeeName = getEmployeeName(payroll);
    const monthLabel = formatJalaliYearMonth(getPayrollYear(payroll), getPayrollMonth(payroll));
    return {
      title: "حذف رکورد حقوق",
      message: `رکورد حقوق «${employeeName}» (${monthLabel}) حذف شود؟`,
      confirmLabel: "حذف",
      confirmColor: "error" as const,
    };
  }, [confirmState, employeeMap]);

  const paymentsRemaining = paymentsPayroll ? getPayrollRemaining(paymentsPayroll) : 0;

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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: "1px solid var(--admin-border)" }}>
            <CardContent>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>تعداد رکورد</Typography>
              <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 20 }}>
                {formatNumber(filteredSummary.count)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: "1px solid var(--admin-border)" }}>
            <CardContent>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>جمع حقوق</Typography>
              <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 20 }}>
                {formatNumber(filteredSummary.totalSalary)} تومان
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: "1px solid var(--admin-border)" }}>
            <CardContent>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>جمع پرداخت‌شده</Typography>
              <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 20 }}>
                {formatNumber(filteredSummary.totalPaid)} تومان
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: "1px solid var(--admin-border)" }}>
            <CardContent>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>مانده</Typography>
              <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 20 }}>
                {formatNumber(filteredSummary.totalRemaining)} تومان
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
                    <TableCell align="center">پرداخت‌شده</TableCell>
                    <TableCell align="center">مانده</TableCell>
                    <TableCell align="center">وضعیت</TableCell>
                    <TableCell align="center">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayrolls.map((p) => {
                    const employeeName = getEmployeeName(p);
                    const employeePhone = getEmployeePhone(p);
                    const salary = getPayrollSalary(p);
                    const paidAmount = getPayrollTotalPaid(p);
                    const remaining = getPayrollRemaining(p);
                    const status = getPayrollStatus(p);
                    const paid = isPayrollPaid(p);
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
                        <TableCell align="center">{formatNumber(paidAmount)} تومان</TableCell>
                        <TableCell align="center">{formatNumber(remaining)} تومان</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            color={payrollStatusColor(status)}
                            label={payrollStatusLabel(status)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, flexWrap: "wrap", justifyContent: "center" }}>
                            {!paid && paidAmount === 0 ? (
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
                              </>
                            ) : null}
                            <Button
                              size="small"
                              variant={paid ? "outlined" : "contained"}
                              startIcon={<PaidIcon />}
                              onClick={() => openPaymentsDialog(p)}
                              disabled={saving}
                            >
                              {paid ? "پرداخت‌ها" : "پرداخت"}
                            </Button>
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
            {selectedEmployee ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                پایه {formatNumber(Number(selectedEmployee.base_salary || 0))} تومان برای{" "}
                {formatNumber(Number(selectedEmployee.base_work_hours || 0))} ساعت
                {selectedEmployee.hourly_wage
                  ? ` — اضافه‌کار ${formatNumber(Number(selectedEmployee.hourly_wage))} تومان`
                  : ""}
              </Typography>
            ) : null}
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
            {estimatedSalary > 0 ? (
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13 }}>
                برآورد حقوق: {formatNumber(estimatedSalary)} تومان
                {estimatedOvertime > 0
                  ? ` (اضافه‌کار ${formatNumber(estimatedOvertime)} ساعت)`
                  : ""}
              </Typography>
            ) : null}
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

      <Dialog
        open={Boolean(paymentsPayroll)}
        onClose={closePaymentsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          پرداخت‌ها
          {paymentsPayroll ? ` — ${getEmployeeName(paymentsPayroll)}` : ""}
        </DialogTitle>
        <DialogContent>
          {paymentsPayroll ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
              <Typography sx={{ fontSize: 13, color: "var(--admin-text-secondary)" }}>
                حقوق {formatNumber(getPayrollSalary(paymentsPayroll))} تومان — پرداخت‌شده{" "}
                {formatNumber(getPayrollTotalPaid(paymentsPayroll))} — مانده{" "}
                {formatNumber(paymentsRemaining)} تومان
              </Typography>
              {paymentsPayroll.salary_breakdown ? (
                <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                  پایه {formatNumber(Number(paymentsPayroll.salary_breakdown.base_salary || 0))}
                  {paymentsPayroll.salary_breakdown.overtime_hours
                    ? ` + اضافه‌کار ${formatNumber(Number(paymentsPayroll.salary_breakdown.overtime_hours))} ساعت (${formatNumber(Number(paymentsPayroll.salary_breakdown.overtime_amount || 0))} تومان)`
                    : ""}
                </Typography>
              ) : null}

              {paymentsRemaining > 0 ? (
                <>
                  <TextField
                    select
                    size="small"
                    label="نوع پرداخت"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    sx={fieldSx}
                  >
                    {PAYMENT_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  {(paymentType === "advance" || paymentType === "other") ? (
                    <TextField
                      size="small"
                      label={paymentType === "advance" ? "عنوان مساعده" : "عنوان"}
                      value={paymentTitle}
                      onChange={(e) => setPaymentTitle(e.target.value)}
                      sx={fieldSx}
                    />
                  ) : null}
                  <TextField
                    size="small"
                    type="number"
                    label="مبلغ (تومان)"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    sx={fieldSx}
                  />
                  <TextField
                    size="small"
                    label="توضیح (اختیاری)"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    sx={fieldSx}
                  />
                  <Button variant="contained" onClick={savePayment} disabled={saving}>
                    ثبت پرداخت
                  </Button>
                </>
              ) : (
                <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                  این حقوق کاملاً تسویه شده است
                </Typography>
              )}

              {paymentsLoading ? (
                <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={22} />
                </Box>
              ) : payments.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>
                  هنوز پرداختی ثبت نشده
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>نوع</TableCell>
                        <TableCell>عنوان</TableCell>
                        <TableCell align="center">مبلغ</TableCell>
                        <TableCell align="center">حذف</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((pay) => (
                        <TableRow key={pay.id}>
                          <TableCell>{paymentTypeLabel(pay.payment_type)}</TableCell>
                          <TableCell>{pay.title || pay.note || "—"}</TableCell>
                          <TableCell align="center">{formatNumber(parseAmount(pay.amount))} تومان</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => setConfirmState({ kind: "delete-payment", payment: pay })}
                              disabled={saving}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentsDialog} disabled={saving}>
            بستن
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
