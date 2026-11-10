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
import PeopleIcon from "@mui/icons-material/People";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { formatBeneficiaryAmount } from "@/app/lib/beneficiaries";
import { gregorianApiDateFromDateObject, parseAccessEndToDateObject } from "@/app/lib/shopAccess";
import { adminPageSx } from "@/app/admin/theme/adminTheme";

type PersonRole = "all" | "buyer" | "beneficiary";

type ShopPerson = {
  id: number | null;
  name: string | null;
  phone: string;
  birth_date: string | null;
  purchase_count: number;
  purchase_total: number;
  invoice_count: number;
  expense_count: number;
  is_buyer: boolean;
  is_beneficiary: boolean;
};

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
} as const;

const cellSx = {
  color: "var(--admin-text)",
  fontSize: 12,
  py: 0.9,
  px: 1.25,
  textAlign: "center",
  whiteSpace: "nowrap",
} as const;

const roles: { id: PersonRole; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "buyer", label: "خریدار" },
  { id: "beneficiary", label: "فاکتور و هزینه" },
];

function asPeople(res: unknown): { rows: ShopPerson[]; page: number; lastPage: number; total: number } {
  const rec = res && typeof res === "object" ? (res as Record<string, unknown>) : {};
  const raw = Array.isArray(rec.data) ? rec.data : [];
  const rows = raw.map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const id = Number(row.id);
    return {
      id: Number.isFinite(id) && id > 0 ? id : null,
      name: row.name ? String(row.name) : null,
      phone: String(row.phone || ""),
      birth_date: row.birth_date ? String(row.birth_date).slice(0, 10) : null,
      purchase_count: Number(row.purchase_count) || 0,
      purchase_total: Number(row.purchase_total) || 0,
      invoice_count: Number(row.invoice_count) || 0,
      expense_count: Number(row.expense_count) || 0,
      is_buyer: Boolean(row.is_buyer),
      is_beneficiary: Boolean(row.is_beneficiary),
    };
  });
  return {
    rows,
    page: Number(rec.current_page) || 1,
    lastPage: Number(rec.last_page) || 1,
    total: Number(rec.total) || rows.length,
  };
}

export default function ShopPeoplePage() {
  const router = useRouter();
  const [rows, setRows] = useState<ShopPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<PersonRole>("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<ShopPerson | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState<DateObject | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = tokenCode();
      const res = await FetchWithJwtClient("GET", "/api/shop-people", token, {
        q: query.trim(),
        role,
        page,
        per_page: 30,
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت اشخاص"));
        setRows([]);
        return;
      }
      const parsed = asPeople(res);
      setRows(parsed.rows);
      setLastPage(parsed.lastPage);
      setTotal(parsed.total);
    } catch {
      toast.error("خطا در دریافت اشخاص");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [query, role, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 280);
    return () => clearTimeout(timer);
  }, [load]);

  const openEdit = (person: ShopPerson) => {
    setEditing(person);
    setName(person.name || "");
    setPhone(person.phone);
    setBirth(parseAccessEndToDateObject(person.birth_date));
  };

  const save = async () => {
    if (!editing) return;
    const nextPhone = phone
      .trim()
      .replace(/[۰-۹]/g, (ch) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(ch)))
      .replace(/[٠-٩]/g, (ch) => String("٠١٢٣٤٥٦٧٨٩".indexOf(ch)));
    if (!/^09\d{9}$/.test(nextPhone)) {
      toast.error("شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد");
      return;
    }
    setSaving(true);
    try {
      const res = await FetchWithJwtClient("PUT", "/api/shop-people", {
        phone: editing.phone,
        new_phone: nextPhone,
        name: name.trim(),
        birth_date: gregorianApiDateFromDateObject(birth) || null,
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره مشخصات ناموفق بود"));
        return;
      }
      toast.success("مشخصات شخص ذخیره شد");
      setEditing(null);
      void load();
    } catch {
      toast.error("خطا در ذخیره مشخصات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.25, md: 2 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.25, md: 2 } }}>
        <Box sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 0.75 }}>
          <PeopleIcon sx={{ fontSize: 20, color: "var(--admin-accent)" }} />
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "var(--admin-text)" }}>اشخاص</Typography>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
            {total.toLocaleString("fa-IR")} نفر
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 1.5 }}>
          کسانی که از فروشگاه خرید کرده‌اند، یا فاکتور و هزینه به نامشان ثبت شده است.
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", mb: 1.5 }}>
          <TextField
            size="small"
            label="جستجو نام یا موبایل"
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            sx={{ ...fieldSx, minWidth: { xs: "100%", sm: 260 } }}
          />
          {roles.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              size="small"
              onClick={() => {
                setPage(1);
                setRole(item.id);
              }}
              sx={{
                color: role === item.id ? "#0b1f18" : "var(--admin-text)",
                backgroundColor: role === item.id ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                border: "1px solid var(--admin-border)",
              }}
            />
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : rows.length === 0 ? (
          <Card sx={{ backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: "10px" }}>
            <CardContent>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, textAlign: "center" }}>
                شخصی یافت نشد
              </Typography>
            </CardContent>
          </Card>
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
                  {["ردیف", "شخص", "نقش", "خرید از ما", "فاکتور", "هزینه", ""].map((label) => (
                    <TableCell key={label || "act"} sx={{ ...cellSx, fontWeight: 600, backgroundColor: "var(--admin-surface-alt)" }}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={`${row.phone}-${row.id || "x"}`}
                    sx={{
                      backgroundColor: "var(--admin-surface)",
                      "&:nth-of-type(even)": { backgroundColor: "var(--admin-surface-alt)" },
                    }}
                  >
                    <TableCell sx={cellSx}>{(page - 1) * 30 + index + 1}</TableCell>
                    <TableCell sx={cellSx}>
                      <Box sx={{ fontWeight: 700 }}>{row.name || "بدون نام"}</Box>
                      <Box sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>{row.phone}</Box>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center", flexWrap: "wrap" }}>
                        {row.is_buyer ? (
                          <Chip
                            label="خریدار"
                            size="small"
                            onClick={() => router.push(`/admin/purchas/customer/${row.phone}`)}
                            sx={{ height: 22, fontSize: 11, color: "var(--admin-accent)", borderColor: "var(--admin-accent)" }}
                            variant="outlined"
                          />
                        ) : null}
                        {row.invoice_count > 0 && row.id ? (
                          <Chip
                            label="فاکتور"
                            size="small"
                            onClick={() => router.push(`/admin/beneficiaries/${row.id}`)}
                            sx={{ height: 22, fontSize: 11 }}
                            variant="outlined"
                          />
                        ) : null}
                        {row.expense_count > 0 && row.id ? (
                          <Chip
                            label="هزینه"
                            size="small"
                            onClick={() => router.push(`/admin/beneficiaries/${row.id}`)}
                            sx={{ height: 22, fontSize: 11 }}
                            variant="outlined"
                          />
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      {row.is_buyer
                        ? `${row.purchase_count.toLocaleString("fa-IR")} خرید · ${formatBeneficiaryAmount(row.purchase_total)}`
                        : "—"}
                    </TableCell>
                    <TableCell sx={cellSx}>{row.invoice_count ? row.invoice_count.toLocaleString("fa-IR") : "—"}</TableCell>
                    <TableCell sx={cellSx}>{row.expense_count ? row.expense_count.toLocaleString("fa-IR") : "—"}</TableCell>
                    <TableCell sx={cellSx}>
                      <Button size="small" onClick={() => openEdit(row)} sx={{ color: "var(--admin-accent)", minWidth: 0 }}>
                        ویرایش
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {lastPage > 1 ? (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 1.5 }}>
            <Button size="small" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} sx={{ color: "var(--admin-text)" }}>
              قبلی
            </Button>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", alignSelf: "center" }}>
              {page.toLocaleString("fa-IR")} از {lastPage.toLocaleString("fa-IR")}
            </Typography>
            <Button size="small" disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)} sx={{ color: "var(--admin-text)" }}>
              بعدی
            </Button>
          </Box>
        ) : null}

        <Dialog
          open={Boolean(editing)}
          onClose={() => (saving ? undefined : setEditing(null))}
          fullWidth
          maxWidth="xs"
          PaperProps={{ sx: { backgroundColor: "var(--admin-surface)", color: "var(--admin-text)" } }}
        >
          <DialogTitle sx={{ fontSize: 16 }}>ویرایش شخص</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "8px !important" }}>
            <TextField size="small" label="نام" value={name} onChange={(e) => setName(e.target.value)} sx={fieldSx} />
            <TextField size="small" label="موبایل" value={phone} onChange={(e) => setPhone(e.target.value)} sx={fieldSx} />
            <Box>
              <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)", mb: 0.5 }}>تاریخ تولد</Typography>
              <DatePicker
                value={birth}
                onChange={(value) => setBirth(value && !Array.isArray(value) ? value : null)}
                calendar={persian}
                locale={persian_fa}
                calendarPosition="bottom-right"
                placeholder="اختیاری"
                containerStyle={{ width: "100%" }}
                style={{ width: "100%", height: 40, borderRadius: 8 }}
              />
            </Box>
            <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
              با تغییر موبایل، خریدهای همین شخص به شماره جدید وصل می‌شود.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
              انصراف
            </Button>
            <Button onClick={() => void save()} disabled={saving} sx={{ color: "var(--admin-accent)" }}>
              {saving ? "در حال ذخیره" : "ذخیره"}
            </Button>
          </DialogActions>
        </Dialog>
        <ToastContainer autoClose={3000} position="bottom-right" />
      </Container>
    </Box>
  );
}
