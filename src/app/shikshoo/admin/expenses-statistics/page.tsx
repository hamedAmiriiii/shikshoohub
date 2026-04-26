"use client";
import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, RadioGroup, FormControlLabel, Radio, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiRequestError } from '@/app/lib/apiRequestError';
import tokenCode from '@/app/coponent/tokenCode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import BottomSheetModal from "@/app/coponent/BottomSheetModal";

interface ExpensesByUser {
  user_name: string;
  total_current: number;
  total_capital: number;
  total: number;
}

interface ExpensesStatisticsData {
  total_expenses: number;
  total_current_expenses: number;
  total_capital_expenses: number;
  expenses_by_user: ExpensesByUser[];
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

export default function ExpensesStatisticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExpensesStatisticsData | null>(null);
  const [expenseType, setExpenseType] = useState<'all' | 'جاری' | 'سرمایه'>('all');
  const [filterMode, setFilterMode] = useState<'today' | 'week' | 'month' | 'range'>('month');
  const [dateRange, setDateRange] = useState<any>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const buildUrl = () => {
    let url = "/api/expenses-statistics"
    const params: string[] = [];

    // Add expense type filter
    if (expenseType !== 'all') {
      params.push(`type=${encodeURIComponent(expenseType)}`);
    }

    // Add time filter
    if (filterMode === 'range' && dateRange.length === 2) {
      const from_date = {
        year: dateRange[0].year,
        month: dateRange[0].month.number,
        day: dateRange[0].day,
      };
      const to_date = {
        year: dateRange[1].year,
        month: dateRange[1].month.number,
        day: dateRange[1].day,
      };
      const fromDateStr = encodeURIComponent(JSON.stringify(from_date));
      const toDateStr = encodeURIComponent(JSON.stringify(to_date));
      params.push(`filter=range&from_date=${fromDateStr}&to_date=${toDateStr}`);
    } else {
      params.push(`filter=${filterMode}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  };

  useEffect(() => {
    const fetchExpensesStatistics = async () => {
      setLoading(true);
      const token = tokenCode();
      try {
        const url = buildUrl();
        const res = await apiRequestError("Get", {}, {}, url, true, true, token);
        if (res.hasError) {
          const parsedResponse = JSON.parse(res.errorText);
          const readableMessage = parsedResponse.message;
          toast.error(readableMessage || "خطا در دریافت گزارش هزینه‌ها");
          return;
        }
        
        setData(res);
      } catch (error) {
        toast.error("خطا در دریافت گزارش هزینه‌ها");
      } finally {
        setLoading(false);
      }
    };

    fetchExpensesStatistics();
  }, [expenseType, filterMode, dateRange]);

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    if (dates.length === 2) {
      setFilterMode('range');
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as 'today' | 'week' | 'month';
    setFilterMode(value);
    setDateRange([]);
  };

  const handleExpenseTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExpenseType(event.target.value as 'all' | 'جاری' | 'سرمایه');
  };

  const handleClearFilters = () => {
    setDateRange([]);
    setFilterMode('month');
    setExpenseType('all');
    setFilterSheetOpen(false);
  };

  const hasActiveFilters = () => {
    return expenseType !== 'all' || filterMode !== 'month' || dateRange.length > 0;
  };

  const FilterComponent = () => (
    <Box sx={{ padding: "16px" }}>
      {/* Expense Type Filter */}
      <Box sx={{ marginBottom: "16px" }}>
        <Typography sx={{ color: "#000", marginBottom: "8px", fontSize: "14px" }}>
          نوع هزینه:
        </Typography>
        <RadioGroup
          row
          value={expenseType}
          onChange={handleExpenseTypeChange}
          sx={{ 
            justifyContent: 'space-around',
            '& .MuiFormControlLabel-root': {
              margin: 0,
            }
          }}
        >
          <FormControlLabel 
            value="all" 
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />} 
            label="همه" 
            sx={{ color: "#000" }}
          />
          <FormControlLabel 
            value="جاری" 
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />} 
            label="جاری" 
            sx={{ color: "#000" }}
          />
          <FormControlLabel 
            value="سرمایه" 
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />} 
            label="سرمایه" 
            sx={{ color: "#000" }}
          />
        </RadioGroup>
      </Box>

      {/* Date Range Picker */}
      <Box sx={{ marginBottom: "16px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <Typography sx={{ color: "#000", fontSize: "14px" }}>
            فیلتر بر اساس تاریخ (از - تا):
          </Typography>
        </Box>
        <DatePicker
          range
          value={dateRange}
          onChange={handleDateRangeChange}
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-center"
          style={{ 
            height: "50px", 
            borderRadius: "15px", 
            backgroundColor: "#fff",
            width: "100%"
          }}
          className="rmdp-mobile"
          placeholder="انتخاب بازه تاریخ"
        />
      </Box>

      {/* Time Filter Radio Buttons */}
      <Box sx={{ marginTop: "16px" }}>
        <Typography sx={{ color: "#000", marginBottom: "8px", fontSize: "14px" }}>
          فیلتر زمانی:
        </Typography>
        <RadioGroup
          row
          value={filterMode === 'range' ? 'month' : filterMode}
          onChange={handleFilterChange}
          sx={{ 
            justifyContent: 'space-around',
            '& .MuiFormControlLabel-root': {
              margin: 0,
            }
          }}
        >
          <FormControlLabel 
            value="today" 
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />} 
            label="روزانه" 
            sx={{ color: "#000" }}
            disabled={dateRange.length === 2}
          />
          <FormControlLabel 
            value="week" 
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />} 
            label="هفتگی" 
            sx={{ color: "#000" }}
            disabled={dateRange.length === 2}
          />
          <FormControlLabel 
            value="month" 
            control={<Radio sx={{ color: '#1f9ad1', '&.Mui-checked': { color: '#1f9ad1' } }} />} 
            label="ماهانه" 
            sx={{ color: "#000" }}
            disabled={dateRange.length === 2}
          />
        </RadioGroup>
      </Box>

      {/* Clear Filters Button */}
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

  const StatCard = ({ title, value, icon, gradient }: { title: string; value: number; icon: React.ReactNode; gradient: string }) => (
    <Paper
      elevation={0}
      sx={{
        padding: "24px",
        background: gradient,
        borderRadius: "16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 14px 28px rgba(0,0,0,0.3)",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: "100px",
          height: "100px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          transform: "translate(30px, -30px)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "80px",
          height: "80px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          transform: "translate(-20px, 20px)",
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <Typography sx={{ color: "#fff", fontSize: "16px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
            {title}
          </Typography>
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "10px",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography sx={{ color: "#fff", fontSize: "32px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.2)", marginBottom: "4px" }}>
          {formatNumber(value)}
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
          تومان
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ width: "100%", direction: "rtl", padding: "16px", paddingBottom: "100px", minHeight: "100vh", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
     

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress sx={{ color: "#78b568" }} />
        </Box>
      ) : data ? (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ marginBottom: "32px" }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="کل هزینه‌ها"
                value={data.total_expenses}
                icon={<AttachMoneyIcon sx={{ color: "#fff", fontSize: "24px" }} />}
                gradient="linear-gradient(135deg, #78b568 0%, #5a9a4a 100%)"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="هزینه‌های جاری"
                value={data.total_current_expenses}
                icon={<AccountBalanceWalletIcon sx={{ color: "#fff", fontSize: "24px" }} />}
                gradient="linear-gradient(135deg, #ff9100 0%, #e68100 100%)"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="هزینه‌های سرمایه"
                value={data.total_capital_expenses}
                icon={<BusinessIcon sx={{ color: "#fff", fontSize: "24px" }} />}
                gradient="linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)"
              />
            </Grid>
          </Grid>

          {/* Users Table */}
          {data.expenses_by_user && data.expenses_by_user.length > 0 && (
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
                تفکیک هزینه‌ها بر اساس کاربر
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        نام کاربر
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        هزینه‌های جاری
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        هزینه‌های سرمایه
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff", fontWeight: "600", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        مجموع
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.expenses_by_user.map((user, index) => (
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
                        <TableCell sx={{ color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                          <PersonIcon sx={{ fontSize: "20px", color: "#78b568" }} />
                          {user.user_name}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#fff" }}>
                          {formatNumber(user.total_current)} تومان
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#fff" }}>
                          {formatNumber(user.total_capital)} تومان
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#78b568", fontWeight: "600" }}>
                          {formatNumber(user.total)} تومان
                        </TableCell>
                      </TableRow>
                    ))}
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

