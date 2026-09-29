"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Switch,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import {
  AccountingTableCell,
  AccountingTableRow,
  accountingButtonSx,
  accountingFieldSx,
  accountingPaginationSx,
} from "@/app/admin/accounting/ui";
import {
  assignMoadianSstid,
  deleteMoadianStuffId,
  fetchMoadianProducts,
  fetchMoadianStuffIds,
  saveMoadianStuffId,
  type MoadianProductRow,
  type MoadianStuffId,
} from "@/app/lib/moadian";

type StuffForm = {
  id?: number;
  sstid: string;
  title: string;
  vat_rate: string;
  other_tax_rate: string;
  other_tax_subject: string;
  unit_code: string;
};

const emptyForm: StuffForm = { sstid: "", title: "", vat_rate: "10", other_tax_rate: "0", other_tax_subject: "", unit_code: "" };

const toLatinDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const unitLabel = (u: string | null) => (u === "kg" ? "کیلوگرم" : u === "meter" ? "متر" : "عدد");

export default function MoadianStuffTab({ onChanged }: { onChanged: () => void }) {
  const [stuff, setStuff] = useState<MoadianStuffId[]>([]);
  const [stuffLoading, setStuffLoading] = useState(true);
  const [form, setForm] = useState<StuffForm | null>(null);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<MoadianProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [missingOnly, setMissingOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [assignSstid, setAssignSstid] = useState("");

  const loadStuff = useCallback(async () => {
    setStuffLoading(true);
    try {
      setStuff(await fetchMoadianStuffIds());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت شناسه‌ها");
    } finally {
      setStuffLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetchMoadianProducts({ page, missing: missingOnly, search: appliedSearch });
      setProducts(res.data);
      setLastPage(Math.max(1, res.last_page));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت کالاها");
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [page, missingOnly, appliedSearch]);

  useEffect(() => {
    loadStuff();
  }, [loadStuff]);

  useEffect(() => {
    loadProducts();
    setSelected([]);
  }, [loadProducts]);

  const saveForm = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const msg = await saveMoadianStuffId(
        {
          sstid: toLatinDigits(form.sstid.trim()),
          title: form.title.trim(),
          vat_rate: Number(toLatinDigits(form.vat_rate)) || 0,
          other_tax_rate: Number(toLatinDigits(form.other_tax_rate)) || 0,
          other_tax_subject: form.other_tax_subject.trim() || null,
          unit_code: toLatinDigits(form.unit_code.trim()) || null,
        },
        form.id,
      );
      toast.success(msg);
      setForm(null);
      await loadStuff();
      await loadProducts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ذخیره شناسه");
    } finally {
      setSaving(false);
    }
  };

  const removeStuff = async (row: MoadianStuffId) => {
    if (!window.confirm(`شناسه «${row.title}» حذف شود؟`)) return;
    try {
      toast.success(await deleteMoadianStuffId(row.id));
      await loadStuff();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در حذف شناسه");
    }
  };

  const assign = async (clear = false) => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      toast.success(await assignMoadianSstid(selected, clear ? null : assignSstid));
      setSelected([]);
      await loadProducts();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ذخیره شناسه کالا");
    } finally {
      setSaving(false);
    }
  };

  const stuffTitle = (sstid: string | null) => {
    if (!sstid) return "—";
    const row = stuff.find((s) => s.sstid === sstid);
    return row ? `${row.title} (${sstid})` : sstid;
  };

  const allSelected = products.length > 0 && products.every((p) => selected.includes(p.id));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, color: "var(--admin-text)" }}>شناسه‌های کالا/خدمت فروشگاه</Typography>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
              شناسهٔ ۱۳ رقمی را از سامانهٔ stuffid.tax.gov.ir بگیرید. نرخ مالیات هر شناسه روی کالاهای آن اعمال می‌شود.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setForm({ ...emptyForm })} sx={accountingButtonSx}>
            شناسه جدید
          </Button>
        </Box>
        {stuffLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : stuff.length === 0 ? (
          <Typography sx={{ color: "var(--admin-text-muted)", py: 2, fontSize: 13 }}>هنوز شناسه‌ای ثبت نشده است.</Typography>
        ) : (
          <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <AccountingTableCell>عنوان</AccountingTableCell>
                  <AccountingTableCell>شناسه</AccountingTableCell>
                  <AccountingTableCell align="left">نرخ مالیات</AccountingTableCell>
                  <AccountingTableCell align="left">نرخ عوارض</AccountingTableCell>
                  <AccountingTableCell>کد واحد</AccountingTableCell>
                  <AccountingTableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {stuff.map((row) => (
                  <AccountingTableRow key={row.id}>
                    <AccountingTableCell>{row.title}</AccountingTableCell>
                    <AccountingTableCell sx={{ direction: "ltr", fontFamily: "monospace" }}>{row.sstid}</AccountingTableCell>
                    <AccountingTableCell align="left">{row.vat_rate}٪</AccountingTableCell>
                    <AccountingTableCell align="left">{row.other_tax_rate ? `${row.other_tax_rate}٪` : "—"}</AccountingTableCell>
                    <AccountingTableCell>{row.unit_code || "—"}</AccountingTableCell>
                    <AccountingTableCell align="left">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setForm({
                            id: row.id,
                            sstid: row.sstid,
                            title: row.title,
                            vat_rate: String(row.vat_rate),
                            other_tax_rate: String(row.other_tax_rate || 0),
                            other_tax_subject: row.other_tax_subject || "",
                            unit_code: row.unit_code || "",
                          })
                        }
                        sx={{ color: "var(--admin-text-muted)" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => removeStuff(row)} sx={{ color: "var(--admin-text-muted)" }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </AccountingTableCell>
                  </AccountingTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Box>
        <Typography sx={{ fontWeight: 700, color: "var(--admin-text)", mb: 1 }}>اختصاص شناسه به کالاها</Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", mb: 1.5 }}>
          <TextField
            size="small"
            label="جستجوی نام یا بارکد"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setAppliedSearch(search.trim());
                setPage(1);
              }
            }}
            onBlur={() => {
              if (search.trim() !== appliedSearch) {
                setAppliedSearch(search.trim());
                setPage(1);
              }
            }}
            sx={{ minWidth: 220, ...accountingFieldSx }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={missingOnly}
                onChange={(e) => {
                  setMissingOnly(e.target.checked);
                  setPage(1);
                }}
                sx={{ "& .Mui-checked": { color: "var(--admin-accent)" }, "& .Mui-checked + .MuiSwitch-track": { bgcolor: "var(--admin-accent)" } }}
              />
            }
            label={<Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>فقط کالاهای بدون شناسه</Typography>}
          />
          <Box sx={{ flex: 1 }} />
          <FormControl size="small" sx={{ minWidth: 220, ...accountingFieldSx }}>
            <InputLabel>شناسه برای انتخاب‌شده‌ها</InputLabel>
            <Select label="شناسه برای انتخاب‌شده‌ها" value={assignSstid} onChange={(e) => setAssignSstid(e.target.value)}>
              {stuff.map((s) => (
                <MenuItem key={s.id} value={s.sstid}>
                  {s.title} ({s.sstid})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => assign(false)} disabled={saving || selected.length === 0 || !assignSstid} sx={accountingButtonSx}>
            اختصاص ({new Intl.NumberFormat("fa-IR").format(selected.length)})
          </Button>
          <Button
            variant="outlined"
            onClick={() => assign(true)}
            disabled={saving || selected.length === 0}
            sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
          >
            حذف شناسه
          </Button>
        </Box>

        {productsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : products.length === 0 ? (
          <Typography sx={{ color: "var(--admin-text-muted)", py: 2, fontSize: 13 }}>
            {missingOnly ? "همهٔ کالاها شناسه دارند." : "کالایی یافت نشد."}
          </Typography>
        ) : (
          <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <AccountingTableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      indeterminate={!allSelected && selected.length > 0}
                      onChange={(e) => setSelected(e.target.checked ? products.map((p) => p.id) : [])}
                    />
                  </AccountingTableCell>
                  <AccountingTableCell>کالا</AccountingTableCell>
                  <AccountingTableCell>بارکد</AccountingTableCell>
                  <AccountingTableCell>واحد</AccountingTableCell>
                  <AccountingTableCell>شناسه کالا/خدمت</AccountingTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => {
                  const checked = selected.includes(p.id);
                  return (
                    <AccountingTableRow
                      key={p.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => setSelected((prev) => (checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]))}
                    >
                      <AccountingTableCell padding="checkbox">
                        <Checkbox size="small" checked={checked} />
                      </AccountingTableCell>
                      <AccountingTableCell>{p.name}</AccountingTableCell>
                      <AccountingTableCell sx={{ direction: "ltr" }}>{p.barcode || "—"}</AccountingTableCell>
                      <AccountingTableCell>{unitLabel(p.unit_type)}</AccountingTableCell>
                      <AccountingTableCell>{stuffTitle(p.moadian_sstid)}</AccountingTableCell>
                    </AccountingTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {lastPage > 1 ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination count={lastPage} page={page} onChange={(_e, v) => setPage(v)} size="small" sx={accountingPaginationSx} />
          </Box>
        ) : null}
      </Box>

      <Dialog open={form !== null} onClose={() => setForm(null)} maxWidth="xs" fullWidth dir="rtl">
        {form ? (
          <>
            <DialogTitle>{form.id ? "ویرایش شناسه" : "شناسه کالا/خدمت جدید"}</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "12px !important" }}>
              <TextField
                size="small"
                label="شناسه ۱۳ رقمی"
                value={form.sstid}
                onChange={(e) => setForm({ ...form, sstid: e.target.value })}
                inputProps={{ dir: "ltr", maxLength: 13, inputMode: "numeric" }}
                sx={accountingFieldSx}
              />
              <TextField size="small" label="عنوان" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} sx={accountingFieldSx} />
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  label="نرخ مالیات ارزش افزوده (٪)"
                  value={form.vat_rate}
                  onChange={(e) => setForm({ ...form, vat_rate: e.target.value })}
                  inputProps={{ dir: "ltr", inputMode: "decimal" }}
                  sx={{ flex: 1, ...accountingFieldSx }}
                />
                <TextField
                  size="small"
                  label="نرخ عوارض (٪)"
                  value={form.other_tax_rate}
                  onChange={(e) => setForm({ ...form, other_tax_rate: e.target.value })}
                  inputProps={{ dir: "ltr", inputMode: "decimal" }}
                  sx={{ flex: 1, ...accountingFieldSx }}
                />
              </Box>
              <TextField
                size="small"
                label="موضوع عوارض (اختیاری)"
                value={form.other_tax_subject}
                onChange={(e) => setForm({ ...form, other_tax_subject: e.target.value })}
                sx={accountingFieldSx}
              />
              <TextField
                size="small"
                label="کد واحد اندازه‌گیری (اختیاری)"
                value={form.unit_code}
                onChange={(e) => setForm({ ...form, unit_code: e.target.value })}
                inputProps={{ dir: "ltr" }}
                helperText="اگر خالی باشد، کد واحد از تنظیمات (عدد/کیلوگرم/متر) خوانده می‌شود."
                sx={accountingFieldSx}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setForm(null)} sx={{ color: "var(--admin-text)" }}>
                انصراف
              </Button>
              <Button variant="contained" onClick={saveForm} disabled={saving} sx={accountingButtonSx}>
                ذخیره
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}
