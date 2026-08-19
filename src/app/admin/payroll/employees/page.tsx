"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
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
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import PayrollConfirmDialog from "../PayrollConfirmDialog";
import {
  extractList,
  extractSettings,
  formatInputWithSeparator,
  formatNumber,
  normalizePhoneDigits,
  normalizeSearchText,
  parseAmount,
  type Employee,
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

export default function PayrollEmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [baseWorkHours, setBaseWorkHours] = useState("");
  const [hourlyWage, setHourlyWage] = useState("");
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [defaultHours, setDefaultHours] = useState("");
  const [defaultHourly, setDefaultHourly] = useState("");

  const loadEmployees = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/shop-employees", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت کارمندها"));
        return;
      }
      const list = extractList<Employee>(res);
      console.log("[shop-employees] GET response", res);
      console.log("[shop-employees] GET first item keys", list[0] ? Object.keys(list[0] as object) : [], list[0]);
      setEmployees(list);
      const settingsRes = await FetchWithJwtClient("GET", "/api/settings/payroll", token);
      if (!settingsRes?.hasError) {
        const settings = extractSettings(settingsRes);
        setDefaultHours(settings.salary_monthly_work_hours ? String(settings.salary_monthly_work_hours) : "");
        setDefaultHourly(settings.salary_hourly_wage ? String(settings.salary_hourly_wage) : "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    const phoneQuery = normalizePhoneDigits(searchQuery);
    if (!query && !phoneQuery) return employees;

    return employees.filter((e) => {
      const name = normalizeSearchText(e.name || "");
      const phone = normalizePhoneDigits(e.phone || "");
      const nameMatch = query ? name.includes(query) : false;
      const phoneMatch = phoneQuery ? phone.includes(phoneQuery) : false;
      return nameMatch || phoneMatch;
    });
  }, [employees, searchQuery]);

  const openCreate = () => {
    setEditing(null);
    setEmployeeName("");
    setEmployeePhone("");
    setBaseSalary("");
    setBaseWorkHours(defaultHours ? formatNumber(parseAmount(defaultHours)) : "");
    setHourlyWage(defaultHourly ? formatNumber(parseAmount(defaultHourly)) : "");
    setDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setEmployeeName(employee.name || "");
    setEmployeePhone(employee.phone || "");
    setBaseSalary(employee.base_salary != null ? formatNumber(Number(employee.base_salary)) : "");
    setBaseWorkHours(employee.base_work_hours != null ? formatNumber(Number(employee.base_work_hours)) : "");
    setHourlyWage(employee.hourly_wage != null ? formatNumber(Number(employee.hourly_wage)) : "");
    setDialogOpen(true);
  };

  const saveEmployee = async () => {
    if (!employeeName.trim()) {
      toast.error("نام کارمند الزامی است");
      return;
    }
    const salary = parseAmount(baseSalary);
    const hours = parseAmount(baseWorkHours);
    const wage = parseAmount(hourlyWage);
    if (salary <= 0) {
      toast.error("پایه حقوق را وارد کنید");
      return;
    }
    if (hours <= 0) {
      toast.error("ساعات کارکرد برای دریافت پایه حقوق را وارد کنید");
      return;
    }
    if (wage <= 0) {
      toast.error("دستمزد ساعتی اضافه‌کار را وارد کنید");
      return;
    }
    setSaving(true);
    try {
      const token = tokenCode();
      const body = {
        name: employeeName.trim(),
        phone: employeePhone.trim() || null,
        base_salary: salary,
        base_work_hours: hours,
        hourly_wage: wage,
      };
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/shop-employees/${editing.id}` : "/api/shop-employees";
      console.log("[shop-employees] request", method, url, body);
      const res = await FetchWithJwtClient(
        method,
        url,
        token,
        {},
        { body: JSON.stringify(body) },
      );
      console.log("[shop-employees] response", res);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ذخیره کارمند"));
        return;
      }
      toast.success("اطلاعات کارمند ذخیره شد");
      setDialogOpen(false);
      await loadEmployees();
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setSaving(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient(
        "DELETE",
        `/api/shop-employees/${employeeToDelete.id}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف کارمند"));
        return;
      }
      toast.success("کارمند حذف شد");
      setEmployeeToDelete(null);
      await loadEmployees();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <BadgeIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "20px" }}>
            کارمندها
          </Typography>
        </Box>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          افزودن کارمند
        </Button>
      </Box>

      <Card sx={{ mb: 2, border: "1px solid var(--admin-border)" }}>
        <CardContent>
          <Grid container spacing={1.25} alignItems="center">
            <Grid item xs={12} md={8}>
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
            <Grid item xs={12} md={4}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FilterAltOffIcon />}
                onClick={() => setSearchQuery("")}
                sx={{ borderColor: "var(--admin-border)", color: "var(--admin-text-secondary)" }}
              >
                پاک کردن جستجو
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ border: "1px solid var(--admin-border)" }}>
        <CardContent>
          {loading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={26} />
            </Box>
          ) : filteredEmployees.length === 0 ? (
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
              {employees.length === 0 ? "کارمندی ثبت نشده" : "کارمندی با این جستجو یافت نشد"}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>نام</TableCell>
                    <TableCell>تلفن</TableCell>
                    <TableCell align="center">پایه حقوق</TableCell>
                    <TableCell align="center">ساعات پایه</TableCell>
                    <TableCell align="center">دستمزد ساعتی</TableCell>
                    <TableCell align="center">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.name}</TableCell>
                      <TableCell sx={{ direction: "ltr" }}>{e.phone || "—"}</TableCell>
                      <TableCell align="center">
                        {e.base_salary ? `${formatNumber(Number(e.base_salary))} تومان` : "—"}
                      </TableCell>
                      <TableCell align="center">
                        {e.base_work_hours ? `${formatNumber(Number(e.base_work_hours))} ساعت` : "—"}
                      </TableCell>
                      <TableCell align="center">
                        {e.hourly_wage ? `${formatNumber(Number(e.hourly_wage))} تومان` : "—"}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => openEdit(e)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => requestDeleteEmployee(e)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? "ویرایش کارمند" : "ثبت کارمند"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
            <TextField
              size="small"
              label="نام"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              sx={fieldSx}
            />
            <TextField
              size="small"
              label="تلفن"
              value={employeePhone}
              onChange={(e) => setEmployeePhone(e.target.value)}
              sx={fieldSx}
            />
            <TextField
              size="small"
              label="پایه حقوق (تومان)"
              value={baseSalary}
              onChange={(e) => setBaseSalary(formatInputWithSeparator(e.target.value))}
              sx={fieldSx}
              inputProps={{ inputMode: "numeric", style: { direction: "ltr", textAlign: "right" } }}
            />
            <TextField
              size="small"
              label="ساعات کارکرد برای دریافت پایه"
              value={baseWorkHours}
              onChange={(e) => setBaseWorkHours(formatInputWithSeparator(e.target.value))}
              sx={fieldSx}
              inputProps={{ inputMode: "numeric", style: { direction: "ltr", textAlign: "right" } }}
            />
            <TextField
              size="small"
              label="دستمزد ساعتی اضافه‌کار (تومان)"
              value={hourlyWage}
              onChange={(e) => setHourlyWage(formatInputWithSeparator(e.target.value))}
              sx={fieldSx}
              inputProps={{ inputMode: "numeric", style: { direction: "ltr", textAlign: "right" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            انصراف
          </Button>
          <Button variant="contained" onClick={saveEmployee} disabled={saving}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      <PayrollConfirmDialog
        open={Boolean(employeeToDelete)}
        title="حذف کارمند"
        message={
          employeeToDelete
            ? `کارمند «${employeeToDelete.name}» حذف شود؟`
            : ""
        }
        confirmLabel="حذف"
        confirmColor="error"
        loading={saving}
        onConfirm={confirmDeleteEmployee}
        onCancel={() => setEmployeeToDelete(null)}
      />

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
