"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import TodayIcon from "@mui/icons-material/Today";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import FlashlightOnIcon from "@mui/icons-material/FlashlightOn";
import FlashlightOffIcon from "@mui/icons-material/FlashlightOff";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import { useRouter } from "next/navigation";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import tokenCode from "@/app/coponent/tokenCode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextInput from "@/app/coponent/TextInput/TextInput";
import ReturnedProductCard, { type PurchaseItemReturnRow } from "./returnedProductCard";
import { paymentTypeLabel } from "./types";
import BottomSheet from "@/app/coponent/BottomSheet";
import SafeBarcodeScanner from "@/app/coponent/SafeBarcodeScanner";
import { isIranMobile, normalizeIranMobile, purchaseReturnCreditMessage } from "@/app/lib/purchaseReturns";

const StyledTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: "600",
    fontSize: "13px",
    padding: "12px 10px",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: "13px",
    padding: "10px 8px",
    verticalAlign: "middle",
    textAlign: "center",
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": {
    backgroundColor: "var(--admin-surface-alt)",
  },
  "&:hover": {
    backgroundColor: "var(--admin-menu-hover)",
  },
}));

const PERSIAN_MONTH_NAMES = [
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

interface MonthFilter {
  year: number;
  month: number;
  month_name: string;
  is_current_month: boolean;
}

interface PurchaseItemReturnDaily {
  date: string;
  date_jalali: string;
  transactions_count: number;
  total_quantity?: number;
  total_sale_price: number;
  total_purchase_price: number;
}

interface PurchaseItemReturnsGridResponse {
  filter: MonthFilter;
  from_date_jalali?: string;
  to_date_jalali?: string;
  month_total_sale_price: number;
  month_total_purchase_price: number;
  month_total_quantity: number;
  transactions_count: number;
  rows: PurchaseItemReturnRow[];
  daily: PurchaseItemReturnDaily[];
}

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num));

function getApiErrorMessage(res: unknown, fallback: string): string {
  if (!res || typeof res !== "object") return fallback;
  const r = res as Record<string, unknown>;
  if (typeof r.message === "string") return r.message;
  if (typeof r.error === "string") return r.error;
  if (typeof r.errorText === "string") {
    try {
      const parsed = JSON.parse(r.errorText);
      if (typeof parsed.message === "string") return parsed.message;
      if (Array.isArray(parsed.message) && parsed.message[0]?.title) {
        return parsed.message[0].title;
      }
    } catch {
      if (r.errorText && r.errorText !== "fetch failed") return r.errorText;
    }
  }
  return fallback;
}

function shiftPersianMonth(year: number, month: number, delta: number): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return { year: y, month: m };
}

function buildGridUrl(year?: number, month?: number): string {
  if (year != null && month != null) {
    return `/api/purchase-item-returns/grid?year=${year}&month=${month}`;
  }
  return "/api/purchase-item-returns/grid";
}

function normalizeFilter(raw: unknown): MonthFilter | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  const year = Number(f.year);
  const month = Number(f.month);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return {
    year,
    month,
    month_name: String(f.month_name ?? ""),
    is_current_month: Boolean(f.is_current_month),
  };
}

function normalizeRow(raw: unknown): PurchaseItemReturnRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    purchase_id: Math.floor(Number(r.purchase_id) || 0),
    purchased_product_id: Math.floor(Number(r.purchased_product_id) || 0),
    product_name: String(r.product_name ?? ""),
    barcode: r.barcode != null ? String(r.barcode) : undefined,
    quantity: Math.floor(Number(r.quantity) || 0) || 1,
    sale_price: Math.floor(Number(r.sale_price) || 0),
    purchase_price:
      r.purchase_price != null ? Math.floor(Number(r.purchase_price) || 0) : undefined,
    return_sale_total: Math.floor(Number(r.return_sale_total) || 0),
    return_purchase_total:
      r.return_purchase_total != null
        ? Math.floor(Number(r.return_purchase_total) || 0)
        : undefined,
    phone: String(r.phone ?? ""),
    payment_type: String(r.payment_type ?? ""),
    credit_returned:
      r.credit_returned != null ? Math.floor(Number(r.credit_returned) || 0) : undefined,
    date: r.date != null ? String(r.date) : undefined,
    date_jalali: String(r.date_jalali ?? ""),
    created_at: r.created_at != null ? String(r.created_at) : undefined,
    user_name: r.user_name != null ? String(r.user_name) : undefined,
    notes: typeof r.notes === "string" ? r.notes : r.notes == null ? null : String(r.notes),
  };
}

function normalizeDaily(raw: unknown): PurchaseItemReturnDaily | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const dateKey = typeof d.date === "string" ? d.date : d.date_jalali;
  if (dateKey == null) return null;
  return {
    date: typeof d.date === "string" ? d.date : String(d.date_jalali ?? ""),
    date_jalali: String(d.date_jalali ?? d.date ?? ""),
    transactions_count: Math.floor(Number(d.transactions_count) || 0),
    total_quantity:
      d.total_quantity != null ? Math.floor(Number(d.total_quantity) || 0) : undefined,
    total_sale_price: Math.floor(Number(d.total_sale_price) || 0),
    total_purchase_price: Math.floor(Number(d.total_purchase_price) || 0),
  };
}

function parseGridResponse(res: unknown): PurchaseItemReturnsGridResponse | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  if (r.hasError) return null;

  const pick = (obj: Record<string, unknown>): PurchaseItemReturnsGridResponse | null => {
    const filter = normalizeFilter(obj.filter);
    if (!filter || !Array.isArray(obj.rows)) return null;
    return {
      filter,
      from_date_jalali: obj.from_date_jalali != null ? String(obj.from_date_jalali) : undefined,
      to_date_jalali: obj.to_date_jalali != null ? String(obj.to_date_jalali) : undefined,
      month_total_sale_price: Math.floor(Number(obj.month_total_sale_price) || 0),
      month_total_purchase_price: Math.floor(Number(obj.month_total_purchase_price) || 0),
      month_total_quantity: Math.floor(Number(obj.month_total_quantity) || 0),
      transactions_count: Math.floor(Number(obj.transactions_count) || 0),
      rows: obj.rows
        .map((item) => normalizeRow(item))
        .filter((row): row is PurchaseItemReturnRow => row != null),
      daily: Array.isArray(obj.daily)
        ? obj.daily
            .map((item) => normalizeDaily(item))
            .filter((day): day is PurchaseItemReturnDaily => day != null)
        : [],
    };
  };

  const direct = pick(r);
  if (direct) return direct;

  if (r.data && typeof r.data === "object") {
    return pick(r.data as Record<string, unknown>);
  }

  return null;
}

export default function ReturnedProductsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PurchaseItemReturnRow[]>([]);
  const [daily, setDaily] = useState<PurchaseItemReturnDaily[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<MonthFilter | null>(null);
  const [rangeInfo, setRangeInfo] = useState<{ from: string; to: string } | null>(null);
  const [monthTotals, setMonthTotals] = useState({
    sale: 0,
    purchase: 0,
    quantity: 0,
    count: 0,
  });

  const [barcode, setBarcode] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("1");
  const [returnPhone, setReturnPhone] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openBottomSheet, setOpenBottomSheet] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const fetchGrid = useCallback(async (year?: number, month?: number) => {
    setLoading(true);
    const token = tokenCode();
    try {
      const res = await apiRequestError(
        "Get",
        {},
        {},
        buildGridUrl(year, month),
        true,
        true,
        token
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت گرید برگشت کالا"));
        setRows([]);
        setDaily([]);
        setMonthFilter(null);
        setRangeInfo(null);
        setMonthTotals({ sale: 0, purchase: 0, quantity: 0, count: 0 });
        return;
      }
      const payload = parseGridResponse(res);
      if (!payload) {
        toast.error("ساختار پاسخ سرور نامعتبر است");
        setRows([]);
        setDaily([]);
        return;
      }
      setMonthFilter(payload.filter);
      setRangeInfo(
        payload.from_date_jalali && payload.to_date_jalali
          ? { from: payload.from_date_jalali, to: payload.to_date_jalali }
          : null
      );
      setMonthTotals({
        sale: payload.month_total_sale_price,
        purchase: payload.month_total_purchase_price,
        quantity: payload.month_total_quantity,
        count: payload.transactions_count,
      });
      setRows(payload.rows);
      setDaily(payload.daily);
    } catch {
      toast.error("خطا در دریافت گرید برگشت کالا");
      setRows([]);
      setDaily([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  const goPrevMonth = () => {
    if (!monthFilter) return;
    const { year, month } = shiftPersianMonth(monthFilter.year, monthFilter.month, -1);
    fetchGrid(year, month);
  };

  const goNextMonth = () => {
    if (!monthFilter) return;
    const { year, month } = shiftPersianMonth(monthFilter.year, monthFilter.month, 1);
    fetchGrid(year, month);
  };

  const goCurrentMonth = () => fetchGrid();

  const handleYearMonthSelect = (year: number, month: number) => {
    fetchGrid(year, month);
  };

  const yearOptions = useMemo(() => {
    const base = monthFilter?.year ?? 1404;
    return Array.from({ length: 11 }, (_, i) => base - 5 + i);
  }, [monthFilter?.year]);

  const reversedRows = useMemo(() => [...rows].reverse(), [rows]);
  const reversedDaily = useMemo(() => [...daily].reverse(), [daily]);

  const handleScan = useCallback((result: string) => {
    if (result?.trim()) {
      setBarcode(result.trim());
      setShowScanner(false);
      setTimeout(() => {
        const inputElement = document.querySelector('input[name="barcode"]') as HTMLInputElement;
        inputElement?.focus();
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (!openBottomSheet) return;
    const t = setTimeout(() => {
      const inputElement = document.querySelector('input[name="barcode"]') as HTMLInputElement;
      inputElement?.focus();
    }, 300);
    return () => clearTimeout(t);
  }, [openBottomSheet]);

  const handleSubmitReturn = async () => {
    if (!barcode.trim()) {
      toast.error("لطفاً بارکد را وارد کنید");
      return;
    }

    const qty = parseInt(returnQuantity.replace(/\D/g, ""), 10);
    if (!Number.isFinite(qty) || qty < 1) {
      toast.error("تعداد برگشت باید حداقل ۱ باشد");
      return;
    }

    const phone = normalizeIranMobile(returnPhone);
    if (!isIranMobile(phone)) {
      toast.error("شماره موبایل مشتری را وارد کنید تا اعتبار به همان فرد برگردد");
      return;
    }

    setIsSubmitting(true);
    const token = tokenCode();
    try {
      const body: Record<string, unknown> = {
        barcode: barcode.trim(),
        quantity: qty,
        phone,
      };
      if (returnNotes.trim()) body.notes = returnNotes.trim();

      const res = await apiRequestError(
        "Post",
        {},
        body,
        "/api/purchase-item-returns",
        true,
        true,
        token
      );

      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ثبت برگشت کالا"));
        return;
      }

      toast.success(
        purchaseReturnCreditMessage(res) ||
          (qty === 1 ? "برگشت کالا ثبت شد" : `${formatNumber(qty)} عدد از خط فاکتور برگشت خورد`),
      );
      setBarcode("");
      setReturnQuantity("1");
      setReturnPhone("");
      setReturnNotes("");
      setOpenBottomSheet(false);
      setShowScanner(false);
      if (monthFilter) {
        await fetchGrid(monthFilter.year, monthFilter.month);
      } else {
        await fetchGrid();
      }
    } catch {
      toast.error("خطا در ثبت برگشت کالا");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleSubmitReturn();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        paddingTop: { xs: "12px", md: "24px" },
        paddingBottom: { xs: "100px", md: "40px" },
        direction: "rtl",
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              onClick={() => router.push("/admin")}
              aria-label="بازگشت"
              sx={{
                color: "var(--admin-text)",
                backgroundColor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <AssignmentReturnIcon sx={{ color: "var(--admin-accent)", fontSize: 32 }} />
            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>
              گرید برگشت کالا
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Paper
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.5,
                backgroundColor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                borderRadius: 2,
              }}
            >
              <IconButton
                size="small"
                onClick={goPrevMonth}
                disabled={loading || !monthFilter}
                aria-label="ماه قبل"
                sx={{ color: "var(--admin-text)" }}
              >
                <ChevronRightIcon />
              </IconButton>
              <FormControl size="small" sx={{ minWidth: 72 }}>
                <Select
                  value={monthFilter?.month ?? ""}
                  displayEmpty
                  disabled={!monthFilter || loading}
                  onChange={(e) => {
                    if (!monthFilter) return;
                    handleYearMonthSelect(monthFilter.year, Number(e.target.value));
                  }}
                  sx={{
                    color: "var(--admin-text)",
                    fontSize: 13,
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                >
                  {PERSIAN_MONTH_NAMES.map((name, idx) => (
                    <MenuItem key={name} value={idx + 1}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={monthFilter?.year ?? ""}
                  displayEmpty
                  disabled={!monthFilter || loading}
                  onChange={(e) => {
                    if (!monthFilter) return;
                    handleYearMonthSelect(Number(e.target.value), monthFilter.month);
                  }}
                  sx={{
                    color: "var(--admin-text)",
                    fontSize: 13,
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                >
                  {yearOptions.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                onClick={goNextMonth}
                disabled={loading || !monthFilter || monthFilter.is_current_month}
                aria-label="ماه بعد"
                sx={{ color: "var(--admin-text)" }}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Paper>
            {!monthFilter?.is_current_month && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<TodayIcon />}
                onClick={goCurrentMonth}
                disabled={loading}
                sx={{ color: "var(--admin-accent)", borderColor: "var(--admin-accent)" }}
              >
                ماه جاری
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() =>
                monthFilter ? fetchGrid(monthFilter.year, monthFilter.month) : fetchGrid()
              }
              disabled={loading}
              sx={{
                color: "var(--admin-text)",
                borderColor: "var(--admin-border)",
                "&:hover": { borderColor: "var(--admin-accent)" },
              }}
            >
              بروزرسانی
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenBottomSheet(true)}
              sx={{
                backgroundColor: "var(--admin-accent)",
                "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
              }}
            >
              ثبت برگشت
            </Button>
          </Box>
        </Box>

        <Card
          sx={{
            mb: 2,
            backgroundColor: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, lineHeight: 1.8, textAlign: "center" }}>
              {monthFilter && (
                <>
                  <Box component="span" sx={{ color: "var(--admin-text)", fontWeight: 700 }}>
                    {monthFilter.month_name} {monthFilter.year}
                  </Box>
                  {rangeInfo && (
                    <>
                      {" "}
                      — از {rangeInfo.from} تا {rangeInfo.to}
                    </>
                  )}
                  {monthFilter.is_current_month && (
                    <Chip
                      label="ماه جاری"
                      size="small"
                      sx={{ height: 22, fontSize: 11, verticalAlign: "middle" }}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  <br />
                </>
              )}
              تعداد تراکنش:{" "}
              <Box component="span" sx={{ color: "var(--admin-text)", fontWeight: 600 }}>
                {formatNumber(monthTotals.count)}
              </Box>
              {" — "}
              جمع تعداد:{" "}
              <Box component="span" sx={{ color: "var(--admin-text)", fontWeight: 600 }}>
                {formatNumber(monthTotals.quantity)}
              </Box>
              {" — "}
              جمع فروش:{" "}
              <Box component="span" sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                {formatNumber(monthTotals.sale)} تومان
              </Box>
              {" — "}
              جمع بهای تمام‌شده:{" "}
              <Box component="span" sx={{ color: "var(--admin-text)", fontWeight: 700 }}>
                {formatNumber(monthTotals.purchase)} تومان
              </Box>
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          <>
          

            <Typography
              sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 16, mb: 1.5, textAlign: "center" }}
            >
              تراکنش‌ها
            </Typography>
            {reversedRows.length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  backgroundColor: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 2,
                }}
              >
                <Typography sx={{ color: "var(--admin-text-muted)" }}>تراکنشی یافت نشد</Typography>
              </Paper>
            ) : (
              <>
                <TableContainer
                  component={Paper}
                  sx={{
                    display: { xs: "none", md: "block" },
                    backgroundColor: "var(--admin-surface)",
                    borderRadius: 2,
                    border: "1px solid var(--admin-border)",
                    overflowX: "auto",
                  }}
                >
                  <Table
                    size="small"
                    stickyHeader
                    sx={{
                      "& .MuiTableCell-root": {
                        textAlign: "center",
                      },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <StyledTableCell align="center">تاریخ</StyledTableCell>
                        <StyledTableCell align="center">فاکتور</StyledTableCell>
                        <StyledTableCell align="center">کالا</StyledTableCell>
                        <StyledTableCell align="center">تعداد</StyledTableCell>
                        <StyledTableCell align="center">قیمت واحد</StyledTableCell>
                        <StyledTableCell align="center">جمع برگشت</StyledTableCell>
                        <StyledTableCell align="center">موبایل</StyledTableCell>
                        <StyledTableCell align="center">اعتبار</StyledTableCell>
                        <StyledTableCell align="center">پرداخت</StyledTableCell>
                        <StyledTableCell align="center">پرسنل</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reversedRows.map((row) => {
                        const [, timePart] = (row.created_at || "").split(" ");
                        return (
                          <StyledTableRow key={row.id}>
                            <StyledTableCell align="center">
                              <Typography sx={{ fontSize: 13, textAlign: "center" }}>
                                {row.date_jalali || row.date || "—"}
                              </Typography>
                              {timePart && (
                                <Typography
                                  sx={{ fontSize: 11, color: "var(--admin-text-muted)", textAlign: "center" }}
                                >
                                  {timePart}
                                </Typography>
                              )}
                            </StyledTableCell>
                            <StyledTableCell align="center">{row.purchase_id || "—"}</StyledTableCell>
                            <StyledTableCell align="center">
                              <Typography sx={{ fontSize: 13, textAlign: "center" }}>
                                {row.product_name || "—"}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell align="center">{formatNumber(row.quantity)}</StyledTableCell>
                            <StyledTableCell align="center">{formatNumber(row.sale_price)}</StyledTableCell>
                            <StyledTableCell align="center">
                              <Typography sx={{ fontWeight: 600, color: "var(--admin-accent)", textAlign: "center" }}>
                                {formatNumber(row.return_sale_total)}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell align="center">{row.phone || "—"}</StyledTableCell>
                            <StyledTableCell align="center">
                              {row.credit_returned != null && row.credit_returned > 0
                                ? formatNumber(row.credit_returned)
                                : "—"}
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              {paymentTypeLabel(row.payment_type)}
                            </StyledTableCell>
                            <StyledTableCell align="center">{row.user_name || "—"}</StyledTableCell>
                          </StyledTableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 2 }}>
                  {reversedRows.map((row) => (
                    <ReturnedProductCard key={row.id} data={row} />
                  ))}
                </Box>
              </>
            )}
          </>
        )}

        <BottomSheet
          open={openBottomSheet}
          onClose={() => {
            setOpenBottomSheet(false);
            setShowScanner(false);
            setBarcode("");
            setReturnQuantity("1");
            setReturnPhone("");
            setReturnNotes("");
            setTorchOn(false);
          }}
          title="ثبت برگشت کالا"
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2, direction: "rtl" }}>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              <Button
                variant={showScanner ? "contained" : "outlined"}
                startIcon={<QrCodeScannerIcon />}
                onClick={() => setShowScanner(!showScanner)}
                sx={{
                  backgroundColor: showScanner ? "var(--admin-accent)" : "transparent",
                  color: showScanner ? "#fff" : "var(--admin-accent)",
                  borderColor: "var(--admin-accent)",
                }}
              >
                {showScanner ? "بستن اسکنر" : "باز کردن اسکنر"}
              </Button>
            </Box>

            {showScanner && (
              <Box sx={{ position: "relative", width: "100%", height: 300, mb: 1 }}>
                <SafeBarcodeScanner
                  width="100%"
                  height={300}
                  onUpdate={(err, result) => {
                    if (result) handleScan(result.getText());
                  }}
                  torch={torchOn}
                />
                <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                  <IconButton
                    onClick={() => setTorchOn(!torchOn)}
                    sx={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}
                  >
                    {torchOn ? <FlashlightOffIcon /> : <FlashlightOnIcon />}
                  </IconButton>
                </Box>
              </Box>
            )}

            <TextInput
              value={barcode}
              label="بارکد کالا"
              onChange={(e) => setBarcode(e)}
              name="barcode"
              type="text"
              onKeyPress={handleKeyPress}
            />

            <TextInput
              value={returnQuantity}
              label="تعداد برگشت (پیش‌فرض ۱)"
              onChange={(e) => setReturnQuantity(e.replace(/[^\d۰-۹]/g, ""))}
              name="return_quantity"
              type="text"
              onKeyPress={handleKeyPress}
            />
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: -1 }}>
              اگر خط چند عدد دارد، فقط همان تعداد از فاکتور برمی‌گردد (مثلاً ۱ از ۳).
            </Typography>
            <TextInput
              value={returnPhone}
              label="شماره موبایل مشتری"
              onChange={(e) => setReturnPhone(normalizeIranMobile(e))}
              name="return_phone"
              type="text"
              onKeyPress={handleKeyPress}
            />
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: -1 }}>
              اگر فاکتور مشتری نداشت، با این شماره کاربر پیدا یا ساخته می‌شود و مبلغ به اعتبار همان فرد برمی‌گردد.
            </Typography>
            <TextInput
              value={returnNotes}
              label="یادداشت (اختیاری)"
              onChange={(e) => setReturnNotes(e)}
              name="return_notes"
              type="text"
            />

            <Button
              variant="contained"
              onClick={handleSubmitReturn}
              disabled={isSubmitting || !barcode.trim()}
              fullWidth
              sx={{
                backgroundColor: "var(--admin-accent)",
                py: 1.5,
                "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
              }}
            >
              {isSubmitting ? "در حال ثبت..." : "ثبت برگشت"}
            </Button>
          </Box>
        </BottomSheet>

        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
