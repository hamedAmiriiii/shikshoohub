import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export type Employee = {
  id: number;
  name: string;
  phone?: string;
  username?: string;
  base_salary?: number;
  base_work_hours?: number;
  hourly_wage?: number;
  permissions?: string[] | Array<{ key?: string; name?: string; permission?: string }>;
  shop_permissions?: string[] | Array<{ key?: string; name?: string; permission?: string }>;
};

export type PayrollSalaryBreakdown = {
  base_salary?: number;
  base_work_hours?: number;
  overtime_hours?: number;
  overtime_amount?: number;
};

export type PayrollStatus = "pending" | "partial" | "paid" | string;

export type PayrollPaymentType = "salary" | "advance" | "other" | string;

export type PayrollPayment = {
  id: number;
  amount: number | string;
  payment_type?: PayrollPaymentType;
  title?: string | null;
  note?: string | null;
  created_at?: string;
};

export type Payroll = {
  id: number;
  employee_id?: number;
  shop_employee_id?: number;
  employee_name?: string;
  employee?: Employee;
  year?: number;
  month?: number;
  payroll_year?: number;
  payroll_month?: number;
  hours_worked: number;
  hourly_wage?: number;
  salary_amount?: number | string;
  salary_breakdown?: PayrollSalaryBreakdown;
  total_paid?: number | string;
  remaining?: number | string;
  payments?: PayrollPayment[];
  status?: PayrollStatus;
  paid_at?: string | null;
};

export type PayrollSettings = {
  salary_hourly_wage: number;
  salary_monthly_work_hours: number;
};

export const PAYMENT_TYPE_OPTIONS = [
  { value: "salary", label: "پرداخت حقوق" },
  { value: "advance", label: "مساعده" },
  { value: "other", label: "سایر" },
] as const;

export const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.floor(n || 0));

export function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/٬/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\s/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export function formatInputWithSeparator(value: string): string {
  const digitsOnly = String(value ?? "").replace(/[^\d۰-۹٠-٩]/g, "");
  if (!digitsOnly) return "";
  return formatNumber(parseAmount(digitsOnly));
}

export function getCurrentJalaliYearMonth(): { year: number; month: number } {
  const d = new DateObject({ calendar: persian, locale: persian_fa });
  return { year: d.year, month: d.month.number };
}

export function createJalaliDateObject(year: number, month: number): DateObject {
  return new DateObject({
    year,
    month,
    day: 1,
    calendar: persian,
    locale: persian_fa,
  });
}

export function parseJalaliMonthPicker(
  value: DateObject | DateObject[] | null | undefined,
): { year: number; month: number } | null {
  if (!value || Array.isArray(value)) return null;
  const d = value instanceof DateObject ? value : new DateObject(value);
  return { year: d.year, month: d.month.number };
}

export function formatJalaliYearMonth(year: number, month: number): string {
  const label = PERSIAN_MONTHS[month - 1] || String(month);
  return `${label} ${formatNumber(year)}`;
}

export function buildJalaliYearOptions(existingYears: number[]): number[] {
  const { year: currentYear } = getCurrentJalaliYearMonth();
  const years = new Set<number>([currentYear, currentYear - 1]);
  existingYears.forEach((y) => {
    if (y > 0) years.add(y);
  });
  return Array.from(years).sort((a, b) => b - a);
}

export function normalizeSearchText(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return value
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (c) => String(persianDigits.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(arabicDigits.indexOf(c)));
}

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function extractList<T>(res: unknown): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  const obj = res as { data?: unknown };
  if (Array.isArray(obj.data)) return obj.data as T[];
  return [];
}

export function extractSettings(res: unknown): PayrollSettings {
  const obj = res as { data?: Record<string, unknown> } & Record<string, unknown>;
  const src = obj?.data && typeof obj.data === "object" ? obj.data : obj;
  return {
    salary_hourly_wage: Number(src?.salary_hourly_wage) || 0,
    salary_monthly_work_hours: Number(src?.salary_monthly_work_hours) || 0,
  };
}

export function getPayrollEmployeeId(p: Payroll): number {
  return Number(p.employee_id ?? p.shop_employee_id ?? p.employee?.id) || 0;
}

export function getPayrollYear(p: Payroll): number {
  return Number(p.year ?? p.payroll_year) || 0;
}

export function getPayrollMonth(p: Payroll): number {
  return Number(p.month ?? p.payroll_month) || 0;
}

export function getPayrollPayments(p: Payroll): PayrollPayment[] {
  return Array.isArray(p.payments) ? p.payments : [];
}

export function getPayrollSalary(p: Payroll, fallbackHourlyWage = 0): number {
  if (p.salary_amount != null && String(p.salary_amount) !== "") {
    return parseAmount(p.salary_amount);
  }
  return Number(p.hours_worked || 0) * Number(p.hourly_wage || fallbackHourlyWage || 0);
}

export function getPayrollTotalPaid(p: Payroll): number {
  if (p.total_paid != null && p.total_paid !== "") {
    return parseAmount(p.total_paid);
  }
  const fromPayments = getPayrollPayments(p).reduce(
    (sum, payment) => sum + parseAmount(payment.amount),
    0,
  );
  if (fromPayments > 0) return fromPayments;
  if (p.status === "paid") return getPayrollSalary(p);
  return 0;
}

export function getPayrollRemaining(p: Payroll): number {
  if (p.remaining != null && p.remaining !== "") {
    return parseAmount(p.remaining);
  }
  return Math.max(0, getPayrollSalary(p) - getPayrollTotalPaid(p));
}

export function getPayrollStatus(p: Payroll): PayrollStatus {
  if (p.status) return p.status;
  const remaining = getPayrollRemaining(p);
  const paid = getPayrollTotalPaid(p);
  if (paid > 0 && remaining > 0) return "partial";
  if (remaining <= 0 && getPayrollSalary(p) > 0) return "paid";
  return "pending";
}

export function isPayrollPaid(p: Payroll): boolean {
  return getPayrollStatus(p) === "paid";
}

export function payrollStatusLabel(status: PayrollStatus): string {
  if (status === "paid") return "تسویه";
  if (status === "partial") return "پرداخت ناقص";
  return "در انتظار";
}

export function payrollStatusColor(status: PayrollStatus): "success" | "info" | "warning" {
  if (status === "paid") return "success";
  if (status === "partial") return "info";
  return "warning";
}

export function paymentTypeLabel(type?: PayrollPaymentType): string {
  if (type === "advance") return "مساعده";
  if (type === "other") return "سایر";
  return "پرداخت حقوق";
}

export function estimateSalaryFromEmployee(employee: Employee | undefined, hoursWorked: number): number {
  if (!employee || hoursWorked <= 0) return 0;
  const baseSalary = Number(employee.base_salary) || 0;
  const baseHours = Number(employee.base_work_hours) || 0;
  const overtimeHourly = Number(employee.hourly_wage) || 0;

  if (baseHours > 0 && baseSalary > 0) {
    const regularHours = Math.min(hoursWorked, baseHours);
    const overtimeHours = Math.max(0, hoursWorked - baseHours);
    const regularPay = (baseSalary / baseHours) * regularHours;
    return Math.round(regularPay + overtimeHours * overtimeHourly);
  }

  if (overtimeHourly > 0) return Math.round(hoursWorked * overtimeHourly);
  return 0;
}

export function buildPayrollBody(
  employeeId: number,
  year: number,
  month: number,
  hours: number,
): Record<string, number> {
  return {
    shop_employee_id: employeeId,
    payroll_year: year,
    payroll_month: month,
    hours_worked: hours,
  };
}

export function buildAdvanceBody(input: {
  employeeId: number;
  year: number;
  month: number;
  amount: number;
  note?: string;
  shopAccountId?: number | "";
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    shop_employee_id: input.employeeId,
    payroll_year: input.year,
    payroll_month: input.month,
    amount: input.amount,
  };
  if (input.note?.trim()) body.note = input.note.trim();
  if (input.shopAccountId !== "" && input.shopAccountId != null) {
    body.shop_account_id = input.shopAccountId;
  }
  return body;
}

export function hasPayrollHours(p: Payroll): boolean {
  return Number(p.hours_worked) > 0;
}

export type PayrollPayslip = {
  shopName: string;
  employeeName: string;
  employeePhone: string;
  periodLabel: string;
  statusLabel: string;
  hoursWorked: number;
  baseHours: number;
  overtimeHours: number;
  shortageHours: number;
  hourlyRate: number;
  overtimeHourly: number;
  regularPay: number;
  overtimePay: number;
  shortageAmount: number;
  salary: number;
  advances: number;
  salaryPayments: number;
  otherPayments: number;
  totalPaid: number;
  remaining: number;
  hasHours: boolean;
  payments: Array<{
    typeLabel: string;
    amount: number;
    title?: string;
    note?: string;
  }>;
};

export function formatPayrollHours(n: number): string {
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(n || 0);
}

export function readPayrollShopName(): string {
  if (typeof window === "undefined") return "";
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return (
      user.atelier_name ||
      user.shop_name ||
      user.shop?.name ||
      ""
    );
  } catch {
    return "";
  }
}

export function buildPayrollPayslip(
  payroll: Payroll,
  employee?: Employee | null,
  shopName = "",
): PayrollPayslip {
  const emp = employee || payroll.employee;
  const breakdown = payroll.salary_breakdown;
  const hoursWorked = Number(payroll.hours_worked) || 0;
  const baseHours =
    Number(breakdown?.base_work_hours) || Number(emp?.base_work_hours) || 0;
  const baseSalary =
    Number(breakdown?.base_salary) || Number(emp?.base_salary) || 0;
  const overtimeHourly =
    Number(emp?.hourly_wage) || Number(payroll.hourly_wage) || 0;
  const hourlyRate = baseHours > 0 && baseSalary > 0 ? baseSalary / baseHours : 0;
  const overtimeHours =
    Number(breakdown?.overtime_hours) ||
    (baseHours > 0 ? Math.max(0, hoursWorked - baseHours) : 0);
  const shortageHours =
    hoursWorked > 0 && baseHours > 0 ? Math.max(0, baseHours - hoursWorked) : 0;
  const regularHours =
    hoursWorked > 0 && baseHours > 0
      ? Math.min(hoursWorked, baseHours)
      : hoursWorked;
  const overtimePay =
    Number(breakdown?.overtime_amount) || Math.round(overtimeHours * overtimeHourly);
  const regularPay = Math.round(hourlyRate * regularHours);
  const shortageAmount = Math.round(hourlyRate * shortageHours);
  const salary = getPayrollSalary(payroll);
  const payments = getPayrollPayments(payroll).map((payment) => ({
    typeLabel: paymentTypeLabel(payment.payment_type),
    amount: parseAmount(payment.amount),
    title: payment.title || undefined,
    note: payment.note || undefined,
  }));
  const advances = payments
    .filter((p) => p.typeLabel === "مساعده")
    .reduce((sum, p) => sum + p.amount, 0);
  const salaryPayments = payments
    .filter((p) => p.typeLabel === "پرداخت حقوق")
    .reduce((sum, p) => sum + p.amount, 0);
  const otherPayments = payments
    .filter((p) => p.typeLabel === "سایر")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    shopName: shopName || readPayrollShopName(),
    employeeName:
      payroll.employee_name || emp?.name || "—",
    employeePhone: emp?.phone || "—",
    periodLabel: formatJalaliYearMonth(getPayrollYear(payroll), getPayrollMonth(payroll)),
    statusLabel: payrollStatusLabel(getPayrollStatus(payroll)),
    hoursWorked,
    baseHours,
    overtimeHours,
    shortageHours,
    hourlyRate: Math.round(hourlyRate),
    overtimeHourly,
    regularPay,
    overtimePay,
    shortageAmount,
    salary,
    advances,
    salaryPayments,
    otherPayments,
    totalPaid: getPayrollTotalPaid(payroll),
    remaining: getPayrollRemaining(payroll),
    hasHours: hoursWorked > 0,
    payments,
  };
}

export function buildPayrollUrl(year: number | "all", month: number | "all"): string {
  const params = new URLSearchParams();
  if (year !== "all") params.set("year", String(year));
  if (month !== "all") params.set("month", String(month));
  const qs = params.toString();
  return `/api/employee-payrolls${qs ? `?${qs}` : ""}`;
}
