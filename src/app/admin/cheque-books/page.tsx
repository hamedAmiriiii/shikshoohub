"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";
import {
  chequeBookLabel,
  chequeBookUnusedCount,
  type ChequeBook,
  type ChequeBookLeaf,
} from "@/app/lib/chequeBooks";
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
    bgcolor: "var(--admin-surface)",
    color: "var(--admin-text)",
    borderRadius: "8px",
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
};

type FormState = {
  title: string;
  bankName: string;
  shopAccountId: number | "";
  startNumber: string;
  endNumber: string;
  leafCount: string;
  note: string;
};

const emptyForm = (): FormState => ({
  title: "",
  bankName: "",
  shopAccountId: "",
  startNumber: "",
  endNumber: "",
  leafCount: "",
  note: "",
});

function digitsOnly(value: string): string {
  return value.replace(/[^\d۰-۹٠-٩]/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export default function ChequeBooksPage() {
  const [books, setBooks] = useState<ChequeBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [detailBook, setDetailBook] = useState<ChequeBook | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadBooks = useCallback(async () => {
    const token = tokenCode();
    if (!token) return;
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/cheque-books", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "بارگذاری دسته چک‌ها ناموفق بود"));
        setBooks([]);
        return;
      }
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setBooks(list as ChequeBook[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  const computedLeafCount = useMemo(() => {
    const start = Number(digitsOnly(form.startNumber));
    const end = Number(digitsOnly(form.endNumber));
    if (Number.isFinite(start) && Number.isFinite(end) && start > 0 && end >= start) {
      return end - start + 1;
    }
    return 0;
  }, [form.startNumber, form.endNumber]);

  const openCreate = () => {
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const saveBook = async () => {
    const start = digitsOnly(form.startNumber);
    const end = digitsOnly(form.endNumber);
    if (!start || !end) {
      toast.error("شماره شروع و پایان را وارد کنید");
      return;
    }
    const token = tokenCode();
    if (!token) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        start_number: start,
        end_number: end,
      };
      if (form.title.trim()) body.title = form.title.trim();
      if (form.bankName.trim()) body.bank_name = form.bankName.trim();
      if (form.shopAccountId !== "") body.shop_account_id = form.shopAccountId;
      if (form.note.trim()) body.note = form.note.trim();
      if (computedLeafCount > 0) body.leaf_count = computedLeafCount;
      else if (digitsOnly(form.leafCount)) body.leaf_count = digitsOnly(form.leafCount);

      const res = await FetchWithJwtClient("POST", "/api/cheque-books", token, {}, { body: JSON.stringify(body) });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت دسته چک ناموفق بود"));
        return;
      }
      toast.success("دسته چک ثبت شد");
      setDialogOpen(false);
      await loadBooks();
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (book: ChequeBook) => {
    if (!window.confirm(`دسته چک «${chequeBookLabel(book)}» حذف شود؟`)) return;
    const token = tokenCode();
    if (!token) return;
    const res = await FetchWithJwtClient("DELETE", `/api/cheque-books/${book.id}`, token);
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "حذف ناموفق بود"));
      return;
    }
    toast.success("حذف شد");
    await loadBooks();
  };

  const openDetail = async (book: ChequeBook) => {
    const token = tokenCode();
    if (!token) return;
    setDetailLoading(true);
    setDetailBook(book);
    try {
      const res = await FetchWithJwtClient("GET", `/api/cheque-books/${book.id}`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "بارگذاری برگه‌ها ناموفق بود"));
        return;
      }
      setDetailBook(res as ChequeBook);
    } finally {
      setDetailLoading(false);
    }
  };

  const voidLeaf = async (leaf: ChequeBookLeaf) => {
    if (!detailBook) return;
    if (!window.confirm(`برگه ${leaf.leaf_number} باطل شود؟`)) return;
    const token = tokenCode();
    if (!token) return;
    const res = await FetchWithJwtClient(
      "POST",
      `/api/cheque-books/${detailBook.id}/leaves/${leaf.id}/void`,
      token,
    );
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "ابطال برگه ناموفق بود"));
      return;
    }
    toast.success("برگه باطل شد");
    await openDetail(detailBook);
    await loadBooks();
  };

  return (
    <Box sx={adminPageSx}>
      <ToastContainer position="top-center" rtl autoClose={2500} />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--admin-text)" }}>دسته چک</Typography>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mt: 0.25 }}>
            بازه شماره برگه‌ها را ثبت کنید؛ موقع پرداخت چکی می‌توانید از برگه آزاد استفاده کنید یا مثل قبل شماره را دستی بزنید.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton onClick={() => void loadBooks()} aria-label="بروزرسانی">
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ ...adminButtonStartIconSx, backgroundColor: "var(--admin-accent)" }}
          >
            دسته چک جدید
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : books.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "var(--admin-surface)" }}>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>
            هنوز دسته چکی ندارید. با «دسته چک جدید» بازه شماره برگه‌ها را ثبت کنید.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: "var(--admin-surface)", borderRadius: "12px" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <StyledTableCell align="right">عنوان</StyledTableCell>
                <StyledTableCell align="center">بانک</StyledTableCell>
                <StyledTableCell align="center">از</StyledTableCell>
                <StyledTableCell align="center">تا</StyledTableCell>
                <StyledTableCell align="center">برگه</StyledTableCell>
                <StyledTableCell align="center">آزاد</StyledTableCell>
                <StyledTableCell align="center">عملیات</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.map((book) => (
                <StyledTableRow key={book.id}>
                  <StyledTableCell align="right">{chequeBookLabel(book)}</StyledTableCell>
                  <StyledTableCell align="center">{book.bank_name || "—"}</StyledTableCell>
                  <StyledTableCell align="center">{book.start_number}</StyledTableCell>
                  <StyledTableCell align="center">{book.end_number}</StyledTableCell>
                  <StyledTableCell align="center">{book.leaf_count}</StyledTableCell>
                  <StyledTableCell align="center">
                    <Chip
                      size="small"
                      label={chequeBookUnusedCount(book)}
                      sx={{
                        height: 22,
                        fontSize: 11,
                        bgcolor: chequeBookUnusedCount(book) > 0 ? "rgba(120,181,104,0.2)" : "rgba(239,83,80,0.15)",
                        color: "var(--admin-text)",
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <IconButton size="small" onClick={() => void openDetail(book)} aria-label="برگه‌ها">
                      <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => void deleteBook(book)}
                      disabled={Number(book.used_count ?? book.used_leaves_count ?? 0) > 0}
                      aria-label="حذف"
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18, color: "var(--admin-error-soft)" }} />
                    </IconButton>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>ثبت دسته چک</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.25, pt: "12px !important" }}>
          <TextField
            size="small"
            label="عنوان (اختیاری)"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            sx={fieldSx}
          />
          <TextField
            size="small"
            label="نام بانک"
            value={form.bankName}
            onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
            sx={fieldSx}
          />
          <ShopAccountSelect
            value={form.shopAccountId}
            onChange={(shopAccountId) => setForm((p) => ({ ...p, shopAccountId }))}
            compact
            helperText="اختیاری — حساب مرتبط با این دسته"
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
            <TextField
              size="small"
              label="از شماره"
              value={form.startNumber}
              onChange={(e) => setForm((p) => ({ ...p, startNumber: digitsOnly(e.target.value) }))}
              inputMode="numeric"
              sx={fieldSx}
            />
            <TextField
              size="small"
              label="تا شماره"
              value={form.endNumber}
              onChange={(e) => {
                const endNumber = digitsOnly(e.target.value);
                setForm((p) => ({ ...p, endNumber }));
              }}
              inputMode="numeric"
              sx={fieldSx}
            />
            <TextField
              size="small"
              label="تعداد برگه"
              value={computedLeafCount > 0 ? String(computedLeafCount) : form.leafCount}
              onChange={(e) => setForm((p) => ({ ...p, leafCount: digitsOnly(e.target.value) }))}
              disabled={computedLeafCount > 0}
              helperText={computedLeafCount > 0 ? "از بازه محاسبه شد" : undefined}
              inputMode="numeric"
              sx={fieldSx}
            />
          </Box>
          <TextField
            size="small"
            label="توضیح (اختیاری)"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            multiline
            minRows={2}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 1.5, py: 1 }}>
          <Button size="small" onClick={() => setDialogOpen(false)}>
            انصراف
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={saving}
            onClick={() => void saveBook()}
            sx={{ backgroundColor: "var(--admin-accent)" }}
          >
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detailBook} onClose={() => setDetailBook(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>
          برگه‌های {detailBook ? chequeBookLabel(detailBook) : ""}
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell align="center">شماره</StyledTableCell>
                    <StyledTableCell align="center">وضعیت</StyledTableCell>
                    <StyledTableCell align="center">عملیات</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailBook?.leaves || []).map((leaf) => (
                    <StyledTableRow key={leaf.id}>
                      <StyledTableCell align="center">{leaf.leaf_number}</StyledTableCell>
                      <StyledTableCell align="center">{leaf.status_label || leaf.status}</StyledTableCell>
                      <StyledTableCell align="center">
                        {leaf.status === "unused" ? (
                          <Button size="small" onClick={() => void voidLeaf(leaf)}>
                            ابطال
                          </Button>
                        ) : (
                          "—"
                        )}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setDetailBook(null)}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
