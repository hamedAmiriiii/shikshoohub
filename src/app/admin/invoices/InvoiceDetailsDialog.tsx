"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
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

type DraftItem = {
  key: string;
  title: string;
  unitPrice: string;
  quantity: string;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--admin-text)",
    backgroundColor: "var(--admin-surface)",
    minHeight: 30,
    fontSize: 12,
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
    fontWeight: 600,
    fontSize: 12,
    padding: "6px 8px",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  [`&.${tableCellClasses.body}`]: {
    color: "var(--admin-text)",
    fontSize: 12,
    padding: "4px 8px",
    textAlign: "center",
  },
});

const StyledTableRow = styled(TableRow)({
  backgroundColor: "var(--admin-surface)",
  "&:nth-of-type(even)": {
    backgroundColor: "var(--admin-surface-alt)",
  },
  "&:last-child td, &:last-child th": { border: 0 },
});

function newDraftKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyDraft(): DraftItem {
  return { key: newDraftKey(), title: "", unitPrice: "", quantity: "" };
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
    };
  });
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
      setDrafts(loadedItems);
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
      setConfirmMismatchOpen(true);
      return;
    }
    await saveItems(items);
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={saving || confirmMismatchOpen ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "var(--admin-surface)",
          borderRadius: "16px",
          border: "1px solid rgba(55, 84, 165, 0.3)",
        },
      }}
    >
      <DialogTitle sx={{ color: "var(--admin-text)", fontWeight: "700", fontSize: 14, py: 1.25 }}>
        جزئیات فاکتور{invoice?.title ? ` — ${invoice.title}` : ""}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "var(--admin-accent)" }} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 0.5 }}>
            {beneficiaryFromRecord(invoice) ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                ذینفع: {formatBeneficiaryLabel(beneficiaryFromRecord(invoice))}
              </Typography>
            ) : null}
            <DocumentPaymentBreakdownView doc={record || invoice} />
            {documentNeedsSettle(record || invoice) ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSettleOpen(true)}
                sx={{
                  alignSelf: "flex-start",
                  color: "var(--admin-accent)",
                  borderColor: "var(--admin-accent-border)",
                  fontSize: 12,
                }}
              >
                تسویه نسیه
              </Button>
            ) : null}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 600, fontSize: 13 }}>
                ردیف‌های فاکتور
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={() => setDrafts((prev) => [...prev, emptyDraft()])}
                sx={{
                  ...adminButtonStartIconSx,
                  backgroundColor: "var(--admin-accent)",
                  fontSize: 12,
                  minHeight: 28,
                  py: 0.25,
                  "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
                }}
              >
                افزودن ردیف
              </Button>
            </Box>

            {drafts.length === 0 ? (
              <Typography sx={{ color: "var(--admin-text-muted)", py: 2, textAlign: "center", fontSize: 12 }}>
                ردیفی ثبت نشده است
              </Typography>
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
                      <StyledTableCell align="center">ردیف</StyledTableCell>
                      <StyledTableCell align="center">عنوان</StyledTableCell>
                      <StyledTableCell align="center">فی</StyledTableCell>
                      <StyledTableCell align="center">تعداد</StyledTableCell>
                      <StyledTableCell align="center">کل</StyledTableCell>
                      <StyledTableCell align="center">عملیات</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drafts.map((row, index) => {
                      const lineTotal =
                        parseAmountInput(row.unitPrice) * parseQuantityInput(row.quantity);
                      return (
                        <StyledTableRow key={row.key}>
                          <StyledTableCell align="center" sx={{ width: 44 }}>
                            {index + 1}
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ minWidth: 140 }}>
                            <TextField
                              size="small"
                              placeholder="عنوان"
                              value={row.title}
                              onChange={(e) => updateDraft(row.key, { title: e.target.value })}
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
                              onChange={(e) =>
                                updateDraft(row.key, { unitPrice: formatAmountInput(e.target.value) })
                              }
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
                              fullWidth
                              sx={{
                                ...fieldSx,
                                "& .MuiInputBase-input": { ...fieldSx["& .MuiInputBase-input"], textAlign: "center" },
                              }}
                            />
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                            <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: 12 }}>
                              {formatAmountNumber(lineTotal) || "۰"}
                            </Typography>
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ width: 44 }}>
                            <IconButton
                              size="small"
                              onClick={() => setDrafts((prev) => prev.filter((item) => item.key !== row.key))}
                              sx={{ color: "#ff6b6b", p: 0.4 }}
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
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>مبلغ کل فاکتور</Typography>
                <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 13 }}>
                  {formatAmountNumber(invoiceAmount) || "۰"} تومان
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                  {drafts.length > 0 ? "مجموع ردیف‌ها" : "جمع ردیف‌ها"}
                </Typography>
                <Typography
                  sx={{
                    color: amountMismatch ? "#e6a23c" : "var(--admin-accent)",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {formatAmountNumber(itemsTotal) || "۰"} تومان
                </Typography>
              </Box>
              {amountMismatch ? (
                <Typography sx={{ color: "#e6a23c", fontSize: 12 }}>
                  مجموع ردیف‌ها با مبلغ کل فاکتور یکی نیست. برای ذخیره باید تأیید کنید تا مبلغ فاکتور به مجموع ردیف‌ها تغییر کند.
                </Typography>
              ) : null}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: "10px 16px" }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
          انصراف
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || saving}
          sx={{
            backgroundColor: "var(--admin-accent)",
            "&:hover": { backgroundColor: "var(--admin-accent-hover)" },
          }}
        >
          {saving ? "در حال ذخیره..." : "ذخیره جزئیات"}
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
          if (items) void saveItems(items);
        }}
        onCancel={() => !saving && setConfirmMismatchOpen(false)}
      />

      <DocumentPaymentSettleDialog
        open={settleOpen}
        kind="invoice"
        documentId={invoice?.id ?? null}
        remainingAmount={documentCreditRemaining(record || invoice)}
        onClose={() => setSettleOpen(false)}
        onSuccess={() => {
          setSettleOpen(false);
          onSaved();
        }}
      />
    </>
  );
}
