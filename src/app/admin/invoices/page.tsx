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
  CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import tokenCode from '@/app/coponent/tokenCode';
import { FetchWithJwtClient } from '@/app/coponent/fetchWithJwtClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import BottomSheet from "@/app/coponent/BottomSheet";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: "600",
    fontSize: "16px",
    padding: "16px 24px",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 16,
    padding: "16px 24px",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: "var(--admin-surface)",
  '&:nth-of-type(even)': {
    backgroundColor: "var(--admin-surface-alt)",
  },
  '&:hover': {
    backgroundColor: "var(--admin-menu-hover)",
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

interface Invoice {
  id: number;
  amount: number;
  title: string;
  description?: string;
  date: string;
  user_name: string;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

function getApiErrorMessage(res: any, fallback: string): string {
  if (!res) return fallback;
  if (typeof res.message === 'string') return res.message;
  if (typeof res.error === 'string') return res.error;
  if (typeof res.errorText === 'string') {
    try {
      const parsed = JSON.parse(res.errorText);
      if (typeof parsed.message === 'string') return parsed.message;
      if (typeof parsed.error === 'string') return parsed.error;
    } catch {
      if (res.errorText && res.errorText !== 'fetch failed') return res.errorText;
    }
  }
  return fallback;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openFilterSheet, setOpenFilterSheet] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  // Filter states
  const [filterMode, setFilterMode] = useState<'today' | 'week' | 'month' | 'year' | 'range' | null>(null);
  const [dateRange, setDateRange] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, [filterMode, dateRange, searchQuery]);

  const buildUrl = () => {
    let url = "/api/invoices";
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

    // Add search filter
    if (searchQuery.trim()) {
      const searchFilter = {
        title: searchQuery,
        description: searchQuery,
        user_name: searchQuery
      };
      params.push(`searchFilterModel=${encodeURIComponent(JSON.stringify(searchFilter))}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return url;
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const url = buildUrl();
      const token = tokenCode();
      if (!token) {
        toast.error('لطفاً وارد شوید');
        setInvoices([]);
        setTotalAmount(0);
        return;
      }

      const res = await FetchWithJwtClient('GET', url, token);
      
      if (!res || res.hasError) {
        console.error("Error fetching invoices:", res);
        toast.error(getApiErrorMessage(res, 'خطا در دریافت فاکتورها'));
        setInvoices([]);
        setTotalAmount(0);
      } else {
        // Handle response structure
        const data = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
        setInvoices(data);
        
        // Calculate total amount
        const total = data.reduce((sum: number, invoice: Invoice) => sum + (invoice.amount || 0), 0);
        setTotalAmount(total);
        
        // If API returns total_amount separately
        if (res.total_amount !== undefined) {
          setTotalAmount(res.total_amount);
        }
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("خطا در دریافت فاکتورها");
      setInvoices([]);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!title.trim() || !amount.trim()) {
      toast.error("لطفاً عنوان و مبلغ را وارد کنید");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("مبلغ باید یک عدد مثبت باشد");
      return;
    }

    try {
      const data = {
        amount: amountNum,
        title: title.trim(),
        description: description.trim() || undefined
      };

      const token = tokenCode();
      if (!token) {
        toast.error('لطفاً وارد شوید');
        return;
      }

      const res = await FetchWithJwtClient('POST', '/api/invoices', data);
      
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, 'خطا در ثبت فاکتور'));
      } else {
        toast.success("فاکتور با موفقیت ثبت شد");
        setOpenCreateDialog(false);
        resetForm();
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("خطا در ثبت فاکتور");
    }
  };

  const handleEditInvoice = async () => {
    if (!editingInvoice || !title.trim() || !amount.trim()) {
      toast.error("لطفاً عنوان و مبلغ را وارد کنید");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("مبلغ باید یک عدد مثبت باشد");
      return;
    }

    try {
      const data = {
        amount: amountNum,
        title: title.trim(),
        description: description.trim() || undefined
      };

      const token = tokenCode();
      if (!token) {
        toast.error('لطفاً وارد شوید');
        return;
      }

      const res = await FetchWithJwtClient('PUT', `/api/invoices/${editingInvoice.id}`, data);
      
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, 'خطا در ویرایش فاکتور'));
      } else {
        toast.success("فاکتور با موفقیت ویرایش شد");
        setOpenEditDialog(false);
        setEditingInvoice(null);
        resetForm();
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error editing invoice:", error);
      toast.error("خطا در ویرایش فاکتور");
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deletingInvoiceId) return;

    try {
      const token = tokenCode();
      if (!token) {
        toast.error('لطفاً وارد شوید');
        return;
      }

      const res = await FetchWithJwtClient('DELETE', `/api/invoices/${deletingInvoiceId}`, token);
      
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, 'خطا در حذف فاکتور'));
      } else {
        toast.success("فاکتور با موفقیت حذف شد");
        setOpenDeleteDialog(false);
        setDeletingInvoiceId(null);
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("خطا در حذف فاکتور");
    }
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setDescription("");
  };

  const openEditDialogHandler = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setTitle(invoice.title);
    setAmount(invoice.amount.toString());
    setDescription(invoice.description || "");
    setOpenEditDialog(true);
  };

  const openDeleteDialogHandler = (invoiceId: number) => {
    setDeletingInvoiceId(invoiceId);
    setOpenDeleteDialog(true);
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
    setSearchQuery("");
    setOpenFilterSheet(false);
  };

  const hasActiveFilters = () => {
    return filterMode !== null || dateRange.length > 0 || searchQuery.trim() !== "";
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: "var(--admin-bg-gradient)",
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
            <ReceiptIcon sx={{ 
              fontSize: { xs: '28px', md: '36px' }, 
              color: 'var(--admin-accent)' 
            }} />
            <Typography sx={{ 
              fontSize: { xs: '20px', md: '28px' }, 
              fontWeight: '700', 
              color: 'var(--admin-text)' 
            }}>
              فاکتورها
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setOpenCreateDialog(true);
              }}
              sx={{
                backgroundColor: 'var(--admin-accent)',
                color: 'var(--admin-text)',
                '&:hover': {
                  backgroundColor: 'var(--admin-accent-hover)',
                },
                borderRadius: '12px',
                padding: { xs: '8px 16px', md: '10px 24px' }
              }}
            >
              ثبت فاکتور
            </Button>
            
            <IconButton
              onClick={() => setOpenFilterSheet(true)}
              sx={{
                backgroundColor: hasActiveFilters() ? 'var(--admin-accent)' : 'var(--admin-surface)',
                color: 'var(--admin-text)',
                '&:hover': {
                  backgroundColor: hasActiveFilters() ? 'var(--admin-accent-hover)' : 'var(--admin-surface-alt)',
                }
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Total Amount Card */}
        {!loading && (
          <Card sx={{ 
            backgroundColor: 'var(--admin-surface)',
            borderRadius: '16px',
            border: '1px solid rgba(55, 84, 165, 0.3)',
            marginBottom: '24px',
            padding: { xs: '16px', md: '24px' }
          }}>
            <CardContent sx={{ padding: '0 !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: 'var(--admin-text-muted)', fontSize: { xs: '14px', md: '16px' } }}>
                  جمع کل مبالغ:
                </Typography>
                <Typography sx={{ 
                  color: 'var(--admin-accent)', 
                  fontSize: { xs: '20px', md: '24px' },
                  fontWeight: '700'
                }}>
                  {formatNumber(totalAmount)} تومان
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Invoices Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <CircularProgress sx={{ color: 'var(--admin-accent)' }} />
          </Box>
        ) : invoices.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            padding: { xs: '40px 20px', md: '60px 40px' },
            backgroundColor: 'var(--admin-surface)',
            borderRadius: '16px',
            border: '1px solid rgba(55, 84, 165, 0.3)'
          }}>
            <ReceiptIcon sx={{ 
              fontSize: { xs: '48px', md: '64px' }, 
              color: 'var(--admin-text-secondary)', 
              marginBottom: '16px' 
            }} />
            <Typography sx={{ 
              color: 'var(--admin-text-muted)', 
              fontSize: { xs: '16px', md: '20px' } 
            }}>
              فاکتوری یافت نشد
            </Typography>
          </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              backgroundColor: 'var(--admin-surface)',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)',
              overflowX: 'auto'
            }}
          >
            <Table aria-label="invoices table">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="right">عنوان</StyledTableCell>
                  <StyledTableCell align="right">مبلغ</StyledTableCell>
                  <StyledTableCell align="right">توضیحات</StyledTableCell>
                  <StyledTableCell align="right">تاریخ</StyledTableCell>
                  <StyledTableCell align="right">کاربر</StyledTableCell>
                  <StyledTableCell align="right">عملیات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <StyledTableRow key={invoice.id}>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: 'var(--admin-text)', fontWeight: '600' }}>
                        {invoice.title}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: 'var(--admin-accent)', fontWeight: '700' }}>
                        {formatNumber(invoice.amount)} تومان
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: 'var(--admin-text-muted)' }}>
                        {invoice.description || '-'}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: 'var(--admin-text-muted)' }}>
                        {invoice.date}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography sx={{ color: 'var(--admin-text-muted)' }}>
                        {invoice.user_name}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <IconButton
                          onClick={() => openEditDialogHandler(invoice)}
                          sx={{
                            color: 'var(--admin-accent)',
                            '&:hover': {
                              backgroundColor: 'var(--admin-menu-hover)',
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => openDeleteDialogHandler(invoice.id)}
                          sx={{
                            color: '#ff4444',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 68, 68, 0.1)',
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create Invoice Dialog */}
        <Dialog
          open={openCreateDialog}
          onClose={() => {
            setOpenCreateDialog(false);
            resetForm();
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: 'var(--admin-surface)',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'var(--admin-text)', fontWeight: '700' }}>
            ثبت فاکتور جدید
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <TextField
                label="عنوان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--admin-text)',
                    '& fieldset': {
                      borderColor: '#505669',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--admin-text-muted)',
                  },
                }}
              />
              <TextField
                label="مبلغ"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--admin-text)',
                    '& fieldset': {
                      borderColor: '#505669',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--admin-text-muted)',
                  },
                }}
              />
              <TextField
                label="توضیحات"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--admin-text)',
                    '& fieldset': {
                      borderColor: '#505669',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--admin-text-muted)',
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button
              onClick={() => {
                setOpenCreateDialog(false);
                resetForm();
              }}
              sx={{ color: 'var(--admin-text-muted)' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleCreateInvoice}
              variant="contained"
              sx={{
                backgroundColor: 'var(--admin-accent)',
                '&:hover': {
                  backgroundColor: 'var(--admin-accent-hover)',
                },
              }}
            >
              ثبت
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Invoice Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={() => {
            setOpenEditDialog(false);
            setEditingInvoice(null);
            resetForm();
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: 'var(--admin-surface)',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'var(--admin-text)', fontWeight: '700' }}>
            ویرایش فاکتور
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <TextField
                label="عنوان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--admin-text)',
                    '& fieldset': {
                      borderColor: '#505669',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--admin-text-muted)',
                  },
                }}
              />
              <TextField
                label="مبلغ"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--admin-text)',
                    '& fieldset': {
                      borderColor: '#505669',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--admin-text-muted)',
                  },
                }}
              />
              <TextField
                label="توضیحات"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--admin-text)',
                    '& fieldset': {
                      borderColor: '#505669',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--admin-accent)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--admin-text-muted)',
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button
              onClick={() => {
                setOpenEditDialog(false);
                setEditingInvoice(null);
                resetForm();
              }}
              sx={{ color: 'var(--admin-text-muted)' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleEditInvoice}
              variant="contained"
              sx={{
                backgroundColor: 'var(--admin-accent)',
                '&:hover': {
                  backgroundColor: 'var(--admin-accent-hover)',
                },
              }}
            >
              ذخیره
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => {
            setOpenDeleteDialog(false);
            setDeletingInvoiceId(null);
          }}
          PaperProps={{
            sx: {
              backgroundColor: 'var(--admin-surface)',
              borderRadius: '16px',
              border: '1px solid rgba(55, 84, 165, 0.3)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'var(--admin-text)', fontWeight: '700' }}>
            حذف فاکتور
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'var(--admin-text-muted)' }}>
              آیا از حذف این فاکتور اطمینان دارید؟
            </Typography>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button
              onClick={() => {
                setOpenDeleteDialog(false);
                setDeletingInvoiceId(null);
              }}
              sx={{ color: 'var(--admin-text-muted)' }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleDeleteInvoice}
              variant="contained"
              sx={{
                backgroundColor: '#ff4444',
                '&:hover': {
                  backgroundColor: '#cc0000',
                },
              }}
            >
              حذف
            </Button>
          </DialogActions>
        </Dialog>

        {/* Filter Bottom Sheet */}
        <BottomSheet
          open={openFilterSheet}
          title={
            <Typography sx={{ color: "var(--admin-text)", fontSize: "18px", fontWeight: "700" }}>
              فیلتر فاکتورها
            </Typography>
          }
          onClose={() => setOpenFilterSheet(false)}
        >
          <Box sx={{ padding: "16px" }}>
            {/* Search */}
            <TextField
              label="جستجو (عنوان، توضیح، کاربر)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              sx={{
                marginBottom: "16px",
                '& .MuiOutlinedInput-root': {
                  color: 'var(--admin-text)',
                  '& fieldset': {
                    borderColor: '#505669',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--admin-accent)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--admin-accent)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--admin-text-muted)',
                },
              }}
            />

            {/* Date Filter */}
            <Typography sx={{ color: "var(--admin-text)", marginBottom: "8px", fontSize: "14px" }}>
              فیلتر تاریخ:
            </Typography>
            <RadioGroup
              value={filterMode || 'all'}
              onChange={handleFilterChange}
              sx={{ marginBottom: "16px" }}
            >
              <FormControlLabel
                value="all"
                control={<Radio sx={{ color: 'var(--admin-accent)', '&.Mui-checked': { color: 'var(--admin-accent)' } }} />}
                label="همه"
                sx={{ color: "var(--admin-text)" }}
              />
              <FormControlLabel
                value="today"
                control={<Radio sx={{ color: 'var(--admin-accent)', '&.Mui-checked': { color: 'var(--admin-accent)' } }} />}
                label="امروز"
                sx={{ color: "var(--admin-text)" }}
              />
              <FormControlLabel
                value="week"
                control={<Radio sx={{ color: 'var(--admin-accent)', '&.Mui-checked': { color: 'var(--admin-accent)' } }} />}
                label="هفته جاری"
                sx={{ color: "var(--admin-text)" }}
              />
              <FormControlLabel
                value="month"
                control={<Radio sx={{ color: 'var(--admin-accent)', '&.Mui-checked': { color: 'var(--admin-accent)' } }} />}
                label="ماه جاری"
                sx={{ color: "var(--admin-text)" }}
              />
              <FormControlLabel
                value="year"
                control={<Radio sx={{ color: 'var(--admin-accent)', '&.Mui-checked': { color: 'var(--admin-accent)' } }} />}
                label="سال جاری"
                sx={{ color: "var(--admin-text)" }}
              />
              <FormControlLabel
                value="range"
                control={<Radio sx={{ color: 'var(--admin-accent)', '&.Mui-checked': { color: 'var(--admin-accent)' } }} />}
                label="بازه تاریخ"
                sx={{ color: "var(--admin-text)" }}
              />
            </RadioGroup>

            {/* Date Range Picker */}
            {filterMode === 'range' && (
              <Box sx={{ marginBottom: "16px" }}>
                <Typography sx={{ color: "var(--admin-text)", marginBottom: "8px", fontSize: "14px" }}>
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
                    backgroundColor: "var(--admin-surface-alt)",
                    borderRadius: "8px",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)"
                  }}
                />
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <Button
                onClick={handleClearFilters}
                variant="outlined"
                fullWidth
                sx={{
                  color: 'var(--admin-text)',
                  borderColor: '#505669',
                  '&:hover': {
                    borderColor: 'var(--admin-accent)',
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
                  backgroundColor: 'var(--admin-accent)',
                  '&:hover': {
                    backgroundColor: 'var(--admin-accent-hover)',
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

