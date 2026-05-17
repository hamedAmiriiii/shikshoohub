"use client";
import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  CircularProgress,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import { apiRequestError } from '@/app/lib/apiRequestError';
import tokenCode from '@/app/coponent/tokenCode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import SmsIcon from '@mui/icons-material/Sms';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import BottomSheet from "@/app/coponent/BottomSheet";
import CloseIcon from '@mui/icons-material/Close';

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

interface ShopSmsLog {
  id: number;
  phone: string;
  message: string;
  purchase_id?: string;
  credit_amount?: string;
  sms_type: string;
  created_at: string;
  updated_at: string;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

const getSmsTypeLabel = (type: string) => {
  const types: { [key: string]: string } = {
    purchase: 'خرید',
    credit: 'اعتبار',
    warning: 'هشدار',
  };
  return types[type] || type;
};

const getSmsTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    purchase: '#78b568',
    credit: '#2196f3',
    warning: '#ff9100',
  };
  return colors[type] || '#999';
};

export default function ShopSmsLogsPage() {
  const [logs, setLogs] = useState<ShopSmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openFilterSheet, setOpenFilterSheet] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ShopSmsLog | null>(null);
  
  // Filter states
  const [filterMode, setFilterMode] = useState<'today' | 'week' | 'month' | 'year' | 'range' | null>(null);
  const [dateRange, setDateRange] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [smsTypeFilter, setSmsTypeFilter] = useState<string>("");
  const [searchField, setSearchField] = useState<'phone' | 'message' | 'purchase_id' | 'all'>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchLogs();
  }, [filterMode, dateRange, searchQuery, smsTypeFilter, currentPage, perPage]);

  const buildUrl = () => {
    let url = "/api/shop-sms-logs";
    const params: string[] = [];

    // Add pagination
    params.push(`per_page=${perPage}`);
    params.push(`page=${currentPage}`);

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

    // Add SMS type filter
    if (smsTypeFilter) {
      params.push(`sms_type=${smsTypeFilter}`);
    }

    // Add search filter
    if (searchQuery.trim()) {
      if (searchField === 'all') {
        // Simple search - just the query string
        params.push(`searchFilterModel=${encodeURIComponent(JSON.stringify(searchQuery))}`);
      } else {
        const searchFilter: any = {};
        searchFilter[searchField] = searchQuery;
        params.push(`searchFilterModel=${encodeURIComponent(JSON.stringify(searchFilter))}`);
      }
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = buildUrl();
      const token = tokenCode();
      const res = await apiRequestError("Get", {}, {}, url, true, true, token);
      
      if (res.hasError) {
        console.error("Error fetching SMS logs:", res.errorText);
        toast.error("خطا در دریافت لیست پیامک‌ها");
        setLogs([]);
      } else {
        // Handle paginated response
        if (res.data && Array.isArray(res.data)) {
          setLogs(res.data);
          setTotalPages(res.last_page || 1);
          setTotal(res.total || 0);
          setCurrentPage(res.current_page || 1);
        } else if (Array.isArray(res)) {
          setLogs(res);
        } else {
          setLogs([]);
        }
      }
    } catch (error) {
      console.error("Error fetching SMS logs:", error);
      toast.error("خطا در دریافت لیست پیامک‌ها");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (logId: number) => {
    try {
      const token = tokenCode();
      const res = await apiRequestError("Get", {}, {}, `/api/shop-sms-logs/${logId}`, true, true, token);
      
      if (res.hasError) {
        toast.error("خطا در دریافت جزئیات پیامک");
      } else {
        setSelectedLog(res);
        setOpenDetailDialog(true);
      }
    } catch (error) {
      console.error("Error fetching SMS log detail:", error);
      toast.error("خطا در دریافت جزئیات پیامک");
    }
  };

  const handleClearFilters = () => {
    setFilterMode(null);
    setDateRange([]);
    setSearchQuery("");
    setSmsTypeFilter("");
    setSearchField('all');
    setCurrentPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)",
      paddingTop: { xs: '12px', md: '24px' },
      paddingBottom: { xs: '100px', md: '40px' },
      direction: 'rtl'
    }}>
      <Container maxWidth={false} sx={{ paddingX: { xs: '16px', md: '24px' } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SmsIcon sx={{ color: '#78b568', fontSize: '32px' }} />
            {/* <Typography variant="h4" sx={{ color: '#fff', fontWeight: '600' }}>
              لیست پیامک‌های فروشگاه
            </Typography> */}
          </Box>
          <Button
            variant="contained"
            startIcon={<FilterListIcon />}
            onClick={() => setOpenFilterSheet(true)}
            sx={{
              backgroundColor: '#78b568',
              color: '#fff',
              '&:hover': { backgroundColor: '#5a9a4a' }
            }}
          >
            فیلتر
          </Button>
        </Box>

        {/* Summary */}
        {/* {!loading && (
          <Box sx={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card sx={{ backgroundColor: '#2b3143', border: '1px solid rgba(55, 84, 165, 0.3)' }}>
              <CardContent>
                <Typography sx={{ color: '#999', fontSize: '14px' }}>تعداد کل</Typography>
                <Typography sx={{ color: '#fff', fontSize: '24px', fontWeight: '600' }}>
                  {formatNumber(total)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )} */}

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ textAlign: 'center', padding: '40px' }}>
            <Typography sx={{ color: '#999', fontSize: '18px' }}>
              پیامکی یافت نشد
            </Typography>
          </Box>
        ) : isMobile ? (
          // Mobile Card View
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {logs.map((log) => (
              <Card 
                key={log.id} 
                sx={{ 
                  backgroundColor: '#2b3143', 
                  border: '1px solid rgba(55, 84, 165, 0.3)',
                  borderRadius: '12px'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <Box>
                      <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        {log.phone}
                      </Typography>
                      <Chip 
                        label={getSmsTypeLabel(log.sms_type)} 
                        size="small"
                        sx={{ 
                          backgroundColor: getSmsTypeColor(log.sms_type),
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                    </Box>
                    <IconButton 
                      onClick={() => handleViewDetail(log.id)}
                      sx={{ color: '#78b568' }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Box>
                  <Typography 
                    sx={{ 
                      color: '#ccc', 
                      fontSize: '14px', 
                      marginBottom: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {log.message}
                  </Typography>
                  <Typography sx={{ color: '#999', fontSize: '12px' }}>
                    {log.created_at}
                  </Typography>
                  {log.purchase_id && (
                    <Typography sx={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                      شناسه خرید: {log.purchase_id}
                    </Typography>
                  )}
                  {log.credit_amount && (
                    <Typography sx={{ color: '#78b568', fontSize: '14px', marginTop: '4px', fontWeight: '600' }}>
                      مبلغ اعتبار: {formatNumber(parseFloat(log.credit_amount))} تومان
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          // Desktop Table View
          <>
            <TableContainer 
              component={Paper} 
              sx={{ 
                backgroundColor: '#2b3143',
                borderRadius: '16px',
                border: '1px solid rgba(55, 84, 165, 0.3)',
                overflowX: 'auto'
              }}
            >
              <Table aria-label="SMS logs table">
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="right">شماره تلفن</StyledTableCell>
                    <StyledTableCell align="right">نوع پیامک</StyledTableCell>
                    <StyledTableCell align="right">پیام</StyledTableCell>
                    <StyledTableCell align="right">شناسه خرید</StyledTableCell>
                    <StyledTableCell align="right">مبلغ اعتبار</StyledTableCell>
                    <StyledTableCell align="right">تاریخ</StyledTableCell>
                    <StyledTableCell align="center">عملیات</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <StyledTableRow key={log.id}>
                      <StyledTableCell>{log.phone}</StyledTableCell>
                      <StyledTableCell>
                        <Chip 
                          label={getSmsTypeLabel(log.sms_type)} 
                          size="small"
                          sx={{ 
                            backgroundColor: getSmsTypeColor(log.sms_type),
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell sx={{ maxWidth: '400px' }}>
                        <Typography 
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {log.message}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>{log.purchase_id || '-'}</StyledTableCell>
                      <StyledTableCell>
                        {log.credit_amount ? formatNumber(parseFloat(log.credit_amount)) + ' تومان' : '-'}
                      </StyledTableCell>
                      <StyledTableCell>{log.created_at}</StyledTableCell>
                      <StyledTableCell align="center">
                        <IconButton 
                          onClick={() => handleViewDetail(log.id)}
                          sx={{ color: '#78b568' }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <Pagination 
                  count={totalPages} 
                  page={currentPage} 
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#fff',
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#78b568',
                      color: '#fff',
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}

        {/* Detail Dialog */}
        <Dialog
          open={openDetailDialog}
          onClose={() => setOpenDetailDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "#2b3143",
              borderRadius: "20px",
              border: "1px solid #505669",
            }
          }}
        >
          <DialogTitle sx={{ 
            color: "#fff", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            borderBottom: "1px solid #505669",
            paddingBottom: "16px"
          }}>
            <Typography sx={{ fontSize: "18px", fontWeight: "600" }}>
              جزئیات پیامک
            </Typography>
            <IconButton 
              onClick={() => setOpenDetailDialog(false)}
              sx={{ color: "#fff" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ paddingTop: "24px" }}>
            {selectedLog && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Box>
                  <Typography sx={{ color: '#999', fontSize: '14px', marginBottom: '4px' }}>شماره تلفن</Typography>
                  <Typography sx={{ color: '#fff', fontSize: '16px' }}>{selectedLog.phone}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#999', fontSize: '14px', marginBottom: '4px' }}>نوع پیامک</Typography>
                  <Chip 
                    label={getSmsTypeLabel(selectedLog.sms_type)} 
                    size="small"
                    sx={{ 
                      backgroundColor: getSmsTypeColor(selectedLog.sms_type),
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ color: '#999', fontSize: '14px', marginBottom: '4px' }}>پیام</Typography>
                  <Typography sx={{ color: '#fff', fontSize: '16px', whiteSpace: 'pre-wrap' }}>
                    {selectedLog.message}
                  </Typography>
                </Box>
                {selectedLog.purchase_id && (
                  <Box>
                    <Typography sx={{ color: '#999', fontSize: '14px', marginBottom: '4px' }}>شناسه خرید</Typography>
                    <Typography sx={{ color: '#fff', fontSize: '16px' }}>{selectedLog.purchase_id}</Typography>
                  </Box>
                )}
                {selectedLog.credit_amount && (
                  <Box>
                    <Typography sx={{ color: '#999', fontSize: '14px', marginBottom: '4px' }}>مبلغ اعتبار</Typography>
                    <Typography sx={{ color: '#78b568', fontSize: '18px', fontWeight: '600' }}>
                      {formatNumber(parseFloat(selectedLog.credit_amount))} تومان
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography sx={{ color: '#999', fontSize: '14px', marginBottom: '4px' }}>تاریخ ایجاد</Typography>
                  <Typography sx={{ color: '#fff', fontSize: '16px' }}>{selectedLog.created_at}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#999', fontSize: '14px', marginBottom: '4px' }}>تاریخ به‌روزرسانی</Typography>
                  <Typography sx={{ color: '#fff', fontSize: '16px' }}>{selectedLog.updated_at}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #505669' }}>
            <Button 
              onClick={() => setOpenDetailDialog(false)}
              sx={{ color: '#fff' }}
            >
              بستن
            </Button>
          </DialogActions>
        </Dialog>

        {/* Filter Bottom Sheet */}
        <BottomSheet
          open={openFilterSheet}
          onClose={() => setOpenFilterSheet(false)}
          title="فیلتر پیامک‌ها"
        >
          <Box sx={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Search */}
            <Box>
              <Typography sx={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>
                جستجو
              </Typography>
              <TextField
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو..."
                sx={{
                  backgroundColor: '#1a1d2e',
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: '#505669',
                    },
                    '&:hover fieldset': {
                      borderColor: '#78b568',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#78b568',
                    },
                  },
                }}
              />
              {/* <FormControl fullWidth sx={{ marginTop: '12px' }}>
                <InputLabel sx={{ color: '#999' }}>فیلد جستجو</InputLabel>
                <Select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value as any)}
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
                  <MenuItem value="all">همه فیلدها</MenuItem>
                  <MenuItem value="phone">شماره تلفن</MenuItem>
                  <MenuItem value="message">پیام</MenuItem>
                  <MenuItem value="purchase_id">شناسه خرید</MenuItem>
                </Select>
              </FormControl> */}
            </Box>

            {/* SMS Type Filter */}
            {/* <Box>
              <Typography sx={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>
                نوع پیامک
              </Typography>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#999' }}>نوع</InputLabel>
                <Select
                  value={smsTypeFilter}
                  onChange={(e) => setSmsTypeFilter(e.target.value)}
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
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="purchase">خرید</MenuItem>
                  <MenuItem value="credit">اعتبار</MenuItem>
                  <MenuItem value="warning">هشدار</MenuItem>
                </Select>
              </FormControl>
            </Box> */}

            {/* Date Filter */}
            <Box>
              <Typography sx={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>
                فیلتر تاریخ
              </Typography>
              <RadioGroup
                value={filterMode || ''}
                onChange={(e) => setFilterMode(e.target.value as any || null)}
              >
                <FormControlLabel 
                  value="today" 
                  control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />} 
                  label={<Typography sx={{ color: '#fff' }}>امروز</Typography>} 
                />
                <FormControlLabel 
                  value="week" 
                  control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />} 
                  label={<Typography sx={{ color: '#fff' }}>هفته جاری</Typography>} 
                />
                <FormControlLabel 
                  value="month" 
                  control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />} 
                  label={<Typography sx={{ color: '#fff' }}>ماه جاری</Typography>} 
                />
                <FormControlLabel 
                  value="year" 
                  control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />} 
                  label={<Typography sx={{ color: '#fff' }}>سال جاری</Typography>} 
                />
                <FormControlLabel 
                  value="range" 
                  control={<Radio sx={{ color: '#78b568', '&.Mui-checked': { color: '#78b568' } }} />} 
                  label={<Typography sx={{ color: '#fff' }}>بازه تاریخ</Typography>} 
                />
              </RadioGroup>
              {filterMode === 'range' && (
                <Box sx={{ marginTop: '12px' }}>
                  <DatePicker
                    value={dateRange}
                    onChange={setDateRange}
                    range
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    style={{
                      width: '100%',
                      backgroundColor: '#1a1d2e',
                      borderRadius: '8px',
                      padding: '8px',
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <Button
                onClick={handleClearFilters}
                variant="outlined"
                fullWidth
                sx={{
                  borderColor: '#505669',
                  color: '#fff',
                  '&:hover': {
                    borderColor: '#78b568',
                  },
                }}
              >
                پاک کردن فیلترها
              </Button>
              <Button
                onClick={() => {
                  setOpenFilterSheet(false);
                  setCurrentPage(1);
                }}
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: '#78b568',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#5a9a4a' }
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

