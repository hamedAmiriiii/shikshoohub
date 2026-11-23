"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Autocomplete,
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
  MenuItem,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { toast } from "react-toastify";
import { printPurchaseInvoice } from "@/app/admin/invoices/purchaseInvoicePrint";
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
import { beneficiaryFromRecord, beneficiaryPayload, formatBeneficiaryLabel } from "@/app/lib/beneficiaries";
import DocumentPaymentFields from "@/app/admin/DocumentPaymentFields";
import {
  buildDocumentPaymentPayload,
  documentCreditRemaining,
  emptyDocumentPaymentForm,
  formFromDocumentPayment,
  type DocumentPaymentFields,
  type DocumentPaymentFormState,
} from "@/app/lib/documentPayments";
import { DocumentPaymentBreakdownView, documentNeedsSettle } from "@/app/admin/DocumentPaymentBadge";
import DocumentPaymentSettleDialog from "@/app/admin/DocumentPaymentSettleDialog";

export type InvoiceItem = {
  id?: number;
  title?: string | null;
  unit_price?: number | string | null;
  quantity?: number | string | null;
  total?: number | string | null;
  vat_mode?: string | null;
  vat_percent?: number | string | null;
  vat_amount?: number | string | null;
  discount_amount?: number | string | null;
  unit_type?: string | null;
  stock_target?: "product" | "consumable" | "raw" | "normal" | string | null;
};

export type InvoiceRecord = DocumentPaymentFields & {
  id: number;
  /** شماره فاکتور داخل همان فروشگاه؛ از ۱ */
  number?: number | string | null;
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
  has_consumable_lots?: boolean;
  has_raw_material_lots?: boolean;
  stock_target?: "product" | "consumable" | "raw" | string | null;
  vat_mode?: string | null;
  vat_percent?: number | string | null;
  vat_amount?: number | string | null;
  discount_amount?: number | string | null;
  payable_amount?: number | string | null;
  amount_source?: "items" | "manual" | string;
};

type VatMode = "none" | "percent" | "amount";

type StockKind = "product" | "consumable" | "raw";

/** نوع هر قلم فاکتور — معمولی انبار نمی‌شود */
type ItemKind = "normal" | StockKind;

type QtyUnit = "piece" | "kg" | "liter";

const ITEM_KIND_OPTIONS: { value: ItemKind; label: string }[] = [
  { value: "normal", label: "فاکتور معمولی" },
  { value: "product", label: "کالای فروش" },
  { value: "consumable", label: "مواد مصرفی" },
  { value: "raw", label: "کالای اولیه" },
];

function asItemKind(value: unknown): ItemKind | "" {
  if (value === "normal" || value === "product" || value === "consumable" || value === "raw") return value;
  return "";
}

type NameOption = {
  id: number;
  name: string;
  stock?: number;
  unit?: QtyUnit;
  salePrice?: number | null;
  nextCost?: number | null;
};

/** فاکتور آیتم‌دار: مبلغ فقط از مجموع آیتم‌هاست و فیلد مبلغ کلی نباید فرستاده شود */
export function invoiceShopNumber(invoice?: { number?: number | string | null; id?: number | null } | null): number | null {
  const shopNumber = Number(invoice?.number);
  if (Number.isFinite(shopNumber) && shopNumber > 0) return shopNumber;
  const id = Number(invoice?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

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
  /** اگر پر باشد، نمایش/محاسبهٔ فی از روی مبلغ کل×مقدار */
  totalAmount: string;
  barcode: string;
  purchasePrice: string;
  salePrice: string;
  vatMode: VatMode;
  vatInput: string;
  discount: string;
  unitType: QtyUnit;
  stockKind: ItemKind | "";
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

function emptyDraft(defaultKind: ItemKind | "" = ""): DraftItem {
  return {
    key: newDraftKey(),
    title: "",
    unitPrice: "",
    quantity: "",
    totalAmount: "",
    barcode: "",
    purchasePrice: "",
    salePrice: "",
    vatMode: "none",
    vatInput: "",
    discount: "",
    unitType: defaultKind === "raw" ? "kg" : "piece",
    stockKind: defaultKind,
  };
}

/** فی واحد از روی مبلغ کل و مقدار (مثلاً ۲ میلیون ÷ ۰.۲۵ کیلو = ۸ میلیون) */
function unitPriceFromTotal(total: number, qty: number): string {
  if (total <= 0 || qty <= 0) return "";
  return formatAmountNumber(Math.round(total / qty));
}

function asQtyUnit(value: unknown, fallback: QtyUnit): QtyUnit {
  if (value === "kg" || value === "liter" || value === "piece") return value;
  return fallback;
}

function resolveInvoiceStockKind(invoice?: InvoiceRecord | null): StockKind | null {
  const target = invoice?.stock_target;
  if (target === "product" || target === "consumable" || target === "raw") return target;
  if (invoice?.has_consumable_lots) return "consumable";
  if (invoice?.has_raw_material_lots) return "raw";
  return null;
}

function resolveItemKind(
  item: InvoiceItem | null | undefined,
  invoice?: InvoiceRecord | null
): ItemKind {
  const own = asItemKind(item?.stock_target);
  if (own) return own;
  const inherited = resolveInvoiceStockKind(invoice);
  return inherited || "normal";
}

function asVatMode(value: unknown): VatMode {
  const mode = String(value || "none").toLowerCase();
  if (mode === "percent" || mode === "amount") return mode;
  return "none";
}

function lineBaseOf(row: DraftItem): number {
  return parseAmountInput(row.unitPrice) * parseQuantityInput(row.quantity);
}

function vatPerUnitOf(row: DraftItem): number {
  const unit = parseAmountInput(row.unitPrice);
  if (row.vatMode === "percent") {
    const percent = parseAmountInput(row.vatInput);
    if (percent <= 0 || unit <= 0) return 0;
    return Math.round((unit * percent) / 100);
  }
  if (row.vatMode === "amount") {
    return Math.max(0, Math.round(parseAmountInput(row.vatInput)));
  }
  return 0;
}

function lineVatOf(row: DraftItem): number {
  const qty = parseQuantityInput(row.quantity);
  if (qty <= 0) return 0;
  if (row.vatMode === "percent") {
    const base = lineBaseOf(row);
    const percent = parseAmountInput(row.vatInput);
    if (percent <= 0) return 0;
    return Math.round((base * percent) / 100);
  }
  return Math.round(vatPerUnitOf(row) * qty);
}

function lineGrossOf(row: DraftItem): number {
  return lineBaseOf(row) + lineVatOf(row);
}

function lineDiscountOf(row: DraftItem): number {
  const discount = Math.max(0, Math.round(parseAmountInput(row.discount)));
  return Math.min(discount, lineGrossOf(row));
}

function landedUnitOf(row: DraftItem): number {
  const qty = parseQuantityInput(row.quantity);
  if (qty <= 0) return 0;
  return Math.round(Math.max(0, lineGrossOf(row) - lineDiscountOf(row)) / qty);
}

/** ورودی تعداد — تا ۳ رقم اعشار (مثلاً ۰.۸۰۰ کیلو) */
function sanitizeQuantityDraftInput(value: string): string {
  const normalized = String(value ?? "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٫،,]/g, ".")
    .replace(/[^\d.]/g, "");
  const dot = normalized.indexOf(".");
  if (dot === -1) return normalized;
  const whole = normalized.slice(0, dot);
  const fraction = normalized.slice(dot + 1).replace(/\./g, "").slice(0, 3);
  return `${whole}.${fraction}`;
}

function parseQuantityInput(value: string): number {
  const cleaned = sanitizeQuantityDraftInput(value);
  if (!cleaned || cleaned === ".") return 0;
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
    const stockKind = resolveItemKind(item, invoice);
    const defaultUnit: QtyUnit = stockKind === "raw" ? "kg" : "piece";
    const unitPrice = toNumber(item.unit_price);
    const quantity = toNumber(item.quantity);
    const vatMode = asVatMode(item.vat_mode);
    const vatInput =
      vatMode === "percent"
        ? item.vat_percent != null
          ? String(item.vat_percent)
          : ""
        : vatMode === "amount" && toNumber(item.vat_amount) > 0
          ? formatAmountNumber(quantity > 0 ? toNumber(item.vat_amount) / quantity : toNumber(item.vat_amount))
          : "";
    return {
      key: String(item.id ?? newDraftKey()),
      title: String(item.title ?? ""),
      unitPrice: unitPrice > 0 ? formatAmountNumber(unitPrice) : "",
      quantity: quantity > 0 ? String(quantity) : "",
      totalAmount: "",
      barcode: "",
      purchasePrice: unitPrice > 0 ? formatAmountNumber(unitPrice) : "",
      salePrice: "",
      vatMode,
      vatInput,
      discount: toNumber(item.discount_amount) > 0 ? formatAmountNumber(toNumber(item.discount_amount)) : "",
      unitType: asQtyUnit(item.unit_type, defaultUnit),
      stockKind,
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

export type InvoiceCreateDraft = {
  title: string;
  description?: string;
  date?: string;
  invoice_date?: { year: number; month: number; day: number };
  beneficiary_id?: number | "";
  beneficiary_label?: string;
};

type Props = {
  open: boolean;
  invoice: InvoiceRecord | null;
  createDraft?: InvoiceCreateDraft | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function InvoiceDetailsDialog({
  open,
  invoice,
  createDraft = null,
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
  const [paymentForm, setPaymentForm] = useState<DocumentPaymentFormState>(emptyDocumentPaymentForm);
  const [nameOptions, setNameOptions] = useState<NameOption[]>([]);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);
  const nameSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const focusKeyRef = useRef<string | null>(null);
  /** نوع انتخاب‌شدهٔ اولین قلم → پیش‌فرض ردیف‌های بعدی */
  const [defaultItemKind, setDefaultItemKind] = useState<ItemKind | "">("");

  useEffect(() => {
    if (!open) return;
    if (!invoice) {
      if (!createDraft) return;
      setDrafts([emptyDraft("")]);
      setDefaultItemKind("");
      setOriginalHadItems(false);
      setInvoiceAmount(0);
      setRecord(null);
      setPaymentForm(emptyDocumentPaymentForm());
      setConfirmMismatchOpen(false);
      setLoading(false);
      return;
    }

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
      const rows = loadedItems.length > 0 ? loadedItems : [emptyDraft("")];
      setDrafts(rows);
      setDefaultItemKind(rows[0]?.stockKind || "");
      setOriginalHadItems(loadedItems.length > 0);
      setInvoiceAmount(toNumber(full.amount));
      setRecord(full);
      setPaymentForm(formFromDocumentPayment(full));
      setConfirmMismatchOpen(false);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, invoice, createDraft]);

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
    () => drafts.reduce((sum, row) => sum + lineBaseOf(row), 0),
    [drafts]
  );

  const vatTotal = useMemo(() => drafts.reduce((sum, row) => sum + lineVatOf(row), 0), [drafts]);

  const discountAmount = useMemo(
    () => drafts.reduce((sum, row) => sum + lineDiscountOf(row), 0),
    [drafts]
  );

  const payableAmount = Math.max(0, itemsTotal + vatTotal - discountAmount);

  const followsItemAmount = !invoice || invoiceUsesItemAmount(record || invoice);

  const updateDraft = (key: string, patch: Partial<DraftItem>) => {
    setDrafts((prev) => {
      const next = prev.map((row) => {
        if (row.key !== key) return row;
        const merged = { ...row, ...patch };
        if (patch.stockKind !== undefined) {
          if (patch.stockKind === "raw" && row.stockKind !== "raw") {
            merged.unitType = "kg";
          } else if (patch.stockKind === "product") {
            merged.unitType = "piece";
          }
        }
        return merged;
      });
      const firstKind = next[0]?.stockKind || "";
      if (firstKind) setDefaultItemKind(firstKind);
      else if (patch.stockKind) setDefaultItemKind((prevKind) => prevKind || patch.stockKind || "");
      return next;
    });
  };

  const addRow = (focus = true) => {
    const kind = defaultItemKind || drafts[0]?.stockKind || "";
    const draft = emptyDraft(kind);
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

  const searchNames = (query: string, kind: StockKind) => {
    if (nameSearchTimer.current) clearTimeout(nameSearchTimer.current);
    nameSearchTimer.current = setTimeout(async () => {
      const token = tokenCode();
      if (!token) return;
      setNameSearchLoading(true);
      try {
        const q = query.trim();
        const url =
          kind === "product"
            ? `/api/product?search=${encodeURIComponent(q)}&per_page=20`
            : kind === "raw"
              ? `/api/raw-materials?search=${encodeURIComponent(q)}&limit=20`
              : `/api/consumable-materials?search=${encodeURIComponent(q)}&limit=20`;
        const res = await FetchWithJwtClient("GET", url, token);
        if (!res || res.hasError) {
          setNameOptions([]);
          return;
        }
        const rows = (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []).filter(
          (row: any) => kind !== "product" || row?.item_type !== "produced_good"
        );
        setNameOptions(
          rows
            .map((row: any) => {
              const unit = row.unit_type === "kg" || row.unit_type === "liter" || row.unit_type === "piece"
                ? row.unit_type
                : undefined;
              const stock = row.stock != null ? Number(row.stock) : row.stock_kg != null ? Number(row.stock_kg) : row.quantity != null ? Number(row.quantity) : undefined;
              return {
                id: Number(row.id),
                name: String(row.name || ""),
                stock: Number.isFinite(stock) ? stock : undefined,
                unit,
                salePrice: row.sale_price != null ? Number(row.sale_price) : null,
                nextCost: row.next_unit_cost != null ? Number(row.next_unit_cost) : row.next_price_per_kg != null ? Number(row.next_price_per_kg) : null,
              };
            })
            .filter((row: NameOption) => row.id && row.name)
        );
      } finally {
        setNameSearchLoading(false);
      }
    }, 280);
  };

  const collectItems = () => {
    const items = drafts
      .map((row) => {
        const unitPrice = parseAmountInput(row.unitPrice);
        const quantity = parseQuantityInput(row.quantity);
        const base = Math.round(unitPrice * quantity);
        const vatAmount = lineVatOf(row);
        const enteredDiscount = Math.max(0, Math.round(parseAmountInput(row.discount)));
        const kind = asItemKind(row.stockKind);
        return {
          title: row.title.trim(),
          unit_price: unitPrice,
          quantity,
          vat_mode: row.vatMode,
          vat_percent: row.vatMode === "percent" ? parseAmountInput(row.vatInput) : null,
          vat_amount: vatAmount,
          discount_amount: enteredDiscount,
          unit_type: kind === "product" ? "piece" : row.unitType || (kind === "raw" ? "kg" : "piece"),
          sale_price: kind === "product" ? parseAmountInput(row.salePrice) : null,
          barcode: kind === "product" ? row.barcode.trim() : "",
          stock_target: kind === "normal" || !kind ? "" : kind,
          _kind: kind,
          _base: base,
          _gross: base + vatAmount,
        };
      })
      .filter((row) => row.title || row.unit_price > 0 || row.quantity > 0);

    for (const row of items) {
      if (!row._kind) {
        toast.error(`نوع «${row.title || "ردیف"}» را انتخاب کنید`);
        return null;
      }
      if (!row.title || row.unit_price <= 0 || row.quantity <= 0) {
        toast.error("هر ردیف باید عنوان، فی و تعداد معتبر داشته باشد");
        return null;
      }
      if (row._kind === "product" && (!row.sale_price || row.sale_price <= 0)) {
        toast.error(`قیمت فروش «${row.title}» را وارد کنید`);
        return null;
      }
      const needsWhole =
        row._kind === "product" ||
        ((row._kind === "consumable" || row._kind === "raw") && row.unit_type === "piece");
      if (needsWhole && !Number.isInteger(row.quantity)) {
        toast.error(`تعداد «${row.title}» باید عدد صحیح باشد`);
        return null;
      }
      if (row.vat_mode === "percent" && (row.vat_percent == null || row.vat_percent < 0 || row.vat_percent > 100)) {
        toast.error(`درصد ارزش افزوده «${row.title}» نامعتبر است`);
        return null;
      }
      if (row.discount_amount > row._gross) {
        toast.error(`تخفیف «${row.title}» از مبلغ همان ردیف بیشتر است`);
        return null;
      }
    }
    return items.map(({ _base, _gross, _kind, ...row }) => row);
  };

  const saveItems = async (
    items: {
      title: string;
      unit_price: number;
      quantity: number;
      vat_mode: VatMode;
      vat_percent: number | null;
      vat_amount: number;
      discount_amount: number;
      unit_type?: string;
      sale_price?: number | null;
      barcode?: string;
      stock_target?: string;
    }[]
  ) => {
    if (!invoice && !createDraft) return;
    const token = tokenCode();
    if (!token) {
      toast.error("لطفاً وارد شوید");
      return;
    }
    if (!invoice && items.length === 0) {
      toast.error("حداقل یک کالا وارد کنید");
      return;
    }

    const payment = buildDocumentPaymentPayload(paymentForm, payableAmount);
    if (payment.error || !payment.payload) {
      toast.error(payment.error || "نوع پرداخت را مشخص کنید");
      return;
    }

    try {
      setSaving(true);

      const payload: Record<string, unknown> = { ...payment.payload };
      if (items.length > 0 || originalHadItems) {
        payload.items = items;
      }

      const kinds = new Set(
        items
          .map((row) => row.stock_target)
          .filter((k): k is StockKind => k === "product" || k === "consumable" || k === "raw")
      );
      if (kinds.has("consumable")) payload.sync_consumables = true;
      if (kinds.has("raw")) payload.sync_raw_materials = true;
      if (kinds.has("product")) payload.sync_products = true;
      if (kinds.size === 1) payload.stock_target = [...kinds][0];

      const res = invoice
        ? await FetchWithJwtClient("PUT", `/api/invoices/${invoice.id}`, payload)
        : await FetchWithJwtClient("POST", "/api/invoices", {
            title: createDraft?.title,
            description: createDraft?.description || undefined,
            date: createDraft?.date,
            invoice_date: createDraft?.invoice_date,
            ...beneficiaryPayload(createDraft?.beneficiary_id),
            ...payload,
          });
      if (!res || res.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ذخیره جزئیات فاکتور"));
        return;
      }

      const savedLabel =
        kinds.size > 0
          ? "فاکتور ذخیره شد و موجودی انبار به‌روز شد"
          : invoice
            ? "جزئیات فاکتور ذخیره شد"
            : "فاکتور با جزئیات ثبت شد";
      toast.success(savedLabel);
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
    if (
      !followsItemAmount &&
      invoice &&
      items.length > 0 &&
      Math.round(itemsTotal) !== Math.round(invoiceAmount)
    ) {
      setConfirmMismatchOpen(true);
      return;
    }
    await saveItems(items);
  };

  const showProductFields = drafts.some((row) => row.stockKind === "product");
  const showUnit = drafts.some((row) => row.stockKind === "consumable" || row.stockKind === "raw");
  const sectionTitle = "اقلام فاکتور";
  const display = record || invoice;
  const beneficiary = beneficiaryFromRecord(display);
  const shopAccountName =
    display?.shop_account?.name ||
    (display?.shop_account_id != null ? `حساب #${display.shop_account_id}` : "");

  const handlePrintInvoice = () => {
    if (!display?.id) return;
    printPurchaseInvoice({
      invoice: display,
      items: drafts
        .filter((row) => row.title.trim())
        .map((row) => ({
          title: row.title.trim(),
          unit_price: parseAmountInput(row.unitPrice),
          quantity: parseQuantityInput(row.quantity),
          vat_amount: lineVatOf(row),
          discount_amount: lineDiscountOf(row),
          unit_type: row.unitType,
          total: Math.max(0, lineGrossOf(row) - lineDiscountOf(row)),
        })),
      shopAccountName: shopAccountName || undefined,
      itemsTotal,
      vatTotal,
      discountTotal: discountAmount,
      payableAmount,
    });
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={saving || confirmMismatchOpen ? undefined : onClose}
      maxWidth="lg"
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
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, minWidth: 0, flexShrink: 0 }}>
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
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: "var(--admin-text-muted)",
                  mt: 0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {display?.title || createDraft?.title || "بدون عنوان"}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" },
              gap: 1,
              flex: 1,
              minWidth: 0,
              px: { md: 1.5 },
            }}
          >
            <HeaderMetaItem
              label="طرف حساب / ذینفع"
              value={formatBeneficiaryLabel(beneficiary) || createDraft?.beneficiary_label || "—"}
            />
            <HeaderMetaItem label="حساب پرداخت" value={shopAccountName || "—"} />
            <HeaderMetaItem
              label="شماره فاکتور"
              value={
                invoiceShopNumber(display)
                  ? formatAmountNumber(invoiceShopNumber(display) as number)
                  : "—"
              }
            />
            <HeaderMetaItem label="عنوان سند" value={display?.title || createDraft?.title || "—"} />
          </Box>
          <Box sx={{ textAlign: "left", flexShrink: 0, display: "grid", gap: 0.75, justifyItems: "end" }}>
            <Box>
              <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>تاریخ</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--admin-text)" }}>
                {display?.date || createDraft?.date || "—"}
              </Typography>
            </Box>
            {display?.id ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
                disabled={loading || saving}
                onClick={handlePrintInvoice}
                sx={{
                  ...adminButtonStartIconSx,
                  color: "var(--admin-text)",
                  borderColor: "var(--admin-border)",
                  fontSize: 12,
                  fontWeight: 700,
                  minHeight: 30,
                }}
              >
                پرینت
              </Button>
            ) : null}
          </Box>
        </Box>

        {(display?.description || createDraft?.description) ? (
          <Box sx={{ mt: 1.15, pt: 1.1, borderTop: "1px solid var(--admin-border)" }}>
            <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", mb: 0.25 }}>توضیحات</Typography>
            <Typography sx={{ fontSize: 12.5, color: "var(--admin-text)", lineHeight: 1.7 }}>
              {display?.description || createDraft?.description}
            </Typography>
          </Box>
        ) : null}

        {display ? (
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
        ) : null}
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
                  flexWrap: "wrap",
                }}
              >
                <Typography sx={{ color: "var(--admin-text)", fontWeight: 800, fontSize: 13, minWidth: 0, flex: 1 }}>
                  {sectionTitle}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
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
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ boxShadow: "none", bgcolor: "transparent" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell align="center">ردیف</StyledTableCell>
                      <StyledTableCell align="center">نوع</StyledTableCell>
                      <StyledTableCell align="center">نام / شرح</StyledTableCell>
                      <StyledTableCell align="center">فی</StyledTableCell>
                      <StyledTableCell align="center">ارزش افزوده</StyledTableCell>
                      {showUnit ? <StyledTableCell align="center">واحد</StyledTableCell> : null}
                      <StyledTableCell align="center">{showUnit ? "مقدار" : "تعداد"}</StyledTableCell>
                      <StyledTableCell align="center">تخفیف</StyledTableCell>
                      {showProductFields ? (
                        <StyledTableCell align="center">بارکد</StyledTableCell>
                      ) : null}
                      {showProductFields ? (
                        <StyledTableCell align="center">قیمت فروش</StyledTableCell>
                      ) : null}
                      <StyledTableCell align="center">قیمت تمام‌شده</StyledTableCell>
                      <StyledTableCell align="center" title="مقدار و مبلغ کل را بزنید تا فی خودکار پر شود">
                        مبلغ کل
                      </StyledTableCell>
                      <StyledTableCell align="center">حذف</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drafts.map((row, index) => {
                      const lineTotal = Math.max(0, lineGrossOf(row) - lineDiscountOf(row));
                      const landed = landedUnitOf(row);
                      const share = lineDiscountOf(row);
                      const rowKind = asItemKind(row.stockKind);
                      const rowUsesStock = rowKind === "product" || rowKind === "consumable" || rowKind === "raw";
                      const rowShowUnit = rowKind === "consumable" || rowKind === "raw";
                      const rowShowProduct = rowKind === "product";
                      return (
                        <StyledTableRow key={row.key}>
                          <StyledTableCell align="center" sx={{ width: 48, fontWeight: 700 }}>
                            {formatAmountNumber(index + 1)}
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ minWidth: 130 }}>
                            <TextField
                              select
                              size="small"
                              value={row.stockKind || ""}
                              onChange={(e) =>
                                updateDraft(row.key, { stockKind: asItemKind(e.target.value) || "" })
                              }
                              fullWidth
                              sx={fieldSx}
                            >
                              <MenuItem value="" disabled>
                                انتخاب نوع
                              </MenuItem>
                              {ITEM_KIND_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ minWidth: 160 }}>
                            {rowUsesStock ? (
                              <Autocomplete
                                freeSolo
                                options={nameOptions}
                                loading={nameSearchLoading}
                                filterOptions={(x) => x}
                                isOptionEqualToValue={(option, value) =>
                                  typeof value === "string"
                                    ? option.name === value
                                    : option.id === value.id
                                }
                                getOptionLabel={(option) =>
                                  typeof option === "string" ? option : option.name
                                }
                                inputValue={row.title}
                                value={row.title}
                                onInputChange={(_, value, reason) => {
                                  updateDraft(row.key, { title: value });
                                  if ((reason === "input" || reason === "clear") && rowKind !== "normal" && rowKind) {
                                    searchNames(value, rowKind);
                                  }
                                }}
                                onChange={(_, value) => {
                                  if (typeof value === "string") {
                                    updateDraft(row.key, { title: value });
                                    return;
                                  }
                                  if (value) {
                                    updateDraft(row.key, {
                                      title: value.name,
                                      unitType: value.unit || row.unitType,
                                      salePrice:
                                        rowKind === "product" && value.salePrice
                                          ? formatAmountNumber(value.salePrice)
                                          : row.salePrice,
                                    });
                                  }
                                }}
                                onOpen={() => {
                                  if (nameOptions.length === 0 && rowKind !== "normal" && rowKind) {
                                    searchNames(row.title, rowKind);
                                  }
                                }}
                                renderOption={(props, option) => (
                                  <li {...props} key={option.id}>
                                    <Box sx={{ display: "flex", flexDirection: "column", py: 0.25 }}>
                                      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{option.name}</Typography>
                                      <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                                        موجودی {formatAmountNumber(option.stock ?? 0)}
                                        {option.nextCost != null
                                          ? ` · فی ${formatAmountNumber(option.nextCost)}`
                                          : ""}
                                      </Typography>
                                    </Box>
                                  </li>
                                )}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    size="small"
                                    placeholder="نام کالا"
                                    onKeyDown={handleFieldEnter}
                                    inputRef={(el) => {
                                      titleInputRefs.current[row.key] = el;
                                    }}
                                    sx={fieldSx}
                                  />
                                )}
                              />
                            ) : (
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
                            )}
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ width: 120 }}>
                            <TextField
                              size="small"
                              placeholder="فی"
                              type="text"
                              inputMode="numeric"
                              value={row.unitPrice}
                              onChange={(e) =>
                                updateDraft(row.key, {
                                  unitPrice: formatAmountInput(e.target.value),
                                  totalAmount: "",
                                })
                              }
                              onKeyDown={handleFieldEnter}
                              fullWidth
                              sx={{
                                ...fieldSx,
                                "& .MuiInputBase-input": { ...fieldSx["& .MuiInputBase-input"], textAlign: "center" },
                              }}
                            />
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ minWidth: 168 }}>
                            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                              <TextField
                                select
                                size="small"
                                value={row.vatMode}
                                onChange={(e) =>
                                  updateDraft(row.key, { vatMode: e.target.value as VatMode, vatInput: "" })
                                }
                                SelectProps={{ native: true }}
                                sx={{ ...fieldSx, width: 74, flexShrink: 0 }}
                              >
                                <option value="none">بدون</option>
                                <option value="percent">٪</option>
                                <option value="amount">مبلغ</option>
                              </TextField>
                              {row.vatMode !== "none" ? (
                                <TextField
                                  size="small"
                                  placeholder={row.vatMode === "percent" ? "درصد" : "هر واحد"}
                                  value={row.vatInput}
                                  onChange={(e) =>
                                    updateDraft(row.key, {
                                      vatInput:
                                        row.vatMode === "amount"
                                          ? formatAmountInput(e.target.value)
                                          : e.target.value.replace(/[^\d.]/g, ""),
                                    })
                                  }
                                  onKeyDown={handleFieldEnter}
                                  sx={{ ...fieldSx, flex: 1, minWidth: 72 }}
                                />
                              ) : null}
                            </Box>
                          </StyledTableCell>
                          {showUnit ? (
                            <StyledTableCell align="center" sx={{ width: 96 }}>
                              {rowShowUnit ? (
                                <TextField
                                  select
                                  size="small"
                                  value={row.unitType}
                                  onChange={(e) => updateDraft(row.key, { unitType: asQtyUnit(e.target.value, "piece") })}
                                  fullWidth
                                  sx={fieldSx}
                                >
                                  <MenuItem value="piece">عدد</MenuItem>
                                  <MenuItem value="kg">کیلو</MenuItem>
                                  <MenuItem value="liter">لیتر</MenuItem>
                                </TextField>
                              ) : (
                                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>—</Typography>
                              )}
                            </StyledTableCell>
                          ) : null}
                          <StyledTableCell align="center" sx={{ width: 88 }}>
                            <TextField
                              size="small"
                              placeholder={
                                row.unitType === "kg"
                                  ? "کیلو (۰.۲۵=۲۵۰گ)"
                                  : row.unitType === "liter"
                                    ? "لیتر"
                                    : "تعداد"
                              }
                              type="text"
                              inputMode="decimal"
                              value={row.quantity}
                              onChange={(e) => {
                                const quantity = sanitizeQuantityDraftInput(e.target.value);
                                const qty = parseQuantityInput(quantity);
                                const total = parseAmountInput(row.totalAmount);
                                if (row.totalAmount && qty > 0 && total > 0) {
                                  updateDraft(row.key, {
                                    quantity,
                                    unitPrice: unitPriceFromTotal(total, qty),
                                  });
                                  return;
                                }
                                updateDraft(row.key, { quantity });
                              }}
                              onKeyDown={handleFieldEnter}
                              fullWidth
                              sx={{
                                ...fieldSx,
                                "& .MuiInputBase-input": { ...fieldSx["& .MuiInputBase-input"], textAlign: "center" },
                              }}
                            />
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ width: 110 }}>
                            <TextField
                              size="small"
                              placeholder="تخفیف"
                              value={row.discount}
                              onChange={(e) => updateDraft(row.key, { discount: formatAmountInput(e.target.value) })}
                              onKeyDown={handleFieldEnter}
                              fullWidth
                              sx={{
                                ...fieldSx,
                                "& .MuiInputBase-input": { ...fieldSx["& .MuiInputBase-input"], textAlign: "center" },
                              }}
                              inputProps={{ inputMode: "numeric" }}
                            />
                          </StyledTableCell>
                          {showProductFields ? (
                            <StyledTableCell align="center" sx={{ width: 120 }}>
                              {rowShowProduct ? (
                                <>
                                  <TextField
                                    size="small"
                                    placeholder="بارکد (اختیاری)"
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
                                </>
                              ) : (
                                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>—</Typography>
                              )}
                            </StyledTableCell>
                          ) : null}
                          {showProductFields ? (
                            <StyledTableCell align="center" sx={{ width: 120 }}>
                              {rowShowProduct ? (
                                <TextField
                                  size="small"
                                  placeholder="قیمت فروش"
                                  type="text"
                                  inputMode="numeric"
                                  value={row.salePrice}
                                  onChange={(e) =>
                                    updateDraft(row.key, { salePrice: formatAmountInput(e.target.value) })
                                  }
                                  onKeyDown={handleFieldEnter}
                                  fullWidth
                                  sx={{
                                    ...fieldSx,
                                    "& .MuiInputBase-input": { ...fieldSx["& .MuiInputBase-input"], textAlign: "center" },
                                  }}
                                />
                              ) : (
                                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>—</Typography>
                              )}
                            </StyledTableCell>
                          ) : null}
                          <StyledTableCell align="center" sx={{ whiteSpace: "nowrap", minWidth: 110 }}>
                            <Typography sx={{ color: "var(--admin-text)", fontWeight: 800, fontSize: 13 }}>
                              {formatAmountNumber(landed) || "۰"}
                            </Typography>
                            {share > 0 ? (
                              <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", mt: 0.25 }}>
                                بعد از تخفیف {formatAmountNumber(share)}
                              </Typography>
                            ) : null}
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ minWidth: 120 }}>
                            <TextField
                              size="small"
                              placeholder="مبلغ کل"
                              type="text"
                              inputMode="numeric"
                              value={
                                row.totalAmount !== ""
                                  ? row.totalAmount
                                  : formatAmountNumber(Math.round(lineBaseOf(row))) || ""
                              }
                              onChange={(e) => {
                                const totalAmount = formatAmountInput(e.target.value);
                                const total = parseAmountInput(totalAmount);
                                const qty = parseQuantityInput(row.quantity);
                                if (qty > 0 && total > 0) {
                                  updateDraft(row.key, {
                                    totalAmount,
                                    unitPrice: unitPriceFromTotal(total, qty),
                                  });
                                  return;
                                }
                                updateDraft(row.key, { totalAmount });
                              }}
                              onKeyDown={handleFieldEnter}
                              fullWidth
                              sx={{
                                ...fieldSx,
                                "& .MuiInputBase-input": {
                                  ...fieldSx["& .MuiInputBase-input"],
                                  textAlign: "center",
                                  color: "var(--admin-accent)",
                                  fontWeight: 800,
                                },
                              }}
                            />
                            {lineDiscountOf(row) > 0 || lineVatOf(row) > 0 ? (
                              <Typography sx={{ fontSize: 10.5, color: "var(--admin-text-muted)", mt: 0.25 }}>
                                خالص {formatAmountNumber(lineTotal) || "۰"}
                              </Typography>
                            ) : null}
                          </StyledTableCell>
                          <StyledTableCell align="center" sx={{ width: 48 }}>
                            <IconButton
                              size="small"
                              onClick={() =>
                                setDrafts((prev) => {
                                  const next = prev.filter((item) => item.key !== row.key);
                                  if (next.length > 0) {
                                    setDefaultItemKind(next[0]?.stockKind || "");
                                    return next;
                                  }
                                  setDefaultItemKind("");
                                  return [emptyDraft("")];
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
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1,
                  px: 1.15,
                  py: 0.65,
                  borderTop: "1px solid var(--admin-border)",
                  bgcolor: "var(--admin-surface-alt)",
                }}
              >
                <Box sx={{ flex: "1 1 280px", minWidth: 0 }}>
                  <DocumentPaymentFields
                    compact
                    value={paymentForm}
                    onChange={setPaymentForm}
                    totalAmount={payableAmount}
                    disabled={saving}
                  />
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
                  {(
                    [
                      ["جمع اقلام", itemsTotal, "accent"],
                      ["ارزش افزوده", vatTotal, "plain"],
                      ["تخفیف", discountAmount, "plain"],
                      ["قابل پرداخت", payableAmount, "payable"],
                    ] as const
                  ).map(([label, value, tone]) => (
                    <Box
                      key={label}
                      sx={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 0.6,
                        px: 0.85,
                        py: 0.35,
                        borderRadius: 1.25,
                        border: tone === "payable" ? "1px solid rgba(212, 160, 23, 0.55)" : "1px solid var(--admin-border)",
                        bgcolor: tone === "payable" ? "rgba(212, 160, 23, 0.12)" : "var(--admin-surface)",
                      }}
                    >
                      <Typography
                        sx={{
                          color: tone === "payable" ? "#c49212" : "var(--admin-text-muted)",
                          fontSize: 11,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        sx={{
                          color: tone === "payable" ? "#e0ac1c" : tone === "accent" ? "var(--admin-accent)" : "var(--admin-text)",
                          fontWeight: tone === "plain" ? 700 : 800,
                          fontSize: 13,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatAmountNumber(value) || "۰"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.25, py: 1.35, borderTop: "1px solid var(--admin-border)", gap: 1 }}>
        {display?.id ? (
          <Button
            onClick={handlePrintInvoice}
            disabled={loading || saving}
            startIcon={<PrintIcon />}
            sx={{ ...adminButtonStartIconSx, color: "var(--admin-text)", mr: "auto" }}
          >
            پرینت فاکتور
          </Button>
        ) : null}
        <Button onClick={onClose} disabled={saving} sx={{ color: "var(--admin-text-muted)" }}>
          انصراف
        </Button>
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
          {saving
            ? "در حال ذخیره..."
            : drafts.some((row) => row.stockKind === "product" || row.stockKind === "consumable" || row.stockKind === "raw")
              ? "ذخیره و ثبت در انبار"
              : "ذخیره فاکتور"}
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
