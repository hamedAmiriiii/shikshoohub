"use client";
import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import { apiRequestError } from '@/app/lib/apiRequestError';
import tokenCode from '@/app/coponent/tokenCode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import BottomSheet from "@/app/coponent/BottomSheet";
import FilterListIcon from '@mui/icons-material/FilterList';
import IconButton from '@mui/material/IconButton';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#1a1d2e",
    color: "#fff",
    fontWeight: "600",
    fontSize: "16px",
    padding: "16px 24px",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "#fff",
    fontSize: 16,
    padding: "16px 24px",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: "#2b3143",
  '&:nth-of-type(even)': {
    backgroundColor: "#1a1d2e",
  },
  '&:hover': {
    backgroundColor: "rgba(120, 181, 104, 0.1)",
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

interface ManufacturerReport {
  id: number;
  name: string;
  total_quantity_sold: number;
  total_sales_amount: number;
  total_orders: number;
}

interface ReportSummary {
  total_manufacturers: number;
  total_sales_amount: number;
  total_quantity_sold: number;
  total_orders: number;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

export default function ManufacturerReportPage() {
  const [reports, setReports] = useState<ManufacturerReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFilterSheet, setOpenFilterSheet] = useState(false);
  
  // Filter states
  const [filterMode, setFilterMode] = useState<'today' | 'week' | 'month' | 'year' | 'range' | null>(null);
  const [dateRange, setDateRange] = useState<any>([]);
  const [orderBy, setOrderBy] = useState<'quantity' | 'amount'>('amount');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchReport();
  }, [filterMode, dateRange, orderBy, orderDirection]);

  const buildUrl = () => {
    let url = "/api/manufacturers/report/sales";
    const params: string[] = [];

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
    } else if (filterMode === 'today') {
      params.push("filter=today");
    } else if (filterMode === 'week') {
      params.push("filter=week");
    } else if (filterMode === 'month') {
      params.push("filter=month");
    } else if (filterMode === 'year') {
      params.push("filter=year");
    }

    // Add sorting
    params.push(`order_by=${orderBy}`);
    params.push(`order_direction=${orderDirection}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const url = buildUrl();
      const token = tokenCode();
      const res = await apiRequestError("Get", {}, {}, url, true, true, token);
      
      if (res.hasError) {
        console.error("Error fetching report:", res.errorText);
        toast.error("خطا در دریافت گزارش");
        setReports([]);
        setSummary(null);
      } else {
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        setReports(data);
        
        if (res.summary) {
          setSummary(res.summary);
        } else {
          // Calculate summary from data if not provided
          const calculatedSummary: ReportSummary = {
            total_manufacturers: data.length,
            total_sales_amount: data.reduce((sum: number, item: ManufacturerReport) => sum + (item.total_sales_amount || 0), 0),
            total_quantity_sold: data.reduce((sum: number, item: ManufacturerReport) => sum + (item.total_quantity_sold || 0), 0),
            total_orders: data.reduce((sum: number, item: ManufacturerReport) => sum + (item.total_orders || 0), 0),
          };
          setSummary(calculatedSummary);
        }
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("خطا در دریافت گزارش");
      setReports([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as 'today' | 'week' | 'month' | 'year' | 'range' | 'all';
    if (value === 'all') {
      setFilterMode(null);
      setDateRange([]);
    } else {
      setFilterMode(value);
      if (value !== 'range') {
        setDateRange([]);
      }
    }
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    if (dates.length === 2) {
      setFilterMode('range');
    }
  };

  const handleClearFilters = () => {
    setFilterMode(null);
    setDateRange([]);
    setOrderBy('amount');
    setOrderDirection('desc');
    setOpenFilterSheet(false);
  };

  const hasActiveFilters = () => {
    return filterMode !== null || dateRange.length > 0 || orderBy !== 'amount' || orderDirection !== 'desc';
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)",
      paddingTop: { xs: '12px', md: '24px' },
      paddingBottom: { xs: '100px', md: '40px' },
      direction: 'rtl'
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ 
          marginBottom: { xs: '16px', md: '24px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AssessmentIcon sx={{ 
              fontSize: { xs: '28px', md: '36px' }, 
              color: '#78b568' 
            }} />
            <Typography sx={{ 
              fontSize: { xs: '20px', md: '28px' }, 
              fontWeight: '700', 
              color: '#fff' 
            }}>
              گزارش فروش تولیدکنندگان
            </Typography>
          </Box>
          
          <IconButton
            onClick={() => setOpenFilterSheet(true)}
            sx={{
              backgroundColor: hasActiveFilters() ? '#78b568' : '#2b3143',
              color: '#fff',
              '&:hover': {
                backgroundColor: hasActiveFilters() ? '#5a9a4a' : '#1a1d2e',
              }
            }}
          >
            <FilterListIcon />
          </IconButton>
        </Box>

        {/* Summary Cards */}
        {!loading && summary && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '2fr', md: '4fr' },
            gap: '16px',
            marginBottom: '24px'
          }}>
            <Card sx={{ 
              backgroundColor: '#2b3143',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)',
              padding: { xs: '16px', md: '24px' }
            }}>
              <CardContent sx={{ padding: '0 !important' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '12px', md: '14px' }, marginBottom: '8px' }}>
                  تعداد تولیدکنندگان
                </Typography>
                <Typography sx={{ 
                  color: '#78b568', 
                  fontSize: { xs: '20px', md: '24px' },
                  fontWeight: '700'
                }}>
                  {formatNumber(summary.total_manufacturers)}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ 
              backgroundColor: '#2b3143',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)',
              padding: { xs: '16px', md: '24px' }
            }}>
              <CardContent sx={{ padding: '0 !important' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '12px', md: '14px' }, marginBottom: '8px' }}>
                  جمع کل فروش
                </Typography>
                <Typography sx={{ 
                  color: '#78b568', 
                  fontSize: { xs: '20px', md: '24px' },
                  fontWeight: '700'
                }}>
                  {formatNumber(summary.total_sales_amount)} تومان
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ 
              backgroundColor: '#2b3143',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)',
              padding: { xs: '16px', md: '24px' }
            }}>
              <CardContent sx={{ padding: '0 !important' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '12px', md: '14px' }, marginBottom: '8px' }}>
                  تعداد کل فروخته شده
                </Typography>
                <Typography sx={{ 
                  color: '#78b568', 
                  fontSize: { xs: '20px', md: '24px' },
                  fontWeight: '700'
                }}>
                  {formatNumber(summary.total_quantity_sold)}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ 
              backgroundColor: '#2b3143',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)',
              padding: { xs: '16px', md: '24px' }
            }}>
              <CardContent sx={{ padding: '0 !important' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '12px', md: '14px' }, marginBottom: '8px' }}>
                  تعداد سفارشات
                </Typography>
                <Typography sx={{ 
                  color: '#78b568', 
                  fontSize: { xs: '20px', md: '24px' },
                  fontWeight: '700'
                }}>
                  {formatNumber(summary.total_orders)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Reports Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <CircularProgress sx={{ color: '#78b568' }} />
          </Box>
        ) : reports.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            padding: { xs: '40px 20px', md: '60px 40px' },
            backgroundColor: '#2b3143',
            borderRadius: '16px',
            border: '1px solid rgba(55, 84, 165, 0.3)'
          }}>
            <AssessmentIcon sx={{ 
              fontSize: { xs: '48px', md: '64px' }, 
              color: 'rgba(255,255,255,0.3)', 
              marginBottom: '16px' 
            }} />
            <Typography sx={{ 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: { xs: '16px', md: '20px' } 
            }}>
              داده‌ای یافت نشد
            </Typography>
          </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              backgroundColor: '#2b3143',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)',
              overflowX: 'auto'
            }}
          >
            <Table aria-label="manufacturer report table">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="right">رتبه</StyledTableCell>
                  <StyledTableCell align="right">نام تولیدکننده</StyledTableCell>
                  <StyledTableCell align="right">تعداد فروخته شده</StyledTableCell>
                  <StyledTableCell align="right">مبلغ فروش</StyledTableCell>
                  <StyledTableCell align="right">تعداد سفارشات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report, index) => (
                  <StyledTableRow key={report.id}>
                    <StyledTableCell align="right">
                      <Chip 
                        label={`#${index + 1}`}
                        sx={{
                          backgroundColor: index < 3 ? '#78b568' : 'rgba(120, 181, 104, 0.3)',
                          color: '#fff',
                          fontWeight: '700',
                          fontSize: '14px'
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: '#fff', fontWeight: '600' }}>
                        {report.name}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: '#78b568', fontWeight: '700' }}>
                        {formatNumber(report.total_quantity_sold)}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: '#78b568', fontWeight: '700' }}>
                        {formatNumber(report.total_sales_amount)} 
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {formatNumber(report.total_orders)}
                      </Typography>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Filter Bottom Sheet */}
        <BottomSheet
          open={openFilterSheet}
          title={
            <Typography sx={{ color: "#fff", fontSize: "18px", fontWeight: "700" }}>
              فیلتر گزارش
            </Typography>
          }
          onClose={() => setOpenFilterSheet(false)}
        >
          <Box sx={{ padding: "16px" }}>
            {/* Date Filter */}
            <Typography sx={{ color: "#fff", marginBottom: "8px", fontSize: "14px" }}>
              فیلتر تاریخ:
            </Typography>
            <RadioGroup
              value={filterMode || 'all'}
              onChange={handleFilterChange}
              sx={{ marginBottom: "16px" }}
            >
              <FormControlLabel
                value="all"
                control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                label="همه"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="today"
                control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                label="امروز"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="week"
                control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                label="هفته جاری"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="month"
                control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                label="ماه جاری"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="year"
                control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                label="سال جاری"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="range"
                control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />}
                label="بازه تاریخ"
                sx={{ color: "#fff" }}
              />
            </RadioGroup>

            {/* Date Range Picker */}
            {filterMode === 'range' && (
              <Box sx={{ marginBottom: "16px" }}>
                <Typography sx={{ color: "#fff", marginBottom: "8px", fontSize: "14px" }}>
                  انتخاب بازه تاریخ:
                </Typography>
                <DatePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  range
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#1a1d2e",
                    borderRadius: "8px",
                    border: "1px solid #505669",
                    color: "#fff"
                  }}
                />
              </Box>
            )}

            {/* Sort Options */}
            <Box sx={{ marginBottom: "16px" }}>
              <Typography sx={{ color: "#fff", marginBottom: "8px", fontSize: "14px" }}>
                مرتب‌سازی بر اساس:
              </Typography>
              <FormControl fullWidth sx={{ marginBottom: "16px" }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>مرتب‌سازی</InputLabel>
                <Select
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value as 'quantity' | 'amount')}
                  label="مرتب‌سازی"
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#505669',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#78b568',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#78b568',
                    },
                  }}
                >
                  <MenuItem value="amount">مبلغ فروش</MenuItem>
                  <MenuItem value="quantity">تعداد فروخته شده</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>ترتیب</InputLabel>
                <Select
                  value={orderDirection}
                  onChange={(e) => setOrderDirection(e.target.value as 'asc' | 'desc')}
                  label="ترتیب"
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#505669',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#78b568',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#78b568',
                    },
                  }}
                >
                  <MenuItem value="desc">نزولی</MenuItem>
                  <MenuItem value="asc">صعودی</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <Button
                onClick={handleClearFilters}
                variant="outlined"
                fullWidth
                sx={{
                  color: '#fff',
                  borderColor: '#505669',
                  '&:hover': {
                    borderColor: '#78b568',
                  },
                }}
              >
                پاک کردن فیلترها
              </Button>
              <Button
                onClick={() => setOpenFilterSheet(false)}
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: '#78b568',
                  '&:hover': {
                    backgroundColor: '#5a9a4a',
                  },
                }}
              >
                اعمال فیلتر
              </Button>
            </Box>
          </Box>
        </BottomSheet>

        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}

