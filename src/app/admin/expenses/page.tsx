"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Pagination,
  Paper,
  MenuItem,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import PaymentsIcon from "@mui/icons-material/Payments";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { formatAmountInput, parseAmountInput } from "@/app/lib/amountInput";
import BeneficiarySelect from "@/app/admin/BeneficiarySelect";
import DocumentPaymentFields from "@/app/admin/DocumentPaymentFields";
import { DocumentPaymentChips, documentNeedsSettle } from "@/app/admin/DocumentPaymentBadge";
import DocumentPaymentSettleDialog from "@/app/admin/DocumentPaymentSettleDialog";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";
import { CHEQUE_DATE_PICKER_Z, chequeDatePickerBoxSx } from "@/app/admin/cheques/ChequeFormSheet";
import { dateObjectToPayload, parseAmount, todayJalaliDateObject } from "@/app/lib/cheques";
import BottomSheet from "@/app/coponent/BottomSheet";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import {
  beneficiaryFromRecord,
  beneficiaryPayload,
  formatBeneficiaryLabel,
  type Beneficiary,
} from "@/app/lib/beneficiaries";
import {
  buildDocumentPaymentPayload,
  documentCreditRemaining,
  emptyDocumentPaymentForm,
  formFromDocumentPayment,
  type DocumentPaymentFields as DocumentPaymentInfo,
  type DocumentPaymentFormState,
} from "@/app/lib/documentPayments";
import {
  creditSourceCountsInProfit,
  expenseCreditSource,
  EXPENSE_CREDIT_SOURCE_LABELS,
  isExpenseCreditSource,
  type ExpenseCreditSource,
} from "@/app/lib/expenseCreditSource";

const StyledTableCell = styled(TableCell)({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: 600,
    fontSize: 12,
    padding: "8px 10px",
    whiteSpace: "nowrap",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 12,
    padding: "7px 10px",
    whiteSpace: "nowrap",
    "& .MuiTypography-root": { fontSize: 12 },
  },
});

const StyledTableRow = styled(TableRow)({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": { backgroundColor: "var(--admin-surface-alt)" },
  "&:hover": { backgroundColor: "var(--admin-menu-hover)" },
  "&:last-child td, &:last-child th": { border: 0 },
});

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    backgroundColor: "var(--admin-surface-alt)",
    fontSize: 13,
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)", fontSize: 13 },
  "& .MuiInputBase-input": { py: "8px", fontSize: 13 },
} as const;

type Expense = DocumentPaymentInfo & {
  id: number;
  title: string;
  amount: number | string;
  type?: string;
  user_name?: string;
  created_at?: string;
  date?: string;
  credit_source?: string | null;
  shop_account_id?: number | null;
  shop_account?: { id: number; name?: string } | null;
  beneficiary_id?: number | null;
  user_shiksho_id?: number | null;
  beneficiary?: { id?: number | null; name?: string | null; phone?: string | null } | null;
  cheque_id?: number | null;
  cheque?: LinkedCheque | null;
};

type LinkedCheque = {
  id: number;
  status?: string | null;
  type?: string | null;
  cheque_number?: string | null;
  amount?: number | string | null;
  shop_account_id?: number | null;
  bank_name?: string | null;
};

const formatNumber = (num: number | string) => {
  const value = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (!Number.isFinite(value)) return "۰";
  return new Intl.NumberFormat("fa-IR").format(value);
};

function expenseAmount(expense: Expense): number {
  const value = typeof expense.amount === "string" ? parseFloat(expense.amount) : expense.amount;
  return Number.isFinite(value) ? value : 0;
}

function expenseDate(expense: Expense): string {
  return expense.date || expense.created_at || "-";
}

function asLinkedCheque(value: unknown): LinkedCheque | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Record<string, unknown>;
  const id = Number(rec.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    status: rec.status != null ? String(rec.status) : null,
    type: rec.type != null ? String(rec.type) : null,
    cheque_number: rec.cheque_number != null ? String(rec.cheque_number) : null,
    amount: (rec.amount as number | string | null) ?? null,
    shop_account_id: rec.shop_account_id != null ? Number(rec.shop_account_id) : null,
    bank_name: rec.bank_name != null ? String(rec.bank_name) : null,
  };
}

function pendingExpenseCheques(expense: Expense): LinkedCheque[] {
  const seen = new Set<number>();
  const out: LinkedCheque[] = [];
  const docStatus = String(expense.payment_status || "").toLowerCase();
  const docUnsettled = docStatus === "unpaid" || docStatus === "partial";
  const add = (cheque: LinkedCheque | null) => {
    if (!cheque || seen.has(cheque.id)) return;
    const status = String(cheque.status || "").toLowerCase();
    if (status === "cleared" || status === "cancelled") return;
    if (status !== "pending" && !docUnsettled) return;
    seen.add(cheque.id);
    out.push(cheque);
  };

  add(asLinkedCheque(expense.cheque));
  for (const row of expense.payments || []) {
    if (String(row?.method || "") !== "cheque") continue;
    const nested = asLinkedCheque(row.cheque);
    if (nested) {
      add(nested);
      continue;
    }
    const id = Number(row.cheque_id);
    if (docUnsettled && Number.isFinite(id) && id > 0) {
      add({
        id,
        status: "pending",
        amount: row.amount ?? expense.amount,
        shop_account_id: expense.shop_account_id,
      });
    }
  }
  if (!out.length && docUnsettled) {
    const method = String(expense.payment_method || "").toLowerCase();
    const id = Number(expense.cheque_id);
    if ((method === "cheque" || method === "mixed") && Number.isFinite(id) && id > 0) {
      add({
        id,
        status: "pending",
        amount: expense.amount,
        shop_account_id: expense.shop_account_id ?? null,
        cheque_number: expense.cheque?.cheque_number ?? null,
      });
    }
  }
  return out;
}

function currentUserNames(): string[] {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const full = `${user.name || ""} ${user.last_name || ""}`.trim();
    return [full, user.name || ""].filter(Boolean);
  } catch {
    return [];
  }
}

function canMutateExpense(expense: Expense): boolean {
  if (expenseCreditSource(expense)) return false;
  const names = currentUserNames();
  if (!names.length) return true;
  return names.includes(String(expense.user_name || "").trim());
}

const chipSx = {
  height: 18,
  fontSize: 10,
  "& .MuiChip-label": { px: 0.6 },
} as const;

function resolveShopAccountId(item: Expense): number | "" {
  const direct = Number(item.shop_account_id);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const nested = Number(item.shop_account?.id);
  if (Number.isFinite(nested) && nested > 0) return nested;
  return "";
}

function FilterChipRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mb: 0.4 }}>{label}</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {options.map(([optionValue, optionLabel]) => {
          const selected = value === optionValue;
          return (
            <Chip
              key={optionValue}
              size="small"
              label={optionLabel}
              onClick={() => onChange(optionValue)}
              sx={{
                height: 26,
                fontSize: 12,
                bgcolor: selected ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                color: selected ? "#fff" : "var(--admin-text)",
                border: "1px solid",
                borderColor: selected ? "var(--admin-accent)" : "var(--admin-border)",
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [openForm, setOpenForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [openFilterSheet, setOpenFilterSheet] = useState(false);

  const [type, setType] = useState<"جاری" | "سرمایه">("جاری");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [userName, setUserName] = useState("");
  const [paymentForm, setPaymentForm] = useState<DocumentPaymentFormState>(emptyDocumentPaymentForm);
  const [settleExpense, setSettleExpense] = useState<Expense | null>(null);
  const [clearCheques, setClearCheques] = useState<LinkedCheque[]>([]);
  const [clearChequeId, setClearChequeId] = useState<number | "">("");
  const [clearAccountId, setClearAccountId] = useState<number | "">("");
  const [clearDate, setClearDate] = useState<DateObject | null>(null);
  const [clearingCheque, setClearingCheque] = useState(false);
  const [beneficiaryId, setBeneficiaryId] = useState<number | "">("");
  const [beneficiaryOption, setBeneficiaryOption] = useState<Beneficiary | null>(null);

  const [filterMode, setFilterMode] = useState<"today" | "week" | "month" | "year" | "range" | null>(null);
  const [dateRange, setDateRange] = useState<any>([]);
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<"all" | "جاری" | "سرمایه">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBeneficiaryId, setFilterBeneficiaryId] = useState<number | "">("");
  const [filterBeneficiaryOption, setFilterBeneficiaryOption] = useState<Beneficiary | null>(null);
  const [creditSourceFilter, setCreditSourceFilter] = useState<ExpenseCreditSource | "all" | "none">("none");
  const [creditHelpOpen, setCreditHelpOpen] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserName(user.name || "");
    } catch {
      setUserName("");
    }
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("beneficiary_id"));
    if (Number.isFinite(id) && id > 0) setFilterBeneficiaryId(id);
    const source = params.get("credit_source");
    if (source === "all" || source === "none" || isExpenseCreditSource(source)) {
      setCreditSourceFilter(source);
    }
  }, []);

  const buildUrl = useCallback(() => {
    const params: string[] = [`per_page=${perPage}`, `page=${currentPage}`];
    if (expenseTypeFilter !== "all") params.push(`type=${encodeURIComponent(expenseTypeFilter)}`);
    if (filterMode === "range" && dateRange.length === 2) {
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
      params.push(
        `filter=range&from_date=${encodeURIComponent(JSON.stringify(from_date))}&to_date=${encodeURIComponent(JSON.stringify(to_date))}`,
      );
    } else if (filterMode) {
      params.push(`filter=${filterMode}`);
    }
    if (searchQuery.trim()) {
      params.push(
        `searchFilterModel=${encodeURIComponent(
          JSON.stringify({ title: searchQuery, user_name: searchQuery, type: searchQuery }),
        )}`,
      );
    }
    if (filterBeneficiaryId !== "") params.push(`beneficiary_id=${filterBeneficiaryId}`);
    params.push(`credit_source=${creditSourceFilter}`);
    return `/api/expenses?${params.join("&")}`;
  }, [perPage, currentPage, expenseTypeFilter, filterMode, dateRange, searchQuery, filterBeneficiaryId, creditSourceFilter]);

  const fetchExpenses = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", buildUrl(), token);
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت هزینه‌ها"));
        setExpenses([]);
        setTotalAmount(0);
        return;
      }
      const rows = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setExpenses(rows);
      setTotalPages(res.last_page || 1);
      setTotalCount(res.total || rows.length);
      if (res.current_page) setCurrentPage(res.current_page);
      if (res.total_amount !== undefined) {
        setTotalAmount(Number(res.total_amount) || 0);
      } else {
        setTotalAmount(rows.reduce((sum: number, item: Expense) => sum + expenseAmount(item), 0));
      }
    } catch {
      toast.error("خطا در دریافت هزینه‌ها");
      setExpenses([]);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  const resetForm = () => {
    setType("جاری");
    setTitle("");
    setAmount("");
    setPaymentForm(emptyDocumentPaymentForm());
    setBeneficiaryId("");
    setBeneficiaryOption(null);
    setEditingExpense(null);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserName(user.name || "");
    } catch {
      setUserName("");
    }
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setType((expense.type as "جاری" | "سرمایه") || "جاری");
    setTitle(expense.title || "");
    setAmount(formatNumber(expenseAmount(expense)));
    setUserName(expense.user_name || "");
    setPaymentForm({
      ...formFromDocumentPayment(expense),
      shopAccountId: resolveShopAccountId(expense),
    });
    const beneficiary = beneficiaryFromRecord(expense);
    setBeneficiaryId(beneficiary?.id ?? "");
    setBeneficiaryOption(beneficiary);
    setOpenForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !amount.trim()) {
      toast.error("لطفاً عنوان و مبلغ را وارد کنید");
      return;
    }
    const amountNum = parseAmountInput(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("مبلغ معتبر نیست");
      return;
    }
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }
    const payload: Record<string, unknown> = {
      title: title.trim(),
      amount: amountNum,
      type,
      user_name: userName.trim() || undefined,
    };
    Object.assign(payload, beneficiaryPayload(beneficiaryId));
    const payment = buildDocumentPaymentPayload(paymentForm, amountNum);
    if (payment.error) {
      toast.error(payment.error);
      return;
    }
    Object.assign(payload, payment.payload);

    setSaving(true);
    try {
      const res = editingExpense
        ? await FetchWithJwtClient("PUT", `/api/expenses/${editingExpense.id}`, payload)
        : await FetchWithJwtClient("POST", "/api/expenses", payload);
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, editingExpense ? "خطا در ویرایش هزینه" : "خطا در ثبت هزینه"));
        return;
      }
      toast.success(editingExpense ? "هزینه ویرایش شد" : "هزینه ثبت شد");
      setOpenForm(false);
      resetForm();
      await fetchExpenses();
    } catch {
      toast.error(editingExpense ? "خطا در ویرایش هزینه" : "خطا در ثبت هزینه");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      const res = await FetchWithJwtClient("DELETE", `/api/expenses/${deletingExpense.id}`, token);
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف هزینه"));
        return;
      }
      toast.success("هزینه حذف شد");
      setOpenDeleteDialog(false);
      setDeletingExpense(null);
      await fetchExpenses();
    } catch {
      toast.error("خطا در حذف هزینه");
    } finally {
      setSaving(false);
    }
  };

  const hasActiveFilters =
    expenseTypeFilter !== "all" ||
    filterMode !== null ||
    dateRange.length > 0 ||
    searchQuery.trim() !== "" ||
    filterBeneficiaryId !== "" ||
    creditSourceFilter !== "none";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        pt: { xs: 1.25, md: 2 },
        pb: { xs: "100px", md: 4 },
        direction: "rtl",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 1.25, md: 2 } }}>
        <Box
          sx={{
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <PaymentsIcon sx={{ fontSize: 20, color: "var(--admin-accent)" }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "var(--admin-text)" }}>
              هزینه‌ها
            </Typography>
            <IconButton
              size="small"
              onClick={() => setCreditHelpOpen(true)}
              sx={{ color: "var(--admin-text-muted)" }}
              aria-label="چه موقع هزینه ساخته می‌شود"
            >
              <InfoOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={openCreate}
              sx={{
                ...adminButtonStartIconSx,
                backgroundColor: "var(--admin-accent)",
                fontSize: 12,
                py: 0.5,
                px: 1.25,
                borderRadius: "8px",
                "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
              }}
            >
              ثبت هزینه
            </Button>
            <IconButton
              size="small"
              onClick={() => setOpenFilterSheet(true)}
              sx={{
                backgroundColor: hasActiveFilters ? "var(--admin-accent)" : "var(--admin-surface)",
                color: "var(--admin-text)",
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: hasActiveFilters ? "var(--admin-accent-hover)" : "var(--admin-surface-alt)",
                },
              }}
            >
              <FilterListIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {!loading && (
          <Card
            sx={{
              backgroundColor: "var(--admin-surface)",
              borderRadius: "10px",
              border: "1px solid var(--admin-border)",
              mb: 1.5,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ py: 1, px: 1.5, "&:last-child": { pb: 1 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>جمع کل</Typography>
                <Typography sx={{ color: "var(--admin-accent)", fontSize: 14, fontWeight: 700 }}>
                  {formatNumber(totalAmount)} تومان
                </Typography>
              </Box>
              {totalCount > 0 && (
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.25 }}>
                  {formatNumber(totalCount)} مورد
                </Typography>
              )}
              {creditSourceFilter === "purchase_return" ? (
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.5 }}>
                  برگشت خرید نوع جداست و در جمع هزینه‌ها و سود نمی‌آید.
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : expenses.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 5,
              backgroundColor: "var(--admin-surface)",
              borderRadius: "10px",
              border: "1px solid var(--admin-border)",
            }}
          >
            <PaymentsIcon sx={{ fontSize: 36, color: "var(--admin-text-secondary)", mb: 1 }} />
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>هزینه‌ای یافت نشد</Typography>
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: "var(--admin-surface)",
              borderRadius: "10px",
              border: "1px solid var(--admin-border)",
              boxShadow: "none",
              overflowX: "auto",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="right">عنوان</StyledTableCell>
                  <StyledTableCell align="right">نوع</StyledTableCell>
                  <StyledTableCell align="right">مبلغ</StyledTableCell>
                  <StyledTableCell align="right">پرداخت</StyledTableCell>
                  <StyledTableCell align="right">تاریخ</StyledTableCell>
                  <StyledTableCell align="right">ذینفع</StyledTableCell>
                  <StyledTableCell align="right">ثبت‌کننده</StyledTableCell>
                  <StyledTableCell align="right">عملیات</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => {
                  const mutable = canMutateExpense(expense);
                  const creditSource = expenseCreditSource(expense);
                  return (
                    <StyledTableRow key={expense.id}>
                      <StyledTableCell align="right">
                        <Typography sx={{ fontWeight: 600, color: "var(--admin-text)", whiteSpace: "normal" }}>
                          {expense.title}
                        </Typography>
                        {creditSource ? (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4, mt: 0.4 }}>
                            <Chip
                              size="small"
                              label={EXPENSE_CREDIT_SOURCE_LABELS[creditSource]}
                              sx={{
                                ...chipSx,
                                backgroundColor: "var(--admin-menu-hover)",
                                color: "var(--admin-text)",
                              }}
                            />
                            {creditSource !== "loyalty_purchase" ? (
                              <Chip
                                size="small"
                                label="نسیه"
                                sx={{
                                  ...chipSx,
                                  backgroundColor: "rgba(230, 162, 60, 0.18)",
                                  color: "#e6a23c",
                                }}
                              />
                            ) : null}
                            {creditSourceCountsInProfit(creditSource) ? (
                              <Chip
                                size="small"
                                label="در سود"
                                sx={{
                                  ...chipSx,
                                  backgroundColor: "rgba(120, 181, 104, 0.18)",
                                  color: "var(--admin-accent)",
                                }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label="در سود نیست"
                                sx={{
                                  ...chipSx,
                                  backgroundColor: "rgba(255, 68, 68, 0.12)",
                                  color: "#ff8a80",
                                }}
                              />
                            )}
                          </Box>
                        ) : null}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {expense.type ? (
                          <Chip
                            size="small"
                            label={creditSource === "purchase_return" ? "برگشت" : expense.type}
                            sx={{
                              height: 20,
                              fontSize: 11,
                              backgroundColor: "var(--admin-menu-hover)",
                              color: "var(--admin-text)",
                            }}
                          />
                        ) : (
                          "—"
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700 }}>
                          {formatNumber(expenseAmount(expense))} تومان
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {creditSource && creditSource !== "loyalty_purchase" ? (
                          <Chip
                            size="small"
                            label="نسیه"
                            sx={{
                              ...chipSx,
                              backgroundColor: "rgba(230, 162, 60, 0.18)",
                              color: "#e6a23c",
                            }}
                          />
                        ) : creditSource ? (
                          <Chip
                            size="small"
                            label="خرج‌شده"
                            sx={{
                              ...chipSx,
                              backgroundColor: "rgba(120, 181, 104, 0.18)",
                              color: "var(--admin-accent)",
                            }}
                          />
                        ) : (
                          <DocumentPaymentChips doc={expense} />
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Typography sx={{ color: "var(--admin-text-muted)" }}>{expenseDate(expense)}</Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {(() => {
                          const beneficiary = beneficiaryFromRecord(expense);
                          if (!beneficiary) {
                            return <Typography sx={{ color: "var(--admin-text-muted)" }}>—</Typography>;
                          }
                          return (
                            <Typography
                              component={Link}
                              href={`/admin/beneficiaries/${beneficiary.id}`}
                              sx={{ color: "var(--admin-accent)", textDecoration: "none", fontSize: 12 }}
                            >
                              {formatBeneficiaryLabel(beneficiary)}
                            </Typography>
                          );
                        })()}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Typography sx={{ color: "var(--admin-text-muted)" }}>
                          {expense.user_name || "—"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {(() => {
                          const pendingCheques = pendingExpenseCheques(expense);
                          if (!mutable && pendingCheques.length === 0) return null;
                          return (
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.25, alignItems: "center", flexWrap: "wrap" }}>
                            {pendingCheques.length > 0 ? (
                              <IconButton
                                size="small"
                                title="وصول چک"
                                aria-label="وصول چک"
                                onClick={() => {
                                  setClearCheques(pendingCheques);
                                  setClearChequeId(pendingCheques[0].id);
                                  const account = Number(pendingCheques[0].shop_account_id || expense.shop_account_id);
                                  setClearAccountId(Number.isFinite(account) && account > 0 ? account : "");
                                  setClearDate(todayJalaliDateObject());
                                }}
                                sx={{ color: "var(--admin-accent)" }}
                              >
                                <DoneAllIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            ) : null}
                            {mutable ? (
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.25, alignItems: "center", flexWrap: "wrap" }}>
                            {documentNeedsSettle(expense) ? (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setSettleExpense(expense)}
                                sx={{
                                  color: "var(--admin-accent)",
                                  borderColor: "var(--admin-accent-border)",
                                  borderRadius: "6px",
                                  fontSize: 11,
                                  py: 0,
                                  minHeight: 26,
                                  px: 1,
                                }}
                              >
                                تسویه
                              </Button>
                            ) : null}
                            <IconButton size="small" onClick={() => openEdit(expense)} sx={{ color: "var(--admin-accent)" }}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setDeletingExpense(expense);
                                setOpenDeleteDialog(true);
                              }}
                              sx={{ color: "var(--admin-error)" }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                            ) : null}
                          </Box>
                          );
                        })()}
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && expenses.length > 0 && totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_e, value) => {
                setCurrentPage(value);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              size="small"
              sx={{
                "& .MuiPaginationItem-root": { color: "var(--admin-text)", fontSize: 12 },
                "& .Mui-selected": { backgroundColor: "var(--admin-accent) !important", color: "var(--admin-on-accent)" },
              }}
            />
          </Box>
        )}

        <Dialog
          open={openForm}
          onClose={() => {
            setOpenForm(false);
            resetForm();
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "var(--admin-surface)",
              borderRadius: "12px",
              border: "1px solid var(--admin-border)",
            },
          }}
        >
          <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15, py: 1.5 }}>
            {editingExpense ? "ویرایش هزینه" : "ثبت هزینه"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }}>
              <Box>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5 }}>نوع هزینه</Typography>
                <RadioGroup row value={type} onChange={(e) => setType(e.target.value as "جاری" | "سرمایه")}>
                  <FormControlLabel
                    value="جاری"
                    control={<Radio size="small" sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }} />}
                    label={<Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>جاری</Typography>}
                  />
                  <FormControlLabel
                    value="سرمایه"
                    control={<Radio size="small" sx={{ color: "var(--admin-accent)", "&.Mui-checked": { color: "var(--admin-accent)" } }} />}
                    label={<Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>سرمایه</Typography>}
                  />
                </RadioGroup>
              </Box>
              <TextField size="small" label="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth sx={fieldSx} />
              <TextField
                size="small"
                label="مبلغ"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                fullWidth
                sx={fieldSx}
              />
              <DocumentPaymentFields
                value={paymentForm}
                onChange={setPaymentForm}
                totalAmount={parseAmountInput(amount) || 0}
              />
              <BeneficiarySelect
                value={beneficiaryId}
                initialOption={beneficiaryOption}
                onChange={(id, option) => {
                  setBeneficiaryId(id);
                  setBeneficiaryOption(option);
                }}
              />
              {editingExpense ? (
                <TextField
                  size="small"
                  label="نام ثبت‌کننده"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  fullWidth
                  sx={fieldSx}
                />
              ) : null}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 1.5 }}>
            <Button
              size="small"
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
              sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}
            >
              انصراف
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={saving}
              onClick={() => void handleSave()}
              sx={{
                backgroundColor: "var(--admin-accent)",
                fontSize: 12,
                "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
              }}
            >
              {saving ? "..." : editingExpense ? "ذخیره" : "ثبت"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openDeleteDialog}
          onClose={() => {
            if (saving) return;
            setOpenDeleteDialog(false);
            setDeletingExpense(null);
          }}
          PaperProps={{
            sx: {
              backgroundColor: "var(--admin-surface)",
              borderRadius: "12px",
              border: "1px solid var(--admin-border)",
            },
          }}
        >
          <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15 }}>حذف هزینه</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
              {deletingExpense
                ? `«${deletingExpense.title}» به مبلغ ${formatNumber(expenseAmount(deletingExpense))} تومان حذف شود؟`
                : "این هزینه حذف شود؟"}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 1.5 }}>
            <Button
              size="small"
              disabled={saving}
              onClick={() => {
                setOpenDeleteDialog(false);
                setDeletingExpense(null);
              }}
              sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}
            >
              انصراف
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={saving}
              onClick={() => void handleDelete()}
              sx={{ backgroundColor: "var(--admin-error)", fontSize: 12, "&:hover": { backgroundColor: "var(--admin-error-hover)" } }}
            >
              حذف
            </Button>
          </DialogActions>
        </Dialog>

        <BottomSheet
          open={openFilterSheet}
          title={
            <Typography sx={{ color: "var(--admin-text)", fontSize: 14, fontWeight: 700 }}>فیلتر هزینه‌ها</Typography>
          }
          onClose={() => setOpenFilterSheet(false)}
        >
          <Box sx={{ px: 1.5, pt: 1, pb: 1.5 }}>
            <TextField
              size="small"
              label="جستجو"
              placeholder="عنوان یا ثبت‌کننده"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              fullWidth
              sx={{ ...fieldSx, mb: 1 }}
            />
            <Box sx={{ mb: 1 }}>
              <BeneficiarySelect
                value={filterBeneficiaryId}
                initialOption={filterBeneficiaryOption}
                onChange={(id, option) => {
                  setFilterBeneficiaryId(id);
                  setFilterBeneficiaryOption(option);
                  setCurrentPage(1);
                }}
                label="ذینفع"
                allowRegister={false}
              />
            </Box>
            <FilterChipRow
              label="نوع"
              value={expenseTypeFilter}
              options={[
                ["all", "همه"],
                ["جاری", "جاری"],
                ["سرمایه", "سرمایه"],
              ]}
              onChange={(value) => {
                setExpenseTypeFilter(value as "all" | "جاری" | "سرمایه");
                setCurrentPage(1);
              }}
            />
            <FilterChipRow
              label="اعتبار"
              value={creditSourceFilter}
              options={[
                ["none", "بدون مصرف اعتبار"],
                ["all", "همه"],
                ["loyalty_purchase", EXPENSE_CREDIT_SOURCE_LABELS.loyalty_purchase],
                ["purchase_return", EXPENSE_CREDIT_SOURCE_LABELS.purchase_return],
                ["manual", EXPENSE_CREDIT_SOURCE_LABELS.manual],
              ]}
              onChange={(value) => {
                setCreditSourceFilter(value as ExpenseCreditSource | "all" | "none");
                setCurrentPage(1);
              }}
            />
            <FilterChipRow
              label="تاریخ"
              value={filterMode || "all"}
              options={[
                ["all", "همه"],
                ["today", "امروز"],
                ["week", "هفته"],
                ["month", "ماه"],
                ["year", "سال"],
                ["range", "بازه"],
              ]}
              onChange={(value) => {
                setCurrentPage(1);
                if (value === "all") {
                  setFilterMode(null);
                  setDateRange([]);
                } else {
                  setFilterMode(value as "today" | "week" | "month" | "year" | "range");
                  if (value !== "range") setDateRange([]);
                }
              }}
            />
            {filterMode === "range" && (
              <Box sx={{ mb: 1.5 }}>
                <DatePicker
                  value={dateRange}
                  onChange={(dates: any) => {
                    setDateRange(dates);
                    if (dates.length === 2) {
                      setFilterMode("range");
                      setCurrentPage(1);
                    }
                  }}
                  range
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    backgroundColor: "var(--admin-surface-alt)",
                    borderRadius: "8px",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text)",
                    fontSize: 13,
                  }}
                />
              </Box>
            )}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={() => {
                  setFilterMode(null);
                  setDateRange([]);
                  setExpenseTypeFilter("all");
                  setSearchQuery("");
                  setFilterBeneficiaryId("");
                  setFilterBeneficiaryOption(null);
                  setCreditSourceFilter("none");
                  setCurrentPage(1);
                  setOpenFilterSheet(false);
                }}
                sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)", fontSize: 12 }}
              >
                پاک کردن
              </Button>
              <Button
                size="small"
                variant="contained"
                fullWidth
                onClick={() => setOpenFilterSheet(false)}
                sx={{ backgroundColor: "var(--admin-accent)", fontSize: 12, "&:hover": { backgroundColor: "var(--admin-accent-hover)" } }}
              >
                اعمال
              </Button>
            </Box>
          </Box>
        </BottomSheet>

        <Dialog
          open={creditHelpOpen}
          onClose={() => setCreditHelpOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              backgroundColor: "var(--admin-surface)",
              borderRadius: "12px",
              border: "1px solid var(--admin-border)",
            },
          }}
        >
          <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15, py: 1.5 }}>
            چه موقع هزینه ساخته می‌شود
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1.25 }}>
              این ردیف‌ها نسیه و بدون حساب فروشگاه هستند؛ از موجودی نقد و تنخواه کم نمی‌شوند.
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="right">منبع</StyledTableCell>
                  <StyledTableCell align="right">عنوان در لیست</StyledTableCell>
                  <StyledTableCell align="right">سود / آمار هزینه</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <StyledTableRow>
                  <StyledTableCell align="right">خرج شدن اعتبار در خرید</StyledTableCell>
                  <StyledTableCell align="right">اعتبار مشتری — مصرف اعتبار در خرید #…</StyledTableCell>
                  <StyledTableCell align="right">بله (هزینه جاری)</StyledTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StyledTableCell align="right">افزایش دستی اعتبار</StyledTableCell>
                  <StyledTableCell align="right">تا خرج شدن در خرید، در لیست نیست</StyledTableCell>
                  <StyledTableCell align="right">خیر</StyledTableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <StyledTableCell align="right">برگشت خرید</StyledTableCell>
                  <StyledTableCell align="right">نوع برگشت — خارج از لیست هزینه‌ها</StyledTableCell>
                  <StyledTableCell align="right">خیر</StyledTableCell>
                </StyledTableRow>
              </TableBody>
            </Table>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 1.5 }}>
              افزایش دستی و برگشت خرید تا وقتی در یک خرید خرج نشوند هزینه نیستند. همان لحظهٔ استفاده، ردیف مصرف اعتبار در این لیست می‌آید و از سود کم می‌شود. اعتباری که از برگشت شارژ شده روش پرداخت است و از سود کم نمی‌شود.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 1.5 }}>
            <Button
              size="small"
              onClick={() => setCreditHelpOpen(false)}
              sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}
            >
              بستن
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={clearCheques.length > 0}
          onClose={() => {
            if (clearingCheque) return;
            setClearCheques([]);
            setClearChequeId("");
          }}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "var(--admin-surface)",
              borderRadius: "12px",
              border: "1px solid var(--admin-border)",
              direction: "rtl",
            },
          }}
        >
          <DialogTitle sx={{ color: "var(--admin-text)", textAlign: "center", fontSize: 16 }}>
            وصول چک
          </DialogTitle>
          <DialogContent>
            {(() => {
              const selected = clearCheques.find((item) => item.id === clearChequeId) ?? clearCheques[0];
              if (!selected) return null;
              return (
                <>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, textAlign: "center", mb: 1.5 }}>
                    چک {selected.cheque_number || selected.id} به مبلغ {formatNumber(parseAmount(selected.amount))} تومان
                    وصول شود و از حساب انتخاب‌شده کسر گردد.
                  </Typography>
                  {clearCheques.length > 1 ? (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="چک"
                      value={selected.id}
                      onChange={(e) => {
                        const nextId = Number(e.target.value);
                        setClearChequeId(nextId);
                        const next = clearCheques.find((item) => item.id === nextId);
                        const account = Number(next?.shop_account_id);
                        if (Number.isFinite(account) && account > 0) setClearAccountId(account);
                      }}
                      sx={{ ...fieldSx, mb: 1.5 }}
                    >
                      {clearCheques.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.cheque_number || item.id}
                          {item.bank_name ? ` — ${item.bank_name}` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : null}
                  <Box sx={{ mb: 1.5 }}>
                    <ShopAccountSelect
                      value={clearAccountId}
                      onChange={setClearAccountId}
                      required
                      label="حساب برداشت"
                      helperText="حساب بانکی، تنخواه یا صندوق"
                    />
                  </Box>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5 }}>
                    تاریخ وصول
                  </Typography>
                  <Box sx={chequeDatePickerBoxSx}>
                    <DatePicker
                      value={clearDate}
                      onChange={(d) => setClearDate(d && !Array.isArray(d) ? (d as DateObject) : null)}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-center"
                      zIndex={CHEQUE_DATE_PICKER_Z}
                      portal
                      placeholder="تاریخ وصول"
                      className="rmdp-mobile"
                      containerStyle={{ width: "100%" }}
                      style={{ width: "100%", height: 40, borderRadius: 8 }}
                    />
                  </Box>
                </>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", gap: 1, pb: 2 }}>
            <Button
              onClick={() => {
                setClearCheques([]);
                setClearChequeId("");
              }}
              disabled={clearingCheque}
              sx={{ color: "var(--admin-text)" }}
            >
              انصراف
            </Button>
            <Button
              variant="contained"
              disabled={clearingCheque || clearAccountId === "" || clearChequeId === ""}
              onClick={() => {
                void (async () => {
                  if (clearChequeId === "" || clearAccountId === "") return;
                  setClearingCheque(true);
                  try {
                    const body: Record<string, unknown> = { shop_account_id: clearAccountId };
                    const payload = dateObjectToPayload(clearDate);
                    if (payload) body.clear_date = payload;
                    const res = await FetchWithJwtClient("POST", `/api/cheques/${clearChequeId}/clear`, body);
                    if (res?.hasError) {
                      toast.error(getApiErrorMessage(res, "خطا در وصول چک"));
                      return;
                    }
                    toast.success(typeof res?.message === "string" ? res.message : "چک وصول شد و از حساب کسر شد");
                    setClearCheques([]);
                    setClearChequeId("");
                    await fetchExpenses();
                  } finally {
                    setClearingCheque(false);
                  }
                })();
              }}
              sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
              startIcon={clearingCheque ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              تایید وصول
            </Button>
          </DialogActions>
        </Dialog>

        <DocumentPaymentSettleDialog
          open={!!settleExpense}
          kind="expense"
          documentId={settleExpense?.id ?? null}
          remainingAmount={documentCreditRemaining(settleExpense)}
          onClose={() => setSettleExpense(null)}
          onSuccess={() => {
            setSettleExpense(null);
            void fetchExpenses();
          }}
        />

        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
