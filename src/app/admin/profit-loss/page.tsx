"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Tooltip,
} from "@mui/material";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BottomSheet from "@/app/coponent/BottomSheet";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { adminButtonStartIconSx, adminFieldSx, adminPageSx } from "@/app/admin/theme/adminTheme";

interface MonthlyReport {
  year: number;
  month: number;
  month_name: string;
  total_sales: number;
  total_purchases: number;
  total_manual_sales?: number;
  total_manual_purchases?: number;
  total_profit: number;
  total_expenses: number;
  total_invoices: number;
  invoice_cash_out?: number;
  invoice_unpaid?: number;
  expense_cash_out?: number;
  net_profit: number;
  account_balance: number;
  cash_and_card_total?: number;
  total_collected?: number;
  uncollected_debts?: number;
  uncollected_installments?: number;
  open_cheques?: number;
  credit_used_total?: number;
}

interface FinancialReportResponse {
  data: MonthlyReport[];
  meta?: {
    period?: {
      scope?: string;
      closed_through?: string | null;
      start?: string | null;
      today?: string | null;
      applied_start?: string | null;
      applied_end?: string | null;
    };
  };
  totals: {
    total_sales: number;
    total_purchases: number;
    total_manual_sales?: number;
    total_manual_purchases?: number;
    total_profit: number;
    total_expenses: number;
    total_invoices: number;
    total_net_profit: number;
    total_account_balance: number;
    reconstructed_account_balance?: number;
    cash_and_card_total?: number;
    total_collected?: number;
    uncollected_debts?: number;
    uncollected_installments?: number;
    open_cheques?: number;
    credit_used_total?: number;
    invoice_cash_out?: number;
    invoice_unpaid?: number;
    expense_cash_out?: number;
  };
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const formatNumber = (num: number) => new Intl.NumberFormat("fa-IR").format(num || 0);

const formatYear = (year: number | string) =>
  String(year).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

const formatJalali = (value?: string | null) => {
  if (!value) return "";
  return formatYear(value.replace(/-/g, "/"));
};

const isYearScope = (scope: string) => /^\d{4}$/.test(scope);

const panelSx = {
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "14px",
} as const;

const selectMenuProps = {
  PaperProps: {
    sx: {
      bgcolor: "var(--admin-surface)",
      color: "var(--admin-text)",
      border: "1px solid var(--admin-border)",
      "& .MuiMenuItem-root": {
        color: "var(--admin-text)",
        "&:hover": { bgcolor: "var(--admin-menu-hover)" },
        "&.Mui-selected": { bgcolor: "var(--admin-menu-hover)" },
      },
    },
  },
} as const;

const cellSx = {
  color: "var(--admin-text)",
  fontSize: 12,
  py: 0.75,
  px: 0.9,
  borderBottom: "1px solid var(--admin-divider)",
  whiteSpace: "nowrap",
} as const;

const headCellSx = {
  ...cellSx,
  fontWeight: 700,
  fontSize: 11,
  color: "var(--admin-text)",
  bgcolor: "var(--admin-surface-alt)",
  py: 0.95,
} as const;

function moneyColor(amount: number, positive = "var(--admin-accent)", negative = "var(--admin-error)") {
  if (amount > 0) return positive;
  if (amount < 0) return negative;
  return "var(--admin-text)";
}

function KpiCard({
  label,
  amount,
  color,
  tint,
}: {
  label: string;
  amount: number;
  color: string;
  tint: string;
}) {
  return (
    <Box
      sx={{
        ...panelSx,
        p: 1.25,
        position: "relative",
        overflow: "hidden",
        minWidth: 0,
        background: `linear-gradient(165deg, ${tint} 0%, var(--admin-surface) 68%)`,
        borderColor: "var(--admin-border)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          left: 0,
          height: 3,
          bgcolor: color,
        },
      }}
    >
      <Typography sx={{ fontSize: 12, color: "var(--admin-text)", opacity: 0.78, fontWeight: 600, mb: 0.4 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: { xs: 16, md: 20 }, fontWeight: 800, color, lineHeight: 1.2, whiteSpace: "nowrap" }}>
        {formatNumber(amount)}
      </Typography>
      <Typography sx={{ fontSize: 10, color: "var(--admin-text)", opacity: 0.55, mt: 0.15 }}>تومان</Typography>
    </Box>
  );
}

function AmountLine({
  label,
  amount,
  hint,
  color,
  strong,
}: {
  label: string;
  amount: number;
  hint?: string;
  color?: string;
  strong?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        py: 0.45,
        borderBottom: "1px solid var(--admin-divider)",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>{label}</Typography>
        {hint ? (
          <Tooltip
            title={hint}
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: "var(--admin-surface-alt)",
                  color: "var(--admin-text)",
                  border: "1px solid var(--admin-border)",
                  fontSize: 12,
                },
              },
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 15, color: "var(--admin-text)", opacity: 0.55, cursor: "help" }} />
          </Tooltip>
        ) : null}
      </Box>
      <Typography
        sx={{
          fontSize: strong ? 13.5 : 12.5,
          fontWeight: strong ? 800 : 600,
          color: color ?? "var(--admin-text)",
          whiteSpace: "nowrap",
        }}
      >
        {formatNumber(amount)}
      </Typography>
    </Box>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ ...panelSx, p: 1.35, height: "100%" }}>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 800,
          color: "var(--admin-text)",
          mb: 0.75,
          pb: 0.5,
          borderBottom: "1px solid var(--admin-divider)",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

const monthNames = [
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

const MONTHLY_COLUMNS: { key: keyof MonthlyReport | "label"; label: string; color?: (row: MonthlyReport) => string }[] = [
  { key: "label", label: "ماه" },
  { key: "total_sales", label: "فروش" },
  { key: "total_manual_sales", label: "سند فروش", color: () => "var(--admin-accent)" },
  { key: "total_purchases", label: "خرید" },
  { key: "total_manual_purchases", label: "سند خرید", color: () => "var(--admin-warning)" },
  { key: "total_profit", label: "ناخالص", color: () => "var(--admin-accent)" },
  { key: "total_expenses", label: "هزینه", color: () => "var(--admin-warning)" },
  { key: "total_invoices", label: "فاکتور" },
  { key: "invoice_cash_out", label: "پرداخت" },
  {
    key: "uncollected_debts",
    label: "نسیه",
    color: (row) => ((row.uncollected_debts ?? 0) > 0 ? "var(--admin-warning)" : "var(--admin-text)"),
  },
  {
    key: "net_profit",
    label: "خالص",
    color: (row) => moneyColor(row.net_profit),
  },
  {
    key: "account_balance",
    label: "نقد ماه",
    color: (row) => moneyColor(row.account_balance, "var(--admin-online)"),
  },
];

export default function ProfitLossPage() {
  const currentYear = new Date().getFullYear();
  const persianYear = currentYear - 621;
  const years = Array.from({ length: 10 }, (_, i) => persianYear - 5 + i);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialReportResponse | null>(null);
  const [selectedScope, setSelectedScope] = useState("current");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [draftScope, setDraftScope] = useState("current");
  const [draftMonth, setDraftMonth] = useState<number | "">("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const buildUrl = () => {
    let url = "/api/financial-report/monthly";
    const params: string[] = [];

    if (isYearScope(selectedScope)) {
      const year = Number(selectedScope);
      if (selectedMonth) {
        const month = selectedMonth;
        const startDateStr = `${year}-${String(month).padStart(2, "0")}-01`;
        let lastDay = 30;
        if (month <= 6) lastDay = 31;
        else if (month === 12) lastDay = 29;
        const endDateStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        params.push(`start_date=${encodeURIComponent(startDateStr)}`);
        params.push(`end_date=${encodeURIComponent(endDateStr)}`);
      } else {
        params.push(`start_date=${encodeURIComponent(`${year}-01-01`)}`);
        params.push(`end_date=${encodeURIComponent(`${year}-12-29`)}`);
      }
    } else if (selectedScope === "all") {
      params.push("period=all");
    } else {
      params.push("period=current");
    }

    if (params.length > 0) url += `?${params.join("&")}`;
    return url;
  };

  useEffect(() => {
    const fetchFinancialReport = async () => {
      setLoading(true);
      const token = tokenCode();
      try {
        const url = buildUrl();
        const res = await apiRequestError("Get", {}, {}, url, true, true, token);
        if (res.hasError) {
          const parsedResponse = JSON.parse(res.errorText);
          toast.error(parsedResponse.message || "خطا در دریافت گزارش مالی");
          return;
        }
        setData(res);
      } catch {
        toast.error("خطا در دریافت گزارش مالی");
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialReport();
  }, [selectedScope, selectedMonth]);

  const openFilter = () => {
    setDraftScope(selectedScope);
    setDraftMonth(selectedMonth);
    setFilterSheetOpen(true);
  };

  const closeFilter = () => setFilterSheetOpen(false);

  const applyFilter = () => {
    setSelectedScope(draftScope);
    setSelectedMonth(isYearScope(draftScope) ? draftMonth : "");
    setFilterSheetOpen(false);
  };

  const clearFilter = () => {
    setDraftScope("current");
    setDraftMonth("");
    setSelectedScope("current");
    setSelectedMonth("");
    setFilterSheetOpen(false);
  };

  const hasDraftFilters = draftScope !== "current" || draftMonth !== "";
  const hasActiveFilters = selectedScope !== "current" || selectedMonth !== "";
  const periodMeta = data?.meta?.period;
  const periodLabel = (() => {
    if (isYearScope(selectedScope)) {
      return `${selectedMonth ? monthNames[Number(selectedMonth) - 1] + " " : ""}${formatYear(selectedScope)}`;
    }
    if (selectedScope === "all") return "کل دوره‌ها";
    if (periodMeta?.applied_start) {
      return `دوره جاری از ${formatJalali(periodMeta.applied_start)}`;
    }
    return "دوره جاری";
  })();

  const monthValue = (row: MonthlyReport, key: (typeof MONTHLY_COLUMNS)[number]["key"]) => {
    if (key === "label") return `${row.month_name} ${formatYear(row.year)}`;
    return formatNumber(Number(row[key] ?? 0));
  };

  return (
    <Box sx={{ ...adminPageSx, p: 1.25, pb: 10 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25, gap: 1, flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2, color: "var(--admin-text)" }}>
            سود و ضرر
          </Typography>
          <Typography sx={{ color: "var(--admin-text)", opacity: 0.7, fontSize: 12, mt: 0.25 }}>
            سود از فروش و بهای کالاست؛ پیش‌فرض دورهٔ جاری بعد از آخرین بستن است
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
          <Chip
            size="small"
            icon={<CalendarMonthOutlinedIcon sx={{ "&&": { fontSize: 15, color: "var(--admin-accent)" } }} />}
            label={periodLabel}
            sx={{
              height: 30,
              bgcolor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text)",
              fontWeight: 600,
              fontSize: 12,
            }}
          />
          <Button
            size="small"
            variant="contained"
            startIcon={<FilterListIcon />}
            onClick={openFilter}
            sx={{ ...adminButtonStartIconSx, py: 0.5, fontSize: 12 }}
          >
            فیلتر
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : data && data.data && data.data.length > 0 ? (
        <>
          {data.totals ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
                gap: 1,
                mb: 1.25,
              }}
            >
              <KpiCard
                label="فروش"
                amount={data.totals.total_sales}
                color="var(--admin-text)"
                tint="rgba(148,163,184,0.12)"
              />
              <KpiCard
                label="سود ناخالص"
                amount={data.totals.total_profit}
                color="var(--admin-accent)"
                tint="rgba(120,181,104,0.14)"
              />
              <KpiCard
                label="سود خالص"
                amount={data.totals.total_net_profit}
                color={moneyColor(data.totals.total_net_profit)}
                tint={data.totals.total_net_profit >= 0 ? "rgba(120,181,104,0.14)" : "rgba(248,113,113,0.12)"}
              />
              <KpiCard
                label="موجودی حساب"
                amount={data.totals.total_account_balance}
                color={moneyColor(data.totals.total_account_balance, "var(--admin-online)")}
                tint={data.totals.total_account_balance >= 0 ? "rgba(45,212,191,0.12)" : "rgba(248,113,113,0.12)"}
              />
            </Box>
          ) : null}

          <Box sx={{ ...panelSx, mb: 1.25, overflow: "hidden" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", px: 1.35, pt: 1.1, pb: 0.6 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: "var(--admin-text)" }}>گزارش ماهانه</Typography>
              <Typography sx={{ fontSize: 11, color: "var(--admin-text)", opacity: 0.65 }}>مبالغ به تومان</Typography>
            </Box>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table
                size="small"
                sx={{
                  tableLayout: "fixed",
                  width: "100%",
                  minWidth: 720,
                  "& .MuiTableCell-root": { boxSizing: "border-box" },
                }}
              >
                <TableHead>
                  <TableRow>
                    {MONTHLY_COLUMNS.map((col) => (
                      <TableCell key={col.label} align={col.key === "label" ? "right" : "right"} sx={headCellSx}>
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((report, index) => (
                    <TableRow
                      key={`${report.year}-${report.month}-${index}`}
                      sx={{
                        "&:nth-of-type(even)": { backgroundColor: "var(--admin-surface-alt)" },
                        "&:hover": { backgroundColor: "var(--admin-menu-hover)" },
                      }}
                    >
                      {MONTHLY_COLUMNS.map((col) => (
                        <TableCell
                          key={col.label}
                          align="right"
                          sx={{
                            ...cellSx,
                            fontWeight: col.key === "net_profit" || col.key === "account_balance" ? 700 : 500,
                            color: col.color ? col.color(report) : "var(--admin-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {monthValue(report, col.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {data.totals ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1,
              }}
            >
              <DetailBlock title="سود و زیان">
                <AmountLine label="کل فروش" amount={data.totals.total_sales} hint="فروش تعهدی همین دوره؛ شامل نسیه وصول‌نشده هم هست" />
                <AmountLine label="سند فروش دستی" amount={data.totals.total_manual_sales ?? 0} color="var(--admin-accent)" />
                <AmountLine
                  label="بهای کالای فروش‌رفته"
                  amount={data.totals.total_purchases}
                  hint="این خرید از تأمین‌کننده نیست؛ هزینه کالایی است که فروخته شده"
                />
                <AmountLine label="سند خرید دستی" amount={data.totals.total_manual_purchases ?? 0} color="var(--admin-warning)" />
                <AmountLine label="سود ناخالص" amount={data.totals.total_profit} color="var(--admin-accent)" />
                <AmountLine
                  label="هزینه‌های جاری"
                  amount={data.totals.total_expenses}
                  color="var(--admin-warning)"
                  hint="مبلغ ثبت‌شده هزینه؛ ممکن است همه نقد پرداخت نشده باشد"
                />
                <AmountLine
                  label="پرداخت نقدی هزینه"
                  amount={data.totals.expense_cash_out ?? 0}
                  hint="پولی که واقعاً بابت هزینه از حساب رفته"
                />
                <AmountLine
                  label="سود خالص"
                  amount={data.totals.total_net_profit}
                  color={moneyColor(data.totals.total_net_profit)}
                  strong
                />
              </DetailBlock>

              <DetailBlock title="فاکتور خرید">
                <AmountLine
                  label="فاکتور ثبت‌شده"
                  amount={data.totals.total_invoices}
                  hint="مبلغ فاکتور خرید؛ تا نقد پرداخت نشود از موجودی حساب کم نمی‌شود"
                />
                <AmountLine
                  label="پرداخت نقدی فاکتور"
                  amount={data.totals.invoice_cash_out ?? 0}
                  hint="پولی که بابت فاکتور از حساب رفته"
                />
                <AmountLine
                  label="مانده پرداخت‌نشده"
                  amount={data.totals.invoice_unpaid ?? 0}
                  color={(data.totals.invoice_unpaid ?? 0) > 0 ? "var(--admin-warning)" : "var(--admin-text)"}
                  hint="فاکتور ثبت‌شده منهای پرداخت نقدی"
                  strong
                />
              </DetailBlock>

              <DetailBlock title="وصول فروش">
                <AmountLine
                  label="وصول نقد و کارت"
                  amount={data.totals.cash_and_card_total ?? 0}
                  hint="پولی که سر فروش نقد/کارت گرفته شده"
                />
                <AmountLine
                  label="نسیه وصول‌نشده"
                  amount={data.totals.uncollected_debts ?? 0}
                  color={(data.totals.uncollected_debts ?? 0) > 0 ? "var(--admin-warning)" : "var(--admin-text)"}
                  hint="فروش نسیه که هنوز تسویه نشده؛ داخل صندوق نیست"
                />
                <AmountLine label="قسط وصول‌نشده" amount={data.totals.uncollected_installments ?? 0} />
                <AmountLine label="چک وصول‌نشده" amount={data.totals.open_cheques ?? 0} />
                <AmountLine
                  label="جمع وصول‌شده"
                  amount={data.totals.total_collected ?? 0}
                  hint="نقد/کارت + وصول نسیه و قسط و چک پاس‌شده"
                  strong
                />
              </DetailBlock>

              <DetailBlock title="نقد عملیاتی">
                <AmountLine
                  label="موجودی حساب"
                  amount={data.totals.total_account_balance}
                  color={moneyColor(data.totals.total_account_balance, "var(--admin-online)")}
                  hint="جمع ماندهٔ فعال صندوق نقد، حساب‌های فروشگاه و تنخواه؛ حساب حذف‌شده داخل این رقم نیست"
                  strong
                />
                <AmountLine
                  label="نقد ساخته‌شده از فروش"
                  amount={data.totals.reconstructed_account_balance ?? 0}
                  hint="فروش منهای نسیه و چک وصول‌نشده و پرداخت نقدی فاکتور و هزینه؛ موجودی واقعی نیست"
                />
              </DetailBlock>
            </Box>
          ) : null}
        </>
      ) : (
        <Box sx={{ ...panelSx, display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
          <Typography sx={{ color: "var(--admin-text)", opacity: 0.75, fontSize: 14 }}>داده‌ای برای نمایش وجود ندارد</Typography>
        </Box>
      )}

      <BottomSheet open={filterSheetOpen} onClose={closeFilter} title="فیلتر گزارش">
        <Box sx={{ color: "var(--admin-text)" }}>
          <FormControl fullWidth sx={{ ...adminFieldSx, mb: 2 }}>
            <InputLabel sx={{ color: "var(--admin-text) !important" }}>دوره</InputLabel>
            <Select
              value={draftScope}
              onChange={(e) => {
                setDraftScope(String(e.target.value));
                setDraftMonth("");
              }}
              label="دوره"
              MenuProps={selectMenuProps}
              sx={{
                color: "var(--admin-text)",
                "& .MuiSelect-icon": { color: "var(--admin-text)" },
              }}
            >
              <MenuItem value="current">دوره جاری</MenuItem>
              <MenuItem value="all">کل دوره‌ها</MenuItem>
              {years.map((year) => (
                <MenuItem key={year} value={String(year)}>
                  {formatYear(year)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)", mb: 1 }}>ماه</Typography>
          <Grid container spacing={0.75}>
            {monthNames.map((monthName, index) => {
              const monthNumber = index + 1;
              const isSelected = draftMonth === monthNumber;
              const isDisabled = !isYearScope(draftScope);
              return (
                <Grid item xs={4} sm={3} key={monthNumber}>
                  <Chip
                    label={monthName}
                    onClick={() => {
                      if (isDisabled) return;
                      setDraftMonth(isSelected ? "" : monthNumber);
                    }}
                    sx={{
                      width: "100%",
                      height: 36,
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 600,
                      backgroundColor: isSelected ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                      color: isSelected ? "#fff" : "var(--admin-text)",
                      border: isSelected ? "1px solid var(--admin-accent)" : "1px solid var(--admin-border)",
                      opacity: isDisabled ? 0.45 : 1,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
                  />
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ display: "flex", gap: 1, mt: 2.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={closeFilter}
              sx={{
                color: "var(--admin-text)",
                borderColor: "var(--admin-border)",
                "&:hover": { borderColor: "var(--admin-text)", bgcolor: "var(--admin-menu-hover)" },
              }}
            >
              انصراف
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              onClick={clearFilter}
              disabled={!hasDraftFilters && !hasActiveFilters}
              sx={{
                ...adminButtonStartIconSx,
                color: "var(--admin-error)",
                borderColor: "var(--admin-error)",
                "&:hover": { bgcolor: "var(--admin-error-bg, rgba(248,113,113,0.12))" },
              }}
            >
              حذف
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={applyFilter}
              sx={{ ...adminButtonStartIconSx }}
            >
              تأیید
            </Button>
          </Box>
        </Box>
      </BottomSheet>

      <ToastContainer autoClose={3000} style={{ marginBottom: "76px", borderRadius: "15px" }} position="bottom-right" />
    </Box>
  );
}
