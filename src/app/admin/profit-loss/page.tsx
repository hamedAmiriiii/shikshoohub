"use client";
import { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem, FormControl, InputLabel, Chip, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiRequestError } from '@/app/lib/apiRequestError/client';
import tokenCode from '@/app/coponent/tokenCode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BottomSheetModal from "@/app/coponent/BottomSheetModal";
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';

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

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

function MoneyRow({
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
    <TableRow
      sx={{
        "&:hover": {
          backgroundColor: "var(--admin-surface-alt)",
        },
      }}
    >
      <TableCell sx={{ color: "var(--admin-text)", verticalAlign: "top" }}>
        {label}
        {hint ? (
          <Typography sx={{ fontSize: "12px", color: "var(--admin-text-secondary)", mt: "4px", lineHeight: 1.6 }}>
            {hint}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          color: color ?? "var(--admin-text)",
          fontWeight: strong ? 700 : 600,
          fontSize: strong ? "18px" : undefined,
          whiteSpace: "nowrap",
        }}
      >
        {formatNumber(amount)} تومان
      </TableCell>
    </TableRow>
  );
}

function SectionRow({ title }: { title: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={2}
        sx={{
          color: "var(--admin-text-secondary)",
          fontWeight: 700,
          fontSize: "13px",
          pt: "18px",
          borderBottom: "1px solid var(--admin-divider)",
        }}
      >
        {title}
      </TableCell>
    </TableRow>
  );
}

const monthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export default function ProfitLossPage() {
  const router = useRouter();
  // تولید لیست سال‌ها (از 1400 تا سال جاری + 2 سال آینده)
  const currentYear = new Date().getFullYear();
  const persianYear = currentYear - 621; // تبدیل به شمسی تقریبی
  const years = Array.from({ length: 10 }, (_, i) => persianYear - 5 + i);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialReportResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | ''>(''); // بدون فیلتر پیش‌فرض
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const buildUrl = () => {
    let url = "/api/financial-report/monthly";
    const params: string[] = [];

    if (selectedYear) {
      if (selectedMonth) {
        // فیلتر بر اساس سال و ماه خاص
        const year = selectedYear;
        const month = selectedMonth;
        
        // اولین روز ماه
        const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        
        // آخرین روز ماه - برای ماه‌های شمسی
        let lastDay = 30; // پیش‌فرض
        if (month <= 6) {
          lastDay = 31;
        } else if (month === 12) {
          // بررسی سال کبیسه برای اسفند
          lastDay = 29; // می‌توانید منطق کبیسه را اضافه کنید
        }
        
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        params.push(`start_date=${encodeURIComponent(startDateStr)}`);
        params.push(`end_date=${encodeURIComponent(endDateStr)}`);
      } else {
        // فیلتر بر اساس سال (همه ماه‌های سال)
        const year = selectedYear;
        const startDateStr = `${year}-01-01`;
        const endDateStr = `${year}-12-29`; // اسفند
        
        params.push(`start_date=${encodeURIComponent(startDateStr)}`);
        params.push(`end_date=${encodeURIComponent(endDateStr)}`);
      }
    }
    // اگر selectedYear خالی باشد، هیچ فیلتری اعمال نمی‌شود و همه داده‌ها نمایش داده می‌شوند

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

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
            console.log("rrrrrrrrrrrrrrrr" , res);
            
          const parsedResponse = JSON.parse(res.errorText);
          const readableMessage = parsedResponse.message;
          toast.error(readableMessage || "خطا در دریافت گزارش مالی");
          return;
        }
        
        setData(res);
      } catch (error) {
        toast.error("خطا در دریافت گزارش مالی");
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialReport();
  }, [selectedYear, selectedMonth]);

  const handleClearFilters = () => {
    setSelectedYear(''); // حذف همه فیلترها
    setSelectedMonth('');
    setFilterSheetOpen(false);
  };

  const hasActiveFilters = () => {
    return selectedYear !== '' || selectedMonth !== '';
  };

  const FilterComponent = () => (
    <Box sx={{ padding: "16px" }}>
      <Box sx={{ marginBottom: "24px" }}>
        <Typography sx={{ color: "#000", fontSize: "14px", marginBottom: "12px", fontWeight: "600" }}>
          انتخاب سال:
        </Typography>
        <FormControl fullWidth>
          <InputLabel sx={{ color: "#000" }}>انتخاب سال</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value as number | '');
              setSelectedMonth(''); // پاک کردن انتخاب ماه هنگام تغییر سال
            }}
            label="انتخاب سال"
            sx={{
              backgroundColor: "var(--admin-surface)",
              borderRadius: "15px",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#e0e0e0",
              },
            }}
          >
            <MenuItem value="">همه</MenuItem>
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {formatNumber(year)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box>
        <Typography sx={{ color: "#000", fontSize: "14px", marginBottom: "12px", fontWeight: "600" }}>
          انتخاب ماه:
        </Typography>
        <Grid container spacing={1}>
          {monthNames.map((monthName, index) => {
            const monthNumber = index + 1;
            const isSelected = selectedMonth === monthNumber;
            const isDisabled = !selectedYear; // غیرفعال کردن ماه‌ها اگر سال انتخاب نشده باشد
            return (
              <Grid item xs={6} sm={4} key={monthNumber}>
                <Chip
                  label={monthName}
                  onClick={() => {
                    if (!isDisabled) {
                      if (isSelected) {
                        setSelectedMonth('');
                      } else {
                        setSelectedMonth(monthNumber);
                      }
                    }
                  }}
                  sx={{
                    width: "100%",
                    height: "45px",
                    fontSize: "14px",
                    fontWeight: isSelected ? "700" : "500",
                    backgroundColor: isSelected ? "var(--admin-accent)" : isDisabled ? "#f0f0f0" : "#f5f5f5",
                    color: isSelected ? "#fff" : isDisabled ? "var(--admin-text-secondary)" : "var(--admin-text)",
                    border: isSelected ? "2px solid var(--admin-accent)" : "1px solid #e0e0e0",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.6 : 1,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: isDisabled ? "#f0f0f0" : isSelected ? "#66a055" : "#e8f5e9",
                      transform: isDisabled ? "none" : "translateY(-2px)",
                      boxShadow: isDisabled ? "none" : "0 4px 8px rgba(0,0,0,0.1)",
                    },
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {hasActiveFilters() && (
        <Box sx={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={handleClearFilters}
            sx={{
              color: "var(--admin-error)",
              borderColor: "var(--admin-error)",
              "&:hover": {
                borderColor: "#ff6666",
                backgroundColor: "var(--admin-error-bg)"
              }
            }}
          >
            حذف فیلترها
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ width: "100%", direction: "rtl", minHeight: "100vh", background: "var(--admin-bg-gradient)" }}>
      <Box sx={{ padding: "16px", paddingBottom: "100px" }}>
        {/* Filter Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <Button
            variant="contained"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterSheetOpen(true)}
            sx={{
              backgroundColor: "var(--admin-accent)",
              color: "var(--admin-text)",
              borderRadius: "12px",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: "var(--admin-accent-hover)",
              },
            }}
          >
            فیلتر
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : data && data.data && data.data.length > 0 ? (
          <>
            {/* Monthly Reports Table */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "var(--admin-surface)",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(55, 84, 165, 0.3)",
                marginBottom: "24px",
                overflowX: "auto",
              }}
            >
              <Typography sx={{ fontSize: "20px", color: "var(--admin-text)", fontWeight: "700", marginBottom: "20px" }}>
                گزارش ماهانه
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                        ماه
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                        کل فروش
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                         سند فروش
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                        کل مبلغ خرید
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                         سند خرید
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                        سود ناخالص
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                         هزینه‌های جاری
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                         فاکتورها
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                         پرداخت فاکتور
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                         نسیه باز
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                        سود خالص
                      </TableCell>
                      <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                        موجودی حساب
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.data.map((report, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          "&:hover": {
                            backgroundColor: "var(--admin-surface-alt)",
                          },
                          "&:last-child td": {
                            borderBottom: "none",
                          },
                        }}
                      >
                        <TableCell sx={{ color: "var(--admin-text)", whiteSpace: "nowrap" }}>
                          {report.month_name} {report.year}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--admin-text)" }}>
                          {formatNumber(report.total_sales)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--admin-accent)" }}>
                          {formatNumber(report.total_manual_sales ?? 0)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--admin-text)" }}>
                          {formatNumber(report.total_purchases)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--admin-warning)" }}>
                          {formatNumber(report.total_manual_purchases ?? 0)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--admin-accent)", fontWeight: "600" }}>
                          {formatNumber(report.total_profit)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--admin-warning)" }}>
                          {formatNumber(report.total_expenses)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--admin-text)" }}>
                          {formatNumber(report.total_invoices)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--admin-text)" }}>
                          {formatNumber(report.invoice_cash_out ?? 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: (report.uncollected_debts ?? 0) > 0 ? "var(--admin-warning)" : "var(--admin-text)" }}>
                          {formatNumber(report.uncollected_debts ?? 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: report.net_profit >= 0 ? "var(--admin-accent)" : "var(--admin-error)", fontWeight: "600" }}>
                          {formatNumber(report.net_profit)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: report.account_balance >= 0 ? "var(--admin-online)" : "var(--admin-error)", fontWeight: "600" }}>
                          {formatNumber(report.account_balance)} 
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Totals Summary */}
            {data.totals && (
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: "var(--admin-surface)",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid rgba(55, 84, 165, 0.3)",
                }}
              >
                <Typography sx={{ fontSize: "20px", color: "var(--admin-text)", fontWeight: "700", marginBottom: "8px" }}>
                  مجموع کلی
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "var(--admin-text-secondary)", marginBottom: "20px", lineHeight: 1.8 }}>
                  سود از فروش و بهای کالا است. موجودی حساب نقد عملیاتی است و نسیه یا فاکتور پرداخت‌نشده را پول داخل صندوق حساب نمی‌کند.
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                          عنوان
                        </TableCell>
                        <TableCell align="right" sx={{ color: "var(--admin-text)", fontWeight: "600", borderBottom: "1px solid var(--admin-divider)", whiteSpace: "nowrap" }}>
                          مبلغ
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <SectionRow title="سود و زیان" />
                      <MoneyRow label="کل فروش" amount={data.totals.total_sales} hint="فروش تعهدی همین دوره؛ شامل نسیه وصول‌نشده هم هست" />
                      <MoneyRow label="سند فروش دستی" amount={data.totals.total_manual_sales ?? 0} color="var(--admin-accent)" />
                      <MoneyRow label="بهای تمام‌شده کالای فروش‌رفته" amount={data.totals.total_purchases} hint="این خرید از تأمین‌کننده نیست؛ هزینه کالایی است که فروخته شده" />
                      <MoneyRow label="سند خرید دستی" amount={data.totals.total_manual_purchases ?? 0} color="var(--admin-warning)" />
                      <MoneyRow label="سود ناخالص" amount={data.totals.total_profit} color="var(--admin-accent)" />
                      <MoneyRow label="هزینه‌های جاری" amount={data.totals.total_expenses} color="var(--admin-warning)" hint="مبلغ ثبت‌شده هزینه؛ ممکن است همه نقد پرداخت نشده باشد" />
                      <MoneyRow
                        label="پرداخت نقدی هزینه"
                        amount={data.totals.expense_cash_out ?? 0}
                        hint="پولی که واقعاً بابت هزینه از حساب رفته"
                      />
                      <MoneyRow
                        label="سود خالص"
                        amount={data.totals.total_net_profit}
                        color={data.totals.total_net_profit >= 0 ? "var(--admin-accent)" : "var(--admin-error)"}
                        strong
                      />

                      <SectionRow title="فاکتور خرید از تأمین‌کننده" />
                      <MoneyRow
                        label="فاکتور ثبت‌شده"
                        amount={data.totals.total_invoices}
                        hint="مبلغ فاکتور خرید؛ تا نقد پرداخت نشود از موجودی حساب کم نمی‌شود"
                      />
                      <MoneyRow
                        label="پرداخت نقدی فاکتور"
                        amount={data.totals.invoice_cash_out ?? 0}
                        hint="پولی که بابت فاکتور از حساب رفته"
                      />
                      <MoneyRow
                        label="مانده فاکتور پرداخت‌نشده"
                        amount={data.totals.invoice_unpaid ?? 0}
                        color={(data.totals.invoice_unpaid ?? 0) > 0 ? "var(--admin-warning)" : "var(--admin-text)"}
                        hint="فاکتور ثبت‌شده منهای پرداخت نقدی"
                      />

                      <SectionRow title="وصول فروش" />
                      <MoneyRow
                        label="وصول نقد و کارت"
                        amount={data.totals.cash_and_card_total ?? 0}
                        hint="پولی که سر فروش نقد/کارت گرفته شده"
                      />
                      <MoneyRow
                        label="نسیه وصول‌نشده"
                        amount={data.totals.uncollected_debts ?? 0}
                        color={(data.totals.uncollected_debts ?? 0) > 0 ? "var(--admin-warning)" : "var(--admin-text)"}
                        hint="فروش نسیه که هنوز تسویه نشده؛ داخل صندوق نیست"
                      />
                      <MoneyRow label="قسط وصول‌نشده" amount={data.totals.uncollected_installments ?? 0} />
                      <MoneyRow label="چک وصول‌نشده" amount={data.totals.open_cheques ?? 0} />
                      <MoneyRow
                        label="جمع وصول‌شده"
                        amount={data.totals.total_collected ?? 0}
                        hint="نقد/کارت + وصول نسیه و قسط و چک پاس‌شده"
                      />

                      <SectionRow title="نقد عملیاتی" />
                      <MoneyRow
                        label="موجودی حساب"
                        amount={data.totals.total_account_balance}
                        color={data.totals.total_account_balance >= 0 ? "var(--admin-online)" : "var(--admin-error)"}
                        strong
                        hint="فروش منهای نسیه و چک وصول‌نشده و پرداخت نقدی فاکتور و هزینه"
                      />
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "18px" }}>
              داده‌ای برای نمایش وجود ندارد
            </Typography>
          </Box>
        )}
      </Box>

      {/* Filter Bottom Sheet */}
      <BottomSheetModal 
        open={filterSheetOpen} 
        onClose={() => setFilterSheetOpen(false)}
      >
        <FilterComponent />
      </BottomSheetModal>

      <ToastContainer autoClose={3000} style={{ marginBottom: '76px', borderRadius: "15px" }} position={"bottom-right"} />
    </Box>
  );
}

