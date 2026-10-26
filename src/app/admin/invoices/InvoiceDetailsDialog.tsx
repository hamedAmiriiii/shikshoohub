"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
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
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { toast } from "react-toastify";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import {
  formatAmountInput,
  formatAmountNumber,
  parseAmountInput,
} from "@/app/lib/amountInput";
import { adminButtonStartIconSx } from "@/app/admin/theme/adminTheme";
import PayrollConfirmDialog from "@/app/admin/payroll/PayrollConfirmDialog";
import { beneficiaryFromRecord, formatBeneficiaryLabel } from "@/app/lib/beneficiaries";
import { DocumentPaymentBreakdownView, documentNeedsSettle } from "@/app/admin/DocumentPaymentBadge";
import DocumentPaymentSettleDialog from "@/app/admin/DocumentPaymentSettleDialog";
import { documentCreditRemaining, type DocumentPaymentFields } from "@/app/lib/documentPayments";
import {
  ADMIN_POS_SETTINGS_CHANGED_EVENT,
  readAdminPosSettings,
} from "@/app/lib/adminPosSettings";

export type InvoiceItem = {
  id?: number;
  title?: string | null;
  unit_price?: number | string | null;
  quantity?: number | string | null;
  total?: number | string | null;
};

export type InvoiceRecord = DocumentPaymentFields & {
  id: number;
  amount: number;
  title: string;
  description?: string;
  date: string;
  user_name: string;
  shop_account_id?: number | null;
  shop_account?: { id: number; name?: string } | null;
  beneficiary_id?: number | null;
  user_shiksho_id?: number | null;
  beneficiary?: { id?: number | null; name?: string | null; phone?: string | null } | null;
  items?: InvoiceItem[] | null;
  items_count?: number;
  image_url?: string | null;
  has_items?: boolean;
  amount_source?: "items" | "manual" | string;
};

/** فاکتور آیتم‌دار: مبلغ فقط از مجموع آیتم‌هاست و فیلد مبلغ کلی نباید فرستاده شود */
export function invoiceUsesItemAmount(invoice?: InvoiceRecord | null): boolean {
  if (!invoice) return false;
  if (invoice.amount_source === "items" || invoice.has_items === true) return true;
  if (invoice.amount_source === "manual" || invoice.has_items === false) return false;
  if (Array.isArray(invoice.items) && invoice.items.length > 0) return true;
  return (Number(invoice.items_count) || 0) > 0;
}

type RegisteredProduct = {
  id?: number;
  name: string;
  barcode: string;
};

type DraftItem = {
  key: string;
  title: string;
  unitPrice: string;
  quantity: string;
  barcode: string;
  purchasePrice: string;
  registered?: RegisteredProduct | null;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    backgroundColor: "var(--admin-surface)",
    minHeight: 30,
    fontSize: 12,
    borderRadius: "8px",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputBase-input": { py: "5px", px: 1, fontSize: 12 },
} as const;

const StyledTableCell = styled(TableCell)({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    fontWeight: 800,
    fontSize: 12,
    padding: "9px 8px",
    whiteSpace: "nowrap",
    textAlign: "center",
    borderBottom: "1px solid var(--admin-border)",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 12,
    padding: "6px 8px",
    textAlign: "center",
    borderBottom: "1px solid var(--admin-border)",
    verticalAlign: "middle",
  },
});

const StyledTableRow = styled(TableRow)({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": {
    backgroundColor: "var(--admin-surface-alt)",
  },
  "&:last-child td, &:last-child th": { borderBottom: 0 },
});

function newDraftKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyDraft(): DraftItem {
  return { key: newDraftKey(), title: "", unitPrice: "", quantity: "", barcode: "", purchasePrice: "" };
}

function parseQuantityInput(value: string): number {
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/٬/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\s/g, "")
    .replace(/[^\d.]/g, "");
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return parseAmountInput(String(value ?? ""));
}

function extractInvoice(res: any, fallback: InvoiceRecord): InvoiceRecord {
  if (!res || res.hasError) return fallback;
  const candidate = res.data ?? res.invoice ?? res;
  if (Array.isArray(candidate)) {
    const found = candidate.find((row) => row && row.id === fallback.id);
    return found ? { ...fallback, ...found } : fallback;
  }
  if (candidate && typeof candidate === "object" && candidate.id != null) {
    return { ...fallback, ...candidate };
  }
  return fallback;
}

function draftsFromInvoice(invoice: InvoiceRecord): DraftItem[] {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  return items.map((item) => {
    const unitPrice = toNumber(item.unit_price);
    const quantity = toNumber(item.quantity);
    return {
      key: String(item.id ?? newDraftKey()),
      title: String(item.title ?? ""),
      unitPrice: unitPrice > 0 ? formatAmountNumber(unitPrice) : "",
      quantity: quantity > 0 ? String(quantity) : "",
      barcode: "",
      purchasePrice: unitPrice > 0 ? formatAmountNumber(unitPrice) : "",
    };
  });
}

function HeaderMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", mb: 0.2 }}>{label}</Typography>
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--admin-text)",
          lineHeight: 1.45,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

type Props = {
  open: boolean;
  invoice: InvoiceRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function InvoiceDetailsDialog({
  open,
  invoice,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [originalHadItems, setOriginalHadItems] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState(0);
  const [confirmMismatchOpen, setConfirmMismatchOpen] = useState(false);
  const [record, setRecord] = useState<InvoiceRecord | null>(null);
  const [settleOpen, setSettleOpen] = useState(false);
  const [productEntryEnabled, setProductEntryEnabled] = useState(false);
  const [afterMismatch, setAfterMismatch] = useState<"save" | "register">("save");
  const titleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const focusKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const sync = () => setProductEntryEnabled(Boolean(readAdminPosSettings().invoiceProductEntryEnabled));
    sync();
    window.addEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!open || !invoice) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      let full = invoice;
      const token = tokenCode();
      if (token) {
        const res = await FetchWithJwtClient("GET", `/api/invoices/${invoice.id}`, token);
        if (!cancelled) {
          full = extractInvoice(res, invoice);
        }
      }

      if (cancelled) return;
      const loadedItems = draftsFromInvoice(full);
      setDrafts(loadedItems.length > 0 ? loadedItems : [emptyDraft()]);
      setOriginalHadItems(loadedItems.length > 0);
      setInvoiceAmount(toNumber(full.amount));
      setRecord(full);
      setConfirmMismatchOpen(false);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, invoice]);

  useEffect(() => {
    const key = focusKeyRef.current;
    if (!key) return;
    const input = titleInputRefs.current[key];
    if (input) {
      input.focus();
      input.select?.();
      focusKeyRef.current = null;
    }
  }, [drafts]);

  const itemsTotal = useMemo(
    () =>
      drafts.reduce((sum, row) => {
        const unitPrice = parseAmountInput(row.unitPrice);
        const quantity = parseQuantityInput(row.quantity);
        return sum + unitPrice * quantity;
      }, 0),
    [drafts]
  );

  const amountMismatch = useMemo(() => {
    const filled = drafts.some(
      (row) => row.title.trim() || parseAmountInput(row.unitPrice) > 0 || parseQuantityInput(row.quantity) > 0,
    );
    if (!filled) return false;
    return Math.round(itemsTotal) !== Math.round(invoiceAmount);
  }, [drafts, itemsTotal, invoiceAmount]);

  const updateDraft = (key: string, patch: Partial<DraftItem>) => {
    setDrafts((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const addRow = (focus = true) => {
    const draft = emptyDraft();
    if (focus) focusKeyRef.current = draft.key;
    setDrafts((prev) => [...prev, draft]);
  };

  const handleFieldEnter = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    e.preventDefault();
    e.stopPropagation();
    addRow(true);
  };

  const collectItems = () => {
    const items = drafts
      .map((row) => ({
        title: row.title.trim(),
        unit_price: parseAmountInput(row.unitPrice),
        quantity: parseQuantityInput(row.quantity),
      }))
      .filter((row) => row.title || row.unit_price > 0 || row.quantity > 0);

    for (const row of items) {
      if (!row.title || row.unit_price <= 0 || row.quantity <= 0) {
        toast.error("هر ردیف باید عنوان، فی و تعداد معتبر داشته باشد");
        return null;
      }
    }
    return items;
  };

  const saveItems = async (items: { title: string; unit_price: number; quantity: number }[]) => {
    if (!invoice) return;
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }

    try {
      setSaving(true);

      const payload: Record<string, unknown> = {};
      if (items.length > 0 || originalHadItems) {
        payload.items = items;
      }

      const hasPayload = Object.keys(payload).length > 0;

      let res: any = { hasError: false };
      if (hasPayload) {
        res = await FetchWithJwtClient("PUT", `/api/invoices/${invoice.id}`, payload);
      }
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ذخیره جزئیات فاکتور"));
        return;
      }

      toast.success("جزئیات فاکتور ذخیره شد");
      setConfirmMismatchOpen(false);
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving invoice details:", error);
      toast.error("خطا در ذخیره جزئیات فاکتور");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const items = collectItems();
    if (!items) return;
    if (items.length > 0 && Math.round(itemsTotal) !== Math.round(invoiceAmount)) {
      setAfterMismatch("save");
      setConfirmMismatchOpen(true);
      return;
    }
    await saveItems(items);
  };

  const registerProducts = async (rows: DraftItem[]) => {
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return false;
    }
    const pending = rows.filter((row) => row.title.trim() && !row.registered);
    for (const row of pending) {
      const barcode = row.barcode.trim();
      const purchasePrice = parseAmountInput(row.purchasePrice) || parseAmountInput(row.unitPrice);
      const quantity = parseQuantityInput(row.quantity);
      if (!barcode) {
        toast.error(`بارکد «${row.title.trim()}» را وارد کنید`);
        return false;
      }
      if (purchasePrice <= 0 || quantity <= 0) {
        toast.error(`قیمت خرید و تعداد «${row.title.trim()}» باید معتبر باشد`);
        return false;
      }
      const res = await FetchWithJwtClient("POST", "/api/product", {
        name: row.title.trim(),
        barcode,
        purchase_price: purchasePrice,
        sale_price: purchasePrice,
        quantity,
      });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, `ثبت کالای «${row.title.trim()}» انجام نشد`));
        return false;
      }
      const payload = res?.data && typeof res.data === "object" ? res.data : res;
      const registered: RegisteredProduct = {
        id: payload?.id ?? payload?.product?.id,
        name: String(payload?.name || row.title.trim()),
        barcode: String(payload?.barcode || barcode),
      };
      setDrafts((prev) => prev.map((item) => (item.key === row.key ? { ...item, registered } : item)));
    }
    if (pending.length > 0) {
      toast.success(pending.length === 1 ? "کالا ثبت شد" : `${pending.length} کالا ثبت شد`);
    }
    return true;
  };

  const handleRegisterAndSave = async () => {
    const items = collectItems();
    if (!items) return;
    if (items.length === 0) {
      toast.error("ردیفی برای ثبت کالا نیست");
      return;
    }
    if (Math.round(itemsTotal) !== Math.round(invoiceAmount)) {
      setAfterMismatch("register");
      setConfirmMismatchOpen(true);
      return;
    }
    setSaving(true);
    try {
      const ok = await registerProducts(drafts);
      if (!ok) return;
      await saveItems(items);
    } finally {
      setSaving(false);
    }
  };

  const display = record || invoice;
  const beneficiary = beneficiaryFromRecord(display);
  const shopAccountName =
    display?.shop_account?.name ||
    (display?.shop_account_id != null ? `حساب #${display.shop_account_id}` : "");

  return (
    <>
    <Dialog
      open={open}
      onClose={saving || confirmMismatchOpen ? undefined : onClose}
      maxWidth={productEntryEnabled ? "lg" : "md"}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "var(--admin-surface)",
          borderRadius: "18px",
          border: "1px solid var(--admin-border)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: 2.25,
          pt: 2,
          pb: 1.75,
          borderBottom: "1px solid var(--admin-border)",
          bgcolor: "var(--admin-surface-alt)",
          backgroundImage:
            "linear-gradient(180deg, rgba(120,181,104,0.08), transparent 70%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1.35 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, minWidth: 0 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(120, 181, 104, 0.16)",
                color: "var(--admin-accent)",
                flexShrink: 0,
              }}
            >
              <ReceiptLongIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 17, color: "var(--admin-text)", lineHeight: 1.3 }}>
                فاکتور خرید
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: "var(--admin-text-muted)", mt: 0.2 }}>
                {display?.title ? display.title : "بدون عنوان"}
                {display?.id != null ? ` · شماره ${formatAmountNumber(display.id)}` : ""}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: "left", flexShrink: 0 }}>
            <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>تاریخ</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--admin-text)" }}>
              {display?.date || "—"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 1.1,
            pt: 1.15,
            borderTop: "1px solid var(--admin-border)",
          }}
        >
          <HeaderMetaItem label="طرف حساب / ذینفع" value={formatBeneficiaryLabel(beneficiary) || "—"} />
          <HeaderMetaItem label="حساب پرداخت" value={shopAccountName || "—"} />
          <HeaderMetaItem
            label="شماره فاکتور"
            value={display?.id != null ? formatAmountNumber(display.id) : "—"}
          />
          <HeaderMetaItem label="عنوان سند" value={display?.title || "—"} />
        </Box>

        {display?.description ? (
          <Box sx={{ mt: 1.15, pt: 1.1, borderTop: "1px solid var(--admin-border)" }}>
            <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", mb: 0.25 }}>توضیحات</Typography>
            <Typography sx={{ fontSize: 12.5, color: "var(--admin-text)", lineHeight: 1.7 }}>
              {display.description}
            </Typography>
          </Box>
        ) : null}

        <Box sx={{ mt: 1.15, pt: 1.1, borderTop: "1px solid var(--admin-border)" }}>
          <DocumentPaymentBreakdownView doc={display} />
          {documentNeedsSettle(display) ? (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSettleOpen(true)}
              sx={{
                mt: 1,
                color: "var(--admin-accent)",
                borderColor: "var(--admin-accent-border)",
                fontSize: 12,
              }}
            >
              تسویه نسیه
            </Button>
          ) : null}
        </Box>
      </Box>

      <DialogContent sx={{ px: 2.25, py: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

            <Box
              sx={{
                borderRadius: 2.25,
                border: "1px solid var(--admin-border)",
                overflow: "hidden",
                bgcolor: "var(--admin-surface)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                  px: 1.35,
                  py: 1,
                  bgcolor: "var(--admin-surface-alt)",
                  borderBottom: "1px solid var(--admin-border)",
                }}
              >
                <Box>
                  <Typography sx={{ color: "var(--admin-text)", fontWeight: 800, fontSize: 13 }}>
                    اقلام کالا / خدمات
                  </Typography>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.15 }}>
                    Enter در هر فیلد = افزودن ردیف جدید
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => addRow(true)}
                  sx={{
                    ...adminButtonStartIconSx,
                    backgroundColor: "var(--admin-accent)",
                    fontSize: 12,
                    minHeight: 30,
                    py: 0.35,
                    borderRadius: 1.5,
                    "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
                  }}
                >
                  افزودن ردیف
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ boxShadow: "none", bgcolor: "transparent" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell align="center">ردیف</StyledTableCell>
                      <StyledTableCell align="center">شرح کالا / خدمات</StyledTableCell>
                      <StyledTableCell align="center">فی</StyledTableCell>
                      <StyledTableCell align="center">تعداد</StyledTableCell>
                      {productEntryEnabled ? <StyledTableCell align="center">بارکد</StyledTableCell> : null}
                      {productEntryEnabled ? <StyledTableCell align="center">قیمت خرید</StyledTableCell> : null}
                      <StyledTableCell align="center">مبلغ کل</StyledTableCell>
                      <StyledTableCell align="center">حذف</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drafts.map((row, index) => {
                      const lineTotal =
                        parseAmountInput(row.unitPrice) * parseQuantityInput(row.quantity);
                      return (
                        <StyledTableRow key={row.key}>
                          <StyledTableCell align="center" sx={{ width: 48, fontWeight: 700 }}>
                            {formatAmountNumber(index + 1)}
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ minWidth: 160 }}>
                            <TextField
                              size="small"
                              placeholder="شرح"
                              value={row.title}
                              onChange={(e) => updateDraft(row.key, { title: e.target.value })}
                              onKeyDown={handleFieldEnter}
                              inputRef={(el) => {
                                titleInputRefs.current[row.key] = el;
                              }}
                              fullWidth
                              sx={fieldSx}
                            />
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ width: 120 }}>
                            <TextField
                              size="small"
                              placeholder="فی"
                              type="text"
                              inputMode="numeric"
                              value={row.unitPrice}
                              onChange={(e) => {
                                const unitPrice = formatAmountInput(e.target.value);
                                updateDraft(row.key, {
                                  unitPrice,
                                  ...(row.purchasePrice ? {} : { purchasePrice: unitPrice }),
                                });
                              }}
                              onKeyDown={handleFieldEnter}
                              fullWidth
                              sx={{
                                ...fieldSx,
                                "& .MuiInputBase-input": { ...fieldSx["& .MuiInputBase-input"], textAlign: "center" },
                              }}
                            />
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ width: 88 }}>
                            <TextField
                              size="small"
                              placeholder="تعداد"
                              type="text"
                              inputMode="decimal"
                              value={row.quantity}
                              onChange={(e) => updateDraft(row.key, { quantity: e.target.value })}
                              onKeyDown={handleFieldEnter}
                              fullWidth
                              sx={{
                                ...fieldSx,
                                "& .MuiInputBase-input": { ...fieldSx["& .MuiInputBase-input"], textAlign: "center" },
                              }}
                            />
                          </StyledTableCell>
                          {productEntryEnabled ? (
                            <StyledTableCell align="center" sx={{ width: 120 }}>
                              <TextField
                                size="small"
                                placeholder="بارکد"
                                value={row.barcode}
                                onChange={(e) => updateDraft(row.key, { barcode: e.target.value })}
                                onKeyDown={handleFieldEnter}
                                fullWidth
                                sx={fieldSx}
                              />
                              {row.registered ? (
                                <Typography sx={{ color: "var(--admin-success, #2e7d32)", fontSize: 11, mt: 0.4 }}>
                                  ثبت شد: {row.registered.name}
                                  {row.registered.barcode ? ` — ${row.registered.barcode}` : ""}
                                </Typography>
                              ) : null}
                            </StyledTableCell>
                          ) : null}
                          {productEntryEnabled ? (
                            <StyledTableCell align="center" sx={{ width: 120 }}>
                              <TextField
                                size="small"
                                placeholder="قیمت خرید"
                                type="text"
                                inputMode="numeric"
                                value={row.purchasePrice}
                                onChange={(e) =>
                                  updateDraft(row.key, { purchasePrice: formatAmountInput(e.target.value) })
                                }
                                onKeyDown={handleFieldEnter}
                                fullWidth
                                sx={{
                                  ...fieldSx,
                                  "& .MuiInputBase-input": { ...fieldSx["& .MuiInputBase-input"], textAlign: "center" },
                                }}
                              />
                            </StyledTableCell>
                          ) : null}
                          <StyledTableCell align="center" sx={{ whiteSpace: "nowrap", minWidth: 100 }}>
                            <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: 13 }}>
                              {formatAmountNumber(lineTotal) || "۰"}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ width: 48 }}>
                            <IconButton
                              size="small"
                              onClick={() =>
                                setDrafts((prev) => {
                                  const next = prev.filter((item) => item.key !== row.key);
                                  return next.length > 0 ? next : [emptyDraft()];
                                })
                              }
                              sx={{ color: "#ff6b6b", p: 0.4 }}
                              aria-label="حذف ردیف"
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </StyledTableCell>
                        </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                  gap: 1,
                  px: 1.35,
                  py: 1.25,
                  borderTop: "1px solid var(--admin-border)",
                  bgcolor: "var(--admin-surface-alt)",
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.55, justifyContent: "center" }}>
                  {amountMismatch ? (
                    <Typography sx={{ color: "#e6a23c", fontSize: 12, lineHeight: 1.7 }}>
                      مجموع ردیف‌ها با مبلغ کل فاکتور یکی نیست. با تأیید ذخیره، مبلغ فاکتور به مجموع ردیف‌ها تغییر می‌کند.
                    </Typography>
                  ) : (
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                      مبالغ به تومان
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    minWidth: { sm: 240 },
                    p: 1.1,
                    borderRadius: 1.75,
                    border: "1px solid var(--admin-border)",
                    bgcolor: "var(--admin-surface)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.65,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>مبلغ ثبت‌شده فاکتور</Typography>
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 13 }}>
                      {formatAmountNumber(invoiceAmount) || "۰"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>جمع اقلام</Typography>
                    <Typography
                      sx={{
                        color: amountMismatch ? "#e6a23c" : "var(--admin-accent)",
                        fontWeight: 900,
                        fontSize: 15,
                      }}
                    >
                      {formatAmountNumber(itemsTotal) || "۰"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.25, py: 1.35, borderTop: "1px solid var(--admin-border)", gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
          انصراف
        </Button>
        {productEntryEnabled ? (
          <Button
            onClick={() => void handleRegisterAndSave()}
            variant="contained"
            disabled={loading || saving}
            sx={{
              backgroundColor: "var(--admin-success, #2e7d32)",
              "&:hover": { backgroundColor: "#1b5e20" },
            }}
          >
            {saving ? "در حال ثبت..." : "ثبت کالا و ذخیره فاکتور"}
          </Button>
        ) : null}
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || saving}
          sx={{
            backgroundColor: "var(--admin-accent)",
            fontWeight: 800,
            borderRadius: 1.75,
            "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
          }}
        >
          {saving ? "در حال ذخیره..." : "ذخیره فاکتور"}
        </Button>
      </DialogActions>
    </Dialog>

      <PayrollConfirmDialog
        open={confirmMismatchOpen}
        title="تغییر مبلغ فاکتور"
        message={`مبلغ کل فاکتور ${formatAmountNumber(invoiceAmount) || "۰"} تومان است، ولی مجموع ردیف‌ها ${formatAmountNumber(itemsTotal) || "۰"} تومان است. با تأیید، مبلغ فاکتور به مجموع ردیف‌ها تغییر می‌کند.`}
        confirmLabel="تأیید و ذخیره"
        confirmColor="warning"
        loading={saving}
        onConfirm={() => {
          const items = collectItems();
          if (!items) return;
          if (afterMismatch === "register") {
            setSaving(true);
            void (async () => {
              try {
                const ok = await registerProducts(drafts);
                if (!ok) return;
                await saveItems(items);
              } finally {
                setSaving(false);
              }
            })();
            return;
          }
          void saveItems(items);
        }}
        onCancel={() => !saving && setConfirmMismatchOpen(false)}
      />

      <DocumentPaymentSettleDialog
        open={settleOpen}
        kind="invoice"
        documentId={invoice?.id ?? null}
        remainingAmount={documentCreditRemaining(record || invoice)}
        advanceAvailable={Number((record || invoice)?.beneficiary_advance_available) || 0}
        onClose={() => setSettleOpen(false)}
        onSuccess={() => {
          setSettleOpen(false);
          onSaved();
        }}
      />
    </>
  );
}
