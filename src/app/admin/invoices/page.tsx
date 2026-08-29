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
  Pagination,
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
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BeneficiarySelect from '@/app/admin/BeneficiarySelect';
import DocumentPaymentFields from '@/app/admin/DocumentPaymentFields';
import { DocumentPaymentChips, documentNeedsSettle } from '@/app/admin/DocumentPaymentBadge';
import DocumentPaymentSettleDialog from '@/app/admin/DocumentPaymentSettleDialog';
import InvoiceDetailsDialog, { invoiceUsesItemAmount, type InvoiceRecord } from '@/app/admin/invoices/InvoiceDetailsDialog';
import InvoiceImageDialog, { getInvoiceImageUrl } from '@/app/admin/invoices/InvoiceImageDialog';
import { beneficiaryFromRecord, beneficiaryPayload, formatBeneficiaryLabel, type Beneficiary } from '@/app/lib/beneficiaries';
import {
  buildDocumentPaymentPayload,
  documentCreditRemaining,
  emptyDocumentPaymentForm,
  formFromDocumentPayment,
  type DocumentPaymentFormState,
} from '@/app/lib/documentPayments';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import BottomSheet from "@/app/coponent/BottomSheet";
import { dateObjectToPayload, todayJalaliDateObject } from "@/app/lib/cheques";
import { CHEQUE_DATE_PICKER_Z, chequeDatePickerBoxSx } from "@/app/admin/cheques/ChequeFormSheet";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: "600",
    fontSize: "12px",
    padding: "8px 10px",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 12,
    padding: "7px 10px",
    textAlign: "center",
    "& .MuiTypography-root": { fontSize: 12 },
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

type Invoice = InvoiceRecord;

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

function parseAmountInput(value: string): number {
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/٬/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\s/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

function formatAmountInput(value: string): string {
  const digitsOnly = String(value ?? "").replace(/[^\d۰-۹٠-٩]/g, "");
  if (!digitsOnly) return "";
  const num = parseAmountInput(digitsOnly);
  if (!Number.isFinite(num)) return "";
  return formatNumber(num);
}

const compactFieldSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--admin-text)',
    fontSize: 13,
    direction: 'rtl',
    '& fieldset': { borderColor: 'var(--admin-border)' },
    '&:hover fieldset': { borderColor: 'var(--admin-accent)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--admin-accent)' },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--admin-text-muted)',
    fontSize: 13,
    right: 14,
    left: 'auto',
    transformOrigin: 'top right',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(-14px, -9px) scale(0.75)',
  },
  '& .MuiInputBase-input': {
    py: '8px',
    fontSize: 13,
    textAlign: 'right',
    direction: 'rtl',
  },
} as const;

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
  const [detailsInvoice, setDetailsInvoice] = useState<Invoice | null>(null);
  const [imageInvoice, setImageInvoice] = useState<Invoice | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentForm, setPaymentForm] = useState<DocumentPaymentFormState>(emptyDocumentPaymentForm);
  const [settleInvoice, setSettleInvoice] = useState<Invoice | null>(null);
  const [beneficiaryId, setBeneficiaryId] = useState<number | "">("");
  const [beneficiaryOption, setBeneficiaryOption] = useState<Beneficiary | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<DateObject | null>(() => todayJalaliDateObject());
  
  // Filter states
  const [filterMode, setFilterMode] = useState<'today' | 'week' | 'month' | 'year' | 'range' | null>(null);
  const [dateRange, setDateRange] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBeneficiaryId, setFilterBeneficiaryId] = useState<number | "">("");
  const [filterBeneficiaryOption, setFilterBeneficiaryOption] = useState<Beneficiary | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, [filterMode, dateRange, searchQuery, currentPage, perPage, filterBeneficiaryId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = Number(new URLSearchParams(window.location.search).get("beneficiary_id"));
    if (Number.isFinite(id) && id > 0) setFilterBeneficiaryId(id);
  }, []);

  const buildUrl = () => {
    let url = "/api/invoices";
    const params: string[] = [];

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

    // Add search filter
    if (searchQuery.trim()) {
      const searchFilter = {
        title: searchQuery,
        description: searchQuery,
        user_name: searchQuery
      };
      params.push(`searchFilterModel=${encodeURIComponent(JSON.stringify(searchFilter))}`);
    }

    if (filterBeneficiaryId !== "") {
      params.push(`beneficiary_id=${filterBeneficiaryId}`);
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
      } else if (res.data && Array.isArray(res.data)) {
        setInvoices(res.data);
        setTotalPages(res.last_page || 1);
        setTotalCount(res.total || res.data.length);
        if (res.current_page) {
          setCurrentPage(res.current_page);
        }
        if (res.total_amount !== undefined) {
          setTotalAmount(res.total_amount);
        } else {
          const pageTotal = res.data.reduce(
            (sum: number, invoice: Invoice) => sum + (invoice.amount || 0),
            0
          );
          setTotalAmount(pageTotal);
        }
      } else {
        const data = Array.isArray(res) ? res : [];
        setInvoices(data);
        setTotalPages(1);
        setTotalCount(data.length);
        const total = data.reduce((sum: number, invoice: Invoice) => sum + (invoice.amount || 0), 0);
        setTotalAmount(total);
        if (!Array.isArray(res) && res.total_amount !== undefined) {
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

    const amountNum = parseAmountInput(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("مبلغ باید یک عدد مثبت باشد");
      return;
    }

    try {
      const data: Record<string, unknown> = {
        amount: amountNum,
        title: title.trim(),
        description: description.trim() || undefined
      };
      const date = dateObjectToPayload(invoiceDate) ?? dateObjectToPayload(todayJalaliDateObject());
      if (date) {
        data.invoice_date = date;
        data.date = `${date.year}/${String(date.month).padStart(2, "0")}/${String(date.day).padStart(2, "0")}`;
      }
      Object.assign(data, beneficiaryPayload(beneficiaryId));

      const payment = buildDocumentPaymentPayload(paymentForm, amountNum);
      if (payment.error) {
        toast.error(payment.error);
        return;
      }
      Object.assign(data, payment.payload);

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
    if (!editingInvoice || !title.trim()) {
      toast.error("لطفاً عنوان را وارد کنید");
      return;
    }

    const usesItemAmount = invoiceUsesItemAmount(editingInvoice);
    const amountNum = parseAmountInput(amount);
    if (!usesItemAmount && (isNaN(amountNum) || amountNum <= 0)) {
      toast.error("مبلغ باید یک عدد مثبت باشد");
      return;
    }

    try {
      const data: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        ...beneficiaryPayload(beneficiaryId),
      };
      if (!usesItemAmount) {
        data.amount = amountNum;
      }
      const paymentTotal = usesItemAmount ? Number(editingInvoice.amount) || 0 : amountNum;
      const payment = buildDocumentPaymentPayload(paymentForm, paymentTotal);
      if (payment.error) {
        toast.error(payment.error);
        return;
      }
      Object.assign(data, payment.payload);

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
    setPaymentForm(emptyDocumentPaymentForm());
    setBeneficiaryId("");
    setBeneficiaryOption(null);
    setInvoiceDate(todayJalaliDateObject());
  };

  const openEditDialogHandler = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setTitle(invoice.title);
    setAmount(formatNumber(invoice.amount));
    setDescription(invoice.description || "");
    setPaymentForm(formFromDocumentPayment(invoice));
    const beneficiary = beneficiaryFromRecord(invoice);
    setBeneficiaryId(beneficiary?.id ?? "");
    setBeneficiaryOption(beneficiary);
    setOpenEditDialog(true);
  };

  const openDeleteDialogHandler = (invoiceId: number) => {
    setDeletingInvoiceId(invoiceId);
    setOpenDeleteDialog(true);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as 'today' | 'week' | 'month' | 'year' | 'range' | 'all';
    setCurrentPage(1);
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
      setCurrentPage(1);
    }
  };

  const handleClearFilters = () => {
    setFilterMode(null);
    setDateRange([]);
    setSearchQuery("");
    setFilterBeneficiaryId("");
    setFilterBeneficiaryOption(null);
    setCurrentPage(1);
    setOpenFilterSheet(false);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = () => {
    return filterMode !== null || dateRange.length > 0 || searchQuery.trim() !== "" || filterBeneficiaryId !== "";
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: "var(--admin-bg-gradient)",
      paddingTop: { xs: '10px', md: '16px' },
      paddingBottom: { xs: '100px', md: '32px' },
      direction: 'rtl'
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.25, md: 2 } }}>
        {/* Header */}
        <Box sx={{ 
          marginBottom: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ReceiptIcon sx={{ 
              fontSize: 20, 
              color: 'var(--admin-accent)' 
            }} />
            <Typography sx={{ 
              fontSize: 16, 
              fontWeight: '700', 
              color: 'var(--admin-text)' 
            }}>
              فاکتورها
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
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
                borderRadius: '8px',
                fontSize: 12,
                py: 0.5,
                px: 1.25,
                gap: '6px',
                '& .MuiButton-startIcon': { margin: 0 },
              }}
            >
              ثبت فاکتور
            </Button>
            
            <IconButton
              size="small"
              onClick={() => setOpenFilterSheet(true)}
              sx={{
                backgroundColor: hasActiveFilters() ? 'var(--admin-accent)' : 'var(--admin-surface)',
                color: 'var(--admin-text)',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: hasActiveFilters() ? 'var(--admin-accent-hover)' : 'var(--admin-surface-alt)',
                }
              }}
            >
              <FilterListIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Total Amount Card */}
        {!loading && (
          <Card sx={{ 
            backgroundColor: 'var(--admin-surface)',
            borderRadius: '10px',
            border: '1px solid var(--admin-border)',
            marginBottom: 1.5,
            boxShadow: 'none',
          }}>
            <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                  جمع کل
                </Typography>
                <Typography sx={{ 
                  color: 'var(--admin-accent)', 
                  fontSize: 14,
                  fontWeight: '700'
                }}>
                  {formatNumber(totalAmount)} تومان
                </Typography>
              </Box>
              {totalCount > 0 && (
                <Typography sx={{ color: 'var(--admin-text-muted)', fontSize: 11, mt: 0.25 }}>
                  {formatNumber(totalCount)} مورد
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invoices Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            <CircularProgress size={28} sx={{ color: 'var(--admin-accent)' }} />
          </Box>
        ) : invoices.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 5,
            backgroundColor: 'var(--admin-surface)',
            borderRadius: '10px',
            border: '1px solid var(--admin-border)'
          }}>
            <ReceiptIcon sx={{ 
              fontSize: 36, 
              color: 'var(--admin-text-secondary)', 
              mb: 1 
            }} />
            <Typography sx={{ 
              color: 'var(--admin-text-muted)', 
              fontSize: 13 
            }}>
              فاکتوری یافت نشد
            </Typography>
          </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              backgroundColor: 'var(--admin-surface)',
              borderRadius: '10px',
              border: '1px solid var(--admin-border)',
              boxShadow: 'none',
              overflowX: 'auto'
            }}
          >
            <Table size="small" aria-label="invoices table">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center">ردیف</StyledTableCell>
                  <StyledTableCell align="center">عنوان</StyledTableCell>
                  <StyledTableCell align="center">مبلغ</StyledTableCell>
                  <StyledTableCell align="center">پرداخت</StyledTableCell>
                  <StyledTableCell align="center">توضیحات</StyledTableCell>
                  <StyledTableCell align="center">تاریخ</StyledTableCell>
                  <StyledTableCell align="center">ذینفع</StyledTableCell>
                  <StyledTableCell align="center">کاربر</StyledTableCell>
                  <StyledTableCell align="center">عملیات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice, index) => (
                  <StyledTableRow key={invoice.id}>
                    <StyledTableCell align="center">
                      {(currentPage - 1) * perPage + index + 1}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography sx={{ color: 'var(--admin-text)', fontWeight: '600' }}>
                        {invoice.title}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography sx={{ color: 'var(--admin-accent)', fontWeight: '700' }}>
                        {formatNumber(invoice.amount)} تومان
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <DocumentPaymentChips doc={invoice} />
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography sx={{ color: 'var(--admin-text-muted)' }}>
                        {invoice.description || '-'}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography sx={{ color: 'var(--admin-text-muted)' }}>
                        {invoice.date}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {(() => {
                        const beneficiary = beneficiaryFromRecord(invoice);
                        if (!beneficiary) {
                          return <Typography sx={{ color: 'var(--admin-text-muted)' }}>—</Typography>;
                        }
                        return (
                          <Typography
                            component={Link}
                            href={`/admin/beneficiaries/${beneficiary.id}`}
                            sx={{ color: 'var(--admin-accent)', textDecoration: 'none', fontSize: 12 }}
                          >
                            {formatBeneficiaryLabel(beneficiary)}
                          </Typography>
                        );
                      })()}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Typography sx={{ color: 'var(--admin-text-muted)' }}>
                        {invoice.user_name}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <Box sx={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setDetailsInvoice(invoice)}
                          sx={{
                            color: 'var(--admin-text)',
                            borderColor: 'var(--admin-border)',
                            borderRadius: '6px',
                            fontSize: 11,
                            py: 0,
                            minHeight: 26,
                            px: 1,
                            '&:hover': {
                              borderColor: 'var(--admin-accent)',
                              backgroundColor: 'var(--admin-menu-hover)',
                            },
                          }}
                        >
                          جزئیات
                        </Button>
                        {documentNeedsSettle(invoice) ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setSettleInvoice(invoice)}
                            sx={{
                              color: 'var(--admin-accent)',
                              borderColor: 'var(--admin-accent-border)',
                              borderRadius: '6px',
                              fontSize: 11,
                              py: 0,
                              minHeight: 26,
                              px: 1,
                            }}
                          >
                            تسویه
                          </Button>
                        ) : null}
                        <IconButton
                          size="small"
                          title="عکس فاکتور"
                          onClick={() => setImageInvoice(invoice)}
                          sx={{
                            color: getInvoiceImageUrl(invoice) ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                            '&:hover': {
                              backgroundColor: 'var(--admin-menu-hover)',
                            }
                          }}
                        >
                          <PhotoCameraIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialogHandler(invoice)}
                          sx={{
                            color: 'var(--admin-accent)',
                            '&:hover': {
                              backgroundColor: 'var(--admin-menu-hover)',
                            }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openDeleteDialogHandler(invoice.id)}
                          sx={{
                            color: '#ff4444',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 68, 68, 0.1)',
                            }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && invoices.length > 0 && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 1.5 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="small"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: 'var(--admin-text)',
                  fontSize: 12,
                },
                '& .Mui-selected': {
                  backgroundColor: 'var(--admin-accent)',
                  color: 'var(--admin-text)',
                },
              }}
            />
          </Box>
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
              borderRadius: '12px',
              border: '1px solid var(--admin-border)',
              direction: 'rtl',
            }
          }}
        >
          <DialogTitle sx={{ color: 'var(--admin-text)', fontWeight: 700, fontSize: 14, py: 1, px: 2 }}>
            ثبت فاکتور جدید
          </DialogTitle>
          <DialogContent sx={{ px: 2, pb: 1, pt: '8px !important' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                alignItems: 'start',
              }}
            >
              <TextField
                size="small"
                label="عنوان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                sx={compactFieldSx}
              />
              <Box
                sx={{
                  ...chequeDatePickerBoxSx,
                  '& .rmdp-input': {
                    ...chequeDatePickerBoxSx['& .rmdp-input'],
                    textAlign: 'right',
                    direction: 'rtl',
                  },
                }}
              >
                <DatePicker
                  value={invoiceDate}
                  onChange={(d) =>
                    setInvoiceDate(d && !Array.isArray(d) ? (d as DateObject) : null)
                  }
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  zIndex={CHEQUE_DATE_PICKER_Z}
                  portal
                  placeholder="تاریخ"
                  className="rmdp-mobile"
                  containerStyle={{ width: '100%' }}
                  style={{ width: '100%', height: 40, borderRadius: 8, textAlign: 'right', direction: 'rtl' }}
                />
              </Box>
              <TextField
                size="small"
                label="مبلغ"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                required
                sx={compactFieldSx}
              />
              <BeneficiarySelect
                value={beneficiaryId}
                initialOption={beneficiaryOption}
                onChange={(id, option) => {
                  setBeneficiaryId(id);
                  setBeneficiaryOption(option);
                }}
                helperText=""
              />
              <DocumentPaymentFields
                value={paymentForm}
                onChange={setPaymentForm}
                totalAmount={parseAmountInput(amount) || 0}
              />
              <TextField
                size="small"
                label="توضیحات"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                minRows={2}
                sx={compactFieldSx}
              />
              <Typography
                sx={{
                  color: 'var(--admin-text-muted)',
                  fontSize: 11,
                  lineHeight: 1.5,
                  gridColumn: '1 / -1',
                  textAlign: 'right',
                }}
              >
                بدون ردیف، همین مبلغ کلی ثبت می‌شود. اگر بعداً ردیف اضافه شود، مبلغ برابر مجموع ردیف‌ها خواهد بود.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2, py: 1, gap: 1 }}>
            <Button
              size="small"
              onClick={() => {
                setOpenCreateDialog(false);
                resetForm();
              }}
              sx={{ color: 'var(--admin-text-muted)', fontSize: 12 }}
            >
              انصراف
            </Button>
            <Button
              size="small"
              onClick={handleCreateInvoice}
              variant="contained"
              sx={{
                backgroundColor: 'var(--admin-accent)',
                fontSize: 12,
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
              borderRadius: '12px',
              border: '1px solid var(--admin-border)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'var(--admin-text)', fontWeight: '700', fontSize: 15, py: 1.5 }}>
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
              {invoiceUsesItemAmount(editingInvoice) ? (
                <Typography sx={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                  مبلغ این فاکتور از جمع ردیف‌هاست ({formatNumber(editingInvoice?.amount || 0)} تومان) و جداگانه ویرایش نمی‌شود.
                </Typography>
              ) : (
              <TextField
                label="مبلغ"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
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
              )}
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
              <BeneficiarySelect
                value={beneficiaryId}
                initialOption={beneficiaryOption}
                onChange={(id, option) => {
                  setBeneficiaryId(id);
                  setBeneficiaryOption(option);
                }}
              />
              <DocumentPaymentFields
                value={paymentForm}
                onChange={setPaymentForm}
                totalAmount={
                  invoiceUsesItemAmount(editingInvoice)
                    ? Number(editingInvoice?.amount) || 0
                    : parseAmountInput(amount) || 0
                }
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
              borderRadius: '12px',
              border: '1px solid var(--admin-border)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'var(--admin-text)', fontWeight: '700', fontSize: 15 }}>
            حذف فاکتور
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
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
            <Typography sx={{ color: "var(--admin-text)", fontSize: "14px", fontWeight: "700" }}>
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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

            <Box sx={{ marginBottom: "16px" }}>
              <BeneficiarySelect
                value={filterBeneficiaryId}
                initialOption={filterBeneficiaryOption}
                onChange={(id, option) => {
                  setFilterBeneficiaryId(id);
                  setFilterBeneficiaryOption(option);
                  setCurrentPage(1);
                }}
                label="ذینفع"
                helperText="فقط فاکتورهای این طرف‌حساب"
                allowRegister={false}
              />
            </Box>

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

        <InvoiceDetailsDialog
          open={!!detailsInvoice}
          invoice={detailsInvoice}
          onClose={() => setDetailsInvoice(null)}
          onSaved={fetchInvoices}
        />

        <InvoiceImageDialog
          open={!!imageInvoice}
          invoice={imageInvoice}
          onClose={() => setImageInvoice(null)}
          onSaved={fetchInvoices}
        />

        <DocumentPaymentSettleDialog
          open={!!settleInvoice}
          kind="invoice"
          documentId={settleInvoice?.id ?? null}
          remainingAmount={documentCreditRemaining(settleInvoice)}
          onClose={() => setSettleInvoice(null)}
          onSuccess={fetchInvoices}
        />

        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}

