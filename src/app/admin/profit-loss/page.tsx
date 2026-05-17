"use client";
import { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem, FormControl, InputLabel, Chip, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiRequestError } from '@/app/lib/apiRequestError';
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
  total_profit: number;
  total_expenses: number;
  total_invoices: number;
  net_profit: number;
  account_balance: number;
}

interface FinancialReportResponse {
  data: MonthlyReport[];
  totals: {
    total_sales: number;
    total_purchases: number;
    total_profit: number;
    total_expenses: number;
    total_invoices: number;
    total_net_profit: number;
    total_account_balance: number;
  };
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

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
              backgroundColor: "#fff",
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
                    backgroundColor: isSelected ? "#78b568" : isDisabled ? "#f0f0f0" : "#f5f5f5",
                    color: isSelected ? "#fff" : isDisabled ? "#999" : "#333",
                    border: isSelected ? "2px solid #78b568" : "1px solid #e0e0e0",
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
              color: "#ff4444",
              borderColor: "#ff4444",
              "&:hover": {
                borderColor: "#ff6666",
                backgroundColor: "rgba(255, 68, 68, 0.1)"
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
    <Box sx={{ width: "100%", direction: "rtl", minHeight: "100vh", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
      <Box sx={{ padding: "16px", paddingBottom: "100px" }}>
        {/* Filter Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <Button
            variant="contained"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterSheetOpen(true)}
            sx={{
              backgroundColor: "#78b568",
              color: "#fff",
              borderRadius: "12px",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: "#5a9a4a",
              },
            }}
          >
            فیلتر
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <CircularProgress sx={{ color: "#78b568" }} />
          </Box>
        ) : data && data.data && data.data.length > 0 ? (
          <>
            {/* Monthly Reports Table */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "#2b3143",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(55, 84, 165, 0.3)",
                marginBottom: "24px",
                overflowX: "auto",
              }}
            >
              <Typography sx={{ fontSize: "20px", color: "#fff", fontWeight: "700", marginBottom: "20px" }}>
                گزارش ماهانه
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
                        ماه
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
                        کل فروش
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
                        کل مبلغ خرید
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
                        کل سود
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
                        کل هزینه‌های جاری
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
                        کل فاکتورها
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
                        خالص سود
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
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
                            backgroundColor: "rgba(255,255,255,0.05)",
                          },
                          "&:last-child td": {
                            borderBottom: "none",
                          },
                        }}
                      >
                        <TableCell sx={{ color: "#fff", whiteSpace: "nowrap" }}>
                          {report.month_name} {report.year}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#fff" }}>
                          {formatNumber(report.total_sales)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#fff" }}>
                          {formatNumber(report.total_purchases)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#78b568", fontWeight: "600" }}>
                          {formatNumber(report.total_profit)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#ff9800" }}>
                          {formatNumber(report.total_expenses)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#fff" }}>
                          {formatNumber(report.total_invoices)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: report.net_profit >= 0 ? "#78b568" : "#ff4444", fontWeight: "600" }}>
                          {formatNumber(report.net_profit)} 
                        </TableCell>
                        <TableCell align="right" sx={{ color: report.account_balance >= 0 ? "#2196f3" : "#ff4444", fontWeight: "600" }}>
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
                  backgroundColor: "#2b3143",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid rgba(55, 84, 165, 0.3)",
                }}
              >
                <Typography sx={{ fontSize: "20px", color: "#fff", fontWeight: "700", marginBottom: "20px" }}>
                  مجموع کلی
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
                          عنوان
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
                          مبلغ
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.05)",
                          },
                        }}
                      >
                        <TableCell sx={{ color: "#fff" }}>کل فروش</TableCell>
                        <TableCell align="right" sx={{ color: "#fff", fontWeight: "600" }}>
                          {formatNumber(data.totals.total_sales)} تومان
                        </TableCell>
                      </TableRow>
                      <TableRow
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.05)",
                          },
                        }}
                      >
                        <TableCell sx={{ color: "#fff" }}>کل مبلغ خرید</TableCell>
                        <TableCell align="right" sx={{ color: "#fff", fontWeight: "600" }}>
                          {formatNumber(data.totals.total_purchases)} تومان
                        </TableCell>
                      </TableRow>
                      <TableRow
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.05)",
                          },
                        }}
                      >
                        <TableCell sx={{ color: "#fff" }}>کل سود</TableCell>
                        <TableCell align="right" sx={{ color: "#78b568", fontWeight: "600" }}>
                          {formatNumber(data.totals.total_profit)} تومان
                        </TableCell>
                      </TableRow>
                      <TableRow
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.05)",
                          },
                        }}
                      >
                        <TableCell sx={{ color: "#fff" }}>کل هزینه‌های جاری</TableCell>
                        <TableCell align="right" sx={{ color: "#ff9800", fontWeight: "600" }}>
                          {formatNumber(data.totals.total_expenses)} تومان
                        </TableCell>
                      </TableRow>
                      <TableRow
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.05)",
                          },
                        }}
                      >
                        <TableCell sx={{ color: "#fff" }}>کل فاکتورها</TableCell>
                        <TableCell align="right" sx={{ color: "#fff", fontWeight: "600" }}>
                          {formatNumber(data.totals.total_invoices)} تومان
                        </TableCell>
                      </TableRow>
                      <TableRow
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.05)",
                          },
                        }}
                      >
                        <TableCell sx={{ color: "#fff" }}>خالص سود</TableCell>
                        <TableCell align="right" sx={{ color: data.totals.total_net_profit >= 0 ? "#78b568" : "#ff4444", fontWeight: "700", fontSize: "18px" }}>
                          {formatNumber(data.totals.total_net_profit)} تومان
                        </TableCell>
                      </TableRow>
                      <TableRow
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.05)",
                          },
                        }}
                      >
                        <TableCell sx={{ color: "#fff" }}>موجودی حساب</TableCell>
                        <TableCell align="right" sx={{ color: data.totals.total_account_balance >= 0 ? "#2196f3" : "#ff4444", fontWeight: "700", fontSize: "18px" }}>
                          {formatNumber(data.totals.total_account_balance)} تومان
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <Typography sx={{ color: "#fff", fontSize: "18px" }}>
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

