import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export type Employee = {
  id: number;
  name: string;
  phone?: string;
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
  salary_amount?: number;
  status?: string;
  paid_at?: string | null;
};

export type PayrollSettings = {
  salary_hourly_wage: number;
  salary_monthly_work_hours: number;
};

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

export function isPayrollPaid(p: Payroll): boolean {
  return p.status === "paid";
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

export function getPayrollSalary(p: Payroll, hourlyWage: number): number {
  if (typeof p.salary_amount === "number") return p.salary_amount;
  return Number(p.hours_worked || 0) * Number(p.hourly_wage || hourlyWage || 0);
}

export function buildPayrollUrl(year: number | "all", month: number | "all"): string {
  const params = new URLSearchParams();
  if (year !== "all") params.set("year", String(year));
  if (month !== "all") params.set("month", String(month));
  const qs = params.toString();
  return `/api/employee-payrolls${qs ? `?${qs}` : ""}`;
}
