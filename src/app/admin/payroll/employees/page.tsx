"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import {
  fetchShopPermissionsCatalog,
  normalizePermissionKeys,
  permissionTitle,
  useShopPermissionGate,
  type ShopPermissionItem,
} from "@/app/lib/shopPermissions";

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

const checkboxSx = {
  color: "var(--admin-text-muted)",
  py: 0.25,
  "&.Mui-checked": { color: "var(--admin-accent)" },
} as const;

function employeePermissionKeys(employee: Employee | null | undefined): string[] {
  if (!employee) return [];
  return normalizePermissionKeys(employee.permissions ?? employee.shop_permissions);
}

export default function PayrollEmployeesPage() {
  const { isOwner: owner } = useShopPermissionGate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<ShopPermissionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
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
      const [res, catalog] = await Promise.all([
        FetchWithJwtClient("GET", "/api/shop-employees", token),
        fetchShopPermissionsCatalog(),
      ]);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت کارمندها"));
        return;
      }
      setEmployees(extractList<Employee>(res));
      setPermissionCatalog(catalog);
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
      const phone = normalizePhoneDigits(e.phone || e.username || "");
      const nameMatch = query ? name.includes(query) : false;
      const phoneMatch = phoneQuery ? phone.includes(phoneQuery) : false;
      return nameMatch || phoneMatch;
    });
  }, [employees, searchQuery]);

  const openCreate = () => {
    setEditing(null);
    setEmployeeName("");
    setEmployeePhone("");
    setEmployeePassword("");
    setSelectedPermissions([]);
    setBaseSalary("");
    setBaseWorkHours(defaultHours ? formatNumber(parseAmount(defaultHours)) : "");
    setHourlyWage(defaultHourly ? formatNumber(parseAmount(defaultHourly)) : "");
    setDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setEmployeeName(employee.name || "");
    setEmployeePhone(employee.phone || employee.username || "");
    setEmployeePassword("");
    setSelectedPermissions(employeePermissionKeys(employee));
    setBaseSalary(employee.base_salary != null ? formatNumber(Number(employee.base_salary)) : "");
    setBaseWorkHours(employee.base_work_hours != null ? formatNumber(Number(employee.base_work_hours)) : "");
    setHourlyWage(employee.hourly_wage != null ? formatNumber(Number(employee.hourly_wage)) : "");
    setDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const saveEmployee = async () => {
    if (!employeeName.trim()) {
      toast.error("نام کارمند الزامی است");
      return;
    }
    const phone = normalizePhoneDigits(employeePhone);
    if (owner) {
      if (phone.length !== 11 || !phone.startsWith("09")) {
        toast.error("شماره موبایل ۱۱ رقمی (نام کاربری ورود) را وارد کنید");
        return;
      }
      if (!editing && employeePassword.trim().length < 6) {
        toast.error("رمز ورود حداقل ۶ کاراکتر است");
        return;
      }
      if (editing && employeePassword.trim() && employeePassword.trim().length < 6) {
        toast.error("رمز ورود حداقل ۶ کاراکتر است");
        return;
      }
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
      const body: Record<string, unknown> = {
        name: employeeName.trim(),
        phone: phone || null,
        base_salary: salary,
        base_work_hours: hours,
        hourly_wage: wage,
      };
      if (owner) {
        body.permissions = selectedPermissions;
        if (employeePassword.trim()) body.password = employeePassword.trim();
      }
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/shop-employees/${editing.id}` : "/api/shop-employees";
      const res = await FetchWithJwtClient(
        method,
        url,
        token,
        {},
        { body: JSON.stringify(body) },
      );
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
                    <TableCell>تلفن / نام کاربری</TableCell>
                    <TableCell>دسترسی‌ها</TableCell>
                    <TableCell align="center">پایه حقوق</TableCell>
                    <TableCell align="center">ساعات پایه</TableCell>
                    <TableCell align="center">دستمزد ساعتی</TableCell>
                    <TableCell align="center">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((e) => {
                    const keys = employeePermissionKeys(e);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>{e.name}</TableCell>
                        <TableCell sx={{ direction: "ltr" }}>{e.phone || e.username || "—"}</TableCell>
                        <TableCell
                          title={keys.length ? keys.map((key) => permissionTitle(key)).join("، ") : undefined}
                          sx={{
                            color: "var(--admin-text-muted)",
                            fontSize: 12,
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {keys.length === 0
                            ? "بدون دسترسی ورود"
                            : keys.map((key) => permissionTitle(key)).join("، ")}
                        </TableCell>
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
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
              label="تلفن / نام کاربری"
              value={employeePhone}
              onChange={(e) => setEmployeePhone(normalizePhoneDigits(e.target.value).slice(0, 11))}
              sx={fieldSx}
              helperText={owner ? "شماره ۱۱ رقمی برای ورود کارمند" : undefined}
              inputProps={{ inputMode: "numeric", style: { direction: "ltr", textAlign: "right" } }}
            />
            {owner ? (
              <TextField
                size="small"
                type="password"
                label={editing ? "رمز ورود (اختیاری)" : "رمز ورود"}
                value={employeePassword}
                onChange={(e) => setEmployeePassword(e.target.value)}
                sx={fieldSx}
                autoComplete="new-password"
                helperText={
                  editing
                    ? "خالی بگذارید اگر نمی‌خواهید رمز عوض شود"
                    : "حداقل ۶ کاراکتر — برای اولین ورود لازم است"
                }
              />
            ) : null}
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
            {owner ? (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{ color: "var(--admin-text)", fontSize: 13, fontWeight: 600 }}>
                    دسترسی‌های پنل
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button
                      size="small"
                      onClick={() => setSelectedPermissions(permissionCatalog.map((item) => item.key))}
                    >
                      همه
                    </Button>
                    <Button size="small" onClick={() => setSelectedPermissions([])}>
                      هیچ‌کدام
                    </Button>
                  </Box>
                </Box>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 1 }}>
                  کارمند فقط بخش‌های تیک‌خورده را در منو می‌بیند. کلید دسترسی به API فرستاده می‌شود، نه عنوان فارسی.
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 0.25,
                    maxHeight: 280,
                    overflowY: "auto",
                    pr: 0.5,
                    border: "1px solid var(--admin-border)",
                    borderRadius: "8px",
                    p: 1,
                    backgroundColor: "var(--admin-surface-alt)",
                  }}
                >
                  {permissionCatalog.map((item) => (
                    <FormControlLabel
                      key={item.key}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedPermissions.includes(item.key)}
                          onChange={() => togglePermission(item.key)}
                          sx={checkboxSx}
                        />
                      }
                      label={
                        <Typography sx={{ color: "var(--admin-text)", fontSize: 12 }}>
                          {item.title}
                        </Typography>
                      }
                      sx={{ mr: 0, ml: 0 }}
                    />
                  ))}
                </Box>
              </Box>
            ) : null}
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
